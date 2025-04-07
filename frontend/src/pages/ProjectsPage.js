import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import './ProjectsPage.css';  // Assuming you have some CSS for styling

const ProjectPage = () => {
  const { project_id } = useParams();  // Extracts the project_id from the route parameter
  const [project, setProject] = useState(null);
  const [files, setFiles] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadData, setUploadData] = useState({
    file: null,
    description: '',
    short_comment: '',
  });

  useEffect(() => {
    // Fetch project data from the API
    fetch(`/project/${project_id}`)
      .then(res => res.json())
      .then(data => {
        setProject(data.project);
        setFiles(data.files);  // Assuming files data is part of the response
      });
  }, [project_id]);

  // Handle file input change for upload
  const handleFileChange = (e) => {
    setUploadData({
      ...uploadData,
      file: e.target.files[0],  // Getting the first file
    });
  };

  // Handle text input for description and short comment
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUploadData({
      ...uploadData,
      [name]: value,
    });
  };

  // Handle file upload
  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('file', uploadData.file);
    formData.append('description', uploadData.description);
    formData.append('short_comment', uploadData.short_comment);
    formData.append('project_id', project_id);

    try {
      const response = await fetch('/api/projects/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        // Update files list after successful upload
        const updatedProject = await response.json();
        setFiles(updatedProject.files);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  // Handle file selection for download
  const handleFileSelect = (e) => {
    const value = e.target.value;
    setSelectedFiles(prev => (
      e.target.checked
        ? [...prev, value]
        : prev.filter(id => id !== value)
    ));
  };

  // Handle file download
  const handleDownloadSubmit = async (e) => {
    e.preventDefault();
    const response = await fetch('/api/projects/download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ selected_files: selectedFiles }),
    });

    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'files.zip'; // or whatever backend sets
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
  };

  if (!project) return <p>Loading...</p>;

  return (
    <div className="project-page">
      <h1>{project.name}</h1>
      <p>{project.description}</p>
      <p>Created on: {new Date(project.created_date).toLocaleString()}</p>

      <h3>Upload Files</h3>
      <form onSubmit={handleUploadSubmit} encType="multipart/form-data">
        <input
          type="file"
          name="file"
          required
          onChange={handleFileChange}
        />
        <input
          type="text"
          name="description"
          placeholder="Description (optional)"
          onChange={handleInputChange}
        />
        <input
          type="text"
          name="short_comment"
          placeholder="Short Comment (optional)"
          onChange={handleInputChange}
        />
        <input type="hidden" name="project_id" value={project.project_id} />
        <button type="submit">Upload</button>
      </form>

      <h3>Files</h3>
      <table className="files-table">
        <thead>
          <tr>
            <th>Select</th>
            <th>File Name</th>
            <th>File Size</th>
            <th>Description</th>
            <th>Short Comment</th>
            <th>Upload Date</th>
          </tr>
        </thead>
        <tbody>
          {files.map((file) => (
            <tr key={file.version_id}>
              <td>
                <input
                  type="checkbox"
                  value={file.version_id}
                  onChange={handleFileSelect}
                />
              </td>
              <td>{file.file_name}</td>
              <td>{file.file_size} bytes</td>
              <td>{file.description}</td>
              <td>{file.short_comment}</td>
              <td>{new Date(file.upload_date).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Download Selected Files</h3>
      <form onSubmit={handleDownloadSubmit}>
        <button type="submit">Download Selected Files</button>
      </form>
    </div>
  );
};

export default ProjectPage;
