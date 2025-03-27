import React from 'react';
import { Link } from 'react-router-dom';
import './sign_up.css';

const Login = () => {
  return (
    <div className="container">
      <form method="POST">
        <div className="logo" style={{ textAlign: 'center' }}>
          <img src="/sortify_logo.png" alt="Sortify Logo" width="250" />
        </div>
        <h3 align="center">Log In</h3>
        
        <div className="form-group">
          <label htmlFor="email">Email Address</label>
          <input 
            type="email" 
            className="form-control" 
            id="email" 
            name="email" 
            placeholder="Enter email" 
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
          />
        </div>

        <br />

        <button 
          type="submit" 
          className="btn btn-primary"
        >
          Log In
        </button>

        <div className="divider">
          ----------------------------------or----------------------------------
        </div>

        <Link to="/sign-up" className="btn btn-secondary">
          Register
        </Link>
      </form>
    </div>
  );
};

export default Login;
