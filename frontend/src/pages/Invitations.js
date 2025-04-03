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
      const response = await axios.get('/invitations', { withCredentials: true });
      setInvitations(response.data.invitations);
    } catch (error) {
      console.error('Error fetching invitations:', error);
    }
  };

  const acceptInvitation = async (invitationId) => {
    try {
      await axios.post(`/accept_invite/${invitationId}`, {}, { withCredentials: true });
      fetchInvitations(); // Refresh the list of invitations
      navigate('/projects'); // Redirect to the projects page after accepting an invitation
    } catch (error) {
      console.error('Error accepting invitation:', error);
    }
  };

  const denyInvitation = async (invitationId) => {
    try {
      await axios.post(`/deny_invite/${invitationId}`, {}, { withCredentials: true });
      fetchInvitations(); // Refresh the list of invitations
    } catch (error) {
      console.error('Error denying invitation:', error);
    }
  };

  return (
    <div className="invitations-container">
    <section className="project-list">
      {invitations.length > 0 ? (
        <table>
          <thead>
            <tr>
              <th>Project Name</th>
              <th>Status</th>
              <th>Invite Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {invitations.map((invite) => (
              <tr key={invite.id}>
                <td>{invite.project_name}</td>
                <td>{invite.status}</td>
                <td>{invite.invite_date}</td>
                <td>
                  <button onClick={() => acceptInvitation(invite.id)}>Accept</button>
                  <button onClick={() => denyInvitation(invite.id)}>Deny</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No invitations found</p>
      )}
    </section>
    </div>
  );
};

export default Invitations;
