import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './MainPage.css';
import { FaHome, FaFolder, FaHeart, FaEnvelope, FaPlus, FaCog, FaSignOutAlt, FaBars, FaInfoCircle } from 'react-icons/fa';

const MainPage = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [projects, setProjects] = useState([]); // Stores all projects
  const [searchQuery, setSearchQuery] = useState(''); // Search query for filtering
  const [filteredProjects, setFilteredProjects] = useState([]); // Filtered projects based on search
  const [profile, setProfile] = useState({ name: '', avatar: '/static/profile_pics/default.png' }); // User profile data

  // Fetch projects and profile data from the backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch projects from the backend
        const projectsResponse = await axios.get('/api/projects');
        const profileResponse = await axios.get('/api/profile');

        // Set the fetched data to state
        setProjects(projectsResponse.data);
        setFilteredProjects(projectsResponse.data); // Initially, all projects are displayed
        setProfile(profileResponse.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, []);

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

  // Handle logout
  const handleLogout = async () => {
    try {
      await axios.post('/logout'); // Call the backend logout endpoint
      window.location.href = '/login'; // Redirect to login page
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  return (
    <div className="main-page-container">
      {/* Sidebar */}
      <aside className={`main-page-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="main-page-sidebar-header">
          <h2>Sortify</h2>
          <button className="main-page-collapse-button" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
            <FaBars />
          </button>
        </div>
        <nav className="main-page-sidebar-nav">
          <ul>
            <li className="active">
              <FaHome /> {!sidebarCollapsed && 'Main Page'}
            </li>
            <li>
              <FaFolder /> {!sidebarCollapsed && 'My Projects'}
            </li>
            <li>
              <FaHeart /> {!sidebarCollapsed && 'Favourite'}
            </li>
            <li>
              <FaEnvelope /> {!sidebarCollapsed && 'Invitation'}
            </li>
            <li>
              <FaPlus /> {!sidebarCollapsed && 'Create New Project'}
            </li>
            <li>
              <FaCog /> {!sidebarCollapsed && 'Settings'}
            </li>
            <li>
              <FaInfoCircle /> {!sidebarCollapsed && 'About'}
            </li>
          </ul>
        </nav>
        <div className="main-page-sidebar-footer">
          <p>© 2025 Sortify</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="main-header">
          <h1>Main Page</h1>
          <div className="search-filter">
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={handleSearch}
            />
            <button className="filter-button">Filter</button>
          </div>
          <div className="user-profile">
            <img src={profile.avatar} alt="User" />
            <span>{profile.name || 'Loading...'}</span>
            <button onClick={handleLogout}>
              <FaSignOutAlt />
            </button>
          </div>
        </header>

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
      </main>
    </div>
  );
};

export default MainPage;