from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from .models import File_data, User_profile, User_Project, Project, Invitation, File_version
from . import db
from werkzeug.security import generate_password_hash, check_password_hash

from flask import current_app
from flask import send_from_directory
import os
from werkzeug.utils import secure_filename

from sqlalchemy import text
from sqlalchemy.orm import aliased

import datetime
import uuid

views = Blueprint('views', __name__)

# Members
@views.route('/members', methods=['GET', 'POST'])
@login_required 
def members():
    user_projects = User_Project.query.filter_by(user_id=current_user.user_id).all()

    project_roles = []
    for user_project in user_projects:
        project = Project.query.get(user_project.project_id)
        project_roles.append({
            "project": project,
            "role": user_project.role
        })

    return jsonify({"user_id": current_user.user_id, "projects": project_roles})

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

# Upload / download
ALLOWED_EXTENSIONS = {'txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@views.route('/upload', methods=['POST'])
@login_required
def upload_file():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)
        return jsonify({"message": "File uploaded successfully!"})
    else:
        return jsonify({"error": "Invalid file type!"}), 400

@views.route('/download/<filename>')
@login_required
def download_file(filename):
    file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
    if os.path.exists(file_path):
        return send_from_directory(current_app.config['UPLOAD_FOLDER'], filename, as_attachment=True)
    else:
        return jsonify({"error": "File not found."}), 404

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

# Create project
projects_bp = Blueprint('projects', __name__)
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

# Upload file + create version
projects_bp = Blueprint('projects', __name__)
@projects_bp.route("/api/projects/<int:project_id>/upload", methods=["POST"])
def upload_file(project_id):
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "Empty filename"}), 400

    project = Project.query.get_or_404(project_id)

    filename = file.filename
    version_id = str(uuid.uuid4())
    timestamp = datetime.datetime.utcnow().strftime("%Y%m%d%H%M%S")
    stored_filename = f"{timestamp}_{filename}"

    upload_folder = os.path.join("backend", "uploads", str(project.project_id))
    os.makedirs(upload_folder, exist_ok=True)
    file_path = os.path.join(upload_folder, stored_filename)
    file.save(file_path)

    # Create File_data entry
    file_data = File_data(
        description="File description",  
        short_comment="Short comment",  
        project_id=project.project_id
    )
    db.session.add(file_data)
    db.session.commit()

    # Create File_version entry for this file
    version = File_version(
        version_number=1,  
        file_name=filename,
        file_type=file.mimetype,
        file_size=len(file.read()), 
        description="Initial version",
        last_version=True,  
        short_comment="First version",
        file_id=file_data.file_data_id,  
        user_id=current_user.user_id  
    )
    db.session.add(version)
    db.session.commit()

    return jsonify({
        "message": "File uploaded",
        "version": {
            "version_id": version.version_id,
            "filename": version.file_name,
            "timestamp": version.upload_date.isoformat(),
            "file_size": version.file_size
        }
    }), 201

# Get all versions for a project
@projects_bp.route("/api/projects/<int:project_id>/versions", methods=["GET"])
def get_project_versions(project_id):
    project = Project.query.get_or_404(project_id)
    file_data = File_data.query.filter_by(project_id=project.project_id).all()

    if not file_data:
        return jsonify({"error": "No files for this project"}), 404

    versions = []
    for f in file_data:
        file_versions = File_version.query.filter_by(file_id=f.file_data_id).all()
        for v in file_versions:
            versions.append({
                "version_id": v.version_id,
                "filename": v.file_name,
                "timestamp": v.upload_date.isoformat(),
                "file_size": v.file_size
            })

    return jsonify(versions)

#project end

#project_page

@views.route('/project/<int:project_id>', methods=['GET'])
@login_required
def project_page(project_id):
    project = Project.query.get(project_id)
    if not project:
        return jsonify({"error": "Project not found."}), 404

    files = File_version.query.join(File_data, File_version.file_id == File_data.file_data_id).\
        filter(File_data.project_id == project_id, File_version.last_version == True).all()

    project_data = {
        "id": project.project_id,
        "name": project.name,
        "description": project.description,
        "created_at": project.created_date.isoformat() if project.created_date else None,
        "creator": User_profile.query.get(project.creator_id).full_name if project.creator_id else "Unknown"
    }

    files_data = [{
        "version_id": file.version_id,
        "filename": file.file_name,
        "file_size": file.file_size,
        "file_type": file.file_type,
        "upload_date": file.upload_date.isoformat() if file.upload_date else None
    } for file in files]

    return jsonify({
        "project": project_data,
        "files": files_data
    })

#project_page end

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
@views.route('/mainpage', methods=['GET', 'POST'])
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
