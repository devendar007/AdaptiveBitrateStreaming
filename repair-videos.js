/**
 * Video repair utility for HLS Streaming Server
 * Repairs broken videos and creates necessary playlist files
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

console.log(`${colors.cyan}===== HLS Video Repair Utility =====${colors.reset}`);

// Master playlist template
const masterPlaylistTemplate = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-STREAM-INF:BANDWIDTH=800000,RESOLUTION=640x360
360p.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=1400000,RESOLUTION=842x480
480p.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=2800000,RESOLUTION=1280x720
720p.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=5000000,RESOLUTION=1920x1080
1080p.m3u8
`;

// Make sure the template exists in the project root
if (!fs.existsSync('./playlist.m3u8')) {
  try {
    fs.writeFileSync('./playlist.m3u8', masterPlaylistTemplate);
    console.log(`${colors.green}Created master playlist template in project root${colors.reset}`);
  } catch (e) {
    console.log(`${colors.red}Failed to create master playlist template: ${e.message}${colors.reset}`);
  }
}

// Check and clean videoLinks.txt file
console.log(`\n${colors.blue}Checking and repairing video links file...${colors.reset}`);
const linkFilePath = './videoLinks.txt';

if (fs.existsSync(linkFilePath)) {
  try {
    const content = fs.readFileSync(linkFilePath, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());
    
    // Convert old-format URLs to JSON format
    const newLines = lines.map(line => {
      if (line.startsWith('{') && line.endsWith('}')) {
        // Already in JSON format
        return line;
      } else if (line.includes('/uploads/hls-videos/')) {
        // Convert URL to JSON format
        const id = line.split('/').filter(part => part)[5]; // Extract UUID from URL
        const newData = {
          url: line,
          id: id,
          uploadDate: new Date().toISOString(),
          fileSize: 0,
          duration: 0,
          fileName: `video-${id.substring(0, 8)}`
        };
        return JSON.stringify(newData);
      } else {
        return line; // Keep any other lines as is
      }
    });
    
    // Write updated content
    fs.writeFileSync(linkFilePath, newLines.join('\n') + '\n');
    console.log(`${colors.green}Updated videoLinks.txt with proper JSON format for ${newLines.length} videos${colors.reset}`);
  } catch (e) {
    console.log(`${colors.red}Error updating videoLinks.txt: ${e.message}${colors.reset}`);
  }
} else {
  console.log(`${colors.red}videoLinks.txt not found${colors.reset}`);
}

// Check and repair HLS video directories
console.log(`\n${colors.blue}Repairing video directories...${colors.reset}`);
const hlsDir = './uploads/hls-videos';

if (!fs.existsSync('./uploads')) {
  fs.mkdirSync('./uploads');
  console.log(`${colors.green}Created uploads directory${colors.reset}`);
}

if (!fs.existsSync(hlsDir)) {
  fs.mkdirSync(hlsDir, { recursive: true });
  console.log(`${colors.green}Created HLS videos directory${colors.reset}`);
}

// Find all video directories
if (fs.existsSync(hlsDir)) {
  try {
    const videoIds = fs.readdirSync(hlsDir).filter(item => 
      fs.statSync(path.join(hlsDir, item)).isDirectory()
    );
    
    console.log(`${colors.green}Found ${videoIds.length} video directories${colors.reset}`);
    
    // Process each video directory
    for (const videoId of videoIds) {
      const videoDir = path.join(hlsDir, videoId);
      console.log(`\n${colors.yellow}Repairing video: ${videoId}${colors.reset}`);
      
      // Ensure playlist.m3u8 exists
      const playlistPath = path.join(videoDir, 'playlist.m3u8');
      if (!fs.existsSync(playlistPath)) {
        console.log(`${colors.yellow}Creating missing playlist.m3u8...${colors.reset}`);
        try {
          fs.copyFileSync('./playlist.m3u8', playlistPath);
          console.log(`${colors.green}Created playlist.m3u8${colors.reset}`);
        } catch (e) {
          console.log(`${colors.red}Error creating playlist.m3u8: ${e.message}${colors.reset}`);
        }
      } else {
        // Verify and repair playlist content
        try {
          const content = fs.readFileSync(playlistPath, 'utf-8');
          if (!content.includes('#EXT-X-STREAM-INF')) {
            console.log(`${colors.yellow}Repairing invalid playlist.m3u8...${colors.reset}`);
            fs.writeFileSync(playlistPath, masterPlaylistTemplate);
            console.log(`${colors.green}Repaired playlist.m3u8${colors.reset}`);
          }
        } catch (e) {
          console.log(`${colors.red}Error checking playlist.m3u8: ${e.message}${colors.reset}`);
        }
      }
      
      // Check if we have any quality-specific TS segments
      const segments = fs.readdirSync(videoDir).filter(file => file.endsWith('.ts'));
      if (segments.length > 0) {
        console.log(`${colors.green}Found ${segments.length} TS segments${colors.reset}`);
      } else {
        console.log(`${colors.red}No TS segments found${colors.reset}`);
      }
      
      // Create quality playlists if missing
      const qualities = ['360p', '480p', '720p', '1080p'];
      for (const quality of qualities) {
        const qualityPlaylistPath = path.join(videoDir, `${quality}.m3u8`);
        const qualitySegments = segments.filter(seg => seg.startsWith(`${quality}_`));
        
        if (!fs.existsSync(qualityPlaylistPath) && qualitySegments.length > 0) {
          console.log(`${colors.yellow}Creating missing ${quality}.m3u8...${colors.reset}`);
          
          // Create a basic quality playlist
          let qualityPlaylist = '#EXTM3U\n';
          qualityPlaylist += '#EXT-X-VERSION:3\n';
          qualityPlaylist += '#EXT-X-TARGETDURATION:4\n';
          qualityPlaylist += '#EXT-X-MEDIA-SEQUENCE:0\n';
          
          // Add segments in numerical order
          const orderedSegments = qualitySegments.sort((a, b) => {
            const aNum = parseInt(a.split('_')[1].split('.')[0]);
            const bNum = parseInt(b.split('_')[1].split('.')[0]);
            return aNum - bNum;
          });
          
          for (const segment of orderedSegments) {
            qualityPlaylist += '#EXTINF:4.000000,\n';
            qualityPlaylist += `${segment}\n`;
          }
          
          qualityPlaylist += '#EXT-X-ENDLIST\n';
          
          try {
            fs.writeFileSync(qualityPlaylistPath, qualityPlaylist);
            console.log(`${colors.green}Created ${quality}.m3u8 with ${qualitySegments.length} segments${colors.reset}`);
          } catch (e) {
            console.log(`${colors.red}Error creating ${quality}.m3u8: ${e.message}${colors.reset}`);
          }
        } else if (!fs.existsSync(qualityPlaylistPath)) {
          console.log(`${colors.yellow}No segments for ${quality}, skipping playlist creation${colors.reset}`);
        }
      }
    }
    
    console.log(`\n${colors.green}Video repair completed!${colors.reset}`);
    
  } catch (e) {
    console.log(`${colors.red}Error repairing videos: ${e.message}${colors.reset}`);
  }
} else {
  console.log(`${colors.red}HLS videos directory not found!${colors.reset}`);
}

// Attempt to restart the server
console.log(`\n${colors.blue}Checking server status...${colors.reset}`);
try {
  execSync('curl -s --head http://localhost:8000/status');
  console.log(`${colors.green}Server is running${colors.reset}`);
} catch (e) {
  console.log(`${colors.yellow}Server is not running. Starting server...${colors.reset}`);
  try {
    // Run improved-restart-server.bat in a separate process
    execSync('powershell -Command "Start-Process -FilePath \\"./improved-restart-server.bat\\" -WindowStyle Normal"');
    console.log(`${colors.green}Server restart initiated${colors.reset}`);
  } catch (e) {
    console.log(`${colors.red}Error starting server: ${e.message}${colors.reset}`);
  }
} 