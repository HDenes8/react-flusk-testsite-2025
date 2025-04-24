import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import "./MembersPage.css"


const MembersPage = () => {
  const navigate = useNavigate();

  const { project_id } = useParams();
  const [members, setMembers] = useState([]);
  const [error, setError] = useState(null);
  const [projectName, setProjectName] = useState(""); 
  const [userId, setUserId] = useState(null);         


  const fetchMembers = async () => {
    try {
      const response = await axios.get(`/api/projects/${project_id}/members`, { withCredentials: true });
      setMembers(response.data.members);
    } catch (err) {
      console.error("Error fetching members:", err);
      setError("Failed to load members.");
    }
  };

  // On page load
  useEffect(() => {
    fetch(`/api/projects/${project_id}/members`)
      .then(res => res.json())
      .then(data => {
        setProjectName(data.project_name);
        setUserId(data.user_id);
        setMembers(data.members); // includes correct role from backend
      });
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
      // Optionally, refresh the members list
      fetchMembers();
    } catch (err) {
      console.error("Error inviting member:", err);
      alert(err.response?.data?.error || "Failed to send invitation.");
    }
  };

  const handleRemoveMember = () => {
    alert("Remove Member");

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
      // Optionally, refresh the members list
      fetchMembers();
    } catch (err) {
      console.error("Error changing role:", err);
      alert(err.response?.data?.error || "Failed to change role.");
    }
  };

  const handleSettings = () => {
    navigate("/settings");
  };

  if (error) {
    return <p className="error-message">{error}</p>;
  }

  return (
    <div className="members-page-container">
      <div className="top-buttons">
        <button onClick={handleInviteMember}>Invite Member</button>
        <button onClick={() => alert("Remove Member")}>Remove Member</button>
        <button onClick={() => alert("Settings")}>Settings</button>
      </div>  
      <h1>Members</h1>
      <h1>{projectName}</h1>

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
                <td>
                  <select
                    value={member.role}
                    onChange={(e) => handleChangeRole(member.id, e.target.value)}
                  >
                    <option value="owner">Owner</option>
                    <option value="admin">Admin</option>
                    <option value="editor">Editor</option>
                    <option value="reader">Reader</option>
                  </select>
                </td>
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