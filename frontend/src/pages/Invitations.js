import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/Invitations.module.css'; // Updated to scoped styles
import FormattedDate from '../components/FormattedDate'; // adjust if needed

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
    <div className={styles['invitations-container']}>
      <div className={styles['filter-buttons']}>
        <button
          className={`${styles['pending']} ${filter === 'pending' ? styles['active'] : ''}`}
          onClick={() => {
            setFilter('pending');
            fetchInvitations('pending');
          }}
        >
          Pending
        </button>
        <button
          className={`${styles['accepted']} ${filter === 'accepted' ? styles['active'] : ''}`}
          onClick={() => {
            setFilter('accepted');
            fetchInvitations('accepted');
          }}
        >
          Accepted
        </button>
        <button
          className={`${styles['declined']} ${filter === 'declined' ? styles['active'] : ''}`}
          onClick={() => {
            setFilter('declined');
            fetchInvitations('declined');
          }}
        >
          Declined
        </button>
      </div>

      <section className={`${styles['project-list']} ${styles['invitation-list']}`}>
        {filteredInvitations.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Project Name</th>
                <th>Invited By</th> 
                <th>Invite Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvitations.map((invite) => (
                <tr key={invite.id}>
                  <td>{invite.project_name}</td>
                  <td>
                    <img
                      src={invite.profile_pic}
                    />
                    {invite.referrer_nickname}#{invite.referrer_nickname_id}</td>
                  <td>{invite.status}</td>
                  <td>
                    {invite.invite_date ? <FormattedDate dateInput={invite.invite_date} /> : '-'}
                  </td>
                  <td>{invite.status}</td>
                  <td>
                    {filter === 'pending' && (
                      <div className={styles['invitation-actions']}>
                        <button
                          className={styles['btn-accept']}
                          onClick={() => acceptInvitation(invite.id)}
                        >
                          Accept
                        </button>
                        <button
                          className={styles['btn-deny']}
                          onClick={() => denyInvitation(invite.id)}
                        >
                          Deny
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className={styles['noinv']}>No invitations found.</p>
        )}
      </section>
    </div>
  );
};

export default Invitations;
