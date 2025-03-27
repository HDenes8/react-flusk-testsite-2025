import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './sign_up.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault(); // Prevent form submission reload
    setErrorMessage(''); // Clear previous error messages
    setSuccessMessage(''); // Clear previous success messages

    try {
      const response = await fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage(data.message); // Display success message
        setTimeout(() => {
          // Redirect to another page (e.g., Main Page) after successful login
          window.location.href = '/main';
        }, 1000);
      } else {
        setErrorMessage(data.message); // Display error message
      }
    } catch (error) {
      setErrorMessage('Something went wrong. Please try again later.');
    }
  };

  return (
    <div className="container">
      <form method="POST" onSubmit={handleLogin}>
        <div className="logo" style={{ textAlign: 'center' }}>
          <img src="/sortify_logo.png" alt="Sortify Logo" width="250" />
        </div>
        <h3 align="center">Log In</h3>

        {errorMessage && <p className="error-message">{errorMessage}</p>}
        {successMessage && <p className="success-message">{successMessage}</p>}

        <div className="form-group">
          <label htmlFor="email">Email Address</label>
          <input
            type="email"
            className="form-control"
            id="email"
            name="email"
            placeholder="Enter email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            className="form-control"
            id="password"
            name="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <br />

        <button type="submit" className="btn btn-primary">
          Log In
        </button>

        <div className="divider">
          <h4>or</h4>
        </div>

        <Link to="/sign-up" className="btn btn-secondary">
          Register
        </Link>
      </form>
    </div>
  );
};

export default Login;
