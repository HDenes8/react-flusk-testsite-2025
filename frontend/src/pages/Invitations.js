import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import './Invitations.css';

const Invitations = () => {
  const [invitations, setInvitations] = useState([]);
  const navigate = useNavigate();

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

  const acceptInvitation = async (invitationId) => {
    try {
      await axios.post(`http://localhost:5000/api/invitations/${invitationId}/accept`);
      fetchInvitations(); // Refresh the list of invitations
      navigate('/projects'); // Redirect to the projects page after accepting an invitation
    } catch (error) {
      console.error('Error accepting invitation:', error);
    }
  };

  return (
    <div className="invitations-container">
      <h1>Invitations</h1>
      {invitations.length > 0 ? (
        invitations.map((invite) => (
          <div key={invite.invitation_id} className="invitation">
            <p>Project: {invite.project.name}</p>
            <p>Invited by: {invite.referrer.full_name}</p>
            <button onClick={() => acceptInvitation(invite.invitation_id)}>Accept</button>
          </div>
        ))
      ) : (
        <p>No invitations found</p>
      )}
      <Link to="/projects">Back to Projects</Link>
    </div>
  );
};

export default Invitations;
