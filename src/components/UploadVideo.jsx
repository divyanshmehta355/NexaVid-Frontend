// client/src/components/UploadVideo.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { Helmet } from 'react-helmet-async';

const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL;

function UploadVideo() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadMessage, setUploadMessage] = useState('');
  const [uploadError, setUploadError] = useState(null);
  const [uploadedVideoData, setUploadedVideoData] = useState(null);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setUploadMessage(`Selected file: ${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)`);
      setUploadError(null);
      setUploadedVideoData(null);
      setUploadProgress(0);
    } else {
      setSelectedFile(null);
      setUploadMessage('');
      setUploadError(null);
      setUploadedVideoData(null);
      setUploadProgress(0);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadError('Please select a file to upload.');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setUploadError(null);
    setUploadMessage('Uploading...');
    setUploadedVideoData(null);

    const formData = new FormData();
    formData.append('videoFile', selectedFile); // 'videoFile' must match the key used in multer.single() on backend

    try {
      const response = await axios.post(`${BACKEND_API_URL}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        },
      });

      if (response.data.success) {
        setUploadMessage('Upload successful!');
        setUploadedVideoData(response.data.data);
      } else {
        setUploadError(response.data.message || 'Upload failed.');
      }
    } catch (err) {
      console.error('Upload failed:', err);
      setUploadError(err.response?.data?.message || err.message || 'An unexpected error occurred during upload.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Upload Video - Seductive Streams</title>
        <meta name="description" content="Upload your video content to Seductive Streams." />
      </Helmet>

      <div className="card bg-dark text-white border-secondary shadow-lg p-4">
        <h2 className="card-title text-center mb-4">Upload New Video</h2>
        <div className="card-body">
          <div className="mb-3">
            <label htmlFor="videoFileInput" className="form-label">Select Video File</label>
            <input
              className="form-control"
              type="file"
              id="videoFileInput"
              accept="video/*" // Accept all video formats
              onChange={handleFileChange}
              disabled={uploading}
            />
          </div>

          {uploadMessage && (
            <div className={`alert ${uploadError ? 'alert-danger' : 'alert-info'} mt-3`}>
              {uploadMessage}
            </div>
          )}

          {uploading && (
            <div className="progress mt-3">
              <div
                className="progress-bar progress-bar-striped progress-bar-animated"
                role="progressbar"
                style={{ width: `${uploadProgress}%` }}
                aria-valuenow={uploadProgress}
                aria-valuemin="0"
                aria-valuemax="100"
              >
                {uploadProgress}%
              </div>
            </div>
          )}

          {uploadError && (
            <div className="alert alert-danger mt-3" role="alert">
              Upload Error: {uploadError}
            </div>
          )}

          {uploadedVideoData && (
            <div className="alert alert-success mt-3" role="alert">
              <h5>Video Uploaded Successfully!</h5>
              <p><strong>Filename:</strong> {uploadedVideoData.fileName}</p>
              <p><strong>Stream URL:</strong> <a href={uploadedVideoData.streamUrl} target="_blank" rel="noopener noreferrer">{uploadedVideoData.streamUrl}</a></p>
              <p><strong>File ID:</strong> {uploadedVideoData.fileId}</p>
              <p>You can find this video on the <a href="/" className="alert-link">Home page</a> after Streamtape finishes processing.</p>
            </div>
          )}

          <div className="d-grid gap-2 mt-4">
            <button
              className="btn btn-primary btn-lg"
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
            >
              {uploading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Uploading...
                </>
              ) : (
                <>
                  <i className="bi bi-cloud-arrow-up-fill me-2"></i> Upload Video
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default UploadVideo;