# HLS Video Streaming Server with React

A complete solution for streaming video content using HTTP Live Streaming (HLS) protocol with adaptive bitrate capabilities. This project includes both a backend server for video processing and a React frontend for uploading and viewing videos.

## Features

- **Video Upload**: Upload MP4 and MKV video files
- **HLS Conversion**: Automatically converts videos to HLS format with multiple quality levels
- **Adaptive Bitrate Streaming**: Provides four quality levels (360p, 480p, 720p, 1080p)
- **Real-time Video Player**: Stream videos with quality selection capability
- **Responsive UI**: Modern interface that works across different devices

## Technologies Used

### Backend
- Node.js with Express
- FFmpeg for video processing
- HLS streaming protocol
- Multer for file uploads

### Frontend
- React with Vite
- Bootstrap for UI components
- Video.js player with HTTP source selector
- Axios for API communication

## Prerequisites

- Node.js (v14 or newer)
- FFmpeg installed and available in your PATH
- Modern web browser that supports HLS

### FFmpeg Installation (Important)

This project requires FFmpeg to convert videos to HLS format. If you don't have FFmpeg installed, follow these steps:

#### Windows
1. Download FFmpeg from [FFmpeg Builds](https://github.com/BtbN/FFmpeg-Builds/releases) (choose a win64 build)
2. Extract the downloaded zip to a folder (e.g., `C:\ffmpeg`)
3. Add the bin folder to your PATH:
   - Search for "Environment Variables" in Windows search
   - Click "Edit the system environment variables"
   - Click "Environment Variables"
   - Under "System variables", find "Path" and click "Edit"
   - Click "New" and add the path to the bin folder (e.g., `C:\ffmpeg\bin`)
   - Click "OK" on all dialogs
4. Restart your terminal/command prompt

#### macOS
```bash
# Using Homebrew
brew install ffmpeg

# Verify installation
ffmpeg -version
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install ffmpeg

# Verify installation
ffmpeg -version
```

## Installation

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/HLS-Streaming-Server-React.git
cd HLS-Streaming-Server-React
```

2. **Install dependencies for both backend and frontend**

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

3. **Start the development servers**

```bash
# Start both backend and frontend
npm run dev
```

The backend server will start at http://localhost:8000 and the frontend will be available at http://localhost:5173.

## Troubleshooting

### Common Issues

1. **FFmpeg Not Found Error**
   - Make sure FFmpeg is installed and added to your PATH
   - Verify by running `ffmpeg -version` in your terminal
   - Restart your terminal after installing FFmpeg

2. **Connection Refused Errors**
   - Ensure the backend server is running at port 8000
   - Check if there are any error messages in the backend console
   - Make sure no other application is using port 8000

3. **Video Upload Fails**
   - Check if the uploads directory exists and is writable
   - Verify FFmpeg is working by running a simple command
   - Check the backend logs for specific errors

## How It Works

1. The backend receives video files through the `/upload` endpoint
2. The server uses FFmpeg to convert the video to multiple HLS variants (360p, 480p, 720p, 1080p)
3. A master playlist file is created to point to the different quality variants
4. The frontend accesses these playlists to display videos with adaptive streaming

## Project Structure

```
HLS-Streaming-Server-React/
├── frontend/               # React frontend
│   ├── src/                # Source code
│   │   ├── components/     # React components
│   │   ├── services/       # API services
│   ├── public/             # Static assets
├── uploads/                # Uploaded videos and HLS files
├── index.js                # Backend server entry point
├── playlist.m3u8           # Master playlist template
```

## API Endpoints

- `GET /videos` - Get a list of available videos
- `POST /upload` - Upload and process a new video

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

