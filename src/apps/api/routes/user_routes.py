import json
from pathlib import Path
import datetime as dt
import os

from flask import Blueprint, jsonify , request , render_template_string , abort
import hashlib
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
)
from werkzeug.utils import secure_filename

from config import Config
from ..controllers import LOGIN , REGISTER
from ..utils import response_handler , allowed_file

bp = Blueprint('users', __name__)

#TODO: User Profile apis


@bp.route('/login', methods=['POST'])
def login():
    if request.method == 'POST':
        email = request.form['email']
        password = hashlib.md5(request.form['password'].encode() + Config.HASH_SAULT.encode()).hexdigest() 
        response = LOGIN(email , password)
        if response:
            tokens = {}
            access_token = create_access_token(identity=json.dumps(response))
            refresh_token = create_refresh_token(identity=json.dumps(response))
            tokens['access_token'] = access_token
            tokens['refresh_token'] = refresh_token
            response['tokens'] = tokens
            return response_handler(response)
        else:
            abort(401 , description="Invalid email or password")


@bp.route('/refresh_token', methods=['POST'])
@jwt_required(refresh=True)
def refresh_token():
    current_user = get_jwt_identity()
    access_token = create_access_token(identity=current_user)
    return response_handler({"access_token": access_token})


@bp.route('/register', methods=['POST'])
def register():
    if request.method == 'POST':
            if request.form.get('name') == '' or request.form.get('lastname') == '' or request.form.get('email') == '' or request.form.get('password') == '':
                abort(400, description="name, lastname, email and password are required")
            name = request.form['name']
            lastname = request.form['lastname']
            email = request.form['email']
            password = hashlib.md5(request.form['password'].encode() + Config.HASH_SAULT.encode()).hexdigest() 
            profile_pic = request.files.get('profile_pic')
            if profile_pic and profile_pic.filename == '':
                abort(400, description="No selected file")
            elif profile_pic:
                profiles_dir = Config.PROFILE_FOLDER.config['PROFILE_FOLDER']
                Path(profiles_dir).mkdir(parents=True, exist_ok=True)
                if profile_pic and allowed_file(profile_pic.filename , ['png', 'jpg', 'jpeg']):
                    profile_pic_name = dt.datetime.now().strftime("%Y%m%d%H%M%S") + "_" + secure_filename(profile_pic.filename)
                    profile_pic_dir = os.path.join(profiles_dir, profile_pic_name)
                    profile_pic.save(profile_pic_dir)
                else:
                    abort(400 ,description="profile_pic file type not allowed")
            address = request.form.get('address') if request.form.get('address') else None
            birth_date = request.form.get('birth_date') if request.form.get('birth_date') else None
            educational_level = request.form.get('educational_level')
            educational_field = request.form.get('educational_field')
            response = REGISTER(
                name,
                lastname,
                email,
                password,
                profile_pic_dir if profile_pic else None,
                address,
                birth_date,
                educational_level,
                educational_field
            )
            if response:
                return response_handler(response)
            else:
                abort(401 , description="Email already exists")


