import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import "./MembersPage.css"

const MembersPage = () => {
  const navigate = useNavigate();
  const { project_id } = useParams();
  const [members, setMembers] = useState([]);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(""); // <-- NEW

  const fetchMembers = async () => {
    try {
      const response = await axios.get(`/api/projects/${project_id}/members`, { withCredentials: true });
      setMembers(response.data.members);
      setUserRole(response.data.current_user_role); // <-- NEW
    } catch (err) {
      console.error("Error fetching members:", err);
      setError("Failed to load members.");
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [project_id]);

  const handleInviteMember = async () => {
    const email = prompt("Enter the email of the member to invite:");
    if (!email) {
      alert("Email is required.");
      return;
    }
    try {
      const response = await axios.post(
        `/api/projects/${project_id}/invite`,
        { email },
        { withCredentials: true }
      );
      alert(response.data.message);
      fetchMembers();
    } catch (err) {
      console.error("Error inviting member:", err);
      alert(err.response?.data?.error || "Failed to send invitation.");
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm("Are you sure you want to remove this member?")) {
      return;
    }
    try {
      const response = await axios.post(
        `/api/projects/${project_id}/remove-user`,
        { user_id: userId },
        { withCredentials: true }
      );
      alert(response.data.message);
      fetchMembers();
    } catch (err) {
      console.error("Error removing member:", err);
      alert(err.response?.data?.error || "Failed to remove member.");
    }
  };

  const handleChangeRole = async (userId, newRole) => {
    if (!newRole) {
      alert("Role is required.");
      return;
    }
    try {
      const response = await axios.post(
        `/api/projects/${project_id}/change-role`,
        { user_id: userId, role: newRole },
        { withCredentials: true }
      );
      alert(response.data.message);
      fetchMembers();
    } catch (err) {
      console.error("Error changing role:", err);
      alert(err.response?.data?.error || "Failed to change role.");
    }
  };

  const handleSettings = () => {
    navigate("/settings");
  };

  
  const handleBack = () => {
    navigate(`/ProjectsPage/${project_id}`);
  };

  if (error) {
    return <p className="error-message">{error}</p>;
  }

  return (
    <div className="members-page-container">
      <div className="top-buttons">
        <button onClick={handleBack}>Back</button>
        <button onClick={handleInviteMember}>Invite Member</button>
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
            <th></th>
          </tr>
        </thead>
        <tbody>
          {members.length > 0 ? (
            members.map((member) => (
              <tr key={member.id}>
                <td>{member.id}</td>
                <td>{member.name}</td>
                <td>
                  <select
                    value={member.role}
                    onChange={(e) => handleChangeRole(member.id, e.target.value)}
                    disabled={
                      member.role === 'owner' || 
                      (userRole !== 'owner' && userRole !== 'admin') || 
                      (userRole === 'admin' && member.role === 'admin') // admin can't edit another admin
                    }
                  >
                    {/* Show "owner" as a visible but unselectable option */}
                    <option value="owner" disabled>Owner</option>
                    <option value="admin">Admin</option>
                    <option value="editor">Editor</option>
                    <option value="reader">Reader</option>
                  </select>
                </td>
                <td>{member.email}</td>
                <td>
                  <div className="remove-buttons">
                    {member.role !== 'owner' && ( // Hide the button for users with the "owner" role
                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        disabled={
                          (userRole !== 'owner' && userRole !== 'admin') || 
                          (userRole === 'admin' && member.role === 'admin') // admin can't remove another admin
                        }
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </td>
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
