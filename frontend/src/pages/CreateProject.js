import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './CreateProject.css';



const CreateProject = () => {
  const navigate = useNavigate(); // ✅ This was missing!
  const [formData, setFormData] = useState({
    projectName: '',
    description: '',
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
      await axios.post('/create-project', formData, { withCredentials: true });
      alert('Project created successfully');
      navigate('/MyProjectsPage'); // ✅ This will now work
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
          <label htmlFor="projectName">Project Name: *</label>
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
          <label htmlFor="description">Description: *</label>
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
        <div className="form-group-email">
          <label htmlFor="inviteEmail">Emails to invite: <p className="attention">make sure you leave a comma (,) mark between the emails!</p></label>
          <textarea
            rows="4"
            cols="50"
            type="text"
            className="form-control-email"
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
