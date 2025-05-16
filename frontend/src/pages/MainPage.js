import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import styles from '../styles/MainPage.module.css'; // Import styles as an object
import FormattedDate from '../components/FormattedDate'; // adjust if needed

const MainPage = ({ defaultRoleFilter = '', showFilterDropdown = true }) => {
  const [projects, setProjects] = useState([]);
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [selectedRole, setSelectedRole] = useState(defaultRoleFilter);
  const [menuOpen, setMenuOpen] = useState(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 }); // Added hover position state
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

  const toggleMenu = (projectId, event) => {
    const buttonRect = event.target.getBoundingClientRect(); // Get button position
    setMenuOpen(menuOpen === projectId ? null : projectId);
    setHoverPosition({ x: buttonRect.left - 120, y: buttonRect.top }); // Position menu on the left
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
    <div className={styles['main-page-container']}>
      <div className={styles['search-filter-container']}>
        <input
          type="text"
          className={styles['search-bar']}
          placeholder="Search projects..."
          value={searchQuery}
          onChange={handleSearch}
        />

        {showFilterDropdown && (
          <select
            className={styles['filter-dropdown']}
            value={selectedRole}
            onChange={handleRoleFilter}
          >
            <option value="">all roles</option>
            {[...new Set(projects.map((project) => project.role))].map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        )}
      </div>

      <section className={styles['project-list']}>
        <table className={styles['projects-table']}>
          <thead>
            <tr>
              <th>Project Name</th>
              <th>My Roles</th>
              <th className="date-header">Last Modified</th> {/* Apply date-header */}
              <th className="date-header">Date</th> {/* Apply date-header */}
              <th>Owner</th>
              <th className="actions-header">Actions</th> {/* Use global class */}
            </tr>
          </thead>
          <tbody>
            {filteredProjects.length > 0 ? (
              filteredProjects.map((project) => (
                <tr key={project.project_id}>
                  <td className={styles['project-name-cell']}>
                    <div className={styles['project-name-cell-inner']}>
                      <span>{project.project_name}</span>
                      <span
                        className={`${styles['status']} ${
                          project.has_latest === true ? styles['success'] : styles['error']
                        }`}
                      >
                        {project.has_latest === true ? '✔' : '❕'}
                      </span>
                    </div>
                  </td>
                  <td>{project.role}</td>
                  <td className="date-cell">
                    {project.last_modified_date ? (
                      <FormattedDate dateInput={project.last_modified_date} />
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="date-cell">
                    {project.created_date ? (
                      <FormattedDate dateInput={project.created_date} />
                    ) : (
                      '-'
                    )}
                  </td>

                  <td>
                    <img
                      src={`/static/profile_pics/${
                        project.creator_profile_picture || 'default.png'
                      }`}
                      alt={`${project.nickname || 'Unknown'}#${project.nickname_id || 'No ID'}`} 
                      className={styles['owner-avatar']}
                    />
                    <span className={styles['ownername']}>
                      {project.nickname || 'Unknown'}
                      <span className="nickname-id">{`#${project.nickname_id || 'No ID'}`}</span>
                    </span>
                  </td>
                  <td className="actions-cell"> {/* Use global class */}
                    <button
                      className="dots-button"
                      onClick={(e) => toggleMenu(project.project_id, e)} // Pass event to get position
                    >
                      ⋯
                    </button>
                    {menuOpen === project.project_id && (
                      <div
                        className="horizontal-menu"
                        ref={menuRef}
                        style={{ top: `${hoverPosition.y}px`, left: `${hoverPosition.x}px` }} // Apply dynamic position
                      >
                        <div className="description-box"> {/* Use global class */}
                          <span className="description-paragraph"> {/* Use global class */}
                            {project.description && <strong>Description:</strong>} {project.description || 'No description available'}
                          </span>
                        </div>
                        <div className="button-container"> {/* Use global class */}
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