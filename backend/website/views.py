from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from .models import File_data, User_profile, User_Project, Project, Invitation, File_version, Last_download
from . import db
from werkzeug.security import generate_password_hash, check_password_hash

from flask import current_app
from flask import send_from_directory
import os
from werkzeug.utils import secure_filename

from sqlalchemy import text, func
from sqlalchemy.orm import aliased
from sqlalchemy.sql import exists 

import datetime
import uuid 
import zipfile
import re

views = Blueprint('views', __name__)
projects_bp = Blueprint('projects', __name__)

# Members
@views.route('/api/projects/<project_id>/members', methods=['GET'])
@login_required
def members(project_id):
    user_projects = User_Project.query.filter_by(project_id=project_id).all()

    project_roles = []
    for user_project in user_projects:
        user = User_profile.query.get(user_project.user_id)  # Fetch user details
        project_roles.append({
            "id": user.user_id,
            "name": user.full_name,
            "role": user_project.role,
            "email": user.email
        })

    return jsonify({"user_id": current_user.user_id, "members": project_roles})
# Members end

# Invitations
@views.route('/invitations', methods=['GET'])
@login_required
def invitations():
    filter_status = request.args.getlist('status')
    if not filter_status:
        filter_status = ['pending']

    user_invitations = Invitation.query.filter(
        ((Invitation.invited_user_id == current_user.user_id) | 
         (Invitation.invited_email == current_user.email))
    ).filter(Invitation.status.in_(filter_status)).order_by(Invitation.invite_date.desc()).all()

    invitations_data = [{
        "project_name": inv.project.name,
        "id": inv.invitation_id,
        "project_id": inv.project_id,
        "status": inv.status,
        "invite_date": inv.invite_date.strftime('%Y-%m-%d')
    } for inv in user_invitations]
    
    return jsonify({"invitations": invitations_data})

@views.route('/accept_invite/<int:invitation_id>', methods=['POST'])
@login_required
def accept_invite(invitation_id):
    invitation = Invitation.query.get(invitation_id)
    if not invitation or (invitation.invited_user_id and invitation.invited_user_id != current_user.user_id) \
        or (invitation.invited_email and invitation.invited_email != current_user.email):
        return jsonify({"error": "Invalid invitation."}), 400

    existing_membership = User_Project.query.filter_by(user_id=current_user.user_id, project_id=invitation.project_id).first()
    if existing_membership:
        return jsonify({"error": "You are already a member of this project."}), 400
    else:
        new_member = User_Project(user_id=current_user.user_id, project_id=invitation.project_id, role='reader')
        db.session.add(new_member)
        invitation.status = 'accepted'
        db.session.commit()

    return jsonify({"message": "Invitation accepted."})

@views.route('/deny_invite/<int:invitation_id>', methods=['POST'])
@login_required
def deny_invite(invitation_id):
    invitation = Invitation.query.get(invitation_id)
    if not invitation or (invitation.invited_user_id and invitation.invited_user_id != current_user.user_id) \
        or (invitation.invited_email and invitation.invited_email != current_user.email):
        return jsonify({"error": "Invalid invitation."}), 400

    invitation.status = 'declined'
    db.session.commit()

    return jsonify({"message": "Invitation denied."})
# Invitations end


