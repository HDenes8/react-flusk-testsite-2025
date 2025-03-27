from flask import Blueprint, render_template, request, flash, url_for, redirect
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

    return render_template("members.html", user=current_user, project_roles=project_roles)


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

    return render_template("invitations.html", user=current_user, invitations=user_invitations, filter_status=filter_status)

#sending inv

@views.route('/invite', methods=['POST'])
@login_required
def invite():
    project_id = request.form.get('project_id')
    email_or_id = request.form.get('email_or_id')

    # Check if the user has permission
    user_project = User_Project.query.filter_by(user_id=current_user.user_id, project_id=project_id).first()
    if not user_project or user_project.role not in ['owner', 'admin', 'editor']:
        flash('You do not have permission to send invites.', category='error')
        return redirect(url_for('views.members'))

    # Check if input is an email or a user ID
    if email_or_id.isdigit():
        invited_user = User_profile.query.filter_by(user_id=int(email_or_id)).first()
        if not invited_user:
            flash('User ID not found.', category='error')
            return redirect(url_for('views.members'))
        invited_email = None
        invited_user_id = invited_user.user_id
    else:
        invited_user = User_profile.query.filter_by(email=email_or_id).first()
        invited_email = email_or_id
        invited_user_id = invited_user.user_id if invited_user else None

    # Check if invitation already exists
    existing_invite = Invitation.query.filter_by(project_id=project_id, invited_email=invited_email, invited_user_id=invited_user_id).first()
    if existing_invite:
        flash('An invitation has already been sent.', category='error')
        return redirect(url_for('views.members'))

    # Create and save the invitation
    new_invite = Invitation(
        invited_email=invited_email,
        invited_user_id=invited_user_id,
        referrer_id=current_user.user_id,
        project_id=project_id
    )
    db.session.add(new_invite)
    db.session.commit()

    flash('Invitation sent successfully!', category='success')
    return redirect(url_for('views.members'))

#sending inv end

#accept inv

@views.route('/accept_invite/<int:invitation_id>', methods=['POST'])
@login_required
def accept_invite(invitation_id):
    invitation = Invitation.query.get(invitation_id)

    if not invitation or (invitation.invited_user_id and invitation.invited_user_id != current_user.user_id) \
        or (invitation.invited_email and invitation.invited_email != current_user.email):        
        flash('Invalid invitation.', category='error')
        return redirect(url_for('views.invitations'))

    # Check if the user is already in the project
    existing_membership = User_Project.query.filter_by(
        user_id=current_user.user_id, project_id=invitation.project_id
    ).first()

    if existing_membership:
        flash('You are already a member of this project.', category='error')
    else: # Assign the user to the project with the default role of "reader"
        new_member = User_Project(user_id=current_user.user_id, project_id=invitation.project_id, role='reader')
        db.session.add(new_member)
        flash('You have joined the project!', category='success')

    invitation.status = 'accepted'
    db.session.commit()

    return redirect(url_for('views.projects'))

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

    flash('Invitation denied.', category='info')
    return redirect(url_for('views.invitations'))
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
        flash('No file part', category='error')
        return redirect(request.referrer)

    file = request.files['file']

    if file.filename == '':
        flash('No selected file', category='error')
        return redirect(request.referrer)

    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)
        flash('File uploaded successfully!', category='success')
    else:
        flash('Invalid file type!', category='error')

    return redirect(request.referrer)

@views.route('/download/<filename>')
@login_required
def download_file(filename):
    file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
    if os.path.exists(file_path):
        return send_from_directory(current_app.config['UPLOAD_FOLDER'], filename, as_attachment=True)
    else:
        flash('File not found.', category='error')
        return redirect(request.referrer)
    
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
    
    
    print(projects)

    # user_projects = User_Project.query.filter_by(user_id=current_user.user_id).all()
    # project_ids = [up.project_id for up in user_projects]
    # projects = Project.query.filter(Project.project_id.in_(project_ids)).all()

    files = os.listdir(current_app.config['UPLOAD_FOLDER'])

    return render_template("projects.html", user=current_user, projects=projects, files=files)

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
        # Get form data
        email = request.form.get('email')
        full_name = request.form.get('fullName')
        password1 = request.form.get('password1')
        password2 = request.form.get('password2')

        # Optional fields
        nickname = request.form.get('nickname')
        mobile = request.form.get('mobile')
        job = request.form.get('job')
        selected_pic = request.form.get('profile_pic')

        #print(f"Email: {email}, Full Name: {full_name}, Nickname: {nickname}, Mobile: {mobile}, Job: {job}") # Debug

        # Initialize error flag
        errors = False

        # Handle email change
        if email and email != current_user.email:
            if len(email) < 4:
                flash('Email must be greater than 3 characters.', category='error')
                errors = True
            elif User_profile.query.filter_by(email=email).first():
                flash('Email already exists.', category='error')
                errors = True

        # Handle full name change
        if full_name and full_name != current_user.full_name:
            if len(full_name) < 2:
                flash('Full name must be greater than 1 character.', category='error')
                errors = True

        # Handle password change
        if password1 or password2:
            if password1 != password2:
                flash('Passwords don\'t match.', category='error')
                errors = True
            elif len(password1) < 7:
                flash('Password must be at least 7 characters.', category='error')
                errors = True
            elif password1 and check_password_hash(current_user.password, password1):
                flash('Password can\'t be the old one.', category='error')
                errors = True

        # If there are errors, re-render the form with error messages
        if errors:
            return render_template("settings.html", user=current_user)

        # Update fields if no errors
        user = current_user

        # Only update the fields that are being changed
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
                    user.profile_pic=selected_pic

        # If a new password hash it
        if password1:
            user.password = generate_password_hash(password1, method='pbkdf2:sha256')

        # Commit changes to the database
        db.session.commit()
        flash('Your changes have been saved!', category='success')

        # Redirect to the settings page after update
        return redirect(url_for('views.settings')) 

    # Pre-fill the form with current user info when the page loads
    return render_template("settings.html", user=current_user, profile_pics=profile_pics)

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
            flash('Project name is required!', category='error')
        elif len(description) < 1:
            flash('Description is required!', category='error')
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

            flash('Project created successfully!', category='success')
            return redirect(url_for('views.home'))
        
    return render_template("create_project.html", user=current_user)

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
