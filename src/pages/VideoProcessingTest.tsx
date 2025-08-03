import React from 'react';
import { VideoProcessingDemo } from '../components/VideoProcessingDemo';

const VideoProcessingTest: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-white mb-8 text-center">
          🎬 FFmpeg Video Processing Test
        </h1>
        <VideoProcessingDemo />
      </div>
    </div>
  );
};

export default VideoProcessingTest; 