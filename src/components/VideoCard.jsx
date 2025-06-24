import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL;

function VideoCard({ video }) {
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [loadingThumbnail, setLoadingThumbnail] = useState(true);
  const [errorThumbnail, setErrorThumbnail] = useState(false);

  useEffect(() => {
    const fetchThumbnail = async () => {
      try {
        const response = await axios.get(
          `${BACKEND_API_URL}/videos/${video.linkid}/thumbnail`
        );
        if (response.data.success && response.data.thumbnailUrl) {
          setThumbnailUrl(response.data.thumbnailUrl);
        } else {
          setErrorThumbnail(true);
        }
      } catch (err) {
        console.error("Error fetching thumbnail:", err);
        setErrorThumbnail(true);
      } finally {
        setLoadingThumbnail(false);
      }
    };

    fetchThumbnail();
  }, [video.linkid]);

  const defaultThumbnail =
    "https://via.placeholder.com/320x180?text=No+Thumbnail"; // Placeholder image

  return (
    <div className="card h-100 bg-dark text-white border-secondary shadow-sm">
      <Link to={`/video/${video.linkid}`}>
        {loadingThumbnail ? (
          <div
            className="d-flex justify-content-center align-items-center bg-secondary"
            style={{ height: "180px", width: "100%" }}
          >
            <div className="spinner-border text-light" role="status">
              <span className="visually-hidden">Loading thumbnail...</span>
            </div>
          </div>
        ) : errorThumbnail || !thumbnailUrl ? (
          <img
            src={defaultThumbnail}
            className="card-img-top"
            alt="Thumbnail not available"
          />
        ) : (
          <img src={thumbnailUrl} className="card-img-top" alt={video.name} />
        )}
      </Link>
      <div className="card-body">
        <h5 className="card-title text-truncate">{video.name}</h5>
        <p className="card-text text-muted small">
          Size:{" "}
          {video.size ? `${(video.size / (1024 * 1024)).toFixed(2)} MB` : "N/A"}
        </p>
        <Link
          to={`/video/${video.linkid}`}
          className="btn btn-primary btn-sm stretched-link"
        >
          Watch Now
        </Link>
      </div>
    </div>
  );
}

export default VideoCard;
