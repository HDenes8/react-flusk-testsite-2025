import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import "./MembersPage.css"


const MembersPage = () => {
  const navigate = useNavigate();

  const handleInviteMember = () => {
    alert("Invite Member");

  };

  const handleRemoveMember = () => {
    alert("Remove Member");

  };

  const handleSettings = () => {
    navigate("/settings");
  };

  const { project_id } = useParams();
  const [members, setMembers] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const response = await axios.get(`/api/projects/${project_id}/members`, { withCredentials: true });
        setMembers(response.data.members);
      } catch (err) {
        console.error("Error fetching members:", err);
        setError("Failed to load members.");
      }
    };

    fetchMembers();
  }, [project_id]);

  if (error) {
    return <p className="error-message">{error}</p>;
  }

  return (
    <div className="members-page-container">
      <div className="top-buttons">
        <button onClick={() => alert("Invite Member")}>Invite Member</button>
        <button onClick={() => alert("Remove Member")}>Remove Member</button>
        <button onClick={() => alert("Settings")}>Settings</button>
      </div>  
      <h1>Members</h1>
      <table className="members-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Role</th>
            <th>Email</th>
          </tr>
        </thead>
        <tbody>
          {members.length > 0 ? (
            members.map((member) => (
              <tr key={member.id}>
                <td>{member.id}</td>
                <td>{member.name}</td>
                <td>{member.role}</td>
                <td>{member.email}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" style={{ textAlign: "center" }}>No members found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default MembersPage;