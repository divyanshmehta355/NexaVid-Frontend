import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { Helmet } from "react-helmet-async";

const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL;

function VideoDetailPage() {
  const { id } = useParams(); // Get the video link ID from the URL
  const [videoDetails, setVideoDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloadTicket, setDownloadTicket] = useState(null);
  const [downloadLink, setDownloadLink] = useState(null);
  const [waitingForTicket, setWaitingForTicket] = useState(false);
  const [ticketCountdown, setTicketCountdown] = useState(0);

  useEffect(() => {
    // For Streamtape, the 'id' from the URL is the link ID used for embeds and details.
    // We don't have a direct "get details by linkId" but we have the embed URL structure.
    const fetchVideoDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        // Here, we simulate fetching details. In a real scenario, you'd have
        // a backend endpoint that potentially fetches details from Streamtape (if available),
        // or from your own MongoDB cache.
        // For Streamtape, the `id` IS the embed ID. We can infer details.
        // We can fetch the thumbnail to confirm existence and get a placeholder name if needed.
        const thumbnailResponse = await axios.get(
          `${BACKEND_API_URL}/videos/${id}/thumbnail`
        );
        if (
          thumbnailResponse.data.success &&
          thumbnailResponse.data.thumbnailUrl
        ) {
          setVideoDetails({
            linkid: id,
            name: `Video ${id}`, // Placeholder name, adjust if you can get actual name
            embedUrl: `https://streamtape.com/e/${id}`,
            thumbnailUrl: thumbnailResponse.data.thumbnailUrl,
            // You can add more details here if your backend fetches them
          });
        } else {
          setError("Video not found or details unavailable.");
        }
      } catch (err) {
        console.error("Error fetching video details:", err);
        setError("Failed to load video details.");
      } finally {
        setLoading(false);
      }
    };

    fetchVideoDetails();
  }, [id]);

  const handleGetDownloadLink = async () => {
    setWaitingForTicket(true);
    setDownloadLink(null); // Clear previous link
    try {
      // Step 1: Get download ticket
      const ticketResponse = await axios.get(
        `${BACKEND_API_URL}/videos/${id}/download-ticket`
      );
      if (ticketResponse.data.success && ticketResponse.data.ticket) {
        setDownloadTicket(ticketResponse.data.ticket);
        setTicketCountdown(ticketResponse.data.wait_time);

        // Start countdown
        let countdown = ticketResponse.data.wait_time;
        const interval = setInterval(async () => {
          countdown -= 1;
          setTicketCountdown(countdown);
          if (countdown <= 0) {
            clearInterval(interval);
            // Step 2: Get actual download link using the ticket
            const linkResponse = await axios.get(
              `${BACKEND_API_URL}/videos/${id}/download-link?ticket=${ticketResponse.data.ticket}`
            );
            if (linkResponse.data.success && linkResponse.data.downloadUrl) {
              setDownloadLink(linkResponse.data.downloadUrl);
            } else {
              alert(
                "Failed to get download link: " +
                  (linkResponse.data.message || "Unknown error")
              );
            }
            setWaitingForTicket(false);
          }
        }, 1000);
      } else {
        alert(
          "Failed to get download ticket: " +
            (ticketResponse.data.message || "Unknown error")
        );
        setWaitingForTicket(false);
      }
    } catch (err) {
      console.error("Error getting download link:", err);
      alert("Error fetching download link. Please try again.");
      setWaitingForTicket(false);
    }
  };

  const handleDownload = () => {
    if (downloadLink) {
      window.open(downloadLink, "_blank"); // Open download link in a new tab
    }
  };

  if (loading) {
    return (
      <div className="text-center my-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading video details...</span>
        </div>
        <p className="mt-2">Loading video details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger text-center my-5" role="alert">
        <h4>Error!</h4>
        <p>{error}</p>
        <button
          className="btn btn-primary"
          onClick={() => window.location.reload()}
        >
          Reload Page
        </button>
      </div>
    );
  }

  if (!videoDetails) {
    return (
      <div className="alert alert-info text-center my-5" role="alert">
        <p>Video not found or invalid ID.</p>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{videoDetails.name} - Seductive Streams</title>
        <meta
          name="description"
          content={`Watch ${videoDetails.name} on Seductive Streams.`}
        />
        {/* Open Graph Meta Tags for Sharing */}
        <meta property="og:title" content={videoDetails.name} />
        <meta
          property="og:description"
          content={`Watch ${videoDetails.name} now!`}
        />
        <meta property="og:type" content="video.other" />
        <meta
          property="og:url"
          content={`https://your-frontend-url.pages.dev/video/${id}`}
        />{" "}
        {/* Update this for production */}
        <meta property="og:image" content={videoDetails.thumbnailUrl} />
        <meta property="og:site_name" content="Seductive Streams" />
      </Helmet>

      <div className="row justify-content-center">
        <div className="col-12 col-lg-8">
          <div className="card bg-dark text-white border-secondary shadow-lg">
            <div className="card-header border-secondary">
              <h1 className="card-title h3 text-truncate">
                {videoDetails.name}
              </h1>
            </div>
            <div className="card-body p-0">
              {/* Streamtape Embed Player */}
              <div className="embed-responsive embed-responsive-16by9">
                <iframe
                  src={videoDetails.embedUrl}
                  className="embed-responsive-item w-100"
                  allowFullScreen
                  title={videoDetails.name}
                  frameBorder="0"
                  scrolling="no"
                  style={{ minHeight: "400px" }}
                ></iframe>
              </div>
            </div>
            <div className="card-footer border-secondary text-center">
              <div className="d-grid gap-2">
                {!downloadLink ? (
                  <button
                    className="btn btn-warning btn-lg"
                    onClick={handleGetDownloadLink}
                    disabled={waitingForTicket}
                  >
                    {waitingForTicket ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                        ></span>
                        Waiting {ticketCountdown}s for Download Ticket...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-download me-2"></i> Get Download
                        Link
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    className="btn btn-success btn-lg"
                    onClick={handleDownload}
                  >
                    <i className="bi bi-box-arrow-down me-2"></i> Download Now
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* You can add a section for related videos here later */}
    </>
  );
}

export default VideoDetailPage;
