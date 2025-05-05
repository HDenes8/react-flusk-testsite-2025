from . import db
from flask_login import UserMixin
from sqlalchemy.sql import func
from sqlalchemy.sql.expression import text


# User + Project => N-M Conn. 
class User_profile (db.Model, UserMixin):
    user_id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(255))
    nickname = db.Column(db.String(100))
    nickname_id = db.Column(db.Integer)
    profile_pic = db.Column(db.String(255), default="default.png")
    email = db.Column(db.String(150), unique=True)
    password = db.Column(db.String(150))
    mobile = db.Column(db.String(20))
    job = db.Column(db.String(100))
    created_date = db.Column(db.DateTime(timezone=True), default=text("CURRENT_TIMESTAMP(0)"))

    user_activity_status = db.Column(db.Boolean, default=True)

    # Define the relationship to the Project model
    projects = db.relationship('Project', secondary='user_project', backref='users')
    invitations = db.relationship('Invitation', foreign_keys='Invitation.invited_user_id', backref='invitee', lazy=True)

    def get_id(self):
        return str(self.user_id)
  
class Project(db.Model):
    project_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    created_date = db.Column(db.DateTime(timezone=True), default=func.now())
    project_activity_status = db.Column(db.Boolean, default=True)
    
    creator_id = db.Column(db.Integer, db.ForeignKey('user_profile.user_id'))

class User_Project(db.Model):
    __tablename__ = 'user_project'

    user_id = db.Column(db.Integer, db.ForeignKey('user_profile.user_id'), primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('project.project_id'), primary_key=True)
    role = db.Column(db.Enum('reader', 'editor', 'admin', 'owner', name='role_enum'), default='reader', nullable=True)
    connection_date = db.Column(db.DateTime(timezone=True), default=text("CURRENT_TIMESTAMP(0)"))
    user_deleted_or_left_date = db.Column(db.DateTime(timezone=True), nullable=True) 

    is_removed = db.Column(db.Boolean, default=False)  # New field to track if the user was removed

class Invitation(db.Model):
    invitation_id = db.Column(db.Integer, primary_key=True)
    invited_email = db.Column(db.String(255), nullable=True)
    invite_date = db.Column(db.DateTime(timezone=True), default=text("CURRENT_TIMESTAMP(0)"))
    status = db.Column(db.Enum('pending', 'accepted', 'declined', name='invitation_status_enum'), default='pending')

    invited_user_id = db.Column(db.Integer, db.ForeignKey('user_profile.user_id'), nullable=True)  # User ID-based invite
    referrer_id = db.Column(db.Integer, db.ForeignKey('user_profile.user_id'))
    project_id = db.Column(db.Integer, db.ForeignKey('project.project_id'))

    project = db.relationship('Project', backref='invitations')
    referrer = db.relationship('User_profile', foreign_keys=[referrer_id], backref='sent_invitations')

class File_data(db.Model):
    file_data_id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100))
    description = db.Column(db.Text)    

    project_id = db.Column(db.Integer, db.ForeignKey('project.project_id'))

class File_version(db.Model):
    version_id = db.Column(db.Integer, primary_key=True)
    version_number = db.Column(db.Integer)
    file_name = db.Column(db.String(255))
    file_type = db.Column(db.String(100))
    file_size = db.Column(db.Integer)
    last_version = db.Column(db.Boolean, default=False)
    comment = db.Column(db.String(100))
    upload_date = db.Column(db.DateTime(timezone=True), default=text("CURRENT_TIMESTAMP(0)"))

    file_data_id = db.Column(db.Integer, db.ForeignKey('file_data.file_data_id'))
    user_id = db.Column(db.Integer, db.ForeignKey('user_profile.user_id'))

    file_data = db.relationship('File_data', backref='versions')

class Last_download(db.Model):
    last_download_id = db.Column(db.Integer, primary_key=True)
    version_id = db.Column(db.Integer, db.ForeignKey('file_version.version_id'))  #actual file version
    download_date = db.Column(db.DateTime(timezone=True), default=text("CURRENT_TIMESTAMP(0)"))

    file_data_id = db.Column(db.Integer, db.ForeignKey('file_data.file_data_id'))
    user_id = db.Column(db.Integer, db.ForeignKey('user_profile.user_id'))

