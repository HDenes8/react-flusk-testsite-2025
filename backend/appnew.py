from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

app = Flask(__name__)
CORS(app)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///invitations.db'
db = SQLAlchemy(app)

class UserProfile(db.Model):
    user_id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(255))
    email = db.Column(db.String(150), unique=True)
    invitations = db.relationship('Invitation', foreign_keys='Invitation.invited_user_id', backref='invitee', lazy=True)

class Project(db.Model):
    project_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)

class Invitation(db.Model):
    invitation_id = db.Column(db.Integer, primary_key=True)
    invited_email = db.Column(db.String(255), nullable=True)
    invite_date = db.Column(db.DateTime(timezone=True), default=datetime.utcnow)
    status = db.Column(db.String(50), default='pending')
    invited_user_id = db.Column(db.Integer, db.ForeignKey('user_profile.user_id'), nullable=True)
    referrer_id = db.Column(db.Integer, db.ForeignKey('user_profile.user_id'))
    project_id = db.Column(db.Integer, db.ForeignKey('project.project_id'))
    project = db.relationship('Project', backref='invitations')
    referrer = db.relationship('UserProfile', foreign_keys=[referrer_id], backref='sent_invitations')

@app.route('/api/invitations', methods=['GET'])
def get_invitations():
    # Assuming current_user is available and has an id
    current_user_id = 1  # Replace with actual current user id
    invitations = Invitation.query.filter_by(invited_user_id=current_user_id).all()
    return jsonify([{
        'invitation_id': inv.invitation_id,
        'project': {'name': inv.project.name},
        'referrer': {'full_name': inv.referrer.full_name}
    } for inv in invitations])

@app.route('/api/invitations/<int:invitation_id>/accept', methods=['POST'])
def accept_invitation(invitation_id):
    invitation = Invitation.query.get(invitation_id)
    if invitation:
        invitation.status = 'accepted'
        db.session.commit()
        return jsonify({'message': 'Invitation accepted'}), 200
    return jsonify({'message': 'Invitation not found'}), 404

if __name__ == '__main__':
    db.create_all()
    app.run(debug=True)