# Download
ALLOWED_EXTENSIONS = {'txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif', 'zip', 'rar', 'tar', 'gz', '7z', 'docx', 'xlsx', 'pptx'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@views.route('/download/<filename>')
@login_required
def download_file(filename):
    file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
    if os.path.exists(file_path):
        return send_from_directory(current_app.config['UPLOAD_FOLDER'], filename, as_attachment=True)
    else:
        return jsonify({"error": "File not found."}), 404
    
@projects_bp.route("/api/projects/download", methods=["POST"])
@login_required
def download_files():
    data = request.get_json()
    selected_files = data.get("selected_files", [])

    if not selected_files:
        return jsonify({"error": "No files selected for download"}), 400

    try:
        # Collect file paths for the selected files
        file_paths = []
        for file_id in selected_files:
            if not str(file_id).isdigit():
                return jsonify({"error": f"Invalid file ID: {file_id}"}), 400

            file_version = File_version.query.get(int(file_id))
            if not file_version:
                return jsonify({"error": f"File version with ID {file_id} not found"}), 404

            file_data = File_data.query.get(file_version.file_data_id)
            if not file_data:
                return jsonify({"error": f"File data for version ID {file_id} not found"}), 404

            project_folder = os.path.join(current_app.config['UPLOAD_FOLDER'], str(file_data.project_id))
            file_folder = os.path.join(project_folder, str(file_data.file_data_id))
            file_path = os.path.join(file_folder, file_version.file_name)

            if not os.path.exists(file_path):
                return jsonify({"error": f"File {file_version.file_name} not found on server"}), 404

            file_paths.append(file_path)

            last_download = Last_download.query.filter_by(
                file_data_id=file_data.file_data_id,
                user_id=current_user.user_id,
            ).first()

            if last_download:
                last_download.version_id = file_version.version_id
                last_download.download_date = func.now()
            else:
                last_download = Last_download(
                    file_data_id=file_data.file_data_id,
                    version_id=file_version.version_id,
                    user_id=current_user.user_id,
                    download_date=func.now()
                )
                db.session.add(last_download)

            db.session.commit()

            # Construct the file path
            file_data = File_data.query.get(file_version.file_data_id)
            project_folder = os.path.join(current_app.config['UPLOAD_FOLDER'], str(file_data.project_id))
            file_folder = os.path.join(project_folder, str(file_data.file_data_id))
            file_path = os.path.join(file_folder, file_version.file_name)

            if not os.path.exists(file_path):
                return jsonify({"error": f"File {file_version.file_name} not found on server"}), 404

        # Create a ZIP archive of the selected files
        zip_filename = "selected_files.zip"
        zip_path = os.path.join(current_app.config['UPLOAD_FOLDER'], zip_filename)
        with zipfile.ZipFile(zip_path, "w") as zipf:
            for file_path in file_paths:
                zipf.write(file_path, os.path.basename(file_path))

        # Send the ZIP file to the user
        return send_from_directory(current_app.config['UPLOAD_FOLDER'], zip_filename, as_attachment=True)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
# Download end

# Projects start 
@views.route('/projects', methods=['POST', 'GET'])
@login_required
def projects():
    creator_alias = aliased(User_profile)
    projects = db.session.query(Project, User_profile, creator_alias).\
        select_from(User_profile).\
        join(User_Project, User_Project.user_id == User_profile.user_id).\
        join(Project, Project.project_id == User_Project.project_id).\
        join(creator_alias, creator_alias.user_id == Project.creator_id).\
        filter(User_Project.user_id == current_user.user_id).\
        all()
    
    projects_data = [{
        "project_id": proj.Project.project_id,
        "name": proj.Project.name,
        "creator": proj.creator_alias.full_name,
    } for proj in projects]

    files = os.listdir(current_app.config['UPLOAD_FOLDER'])

    return jsonify({"projects": projects_data}, files=files)

@views.route('/api/projects', methods=['GET'])
@login_required
def get_projects():
    user_projects = User_Project.query.filter_by(user_id=current_user.user_id).all()

    projects_data = []
    for user_project in user_projects:
        project = Project.query.get(user_project.project_id)

        last_version = db.session.query(File_version).join(File_data).filter(
            File_data.project_id == project.project_id
        ).order_by(File_version.upload_date.desc()).first()

        if last_version and last_version.upload_date:
            last_modified = last_version.upload_date.strftime('%Y-%m-%d')
        else:
            last_modified = None

        projects_data.append({
            "id": project.project_id,
            "name": project.name,
            "role": user_project.role,
            "lastModified": last_modified,
            "date": project.created_date.strftime('%Y-%m-%d') if project.created_date else None,
            "ownerName": User_profile.query.get(project.creator_id).full_name if project.creator_id else "Unknown",
            "ownerAvatar": f"/static/profile_pics/{User_profile.query.get(project.creator_id).profile_pic}" if project.creator_id else "/static/profile_pics/default.png",
            "status": "success"
        })

    return jsonify(projects_data)
# Projects end

# Create project
@projects_bp.route("/api/projects", methods=["POST"])
def create_project():
    data = request.get_json()
    name = data.get("name")
    description = data.get("description")

    if not name:
        return jsonify({"error": "Project name is required"}), 400

    project = Project(name=name, description=description)
    db.session.add(project)
    db.session.commit()

    return jsonify({
        "message": "Project created",
        "project": {
            "id": project.project_id,
            "name": project.name,
            "description": project.description,
            "created_at": project.created_date.isoformat()
        }
    }), 201
# Create project end

#project_page
@views.route('/project/<int:project_id>', methods=['GET'])
@login_required
def project_page(project_id):
    try:
        project = Project.query.get(project_id)
        if not project:
            return jsonify({"error": "Project not found"}), 404

        user_id = current_user.user_id

        # Fetch all latest versions
        latest_versions = File_version.query.\
            join(File_data, File_version.file_data_id == File_data.file_data_id).\
            filter(File_data.project_id == project_id, File_version.last_version == True).\
            all()

        # Get version IDs user has downloaded
        downloaded_versions = db.session.query(Last_download.version_id).\
            filter_by(user_id=user_id).distinct().all()
        downloaded_version_ids = {vid for (vid,) in downloaded_versions}

        # Prepare file list
        files_data = []
        download_flags = {}

        for file in latest_versions:
            downloaded = (file.user_id == user_id) or (file.version_id in downloaded_version_ids)
            files_data.append({
                "version_id": file.version_id,
                "file_data_id": file.file_data_id,
                "title": file.file_data.title,
                "file_name": file.file_name,
                "version_number": file.version_number,
                "file_size": file.file_size,
                "file_type": file.file_type,
                "upload_date": file.upload_date.isoformat() if file.upload_date else None,
                "description": file.file_data.description,
                "comment": file.comment
            })
            download_flags[file.version_id] = downloaded

        project_data = {
            "id": project.project_id,
            "name": project.name,
            "description": project.description,
            "created_date": project.created_date.isoformat() if project.created_date else None,
            "creator": User_profile.query.get(project.creator_id).full_name if project.creator_id else "Unknown"
        }

        return jsonify({
            "project": project_data,
            "files": files_data,
            "download_file_results": download_flags
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500
#project_page end yey

# Upload file + create version
@projects_bp.route("/api/projects/<int:project_id>/upload", methods=["POST"])
@login_required
def upload_file(project_id):
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "Empty filename"}), 400

    # Get the user's role in the specific project
    user_project = User_Project.query.filter_by(
        user_id=current_user.user_id,
        project_id=project_id
    ).first()

    if not user_project:
        return jsonify({"error": "You are not a member of this project"}), 403

    if user_project.role == "reader":
        return jsonify({"error": "You don't have permission to upload files"}), 403

    # Check file size (1GB max)
    max_size = 1 * 1024 * 1024 * 1024  # 1GB in bytes
    file.seek(0, os.SEEK_END)
    size = file.tell()
    file.seek(0)

    if size > max_size:
        return jsonify({"error": "File size exceeds the 1GB limit"}), 400

    project = Project.query.get_or_404(project_id)

    try:
        # Form fields
        description = request.form.get("description", "")
        title = request.form.get("title", "")[:100]
        main_file_id_raw = request.form.get("main_file_id")
        comment = request.form.get("comment", "")[:100]
        main_file_id = int(main_file_id_raw) if main_file_id_raw and main_file_id_raw.isdigit() else None
        

        if main_file_id:
            # Version upload: Link to existing main file
            file_data = File_data.query.get(main_file_id)
            if not file_data:
                return jsonify({"error": "Main file not found"}), 404
        else:
            # New file upload
            if len(title) < 4:
                return jsonify({"error": "Title must be greater than 3 characters."}), 400

            # Create a new File_data entry (if necessary)
            file_data = File_data(
                project_id=project.project_id,
                description=description,
                title=title
            )
            db.session.add(file_data)
            db.session.commit()

        # Use the same folder for versioning (existing folder for the file)
        folder_name = str(file_data.file_data_id)
        upload_folder = os.path.join(current_app.config['UPLOAD_FOLDER'], str(project.project_id), folder_name)
        
        # Check if the folder already exists, if not, create it
        if os.path.exists(upload_folder):
            print(f"Folder already exists: {upload_folder}")
        else:
            print(f"Folder does not exist. Creating: {upload_folder}")
            os.makedirs(upload_folder, exist_ok=True)

        print(f"Uploading file to: {upload_folder}")

        # Extract filename and extension
        filename = secure_filename(file.filename)
        name, ext = os.path.splitext(filename)

        # Determine the next version number
        latest_version = db.session.query(func.max(File_version.version_number)).filter(
            File_version.file_data_id == file_data.file_data_id
        ).scalar()
        version_number = (latest_version or 0) + 1

        # Strip trailing _v<number> from the filename if it exists
        version_pattern = re.compile(r'(.*)_v\d+$')
        match = version_pattern.match(name)
        if match:
            name = match.group(1)

        # Construct the new filename
        new_filename = f"{name}_v{version_number}{ext}"

        # Mark old versions as not the latest
        File_version.query.filter_by(file_data_id=file_data.file_data_id, last_version=True).update({
            "last_version": False
        })
        db.session.commit()

        # Save the file with the new versioned name in the existing folder
        file_path = os.path.join(upload_folder, new_filename)
        file.save(file_path)

        # Create a new File_version entry
        version = File_version(
            version_number=version_number,
            file_name=new_filename,
            file_type=file.mimetype,
            file_size=os.path.getsize(file_path),
            last_version=True,
            comment=comment,
            file_data_id=file_data.file_data_id,
            user_id=current_user.user_id
        )
        db.session.add(version)
        db.session.commit()

        # Return the list of versions (for dropdown or history list)
        file_versions = File_version.query.filter_by(file_data_id=file_data.file_data_id).order_by(File_version.version_number.desc()).all()
        version_history = [{
            "version_number": v.version_number,
            "file_name": v.file_name,
            "file_size": v.file_size,
            "comment": v.comment
        } for v in file_versions]

        file_data_info = {
            "file_data_id": file_data.file_data_id,
            "title": file_data.title,
            "description": file_data.description,
            "project_id": file_data.project_id
        }

        return jsonify({
            "message": "File uploaded successfully",
            "file_data": file_data_info,
            "version_history": version_history  # Provide version history to the frontend
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
# Upload file + create version end

# Dropdown/history
@projects_bp.route("/api/files/<int:file_data_id>/versions", methods=["GET"])
@login_required
def get_file_versions(file_data_id):
    try:
        file_data = File_data.query.get(file_data_id)
        if not file_data:
            return jsonify({"error": "File not found"}), 404

        # Optional: Check if user has access to the file/project
        project = Project.query.get(file_data.project_id)
        user_project = User_Project.query.filter_by(
            user_id=current_user.user_id,
            project_id=project.project_id
        ).first()

        if not user_project:
            return jsonify({"error": "Access denied"}), 403

        # Load versions
        versions = File_version.query.filter_by(file_data_id=file_data_id)\
            .order_by(File_version.version_number.desc()).all()

        version_history = [{
            "version_id": v.version_id,
            "version_number": v.version_number,
            "file_name": v.file_name,
            "file_size": v.file_size,
            "file_type": v.file_type,
            "upload_date": v.upload_date.isoformat() if v.upload_date else None,
            "comment": v.comment,
            "uploader": User_profile.query.get(v.user_id).email  # Or full name if you have it
        } for v in versions]

        return jsonify({
            "file_data_id": file_data_id,
            "title": file_data.title,
            "version_history": version_history
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
#dropdown/history end

# upload start might not need anyomre
@views.route('/upload', methods=['POST'])
@login_required
def upload_file():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files['file']
    print("Received file:", file.filename)

    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)
        print("Saved to:", file_path)
        return jsonify({"message": "File uploaded successfully!", "file_name": filename})
    else:
        print("Rejected file extension:", file.filename)
        return jsonify({"error": "Invalid file type!"}), 400
#upload end


# Get all versions for a project
@projects_bp.route("/api/projects/<int:project_id>/versions", methods=["GET"])
def get_project_versions(project_id):
    project = Project.query.get_or_404(project_id)
    file_data = File_data.query.filter_by(project_id=project.project_id).all()

    if not file_data:
        return jsonify({"error": "No files for this project"}), 404

    versions = []
    for f in file_data:
        file_versions = File_version.query.filter_by(file_data_id=f.file_data_id).all()
        for v in file_versions:
            versions.append({
                "version_id": v.version_id,
                "filename": v.file_name,
                "timestamp": v.upload_date.isoformat(),
                "file_size": v.file_size,
                "description": f.description
            })

    return jsonify(versions)

#project end


# Settings
@views.route('/api/user', methods=['GET'])
@login_required
def get_user():
    user = current_user
    user_data = {
        'email': user.email,
        'full_name': user.full_name,
        'nickname': user.nickname,
        'mobile': user.mobile,
        'job': user.job,
        'profile_pic': user.profile_pic
    }
    return jsonify(user_data)

@views.route('/api/profile_pics', methods=['GET'])
@login_required
def get_profile_pics():
    profile_pics_folder = os.path.join(current_app.static_folder, 'profile_pics')
    profile_pics = [f for f in os.listdir(profile_pics_folder) if f.endswith(('.png', '.jpg', '.jpeg'))]

    if "default.png" not in profile_pics:
        profile_pics.append("default.png")
    return jsonify(profile_pics)

@views.route('/api/user/update', methods=['POST'])
@login_required
def update_user():
    data = request.get_json()
    user = current_user

    email = data.get('email')
    full_name = data.get('fullName')
    current_password = data.get('currentPassword')
    password1 = data.get('password1')
    password2 = data.get('password2')
    nickname = data.get('nickname')
    mobile = data.get('mobile')
    job = data.get('job')
    selected_pic = data.get('profilePic')

    if email and email != user.email:
        if len(email) < 4:
            return jsonify({"error": "Email must be greater than 3 characters."}), 400
        elif User_profile.query.filter_by(email=email).first():
            return jsonify({"error": "Email already exists."}), 400

    if full_name and full_name != user.full_name:
        if len(full_name) < 2:
            return jsonify({"error": "Full name must be greater than 1 character."}), 400

    if password1 or password2:
        if password1 or password2:
            if not current_password:
                return jsonify({"error": "Current password is required."}), 400
            if not check_password_hash(user.password, current_password):
                return jsonify({"error": "Current password is incorrect."}), 400
        if password1 != password2:
            return jsonify({"error": "Passwords don't match."}), 400
        elif len(password1) < 7:
            return jsonify({"error": "Password must be at least 7 characters."}), 400
        elif password1 and check_password_hash(user.password, password1):
            return jsonify({"error": "Password can't be the old one."}), 400

    if email and email != user.email:
        user.email = email
    if full_name and full_name != user.full_name:
        user.full_name = full_name
    if nickname and nickname != user.nickname:
        user.nickname = nickname
    if mobile and mobile != user.mobile:
        user.mobile = mobile
    if job and job != user.job:
        user.job = job
    if selected_pic:
        profile_pics_folder = os.path.join(current_app.static_folder, 'profile_pics')
        profile_pics = [f for f in os.listdir(profile_pics_folder) if f.endswith(('.png', '.jpg', '.jpeg'))]
        if selected_pic in profile_pics:
            user.profile_pic = selected_pic

    if password1:
        user.password = generate_password_hash(password1, method='pbkdf2:sha256')

    db.session.commit()
    return jsonify({"message": "Your changes have been saved!"})



# Create new project
@views.route('/create-project', methods=['POST'])
@login_required
def create_project():
    data = request.get_json()
    project_name = data.get('projectName')
    description = data.get('description')
    invited_users = data.get('inviteUsers')
    invited_emails = data.get('inviteEmail')

    if not project_name or not description:
        return jsonify({"error": "Project name and description are required."}), 400

    new_project = Project(
        name=project_name,
        description=description,
        project_activity_status=True,
        creator_id=current_user.user_id
    )

    db.session.add(new_project)
    db.session.commit()

    creator_relation = User_Project(
        user_id=current_user.user_id,
        project_id=new_project.project_id,
        role='owner'
    )

    db.session.add(creator_relation)

    if invited_emails:
        email_list = [email.strip() for email in invited_emails.replace("\n", ",").split(",") if email.strip()]
        for email in email_list:
            invited_user = User_profile.query.filter_by(email=email).first()
            new_invite = Invitation(
                invited_email=email,
                invited_user_id=invited_user.user_id if invited_user else None,
                referrer_id=current_user.user_id,
                project_id=new_project.project_id
            )
            db.session.add(new_invite)

    db.session.commit()

    return jsonify({"message": "Project created successfully!"})

# Home
@views.route('/api/mainpage', methods=['GET', 'POST'])
@login_required
def home():
    user = User_profile.query.get(current_user.user_id)

    if not user:
        return jsonify({"error": "User not found"}), 404
    
    query = text("SELECT * FROM get_user_projects(:user_id_param)")
    result = db.session.execute(query, {"user_id_param": user.user_id}).mappings()

    roles_list = [dict(row) for row in result]  

    response_data = {
        "user": {
            "id": user.user_id,
            "name": user.full_name,
            "email": user.email,
            "profile_pic": f"/static/profile_pics/{user.profile_pic}" if user.profile_pic else "/static/profile_pics/default.png"
        },
        "roles": roles_list
    }

    return jsonify(response_data)

# Profile
@views.route('/api/profile', methods=['GET'])
@login_required
def get_profile():
    user = User_profile.query.get(current_user.user_id)

    if not user:
        return jsonify({"error": "User not found"}), 404

    profile_data = {
        "name": user.full_name,
        "avatar": f"/static/profile_pics/{user.profile_pic}" if user.profile_pic else "/static/profile_pics/default.png"
    }

    return jsonify(profile_data)
