from flask import Flask, jsonify
from flask_sqlalchemy import SQLAlchemy
import os
from flask_cors import CORS  # Import flask-cors
import psycopg2

# Create the Flask app
app = Flask(__name__)

# Enable CORS for all routes
CORS(app)

# Configure the database connection
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///default.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# PostgreSQL connection details
DB_HOST = "localhost"
DB_NAME = "your_database_name"
DB_USER = "your_username"
DB_PASSWORD = "your_password"

def get_db_connection():
    conn = psycopg2.connect(
        host=DB_HOST,
        database=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD
    )
    return conn

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

# Define an API route to fetch data from PostgreSQL
@app.route('/api/data', methods=['GET'])
def get_data():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM your_table_name;")
    rows = cursor.fetchall()
    cursor.close()
    conn.close()

    # Convert rows to a list of dictionaries
    data = [{"id": row[0], "value": row[1]} for row in rows]
    return jsonify(data)

# Add a route to add a user to the database
@app.route('/add_user/<name>', methods=['GET'])
def add_user(name):
    user = User(name=name)
    db.session.add(user)
    db.session.commit()
    return jsonify({"message": f"User {name} added to the database!"})

# Keep the welcome message
@app.route('/')
def home():
    return "Welcome to the Flask app with PostgreSQL!"

# Run the app
if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000, debug=True)
