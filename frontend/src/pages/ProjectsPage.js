import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './ProjectsPage.css';

const ProjectsPage = () => {
  const [projects, setProjects] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await axios.get('/api/projects', { validateStatus: false });
        
        if (response.status === 401 || response.status === 302) {
          navigate('/login');
          return;
        }

        setProjects(response.data || []);
      } catch (error) {
        console.error('Error fetching projects:', error);
        navigate('/login');
      }
    };

    fetchProjects();
  }, [navigate]);

  return (
    <div className="projects-container">
      <div className="projects-header">
        <h2>My Projects</h2>
        <button className="new-project-btn" onClick={() => navigate('/new-project')}>
          New Project
        </button>
      </div>

      <div className="projects-grid">
        {projects.map(project => (
          <div key={project.id} className="project-card">
            <h3>{project.name}</h3>
            <p>{project.description}</p>
            <div className="project-meta">
              <span>Role: {project.role}</span>
              <span>Last modified: {project.lastModified}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProjectsPage;
