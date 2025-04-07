import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import './ProjectsPage.css';

const ProjectsPage = () => {
  const { project_id } = useParams();
  const [project, setProject] = useState(null);
  const [files, setFiles] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [uploadData, setUploadData] = useState({
    file: null,
    description: '',
    short_comment: '',
  });

  useEffect(() => {
    fetch(`/project/${project_id}`)
      .then(res => res.json())
      .then(data => {
        setProject(data.project);
        setFiles(data.files);
      });
  }, [project_id]);

  const handleFileChange = (e) => {
    setUploadData({
      ...uploadData,
      file: e.target.files[0],
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUploadData({
      ...uploadData,
      [name]: value,
    });
  };

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
        const updatedProject = await response.json();
        setFiles(updatedProject.files);
        setShowUploadModal(false); // Close modal after upload
      }
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

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
      a.download = 'files.zip';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setShowDownloadModal(false); // Close modal after download
    }
  };

  const handleFileSelect = (e) => {
    const value = e.target.value;
    setSelectedFiles(prev =>
      e.target.checked ? [...prev, value] : prev.filter(id => id !== value)
    );
  };

  if (!project) return <p>Loading...</p>;

  return (
    <div className="project-page">
      <div className="top-buttons">
        <button onClick={() => setShowUploadModal(true)}>Upload File</button>
        <button onClick={() => setShowDownloadModal(true)}>Download Files</button>
      </div>

      <h1>{project.name}</h1>
      <p>{project.description}</p>
      <p>Created on: {new Date(project.created_date).toLocaleString()}</p>

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

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Upload File</h2>
            <form onSubmit={handleUploadSubmit} encType="multipart/form-data">
              <input type="file" name="file" required onChange={handleFileChange} />
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
              <div className="modal-buttons">
                <button type="submit">Upload</button>
                <button type="button" onClick={() => setShowUploadModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Download Modal */}
      {showDownloadModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Download Files</h2>
            <p>You have selected {selectedFiles.length} file(s) to download.</p>
            <form onSubmit={handleDownloadSubmit}>
              <div className="modal-buttons">
                <button type="submit">Download</button>
                <button type="button" onClick={() => setShowDownloadModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;
