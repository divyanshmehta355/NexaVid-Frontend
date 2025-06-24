// client/src/App.jsx
import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

// Import your page components
import HomePage from './components/HomePage';
import VideoDetailPage from './components/VideoDetailPage';
import UploadVideo from './components/UploadVideo'; // For the new upload page

function App() {
  return (
    <>
      {/* Default Helmet for the entire app, can be overridden by specific pages */}
      <Helmet>
        <title>Seductive Streams</title>
        <meta name="description" content="Watch and upload your favorite videos on Seductive Streams." />
        <meta property="og:title" content="Seductive Streams" />
        <meta property="og:description" content="Your go-to platform for captivating video content." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://your-frontend-url.pages.dev" /> {/* Update this for production */}
        {/* You can add a default og:image here if you have one */}
      </Helmet>

      {/* Navigation Bar */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
        <div className="container-fluid">
          <Link className="navbar-brand d-flex align-items-center" to="/">
            <i className="bi bi-play-btn-fill me-2"></i>Seductive Streams
          </Link>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ms-auto">
              <li className="nav-item">
                <Link className="nav-link" to="/">Home</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/upload">Upload</Link>
              </li>
              {/* Add more nav items here if needed */}
            </ul>
          </div>
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
        <p>&copy; {new Date().getFullYear()} Seductive Streams. All rights reserved.</p>
      </footer>
    </>
  );
}

export default App;