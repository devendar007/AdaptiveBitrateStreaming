import React, { useEffect, useState } from 'react';
import VideoUploadForm from './VideoUploadForm';
import Topbar from './Topbar';
import { getVideosSourceList, checkServerStatus } from '../services/apiServices'
import VideoLib from './VideoLib';
import { FaServer, FaExclamationTriangle, FaCloudUploadAlt } from 'react-icons/fa';
import config from '../config';

const Home = () => {
    const [videoSources, setVideoSources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [serverStatus, setServerStatus] = useState('checking...');

    useEffect(() => {
        fetchVideoSources();
    }, []);
    
    const fetchVideoSources = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${config.serverBaseUrl}/videos`);
            if (!response.ok) {
                throw new Error(`Server responded with status: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Check if the response contains the new data structure
            if (data.videosData && Array.isArray(data.videosData)) {
                // We have detailed video data with all metadata
                setVideoSources(data.videosData);
            } else if (data.videoUrls && Array.isArray(data.videoUrls)) {
                // Legacy API format with just URLs
                setVideoSources(data.videoUrls.map(url => ({
                    url: url,
                    id: url.split('/').pop().replace('.m3u8', ''),
                    fileName: url.split('/').pop(),
                    uploadDate: new Date().toISOString(),
                    fileSize: 0,
                    duration: 0
                })));
            } else if (Array.isArray(data)) {
                // Super legacy format (direct array)
                if (typeof data[0] === 'object' && data[0] !== null) {
                    // Array of objects
                    setVideoSources(data);
                } else {
                    // Array of strings
                    const formattedData = data.map(url => ({
                        url: url,
                        id: url.split('/').pop().replace('.m3u8', ''),
                        fileName: url.split('/').pop(),
                        uploadDate: new Date().toISOString(),
                        fileSize: 0,
                        duration: 0
                    }));
                    setVideoSources(formattedData);
                }
            } else {
                setVideoSources([]);
            }
            
            // Update server status
            checkServerStatus().then(status => {
                setServerStatus(status);
            });
        } catch (err) {
            console.error('Error fetching videos:', err);
            setError(`Error connecting to server: ${err.message}`);
            setServerStatus({
                online: false,
                ffmpegInstalled: false,
                message: 'Server is offline'
            });
        } finally {
            setLoading(false);
        }
    }

    const handleUploadComplete = () => {
        // Refresh the video list after successful upload
        fetchVideoSources();
    }

    return (
        <div className="flex flex-col min-h-screen">
            <Topbar />
            
            <main className="flex-1">
                <div className="container mx-auto max-w-7xl px-4 py-8">
                    {!serverStatus.online && (
                        <div className="mb-6">
                            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-sm flex items-start">
                                <FaServer className="mr-3 text-xl flex-shrink-0 mt-1" />
                                <div>
                                    <h4 className="font-bold text-lg mb-2">Server Offline</h4>
                                    <p>
                                        The backend server is not responding. Please make sure it's running at 
                                        <strong> http://localhost:8000</strong>.
                                    </p>
                                    <hr className="my-3 border-red-200" />
                                    <p className="mb-0">
                                        Run <code className="bg-red-50 px-1 py-0.5 rounded text-sm">npm run start:backend</code> in the project root directory 
                                        to start the server.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {serverStatus.online && !serverStatus.ffmpegInstalled && (
                        <div className="mb-6">
                            <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-4 rounded shadow-sm flex items-start">
                                <FaExclamationTriangle className="mr-3 text-xl flex-shrink-0 mt-1" />
                                <div>
                                    <h4 className="font-bold text-lg mb-2">FFmpeg Not Installed</h4>
                                    <p>
                                        FFmpeg is required for video processing but was not detected on the server.
                                    </p>
                                    <hr className="my-3 border-yellow-200" />
                                    <p className="mb-0">
                                        Please install FFmpeg and make sure it's in your PATH. See the README for 
                                        installation instructions.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-center mb-10">
                        <div className="w-full lg:w-2/3 md:w-4/5">
                            <VideoUploadForm 
                                onUploadComplete={handleUploadComplete} 
                                serverStatus={serverStatus}
                            />
                        </div>
                    </div>
                    
                    <section className="mt-12">
                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-bold text-blue-600 relative inline-block pb-2 mb-1">Video Library
                                <span className="absolute left-1/2 -bottom-1 transform -translate-x-1/2 w-12 h-1 bg-blue-500 rounded"></span>
                            </h2>
                            <p className="text-gray-600 max-w-xl mx-auto">Adaptive bitrate streaming with multiple resolutions</p>
                        </div>
                        
                        {loading ? (
                            <div className="text-center py-10">
                                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent mb-3"></div>
                                <p className="text-gray-500">Loading videos...</p>
                            </div>
                        ) : error ? (
                            <div className="flex justify-center my-4">
                                <div className="w-full md:w-2/3 lg:w-1/2 text-center">
                                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-sm">
                                        {error}
                                    </div>
                                </div>
                            </div>
                        ) : videoSources.length === 0 ? (
                            <div className="flex justify-center my-8">
                                <div className="w-full md:w-2/3 text-center">
                                    <div className="bg-white rounded-lg shadow-md p-8">
                                        <div className="mx-auto w-20 h-20 flex items-center justify-center bg-gray-100 rounded-full mb-4">
                                            <FaCloudUploadAlt size={50} className="text-gray-400" />
                                        </div>
                                        <h4 className="text-xl font-semibold mb-2">No videos available</h4>
                                        <p className="text-gray-600 mb-4">Upload your first video to get started with adaptive streaming!</p>
                                        <p className="text-sm text-gray-500">
                                            <strong>Note:</strong> Make sure the backend server is running on port 8000 and FFmpeg is installed on your system.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <VideoLib videoSources={videoSources} />
                        )}
                    </section>
                </div>
            </main>
            
            <footer className="bg-gray-100 mt-8 py-6 shadow-inner">
                <div className="container mx-auto">
                    <div className="flex justify-center">
                        <div className="text-center text-gray-600 md:w-2/3">
                            <p className="mb-0">HLS Video Streaming Server with React Frontend</p>
                            <p className="text-sm mt-2">
                                Build with React, Tailwind CSS, and Video.js for adaptive video streaming
                            </p>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Home;