import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './MainPage.css';

const MainPage = () => {
  const [projects, setProjects] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProjects, setFilteredProjects] = useState([]);
  const navigate = useNavigate();

  // Fetch projects from the backend
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const projectsResponse = await axios.get('/api/projects', { validateStatus: false });

        // Check if the backend returned a 401 Unauthorized or 302 Found
        if (projectsResponse.status === 401 || projectsResponse.status === 302) {
          navigate('/login');
          return;
        }

        // Set the fetched data to state
        setProjects(projectsResponse.data || []);
        setFilteredProjects(projectsResponse.data || []);
      } catch (error) {
        console.error('Error fetching projects:', error);
        navigate('/login');
      }
    };

    fetchProjects();
  }, [navigate]);

  // Handle search and filter
  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    setFilteredProjects(
      projects.filter((project) =>
        project.name.toLowerCase().includes(query)
      )
    );
  };

  return (
    <div className="main-page-container">
      {/* Search and Filter Section */}
      <div className="search-filter-container">
        <input
          type="text"
          className="search-bar"
          placeholder="Search projects..."
          value={searchQuery}
          onChange={handleSearch}
        />
        <button className="filter-button">Filter</button>
      </div>

      <section className="project-list">
        <table>
          <thead>
            <tr>
              <th>Project name</th>
              <th>My Roles</th>
              <th>Last Modified</th>
              <th>Date</th>
              <th>Owner</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(filteredProjects) && filteredProjects.length > 0 ? (
              filteredProjects.map((project) => (
                <tr key={project.id}>
                  <td>
                    {project.name}{' '}
                    <span className={`status ${project.status}`}>
                      {project.status === 'success' ? '✔' : '!'}
                    </span>
                  </td>
                  <td>{project.role}</td>
                  <td>{project.lastModified || 'N/A'}</td>
                  <td>{project.date || 'N/A'}</td>
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
