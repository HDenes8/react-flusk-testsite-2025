import React, { useEffect, useState } from 'react';

const ProjectPage = ({ project_id }) => {
  const [project, setProject] = useState(null);
  const [files, setFiles] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
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

  const handleFileSelect = (e) => {
    const value = e.target.value;
    setSelectedFiles(prev =>
      e.target.checked ? [...prev, value] : prev.filter(id => id !== value)
    );
  };

  const handleUploadChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'file') {
      setUploadData(prev => ({ ...prev, file: files[0] }));
    } else {
      setUploadData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('file', uploadData.file);
    formData.append('description', uploadData.description);
    formData.append('short_comment', uploadData.short_comment);
    formData.append('project_id', project_id);

    await fetch('/api/projects/upload', {
      method: 'POST',
      body: formData,
    });

    // Optionally re-fetch files after upload
    fetch(`/project/${project_id}`)
      .then(res => res.json())
      .then(data => setFiles(data.files));
  };

  const handleDownload = async (e) => {
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
      <form onSubmit={handleUploadSubmit}>
        <input
          type="file"
          name="file"
          required
          onChange={handleUploadChange}
        />
        <input
          type="text"
          name="description"
          placeholder="Description (optional)"
          onChange={handleUploadChange}
        />
        <input
          type="text"
          name="short_comment"
          placeholder="Short Comment (optional)"
          onChange={handleUploadChange}
        />
        <button type="submit">Upload</button>
      </form>

      <h3>Download Files</h3>
      <form onSubmit={handleDownload}>
        <ul>
          {files.map(file => (
            <li key={file.version_id}>
              <input
                type="checkbox"
                value={file.version_id}
                onChange={handleFileSelect}
              />
              {file.file_name} ({file.file_size} bytes)
            </li>
          ))}
        </ul>
        <button type="submit">Download Selected Files</button>
      </form>
    </div>
  );
};

export default ProjectPage;
