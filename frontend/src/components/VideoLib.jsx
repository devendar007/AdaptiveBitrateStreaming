import React, { useState } from 'react';
import VideoPlayer from './VideoPlayer';
import { FaCalendarAlt, FaVideo, FaClock, FaFileVideo, FaPlay, FaLayerGroup } from 'react-icons/fa';

const VideoLib = ({ videoSources }) => {
  const [selectedVideo, setSelectedVideo] = useState(null);

  // Create video items in pairs for responsive layout
  const videoRows = [];
  for (let i = 0; i < videoSources.length; i += 3) {
    videoRows.push(videoSources.slice(i, i + 3));
  }

  // Function to format the upload date
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return 'Unknown date';
    }
  };
  
  // Function to format the duration in seconds to mm:ss
  const formatDuration = (seconds) => {
    if (!seconds) return null;
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="video-library">
      {selectedVideo && (
        <div className="mb-6">
          <div className="w-full">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="px-4 py-3 flex justify-between items-center border-b">
                <strong className="text-lg">
                  {selectedVideo.originalName || selectedVideo.fileName || 'Featured Video'}
                </strong>
                <span className="bg-blue-600 text-white text-xs font-semibold px-2.5 py-1 rounded">Featured</span>
              </div>
              <div className="p-0">
                <div className="relative overflow-hidden bg-black">
                  <VideoPlayer videoSource={selectedVideo.url} />
                </div>
              </div>
              <div className="px-4 py-3 border-t">
                <div className="flex flex-wrap justify-between items-center">
                  <div className="flex flex-wrap">
                    {selectedVideo.uploadDate && (
                      <div className="flex items-center mr-4 text-gray-600 text-sm">
                        <FaCalendarAlt className="mr-1 opacity-70" size={14} /> {formatDate(selectedVideo.uploadDate)}
                      </div>
                    )}
                    {formatDuration(selectedVideo.duration) && (
                      <div className="flex items-center mr-4 text-gray-600 text-sm">
                        <FaClock className="mr-1 opacity-70" size={14} /> {formatDuration(selectedVideo.duration)}
                      </div>
                    )}
                    {selectedVideo.fileSize && (
                      <div className="flex items-center mr-4 text-gray-600 text-sm">
                        <FaFileVideo className="mr-1 opacity-70" size={14} /> {selectedVideo.fileSize} MB
                      </div>
                    )}
                  </div>
                  <div className="flex items-center">
                    <FaLayerGroup className="mr-2 text-blue-600" size={14} />
                    <span className="text-sm text-gray-500">Adaptive streaming with multiple resolutions</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {videoSources.map((video, index) => {
          // Handle both object format and string format
          const videoUrl = typeof video === 'string' ? video : video.url;
          const uploadDate = video.uploadDate ? formatDate(video.uploadDate) : null;
          const fileName = video.originalName || video.fileName || '';
          const fileSize = video.fileSize ? video.fileSize : null;
          const duration = formatDuration(video.duration);
          
          const isSelected = selectedVideo && selectedVideo.url === videoUrl;
          
          return (
            <div key={`video-${index}`} className={`bg-white rounded-lg shadow-md overflow-hidden ${isSelected ? 'ring-2 ring-blue-500' : ''}`}>
              <div className="px-4 py-3 flex justify-between items-center border-b">
                <div className="truncate max-w-[180px]">
                  <strong>{fileName || `Video ${index + 1}`}</strong>
                </div>
                <span className="bg-blue-600 text-white text-xs font-semibold px-2.5 py-1 rounded">HLS</span>
              </div>
              
              {!isSelected ? (
                <>
                  <div className="relative">
                    <div className="aspect-video relative bg-gradient-to-br from-blue-600 to-indigo-700 cursor-pointer" onClick={() => setSelectedVideo(video)}>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center hover:bg-blue-400 transition-colors">
                          <FaPlay size={30} className="text-white" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="px-4 py-3 border-t">
                    <div className="flex justify-between items-center">
                      <div className="flex flex-col">
                        {duration && (
                          <div className="flex items-center text-gray-600 text-xs mb-1">
                            <FaClock className="mr-1 opacity-70" size={12} /> {duration}
                          </div>
                        )}
                        {uploadDate && (
                          <div className="flex items-center text-gray-600 text-xs">
                            <FaCalendarAlt className="mr-1 opacity-70" size={12} /> {uploadDate.split(',')[0]}
                          </div>
                        )}
                      </div>
                      <button 
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded flex items-center transition-transform hover:-translate-y-0.5"
                        onClick={() => setSelectedVideo(video)}
                      >
                        <FaPlay size={10} className="mr-1.5" /> Watch
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center text-gray-500">
                    <FaPlay size={30} className="mb-3 text-blue-600 mx-auto" />
                    <p className="mb-0">Currently playing</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VideoLib;