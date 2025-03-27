from flask import Blueprint, render_template, request, flash, redirect, url_for
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

@auth.route('/login', methods=['POST'])
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

@auth.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('auth.login'))

# logout end

# sign up stuff

os.environ['RECAPTCHA_PUBLIC_KEY'] = "6LeKEvEqAAAAAI1MIfoiTYc_MBpk6GZ0hXO-fCot" #site_key
os.environ['RECAPTCHA_PRIVATE_KEY'] = "6LeKEvEqAAAAACB2kZN3_QckJOu_nYtxpHuRWz2O" #your_secret_key

def verify_recaptcha(response):
    secret_key = os.getenv('RECAPTCHA_PRIVATE_KEY')
    verify_url = "https://www.google.com/recaptcha/api/siteverify"
    payload = {'secret': secret_key, 'response': response}
    result = requests.post(verify_url, data=payload).json()
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

@auth.route('/sign-up', methods=['GET', 'POST'])
def sign_up():
    if request.method == 'POST':
        data = request.get_json() 
        email = request.form.get('email')
        full_name = request.form.get('fullName')
        nickname = request.form.get('nickname')
        password1 = request.form.get('password1')
        password2 = request.form.get('password2')
        captcha_response = request.form.get('g-recaptcha-response')

        if not verify_recaptcha(captcha_response):
            flash('Please complete the CAPTCHA.', category='error')
            return redirect(url_for('auth.sign_up'))
        
        #optional fields
        mobile = request.form.get('mobile') or None
        job = request.form.get('job') or None

        #Ceck for: existing user, issues with credentials then create new user
        user = User_profile.query.filter_by(email=email).first()
        if user:
            flash('Email already exists.', category='error')
            return redirect(url_for('auth.sign_up'))
        elif len(email) < 4:
            flash('Email must be greater than 3 characters.', category='error')
            return redirect(url_for('auth.sign_up'))
        elif len(full_name) < 2:
            flash('Full name must be greater than 1 character.', category='error')
            return redirect(url_for('auth.sign_up'))
        elif not FULL_NAME_REGEX.match(full_name):
            flash('Full name must only contain letters, spaces, and hyphens.', category='error')
            return redirect(url_for('auth.sign_up'))
        elif len(nickname) < 2:
            flash('Nickname must be greater than 1 character.', category='error')
            return redirect(url_for('auth.sign_up'))

        elif not NICKNAME_REGEX.match(nickname):
            flash('Nickname can only contain letters, numbers, and underscores.', category='error')
            return redirect(url_for('auth.sign_up'))
        elif job and not NICKNAME_REGEX.match(job):
            flash('Job can only contain letters, numbers, and underscores.', category='error')
            return redirect(url_for('auth.sign_up'))
        elif mobile and not is_valid_phone_number(mobile):
            flash('Invalid phone number.', category='error')
            return redirect(url_for('auth.sign_up'))
        elif password1 != password2:
            flash('Passwords don\'t match.', category='error')
            return redirect(url_for('auth.sign_up'))
        elif not PASSWORD_REGEX.match(password1):
            flash('Password must be at least 7 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.', category='error')
            return redirect(url_for('auth.sign_up'))
        else:
            new_user = User_profile(
                email=email, 
                full_name=full_name, 
                password=generate_password_hash(password1, method='pbkdf2:sha256'),
                nickname=nickname,
                mobile=mobile,
                job=job 
            )
            
            db.session.add(new_user)
            db.session.commit()   

            # Now update the nickname by appending the user ID
            new_user.nickname = f"{new_user.nickname}#{new_user.user_id}"
            
            db.session.commit()  # Commit the nickname change

            login_user(new_user, remember=True)      
               
            return {"message": "Account created successfully!", "status": "success"}, 201

# sign up stuff end