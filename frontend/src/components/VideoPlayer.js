import React, { useRef, useEffect, useState } from 'react';
import './VideoPlayer.css';

const VideoPlayer = ({ rtspUrl, overlays }) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (videoRef.current && rtspUrl) {
      videoRef.current.load();
      setError(null);
    }
  }, [rtspUrl]);

  const handlePlay = () => {
    if (videoRef.current) {
      videoRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(err => {
          console.error('Play error:', err);
          setError('Failed to play video. Check the URL and CORS settings.');
        });
    }
  };

  const handlePause = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  };

  const handleVideoError = () => {
    setError('Error loading video. Please check the stream URL.');
    setIsPlaying(false);
  };

  return (
    <div className="video-player-container">
      <div className="video-wrapper">
        {rtspUrl ? (
          <>
            <video
              ref={videoRef}
              className="video-element"
              onError={handleVideoError}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              crossOrigin="anonymous"
            >
              <source src={rtspUrl} type="video/mp4" />
              <source src={rtspUrl} type="application/x-mpegURL" />
              Your browser does not support the video tag.
            </video>

            {/* Overlays */}
            {overlays.map((overlay) => (
              overlay.isVisible && (
                <div
                  key={overlay._id}
                  className="video-overlay"
                  style={{
                    position: 'absolute',
                    left: `${overlay.position.x}px`,
                    top: `${overlay.position.y}px`,
                    width: `${overlay.size.width}px`,
                    height: `${overlay.size.height}px`,
                    ...overlay.style,
                    zIndex: 10,
                  }}
                >
                  {overlay.type === 'text' ? (
                    <div
                      style={{
                        color: overlay.style?.color || 'white',
                        fontSize: overlay.style?.fontSize || '16px',
                        fontWeight: overlay.style?.fontWeight || 'normal',
                        textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                      }}
                    >
                      {overlay.content}
                    </div>
                  ) : (
                    <img
                      src={overlay.content}
                      alt="Overlay"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                      }}
                    />
                  )}
                </div>
              )
            ))}

            {error && (
              <div className="error-message">
                <p>{error}</p>
              </div>
            )}
          </>
        ) : (
          <div className="no-video-message">
            <p>📹 No video stream configured</p>
            <p>Please set an RTSP URL in Settings</p>
          </div>
        )}
      </div>

      {rtspUrl && (
        <div className="video-controls">
          <div className="control-buttons">
            {!isPlaying ? (
              <button onClick={handlePlay} className="control-btn play-btn">
                ▶️ Play
              </button>
            ) : (
              <button onClick={handlePause} className="control-btn pause-btn">
                ⏸️ Pause
              </button>
            )}
          </div>

          <div className="volume-control">
            <label>🔊 Volume:</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={handleVolumeChange}
              className="volume-slider"
            />
            <span>{Math.round(volume * 100)}%</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;