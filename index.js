import express from "express";
import cors from "cors";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from 'fs';
import { exec, execSync } from "child_process";



const app = express();
app.use(cors({
  origin: ['http://localhost:5173', 'https://hls-streaming-server-react.vercel.app'],
  methods: ['GET', 'POST'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({extended: true}));

// Create uploads directory if it doesn't exist
if (!fs.existsSync('./uploads')) {
  fs.mkdirSync('./uploads', { recursive: true });
  console.log('[INFO] Created uploads directory');
}

if (!fs.existsSync('./uploads/hls-videos')) {
  fs.mkdirSync('./uploads/hls-videos', { recursive: true });
  console.log('[INFO] Created uploads/hls-videos directory');
}

app.use("/uploads", express.static("uploads")); // serve static files



const linkFilePath = './videoLinks.txt';

// Ensure the videoLinks.txt file exists
if (!fs.existsSync(linkFilePath)) {
  fs.writeFileSync(linkFilePath, '', 'utf-8');
  console.log('[INFO] Created videoLinks.txt file');
}

// Store video data including metadata
const storelink = (videoLink, videoId, metadata = {}) => {
    const timestamp = new Date().toISOString();
    const videoData = JSON.stringify({
        url: videoLink,
        id: videoId,
        uploadDate: timestamp,
        ...metadata
    });
    
    const newLinkLine = `${videoData}\n`;
    fs.appendFileSync(linkFilePath, newLinkLine, 'utf-8');
    console.log('[INFO] video URL stored successfully.');
};

// Read video links with metadata
const readLinks = () => {
    try {
        if (!fs.existsSync(linkFilePath)) {
            return [];
        }
        
        const data = fs.readFileSync(linkFilePath, 'utf-8');
        if (!data.trim()) {
            return [];
        }
        
        return data.trim().split('\n').map(line => {
            try {
                return JSON.parse(line);
            } catch (e) {
                // Handle legacy format (plain URLs)
                return { url: line, id: 'unknown', uploadDate: null };
            }
        });
    } catch (error) {
        console.error('[ERROR] Failed to read video links:', error);
        return [];
    }
};

// multer middleware
const storage = multer.diskStorage({
    destination: function(req, file, cb){
        cb(null, "./uploads")
    },
    filename: function(req, file, cb){
        cb(null, file.fieldname + '-' + uuidv4() + path.extname(file.originalname))
    }
})


// multer configuration
const upload = multer({storage: storage})


app.get('/ping', (req, res)=>{
    res.json({"message": "server is working..!!"})
})

// Add route to check server status and FFmpeg installation
app.get('/status', (req, res) => {
    // Use the specific FFmpeg path that we know works
    const ffmpegPath = "C:\\FFmpeg\\bin\\ffmpeg.exe";
    const ffmpegExists = fs.existsSync(ffmpegPath);
    
    // Check for detailed system info
    let ffmpegVersion = "Not installed";
    let systemInfo = {};
    
    try {
        // Get system info
        systemInfo = {
            platform: process.platform,
            architecture: process.arch,
            nodeVersion: process.version,
            cwd: process.cwd(),
            ffmpegPath: ffmpegPath,
            env: {
                PATH: process.env.PATH ? process.env.PATH.split(path.delimiter) : []
            }
        };
        
        // Try to get ffmpeg version if installed
        if (ffmpegExists) {
            try {
                const versionOutput = execSync(`"${ffmpegPath}" -version`, { encoding: 'utf8' });
                ffmpegVersion = versionOutput.split('\n')[0] || "Unknown version";
            } catch (versionError) {
                ffmpegVersion = "Error getting version";
            }
        }
    } catch (error) {
        console.error("Error collecting system info:", error);
    }
    
    res.json({
        serverStatus: 'online',
        ffmpegInstalled: ffmpegExists,
        ffmpegPath: ffmpegExists ? ffmpegPath : "Not found",
        ffmpegVersion: ffmpegVersion,
        message: ffmpegExists 
            ? `Server is ready for video processing. Using FFmpeg at: ${ffmpegPath}` 
            : `FFmpeg not found at ${ffmpegPath}. Please install FFmpeg at this path.`,
        systemInfo: systemInfo
    });
});

app.post("/upload", upload.single('file'), (req, res) => {
    console.log("[INFO] File uploaded.");

    // Get file information
    const fileSize = req.file.size;
    const fileSizeMB = (fileSize / (1024 * 1024)).toFixed(2); // Convert to MB

    // Use the specific FFmpeg path that we know works
    const ffmpegPath = "C:\\FFmpeg\\bin\\ffmpeg.exe";
    
    // Verify FFmpeg exists
    if (!fs.existsSync(ffmpegPath)) {
        return res.status(500).json({
            error: "FFmpeg not found at expected path. Please make sure FFmpeg is installed at: " + ffmpegPath
        });
    }

    const videoId = uuidv4();
    const videoPath = req.file.path;
    const outputPath = `./uploads/hls-videos/${videoId}`;
    const hlsPath = `${outputPath}/playlist.m3u8`;

    if(!fs.existsSync(outputPath)){
        fs.mkdirSync(outputPath, {recursive: true});
    }
    
    // Get video duration and other metadata
    let duration = null;
    try {
        const durationCmd = `"${ffmpegPath}" -i "${videoPath}" 2>&1`;
        const output = execSync(durationCmd, { encoding: 'utf8' });
        
        // Extract duration using regex
        const durationMatch = output.match(/Duration: (\d{2}):(\d{2}):(\d{2})\.(\d{2})/);
        if (durationMatch) {
            const hours = parseInt(durationMatch[1]);
            const minutes = parseInt(durationMatch[2]);
            const seconds = parseInt(durationMatch[3]);
            duration = hours * 3600 + minutes * 60 + seconds;
        }
    } catch (error) {
        console.error('[ERROR] Failed to get video duration:', error);
    }

    // Use the verified FFmpeg path with quotes to handle spaces in paths
    const ffmpegCommand = `"${ffmpegPath}" -hide_banner -y -i ${videoPath} \
    -vf scale=w=640:h=360:force_original_aspect_ratio=decrease -c:a aac -ar 48000 -c:v h264 -profile:v main -crf 20 -sc_threshold 0 -g 48 -keyint_min 48 -hls_time 4 -hls_playlist_type vod  -b:v 800k -maxrate 856k -bufsize 1200k -b:a 96k -hls_segment_filename ${outputPath}/360p_%03d.ts ${outputPath}/360p.m3u8 \
    -vf scale=w=842:h=480:force_original_aspect_ratio=decrease -c:a aac -ar 48000 -c:v h264 -profile:v main -crf 20 -sc_threshold 0 -g 48 -keyint_min 48 -hls_time 4 -hls_playlist_type vod -b:v 1400k -maxrate 1498k -bufsize 2100k -b:a 128k -hls_segment_filename ${outputPath}/480p_%03d.ts ${outputPath}/480p.m3u8 \
    -vf scale=w=1280:h=720:force_original_aspect_ratio=decrease -c:a aac -ar 48000 -c:v h264 -profile:v main -crf 20 -sc_threshold 0 -g 48 -keyint_min 48 -hls_time 4 -hls_playlist_type vod -b:v 2800k -maxrate 2996k -bufsize 4200k -b:a 128k -hls_segment_filename ${outputPath}/720p_%03d.ts ${outputPath}/720p.m3u8 \
    -vf scale=w=1920:h=1080:force_original_aspect_ratio=decrease -c:a aac -ar 48000 -c:v h264 -profile:v main -crf 20 -sc_threshold 0 -g 48 -keyint_min 48 -hls_time 4 -hls_playlist_type vod -b:v 5000k -maxrate 5350k -bufsize 7500k -b:a 192k -hls_segment_filename ${outputPath}/1080p_%03d.ts ${outputPath}/1080p.m3u8`

    // This is converter code and can be design in distributed way
    exec(ffmpegCommand, (error, stdout, stderr) => {
        if(error){
            console.error(`[ERROR] exec error: ${error}`)
            return res.json({"error": "Error while processing your file. Please try again."});
        }

        console.log(`stdout: ${stdout}`);
        console.log(`stderr: ${stderr}`);

        fs.copyFileSync('./playlist.m3u8', `${outputPath}/playlist.m3u8`);

        const videoUrl = `http://localhost:8000/uploads/hls-videos/${videoId}/playlist.m3u8`

        try{
            // Include file size and duration in the metadata
            storelink(videoUrl, videoId, {
                fileSize: fileSizeMB,
                duration: duration,
                originalName: req.file.originalname
            });
            return res.json({
                "message": "File uploaded successfully.", 
                videoUrl: videoUrl, 
                videoId: videoId,
                metadata: {
                    fileSize: fileSizeMB,
                    duration: duration,
                    originalName: req.file.originalname
                }
            });
        } catch(error){
            console.error(`[ERROR] error while storing video URL: ${error}`);
            return res.json({"error": "Error while storing video URL. Please try again."});
        }
    });
});

app.get("/videos", (req, res) => {
    const videos = readLinks();
    res.json({
        "videoUrls": videos.map(video => video.url),
        "videosData": videos
    });
});


app.listen(8000, () => {
    console.log("[INFO] App is running at port 8000");
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error("\x1b[31m[ERROR] Port 8000 is already in use!\x1b[0m");
        console.error("\x1b[33m[SOLUTION] Run 'node debug-server.js' to diagnose the issue.\x1b[0m");
        console.error("\x1b[33m[SOLUTION] Or run './restart-server.bat' to kill existing processes and restart.\x1b[0m");
    } else {
        console.error(`\x1b[31m[ERROR] Server failed to start: ${err.message}\x1b[0m`);
    }
    
    // Exit with error code
    process.exit(1);
});