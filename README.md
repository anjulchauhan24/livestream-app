# 🎥 RTSP Live Studio

A professional full-stack web application for streaming RTSP video feeds with dynamic overlay management. Built with React, Flask, and MongoDB.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Python](https://img.shields.io/badge/python-3.8+-yellow.svg)
![React](https://img.shields.io/badge/react-19.2.0-61dafb.svg)

## 🚀 About This Project

This RTSP Live Studio was developed as part of a full-stack development assignment, demonstrating proficiency in:
- Modern React architecture with hooks
- RESTful API design and implementation
- MongoDB database integration
- Real-time video streaming capabilities
- Dynamic overlay management system
- Responsive UI/UX design

**Developer**: Anjul Chauhan, Computer Science Engineering Student at Chandigarh University, with expertise in full-stack development, AI/ML implementation, and cloud deployment. View more projects at [anjulportfolio.netlify.app](https://anjulportfolio.netlify.app/)

## 📋 Table of Contents

- [Features](#features)
- [Demo](#demo)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## ✨ Features

### Core Features
- 🎬 **Live Video Streaming**: Play RTSP, HTTP/HTTPS, and HLS video streams
- 🎨 **Dynamic Overlays**: Add text and image overlays on top of video streams
- 🎯 **Drag & Drop**: Reposition overlays in real-time with intuitive drag-and-drop
- 💾 **Persistent Storage**: Save and manage overlay configurations in MongoDB
- 🎮 **Video Controls**: Play, pause, volume control, and fullscreen mode
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile devices

### Overlay Management
- Create text overlays with customizable styling (color, size, font)
- Add image/logo overlays from URLs
- Save overlay presets for reuse
- Real-time position and size adjustments
- Toggle overlay visibility
- Delete unwanted overlays

### Technical Features
- RESTful API with full CRUD operations
- Real-time overlay updates
- MongoDB database integration
- CORS-enabled backend
- Modern React hooks architecture
- Beautiful gradient UI with animations

## 🎬 Demo

### Getting Started
1. Enter your stream URL (RTSP, MP4, or HLS)
2. Click "Launch Stream" to start playback
3. Create overlays using the Overlay Studio panel
4. Drag overlays to reposition them on the video
5. Save your favorite overlay configurations

### Test Stream URL
For testing purposes, you can use this sample video:
```
https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4
```

## 🛠 Tech Stack

### Frontend
- **React** 19.2.0 - UI framework
- **Lucide React** - Icon library
- **Axios** - HTTP client
- **CSS3** - Styling with animations

### Backend
- **Flask** 3.0.0 - Python web framework
- **Flask-CORS** - Cross-origin resource sharing
- **PyMongo** 4.6.0 - MongoDB driver
- **Python-dotenv** - Environment variable management

### Database
- **MongoDB Atlas** - Cloud database

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v14.0 or higher) - [Download](https://nodejs.org/)
- **Python** (v3.8 or higher) - [Download](https://python.org/)
- **MongoDB Atlas Account** - [Sign up free](https://www.mongodb.com/cloud/atlas)
- **Git** - [Download](https://git-scm.com/)

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/anjulchauhan24/rtsp-livestream-app.git
cd rtsp-livestream-app
```

### 2. Backend Setup

#### Create MongoDB Database

1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Create a new cluster (free tier available)
3. Create a database user with read/write permissions
4. Whitelist your IP address or allow access from anywhere (for development)
5. Get your connection string

#### Configure Environment Variables

Create a `.env` file in the `backend` folder:

```bash
cd backend
touch .env  # On Windows: type nul > .env
```

Add the following content to `.env`:

```env
MONGO_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
DATABASE_NAME=rtsp_livestream
PORT=5000
```

**Important**: Replace `username` and `password` with your MongoDB credentials. If your password contains special characters, URL-encode them:
- `@` → `%40`
- `#` → `%23`
- `$` → `%24`
- `%` → `%25`
- `&` → `%26`

#### Install Python Dependencies

```bash
pip install -r requirements.txt
```

#### Test Database Connection

```bash
python test_connection.py
```

You should see: `✓ All tests passed!`

### 3. Frontend Setup

Open a new terminal window:

```bash
cd frontend
npm install
```

## 🎯 Usage

### Starting the Application

You need two terminal windows:

#### Terminal 1 - Start Backend Server

```bash
cd backend
python app.py
```

You should see:
```
🚀 Starting Flask server on port 5000...
📍 API will be available at: http://localhost:5000/api
```

#### Terminal 2 - Start Frontend Development Server

```bash
cd frontend
npm start
```

The browser will automatically open at `http://localhost:3000`

### Using the Application

#### 1. Start a Stream

1. Enter your stream URL in the input field
   - RTSP: `rtsp://example.com:8554/stream`
   - HTTP/HTTPS: `https://example.com/video.mp4`
   - HLS: `https://example.com/stream.m3u8`

2. Click **"Launch Stream"**

3. The video player will load and start playing

#### 2. Create an Overlay

1. Click **"Create New Overlay"** in the Overlay Studio panel

2. Fill in the details:
   - **Overlay Name**: Give it a descriptive name
   - **Type**: Choose Text Overlay or Image/Logo
   - **Content**: Enter text or image URL
   - **Font Size**: Adjust text size (text overlays only)
   - **Text Color**: Pick a color (text overlays only)

3. Click **"Save"**

4. The overlay appears on the video

#### 3. Manage Overlays

- **Reposition**: Click and drag the overlay to a new position
- **Load Saved**: Click "Load" on any saved overlay to add it to the stream
- **Delete**: Click the trash icon to remove an overlay
- **Active Overlays**: View all overlays currently on the stream

#### 4. Video Controls

- **Play/Pause**: Control video playback
- **Volume**: Adjust audio level with the slider
- **Fullscreen**: Enter/exit fullscreen mode
- **New Stream**: Load a different video source

## 📚 API Documentation

### Base URL

```
http://localhost:5000/api
```

### Endpoints

#### Health Check

```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "database": "connected",
  "message": "API is running"
}
```

#### Create Overlay

```http
POST /overlays
Content-Type: application/json

{
  "type": "text",
  "content": "Live Stream",
  "name": "Channel Logo",
  "position": { "x": 50, "y": 50 },
  "size": { "width": 200, "height": 50 },
  "style": {
    "fontSize": 24,
    "color": "#ffffff",
    "backgroundColor": "rgba(0,0,0,0.7)"
  },
  "isVisible": true
}
```

#### Get All Overlays

```http
GET /overlays
```

#### Get Single Overlay

```http
GET /overlays/:overlay_id
```

#### Update Overlay

```http
PUT /overlays/:overlay_id
Content-Type: application/json

{
  "position": { "x": 100, "y": 150 },
  "isVisible": false
}
```

#### Delete Overlay

```http
DELETE /overlays/:overlay_id
```

#### Save RTSP Settings

```http
POST /settings/rtsp
Content-Type: application/json

{
  "rtspUrl": "rtsp://example.com:8554/stream"
}
```

#### Get RTSP Settings

```http
GET /settings/rtsp
```

For complete API documentation, see [API_DOCUMENTATION.md](API_DOCUMENTATION.md)

## 📁 Project Structure

```
rtsp-livestream-app/
│
├── backend/
│   ├── app.py                 # Flask application & API routes
│   ├── requirements.txt       # Python dependencies
│   ├── .env                   # Environment variables (create this)
│   └── test_connection.py     # Database connection test
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── App.js            # Main React component
│   │   ├── App.css           # Application styles
│   │   ├── components/       # React components
│   │   ├── services/         # API service layer
│   │   └── index.js          # React entry point
│   ├── package.json          # Node dependencies
│   └── README.md
│
├── docs/
│   ├── API_DOCUMENTATION.md
│   ├── USER_GUIDE.md
│   └── SETUP_GUIDE.md
│
└── README.md                 # This file
```

## ⚙️ Configuration

### Environment Variables

#### Backend (.env)

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `MONGO_URI` | MongoDB connection string | Yes | - |
| `DATABASE_NAME` | Database name | No | rtsp_livestream |
| `PORT` | Backend server port | No | 5000 |

#### Frontend

The frontend uses `http://localhost:5000/api` as the default API base URL. To change this for production, update the `API_BASE_URL` constant in `src/App.js`.

### MongoDB Collections

The application creates two collections:

1. **overlays**: Stores overlay configurations
2. **settings**: Stores RTSP URL and other settings

## 🔧 Troubleshooting

### Backend Issues

#### "MongoDB connection failed"

**Solution:**
- Verify your `.env` file has the correct `MONGO_URI`
- Check if your MongoDB Atlas password is URL-encoded
- Ensure your IP is whitelisted in MongoDB Atlas Network Access
- Try connecting from MongoDB Compass to verify credentials

#### "Port 5000 already in use"

**Solution:**

On Windows:
```bash
netstat -ano | findstr :5000
taskkill /PID <process_id> /F
```

On Mac/Linux:
```bash
lsof -ti:5000 | xargs kill -9
```

Or change the port in `.env`:
```env
PORT=5001
```

#### "Module not found" errors

**Solution:**
```bash
cd backend
pip install -r requirements.txt
```

### Frontend Issues

#### Frontend won't start

**Solution:**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm start
```

#### "Network Error" when creating overlays

**Solution:**
- Ensure the backend server is running on port 5000
- Check browser console for CORS errors
- Verify API_BASE_URL in App.js matches your backend URL

### Video Playback Issues

#### Video won't play

**Solution:**
- Check if the video URL is accessible in your browser
- Ensure the video format is supported (MP4, HLS)
- For RTSP streams, you need a media server to convert to HLS/DASH
- Check browser console for CORS or codec errors

#### Overlays not appearing

**Solution:**
- Verify overlay is marked as visible
- Check if overlay position is within video bounds
- Ensure overlay was saved successfully (check backend logs)
- Try refreshing the page

## 🎨 Customization

### Styling

The application uses CSS variables for theming. Edit `frontend/src/App.css` to customize:

```css
:root {
  --primary: #6366f1;
  --secondary: #8b5cf6;
  --success: #10b981;
  --danger: #ef4444;
}
```

### Default Overlay Styles

Modify the default overlay template in `frontend/src/App.js`:

```javascript
const [newOverlay, setNewOverlay] = useState({
  style: {
    fontSize: 24,        // Change default font size
    color: '#ffffff',    // Change default text color
    backgroundColor: 'rgba(0,0,0,0.7)',
    // Add more style properties
  }
});
```

## 🚀 Deployment

### Backend Deployment (Heroku Example)

```bash
cd backend
heroku create your-app-name
heroku config:set MONGO_URI="your_mongodb_uri"
git push heroku main
```

### Frontend Deployment (Netlify/Vercel)

1. Update `API_BASE_URL` in `src/App.js` to your backend URL
2. Build the application:
   ```bash
   npm run build
   ```
3. Deploy the `build` folder to Netlify or Vercel

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Author

**Anjul Chauhan**
- 🎓 B.E. Computer Science & Engineering - Chandigarh University
- 💼 Full Stack Developer
- 🌐 Portfolio: [anjulportfolio.netlify.app](https://anjulportfolio.netlify.app/)
- 📧 Email: anjulchauhan24@gmail.com
- 💻 GitHub: [@anjulchauhan24](https://github.com/anjulchauhan24)
- 🔗 LinkedIn: [linkedin.com/in/anjulchauhan24](https://linkedin.com/in/anjulchauhan24)
- 📱 Phone: +91 7017575679

## 🙏 Acknowledgments

- React team for the amazing framework
- Flask community for excellent documentation
- MongoDB for cloud database solution
- Lucide for beautiful icons
- OpenAI for inspiration in API design

## 📞 Support

For support and questions:

- 🌐 Portfolio: [anjulportfolio.netlify.app](https://anjulportfolio.netlify.app/)
- 📧 Email: anjulchauhan24@gmail.com
- 🐛 Issues: [GitHub Issues](https://github.com/anjulchauhan24/rtsp-livestream-app/issues)
- 💼 LinkedIn: [Connect with me](https://linkedin.com/in/anjulchauhan24)

## 🗺️ Roadmap

- [ ] User authentication and authorization
- [ ] Multiple simultaneous streams
- [ ] Overlay animation effects
- [ ] Recording functionality
- [ ] Stream scheduling
- [ ] WebRTC support for RTSP
- [ ] Mobile app (React Native)
- [ ] Analytics dashboard

---

**Made with ❤️ using React, Flask, and MongoDB**
