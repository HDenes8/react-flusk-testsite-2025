import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './invitation.css';

const Invitation = () => {
  const [invitations, setInvitations] = useState([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchInvitations();
  }, []);

  const fetchInvitations = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/invitations');
      setInvitations(response.data);
    } catch (error) {
      console.error('Error fetching invitations:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/api/invitations', {
        name,
        email,
        message
      });
      setInvitations([...invitations, response.data]);
      setName('');
      setEmail('');
      setMessage('');
    } catch (error) {
      console.error('Error creating invitation:', error);
    }
  };

  return (
    <div className="invitation-container">
      <h1>Invitation System</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Name:</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Message:</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
          />
        </div>
        <button type="submit">Send Invitation</button>
      </form>
      <h2>Invitations</h2>
      <ul>
        {invitations.map((invitation) => (
          <li key={invitation.id}>
            <strong>{invitation.name}</strong> ({invitation.email}) - {invitation.message} <em>{invitation.date}</em>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Invitation;
