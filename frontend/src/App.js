import React, { useState, useEffect } from 'react';
import VideoPlayer from './components/VideoPlayer';
import OverlayManager from './components/OverlayManager';
import { overlayAPI, settingsAPI } from './services/api';
import './App.css';

function App() {
  const [overlays, setOverlays] = useState([]);
  const [rtspUrl, setRtspUrl] = useState('');
  const [rtspInput, setRtspInput] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    // Load overlays on component mount
    loadOverlays();
    loadRtspSettings();
  }, []);

  const loadOverlays = async () => {
    try {
      const response = await overlayAPI.getAll();
      setOverlays(response.overlays);
    } catch (error) {
      console.error('Error loading overlays:', error);
    }
  };

  const loadRtspSettings = async () => {
    try {
      const response = await settingsAPI.getRTSP();
      if (response.settings && response.settings.rtspUrl) {
        setRtspUrl(response.settings.rtspUrl);
        setRtspInput(response.settings.rtspUrl);
      }
    } catch (error) {
      console.error('Error loading RTSP settings:', error);
    }
  };

  const handleSaveRtsp = async (e) => {
    e.preventDefault();
    try {
      await settingsAPI.saveRTSP(rtspInput);
      setRtspUrl(rtspInput);
      setShowSettings(false);
      alert('RTSP URL saved successfully!');
    } catch (error) {
      console.error('Error saving RTSP URL:', error);
      alert('Failed to save RTSP URL');
    }
  };

  return (
    <div className="App">
      <header className="app-header">
        <div className="header-content">
          <h1>🎥 RTSP Livestream Player</h1>
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="settings-btn"
          >
            ⚙️ Settings
          </button>
        </div>
      </header>

      {showSettings && (
        <div className="settings-panel">
          <form onSubmit={handleSaveRtsp} className="rtsp-form">
            <div className="form-group">
              <label>RTSP Stream URL:</label>
              <input
                type="text"
                value={rtspInput}
                onChange={(e) => setRtspInput(e.target.value)}
                placeholder="rtsp://example.com/stream or http://video-url.mp4"
                className="rtsp-input"
              />
              <small className="help-text">
                Enter your RTSP URL or use a video URL for testing
              </small>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn-save">Save URL</button>
              <button 
                type="button" 
                onClick={() => setShowSettings(false)}
                className="btn-cancel"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <main className="app-main">
        <section className="video-section">
          <VideoPlayer rtspUrl={rtspUrl} overlays={overlays} />
          {!rtspUrl && (
            <div className="info-box">
              <p>👆 Click Settings to configure your RTSP stream URL</p>
              <p>For testing, you can use any video URL (MP4, etc.)</p>
            </div>
          )}
        </section>

        <section className="overlay-section">
          <OverlayManager 
            overlays={overlays} 
            onOverlaysUpdate={setOverlays}
          />
        </section>
      </main>

      <footer className="app-footer">
        <p>Built with React, Flask, and MongoDB</p>
      </footer>
    </div>
  );
}

export default App;