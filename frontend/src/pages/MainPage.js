import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import './MainPage.css';
import FormattedDate from '../components/FormattedDate'; // adjust if needed

const MainPage = ({ defaultRoleFilter = '', showFilterDropdown = true }) => {
  const [projects, setProjects] = useState([]);
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [selectedRole, setSelectedRole] = useState(defaultRoleFilter);
  const [menuOpen, setMenuOpen] = useState(null);
  const [selectedFileIds, setSelectedFileIds] = useState([]); // Added this line
  const menuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('/api/mainpage', { validateStatus: false });
        if (response.status === 401 || response.status === 302) {
          navigate('/login');
          return;
        }

        setUser(response.data.user);
        setProjects(response.data.roles || []);
        applyFilters(response.data.roles || [], searchQuery, defaultRoleFilter);
      } catch (error) {
        console.error('❌ Error fetching project data:', error);
        navigate('/login');
      }
    };

    fetchData();
  }, [navigate, defaultRoleFilter]);

  useEffect(() => {
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
    applyFilters(projects, query, selectedRole);
  };

  const handleRoleFilter = (e) => {
    setSelectedRole(e.target.value);
    applyFilters(projects, searchQuery, e.target.value);
  };

  const applyFilters = (data, query, role) => {
    let filtered = data;

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
    console.log(`Toggling menu for project ID: ${projectId}`);
    if (menuOpen === projectId) {
      setMenuOpen(null); // Close menu
    } else {
      setMenuOpen(projectId); // Open menu
    }
  };

  const openProject = (projectId) => {
    navigate(`/ProjectsPage/${projectId}`);
  };

  const handleDownloadSelected = () => {
    if (selectedFileIds.length === 0) {
      alert("No files selected for download.");
      return;
    }

    selectedFileIds.forEach((fileId) => {
      const link = document.createElement("a");
      link.href = `/api/projects/download/${fileId}`;
      link.setAttribute("download", "");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
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

        {showFilterDropdown && (
          <select className="filter-dropdown" value={selectedRole} onChange={handleRoleFilter}>
            <option value="">all roles</option>
            {[...new Set(projects.map((project) => project.role))].map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        )}
      </div>

      <section className="project-list">
        <table className="projects-table">
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
                    <span className={`status ${project.has_latest === true ? 'success' : 'error'}`}>
                      {project.has_latest === true ? '✔' : '❕'}
                    </span>
                  </td>
                  <td>{project.role}</td>
                  <td>{project.last_modified_date ? <FormattedDate dateInput={project.last_modified_date} /> : '-'}</td>
                  <td>{project.created_date ? <FormattedDate dateInput={project.created_date} /> : '-'}</td>

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
                      <div ref={menuRef} className="horizontal-menu" id={`menu-${project.project_id}`}>
                        <div className="description-box">
                          <span className="description-text">
                            {project.description && <strong>Description:</strong>} {project.description || 'No description available'}
                          </span>
                        </div>
                        <div className="open-project">
                          <button onClick={() => openProject(project.project_id)}>Open Project</button>
                        </div>
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