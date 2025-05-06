import React from 'react';
import { FaVideo, FaGithub, FaCloudUploadAlt, FaInfoCircle } from 'react-icons/fa';

const Topbar = () => {
  return (
    <nav className="bg-gradient-to-r from-blue-600 to-indigo-700 py-3 shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 flex flex-wrap items-center justify-between">
        <div className="flex items-center">
          <div className="w-12 h-12 flex items-center justify-center bg-white/20 rounded-xl mr-3">
            <FaVideo className="text-white" size={30} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white mb-0">HLS Video Streaming</h3>
            <span className="text-white/75 text-sm">Adaptive Bitrate Technology</span>
          </div>
        </div>
        
        <button className="lg:hidden text-white" type="button" aria-label="Toggle navigation">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>
        
        <div className="hidden lg:flex items-center space-x-4">
          <a href="#upload" className="text-white hover:text-white/80 flex items-center px-3 py-2">
            <FaCloudUploadAlt className="mr-2" size={16} /> Upload
          </a>
          <a href="#about" className="text-white hover:text-white/80 flex items-center px-3 py-2">
            <FaInfoCircle className="mr-2" size={16} /> About HLS
          </a>
          <a 
            href="https://github.com/devendar007" 
            target="_blank" 
            rel="noreferrer"
            className="flex items-center bg-white text-blue-600 hover:bg-gray-100 transition-colors px-4 py-2 rounded-md font-medium text-sm"
          >
            <FaGithub className="mr-2" size={16} /> GitHub
          </a>
        </div>
      </div>
    </nav>
  );
};

export default Topbar;