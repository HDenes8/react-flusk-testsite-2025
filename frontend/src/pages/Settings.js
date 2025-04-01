import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Settings.css';

const Settings = () => {
  const [user, setUser] = useState({});
  const [profilePics, setProfilePics] = useState([]);
  const [formData, setFormData] = useState({
    fullName: '',
    nickname: '',
    email: '',
    mobile: '',
    job: '',
    password1: '',
    password2: '',
    profilePic: ''
  });

  useEffect(() => {
    fetchUserData();
    fetchProfilePics();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await axios.get('/api/user');
      setUser(response.data);
      setFormData({
        fullName: response.data.full_name,
        nickname: response.data.nickname,
        email: response.data.email,
        mobile: response.data.mobile,
        job: response.data.job,
        profilePic: response.data.profile_pic
      });
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const fetchProfilePics = async () => {
    try {
      const response = await axios.get('/api/profile_pics');
      setProfilePics(response.data);
    } catch (error) {
      console.error('Error fetching profile pictures:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password1 !== formData.password2) {
      alert('Passwords do not match');
      return;
    }
    try {
      await axios.post('/api/user/update', formData);
      alert('Profile updated successfully');
      fetchUserData();
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleProfilePicChange = (e) => {
    setFormData({
      ...formData,
      profilePic: e.target.value
    });
  };

  return (
    <div className="settings-container">
      <h3 align="center">Settings</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="fullName">Full Name: {user.full_name}</label>
          <input
            type="text"
            className="form-control"
            id="fullName"
            name="fullName"
            placeholder="Change full name"
            value={formData.fullName}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label htmlFor="nickname">Nickname: {user.nickname}</label>
          <input
            type="text"
            className="form-control"
            id="nickname"
            name="nickname"
            placeholder="Change/ Add nickname"
            value={formData.nickname}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label htmlFor="email">Email Address: {user.email}</label>
          <input
            type="email"
            className="form-control"
            id="email"
            name="email"
            placeholder="Change email"
            value={formData.email}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label htmlFor="mobile">Phone Number: {user.mobile}</label>
          <input
            type="text"
            className="form-control"
            id="mobile"
            name="mobile"
            placeholder="Change/ Add mobile number"
            value={formData.mobile}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label htmlFor="job">Job Title: {user.job}</label>
          <input
            type="text"
            className="form-control"
            id="job"
            name="job"
            placeholder="Change/ Add job"
            value={formData.job}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label htmlFor="password1">Password *</label>
          <input
            type="password"
            className="form-control"
            id="password1"
            name="password1"
            placeholder="Change password"
            value={formData.password1}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label htmlFor="password2">Password (Confirm) *</label>
          <input
            type="password"
            className="form-control"
            id="password2"
            name="password2"
            placeholder="Confirm changing password"
            value={formData.password2}
            onChange={handleChange}
          />
        </div>
        <button type="button" id="selectProfilePicButton" className="btn btn-primary" onClick={() => document.getElementById('profilePicMenu').style.display = 'block'}>
          Select Profile Picture
        </button>
        <div id="profilePicMenu" className="profile-pic-menu" style={{ display: 'none' }}>
          <div className="profile-pic-options">
            {profilePics.map((pic) => (
              <label key={pic}>
                <input
                  type="radio"
                  name="profile_pic"
                  value={pic}
                  checked={pic === formData.profilePic}
                  onChange={handleProfilePicChange}
                />
                <img src={`/static/profile_pics/${pic}`} alt={pic} className="profile-pic-thumb" />
              </label>
            ))}
          </div>
        </div>
        <br />
        <button type="submit" className="btn btn-primary" name="submit">Save Changes</button>
      </form>
    </div>
  );
};

export default Settings;
