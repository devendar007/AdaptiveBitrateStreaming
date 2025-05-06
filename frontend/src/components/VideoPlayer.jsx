import React, { useRef, useEffect, useState } from "react";
import videojs from "video.js";
import "video.js/dist/video-js.css";
import "videojs-contrib-quality-levels";
import "videojs-http-source-selector";

export const VideoPlayer = (props) => {
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const { videoSource } = props;
  const [error, setError] = useState('');

  const videoPlayerOptions = {
    fluid: true,
    responsive: true,
    controls: true,
    playbackRates: [0.5, 1, 1.5, 2],
    preload: 'auto',
    controlBar: {
      playToggle: true,
      captionsButton: false,
      chaptersButton: false,
      subtitlesButton: false,
      remainingTimeDisplay: true,
      progressControl: {
        seekBar: true
      },
      volumePanel: {
        inline: false
      },
      pictureInPictureToggle: true,
      fullscreenToggle: true
    },
    plugins: {
      httpSourceSelector: { default: 'auto' }
    },
    sources: [
      {
        src: videoSource,
        type: "application/x-mpegURL"
      }
    ]
  };

  const handlePlayerReady = (player) => {
    playerRef.current = player;

    player.on("waiting", () => {
      console.log("player is waiting");
    });

    player.on("dispose", () => {
      console.log("player will dispose");
    });
    
    player.on("error", (error) => {
      console.error("Video.js Error:", error);
      setError('Error loading video. Please try again later.');
    });
    
    // Add autoplay failure handling
    player.on('autoplay-failure', () => {
      console.info('Autoplay failed - muting and trying again');
      player.muted(true);
      player.play();
    });
  };

  useEffect(() => {
    // Clear any error when source changes
    setError('');
    
    // Make sure Video.js player is only initialized once
    if (!playerRef.current) {
      // The Video.js player needs to be _inside_ the component el for React 18 Strict Mode.
      const videoElement = document.createElement("video-js");

      videoElement.classList.add("vjs-big-play-centered", "vjs-custom-theme");
      videoRef.current.appendChild(videoElement);

      try {
        const player = (playerRef.current = videojs(videoElement, videoPlayerOptions, () => {
          console.log("player is ready");
          handlePlayerReady && handlePlayerReady(player);
        }));
      } catch (err) {
        console.error("VideoJS initialization error:", err);
        setError('Failed to initialize video player');
      }
    } else {
      const player = playerRef.current;

      player.src(videoPlayerOptions.sources);
    }
  }, [videoSource, videoPlayerOptions, videoRef]);

  // Dispose the Video.js player when the functional component unmounts
  useEffect(() => {
    const player = playerRef.current;

    return () => {
      if (player && !player.isDisposed()) {
        player.dispose();
        playerRef.current = null;
      }
    };
  }, [playerRef]);

  return (
    <div className="w-full h-full">
      {error ? (
        <div className="bg-red-100 border border-red-400 text-red-800 px-4 py-3 rounded m-2" role="alert">
          <p>{error}</p>
        </div>
      ) : (
        <div data-vjs-player>
          <div ref={videoRef} className="relative overflow-hidden rounded-lg bg-black shadow-lg" />
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;