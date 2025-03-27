-- filepath: backend/db-init/init.sql

-- Create a table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL
);

-- Insert initial data
INSERT INTO users (username, email, password)
VALUES ('admin', 'admin@example.com', 'password123');