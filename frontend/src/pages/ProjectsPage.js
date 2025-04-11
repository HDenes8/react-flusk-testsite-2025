import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import './ProjectsPage.css';

// Utility function for dynamic file size formatting
function formatFileSize(sizeInBytes) {
  const units = ["bytes", "KB", "MB", "GB", "TB"];
  let size = sizeInBytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  // Round up the size to the nearest integer
  return `${Math.ceil(size)} ${units[unitIndex]}`;
}

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
  const [expandedFile, setExpandedFile] = useState(null); // State to track the dropdown menu
  const toggleFileDropdown = (fileId) => {
    setExpandedFile(expandedFile === fileId ? null : fileId); // Toggle dropdown menu for a specific file
  };
  
  const closeFileDropdown = () => {
    setExpandedFile(null); // Close the dropdown
  };
  
  
  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        const response = await fetch(`/project/${project_id}`);
        if (!response.ok) {
          const errorData = await response.json();
          console.error("Error fetching project data:", errorData.error);
          alert(`Error: ${errorData.error}`);
          return;
        }
        const data = await response.json();

        // Sort files by upload_date in descending order (newest first)
        const sortedFiles = data.files.sort((a, b) => new Date(b.upload_date) - new Date(a.upload_date));
        
        setProject(data.project);
        setFiles(sortedFiles);
      } catch (error) {
        console.error("Error fetching project data:", error);
        alert("An error occurred while fetching project data.");
      }
    };

    fetchProjectData();
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
    formData.append("file", uploadData.file);
    formData.append("description", uploadData.description);
    formData.append("short_comment", uploadData.short_comment);

    try {
      const response = await fetch(`/api/projects/${project_id}/upload`, {
        method: "POST",
        body: formData,
      });

      const rawText = await response.text();
      console.log("Raw upload response:", rawText);

      try {
        const jsonData = JSON.parse(rawText);

        if (response.ok) {
          setFiles((prevFiles) => [...prevFiles, jsonData.file]);
          setShowUploadModal(false);
          alert("File uploaded successfully!");
        } else {
          alert(`Error: ${jsonData.error || 'Upload failed'}`);
        }
      } catch (parseError) {
        console.error("Failed to parse JSON response:", parseError);
        alert("Unexpected server response. Please try again.");
      }

    } catch (error) {
      console.error("Error uploading file:", error);
      alert("An error occurred while uploading the file.");
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
        <button onClick={() => setShowDownloadModal(true)}>Members</button>
      </div>

      <h1>{project.name}</h1>
      <p>{project.description}</p>
      <p>Created on: {new Date(project.created_date).toLocaleString()}</p>

      <h3>Files</h3>
      <section className="file-info">
        <table className="files-table">
          <thead>
            <tr>
              <th>Select</th>
              <th>Title</th>
              <th>File Name</th>
              <th>File Size</th>
              <th>Description</th>
              <th>Upload Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {files.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: "center" }}>
                  No files uploaded yet.
                </td>
              </tr>
            ) : (
              files.map((file) => (
                <tr key={file.version_id}>
                  <td>
                    <input
                      type="checkbox"
                      value={file.version_id}
                      onChange={handleFileSelect}
                    />
                  </td>
                  <td>{file.short_comment}</td>
                  <td>{file.file_name}</td>
                  <td>{formatFileSize(file.file_size)}</td>
                  <td>{file.description}</td>
                  <td>{new Date(file.upload_date).toLocaleString()}</td>
                  <td>
                    <button className="dots-button" onClick={() => toggleFileDropdown(file.version_id)}>...</button>
                    {expandedFile === file.version_id && (
                      <div className="file-dropdown">
                        <p><strong>Description:</strong> {file.description || 'No description available'}</p>
                        <ul>
                          {file.versions ? (
                            file.versions.map((version) => (
                              <li key={version.version_id}>
                                Version {version.version_number} - {new Date(version.upload_date).toLocaleString()}
                              </li>
                            ))
                          ) : (
                            <li>No other versions available.</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Upload File</h2>
            <form onSubmit={handleUploadSubmit} encType="multipart/form-data">
              <input type="file" name="file" required onChange={handleFileChange} />
              <input
                type="text"
                name="short_comment"
                placeholder="Title" /* behind the scenes its still short_comment 2025/04/10 */
                onChange={handleInputChange}
              />
              <input
                type="text"
                name="description"
                placeholder="Description (optional)"
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