/**
 * Video diagnostics utility for HLS Streaming Server
 * Checks videos and playlist files for common issues
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

console.log(`${colors.cyan}===== HLS Video Diagnostic Utility =====${colors.reset}`);

// Check if videoLinks.txt exists and is valid
console.log(`\n${colors.blue}Checking video links file...${colors.reset}`);
const linkFilePath = './videoLinks.txt';

let videoRecords = [];
if (fs.existsSync(linkFilePath)) {
  console.log(`${colors.green}videoLinks.txt exists${colors.reset}`);
  
  try {
    const linkFileContent = fs.readFileSync(linkFilePath, 'utf-8');
    const lines = linkFileContent.split('\n').filter(line => line.trim());
    console.log(`${colors.green}Found ${lines.length} video entries${colors.reset}`);

    // Try to parse each line as JSON
    videoRecords = lines.map((line, index) => {
      try {
        return { data: JSON.parse(line), index, valid: true, line };
      } catch (e) {
        // Handle legacy format (plain URLs)
        console.log(`${colors.yellow}Line ${index + 1} is not valid JSON, treating as legacy URL${colors.reset}`);
        return { 
          data: { url: line, id: `unknown-${index}` }, 
          index, 
          valid: false, 
          line 
        };
      }
    });
    
    console.log(`${colors.green}Successfully processed ${videoRecords.length} video records${colors.reset}`);
  } catch (e) {
    console.log(`${colors.red}Error reading video links file: ${e.message}${colors.reset}`);
  }
} else {
  console.log(`${colors.red}videoLinks.txt not found!${colors.reset}`);
}

// Check HLS video directories
console.log(`\n${colors.blue}Checking HLS video directories...${colors.reset}`);
const hlsDir = './uploads/hls-videos';

if (fs.existsSync(hlsDir)) {
  console.log(`${colors.green}HLS videos directory exists${colors.reset}`);
  
  try {
    const videoDirs = fs.readdirSync(hlsDir).filter(item => 
      fs.statSync(path.join(hlsDir, item)).isDirectory()
    );
    
    console.log(`${colors.green}Found ${videoDirs.length} video directories${colors.reset}`);
    
    // Check each video directory
    for (let i = 0; i < videoDirs.length; i++) {
      const videoDir = videoDirs[i];
      const dirPath = path.join(hlsDir, videoDir);
      console.log(`\n${colors.yellow}Checking video ${i + 1}: ${videoDir}${colors.reset}`);
      
      // Check if playlist.m3u8 exists
      const playlistPath = path.join(dirPath, 'playlist.m3u8');
      if (fs.existsSync(playlistPath)) {
        console.log(`${colors.green}✓ playlist.m3u8 exists${colors.reset}`);
        
        // Check playlist content
        const playlistContent = fs.readFileSync(playlistPath, 'utf8');
        if (playlistContent.includes('#EXT-X-STREAM-INF')) {
          console.log(`${colors.green}✓ playlist.m3u8 has valid stream references${colors.reset}`);
        } else {
          console.log(`${colors.red}✗ playlist.m3u8 is missing stream references${colors.reset}`);
          console.log(`${colors.yellow}Attempting to fix playlist.m3u8...${colors.reset}`);
          
          // Create a valid master playlist
          const fixedPlaylist = `#EXTM3U
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
          try {
            fs.writeFileSync(playlistPath, fixedPlaylist);
            console.log(`${colors.green}✓ Fixed playlist.m3u8${colors.reset}`);
          } catch (e) {
            console.log(`${colors.red}Error fixing playlist.m3u8: ${e.message}${colors.reset}`);
          }
        }
      } else {
        console.log(`${colors.red}✗ playlist.m3u8 is missing!${colors.reset}`);
        
        // Check if we have quality-specific playlists
        const qualityPlaylists = ['360p.m3u8', '480p.m3u8', '720p.m3u8', '1080p.m3u8'];
        const existingPlaylists = qualityPlaylists.filter(file => 
          fs.existsSync(path.join(dirPath, file))
        );
        
        if (existingPlaylists.length > 0) {
          console.log(`${colors.yellow}Found ${existingPlaylists.length} quality playlists${colors.reset}`);
          console.log(`${colors.yellow}Generating master playlist.m3u8...${colors.reset}`);
          
          // Create a master playlist
          let masterPlaylist = '#EXTM3U\n#EXT-X-VERSION:3\n';
          
          if (existingPlaylists.includes('360p.m3u8')) {
            masterPlaylist += '#EXT-X-STREAM-INF:BANDWIDTH=800000,RESOLUTION=640x360\n360p.m3u8\n';
          }
          if (existingPlaylists.includes('480p.m3u8')) {
            masterPlaylist += '#EXT-X-STREAM-INF:BANDWIDTH=1400000,RESOLUTION=842x480\n480p.m3u8\n';
          }
          if (existingPlaylists.includes('720p.m3u8')) {
            masterPlaylist += '#EXT-X-STREAM-INF:BANDWIDTH=2800000,RESOLUTION=1280x720\n720p.m3u8\n';
          }
          if (existingPlaylists.includes('1080p.m3u8')) {
            masterPlaylist += '#EXT-X-STREAM-INF:BANDWIDTH=5000000,RESOLUTION=1920x1080\n1080p.m3u8\n';
          }
          
          try {
            fs.writeFileSync(playlistPath, masterPlaylist);
            console.log(`${colors.green}✓ Created playlist.m3u8${colors.reset}`);
          } catch (e) {
            console.log(`${colors.red}Error creating playlist.m3u8: ${e.message}${colors.reset}`);
          }
        } else {
          console.log(`${colors.red}✗ No quality playlists found!${colors.reset}`);
        }
      }
      
      // Check quality-specific playlists
      const qualityPlaylists = ['360p.m3u8', '480p.m3u8', '720p.m3u8', '1080p.m3u8'];
      for (const qualityPlaylist of qualityPlaylists) {
        const qualityPath = path.join(dirPath, qualityPlaylist);
        if (fs.existsSync(qualityPath)) {
          console.log(`${colors.green}✓ ${qualityPlaylist} exists${colors.reset}`);
          
          // Check if segments exist
          const playlistContent = fs.readFileSync(qualityPath, 'utf8');
          const segmentMatches = playlistContent.match(/(?:\d+p_\d+\.ts)/g) || [];
          
          if (segmentMatches.length > 0) {
            let allSegmentsExist = true;
            const missingSegments = [];
            
            for (const segment of segmentMatches) {
              const segmentPath = path.join(dirPath, segment);
              if (!fs.existsSync(segmentPath)) {
                allSegmentsExist = false;
                missingSegments.push(segment);
              }
            }
            
            if (allSegmentsExist) {
              console.log(`${colors.green}✓ All ${segmentMatches.length} segments for ${qualityPlaylist} exist${colors.reset}`);
            } else {
              console.log(`${colors.red}✗ Missing ${missingSegments.length} segments for ${qualityPlaylist}${colors.reset}`);
              console.log(`${colors.red}  Missing: ${missingSegments.join(', ')}${colors.reset}`);
            }
          } else {
            console.log(`${colors.red}✗ No segment references found in ${qualityPlaylist}${colors.reset}`);
          }
        } else {
          console.log(`${colors.yellow}! ${qualityPlaylist} doesn't exist${colors.reset}`);
        }
      }
      
      // Check if this directory matches a video record
      const matchingRecord = videoRecords.find(record => {
        if (record.data.id && record.data.id === videoDir) {
          return true;
        }
        if (record.data.url && record.data.url.includes(videoDir)) {
          return true;
        }
        return false;
      });
      
      if (matchingRecord) {
        console.log(`${colors.green}✓ Found matching record in videoLinks.txt${colors.reset}`);
      } else {
        console.log(`${colors.yellow}! No matching record found in videoLinks.txt${colors.reset}`);
      }
    }
  } catch (e) {
    console.log(`${colors.red}Error checking HLS directories: ${e.message}${colors.reset}`);
  }
} else {
  console.log(`${colors.red}HLS videos directory not found!${colors.reset}`);
}

console.log(`\n${colors.cyan}===== Diagnostic Summary =====${colors.reset}`);
console.log(`${colors.cyan}1. ${videoRecords.length} video records found in videoLinks.txt${colors.reset}`);

if (fs.existsSync('./playlist.m3u8')) {
  console.log(`${colors.green}2. Master playlist.m3u8 exists in project root (used as template)${colors.reset}`);
} else {
  console.log(`${colors.red}2. Master playlist.m3u8 missing from project root! This is needed for template.${colors.reset}`);
  
  // Create the master playlist if it doesn't exist
  const defaultMasterPlaylist = `#EXTM3U
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

  try {
    fs.writeFileSync('./playlist.m3u8', defaultMasterPlaylist);
    console.log(`${colors.green}   Created new master playlist.m3u8 in project root${colors.reset}`);
  } catch (e) {
    console.log(`${colors.red}   Failed to create master playlist: ${e.message}${colors.reset}`);
  }
}

// Provide fix instructions
console.log(`\n${colors.cyan}===== Fix Instructions =====${colors.reset}`);
console.log(`${colors.cyan}If videos are not playing:${colors.reset}`);
console.log(`1. Make sure the backend server is running on port 8000`);
console.log(`2. Check the browser console for CORS or access errors`);
console.log(`3. Ensure the frontend is correctly configured with URL http://localhost:8000`);
console.log(`4. For missing playlist files, run this utility to attempt repairs`);

// Quick CORS test
console.log(`\n${colors.cyan}Testing CORS configuration...${colors.reset}`);
try {
  const corsResponse = execSync('curl -I -X OPTIONS http://localhost:8000/uploads -H "Origin: http://localhost:5173"', { encoding: 'utf8' });
  if (corsResponse.includes('Access-Control-Allow-Origin')) {
    console.log(`${colors.green}✓ CORS headers detected in response${colors.reset}`);
  } else {
    console.log(`${colors.red}✗ CORS headers not detected in response${colors.reset}`);
    console.log(`${colors.yellow}This may cause video loading issues in the browser${colors.reset}`);
  }
} catch (e) {
  console.log(`${colors.red}✗ Error testing CORS: ${e.message}${colors.reset}`);
  console.log(`${colors.yellow}Make sure server is running at http://localhost:8000${colors.reset}`);
} 