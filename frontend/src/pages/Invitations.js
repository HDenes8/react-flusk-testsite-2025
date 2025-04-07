import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Invitations.css';

const Invitations = () => {
  const [invitations, setInvitations] = useState([]);
  const [filter, setFilter] = useState('pending'); // default to "pending"
  const navigate = useNavigate();

  useEffect(() => {
    fetchInvitations();
  }, []);

  const fetchInvitations = async (status = 'pending') => {
    try {
      const response = await axios.get(`/invitations?status=${status}`, { withCredentials: true });
      setInvitations(response.data.invitations);
    } catch (error) {
      console.error('Error fetching invitations:', error);
    }
  };
  

  const acceptInvitation = async (invitationId) => {
    try {
      await axios.post(`/accept_invite/${invitationId}`, {}, { withCredentials: true });
      fetchInvitations();
      navigate('/MainPage'); // Redirect to MainPage after accepting the invitation
    } catch (error) {
      console.error('Error accepting invitation:', error);
    }
  };

  const denyInvitation = async (invitationId) => {
    try {
      await axios.post(`/deny_invite/${invitationId}`, {}, { withCredentials: true });
      fetchInvitations();
    } catch (error) {
      console.error('Error denying invitation:', error);
    }
  };

  const filteredInvitations = invitations.filter(
    (invite) => invite.status.toLowerCase() === filter
  );

  return (
    <div className="invitations-container">
      <div className="filter-buttons">
  <button
    className={filter === 'pending' ? 'active' : ''}
    onClick={() => { setFilter('pending'); fetchInvitations('pending'); }}
  >
    Pending
  </button>
  <button
    className={filter === 'accepted' ? 'active' : ''}
    onClick={() => { setFilter('accepted'); fetchInvitations('accepted'); }}
  >
    Accepted
  </button>
  <button
    className={filter === 'declined' ? 'active' : ''}
    onClick={() => { setFilter('declined'); fetchInvitations('declined'); }}
  >
    Declined
  </button>
</div>


      <section className="project-list invitation-list">
        {filteredInvitations.length > 0 ? (
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
              {filteredInvitations.map((invite) => (
                <tr key={invite.id}>
                  <td>{invite.project_name}</td>
                  <td>{invite.status}</td>
                  <td>{invite.invite_date}</td>
                  <td>
                    {filter === 'pending' && (
                      <>
                        <button onClick={() => acceptInvitation(invite.id)}>Accept</button>
                        <button onClick={() => denyInvitation(invite.id)}>Deny</button>
                      </>
                    )}
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
