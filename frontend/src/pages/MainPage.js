import React from 'react';
import './MainPage.css'; // Import the CSS file for styling

const MainPage = () => {
  return (
    <div className="main-page-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>Sortify</h2>
        </div>
        <nav className="sidebar-nav">
          <ul>
            <li className="active">
              <span>🏠</span> Main Page
            </li>
            <li>
              <span>📂</span> My Projects
            </li>
            <li>
              <span>❤️</span> Favourite (?)
            </li>
            <li>
              <span>📩</span> Invitation
            </li>
            <li>
              <span>➕</span> Create New Project
            </li>
            <li>
              <span>⚙️</span> Settings
            </li>
          </ul>
        </nav>
        <div className="sidebar-footer">
          <p>About</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="main-header">
          <h1>Main Page</h1>
          <div className="search-filter">
            <input type="text" placeholder="Search projects..." />
            <button className="filter-button">Filter</button>
          </div>
          <div className="user-profile">
            <img src="profile.jpg" alt="User" />
            <span>Name Place</span>
            <button>🔄</button>
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
              <tr>
                <td>Project 1 <span className="status success">✔</span></td>
                <td>Reader</td>
                <td>2025.01.05 17:28:32</td>
                <td>2025.01.05 17:28:32</td>
                <td><img src="owner1.jpg" alt="Owner 1" className="owner-avatar" /></td>
              </tr>
              <tr>
                <td>Project 2 <span className="status warning">!</span></td>
                <td>Editor</td>
                <td>2025.01.05 17:28:32</td>
                <td>2025.01.05 17:28:32</td>
                <td><img src="owner2.jpg" alt="Owner 2" className="owner-avatar" /></td>
              </tr>
              <tr>
                <td>Project 3 <span className="status success">✔</span></td>
                <td>Reader</td>
                <td>2025.01.05 17:28:32</td>
                <td>2025.01.05 17:28:32</td>
                <td><img src="owner1.jpg" alt="Owner 1" className="owner-avatar" /></td>
              </tr>
              <tr>
                <td>Project 4 <span className="status warning">!</span></td>
                <td>Admin</td>
                <td>2025.01.05 17:28:32</td>
                <td>2025.01.05 17:28:32</td>
                <td><img src="owner3.jpg" alt="Owner 3" className="owner-avatar" /></td>
              </tr>
            </tbody>
          </table>
        </section>
      </main>
    </div>
  );
};

export default MainPage;