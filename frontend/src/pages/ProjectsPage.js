import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './ProjectsPage.css';

const ProjectsPage = () => {
  const [projects, setProjects] = useState([]);
  const [files, setFiles] = useState([]);

  useEffect(() => {
    fetchProjects();
    fetchFiles();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await axios.get('/api/projects');
      setProjects(response.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchFiles = async () => {
    try {
      const response = await axios.get('/api/files');
      setFiles(response.data);
    } catch (error) {
      console.error('Error fetching files:', error);
    }
  };

  return (
    <div>
      <nav>
        <Link className="nav-item nav-link" id="members" to="/members">Members</Link>
      </nav>
      <div className="table">
        <div className="cell">VerNum</div>
        <div className="cell">File Name</div>
        <div className="cell">Description</div>
        <div className="cell">Size</div>
        <div className="cell">Date</div>
        <div className="cell">User</div>

        {projects.map((project) => (
          <React.Fragment key={project.project_id}>
            <div className="cell">{project.project_id}</div>
            <div className="cell">{project.name}</div>
            <div className="cell">{project.description}</div>
            <div className="cell">{project.size}</div>
            <div className="cell">{project.created_date}</div>
            <div className="cell">{project.creator.nickname}</div>
          </React.Fragment>
        ))}
      </div>
      <div>
        <h3>Upload Files</h3>
        <form action="/api/upload" method="post" encType="multipart/form-data">
          <input type="file" name="file" />
          <button type="submit">Upload</button>
        </form>

        <h3>Download Files</h3>
        <ul>
          {files.map((file) => (
            <li key={file}>
              <a href={`/api/download/${file}`}>{file}</a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ProjectsPage;
