# Video Streaming App

A full-stack video streaming application with HLS (HTTP Live Streaming) support. Upload videos, convert them to HLS format, and stream them in a React frontend.

## Features

- Video upload functionality
- Automatic conversion to HLS format using FFmpeg
- Adaptive bitrate streaming
- React frontend with Video.js player
- CORS-enabled backend

## Tech Stack

### Backend
- Node.js
- Express.js
- Multer (file upload handling)
- FFmpeg (video processing)
- UUID (unique identifiers)

### Frontend
- React 19
- Vite
- Video.js React

## Prerequisites

- Node.js
- pnpm (package manager)
- FFmpeg (required for video processing)

### Install FFmpeg

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install ffmpeg
```

**macOS (Homebrew):**
```bash
brew install ffmpeg
```

**Windows:**
Download from [FFmpeg official website](https://ffmpeg.org/download.html) and add to PATH.

## Installation

### Backend Setup

```bash
cd backend
pnpm install
```

### Frontend Setup

```bash
cd frontend
pnpm install
```

## Running the Application

### Start Backend Server

```bash
cd backend
pnpm start
```
Backend runs on http://localhost:8000

### Start Frontend Development Server

```bash
cd frontend
pnpm dev
```
Frontend runs on http://localhost:5173

## Project Structure

```
video-streaming/
├── backend/
│   ├── index.js           # Express server
│   ├── package.json
│   └── uploads/           # Uploaded and processed videos
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── VideoPlayer.jsx
│   │   └── main.jsx
│   ├── index.html
│   └── package.json
└── README.md
```

## API Endpoints

### Health Check
```
GET /health
```

### Upload Video
```
POST /upload
Content-Type: multipart/form-data
file: [video file]
```

Response:
```json
{
  "message": "video processed successfully",
  "videoUrl": "http://localhost:8000/uploads/courses/{lessonId}/index.m3u8",
  "lessonId": "uuid"
}
```

## License

ISC
