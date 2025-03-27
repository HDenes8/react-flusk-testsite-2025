from flask import Blueprint, render_template, request, flash, url_for, redirect, jsonify
from flask_login import login_required, current_user
from .models import User_profile, User_Project, Project, Invitation
from . import db
from werkzeug.security import generate_password_hash, check_password_hash

from flask import current_app
from flask import send_from_directory
import os
from werkzeug.utils import secure_filename

from sqlalchemy import text
from sqlalchemy.orm import aliased

views = Blueprint('views', __name__)

# members

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


# members end

#invitations
#invitations


@views.route('/invitations', methods=['GET'])
@login_required
def invitations():
    # Get selected statuses from checkboxes
    filter_status = request.args.getlist('status')

    # If no checkbox is selected, default to "pending"
    if not filter_status:
        filter_status = ['pending']

    # Fetch invitations that match selected statuses
    user_invitations = Invitation.query.filter(
        ((Invitation.invited_user_id == current_user.user_id) | 
         (Invitation.invited_email == current_user.email))
    ).filter(Invitation.status.in_(filter_status)).order_by(Invitation.invite_date.desc()).all()

    invitations_data = [{
        "id": inv.id,
        "project_id": inv.project_id,
        "status": inv.status,
        "invite_date": inv.invite_date.strftime('%Y-%m-%d')
    } for inv in user_invitations]
    
    return jsonify({"invitations": invitations_data})

#sending inv

# sending invitation
@views.route('/invite', methods=['POST'])
@login_required
def invite():
    project_id = request.form.get('project_id')
    email_or_id = request.form.get('email_or_id')

    user_project = User_Project.query.filter_by(user_id=current_user.user_id, project_id=project_id).first()
    if not user_project or user_project.role not in ['owner', 'admin', 'editor']:
        return jsonify({"error": "You do not have permission to send invites."}), 403

    if email_or_id.isdigit():
        invited_user = User_profile.query.filter_by(user_id=int(email_or_id)).first()
        if not invited_user:
            return jsonify({"error": "User ID not found."}), 404
        invited_email = None
        invited_user_id = invited_user.user_id
    else:
        invited_user = User_profile.query.filter_by(email=email_or_id).first()
        invited_email = email_or_id
        invited_user_id = invited_user.user_id if invited_user else None

    existing_invite = Invitation.query.filter_by(project_id=project_id, invited_email=invited_email, invited_user_id=invited_user_id).first()
    if existing_invite:
        return jsonify({"error": "An invitation has already been sent."}), 400

    new_invite = Invitation(
        invited_email=invited_email,
        invited_user_id=invited_user_id,
        referrer_id=current_user.user_id,
        project_id=project_id
    )
    db.session.add(new_invite)
    db.session.commit()

    return jsonify({"message": "Invitation sent successfully!"})

#sending inv end

#accept inv

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

#accept inv end

#deny inv
@views.route('/deny_invite/<int:invitation_id>', methods=['POST'])
@login_required
def deny_invite(invitation_id):
    invitation = Invitation.query.get(invitation_id)

    if not invitation or (invitation.invited_user_id and invitation.invited_user_id != current_user.user_id) \
        or (invitation.invited_email and invitation.invited_email != current_user.email):
        flash('Invalid invitation.', category='error')
        return redirect(url_for('views.invitations'))

    # Mark the invitation as denied
    invitation.status = 'declined'
    db.session.commit()

    return jsonify({"message": "Invitation denied."})
#deny inv end

#invitations end
#invitations end



#Upload / download

# Allowed file extensions
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
    
#Upload / download end

#projects

@views.route('/projects', methods=['POST', 'GET'])
@login_required
def projects():

    # Create an alias for the User_profile table for the creator
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

    # user_projects = User_Project.query.filter_by(user_id=current_user.user_id).all()
    # project_ids = [up.project_id for up in user_projects]
    # projects = Project.query.filter(Project.project_id.in_(project_ids)).all()

    files = os.listdir(current_app.config['UPLOAD_FOLDER'])

    return jsonify({"projects": projects_data}, files=files)

#projects end


#settings

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

#settings end

#create new project

@views.route('/create_project', methods=['GET', 'POST'])
@login_required
def create_project():
    project_users = User_profile.query.join(User_Project, User_profile.user_id == User_Project.user_id) \
        .filter(User_Project.project_id.in_(
            db.session.query(User_Project.project_id)
            .filter_by(user_id=current_user.user_id)
        )).all()

    if request.method == 'POST':
        project_name = request.form.get('projectName')
        description = request.form.get('description')
        invited_users = request.form.getlist('inviteUsers')
        invited_emails = request.form.get('inviteEmails')

        if len(project_name) < 1:
            return jsonify({"error": "Project name is required."}), 400
        elif len(description) < 1:
            return jsonify({"error": "Project description is required."}), 400
        else:
            new_project = Project(
                name=project_name, 
                description=description, 
                project_activity_status=True, 
                creator_id=current_user.user_id)

            db.session.add(new_project)
            db.session.commit()

            creator_relation = User_Project(
                user_id = current_user.user_id,
                project_id=new_project.project_id,
                role='owner'
            )

            db.session.add(creator_relation)

            # Process email invitations
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
        
    return jsonify({"message": "Please provide project details."})

#create new project end

#home

@views.route('/')
@login_required
def home():
    user = User_profile.query.get(current_user.user_id)

    if not user:
        flash('User not found.', category='error')
        return redirect(url_for('auth.login'))
    
    #SQLAlchemy JOIN
    # roles = db.session.query(
    #     User_Project.role.label("role"),
    #     Project.name.label("project_name"),
    #     Project.created_date.label("created_date"),
    #     User_profile.full_name.label("creator_name")
    # ).join(Project, User_Project.project_id == Project.project_id) \
    # .outerjoin(User_profile, Project.creator_id == User_profile.user_id) \
    # .filter(User_Project.user_id == user.user_id) \
    # .all()


    # print("Roles Query Result:", roles)  # Debugging 

    # roles_list = [dict(role._mapping) for role in roles]


    #tárolt eljárás
    query = text("SELECT * FROM get_user_projects(:user_id_param)")
    result = db.session.execute(query, {"user_id_param": user.user_id}).mappings()

    roles_list = [dict(row) for row in result]  

    #old method
    # roles=[]
    # user_project = User_Project.query.filter_by(user_id=user.user_id).all()

    # for up in user_project:
    #     project = Project.query.get(up.project_id)

    #     creator = User_profile.query.get(project.creator_id)

    #     roles.append({
    #         'project' : project,
    #         'role' : up.role,
    #         'creator': creator.full_name if creator else "Unknown"
    #     })

    return render_template("home.html", user=user, roles=roles_list, current_user=current_user) #project and creator is in roles too

#home end
