import React, { useState } from 'react';
import { overlayAPI } from '../services/api';
import './OverlayManager.css';

const OverlayManager = ({ overlays, onOverlaysUpdate }) => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    type: 'text',
    content: '',
    position: { x: 50, y: 50 },
    size: { width: 200, height: 100 },
    style: {
      color: '#ffffff',
      fontSize: '24px',
      fontWeight: 'bold',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      padding: '10px',
      borderRadius: '4px'
    },
    isVisible: true
  });
  const [editingId, setEditingId] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: parseFloat(value) || value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleStyleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      style: {
        ...prev.style,
        [name]: value
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingId) {
        await overlayAPI.update(editingId, formData);
      } else {
        await overlayAPI.create(formData);
      }
      
      // Refresh overlays list
      const response = await overlayAPI.getAll();
      onOverlaysUpdate(response.overlays);
      
      // Reset form
      resetForm();
    } catch (error) {
      console.error('Error saving overlay:', error);
      alert('Failed to save overlay');
    }
  };

  const handleEdit = (overlay) => {
    setFormData({
      type: overlay.type,
      content: overlay.content,
      position: overlay.position,
      size: overlay.size,
      style: overlay.style || {},
      isVisible: overlay.isVisible
    });
    setEditingId(overlay._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this overlay?')) {
      try {
        await overlayAPI.delete(id);
        const response = await overlayAPI.getAll();
        onOverlaysUpdate(response.overlays);
      } catch (error) {
        console.error('Error deleting overlay:', error);
        alert('Failed to delete overlay');
      }
    }
  };

  const toggleVisibility = async (overlay) => {
    try {
      await overlayAPI.update(overlay._id, {
        ...overlay,
        isVisible: !overlay.isVisible
      });
      const response = await overlayAPI.getAll();
      onOverlaysUpdate(response.overlays);
    } catch (error) {
      console.error('Error updating overlay:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      type: 'text',
      content: '',
      position: { x: 50, y: 50 },
      size: { width: 200, height: 100 },
      style: {
        color: '#ffffff',
        fontSize: '24px',
        fontWeight: 'bold',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        padding: '10px',
        borderRadius: '4px'
      },
      isVisible: true
    });
    setEditingId(null);
    setShowForm(false);
  };

  return (
    <div className="overlay-manager">
      <div className="manager-header">
        <h2>Overlay Manager</h2>
        <button 
          onClick={() => setShowForm(!showForm)} 
          className="btn-primary"
        >
          {showForm ? 'Cancel' : '+ Add Overlay'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="overlay-form">
          <div className="form-group">
            <label>Type:</label>
            <select name="type" value={formData.type} onChange={handleInputChange}>
              <option value="text">Text</option>
              <option value="logo">Logo/Image</option>
            </select>
          </div>

          <div className="form-group">
            <label>
              {formData.type === 'text' ? 'Text Content:' : 'Image URL:'}
            </label>
            <input
              type="text"
              name="content"
              value={formData.content}
              onChange={handleInputChange}
              placeholder={formData.type === 'text' ? 'Enter text' : 'Enter image URL'}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>X Position:</label>
              <input
                type="number"
                name="position.x"
                value={formData.position.x}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label>Y Position:</label>
              <input
                type="number"
                name="position.y"
                value={formData.position.y}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Width:</label>
              <input
                type="number"
                name="size.width"
                value={formData.size.width}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label>Height:</label>
              <input
                type="number"
                name="size.height"
                value={formData.size.height}
                onChange={handleInputChange}
              />
            </div>
          </div>

          {formData.type === 'text' && (
            <div className="form-row">
              <div className="form-group">
                <label>Text Color:</label>
                <input
                  type="color"
                  name="color"
                  value={formData.style.color}
                  onChange={handleStyleChange}
                />
              </div>
              <div className="form-group">
                <label>Font Size:</label>
                <input
                  type="text"
                  name="fontSize"
                  value={formData.style.fontSize}
                  onChange={handleStyleChange}
                  placeholder="24px"
                />
              </div>
            </div>
          )}

          <div className="form-actions">
            <button type="submit" className="btn-success">
              {editingId ? 'Update Overlay' : 'Create Overlay'}
            </button>
            <button type="button" onClick={resetForm} className="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="overlays-list">
        <h3>Active Overlays ({overlays.length})</h3>
        {overlays.length === 0 ? (
          <p className="no-overlays">No overlays created yet</p>
        ) : (
          <div className="overlay-items">
            {overlays.map(overlay => (
              <div key={overlay._id} className="overlay-item">
                <div className="overlay-info">
                  <span className="overlay-type">{overlay.type}</span>
                  <span className="overlay-content">
                    {overlay.type === 'text' 
                      ? overlay.content 
                      : 'Image'}
                  </span>
                  <span className="overlay-position">
                    ({overlay.position.x}, {overlay.position.y})
                  </span>
                </div>
                <div className="overlay-actions">
                  <button 
                    onClick={() => toggleVisibility(overlay)}
                    className={`btn-icon ${overlay.isVisible ? 'visible' : 'hidden'}`}
                    title={overlay.isVisible ? 'Hide' : 'Show'}
                  >
                    {overlay.isVisible ? '👁️' : '🚫'}
                  </button>
                  <button 
                    onClick={() => handleEdit(overlay)}
                    className="btn-icon"
                    title="Edit"
                  >
                    ✏️
                  </button>
                  <button 
                    onClick={() => handleDelete(overlay._id)}
                    className="btn-icon delete"
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OverlayManager;