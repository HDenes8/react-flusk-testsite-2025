import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Navbar.css'; // We'll create this file next
import { FaHome, FaFolder, FaHeart, FaEnvelope, FaPlus, FaCog, FaSignOutAlt, FaBars, FaInfoCircle } from 'react-icons/fa';

const Navbar = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profile, setProfile] = useState(null);
  const navigate = useNavigate();

  // Fetch profile data from the backend
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profileResponse = await axios.get('/api/profile', { validateStatus: false });

        // Check if the backend returned a 401 Unauthorized or 302 Found
        if (profileResponse.status === 401 || profileResponse.status === 302) {
          navigate('/login'); // Redirect to login page
          return;
        }

        // Set the fetched data to state
        setProfile(profileResponse.data || { name: '', avatar: '/static/profile_pics/default.png' });
      } catch (error) {
        console.error('Error fetching profile data:', error);
        navigate('/login'); // Redirect to login page on unexpected errors
      }
    };

    fetchProfile();
  }, [navigate]);

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
    <>
      {/* Sidebar */}
      <aside className={`navbar-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="navbar-sidebar-header">
          <h2>Sortify</h2>
          <button className="navbar-collapse-button" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
            <FaBars />
          </button>
        </div>
        <nav className="navbar-sidebar-nav">
          <ul>
            <li className={window.location.pathname === '/MainPage' ? 'active' : ''} onClick={() => navigate('/MainPage')}>
              <FaHome /> {!sidebarCollapsed && 'Main Page'}
            </li>
            <li className={window.location.pathname === '/projects' ? 'active' : ''} onClick={() => navigate('/projects')}>
              <FaFolder /> {!sidebarCollapsed && 'My Projects'}
            </li>
            <li className={window.location.pathname === '/favorites' ? 'active' : ''} onClick={() => navigate('/favorites')}>
              <FaHeart /> {!sidebarCollapsed && 'Favourite'}
            </li>
            <li className={window.location.pathname === '/invitations' ? 'active' : ''} onClick={() => navigate('/invitations')}>
              <FaEnvelope /> {!sidebarCollapsed && 'Invitation'}
            </li>
            <li className={window.location.pathname === '/create-project' ? 'active' : ''} onClick={() => navigate('/create-project')}>
              <FaPlus /> {!sidebarCollapsed && 'Create New Project'}
            </li>
            <li className={window.location.pathname === '/settings' ? 'active' : ''} onClick={() => navigate('/settings')}>
              <FaCog /> {!sidebarCollapsed && 'Settings'}
            </li>
            <li className={window.location.pathname === '/about' ? 'active' : ''} onClick={() => navigate('/about')}>
              <FaInfoCircle /> {!sidebarCollapsed && 'About'}
            </li>
          </ul>
        </nav>
        <div className="navbar-sidebar-footer">
          <p>© 2025 Sortify</p>
        </div>
      </aside>

      {/* Header */}
      <header className="navbar-header">
        <h1>{getPageTitle()}</h1>
        <div className="user-profile">
          <img src={profile.avatar} alt="User" />
          <span>{profile.name || 'Loading...'}</span>
          <button onClick={handleLogout}>
            <FaSignOutAlt />
          </button>
        </div>
      </header>
    </>
  );
};

// Helper function to get the page title based on the current path
function getPageTitle() {
  const path = window.location.pathname;
  
  switch(path) {
    case '/MainPage':
      return 'Main Page';
    case '/projects':
      return 'My Projects';
    case '/favorites':
      return 'Favorites';
    case '/invitations':
      return 'Invitations';
    case '/create-project':
      return 'Create New Project';
    case '/settings':
      return 'Settings';
    case '/about':
      return 'About';
    case '/ProjectsPage':
      return 'Projects Page';
    default:
      return 'Sortify';
  }
}

export default Navbar;
