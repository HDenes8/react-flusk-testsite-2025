import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './ProjectsPage.css';

function formatFileSize(sizeInBytes) {
  const units = ["bytes", "KB", "MB", "GB", "TB"];
  let size = sizeInBytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${Math.ceil(size)} ${units[unitIndex]}`;
}

const ProjectsPage = () => {
  const { project_id } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [files, setFiles] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [uploadData, setUploadData] = useState({ file: null, description: '', title: '' });
  const [versionUploadTarget, setVersionUploadTarget] = useState(null);
  const [versionUploadData, setVersionUploadData] = useState({ file: null, comment: '' });
  const [expandedFile, setExpandedFile] = useState(null);
  const [fileVersions, setFileVersions] = useState({});
  const [download_file_results, setDownloadFileResults] = useState({}); // To track download results 
  const [error, setError] = useState(null);




  const dropdownRef = useRef(null); // To track the dropdown menu

  const toggleFileDropdown = (fileId) => {
    setExpandedFile(expandedFile === fileId ? null : fileId);
  };

  const toggleFileVersions = (fileId) => {
    if (!fileVersions[fileId]) {
      fetchFileVersions(fileId); // Fetch versions only if not loaded
    } else {
      setFileVersions((prev) => ({ ...prev, [fileId]: null })); // Hide versions if already displayed
    }
  };

  const closeFileDropdown = () => {
    setExpandedFile(null);
  };

  // Close dropdown if clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        closeFileDropdown();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch project data
  // Fetch project data from the server
  const fetchProjectData = async () => {
    try {
      const response = await fetch(`/project/${project_id}`);
      if (!response.ok) {
        const errorData = await response.json();
        alert(`Error: ${errorData.error}`);
        return;
      }
      const data = await response.json();
      console.log("Project data:", data); // Debugging

      const sortedFiles = data.files.sort((a, b) => new Date(b.upload_date) - new Date(a.upload_date));
      setProject(data.project);
      setFiles(sortedFiles);
      setDownloadFileResults(data.download_file_results); // Store download_file_results in state
    } catch (error) {
      console.error("Error fetching project data:", error);
      alert("An error occurred while fetching project data.");
    }
  };

  const fetchFileVersions = async (fileId) => {
    try {
      const response = await fetch(`/api/files/${fileId}/versions`);
      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || `Failed to fetch versions for file ${fileId}`);
        return;
      }
      const data = await response.json();
      setFileVersions((prev) => ({
        ...prev,
        [fileId]: data.version_history,
      }));
    } catch (error) {
      console.error(`Error fetching versions for file ${fileId}:`, error);
      setError("An error occurred while fetching file versions.");
    }
  };
  useEffect(() => {
    fetchProjectData();
  }, [project_id]);

  const handleFileChange = (e) => {
    setUploadData({ ...uploadData, file: e.target.files[0] });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUploadData({ ...uploadData, [name]: value });
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("file", uploadData.file);
    formData.append("description", uploadData.description);
    formData.append("title", uploadData.title);

    try {
      const response = await fetch(`/api/projects/${project_id}/upload`, {
        method: "POST",
        body: formData,
      });

      const rawText = await response.text();
      const jsonData = JSON.parse(rawText);

      if (response.ok) {
        setShowUploadModal(false);
        alert("File uploaded successfully!");
        fetchProjectData(); // Refresh the file list
      } else {
        alert(`Error: ${jsonData.error || 'Upload failed'}`);
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("An error occurred while uploading the file.");
    }
  };

  const handleVersionUploadSubmit = async (e) => {
    e.preventDefault();
    if (!versionUploadTarget) {
      alert("No file selected for version upload.");
      return;
    }
  
    const formData = new FormData();
    formData.append("file", versionUploadData.file);
    formData.append("comment", versionUploadData.comment); // ✅ Use the actual user input
    formData.append("main_file_id", versionUploadTarget.file_data_id); // Link to the main file
  
    try {
      const response = await fetch(`/api/projects/${project_id}/upload`, {
        method: "POST",
        body: formData,
      });
  
      const jsonData = await response.json();
  
      if (response.ok) {
        setVersionUploadTarget(null);
        setVersionUploadData({ file: null, comment: '' });
        alert("Version uploaded!");
        fetchProjectData(); // Refresh file list
      } else {
        alert(`Error: ${jsonData.error}`);
      }
    } catch (err) {
      console.error("Upload version failed:", err);
      alert("Failed to upload version.");
    }
  };  

  const handleDownloadSubmit = async (e) => {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      alert("No files selected for download.");
      return;
    }

    try {
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
        a.download = 'selected_files.zip';
        document.body.appendChild(a);
        a.click();
        a.remove();
        setShowDownloadModal(false);
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error || 'Failed to download files'}`);
      }
    } catch (error) {
      console.error("Error downloading files:", error);
      alert("An error occurred while downloading the files.");
    }
  };

  const handleFileSelect = (e) => {
    const value = e.target.value;
    setSelectedFiles(prev =>
      e.target.checked ? [...prev, value] : prev.filter(id => id !== value)
    );
  };

  const toggleVersionTable = (fileId) => {
    if (!fileVersions[fileId]) {
      fetchFileVersions(fileId); // Load if not yet loaded
    } else {
      setFileVersions((prev) => {
        const updated = { ...prev };
        delete updated[fileId]; // Toggle hide
        return updated;
      });
    }
  };
  

  if (!project) return <p>Loading...</p>;

  return (
    <div className="project-page-container">
      <div className="top-buttons">
        <button onClick={() => setShowUploadModal(true)}>Upload File</button>
        <button onClick={() => setShowDownloadModal(true)}>Download Files</button>
        <button onClick={() => navigate(`/MembersPage/${project_id}`)}>Members</button>
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
              <th>Ver</th>
              <th>Title</th>
              <th>File Name</th>
              <th>Comment</th>
              <th>File Size</th>
              <th>Upload Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {files.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: "center" }}>No files uploaded yet.</td>
              </tr>
            ) : (
              files.map((file) => (
                <React.Fragment key={file.version_id}>
                  <tr>
                    <td>
                      <input
                        type="checkbox"
                        value={file.version_id}
                        onChange={handleFileSelect}
                      />
                    </td>
                    <td>
                      {file.version_number}
                      <span className={`status ${download_file_results[file.version_id] ? 'success' : 'error'}`}>
                        {download_file_results[file.version_id] ? '✔' : '❕'}
                      </span>
                    </td>
                    <td>{file.title}</td>
                    <td>{file.file_name}</td>
                    <td>{file.comment}</td>
                    <td>{formatFileSize(file.file_size)}</td>
                    <td>{new Date(file.upload_date).toLocaleString()}</td>
                    <td>
                      <button className="dots-button" onClick={() => toggleFileDropdown(file.version_id)}>⋯</button>
                      {expandedFile === file.version_id && (
                        <div className="horizontal-menu" ref={dropdownRef}>
                          <div className="description-box">
                            <p><strong>Description:</strong> {file.description || "No description available"}</p>
                          </div>
                          <ul>
                            <li>
                              <button onClick={() => toggleVersionTable(file.file_data_id)}>
                                {fileVersions[file.file_data_id] ? 'Hide Versions' : 'Show Versions'}
                              </button>
                            </li>
                            <li>
                              <button
                                onClick={() => {
                                  setVersionUploadTarget(file);
                                  closeFileDropdown();
                                }}
                              >
                                Upload New Version
                              </button>
                            </li>
                          </ul>
                        </div>
                      )}
                    </td>
                  </tr>               

                  {/* Injected version history row */}
                  {fileVersions[file.file_data_id] && (
                    <tr className="version-history-row">
                      <td colSpan="8">
                        <table className="versions-table">
                          <thead>
                            <tr>
                              <th>Select</th>
                              <th>Ver</th>
                              <th></th>
                              <th>File Name</th>
                              <th>Comment</th>
                              <th>File Size</th>
                              <th>Upload Date</th>
                              <th></th>
                            </tr>
                          </thead>
                          <tbody>
                            {fileVersions[file.file_data_id].length === 0 ? (
                              <tr><td colSpan="4">No previous versions found.</td></tr>
                            ) : (
                              fileVersions[file.file_data_id].map((version) => (
                                <tr key={version.version_id}>
                                  <td>
                                    <input
                                      type="checkbox"
                                      value={version.version_id}
                                      onChange={handleFileSelect}
                                    />
                                  </td>
                                  <td>{version.version_number}</td>
                                  <td></td>
                                  <td>{version.file_name}</td>
                                  <td>{version.comment}</td>
                                  <td>{formatFileSize(version.file_size)}</td>
                                  <td>{new Date(file.upload_date).toLocaleString()}</td>
                                  <td></td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  )}
                </React.Fragment>

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
                name="title"
                placeholder="Title"
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

      {/* Upload Version Modal */}
      {versionUploadTarget && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Upload New Version for "{versionUploadTarget.file_name}"</h2>
            <form onSubmit={handleVersionUploadSubmit} encType="multipart/form-data">
              <input type="file" required onChange={(e) =>
                setVersionUploadData({ ...versionUploadData, file: e.target.files[0] })} />
              <input
                type="text"
                placeholder="Comment (optional)"
                onChange={(e) =>
                  setVersionUploadData({ ...versionUploadData, comment: e.target.value })}
              />
              <div className="modal-buttons">
                <button type="submit">Upload Version</button>
                <button type="button" onClick={() => setVersionUploadTarget(null)}>Cancel</button>
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
