/**
 * FFmpeg Setup Helper Script
 * 
 * This script helps users set up FFmpeg by:
 * 1. Checking if FFmpeg is already installed
 * 2. Providing instructions on how to download and install FFmpeg
 * 3. Explaining how to add FFmpeg to the PATH
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// ANSI color codes for pretty output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m"
};

// Function to check if FFmpeg is installed
function checkFFmpeg() {
  console.log(`${colors.cyan}Checking for FFmpeg installation...${colors.reset}`);
  
  // Check in bin directory
  const binPath = path.join(process.cwd(), 'bin', 'ffmpeg.exe');
  if (fs.existsSync(binPath)) {
    console.log(`${colors.green}✓ FFmpeg found in project bin directory: ${binPath}${colors.reset}`);
    return binPath;
  }
  
  // Check in current directory
  const localPath = path.join(process.cwd(), 'ffmpeg.exe');
  if (fs.existsSync(localPath)) {
    console.log(`${colors.green}✓ FFmpeg found in current directory: ${localPath}${colors.reset}`);
    return localPath;
  }
  
  // Check in PATH
  try {
    const result = execSync('ffmpeg -version', { encoding: 'utf8' });
    const version = result.split('\n')[0];
    console.log(`${colors.green}✓ FFmpeg found in system PATH: ${version}${colors.reset}`);
    return 'ffmpeg';
  } catch (error) {
    console.log(`${colors.red}✗ FFmpeg not found in system PATH${colors.reset}`);
    return false;
  }
}

// Main function
async function main() {
  console.log(`\n${colors.bright}${colors.blue}=======================================`);
  console.log(`       FFmpeg Setup Helper Script`);
  console.log(`=======================================${colors.reset}\n`);
  
  const ffmpegPath = checkFFmpeg();
  
  if (ffmpegPath) {
    console.log(`\n${colors.green}${colors.bright}Good news! FFmpeg is already installed.${colors.reset}`);
    
    // Test FFmpeg with the found path
    try {
      const cmd = typeof ffmpegPath === 'string' && ffmpegPath !== 'ffmpeg' 
        ? `"${ffmpegPath}" -version` 
        : 'ffmpeg -version';
      
      const versionInfo = execSync(cmd, { encoding: 'utf8' });
      console.log(`\n${colors.cyan}FFmpeg version information:${colors.reset}`);
      console.log(versionInfo.split('\n').slice(0, 3).join('\n'));
      
      console.log(`\n${colors.green}${colors.bright}Your HLS Streaming Server should work correctly with FFmpeg.${colors.reset}`);
      
      if (ffmpegPath === 'ffmpeg') {
        console.log(`\n${colors.cyan}FFmpeg is available through your system PATH.${colors.reset}`);
      } else {
        console.log(`\n${colors.cyan}FFmpeg is available at: ${ffmpegPath}${colors.reset}`);
        console.log(`The server will use this version automatically.`);
      }
    } catch (error) {
      console.log(`\n${colors.red}Error testing FFmpeg: ${error.message}${colors.reset}`);
    }
  } else {
    console.log(`\n${colors.yellow}${colors.bright}FFmpeg is not installed or not in your PATH.${colors.reset}`);
    console.log(`\n${colors.cyan}To use the HLS Streaming Server, you need to install FFmpeg:${colors.reset}\n`);
    
    console.log(`${colors.bright}Option 1: Download FFmpeg directly${colors.reset}`);
    console.log(`1. Go to: https://github.com/BtbN/FFmpeg-Builds/releases`);
    console.log(`2. Download the latest ffmpeg-master-latest-win64-gpl.zip`);
    console.log(`3. Extract the zip file to a location on your computer (e.g., C:\\ffmpeg)`);
    console.log(`4. Copy the ffmpeg.exe, ffprobe.exe, and ffplay.exe files from the bin folder`);
    console.log(`5. Paste them into the 'bin' folder in this project directory\n`);
    
    console.log(`${colors.bright}Option 2: Add FFmpeg to your system PATH${colors.reset}`);
    console.log(`1. Go to: https://github.com/BtbN/FFmpeg-Builds/releases`);
    console.log(`2. Download the latest ffmpeg-master-latest-win64-gpl.zip`);
    console.log(`3. Extract the zip file to a location on your computer (e.g., C:\\ffmpeg)`);
    console.log(`4. Add the bin folder to your system PATH:`);
    console.log(`   a. Press Windows key + X and select "System"`);
    console.log(`   b. Click "Advanced system settings"`);
    console.log(`   c. Click "Environment Variables"`);
    console.log(`   d. Under "System variables", find the "Path" variable and click "Edit"`);
    console.log(`   e. Click "New" and add the path to the bin folder (e.g., C:\\ffmpeg\\bin)`);
    console.log(`   f. Click "OK" on all dialog boxes`);
    console.log(`   g. Restart your computer for the changes to take effect\n`);
    
    console.log(`${colors.bright}After installing FFmpeg, run this script again to verify the installation.${colors.reset}\n`);
  }
  
  rl.question(`\n${colors.cyan}Press Enter to exit...${colors.reset}`, () => {
    rl.close();
  });
}

// Run the main function
main().catch(error => {
  console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
  rl.question(`\n${colors.cyan}Press Enter to exit...${colors.reset}`, () => {
    rl.close();
  });
}); 