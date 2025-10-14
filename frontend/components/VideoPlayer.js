import React, { useRef, useState } from 'react';
import './VideoPlayer.css';

const VideoPlayer = ({ rtspUrl, overlays }) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);

  // Convert RTSP URL to HLS or use a proxy
  // For demonstration, we'll use a sample video URL
  // In production, you'd need a streaming server to convert RTSP to HLS/DASH
  const getStreamUrl = () => {
    if (rtspUrl) {
      // This would be your converted stream URL from a media server
      // For now, using a sample video
      return rtspUrl;
    }
    // Fallback to a sample video
    return 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
  };

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  };

  return (
    <div className="video-player-container">
      <div className="video-wrapper">
        <video
          ref={videoRef}
          className="video-element"
          src={getStreamUrl()}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
        
        {/* Render overlays on top of video */}
        {overlays && overlays.map((overlay) => (
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
                ...overlay.style
              }}
            >
              {overlay.type === 'text' ? (
                <div className="overlay-text" style={overlay.style}>
                  {overlay.content}
                </div>
              ) : (
                <img
                  src={overlay.content}
                  alt="Overlay"
                  className="overlay-image"
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              )}
            </div>
          )
        ))}
      </div>

      {/* Video Controls */}
      <div className="video-controls">
        <button onClick={handlePlayPause} className="control-button">
          {isPlaying ? '⏸ Pause' : '▶ Play'}
        </button>
        
        <div className="volume-control">
          <span>🔊</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={handleVolumeChange}
            className="volume-slider"
          />
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;