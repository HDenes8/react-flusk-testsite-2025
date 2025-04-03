from flask import Blueprint, render_template, request, flash, url_for, redirect, jsonify
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

# Projects
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

# Settings
@views.route('/settings', methods=['POST', 'GET'])
@login_required 
def settings():
    profile_pics_folder = os.path.join(current_app.static_folder, 'profile_pics')
    profile_pics = [f for f in os.listdir(profile_pics_folder) if f.endswith(('.png', '.jpg', '.jpeg'))]
    
    if "default.png" not in profile_pics:
        profile_pics.append("default.png")

    if request.method == 'POST':
        email = request.form.get('email')
        full_name = request.form.get('fullName')
        password1 = request.form.get('password1')
        password2 = request.form.get('password2')

        nickname = request.form.get('nickname')
        mobile = request.form.get('mobile')
        job = request.form.get('job')
        selected_pic = request.form.get('profile_pic')

        errors = False

        if email and email != current_user.email:
            if len(email) < 4:
                return jsonify({"error": "Email must be greater than 3 characters."}), 400
            elif User_profile.query.filter_by(email=email).first():
                return jsonify({"error": "Email already exists."}), 400

        if full_name and full_name != current_user.full_name:
            if len(full_name) < 2:
                return jsonify({"error": "Full name must be greater than 1 character."}), 400

        if password1 or password2:
            if password1 != password2:
                return jsonify({"error": "Passwords don't match."}), 400
            elif len(password1) < 7:
                return jsonify({"error": "Password must be at least 7 characters."}), 400
            elif password1 and check_password_hash(current_user.password, password1):
                return jsonify({"error": "Password can't be the old one."}), 400

        if errors:
            return jsonify({"error": "There were issues with the form."}), 400

        user = current_user

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
            if selected_pic in profile_pics:
                if selected_pic != user.profile_pic:
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
