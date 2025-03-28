from flask import Blueprint, render_template, request, flash, redirect, url_for, jsonify
from .models import User_profile, User_Project, Project
from werkzeug.security import generate_password_hash, check_password_hash
from . import db
from flask_login import login_user, login_required, logout_user, current_user
import phonenumbers
import re
from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, SubmitField
from flask_wtf.recaptcha import RecaptchaField
import os
import requests
from flask_cors import CORS


auth = Blueprint('auth', __name__)
CORS(auth)

#login

@auth.route('/login', methods=['GET', 'POST'])
def login():
    data = request.get_json()  # Parse JSON data from the request
    email = data.get('email')
    password = data.get('password')

    user = User_profile.query.filter_by(email=email).first()
    if user:
        if check_password_hash(user.password, password):
            login_user(user, remember=True)
            return {"message": "Logged in successfully!", "status": "success"}, 200
        else:
            return {"message": "Incorrect password, try again.", "status": "error"}, 401
    else:
        return {"message": "Email does not exist.", "status": "error"}, 404

# login end

# logout

@auth.route('/logout', methods=['POST'])
@login_required
def logout():
    logout_user()
    return jsonify({"message": "Logged out successfully"}), 200

# logout end

# sign up stuff

os.environ['RECAPTCHA_PUBLIC_KEY'] = "6LeKEvEqAAAAAI1MIfoiTYc_MBpk6GZ0hXO-fCot" #site_key
os.environ['RECAPTCHA_PRIVATE_KEY'] = "6LeKEvEqAAAAACB2kZN3_QckJOu_nYtxpHuRWz2O" #your_secret_key

def verify_recaptcha(response):
    secret_key = "6LeKEvEqAAAAACB2kZN3_QckJOu_nYtxpHuRWz2O"  # Replace with your actual secret key
    verify_url = "https://www.google.com/recaptcha/api/siteverify"
    payload = {'secret': secret_key, 'response': response}
    result = requests.post(verify_url, data=payload).json()
    print("reCAPTCHA API response:", result)  # Debugging
    return result.get("success", False)

# Regex patterns
FULL_NAME_REGEX = re.compile(r"^[A-Za-zÀ-ÖØ-öø-ÿ-]+(?: [A-Za-zÀ-ÖØ-öø-ÿ-]+)*$")
NICKNAME_REGEX = re.compile(r"^[A-Za-z0-9_]+$")
PASSWORD_REGEX = re.compile(r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{7,}$")


def is_valid_phone_number(number):  
        try:
            parsed_number = phonenumbers.parse(number)
            return phonenumbers.is_valid_number(parsed_number)
        except phonenumbers.NumberParseException:
            return False

@auth.route('/sign-up', methods=['POST'])
def sign_up():
    if request.method == 'POST':
        data = request.get_json()  # Parse JSON data from the request
        captcha_response = data.get('captchaResponse')
        print("Received captchaResponse:", captcha_response)  # Debugging

        # Verify reCAPTCHA
        if not verify_recaptcha(captcha_response):
            return {"message": "Please complete the CAPTCHA.", "status": "error"}, 400

        email = data.get('email')
        full_name = data.get('fullName')
        nickname = data.get('nickname')
        password1 = data.get('password1')
        password2 = data.get('password2')

        # Optional fields
        mobile = data.get('mobile') or None
        job = data.get('job') or None

        # Check for existing user and validate input
        user = User_profile.query.filter_by(email=email).first()
        if user:
            return {"message": "Email already exists.", "status": "error"}, 400
        elif len(email) < 4:
            return {"message": "Email must be greater than 3 characters.", "status": "error"}, 400
        elif len(full_name) < 2:
            return {"message": "Full name must be greater than 1 character.", "status": "error"}, 400
        elif not FULL_NAME_REGEX.match(full_name):
            return {"message": "Full name must only contain letters, spaces, and hyphens.", "status": "error"}, 400
        elif len(nickname) < 2:
            return {"message": "Nickname must be greater than 1 character.", "status": "error"}, 400
        elif not NICKNAME_REGEX.match(nickname):
            return {"message": "Nickname can only contain letters, numbers, and underscores.", "status": "error"}, 400
        elif job and not NICKNAME_REGEX.match(job):
            return {"message": "Job can only contain letters, numbers, and underscores.", "status": "error"}, 400
        elif mobile and not is_valid_phone_number(mobile):
            return {"message": "Invalid phone number.", "status": "error"}, 400
        elif password1 != password2:
            return {"message": "Passwords don't match.", "status": "error"}, 400
        elif not PASSWORD_REGEX.match(password1):
            return {
                "message": "Password must be at least 7 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.",
                "status": "error",
            }, 400
        else:
            # Create new user
            new_user = User_profile(
                email=email,
                full_name=full_name,
                password=generate_password_hash(password1, method='pbkdf2:sha256'),
                nickname=nickname,
                mobile=mobile,
                job=job,
            )

            db.session.add(new_user)
            db.session.commit()

            # Update the nickname by appending the user ID
            new_user.nickname = f"{new_user.nickname}#{new_user.user_id}"
            db.session.commit()

            login_user(new_user, remember=True)

            return {"message": "Account created successfully!", "status": "success"}, 201

    # If the request method is not POST, return an error
    return {"message": "Invalid request method.", "status": "error"}, 405

# sign up stuff end