from flask import Flask, jsonify
from flask_sqlalchemy import SQLAlchemy
import os
from flask_cors import CORS  # Import flask-cors
import psycopg2
import time

# Create the Flask app
app = Flask(__name__)

# Enable CORS for all routes
CORS(app)

# Configure the database connection
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv(
    'DATABASE_URL',
    'postgresql://postgres:password@db:5432/mydatabase'  # Updated with correct values
)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# PostgreSQL connection details
DB_HOST = "db"  # Use the service name from docker-compose.yml
DB_NAME = "mydatabase"
DB_USER = "postgres"
DB_PASSWORD = "password"

def get_db_connection():
    retries = 5
    while retries > 0:
        try:
            conn = psycopg2.connect(
                host=DB_HOST,
                database=DB_NAME,
                user=DB_USER,
                password=DB_PASSWORD
            )
            return conn
        except psycopg2.OperationalError as e:
            print("Database connection failed. Retrying in 5 seconds...")
            retries -= 1
            time.sleep(5)
    raise Exception("Could not connect to the database after multiple retries")

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
        # Check if the User table exists
        if not db.engine.dialect.has_table(db.engine, 'user'):
            db.create_all()  # Create tables only if they don't exist

        # Create the table for `your_table_name` if it doesn't exist
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS your_table_name (
                id SERIAL PRIMARY KEY,
                value TEXT NOT NULL
            );
        """)
        conn.commit()
        cursor.close()
        conn.close()

        initialized = True

# Define an API route
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

@app.route('/add_sample_data', methods=['GET'])
def add_sample_data():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("INSERT INTO your_table_name (value) VALUES ('Sample data from PostgreSQL');")
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"message": "Sample data added to the database!"})

# Keep the welcome message
@app.route('/')
def home():
    try:
        # Connect to the database
        conn = get_db_connection()
        cursor = conn.cursor()

        # Fetch one line from the database
        cursor.execute("SELECT * FROM your_table_name LIMIT 1;")
        row = cursor.fetchone()

        # Close the connection
        cursor.close()
        conn.close()

        # Prepare the response
        if row:
            data = {"id": row[0], "value": row[1]}
        else:
            data = {"message": "No data found in the database."}

        return jsonify({
            "message": "Hello from Flask!",
            "data": data
        })
    except Exception as e:
        return jsonify({"error": str(e)})

# Run the app
if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000, debug=True)
