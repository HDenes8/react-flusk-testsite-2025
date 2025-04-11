import React from "react";
import "./MembersPage.css"

const members = [
  { id: 1, name: "Dénes", role: "Developer", email: "denes@example.com" },
  { id: 2, name: "Anna", role: "Designer", email: "anna@example.com" },
  { id: 3, name: "Tom", role: "Project Manager", email: "tom@example.com" },
];

const MembersPage = () => {
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
          {members.map((member) => (
            <tr key={member.id}>
              <td>{member.id}</td>
              <td>{member.name}</td>
              <td>{member.role}</td>
              <td>{member.email}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MembersPage;