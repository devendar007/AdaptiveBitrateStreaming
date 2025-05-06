/**
 * Debug utility for HLS Streaming Server
 * Helps identify processes using port 8000 and diagnose FFmpeg installation
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

console.log(`${colors.cyan}===== HLS Streaming Server Debug Utility =====${colors.reset}`);
console.log(`${colors.cyan}Running on: ${os.platform()} ${os.release()}${colors.reset}`);

// Check for processes using port 8000
console.log(`\n${colors.blue}Checking for processes using port 8000...${colors.reset}`);
try {
  const netstatOutput = execSync('netstat -ano | findstr :8000 | findstr LISTENING', { encoding: 'utf8' });
  
  if (netstatOutput.trim()) {
    console.log(`${colors.yellow}Found processes using port 8000:${colors.reset}`);
    console.log(netstatOutput);
    
    // Extract PIDs
    const pidRegex = /LISTENING\s+(\d+)/g;
    let match;
    const pids = [];
    
    while ((match = pidRegex.exec(netstatOutput)) !== null) {
      pids.push(match[1]);
    }
    
    if (pids.length > 0) {
      console.log(`${colors.yellow}Process IDs using port 8000: ${pids.join(', ')}${colors.reset}`);
      
      // Get process names
      for (const pid of pids) {
        try {
          const tasklist = execSync(`tasklist /FI "PID eq ${pid}" /FO LIST`, { encoding: 'utf8' });
          console.log(`\nProcess details for PID ${pid}:`);
          console.log(tasklist);
        } catch (e) {
          console.log(`${colors.red}Error getting process details for PID ${pid}: ${e.message}${colors.reset}`);
        }
      }
      
      console.log(`\n${colors.yellow}To kill these processes, you can run:${colors.reset}`);
      pids.forEach(pid => {
        console.log(`taskkill /F /PID ${pid}`);
      });
    }
  } else {
    console.log(`${colors.green}No processes are using port 8000${colors.reset}`);
  }
} catch (error) {
  console.log(`${colors.red}Error checking port usage: ${error.message}${colors.reset}`);
}

// Check FFmpeg installation
console.log(`\n${colors.blue}Checking FFmpeg installation...${colors.reset}`);
const ffmpegPath = "C:\\FFmpeg\\bin\\ffmpeg.exe";

if (fs.existsSync(ffmpegPath)) {
  console.log(`${colors.green}FFmpeg found at: ${ffmpegPath}${colors.reset}`);
  
  try {
    const ffmpegVersion = execSync(`"${ffmpegPath}" -version`, { encoding: 'utf8' }).split('\n')[0];
    console.log(`${colors.green}FFmpeg version: ${ffmpegVersion}${colors.reset}`);
  } catch (e) {
    console.log(`${colors.red}Error getting FFmpeg version: ${e.message}${colors.reset}`);
  }
} else {
  console.log(`${colors.red}FFmpeg not found at expected path: ${ffmpegPath}${colors.reset}`);
  console.log(`${colors.yellow}Please install FFmpeg at this location for the server to work properly.${colors.reset}`);
}

// Check uploads directory
console.log(`\n${colors.blue}Checking uploads directory...${colors.reset}`);
const uploadsDir = './uploads';
const hlsDir = './uploads/hls-videos';

if (fs.existsSync(uploadsDir)) {
  console.log(`${colors.green}Uploads directory exists${colors.reset}`);
  
  if (fs.existsSync(hlsDir)) {
    console.log(`${colors.green}HLS videos directory exists${colors.reset}`);
    
    // Count videos
    try {
      const hlsDirs = fs.readdirSync(hlsDir).filter(file => 
        fs.statSync(path.join(hlsDir, file)).isDirectory()
      );
      
      console.log(`${colors.green}Found ${hlsDirs.length} video directories in HLS folder${colors.reset}`);
      
      if (hlsDirs.length > 0) {
        console.log(`${colors.green}Example video URL: http://localhost:8000/uploads/hls-videos/${hlsDirs[0]}/playlist.m3u8${colors.reset}`);
      }
    } catch (e) {
      console.log(`${colors.red}Error reading HLS directory: ${e.message}${colors.reset}`);
    }
  } else {
    console.log(`${colors.yellow}HLS videos directory doesn't exist yet. It will be created when first video is uploaded.${colors.reset}`);
  }
} else {
  console.log(`${colors.yellow}Uploads directory doesn't exist yet. It will be created when server starts.${colors.reset}`);
}

// Check videoLinks.txt
console.log(`\n${colors.blue}Checking video links file...${colors.reset}`);
const linkFilePath = './videoLinks.txt';

if (fs.existsSync(linkFilePath)) {
  console.log(`${colors.green}videoLinks.txt exists${colors.reset}`);
  
  try {
    const linkFileContent = fs.readFileSync(linkFilePath, 'utf-8');
    const lineCount = linkFileContent.split('\n').filter(line => line.trim()).length;
    console.log(`${colors.green}File contains ${lineCount} video records${colors.reset}`);
    
    if (lineCount > 0) {
      const firstLine = linkFileContent.split('\n')[0];
      try {
        const parsed = JSON.parse(firstLine);
        console.log(`${colors.green}Video record format: JSON (correct)${colors.reset}`);
      } catch (e) {
        console.log(`${colors.yellow}Warning: First line is not valid JSON. This might be an old format.${colors.reset}`);
      }
    }
  } catch (e) {
    console.log(`${colors.red}Error reading video links file: ${e.message}${colors.reset}`);
  }
} else {
  console.log(`${colors.yellow}videoLinks.txt doesn't exist yet. It will be created when server starts.${colors.reset}`);
}

// Overall status
console.log(`\n${colors.blue}Overall System Status${colors.reset}`);
let readyStatus = true;

// Check if port is free
try {
  const portCheck = execSync('netstat -ano | findstr :8000 | findstr LISTENING', { encoding: 'utf8' });
  if (portCheck.trim()) {
    console.log(`${colors.red}✗ Port 8000 is already in use${colors.reset}`);
    readyStatus = false;
  } else {
    console.log(`${colors.green}✓ Port 8000 is available${colors.reset}`);
  }
} catch (e) {
  console.log(`${colors.green}✓ Port 8000 is available${colors.reset}`);
}

// Check FFmpeg
if (fs.existsSync(ffmpegPath)) {
  console.log(`${colors.green}✓ FFmpeg is installed${colors.reset}`);
} else {
  console.log(`${colors.red}✗ FFmpeg is not installed at expected path${colors.reset}`);
  readyStatus = false;
}

// Final message
console.log('\n----------------------------------');
if (readyStatus) {
  console.log(`${colors.green}System appears ready to run HLS Streaming Server!${colors.reset}`);
  console.log(`${colors.green}Run the server with: node index.js${colors.reset}`);
} else {
  console.log(`${colors.yellow}Some issues need to be fixed before running the server.${colors.reset}`);
  console.log(`${colors.yellow}Fix the problems above and run this debug script again.${colors.reset}`);
} 