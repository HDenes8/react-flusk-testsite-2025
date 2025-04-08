import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './MainPage.css';

const Projects = () => {
  const [projects, setProjects] = useState([]); // Store project roles
  const [user, setUser] = useState(null); // Store user data
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [menuOpen, setMenuOpen] = useState(null);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProjectsData = async () => {
      try {
        const response = await axios.get('/api/mainpage', { validateStatus: false });

        if (response.status === 401 || response.status === 302) {
          navigate('/login');
          return;
        }

        // Set user and filter projects to only include "owner" roles
        setUser(response.data.user);
        const ownerProjects = (response.data.roles || []).filter(
          (project) => project.role.toLowerCase() === 'owner'
        );
        setProjects(ownerProjects);
        setFilteredProjects(ownerProjects);
      } catch (error) {
        console.error('Error fetching projects data:', error);
        navigate('/login');
      }
    };

    fetchProjectsData();
  }, [navigate]);

  useEffect(() => {
    // Close menu when clicking outside of it
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    filterProjects(query);
  };

  const filterProjects = (query) => {
    let filtered = projects;

    if (query) {
      filtered = filtered.filter((project) =>
        project.project_name.toLowerCase().includes(query)
      );
    }

    setFilteredProjects(filtered);
  };

  const toggleMenu = (projectId) => {
    setMenuOpen(menuOpen === projectId ? null : projectId);
  };

  const openProject = (projectId) => {
    navigate(`/ProjectsPage/${projectId}`);
  };

  return (
    <div className="main-page-container">

      <div className="search-filter-container">
        <input
          type="text"
          className="search-bar"
          placeholder="Search projects..."
          value={searchQuery}
          onChange={handleSearch}
        />
      </div>

      <section className="project-list">
        <table>
          <thead>
            <tr>
              <th>Project Name</th>
              <th>My Roles</th>
              <th>Last Modified</th>
              <th>Date</th>
              <th>Owner</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProjects.length > 0 ? (
              filteredProjects.map((project) => (
                <tr key={project.project_id}>
                  <td>
                    {project.project_name}{' '}
                    <span className={`status ${project.status || 'unknown'}`}>
                      {project.status === 'success' ? '✔' : '!'}
                    </span>
                  </td>
                  <td>{project.role}</td>
                  <td>{project.last_modified_date || '-'}</td>
                  <td>{project.created_date || '-'}</td>
                  <td>
                    <img
                      src={user.profile_pic || '/static/profile_pics/default.png'}
                      alt={project.creator_name || 'Unknown'}
                      className="owner-avatar"
                    />
                    <span className="ownername">{project.creator_name || 'Unknown'}</span>
                  </td>
                  <td className="actions">
                    <button className="dots-button" onClick={() => toggleMenu(project.project_id)}>⋯</button>
                    {menuOpen === project.project_id && (
                      <div ref={menuRef} className="horizontal-menu">
                        <span>{project.description || 'No description available'}</span>
                        <button className="open-project-button" onClick={() => openProject(project.project_id)}>Open Project</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6">No projects found</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
};

export default Projects;
