import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from '../styles/Settings.module.css'; // Updated to scoped styles

const Settings = () => {
  const [user, setUser] = useState({});
  const [profilePics, setProfilePics] = useState([]);
  const [formData, setFormData] = useState({
    fullName: '',
    nickname: '',
    email: '',
    mobile: '',
    job: '',
    currentPassword: '',
    password1: '',
    password2: '',
    profilePic: '',
    nicknameId: '' // Added nicknameId
  });

  const [errors, setErrors] = useState({
    currentPassword: false,
    password1: false,
    password2: false
  });

  useEffect(() => {
    fetchUserData();
    fetchProfilePics();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await axios.get('/api/user');
      console.log('Fetched user data:', response.data);
      setUser(response.data);
      setFormData({
        fullName: response.data.full_name || '',
        nickname: response.data.nickname || '',
        email: response.data.email || '',
        mobile: response.data.mobile || '',
        job: response.data.job || '',
        currentPassword: '',
        password1: '',
        password2: '',
        profilePic: response.data.profile_pic || '',
        nicknameId: response.data.nickname_id || '' // Added nickname_id
      });
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const fetchProfilePics = async () => {
    try {
      const response = await axios.get('/api/profile_pics');
      console.log('Fetched profile pics:', response.data);
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
    setErrors({
      ...errors,
      [name]: false
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password1 !== formData.password2) {
      setErrors({ ...errors, password2: true });
      alert('Passwords do not match');
      return;
    }

    try {
      await axios.post('/api/user/update', formData);
      alert('Profile updated successfully');
      fetchUserData();
    } catch (error) {
      console.error('Error updating profile:', error);
      const err = error.response?.data?.error || '';
      const updatedErrors = {
        currentPassword: false,
        password1: false,
        password2: false
      };

      if (
        err === 'Current password is required.' ||
        err === 'Current password is incorrect.'
      ) {
        updatedErrors.currentPassword = true;
      }
      if (err === "Passwords don't match.") {
        updatedErrors.password1 = true;
        updatedErrors.password2 = true;
      }
      if (err === "Password can't be the old one.") {
        updatedErrors.password1 = true;
      }
      if (err === 'Password must be at least 7 characters.') {
        updatedErrors.password1 = true;
      }

      setErrors(updatedErrors);
      alert(err);
    }
  };

  const handleProfilePicChange = (e) => {
    setFormData({
      ...formData,
      profilePic: e.target.value
    });
  };

  return (
    <div className={styles['settings-container']}>
      <form onSubmit={handleSubmit}>
        <div className={styles['form-group']}>
          <label htmlFor="fullName">Full Name:</label>
          <input
            type="text"
            className={styles['form-control']}
            id="fullName"
            name="fullName"
            placeholder="Change full name"
            value={formData.fullName}
            onChange={handleChange}
          />
        </div>
        <div className={`${styles['form-group']} ${styles['flex-row']}`}>
          <div className={styles['nickname-container']}>
            <label htmlFor="nickname">Nickname:</label>
            <input
              type="text"
              className={styles['form-control']}
              id="nickname"
              name="nickname"
              placeholder="Change/ Add nickname"
              value={formData.nickname}
              onChange={handleChange}
            />
          </div>
          <div className={styles['nickname-id-container']}>
            <label htmlFor="nicknameId">Nickname ID:</label>
            <input
              type="text"
              className={styles['form-control']}
              id="nicknameId"
              name="nicknameId"
              value={`#${formData.nicknameId}`}
              readOnly
            />
          </div>
        </div>
        <div className={styles['form-group']}>
          <label htmlFor="email">Email Address:</label>
          <input
            type="email"
            className={styles['form-control']}
            id="email"
            name="email"
            placeholder="Change email"
            value={formData.email}
            onChange={handleChange}
          />
        </div>
        <div className={styles['form-group']}>
          <label htmlFor="mobile">Phone Number:</label>
          <input
            type="text"
            className={styles['form-control']}
            id="mobile"
            name="mobile"
            placeholder="Change/ Add mobile number"
            value={formData.mobile}
            onChange={handleChange}
          />
        </div>
        <div className={styles['form-group']}>
          <label htmlFor="job">Job Title:</label>
          <input
            type="text"
            className={styles['form-control']}
            id="job"
            name="job"
            placeholder="Change/ Add job"
            value={formData.job}
            onChange={handleChange}
          />
        </div>
        <div className={styles['form-group']}>
          <label htmlFor="currentPassword">Current Password *</label>
          <input
            type="password"
            className={`${styles['form-control']} ${errors.currentPassword ? styles['is-invalid'] : ''}`}
            id="currentPassword"
            name="currentPassword"
            placeholder="Current password"
            value={formData.currentPassword}
            onChange={handleChange}
          />
        </div>
        <div className={styles['form-group']}>
          <label htmlFor="password1">Password *</label>
          <input
            type="password"
            className={`${styles['form-control']} ${errors.password1 ? styles['is-invalid'] : ''}`}
            id="password1"
            name="password1"
            placeholder="Change password"
            value={formData.password1}
            onChange={handleChange}
          />
        </div>
        <div className={styles['form-group']}>
          <label htmlFor="password2">Password (Confirm) *</label>
          <input
            type="password"
            className={`${styles['form-control']} ${errors.password2 ? styles['is-invalid'] : ''}`}
            id="password2"
            name="password2"
            placeholder="Confirm changing password"
            value={formData.password2}
            onChange={handleChange}
          />
        </div>
        <button
          type="button"
          id="selectProfilePicButton"
          className={styles['btn-primary']}
          onClick={() => document.getElementById('profilePicMenu').style.display = 'block'}
        >
          Select Profile Picture
        </button>
        <div id="profilePicMenu" className={styles['profile-pic-menu']} style={{ display: 'none' }}>
          <div className={styles['profile-pic-options']}>
            {profilePics.length > 0 ? (
              profilePics.map((pic) => (
                <label key={pic}>
                  <input
                    type="radio"
                    name="profilePic"
                    value={pic}
                    checked={pic === formData.profilePic}
                    onChange={handleProfilePicChange}
                  />
                  <img src={`/static/profile_pics/${pic}`} alt={pic} className={styles['profile-pic-thumb']} />
                </label>
              ))
            ) : (
              <p>No profile pictures available</p>
            )}
          </div>
        </div>
        <br />
        <button type="submit" className={styles['btn-primary']} name="submit">
          Save Changes
        </button>
      </form>
    </div>
  );
};

export default Settings;
