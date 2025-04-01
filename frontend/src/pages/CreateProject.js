import React, { useState } from 'react';
import axios from 'axios';
import {} from 'react-router-dom';
import './CreateProject.css';

const CreateProject = () => {
  const [formData, setFormData] = useState({
    projectName: '',
    description: '',
    inviteUsers: '',
    inviteEmail: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/projects', formData);
      alert('Project created successfully');
      setFormData({
        projectName: '',
        description: '',
        inviteUsers: '',
        inviteEmail: ''
      });
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Failed to create project');
    }
  };

  return (
    <div className="create-project-container">
      <h3 align="center">Create New Project</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="projectName">Project Name *</label>
          <input
            type="text"
            className="form-control"
            id="projectName"
            name="projectName"
            placeholder="Enter project name"
            value={formData.projectName}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="description">Description *</label>
          <input
            type="text"
            className="form-control"
            id="description"
            name="description"
            placeholder="Enter description"
            value={formData.description}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="inviteUsers">Invite Other Users</label>
          <input
            type="text"
            className="form-control"
            id="inviteUsers"
            name="inviteUsers"
            placeholder="Select User"
            value={formData.inviteUsers}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label htmlFor="inviteEmail">Emails to invite</label>
          <input
            type="text"
            className="form-control"
            id="inviteEmail"
            name="inviteEmail"
            placeholder="Enter email"
            value={formData.inviteEmail}
            onChange={handleChange}
          />
        </div>
        <br />
        <button type="submit" className="btn btn-primary">Create Project</button>
      </form>
    </div>
  );
};

export default CreateProject;
