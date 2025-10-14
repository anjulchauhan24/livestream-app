import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Plus, Trash2, X, Settings } from 'lucide-react';
import './App.css';

const API_BASE_URL = 'http://localhost:5000/api';

function App() {
  const [rtspUrl, setRtspUrl] = useState('');
  const [streamUrl, setStreamUrl] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [overlays, setOverlays] = useState([]);
  const [savedOverlays, setSavedOverlays] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [newOverlay, setNewOverlay] = useState({
    type: 'text',
    content: '',
    name: '',
    position: { x: 50, y: 50 },
    size: { width: 200, height: 50 },
    style: {
      fontSize: 24,
      color: '#ffffff',
      backgroundColor: 'rgba(0,0,0,0.5)'
    }
  });
  const [draggedOverlay, setDraggedOverlay] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const videoRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    fetchSavedOverlays();
    loadRtspSettings();
  }, []);

  const fetchSavedOverlays = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/overlays`);
      if (response.ok) {
        const data = await response.json();
        setSavedOverlays(data.overlays || []);
      }
    } catch (error) {
      console.error('Error fetching overlays:', error);
    }
  };

  const loadRtspSettings = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/settings/rtsp`);
      if (response.ok) {
        const data = await response.json();
        if (data.settings && data.settings.rtspUrl) {
          setRtspUrl(data.settings.rtspUrl);
        }
      }
    } catch (error) {
      console.error('Error loading RTSP settings:', error);
    }
  };

  const handleSaveRtsp = async () => {
    if (!rtspUrl) {
      alert('Please enter an RTSP URL');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/settings/rtsp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rtspUrl })
      });

      if (response.ok) {
        setStreamUrl(rtspUrl);
        setShowSettings(false);
        setIsPlaying(true);
        alert('Stream started successfully!');
      }
    } catch (error) {
      console.error('Error saving RTSP URL:', error);
      alert('Failed to start stream');
    }
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  };

  const addOverlay = async () => {
    if (!newOverlay.content || !newOverlay.name) {
      alert('Please provide overlay name and content');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/overlays`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOverlay)
      });

      if (response.ok) {
        const data = await response.json();
        const savedOverlay = data.overlay;
        setOverlays([...overlays, savedOverlay]);
        fetchSavedOverlays();
        resetNewOverlay();
        alert('Overlay created successfully!');
      }
    } catch (error) {
      console.error('Error creating overlay:', error);
      alert('Failed to create overlay');
    }
  };

  const deleteOverlay = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/overlays/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setOverlays(overlays.filter(o => o._id !== id));
        fetchSavedOverlays();
        alert('Overlay deleted successfully!');
      }
    } catch (error) {
      console.error('Error deleting overlay:', error);
      alert('Failed to delete overlay');
    }
  };

  const updateOverlay = async (id, updates) => {
    try {
      const response = await fetch(`${API_BASE_URL}/overlays/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        setOverlays(overlays.map(o => o._id === id ? { ...o, ...updates } : o));
        fetchSavedOverlays();
      }
    } catch (error) {
      console.error('Error updating overlay:', error);
    }
  };

  const loadSavedOverlay = (savedOverlay) => {
    if (!overlays.find(o => o._id === savedOverlay._id)) {
      setOverlays([...overlays, savedOverlay]);
    }
  };

  const resetNewOverlay = () => {
    setNewOverlay({
      type: 'text',
      content: '',
      name: '',
      position: { x: 50, y: 50 },
      size: { width: 200, height: 50 },
      style: {
        fontSize: 24,
        color: '#ffffff',
        backgroundColor: 'rgba(0,0,0,0.5)'
      }
    });
  };

  const handleOverlayMouseDown = (e, overlay) => {
    e.preventDefault();
    const container = containerRef.current.getBoundingClientRect();
    setDraggedOverlay(overlay);
    setDragOffset({
      x: e.clientX - container.left - overlay.position.x,
      y: e.clientY - container.top - overlay.position.y
    });
  };

  const handleMouseMove = (e) => {
    if (draggedOverlay && containerRef.current) {
      const container = containerRef.current.getBoundingClientRect();
      const newX = e.clientX - container.left - dragOffset.x;
      const newY = e.clientY - container.top - dragOffset.y;

      setOverlays(overlays.map(o =>
        o._id === draggedOverlay._id
          ? { 
              ...o, 
              position: {
                x: Math.max(0, Math.min(newX, container.width - o.size.width)),
                y: Math.max(0, Math.min(newY, container.height - o.size.height))
              }
            }
          : o
      ));
    }
  };

  const handleMouseUp = () => {
    if (draggedOverlay) {
      const overlay = overlays.find(o => o._id === draggedOverlay._id);
      if (overlay) {
        updateOverlay(overlay._id, { position: overlay.position });
      }
    }
    setDraggedOverlay(null);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px' }}>
        <header style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '10px' }}>
            🎥 RTSP Livestream Player
          </h1>
          <p style={{ fontSize: '1.2rem', opacity: 0.9 }}>Stream, Overlay, and Customize Your Video</p>
        </header>

        {!streamUrl ? (
          <div style={{ maxWidth: '600px', margin: '0 auto', background: 'rgba(255,255,255,0.95)', padding: '40px', borderRadius: '15px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
            <h2 style={{ color: '#333', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Play size={28} /> Start Your Livestream
            </h2>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#555', fontWeight: '600' }}>
                RTSP URL or Video URL
              </label>
              <input
                type="text"
                value={rtspUrl}
                onChange={(e) => setRtspUrl(e.target.value)}
                placeholder="rtsp://example.com:8554/stream or http://video.mp4"
                style={{ width: '100%', padding: '12px', fontSize: '16px', border: '2px solid #ddd', borderRadius: '8px', boxSizing: 'border-box' }}
              />
              <small style={{ display: 'block', marginTop: '5px', color: '#666' }}>
                Enter your RTSP URL or any video URL for testing
              </small>
            </div>
            <button
              onClick={handleSaveRtsp}
              style={{ width: '100%', padding: '15px', fontSize: '18px', fontWeight: 'bold', color: 'white', background: 'linear-gradient(135deg, #667eea, #764ba2)', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
            >
              <Play size={20} /> Start Stream
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
            <div>
              <div style={{ background: 'rgba(0,0,0,0.8)', padding: '20px', borderRadius: '15px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
                <div
                  ref={containerRef}
                  style={{ position: 'relative', background: '#000', borderRadius: '10px', overflow: 'hidden', aspectRatio: '16/9' }}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                >
                  <video
                    ref={videoRef}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    src={streamUrl}
                    autoPlay
                  />
                  
                  {overlays.map((overlay) => (
                    <div
                      key={overlay._id}
                      style={{
                        position: 'absolute',
                        left: `${overlay.position.x}px`,
                        top: `${overlay.position.y}px`,
                        width: `${overlay.size.width}px`,
                        minHeight: overlay.type === 'text' ? 'auto' : `${overlay.size.height}px`,
                        fontSize: `${overlay.style?.fontSize || 24}px`,
                        color: overlay.style?.color || '#ffffff',
                        backgroundColor: overlay.style?.backgroundColor || 'rgba(0,0,0,0.5)',
                        padding: '10px',
                        borderRadius: '5px',
                        cursor: 'move',
                        userSelect: 'none',
                        border: '2px solid rgba(255,255,255,0.3)'
                      }}
                      onMouseDown={(e) => handleOverlayMouseDown(e, overlay)}
                    >
                      {overlay.type === 'text' ? overlay.content : <img src={overlay.content} alt="overlay" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />}
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: '15px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <button
                    onClick={togglePlayPause}
                    style={{ padding: '12px', background: '#667eea', border: 'none', borderRadius: '50%', cursor: 'pointer', color: 'white' }}
                  >
                    {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                  </button>

                  <button
                    onClick={toggleMute}
                    style={{ padding: '12px', background: '#555', border: 'none', borderRadius: '50%', cursor: 'pointer', color: 'white' }}
                  >
                    {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                  </button>

                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={handleVolumeChange}
                    style={{ flex: 1 }}
                  />

                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    style={{ padding: '12px 20px', background: '#e91e63', border: 'none', borderRadius: '8px', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    <Settings size={18} /> Settings
                  </button>
                </div>
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.95)', padding: '20px', borderRadius: '15px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)', color: '#333' }}>
              <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Plus size={24} /> Overlay Manager
              </h3>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', fontSize: '14px' }}>Overlay Name</label>
                <input
                  type="text"
                  value={newOverlay.name}
                  onChange={(e) => setNewOverlay({ ...newOverlay, name: e.target.value })}
                  placeholder="My Overlay"
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '5px', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', fontSize: '14px' }}>Type</label>
                <select
                  value={newOverlay.type}
                  onChange={(e) => setNewOverlay({ ...newOverlay, type: e.target.value })}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '5px', fontSize: '14px' }}
                >
                  <option value="text">Text</option>
                  <option value="logo">Image/Logo URL</option>
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', fontSize: '14px' }}>
                  {newOverlay.type === 'text' ? 'Text Content' : 'Image URL'}
                </label>
                <input
                  type="text"
                  value={newOverlay.content}
                  onChange={(e) => setNewOverlay({ ...newOverlay, content: e.target.value })}
                  placeholder={newOverlay.type === 'text' ? 'Enter text...' : 'https://...'}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '5px', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <button
                onClick={addOverlay}
                style={{ width: '100%', padding: '12px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <Plus size={18} /> Add Overlay
              </button>

              <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #ddd' }}>
                <h4 style={{ marginBottom: '10px', fontSize: '16px' }}>Saved Overlays</h4>
                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {savedOverlays.map((overlay) => (
                    <div
                      key={overlay._id}
                      style={{ background: '#f5f5f5', padding: '10px', borderRadius: '5px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    >
                      <div>
                        <div style={{ fontWeight: '600', fontSize: '14px' }}>{overlay.name}</div>
                        <div style={{ fontSize: '12px', color: '#666' }}>{overlay.type}</div>
                      </div>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <button
                          onClick={() => loadSavedOverlay(overlay)}
                          style={{ padding: '6px 10px', background: '#2196F3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                        >
                          Load
                        </button>
                        <button
                          onClick={() => deleteOverlay(overlay._id)}
                          style={{ padding: '6px', background: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #ddd' }}>
                <h4 style={{ marginBottom: '10px', fontSize: '16px' }}>Active Overlays</h4>
                <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                  {overlays.map((overlay) => (
                    <div
                      key={overlay._id}
                      style={{ background: '#e3f2fd', padding: '8px 12px', borderRadius: '5px', marginBottom: '5px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    >
                      <span style={{ fontSize: '13px', fontWeight: '500' }}>{overlay.name || overlay.content}</span>
                      <button
                        onClick={() => setOverlays(overlays.filter(o => o._id !== overlay._id))}
                        style={{ padding: '4px', background: '#f44336', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;