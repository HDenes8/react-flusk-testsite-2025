import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './sign_up.css';

const SignUp = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    nickname: '',
    email: '',
    mobile: '',
    job: '',
    password1: '',
    password2: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Add form submission logic here (e.g., send data to the backend)
    console.log('Form submitted:', formData);
  };

  return (
    <div className="container">
      <form onSubmit={handleSubmit} method="POST">
        <div className="logo" style={{ textAlign: 'center' }}>
          <img src="/sortify_logo.png" alt="Sortify Logo" width="250" />
        </div>
        <h3 align="center">Register</h3>

        <div className="form-group">
          <label htmlFor="fullName">Full Name *</label>
          <input
            type="text"
            id="fullName"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            className="form-control"
            placeholder="Enter full name"
          />
        </div>

        <div className="form-group">
          <label htmlFor="nickname">Nickname *</label>
          <input
            type="text"
            id="nickname"
            name="nickname"
            value={formData.nickname}
            onChange={handleChange}
            className="form-control"
            placeholder="Enter nickname"
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email Address *</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="form-control"
            placeholder="Enter email"
          />
        </div>

        <div className="form-group">
          <label htmlFor="mobile">Phone Number</label>
          <input
            type="text"
            id="mobile"
            name="mobile"
            value={formData.mobile}
            onChange={handleChange}
            className="form-control"
            placeholder="Enter mobile number (Optional)"
          />
        </div>

        <div className="form-group">
          <label htmlFor="job">Job Title</label>
          <input
            type="text"
            id="job"
            name="job"
            value={formData.job}
            onChange={handleChange}
            className="form-control"
            placeholder="Enter job (Optional)"
          />
        </div>

        <div className="form-group">
          <label htmlFor="password1">Password *</label>
          <input
            type="password"
            id="password1"
            name="password1"
            value={formData.password1}
            onChange={handleChange}
            className="form-control"
            placeholder="Enter password"
          />
        </div>

        <div className="form-group">
          <label htmlFor="password2">Password (Confirm) *</label>
          <input
            type="password"
            id="password2"
            name="password2"
            value={formData.password2}
            onChange={handleChange}
            className="form-control"
            placeholder="Confirm password"
          />
        </div>

        <div className="g-recaptcha" data-sitekey="6LeKEvEqAAAAAI1MIfoiTYc_MBpk6GZ0hXO-fCot"></div>

        <button type="submit" className="btn btn-primary">
          Submit
        </button>
        <br />
        <span>By clicking Submit, you agree to our Terms of Service and Privacy Policy</span>

        <div className="already-account">
          <Link to="/login">Already have an account?</Link>
        </div>
      </form>
    </div>
  );
};

export default SignUp;