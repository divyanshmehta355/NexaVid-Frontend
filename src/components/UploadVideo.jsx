// client/src/components/UploadVideo.jsx
import React, { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import { Helmet } from 'react-helmet-async';

// Using VITE_API_BASE_URL as per our previous discussion and .env setup
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

function UploadVideo() {
    // --- State for Local File Upload ---
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [localUploadMessage, setLocalUploadMessage] = useState(''); // Renamed for clarity
    const [localUploadError, setLocalUploadError] = useState(null);   // Renamed for clarity
    const [localUploadedVideoData, setLocalUploadedVideoData] = useState(null); // Renamed for clarity

    // --- State for Remote URL Upload ---
    const [remoteUrl, setRemoteUrl] = useState('');
    const [remoteFileName, setRemoteFileName] = useState('');
    const [remoteUploadId, setRemoteUploadId] = useState('');
    const [remoteUploadStatus, setRemoteUploadStatus] = useState('');
    const [remoteUploadError, setRemoteUploadError] = useState(null); // New state for remote error
    const [remoteStreamtapeFinalUrl, setRemoteStreamtapeFinalUrl] = useState(''); // Final URL from Streamtape for remote uploads
    const [isRemoteUploading, setIsRemoteUploading] = useState(false);
    const [statusIntervalId, setStatusIntervalId] = useState(null); // To clear polling interval

    // --- Local File Upload Handlers ---
    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setSelectedFile(file);
            setLocalUploadMessage(`Selected file: ${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)`);
            setLocalUploadError(null);
            setLocalUploadedVideoData(null);
            setUploadProgress(0);
        } else {
            setSelectedFile(null);
            setLocalUploadMessage('');
            setLocalUploadError(null);
            setLocalUploadedVideoData(null);
            setUploadProgress(0);
        }
    };

    const handleLocalUpload = useCallback(async () => {
        if (!selectedFile) {
            setLocalUploadError('Please select a file to upload.');
            return;
        }

        setUploading(true);
        setUploadProgress(0);
        setLocalUploadError(null);
        setLocalUploadMessage('Uploading...');
        setLocalUploadedVideoData(null);

        const formData = new FormData();
        formData.append('videoFile', selectedFile); // 'videoFile' matches the backend

        try {
            const response = await axios.post(`${API_BASE_URL}/api/upload`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setUploadProgress(percentCompleted);
                },
                timeout: 600000, // 10 minutes timeout for local upload
            });

            if (response.data.success) {
                setLocalUploadMessage('Local file upload successful!');
                setLocalUploadedVideoData(response.data.data);
                setRemoteStreamtapeFinalUrl(response.data.data.streamUrl); // Also display final URL for local upload
            } else {
                setLocalUploadError(response.data.message || 'Local upload failed.');
            }
        } catch (err) {
            console.error('Local upload failed:', err);
            setLocalUploadError(err.response?.data?.message || err.message || 'An unexpected error occurred during local upload.');
        } finally {
            setUploading(false);
        }
    }, [selectedFile]);

    // --- Remote URL Upload Handlers ---
    const handleRemoteUrlChange = (event) => {
        setRemoteUrl(event.target.value);
        // Clear previous remote upload status when URL changes
        setRemoteUploadId('');
        setRemoteUploadStatus('');
        setRemoteStreamtapeFinalUrl(''); // Clear final URL from previous attempt
        setRemoteUploadError(null);
        if (statusIntervalId) {
            clearInterval(statusIntervalId);
            setStatusIntervalId(null);
        }
    };

    const handleRemoteFileNameChange = (event) => {
        setRemoteFileName(event.target.value);
    };

    const handleRemoteUpload = useCallback(async () => {
        if (!remoteUrl) {
            setRemoteUploadError('Please enter a remote URL.');
            return;
        }

        setIsRemoteUploading(true);
        setRemoteUploadStatus('Initiating remote upload...');
        setRemoteUploadId('');
        setRemoteStreamtapeFinalUrl(''); // Clear final URL from previous attempt
        setRemoteUploadError(null);
        if (statusIntervalId) {
            clearInterval(statusIntervalId);
            setStatusIntervalId(null);
        }

        try {
            const payload = { url: remoteUrl };
            if (remoteFileName) {
                payload.name = remoteFileName;
            }

            const response = await axios.post(`${API_BASE_URL}/api/remote-upload`, payload, {
                timeout: 60000, // 1 minute timeout for initiating remote upload
            });

            if (response.data.success) {
                const newRemoteUploadId = response.data.remoteUploadId;
                setRemoteUploadId(newRemoteUploadId);
                setRemoteUploadStatus('Remote upload initiated! Checking status...');
                console.log('Remote upload initiated:', response.data);

                // Start polling for status
                const interval = setInterval(() => {
                    checkRemoteUploadStatus(newRemoteUploadId);
                }, 5000); // Check every 5 seconds
                setStatusIntervalId(interval);

            } else {
                setRemoteUploadError(response.data.message || 'Remote upload initiation failed.');
            }
        } catch (error) {
            console.error('Remote upload initiation error:', error);
            if (axios.isAxiosError(error) && error.response) {
                setRemoteUploadError(error.response.data.message || 'Server error initiating remote upload.');
            } else {
                setRemoteUploadError(`An unexpected error occurred: ${error.message}`);
            }
        } finally {
            setIsRemoteUploading(false);
        }
    }, [remoteUrl, remoteFileName, statusIntervalId]);

    const checkRemoteUploadStatus = useCallback(async (id) => {
        if (!id) return;

        try {
            const response = await axios.get(`${API_BASE_URL}/api/remote-upload-status/${id}`);

            if (response.data.success) {
                const status = response.data.status;
                const bytesLoaded = response.data.bytesLoaded || 0;
                const bytesTotal = response.data.bytesTotal || 0;

                // Format bytes for display
                const loadedMB = (bytesLoaded / (1024 * 1024)).toFixed(2);
                const totalMB = bytesTotal ? (bytesTotal / (1024 * 1024)).toFixed(2) : '?';

                setRemoteUploadStatus(`Status: ${status} (${loadedMB} MB / ${totalMB} MB)`);

                if (status === 'finished') {
                    setRemoteStreamtapeFinalUrl(response.data.streamtapeUrl);
                    setRemoteUploadStatus('Remote upload finished successfully!');
                    if (statusIntervalId) {
                        clearInterval(statusIntervalId); // Stop polling
                        setStatusIntervalId(null);
                    }
                    // Optionally, store the final URL/ID to your database here via another API call
                } else if (status === 'failed') {
                    setRemoteUploadStatus('Remote upload failed on Streamtape.');
                    if (statusIntervalId) {
                        clearInterval(statusIntervalId); // Stop polling
                        setStatusIntervalId(null);
                    }
                }
            } else {
                setRemoteUploadStatus(`Error checking status: ${response.data.message}`);
                if (statusIntervalId) {
                    clearInterval(statusIntervalId); // Stop polling on error
                    setStatusIntervalId(null);
                }
            }
        } catch (error) {
            console.error('Error checking remote upload status:', error);
            setRemoteUploadStatus(`Failed to fetch status: ${error.message}`);
            if (statusIntervalId) {
                clearInterval(statusIntervalId); // Stop polling on error
                setStatusIntervalId(null);
            }
        }
    }, [statusIntervalId]);

    // Cleanup interval on component unmount
    useEffect(() => {
        return () => {
            if (statusIntervalId) {
                clearInterval(statusIntervalId);
            }
        };
    }, [statusIntervalId]);

    return (
        <>
            <Helmet>
                <title>Upload Video - Seductive Streams</title>
                <meta name="description" content="Upload your video content to Seductive Streams." />
            </Helmet>

            <div className="card bg-dark text-white border-secondary shadow-lg p-4 mb-5">
                <h2 className="card-title text-center mb-4 text-info">Upload New Video</h2>
                <div className="card-body">
                    {/* Local File Upload Section */}
                    <div className="mb-5 p-4 border rounded border-secondary bg-dark-subtle">
                        <h3 className="text-white mb-3">1. Upload Local File</h3>
                        <p className="text-muted">Upload a video directly from your device. For large files, this might take some time.</p>
                        <div className="mb-3">
                            <label htmlFor="videoFileInput" className="form-label text-white">Select Video File</label>
                            <input
                                className="form-control bg-dark text-white border-secondary"
                                type="file"
                                id="videoFileInput"
                                accept="video/*"
                                onChange={handleFileChange}
                                disabled={uploading}
                            />
                        </div>

                        {localUploadMessage && !localUploadError && (
                            <div className="alert alert-info mt-3" role="alert">
                                {localUploadMessage}
                            </div>
                        )}

                        {uploading && (
                            <div className="progress mt-3 bg-dark">
                                <div
                                    className="progress-bar progress-bar-striped progress-bar-animated bg-success"
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

                        {localUploadError && (
                            <div className="alert alert-danger mt-3" role="alert">
                                Upload Error: {localUploadError}
                            </div>
                        )}

                        {localUploadedVideoData && (
                            <div className="alert alert-success mt-3" role="alert">
                                <h5>Video Uploaded Successfully!</h5>
                                <p><strong>Filename:</strong> {localUploadedVideoData.fileName}</p>
                                <p><strong>Stream URL:</strong> <a href={localUploadedVideoData.streamUrl} target="_blank" rel="noopener noreferrer" className="alert-link">{localUploadedVideoData.streamUrl}</a></p>
                                <p><strong>File ID:</strong> {localUploadedVideoData.fileId}</p>
                                <p>You can find this video on the <a href="/" className="alert-link">Home page</a> after Streamtape finishes processing.</p>
                            </div>
                        )}

                        <div className="d-grid gap-2 mt-4">
                            <button
                                className="btn btn-primary btn-lg"
                                onClick={handleLocalUpload} // Renamed handler for clarity
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

                    {/* Remote URL Upload Section */}
                    <div className="p-4 border rounded border-secondary bg-dark-subtle">
                        <h3 className="text-white mb-3">2. Upload from Remote URL</h3>
                        <p className="text-muted">Provide a publicly accessible URL for Streamtape to directly download the video. This is ideal for very large files as it bypasses your server.</p>
                        <div className="mb-3">
                            <label htmlFor="remoteUrl" className="form-label text-white">Video URL</label>
                            <input
                                type="text"
                                id="remoteUrl"
                                className="form-control bg-dark text-white border-secondary"
                                value={remoteUrl}
                                onChange={handleRemoteUrlChange}
                                placeholder="e.g., https://example.com/my-video.mp4"
                                disabled={isRemoteUploading}
                            />
                        </div>
                        <div className="mb-3">
                            <label htmlFor="remoteFileName" className="form-label text-white">Optional Custom Name (e.g., My Awesome Video.mp4)</label>
                            <input
                                type="text"
                                id="remoteFileName"
                                className="form-control bg-dark text-white border-secondary"
                                value={remoteFileName}
                                onChange={handleRemoteFileNameChange}
                                placeholder="e.g., My Awesome Remote Video.mp4"
                                disabled={isRemoteUploading}
                            />
                        </div>
                        <div className="d-grid gap-2 mt-4">
                            <button
                                className="btn btn-secondary btn-lg"
                                onClick={handleRemoteUpload}
                                disabled={!remoteUrl || isRemoteUploading}
                            >
                                {isRemoteUploading ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                        Initiating Remote Upload...
                                    </>
                                ) : (
                                    <>
                                        <i className="bi bi-link-45deg me-2"></i> Initiate Remote Upload
                                    </>
                                )}
                            </button>
                        </div>

                        {remoteUploadError && (
                            <div className="alert alert-danger mt-3" role="alert">
                                Remote Upload Error: {remoteUploadError}
                            </div>
                        )}

                        {remoteUploadId && (
                            <div className="alert alert-info mt-3" role="alert">
                                <h5>Remote Upload Status</h5>
                                <p className="mb-1"><strong>ID:</strong> <code>{remoteUploadId}</code></p>
                                <p className="mb-1"><strong>Status:</strong> {remoteUploadStatus}</p>
                                {remoteStreamtapeFinalUrl && (
                                    <p className="mb-1"><strong>Final URL:</strong> <a href={remoteStreamtapeFinalUrl} target="_blank" rel="noopener noreferrer" className="alert-link">{remoteStreamtapeFinalUrl}</a></p>
                                )}
                                <small className="text-muted d-block mt-2">
                                    {remoteUploadStatus.includes('finished') || remoteUploadStatus.includes('failed') ?
                                        'Upload process completed.' :
                                        'Checking status every 5 seconds...'
                                    }
                                </small>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

export default UploadVideo;