import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Navbar.css';
import { FaHome, FaFolder, FaHeart, FaEnvelope, FaPlus, FaCog, FaSignOutAlt, FaBars, FaInfoCircle } from 'react-icons/fa';

const Navbar = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profile, setProfile] = useState(null);
  const [projectInfo, setProjectInfo] = useState(null);
  const navigate = useNavigate();

  // Fetch project information if on ProjectsPage or MembersPage
  useEffect(() => {
    const fetchProjectInfo = async () => {
      const path = window.location.pathname;
      if (path.startsWith('/ProjectsPage') || path.startsWith('/MembersPage')) {
        const projectId = path.split('/').pop();
        try {
          const response = await axios.get(`/project/${projectId}`);
          if (response.status === 200) {
            setProjectInfo({
              name: response.data.project.name,
              role: response.data.project.role, // Assuming the API returns the user's role
            });
          }
        } catch (error) {
          console.error('Error fetching project info:', error);
        }
      }
    };

    fetchProjectInfo();
  }, [window.location.pathname]);

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
        setProfile(profileResponse.data || { name: '', avatar: '/static/profile_pics/default.png', nickname: '', nickname_id: '' });
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
            <li className={window.location.pathname === '/MyProjectsPage' ? 'active' : ''} onClick={() => navigate('/MyProjectsPage')}>
              <FaFolder /> {!sidebarCollapsed && 'My Projects'}
            </li>
            <li className={window.location.pathname === '/favourite' ? 'active disabled' : 'disabled'}>
              <FaHeart style={{ color: 'grey', cursor: 'not-allowed' }} /> {!sidebarCollapsed && 'Favourite (not working)'}
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
            {/* Push About button to the bottom */}
            <li className={window.location.pathname === '/about' ? 'active' : ''} onClick={() => navigate('/about')} style={{ marginTop: 'auto' }}>
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
        {projectInfo && (window.location.pathname.startsWith('/ProjectsPage') || window.location.pathname.startsWith('/MembersPage')) ? (
          <div className="project-info">
            <h1 className="project-title">{projectInfo.name}</h1>
            <p className="project-role"><strong>Role:</strong> {projectInfo.role}</p>
          </div>
        ) : (
          <h1>{getPageTitle()}</h1>
        )}
        <div className="user-profile">
          <img src={profile.avatar} alt="User" />
          <span>{`${profile.nickname || "Loading"} # ${profile.nickname_id || 'No ID'}`}</span>
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
    case '/MyProjectsPage':
      return 'My Projects';
    case '/favourite':
      return 'Favourite';
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
