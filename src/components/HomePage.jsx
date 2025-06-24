// client/src/components/HomePage.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { Helmet } from 'react-helmet-async';
import VideoCard from './VideoCard';

const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL;
const INITIAL_LOAD_COUNT = 6; // How many cards to show initially
const LOAD_MORE_COUNT = 3;    // How many more cards to load on scroll

// Helper function for Fisher-Yates (Knuth) shuffle
// Takes an array and shuffles it in place.
const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]]; // Swap elements
  }
  return array;
};

function HomePage() {
  const [allVideos, setAllVideos] = useState([]); // Stores all videos fetched from API
  const [filteredVideos, setFilteredVideos] = useState([]); // Videos filtered by search term
  const [displayedVideos, setDisplayedVideos] = useState([]); // Videos currently visible on UI

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [hasMore, setHasMore] = useState(true);

  // Ref for the loading indicator to observe for infinite scroll
  const observerTarget = useRef(null);

  // --- API Call to Fetch All Videos ---
  const fetchAllVideos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${BACKEND_API_URL}/videos`);
      if (response.data.success) {
        // --- NEW: Shuffle the videos here! ---
        const shuffledVideos = shuffleArray([...response.data.videos]); // Create a copy before shuffling
        setAllVideos(shuffledVideos);
      } else {
        setError(response.data.message || 'Failed to fetch videos.');
      }
    } catch (err) {
      console.error('Error fetching videos:', err);
      setError('Failed to load videos. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  // --- Effect to Fetch Videos on Component Mount ---
  useEffect(() => {
    fetchAllVideos();
  }, [fetchAllVideos]);

  // --- Effect to Filter Videos based on Search Term ---
  // This runs whenever `allVideos` or `searchTerm` changes.
  useEffect(() => {
    const lowercasedSearchTerm = searchTerm.toLowerCase();
    const filtered = allVideos.filter(video =>
      video.name.toLowerCase().includes(lowercasedSearchTerm)
    );
    setFilteredVideos(filtered);
    // Reset displayed videos and hasMore when search filter changes
    setDisplayedVideos(filtered.slice(0, INITIAL_LOAD_COUNT));
    setHasMore(filtered.length > INITIAL_LOAD_COUNT);
  }, [searchTerm, allVideos]);

  // --- Function to Load More Videos ---
  const loadMoreVideos = useCallback(() => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);

    const currentLength = displayedVideos.length;
    const nextVideos = filteredVideos.slice(currentLength, currentLength + LOAD_MORE_COUNT);

    setTimeout(() => {
      setDisplayedVideos(prevVideos => [...prevVideos, ...nextVideos]);
      setHasMore(currentLength + nextVideos.length < filteredVideos.length);
      setLoadingMore(false);
    }, 500);
  }, [loadingMore, hasMore, displayedVideos, filteredVideos]);


  // --- Intersection Observer Setup for Infinite Scroll ---
  useEffect(() => {
    if (loading || !observerTarget.current) return;

    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !loadingMore && hasMore) {
        loadMoreVideos();
      }
    }, {
      rootMargin: '100px'
    });

    observer.observe(observerTarget.current);

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [loading, loadingMore, hasMore, loadMoreVideos]);

  // --- Handlers ---
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  // --- Render Logic ---
  if (loading) {
    return (
      <div className="text-center my-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading videos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger text-center my-5" role="alert">
        <h4>Error!</h4>
        <p>{error}</p>
        <button className="btn btn-primary" onClick={fetchAllVideos}>Retry</button>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Home - Seductive Streams</title>
        <meta name="description" content="Browse a collection of captivating videos on Seductive Streams." />
      </Helmet>

      <div className="row mb-4">
        <div className="col-12 col-md-8 mx-auto">
          <div className="input-group">
            <input
              type="text"
              className="form-control"
              placeholder="Search for videos..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
            <button className="btn btn-primary" type="button">
              <i className="bi bi-search"></i>
            </button>
          </div>
        </div>
      </div>

      <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-4">
        {displayedVideos.length > 0 ? (
          displayedVideos.map((video) => (
            <div className="col" key={video.linkid}>
              <VideoCard video={video} />
            </div>
          ))
        ) : (
          <div className="col-12 text-center my-5">
            <p className="lead">
              {searchTerm ? `No videos found matching "${searchTerm}". Try a different term!` : 'No videos available.'}
            </p>
          </div>
        )}
      </div>

      {/* Loading indicator for infinite scroll */}
      {hasMore && (
        <div ref={observerTarget} className="text-center my-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading more videos...</span>
          </div>
          <p className="mt-2">Loading more videos...</p>
        </div>
      )}

      {!hasMore && displayedVideos.length > 0 && (
        <div className="text-center my-4 text-muted">
          <p>You've reached the end of the video list.</p>
        </div>
      )}
    </>
  );
}

export default HomePage;