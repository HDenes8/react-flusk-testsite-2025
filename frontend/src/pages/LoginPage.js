import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import styles from '../styles/LoginPage.module.css'; // Updated to scoped styles

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loginSuccess, setLoginSuccess] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/login', { email, password });
      setMessage(response.data.message);

      if (response.data.status === 'success') {
        setLoginSuccess(true);
        setTimeout(() => {
          navigate('/mainpage');
        }, 1000);
      }
    } catch (error) {
      if (error.response) {
        setMessage(error.response.data.message);
      } else {
        setMessage('An error occurred. Please try again.');
      }
    }
  };

  return (
    <div className={styles['container']}>
      {(loginSuccess || message) && (
        <div className="global-message-popup">
          {loginSuccess ? "You successfully logged in" : message}
        </div>
      )}
      <form method="POST" onSubmit={handleLogin}>
        <div className={styles['logo']} style={{ textAlign: 'center' }}>
          <img src="/sortify_logo.png" alt="Sortify Logo" width="250" />
        </div>
        <h3 align="center">Log In</h3>

        <div className={styles['form-group']}>
          <label htmlFor="email">Email Address</label>
          <input
            type="email"
            className={styles['form-control']}
            id="email"
            name="email"
            placeholder="Enter email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className={styles['form-group']}>
          <label htmlFor="password">Password</label>
          <input
            type="password"
            className={styles['form-control']}
            id="password"
            name="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <br />

        <button type="submit" className={styles['btn-primary']}>
          Log In
        </button>

        <div className={styles['divider']}>
          <h4>or</h4>
        </div>

        <Link to="/signup" className={styles['btn-secondary']}>
          Register
        </Link>
      </form>
    </div>
  );
};

export default LoginPage;
