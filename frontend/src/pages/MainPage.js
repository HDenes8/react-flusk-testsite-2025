import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './MainPage.css';

const MainPage = () => {
  const [projects, setProjects] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [menuOpen, setMenuOpen] = useState(null);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const projectsResponse = await axios.get('/api/projects', { validateStatus: false });

        if (projectsResponse.status === 401 || projectsResponse.status === 302) {
          navigate('/login');
          return;
        }

        setProjects(projectsResponse.data || []);
        setFilteredProjects(projectsResponse.data || []);
      } catch (error) {
        console.error('Error fetching projects:', error);
        navigate('/login');
      }
    };

    fetchProjects();
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
        project.name.toLowerCase().includes(query)
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

  const openProject = () => {
    navigate('/ProjectsPage');
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
                <tr key={project.id}>
                  <td>
                    {project.name}{' '}
                    <span className={`status ${project.status}`}>
                      {project.status === 'success' ? '✔' : '!' }
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
                    <span className="ownername">{project.ownerName}</span>
                  </td>
                  <td className="actions">
                    <button className="dots-button" onClick={() => toggleMenu(project.id)}>⋯</button>
                    {menuOpen === project.id && (
                      <div ref={menuRef} className="horizontal-menu">
                        <span>{project.description || 'No description available'}</span>
                        <button className="open-project-button" onClick={openProject}>Open Project</button>
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
