import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Plus, Trash2, X, Settings, Save, Eye, Move, Maximize2, Minimize2, RefreshCw, SkipBack, SkipForward } from 'lucide-react';

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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showOverlayForm, setShowOverlayForm] = useState(false);
  const [notification, setNotification] = useState(null);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [newOverlay, setNewOverlay] = useState({
    type: 'text',
    content: '',
    name: '',
    position: { x: 50, y: 50 },
    size: { width: 200, height: 50 },
    style: {
      fontSize: 24,
      color: '#ffffff',
      backgroundColor: 'rgba(0,0,0,0.7)',
      padding: '12px',
      borderRadius: '8px',
      fontWeight: 'bold'
    }
  });
  const [draggedOverlay, setDraggedOverlay] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showCenterControls, setShowCenterControls] = useState(false);
  const [isLiveStream, setIsLiveStream] = useState(false);
  const [isYouTube, setIsYouTube] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const centerControlsTimeout = useRef(null);
  const volumeSliderRef = useRef(null);

  useEffect(() => {
    fetchSavedOverlays();
    loadRtspSettings();
    
    const handleClickOutside = (event) => {
      if (volumeSliderRef.current && !volumeSliderRef.current.contains(event.target)) {
        setShowVolumeSlider(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || isYouTube) return;

    const updateTime = () => {
      if (video.currentTime) {
        setCurrentTime(video.currentTime);
      }
    };
    
    const updateDuration = () => {
      if (video.duration && !isNaN(video.duration) && video.duration !== Infinity) {
        setDuration(video.duration);
      }
    };

    const handleCanPlay = () => {
      updateDuration();
    };

    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('loadedmetadata', updateDuration);
    video.addEventListener('durationchange', updateDuration);
    video.addEventListener('canplay', handleCanPlay);

    // Initial check
    if (video.readyState >= 1) {
      updateDuration();
    }

    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('loadedmetadata', updateDuration);
      video.removeEventListener('durationchange', updateDuration);
      video.removeEventListener('canplay', handleCanPlay);
    };
  }, [streamUrl, isYouTube]);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

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
        if (data.settings?.rtspUrl) {
          setRtspUrl(data.settings.rtspUrl);
        }
      }
    } catch (error) {
      console.error('Error loading RTSP settings:', error);
    }
  };

  const convertYouTubeUrl = (url) => {
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(youtubeRegex);
    if (match && match[1]) {
      return `https://www.youtube.com/embed/${match[1]}?autoplay=1&controls=0&modestbranding=1&enablejsapi=1`;
    }
    return url;
  };

  const handleSaveRtsp = async () => {
    if (!rtspUrl) {
      showNotification('Please enter a stream URL', 'error');
      return;
    }

    try {
      let processedUrl = rtspUrl;
      let isLive = false;
      let isYT = false;
      
      // Check if it's a YouTube URL
      if (rtspUrl.includes('youtube.com') || rtspUrl.includes('youtu.be')) {
        processedUrl = convertYouTubeUrl(rtspUrl);
        isLive = true;
        isYT = true;
      }
      // Check if it's an RTSP stream
      else if (rtspUrl.toLowerCase().startsWith('rtsp://')) {
        // For RTSP streams, we need backend support
        // Try to use the backend API to convert RTSP to HLS or other web-compatible format
        try {
          const response = await fetch(`${API_BASE_URL}/stream/convert`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rtspUrl: rtspUrl })
          });
          
          if (response.ok) {
            const data = await response.json();
            processedUrl = data.streamUrl || rtspUrl;
          } else {
            showNotification('RTSP streams require backend server. Using demo video instead.', 'error');
            // Fallback to a demo video
            processedUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
          }
        } catch (error) {
          showNotification('Cannot connect to backend. RTSP needs server support. Using demo video.', 'error');
          // Fallback to demo video
          processedUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
        }
        isLive = true;
      }
      // Check if it's a live stream indicator
      else if (rtspUrl.toLowerCase().includes('/live/')) {
        isLive = true;
      }
      
      setIsLiveStream(isLive);
      setIsYouTube(isYT);
      
      const response = await fetch(`${API_BASE_URL}/settings/rtsp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rtspUrl: processedUrl })
      });

      if (response.ok || !rtspUrl.startsWith('rtsp://')) {
        setStreamUrl(processedUrl);
        setShowSettings(false);
        showNotification('Stream started successfully!');
        setTimeout(() => setIsPlaying(true), 500);
      }
    } catch (error) {
      showNotification('Failed to start stream', 'error');
    }
  };

  const togglePlayPause = () => {
    if (videoRef.current && !isYouTube) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(e => console.log('Play error:', e));
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (seconds) => {
    if (videoRef.current && !isYouTube) {
      const video = videoRef.current;
      const newTime = Math.max(0, Math.min(currentTime + seconds, duration || video.duration || 0));
      
      if (isLiveStream && newTime > currentTime && duration > 0 && Math.abs(duration - currentTime) < 2) {
        showNotification('Already at live point', 'error');
        return;
      }
      
      video.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const showCenterControlsTemporarily = () => {
    setShowCenterControls(true);
    if (centerControlsTimeout.current) {
      clearTimeout(centerControlsTimeout.current);
    }
    centerControlsTimeout.current = setTimeout(() => {
      setShowCenterControls(false);
    }, 2000);
  };

  const handleVideoClick = (e) => {
    if (e.target.tagName !== 'VIDEO' && e.target.tagName !== 'DIV') return;
    togglePlayPause();
    showCenterControlsTemporarily();
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
      if (newVolume === 0) {
        setIsMuted(true);
        videoRef.current.muted = true;
      } else if (isMuted) {
        setIsMuted(false);
        videoRef.current.muted = false;
      }
    }
  };

  const addOverlay = async () => {
    if (!newOverlay.content || !newOverlay.name) {
      showNotification('Please provide overlay name and content', 'error');
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
        setOverlays([...overlays, data.overlay]);
        fetchSavedOverlays();
        resetNewOverlay();
        setShowOverlayForm(false);
        showNotification('Overlay created successfully!');
      }
    } catch (error) {
      showNotification('Failed to create overlay', 'error');
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
        showNotification('Overlay deleted successfully!');
      }
    } catch (error) {
      showNotification('Failed to delete overlay', 'error');
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
      showNotification(`Loaded "${savedOverlay.name}" overlay`);
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
        backgroundColor: 'rgba(0,0,0,0.7)',
        padding: '12px',
        borderRadius: '8px',
        fontWeight: 'bold'
      }
    });
  };

  const handleOverlayMouseDown = (e, overlay) => {
    if (e.target.classList.contains('resize-handle')) return;
    e.preventDefault();
    e.stopPropagation();
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

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds) || !isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 50%, #7e22ce 100%)', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, opacity: 0.1 }}>
        <div style={{ position: 'absolute', top: '20%', left: '10%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)', borderRadius: '50%', animation: 'float 20s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', bottom: '20%', right: '10%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)', borderRadius: '50%', animation: 'float 25s ease-in-out infinite reverse' }} />
      </div>

      {notification && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 10000, padding: '16px 24px', background: notification.type === 'success' ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #ef4444, #dc2626)', color: 'white', borderRadius: '12px', boxShadow: '0 10px 40px rgba(0,0,0,0.3)', animation: 'slideIn 0.3s ease-out', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '600' }}>
          {notification.type === 'success' ? '✓' : '⚠'} {notification.message}
        </div>
      )}

      <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '20px', position: 'relative', zIndex: 1 }}>
        <header style={{ textAlign: 'center', marginBottom: '40px', animation: 'fadeIn 1s ease-out' }}>
          <div style={{ display: 'inline-block', padding: '20px 40px', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.2)' }}>
            <h1 style={{ fontSize: '3.5rem', fontWeight: '900', background: 'linear-gradient(135deg, #fff, #a5b4fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '10px', letterSpacing: '-1px' }}>
              🎥 RTSP Live Studio
            </h1>
            <p style={{ fontSize: '1.3rem', color: 'rgba(255,255,255,0.9)', fontWeight: '500' }}>Professional Video Streaming with Dynamic Overlays</p>
          </div>
        </header>

        {!streamUrl ? (
          <div style={{ maxWidth: '700px', margin: '0 auto', animation: 'scaleIn 0.5s ease-out' }}>
            <div style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)', padding: '50px', borderRadius: '24px', boxShadow: '0 20px 60px rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.3)' }}>
              <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '80px', height: '80px', background: 'linear-gradient(135deg, #667eea, #764ba2)', borderRadius: '20px', marginBottom: '20px', boxShadow: '0 10px 30px rgba(102, 126, 234, 0.4)' }}>
                  <Play size={40} color="white" />
                </div>
                <h2 style={{ color: '#1f2937', fontSize: '2rem', fontWeight: '800', marginBottom: '10px' }}>Start Your Livestream</h2>
                <p style={{ color: '#6b7280', fontSize: '1.1rem' }}>Enter your stream URL to begin broadcasting</p>
              </div>
              
              <div style={{ marginBottom: '30px' }}>
                <label style={{ display: 'block', marginBottom: '12px', color: '#374151', fontWeight: '700', fontSize: '1rem' }}>
                  Stream URL
                </label>
                <input
                  type="text"
                  value={rtspUrl}
                  onChange={(e) => setRtspUrl(e.target.value)}
                  placeholder="rtsp://example.com:8554/stream, YouTube URL, or http://video.mp4"
                  style={{ width: '100%', padding: '16px 20px', fontSize: '1rem', border: '2px solid #e5e7eb', borderRadius: '12px', boxSizing: 'border-box', transition: 'all 0.3s', outline: 'none', background: '#f9fafb' }}
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                  onKeyPress={(e) => e.key === 'Enter' && handleSaveRtsp()}
                />
                <div style={{ marginTop: '12px', padding: '12px', background: '#eff6ff', borderRadius: '8px', border: '1px solid #dbeafe' }}>
                  <small style={{ color: '#1e40af', fontSize: '0.9rem', lineHeight: '1.5' }}>
                    💡 <strong>Tip:</strong> Works with YouTube, MP4/WebM/HLS URLs. RTSP requires backend server.
                  </small>
                </div>
                <div style={{ marginTop: '8px', padding: '12px', background: '#fef3c7', borderRadius: '8px', border: '1px solid #fcd34d' }}>
                  <small style={{ color: '#92400e', fontSize: '0.85rem', lineHeight: '1.5' }}>
                    ⚠️ <strong>Note:</strong> RTSP streams (rtsp://) cannot play directly in browsers. You need a backend server to convert RTSP to HLS/WebRTC format.
                  </small>
                </div>
              </div>
              
              <button
                onClick={handleSaveRtsp}
                style={{ width: '100%', padding: '18px', fontSize: '1.1rem', fontWeight: '700', color: 'white', background: 'linear-gradient(135deg, #667eea, #764ba2)', border: 'none', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', boxShadow: '0 10px 30px rgba(102, 126, 234, 0.4)', transition: 'all 0.3s' }}
                onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
              >
                <Play size={24} /> Launch Stream
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '30px', animation: 'fadeIn 0.5s ease-out' }}>
            <div>
              <div style={{ background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(20px)', padding: '24px', borderRadius: '20px', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div
                  ref={containerRef}
                  style={{ position: 'relative', background: '#000', borderRadius: '12px', overflow: 'hidden', aspectRatio: '16/9', boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)', cursor: 'pointer' }}
                  onMouseMove={(e) => {
                    handleMouseMove(e);
                    showCenterControlsTemporarily();
                  }}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onClick={handleVideoClick}
                >
                  {streamUrl.includes('youtube.com') ? (
                    <iframe
                      src={streamUrl}
                      style={{ width: '100%', height: '100%', border: 'none' }}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <video
                      ref={videoRef}
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      src={streamUrl}
                      autoPlay
                      controls={false}
                      crossOrigin="anonymous"
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                      onLoadedMetadata={() => {
                        if (videoRef.current) {
                          setDuration(videoRef.current.duration);
                        }
                      }}
                      onTimeUpdate={() => {
                        if (videoRef.current) {
                          setCurrentTime(videoRef.current.currentTime);
                        }
                      }}
                    >
                      <source src={streamUrl} type="video/mp4" />
                      <source src={streamUrl} type="video/webm" />
                      <source src={streamUrl} type="video/ogg" />
                      <source src={streamUrl} type="application/x-mpegURL" />
                      Your browser does not support the video tag.
                    </video>
                  )}
                  
                  {showCenterControls && (
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 100, animation: 'fadeIn 0.3s ease-out', pointerEvents: 'none' }}>
                      <div style={{ width: '100px', height: '100px', background: 'rgba(0,0,0,0.85)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)', border: '3px solid rgba(255,255,255,0.4)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
                        {isPlaying ? <Pause size={50} color="white" /> : <Play size={50} color="white" style={{ marginLeft: '5px' }} />}
                      </div>
                    </div>
                  )}
                  
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
                        backgroundColor: overlay.style?.backgroundColor || 'rgba(0,0,0,0.7)',
                        padding: overlay.style?.padding || '12px',
                        borderRadius: overlay.style?.borderRadius || '8px',
                        fontWeight: overlay.style?.fontWeight || 'bold',
                        cursor: 'move',
                        userSelect: 'none',
                        border: '2px solid rgba(255,255,255,0.3)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                        transition: 'box-shadow 0.3s',
                        zIndex: draggedOverlay?._id === overlay._id ? 1000 : 10
                      }}
                      onMouseDown={(e) => handleOverlayMouseDown(e, overlay)}
                      onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 8px 24px rgba(255,255,255,0.2)'}
                      onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)'}
                    >
                      {overlay.type === 'text' ? overlay.content : <img src={overlay.content} alt="overlay" style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }} />}
                      <div style={{ position: 'absolute', top: '-8px', right: '-8px', width: '20px', height: '20px', background: '#ef4444', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '12px', color: 'white', fontWeight: 'bold' }} onClick={(e) => { e.stopPropagation(); setOverlays(overlays.filter(o => o._id !== overlay._id)); }}>×</div>
                    </div>
                  ))}

                  {isPlaying && (
                    <div style={{ position: 'absolute', top: '16px', left: '16px', padding: '8px 16px', background: 'rgba(239, 68, 68, 0.95)', color: 'white', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontSize: '0.9rem', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)' }}>
                      <div style={{ width: '8px', height: '8px', background: 'white', borderRadius: '50%', animation: 'pulse 1.5s ease-in-out infinite' }} />
                      LIVE
                    </div>
                  )}

                  <button
                    onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
                    style={{ position: 'absolute', top: '16px', right: '16px', padding: '10px', background: 'rgba(0,0,0,0.7)', border: 'none', borderRadius: '8px', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', transition: 'all 0.3s' }}
                    onMouseEnter={(e) => e.target.style.background = 'rgba(0,0,0,0.9)'}
                    onMouseLeave={(e) => e.target.style.background = 'rgba(0,0,0,0.7)'}
                  >
                    {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                  </button>
                </div>

                <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                  <button
                    onClick={togglePlayPause}
                    disabled={isYouTube}
                    style={{ padding: '14px 24px', background: isPlaying ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'linear-gradient(135deg, #10b981, #059669)', border: 'none', borderRadius: '12px', cursor: isYouTube ? 'not-allowed' : 'pointer', color: 'white', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontSize: '1rem', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', transition: 'all 0.3s', opacity: isYouTube ? 0.5 : 1 }}
                    onMouseEnter={(e) => !isYouTube && (e.target.style.transform = 'translateY(-2px)')}
                    onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                  >
                    {isPlaying ? <><Pause size={20} /> Pause</> : <><Play size={20} /> Play</>}
                  </button>

                  {!isYouTube && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleSeek(-10)}
                        disabled={currentTime < 10}
                        style={{ padding: '14px 18px', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', border: 'none', borderRadius: '12px', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700', fontSize: '0.95rem', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)', transition: 'all 0.3s', opacity: currentTime < 10 ? 0.5 : 1 }}
                        onMouseEnter={(e) => currentTime >= 10 && (e.target.style.transform = 'translateY(-2px)')}
                        onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                        title="Rewind 10 seconds"
                      >
                        <SkipBack size={18} /> 10s
                      </button>
                      <button
                        onClick={() => handleSeek(10)}
                        disabled={isLiveStream && Math.abs(duration - currentTime) < 2}
                        style={{ padding: '14px 18px', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', border: 'none', borderRadius: '12px', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700', fontSize: '0.95rem', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)', transition: 'all 0.3s', opacity: (isLiveStream && Math.abs(duration - currentTime) < 2) ? 0.5 : 1 }}
                        onMouseEnter={(e) => !(isLiveStream && Math.abs(duration - currentTime) < 2) && (e.target.style.transform = 'translateY(-2px)')}
                        onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                        title="Forward 10 seconds"
                      >
                        10s <SkipForward size={18} />
                      </button>
                    </div>
                  )}

                  <div ref={volumeSliderRef} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 20px', background: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isYouTube) {
                          setShowVolumeSlider(!showVolumeSlider);
                        }
                      }}
                      disabled={isYouTube}
                      style={{ padding: '8px', background: 'transparent', border: 'none', cursor: isYouTube ? 'not-allowed' : 'pointer', color: 'white', display: 'flex', transition: 'all 0.3s', opacity: isYouTube ? 0.5 : 1 }}
                      onMouseEnter={(e) => !isYouTube && (e.target.style.transform = 'scale(1.1)')}
                      onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                    >
                      {isMuted || volume === 0 ? <VolumeX size={24} /> : <Volume2 size={24} />}
                    </button>
                    <span style={{ color: 'white', fontWeight: '600', minWidth: '45px', textAlign: 'left' }}>{Math.round(volume * 100)}%</span>
                    
                    {showVolumeSlider && !isYouTube && (
                      <div style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: '10px', background: 'rgba(0,0,0,0.9)', padding: '16px 12px', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)', animation: 'slideUp 0.3s ease-out', zIndex: 1000 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', height: '150px' }}>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={volume}
                            onChange={handleVolumeChange}
                            style={{ 
                              writingMode: 'bt-lr',
                              WebkitAppearance: 'slider-vertical',
                              width: '8px',
                              height: '120px',
                              background: 'linear-gradient(to top, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.1) 100%)',
                              borderRadius: '4px',
                              outline: 'none',
                              cursor: 'pointer'
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div style={{ color: 'white', fontSize: '0.85rem', fontWeight: '600' }}>
                            {Math.round(volume * 100)}%
                          </div>
                        </div>
                        <div style={{ position: 'absolute', bottom: '-6px', left: '50%', transform: 'translateX(-50%)', width: '12px', height: '12px', background: 'rgba(0,0,0,0.9)', border: '1px solid rgba(255,255,255,0.2)', borderTop: 'none', borderLeft: 'none', transform: 'translateX(-50%) rotate(45deg)' }} />
                      </div>
                    )}
                  </div>

                  {!isYouTube && (
                    <div style={{ flex: 1, minWidth: '200px', display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 20px', background: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}>
                      <span style={{ color: 'white', fontWeight: '600', fontSize: '0.9rem', minWidth: '50px' }}>{formatTime(currentTime)}</span>
                      <div style={{ flex: 1, height: '8px', background: 'rgba(255,255,255,0.2)', borderRadius: '4px', position: 'relative', cursor: 'pointer' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          const rect = e.currentTarget.getBoundingClientRect();
                          const percent = (e.clientX - rect.left) / rect.width;
                          if (videoRef.current) {
                            const newTime = percent * (duration || videoRef.current.duration || 0);
                            videoRef.current.currentTime = newTime;
                            setCurrentTime(newTime);
                          }
                        }}>
                        <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`, background: 'linear-gradient(90deg, #667eea, #764ba2)', borderRadius: '4px', transition: 'width 0.1s' }}>
                          {duration > 0 && <div style={{ position: 'absolute', right: '-6px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', background: 'white', borderRadius: '50%', boxShadow: '0 2px 6px rgba(0,0,0,0.3)' }} />}
                        </div>
                      </div>
                      <span style={{ color: 'white', fontWeight: '600', fontSize: '0.9rem', minWidth: '50px', textAlign: 'right' }}>{formatTime(duration)}</span>
                    </div>
                  )}

                  <button
                    onClick={() => { setStreamUrl(''); setOverlays([]); setIsLiveStream(false); setIsYouTube(false); }}
                    style={{ padding: '14px 24px', background: 'linear-gradient(135deg, #ef4444, #dc2626)', border: 'none', borderRadius: '12px', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)', transition: 'all 0.3s' }}
                    onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                    onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                  >
                    <Settings size={20} /> New Stream
                  </button>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)', padding: '24px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ margin: 0, color: '#1f2937', fontSize: '1.4rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Plus size={24} color="#667eea" /> Overlay Studio
                  </h3>
                </div>

                {!showOverlayForm ? (
                  <button
                    onClick={() => setShowOverlayForm(true)}
                    style={{ width: '100%', padding: '16px', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '700', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)', transition: 'all 0.3s' }}
                    onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                    onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                  >
                    <Plus size={20} /> Create New Overlay
                  </button>
                ) : (
                  <div style={{ animation: 'slideDown 0.3s ease-out' }}>
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontWeight: '600', fontSize: '0.9rem' }}>Overlay Name</label>
                      <input
                        type="text"
                        value={newOverlay.name}
                        onChange={(e) => setNewOverlay({ ...newOverlay, name: e.target.value })}
                        placeholder="e.g., Channel Logo"
                        style={{ width: '100%', padding: '12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '0.95rem', boxSizing: 'border-box', outline: 'none', transition: 'border-color 0.3s' }}
                        onFocus={(e) => e.target.style.borderColor = '#667eea'}
                        onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                      />
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontWeight: '600', fontSize: '0.9rem' }}>Type</label>
                      <select
                        value={newOverlay.type}
                        onChange={(e) => setNewOverlay({ ...newOverlay, type: e.target.value })}
                        style={{ width: '100%', padding: '12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '0.95rem', background: 'white', cursor: 'pointer', outline: 'none' }}
                      >
                        <option value="text">📝 Text Overlay</option>
                        <option value="logo">🖼️ Image/Logo</option>
                      </select>
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontWeight: '600', fontSize: '0.9rem' }}>
                        {newOverlay.type === 'text' ? 'Text Content' : 'Image URL'}
                      </label>
                      <input
                        type="text"
                        value={newOverlay.content}
                        onChange={(e) => setNewOverlay({ ...newOverlay, content: e.target.value })}
                        placeholder={newOverlay.type === 'text' ? 'Enter your text...' : 'https://example.com/logo.png'}
                        style={{ width: '100%', padding: '12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '0.95rem', boxSizing: 'border-box', outline: 'none', transition: 'border-color 0.3s' }}
                        onFocus={(e) => e.target.style.borderColor = '#667eea'}
                        onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                      />
                    </div>

                    {newOverlay.type === 'text' && (
                      <div style={{ marginBottom: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                          <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontWeight: '600', fontSize: '0.85rem' }}>Font Size</label>
                          <input
                            type="number"
                            value={newOverlay.style.fontSize}
                            onChange={(e) => setNewOverlay({ ...newOverlay, style: { ...newOverlay.style, fontSize: parseInt(e.target.value) } })}
                            style={{ width: '100%', padding: '10px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '0.9rem', boxSizing: 'border-box' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontWeight: '600', fontSize: '0.85rem' }}>Text Color</label>
                          <input
                            type="color"
                            value={newOverlay.style.color}
                            onChange={(e) => setNewOverlay({ ...newOverlay, style: { ...newOverlay.style, color: e.target.value } })}
                            style={{ width: '100%', height: '42px', border: '2px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer', boxSizing: 'border-box' }}
                          />
                        </div>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={addOverlay}
                        style={{ flex: 1, padding: '14px', background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.3s' }}
                        onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                        onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                      >
                        <Save size={18} /> Save
                      </button>
                      <button
                        onClick={() => { setShowOverlayForm(false); resetNewOverlay(); }}
                        style={{ flex: 1, padding: '14px', background: '#6b7280', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.3s' }}
                        onMouseEnter={(e) => e.target.style.background = '#4b5563'}
                        onMouseLeave={(e) => e.target.style.background = '#6b7280'}
                      >
                        <X size={18} /> Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)', padding: '24px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.3)', maxHeight: '350px', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h4 style={{ margin: 0, color: '#1f2937', fontSize: '1.1rem', fontWeight: '700' }}>Saved Overlays</h4>
                  <button
                    onClick={fetchSavedOverlays}
                    style={{ padding: '6px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#667eea', display: 'flex', alignItems: 'center', transition: 'transform 0.3s' }}
                    onMouseEnter={(e) => e.target.style.transform = 'rotate(180deg)'}
                    onMouseLeave={(e) => e.target.style.transform = 'rotate(0deg)'}
                  >
                    <RefreshCw size={18} />
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {savedOverlays.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '30px', color: '#9ca3af' }}>
                      <p style={{ margin: 0, fontSize: '0.95rem' }}>No saved overlays yet</p>
                      <p style={{ margin: '8px 0 0 0', fontSize: '0.85rem' }}>Create your first overlay above!</p>
                    </div>
                  ) : (
                    savedOverlays.map((overlay) => (
                      <div
                        key={overlay._id}
                        style={{ background: 'linear-gradient(135deg, #f3f4f6, #e5e7eb)', padding: '14px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.3s', cursor: 'pointer' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'linear-gradient(135deg, #e5e7eb, #d1d5db)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'linear-gradient(135deg, #f3f4f6, #e5e7eb)'}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '700', fontSize: '0.95rem', color: '#1f2937', marginBottom: '4px' }}>{overlay.name}</div>
                          <div style={{ fontSize: '0.8rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {overlay.type === 'text' ? '📝' : '🖼️'} {overlay.type}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            onClick={() => loadSavedOverlay(overlay)}
                            style={{ padding: '8px 14px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px', transition: 'all 0.3s' }}
                            onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                            onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                          >
                            <Plus size={14} /> Load
                          </button>
                          <button
                            onClick={() => deleteOverlay(overlay._id)}
                            style={{ padding: '8px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'all 0.3s' }}
                            onMouseEnter={(e) => e.target.style.background = '#dc2626'}
                            onMouseLeave={(e) => e.target.style.background = '#ef4444'}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)', padding: '24px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.3)' }}>
                <h4 style={{ margin: '0 0 16px 0', color: '#1f2937', fontSize: '1.1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Eye size={20} color="#667eea" /> Active on Stream ({overlays.length})
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                  {overlays.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#9ca3af', fontSize: '0.9rem' }}>
                      No active overlays
                    </div>
                  ) : (
                    overlays.map((overlay) => (
                      <div
                        key={overlay._id}
                        style={{ background: 'linear-gradient(135deg, #dbeafe, #bfdbfe)', padding: '12px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #93c5fd' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                          <Move size={16} color="#3b82f6" style={{ flexShrink: 0 }} />
                          <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#1e40af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {overlay.name || overlay.content?.substring(0, 20)}
                          </span>
                        </div>
                        <button
                          onClick={() => setOverlays(overlays.filter(o => o._id !== overlay._id))}
                          style={{ padding: '6px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', flexShrink: 0, transition: 'all 0.3s' }}
                          onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'}
                          onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-30px) scale(1.05); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateX(-50%) translateY(10px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
        input[type="range"] {
          -webkit-appearance: none;
          appearance: none;
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          transition: all 0.3s;
        }
        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 4px 12px rgba(0,0,0,0.4);
        }
        input[type="range"]::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        }
        *::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        *::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.1);
          border-radius: 4px;
        }
        *::-webkit-scrollbar-thumb {
          background: rgba(102, 126, 234, 0.6);
          border-radius: 4px;
        }
        *::-webkit-scrollbar-thumb:hover {
          background: rgba(102, 126, 234, 0.8);
        }
      `}</style>
    </div>
  );
}

export default App;