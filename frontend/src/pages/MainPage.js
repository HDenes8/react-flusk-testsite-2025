import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './MainPage.css';

const MainPage = () => {
  const [projects, setProjects] = useState([]); // Store project roles
  const [user, setUser] = useState(null); // Store user data
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [menuOpen, setMenuOpen] = useState(null);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMainPageData = async () => {
      try {
        const response = await axios.get('/api/mainpage', { validateStatus: false });

        if (response.status === 401 || response.status === 302) {
          navigate('/login');
          return;
        }

        // Set user and project data
        setUser(response.data.user);
        setProjects(response.data.roles || []);
        setFilteredProjects(response.data.roles || []);
      } catch (error) {
        console.error('Error fetching main page data:', error);
        navigate('/login');
      }
    };

    fetchMainPageData();
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
    filterProjects(query, selectedRole);
  };

  const handleRoleFilter = (e) => {
    setSelectedRole(e.target.value);
    filterProjects(searchQuery, e.target.value);
  };

  const filterProjects = (query, role) => {
    let filtered = projects;

    if (query) {
      filtered = filtered.filter((project) =>
        project.project_name.toLowerCase().includes(query)
      );
    }

    if (role) {
      filtered = filtered.filter((project) => project.role === role);
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

        <select className="filter-dropdown" value={selectedRole} onChange={handleRoleFilter}>
          <option value="">All Roles</option>
          {[...new Set(projects.map((project) => project.role))].map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
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
                      src={`/static/profile_pics/${project.creator_profile_picture || 'default.png'}`}
                      
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

export default MainPage;
