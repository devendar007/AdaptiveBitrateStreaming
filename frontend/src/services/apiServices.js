import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Function to check server status and FFmpeg installation
export const checkServerStatus = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/status`, { 
            timeout: 3000 
        });
        
        return {
            online: true,
            ffmpegInstalled: response.data.ffmpegInstalled,
            message: response.data.message
        };
    } catch (error) {
        console.error('Error checking server status:', error);
        return {
            online: false,
            ffmpegInstalled: false,
            message: 'Unable to connect to the server. Make sure the backend is running.'
        };
    }
};

export const uploadFile = async (file, progressCallback) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await axios.post(`${API_BASE_URL}/upload`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            onUploadProgress: (progressEvent) => {
                if (progressCallback) {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    progressCallback(percentCompleted);
                }
            }
        });

        if (response.status === 200) {
            return response.data;
        } else {
            console.error('Upload failed with status:', response.status);
            return null;
        }
    } catch(error) {
        console.error('Error uploading video file: ', error);
        throw error;
    }
}

export const getVideosSourceList = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/videos`, { 
            timeout: 5000  // Add a timeout to fail fast if server is not responding
        });

        if (response.status === 200) {
            // Return both the URLs array and the full video data
            return {
                urls: response.data.videoUrls || [],
                data: response.data.videosData || []
            };
        } else {
            console.error('Failed to fetch videos');
            return { urls: [], data: [] };
        }
    } catch(error) {
        console.error('Error fetching videos: ', error);
        
        // Return empty array but log the specific error for debugging
        if (error.code === 'ECONNABORTED') {
            console.error('Request timed out. The server might be slow or offline.');
        } else if (error.code === 'ERR_NETWORK') {
            console.error('Network error. The server might be offline.');
        }
        
        return { urls: [], data: [] };
    }
}