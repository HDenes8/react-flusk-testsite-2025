import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './MainPage.css';

const MainPage = () => {
  const [projects, setProjects] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  // Fetch projects from the backend
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const projectsResponse = await axios.get('/api/projects', { validateStatus: false });
  
        if (projectsResponse.status === 401 || projectsResponse.status === 302) {
          navigate('/login');
          return;
        }
  
        // Case-insensitive role filtering
        const ownerProjects = (projectsResponse.data || []).filter(project => 
          project.role.toLowerCase() === 'owner'
        );
  
        setProjects(ownerProjects);
      } catch (error) {
        console.error('Error fetching projects:', error);
        navigate('/login');
      }
    };
  
    fetchProjects();
  }, [navigate]);
  
  // Handle search
  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
  };

  // Filtered list based on search
  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(searchQuery)
  );

  return (
    <div className="main-page-container">
      {/* Search Bar */}
      <div className="search-filter-container">
        <input
          type="text"
          className="search-bar"
          placeholder="Search projects..."
          value={searchQuery}
          onChange={handleSearch}
        />
      </div>

      {/* Project List */}
      <section className="project-list">
        <table>
          <thead>
            <tr>
              <th>Project Name</th>
              <th>My Role</th>
              <th>Last Modified</th>
              <th>Date</th>
              <th>Owner</th>
            </tr>
          </thead>
          <tbody>
            {filteredProjects.length > 0 ? (
              filteredProjects.map((project) => (
                <tr key={project.id}>
                  <td>
                    {project.name}{' '}
                    <span className={`status ${project.status}`}>
                      {project.status === 'success' ? '✔' : '!'}
                    </span>
                  </td>
                  <td>{project.role}</td>
                  <td>{project.lastModified || '-'}</td>
                  <td>{project.date || '-'}</td>
                  <td>
                    <img
                      src={project.ownerAvatar}
                      alt={project.ownerName}
                      className="owner-avatar"
                    />
                    <span>{project.ownerName}</span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5">No projects found</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
};

export default MainPage;
