import React, { useState, useRef } from 'react';
import { FaCloudUploadAlt, FaFile, FaExclamationTriangle, FaServer, FaSpinner, FaCheck } from 'react-icons/fa';
import { uploadFile } from '../services/apiServices';

const VideoUploadForm = ({ onUploadComplete, serverStatus }) => {
    const [file, setFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [message, setMessage] = useState({ text: '', type: '' });
    const fileRef = useRef();
    const [dragActive, setDragActive] = useState(false);

    const handleReset = () => {
        fileRef.current.value = null;
        setUploadProgress(0);
    };

    const validateFileType = (file) => {
        const allowedExtensions = ["mp4", "mkv"];
        const fileNameParts = file.name.split(".");
        const fileExtension = fileNameParts[fileNameParts.length - 1].toLowerCase();
    
        return allowedExtensions.includes(fileExtension);
    }

    const handleFileChange = (event) => {
        const selectedFile = event.target.files?.[0];
        setMessage({ text: '', type: '' });
  
        if (selectedFile) {
            if (validateFileType(selectedFile)) {
                setFile(selectedFile);
                setMessage({ text: `File selected: ${selectedFile.name}`, type: 'info' });
            } else {
                setFile(null);
                event.target.value = '';
                setMessage({ text: 'Only mp4 and mkv formats are allowed.', type: 'danger' });
            }      
        }
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const droppedFile = e.dataTransfer.files[0];
            
            if (validateFileType(droppedFile)) {
                setFile(droppedFile);
                setMessage({ text: `File selected: ${droppedFile.name}`, type: 'info' });
                
                // Update the file input value for visual consistency
                if (fileRef.current) {
                    const dataTransfer = new DataTransfer();
                    dataTransfer.items.add(droppedFile);
                    fileRef.current.files = dataTransfer.files;
                }
            } else {
                setFile(null);
                setMessage({ text: 'Only mp4 and mkv formats are allowed.', type: 'danger' });
            }
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        
        // Prevent upload if server is offline or FFmpeg not installed
        if (!serverStatus.online) {
            setMessage({ 
                text: 'Cannot upload: Server is offline. Please start the backend server.', 
                type: 'danger' 
            });
            return;
        }
        
        if (!serverStatus.ffmpegInstalled) {
            setMessage({ 
                text: 'Cannot upload: FFmpeg is not installed on the server. Please install FFmpeg first.', 
                type: 'danger' 
            });
            return;
        }
        
        setIsUploading(true);
        setMessage({ text: '', type: '' });
    
        if (file) {
            try {
                // Pass a progress tracking function
                const progressCallback = (percent) => {
                    setUploadProgress(percent);
                };
                
                const uploadFileResult = await uploadFile(file, progressCallback);
                
                if (uploadFileResult) {
                    setMessage({ text: 'File uploaded successfully! Video is now processing...', type: 'success' });
                    if (onUploadComplete) onUploadComplete();
                } else {
                    setMessage({ 
                        text: 'Upload failed. The server might be offline or FFmpeg is not installed.', 
                        type: 'danger' 
                    });
                }
            } catch (error) {
                console.error("Upload error:", error);
                const errorMessage = error.message.includes('Network Error') 
                    ? 'Connection to server failed. Make sure the server is running at http://localhost:8000.'
                    : `Upload error: ${error.message}`;
                
                setMessage({ text: errorMessage, type: 'danger' });
            } finally {
                handleReset();
                setFile(null);
                setIsUploading(false);
            }
        } else {
            setMessage({ text: 'Please select a valid video file.', type: 'warning' });
            setIsUploading(false);
        }
    }

    // Determine if upload should be disabled
    const isUploadDisabled = isUploading || !file || !serverStatus.online || !serverStatus.ffmpegInstalled;

    // Alert component based on message type
    const renderAlert = () => {
        if (!message.text) return null;
        
        const alertClasses = {
            success: "bg-green-100 border-green-400 text-green-700",
            danger: "bg-red-100 border-red-400 text-red-700",
            warning: "bg-yellow-100 border-yellow-400 text-yellow-700",
            info: "bg-blue-100 border-blue-400 text-blue-700"
        };
        
        return (
            <div className={`${alertClasses[message.type]} px-4 py-3 mb-4 rounded border`}>
                {message.text}
            </div>
        );
    };

    return (
        <div className="bg-white rounded-lg shadow-md border-0 overflow-hidden" id="upload">
            <div className="p-6">
                <h3 className="text-center mb-6 font-bold text-xl flex items-center justify-center">
                    <FaCloudUploadAlt className="mr-2 text-blue-600" />
                    Upload Video
                </h3>
                
                {!serverStatus.online && (
                    <div className="mb-4 bg-red-100 text-red-700 p-4 rounded-md flex items-start">
                        <FaServer className="mr-3 text-xl flex-shrink-0 mt-1" />
                        <div>
                            <h4 className="text-lg font-bold mb-1">Server Offline</h4>
                            <p className="mb-0">The backend server is not running. Please start the server before uploading.</p>
                        </div>
                    </div>
                )}
                
                {serverStatus.online && !serverStatus.ffmpegInstalled && (
                    <div className="mb-4 bg-yellow-100 text-yellow-800 p-4 rounded-md flex items-start">
                        <FaExclamationTriangle className="mr-3 text-xl flex-shrink-0 mt-1" />
                        <div>
                            <h4 className="text-lg font-bold mb-1">FFmpeg Not Installed</h4>
                            <p className="mb-0">The server cannot process videos without FFmpeg. Please install FFmpeg at: C:\FFmpeg\bin\ffmpeg.exe</p>
                        </div>
                    </div>
                )}
                
                {renderAlert()}
                
                <form onSubmit={handleSubmit}>
                    <div 
                        className={`border-2 border-dashed rounded-lg p-8 mb-4 text-center transition-all ${
                            dragActive 
                                ? 'border-blue-600 bg-blue-50 scale-[1.01] shadow-md' 
                                : 'border-blue-300 bg-blue-50/30'
                        } ${!serverStatus.online ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                        onDragEnter={handleDrag}
                        onDragOver={handleDrag}
                        onDragLeave={handleDrag}
                        onDrop={handleDrop}
                    >
                        <div className="flex flex-col items-center">
                            <div className="w-20 h-20 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
                                <FaCloudUploadAlt size={40} />
                            </div>
                            <p className="text-lg font-semibold mb-1">Drag and drop video here</p>
                            <p className="text-gray-500 mb-3">or</p>
                            <input 
                                type="file" 
                                className="opacity-0 absolute inset-0 w-0 h-0" 
                                ref={fileRef} 
                                onChange={handleFileChange}
                                disabled={isUploading || !serverStatus.online}
                                accept=".mp4,.mkv"
                            />
                            <button
                                type="button"
                                onClick={() => fileRef.current.click()}
                                disabled={isUploading || !serverStatus.online}
                                className={`px-4 py-2 rounded-full ${
                                    !serverStatus.online 
                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                                        : 'bg-blue-600 text-white hover:bg-blue-700'
                                } transition-colors`}
                            >
                                Browse Files
                            </button>
                            <p className="text-sm text-gray-500 mt-4 max-w-md">
                                Accepted formats: MP4, MKV. Maximum file size: 500MB
                            </p>
                        </div>
                    </div>
                    
                    {file && (
                        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mb-4 flex items-center">
                            <FaFile className="text-blue-600 mr-3" size={20} />
                            <span className="font-medium">{file.name}</span>
                            <span className="ml-2 text-sm text-gray-500">
                                ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                            </span>
                        </div>
                    )}
                    
                    {isUploading && (
                        <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
                            <div className="mb-2 flex justify-between items-center">
                                <span className="font-medium">Uploading...</span>
                                <span>{uploadProgress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                                    style={{ width: `${uploadProgress}%` }}
                                ></div>
                            </div>
                        </div>
                    )}
                    
                    <div className="text-center mt-5">
                        <button
                            type="submit"
                            disabled={isUploadDisabled}
                            className={`px-5 py-2 rounded-full font-medium ${
                                isUploadDisabled
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-blue-600 text-white hover:bg-blue-700 hover:-translate-y-1 transition-all'
                            }`}
                        >
                            {isUploading ? (
                                <span className="flex items-center">
                                    <FaSpinner className="animate-spin mr-2" size={16} /> 
                                    Processing...
                                </span>
                            ) : file ? (
                                <span className="flex items-center justify-center">
                                    <FaCloudUploadAlt className="mr-2" size={16} /> 
                                    Upload Video
                                </span>
                            ) : (
                                <span>Select a file to upload</span>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default VideoUploadForm;