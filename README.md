# RTSP Livestream Application

A full-stack application for streaming RTSP video with customizable overlays.

## Features

- 🎥 RTSP video streaming with web-based player
- 🎨 Custom text and image overlays
- 📍 Draggable and resizable overlays
- 🎛️ Play/Pause and volume controls
- 💾 MongoDB database for overlay persistence
- 🔄 Full CRUD API for overlay management

## Tech Stack

- **Backend**: Python, Flask, MongoDB
- **Frontend**: React.js
- **Database**: MongoDB
- **Video Streaming**: RTSP compatible

## Prerequisites

- Python 3.8+
- Node.js 14+
- MongoDB 4.4+

## Installation

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd rtsp-livestream-app
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
echo "MONGODB_URI=mongodb://localhost:27017/" > .env
echo "DATABASE_NAME=rtsp_livestream" >> .env
echo "PORT=5000" >> .env
```

### 3. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install
```

### 4. Start MongoDB

Make sure MongoDB is running on your system:

```bash
# Windows (if installed as service)
# MongoDB should start automatically

# Mac
brew services start mongodb-community

# Linux
sudo systemctl start mongodb
```

## Running the Application

### Terminal 1 - Start Backend

```bash
cd backend
source venv/bin/activate  # or venv\Scripts\activate on Windows
python app.py
```

Backend will run on: http://localhost:5000

### Terminal 2 - Start Frontend

```bash
cd frontend
npm start
```

Frontend will run on: http://localhost:3000

## Usage

### 1. Configure RTSP Stream

1. Click the **⚙️ Settings** button in the header
2. Enter your RTSP URL (e.g., `rtsp://example.com/stream`)
3. For testing, you can use any MP4 video URL
4. Click **Save URL**

### 2. Play Video

1. Click the **▶ Play** button to start the stream
2. Use the volume slider to adjust audio
3. Click **⏸ Pause** to pause playback

### 3. Manage Overlays

#### Create Overlay

1. Click **+ Add Overlay**
2. Choose overlay type (Text or Logo/Image)
3. Enter content (text or image URL)
4. Set position (X, Y coordinates)
5. Set size (Width and Height)
6. For text overlays, customize color and font size
7. Click **Create Overlay**

#### Edit Overlay

1. Click the ✏️ icon on any overlay
2. Modify the settings
3. Click **Update Overlay**

#### Toggle Visibility

- Click the 👁️ icon to show/hide overlays

#### Delete Overlay

- Click the 🗑️ icon and confirm deletion

## RTSP Stream Setup

### Using RTSP.me (Temporary Testing)

1. Visit https://rtsp.me
2. Upload a video file
3. Get your RTSP URL
4. Use it in the application settings

### Using Local RTSP Server (Production)

For production use, set up a media server like:

- **FFmpeg** - Convert RTSP to HLS
- **MediaMTX** - RTSP streaming server
- **Nginx-RTMP** - RTMP/HLS streaming

Example FFmpeg command to convert RTSP to HLS:

```bash
ffmpeg -i rtsp://your-camera-ip/stream -f hls -hls_time 2 -hls_list_size 3 output.m3u8
```

## API Documentation

### Base URL

```
http://localhost:5000/api
```

### Endpoints

#### Health Check

```http
GET /api/health
```

**Response:**
```json
{
  "status": "healthy",
  "message": "API is running"
}
```

#### Create Overlay

```http
POST /api/overlays
Content-Type: application/json

{
  "type": "text",
  "content": "My Overlay Text",
  "position": { "x": 100, "y": 100 },
  "size": { "width": 200, "height": 100 },
  "style": {
    "color": "#ffffff",
    "fontSize": "24px"
  },
  "isVisible": true
}
```

**Response:**
```json
{
  "message": "Overlay created successfully",
  "overlay": {
    "_id": "507f1f77bcf86cd799439011",
    "type": "text",
    "content": "My Overlay Text",
    ...
  }
}
```

#### Get All Overlays

```http
GET /api/overlays
```

**Response:**
```json
{
  "overlays": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "type": "text",
      "content": "My Overlay",
      ...
    }
  ]
}
```

#### Get Single Overlay

```http
GET /api/overlays/:id
```

#### Update Overlay

```http
PUT /api/overlays/:id
Content-Type: application/json

{
  "content": "Updated Text",
  "position": { "x": 150, "y": 150 }
}
```

#### Delete Overlay

```http
DELETE /api/overlays/:id
```

#### Save RTSP Settings

```http
POST /api/settings/rtsp
Content-Type: application/json

{
  "rtspUrl": "rtsp://example.com/stream"
}
```

#### Get RTSP Settings

```http
GET /api/settings/rtsp
```

## Project Structure

```
rtsp-livestream-app/
├── backend/
│   ├── app.py              # Flask application
│   ├── requirements.txt    # Python dependencies
│   └── .env               # Environment variables
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── VideoPlayer.js
│   │   │   ├── VideoPlayer.css
│   │   │   ├── OverlayManager.js
│   │   │   └── OverlayManager.css
│   │   ├── services/
│   │   │   └── api.js     # API service
│   │   ├── App.js
│   │   └── App.css
│   └── package.json
└── README.md
```

## Troubleshooting

### MongoDB Connection Error

- Ensure MongoDB is running: `mongosh` or `mongo`
- Check the connection string in `.env`

### CORS Error

- Make sure Flask-CORS is installed
- Verify backend is running on port 5000

### Video Not Playing

- RTSP streams need conversion to web-compatible formats (HLS/DASH)
- For testing, use direct MP4 URLs
- Set up a streaming server for production RTSP

### Port Already in Use

```bash
# Backend (port 5000)
lsof -ti:5000 | xargs kill -9

# Frontend (port 3000)
lsof -ti:3000 | xargs kill -9
```

## Future Enhancements

- [ ] Drag-and-drop overlay positioning
- [ ] Real-time RTSP to HLS conversion
- [ ] User authentication
- [ ] Multiple stream support
- [ ] Overlay templates
- [ ] Export overlay configurations

## License

MIT License

## Contributors

Anjul Chauhan - Full Stack Developer