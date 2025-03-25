from flask import Flask, jsonify
from flask_sqlalchemy import SQLAlchemy
import os
from flask_cors import CORS  # Import flask-cors

# Create the Flask app
app = Flask(__name__)

# Enable CORS for all routes
CORS(app)

# Configure the database connection
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///default.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# Example model
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=False)

# Initialize the database (only once)
initialized = False

@app.before_request
def initialize_database():
    global initialized
    if not initialized:
        db.create_all()
        initialized = True

# Define an API route
@app.route('/api/data', methods=['GET'])
def get_data():
    return jsonify({"message": "Hello from Flask!"})

# Add a route to verify the database connection
@app.route('/add_user/<name>', methods=['GET'])
def add_user(name):
    user = User(name=name)
    db.session.add(user)
    db.session.commit()
    return jsonify({"message": f"User {name} added to the database!"})

@app.route('/')
def home():
    return "Welcome to the Flask app with PostgreSQL!"

# Run the app
if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000, debug=True)
