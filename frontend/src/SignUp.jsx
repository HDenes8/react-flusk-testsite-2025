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
    <div className="container mx-auto max-w-md p-6">
      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <div className="logo text-center mb-4">
          <img src="/sortify_logo.png" alt="Sortify Logo" width="250" />
        </div>
        <h3 className="text-center text-xl font-semibold mb-4">Register</h3>

        <div className="form-group mb-4">
          <label htmlFor="fullName" className="block text-gray-700 text-sm font-bold mb-2">Full Name *</label>
          <input
            type="text"
            id="fullName"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            className="form-control shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Enter full name"
          />
        </div>

        <div className="form-group mb-4">
          <label htmlFor="nickname" className="block text-gray-700 text-sm font-bold mb-2">Nickname *</label>
          <input
            type="text"
            id="nickname"
            name="nickname"
            value={formData.nickname}
            onChange={handleChange}
            className="form-control shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Enter nickname"
          />
        </div>

        <div className="form-group mb-4">
          <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">Email Address *</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="form-control shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Enter email"
          />
        </div>

        <div className="form-group mb-4">
          <label htmlFor="mobile" className="block text-gray-700 text-sm font-bold mb-2">Phone Number</label>
          <input
            type="text"
            id="mobile"
            name="mobile"
            value={formData.mobile}
            onChange={handleChange}
            className="form-control shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Enter mobile number (Optional)"
          />
        </div>

        <div className="form-group mb-4">
          <label htmlFor="job" className="block text-gray-700 text-sm font-bold mb-2">Job Title</label>
          <input
            type="text"
            id="job"
            name="job"
            value={formData.job}
            onChange={handleChange}
            className="form-control shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Enter job (Optional)"
          />
        </div>

        <div className="form-group mb-4">
          <label htmlFor="password1" className="block text-gray-700 text-sm font-bold mb-2">Password *</label>
          <input
            type="password"
            id="password1"
            name="password1"
            value={formData.password1}
            onChange={handleChange}
            className="form-control shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Enter password"
          />
        </div>

        <div className="form-group mb-4">
          <label htmlFor="password2" className="block text-gray-700 text-sm font-bold mb-2">Password (Confirm) *</label>
          <input
            type="password"
            id="password2"
            name="password2"
            value={formData.password2}
            onChange={handleChange}
            className="form-control shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Confirm password"
          />
        </div>

        <div className="form-group mb-4">
          <div className="g-recaptcha" data-sitekey="6LeKEvEqAAAAAI1MIfoiTYc_MBpk6GZ0hXO-fCot"></div>
        </div>

        <button
          type="submit"
          className="btn btn-primary bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full"
        >
          Submit
        </button>

        <p className="text-sm text-gray-600 mt-4">
          By clicking Submit, you agree to our Terms of Service and Privacy Policy.
        </p>

        <div className="already-account mt-4 text-center">
          <Link to="/login" className="text-blue-500 hover:underline">
            Already have an account?
          </Link>
        </div>
      </form>
    </div>
  );
};

export default SignUp;