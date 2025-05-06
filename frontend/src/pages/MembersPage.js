import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import "./MembersPage.css";

const MembersPage = () => {
  const navigate = useNavigate();
  const { project_id } = useParams();
  const [members, setMembers] = useState([]);
  const [error, setError] = useState(null);
  const [projectName, setProjectName] = useState("");
  const [userRole, setUserRole] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

  const fetchMembers = async () => {
    try {
      const response = await axios.get(`/api/projects/${project_id}/members`, {
        withCredentials: true,
      });

      const roleOrder = { owner: 1, admin: 2, editor: 3, reader: 4 }; // Define the custom order
      const sortedMembers = response.data.members.sort((a, b) => {
        // First, sort by role order
        const roleComparison = roleOrder[a.role] - roleOrder[b.role];
        if (roleComparison !== 0) {
          return roleComparison;
        }
        // If roles are the same, sort alphabetically by name
        return a.name.localeCompare(b.name);
      });

      setMembers(sortedMembers);
      setUserRole(response.data.current_user_role);
      setProjectName(response.data.project_name || "");
      setCurrentUser(response.data.current_user || null);
    } catch (err) {
      if (err.response && err.response.status === 403) {
        navigate("/mainpage");
      } else {
        console.error("Error fetching members:", err);
        setError("Failed to load members.");
      }
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [project_id]);

  const handleInviteMember = async () => {
    const emailInput = prompt("Enter the email(s) to invite (comma-separated):");
    if (!emailInput) {
      alert("Email is required.");
      return;
    }

    const emailList = emailInput.split(",").map(email => email.trim()).filter(email => email);

    if (emailList.length === 0) {
      alert("No valid emails entered.");
      return;
    }

    let errors = [];

    for (let email of emailList) {
      try {
        const response = await axios.post(
          `/api/projects/${project_id}/invite`,
          { email },
          { withCredentials: true }
        );
        alert(`Invited ${email}: ${response.data.message}`);
      } catch (err) {
        console.error(`Error inviting ${email}:`, err);
        errors.push(`${email}: ${err.response?.data?.error || "Failed to invite."}`);
      }
    }

    if (errors.length > 0) {
      alert("Some errors occurred:\n" + errors.join("\n"));
    }

    fetchMembers();
  };

  const handleRemoveMember = async (userId) => {
    const isSelf = userId === currentUser?.id;
    const confirmationMessage = isSelf
      ? "Are you sure you want to leave this project?"
      : "Are you sure you want to remove this member?";

    if (!window.confirm(confirmationMessage)) return;

    console.log("Attempting to remove user:", userId); // Debugging log

    try {
      const response = await axios.post(
        `/api/projects/${project_id}/remove-user`,
        { user_id: userId },
        { withCredentials: true }
      );
      alert(response.data.message);

      if (isSelf) {
        navigate("/mainpage"); // Redirect the user after leaving the project
      } else {
        fetchMembers(); // Refresh the members list
      }
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

  if (error) return <p className="error-message">{error}</p>;

  return (
    <div className="members-page-container">
      <div className="top-buttons">
      <button onClick={handleBack}>Back</button>
        {(userRole === "owner" || userRole === "admin") && (
          <button onClick={handleInviteMember}>Invite Member</button>
        )}
        <button onClick={handleSettings}>Settings</button>
      </div>

      <h1>Members</h1>

      <table className="members-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Role</th>
            <th>Email</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {members.length > 0 ? (
            members.map((member) => {
              const isSelf = member.id === currentUser?.id;
              const isOwner = member.role === "owner";
              const isAdmin = member.role === "admin";

              const canChangeRole =
                !isSelf &&
                ((userRole === "owner") ||
                  (userRole === "admin" && !isOwner && !isAdmin));

              const canRemove =
                !isSelf &&
                ((userRole === "owner" && !isOwner) ||
                  (userRole === "admin" && !isAdmin && !isOwner));

              return (
                <tr key={member.id}>
                  <td>{member.id}</td>
                  <td>{member.name}</td>
                  <td>
                    <select
                      value={member.role}
                      onChange={(e) => handleChangeRole(member.id, e.target.value)}
                      disabled={!canChangeRole || isOwner} // Disable if the member is an owner
                    >
                      <option value="owner" disabled>Owner</option> {/* Always disable the owner option */}
                      <option value="admin">Admin</option>
                      <option value="editor">Editor</option>
                      <option value="reader">Reader</option>
                    </select>
                  </td>
                  <td>{member.email}</td>
                  <td>
                    <div className="remove-buttons">
                      {!isOwner && ( // Hide the button if the member is an owner
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          disabled={isSelf && userRole === "owner"} // Prevent owner from leaving
                        >
                          {isSelf ? "Leave" : "Remove"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan="5" style={{ textAlign: "center" }}>No members found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default MembersPage;
