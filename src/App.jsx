import React from "react";
import { Routes, Route, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";

// Import your page components
import HomePage from "./components/HomePage";
import VideoDetailPage from "./components/VideoDetailPage";
import UploadVideo from "./components/UploadVideo"; // For the new upload page

function App() {
  return (
    <>
      {/* Default Helmet for the entire app, can be overridden by specific pages */}
      <Helmet>
        <title>Seductive Streams</title>
        <meta
          name="description"
          content="Watch and upload your favorite p*rn videos on Raat Rani."
        />
        <meta property="og:title" content="Seductive Streams" />
        <meta
          property="og:description"
          content="Your go-to platform for captivating video content."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://raatrani.pages.dev" />{" "}
        {/* Update this for production */}
        {/* You can add a default og:image here if you have one */}
      </Helmet>

      {/* Navigation Bar */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
        <div className="container-fluid">
          <Link className="navbar-brand d-flex align-items-center" to="/">
            <i className="bi bi-play-btn-fill me-2"></i>Raat Rani
          </Link>

          <ul className="navbar-nav ms-auto d-flex align-items-center">
            {" "}
            {/* ms-auto pushes items to the right */}
            {/* The Upload button, now prominent and to the far right */}
            <li className="nav-item ms-3">
              {" "}
              {/* Added margin-start for spacing from Home */}
              <Link
                className="btn btn-primary d-flex align-items-center position-relative" // position-relative for potential badge
                to="/upload"
              >
                <i className="bi bi-cloud-arrow-up-fill me-2"></i>Upload
                {/* Optional: A notification badge. 
                  Uncomment and add logic if you want a dynamic "notification" (e.g., new features, pending uploads).
                  <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                    New!
                    <span className="visually-hidden">new upload features</span>
                  </span>
                */}
              </Link>
            </li>
            {/* Add more non-collapsible nav items here if needed */}
          </ul>
        </div>
      </nav>

      {/* Main Content Area with Routes */}
      <div className="container mt-4">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/video/:id" element={<VideoDetailPage />} />
          <Route path="/upload" element={<UploadVideo />} />
          {/* Add a 404 Not Found route */}
          <Route path="*" element={<h2>404 - Page Not Found</h2>} />
        </Routes>
      </div>

      {/* Footer (Optional) */}
      <footer className="bg-dark text-white text-center py-3 mt-5">
        <p>
          &copy; {new Date().getFullYear()} Seductive Streams. All rights
          reserved.
        </p>
      </footer>
    </>
  );
}

export default App;
