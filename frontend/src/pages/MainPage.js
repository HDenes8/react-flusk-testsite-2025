import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // Import useNavigate for navigation
import './MainPage.css';
import { FaHome, FaFolder, FaHeart, FaEnvelope, FaPlus, FaCog, FaSignOutAlt, FaBars, FaInfoCircle } from 'react-icons/fa';

const MainPage = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [projects, setProjects] = useState([]); // Stores all projects
  const [searchQuery, setSearchQuery] = useState(''); // Search query for filtering
  const [filteredProjects, setFilteredProjects] = useState([]); // Filtered projects based on search
  const [profile, setProfile] = useState(null); // User profile data
  const navigate = useNavigate(); // Initialize useNavigate for redirection

  // Fetch projects and profile data from the backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch projects from the backend
        const projectsResponse = await axios.get('/api/projects', { validateStatus: false });
        const profileResponse = await axios.get('/api/profile', { validateStatus: false });

        // Check if the backend returned a 401 Unauthorized or 302 Found
        if (projectsResponse.status === 401 || projectsResponse.status === 302 || 
            profileResponse.status === 401 || profileResponse.status === 302) {
          navigate('/login'); // Redirect to login page
          return;
        }

        // Set the fetched data to state
        setProjects(projectsResponse.data || []); // Ensure data is an array
        setFilteredProjects(projectsResponse.data || []); // Ensure data is an array
        setProfile(profileResponse.data || { name: '', avatar: '/static/profile_pics/default.png' });
      } catch (error) {
        console.error('Error fetching data:', error);
        navigate('/login'); // Redirect to login page on unexpected errors
      }
    };

    fetchData();
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

  // Handle logout
  const handleLogout = async () => {
    try {
      await axios.post('/logout'); // Call the backend logout endpoint
      window.location.href = '/login'; // Redirect to login page
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  if (!profile) {
    return <div>Loading...</div>;
  }

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
          <div className="user-profile">
            <img src={profile.avatar} alt="User" />
            <span>{profile.name || 'Loading...'}</span>
            <button onClick={handleLogout}>
              <FaSignOutAlt />
            </button>
          </div>
        </header>

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
      </main>
    </div>
  );
};

export default MainPage;