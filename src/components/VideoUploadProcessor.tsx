import React from 'react';

// Placeholder VideoUploadProcessor component
// This prevents import errors in AdminPanel

const VideoUploadProcessor: React.FC = () => {
  return (
    <div className="bg-gradient-to-br from-gray-900/30 to-gray-800/30 backdrop-blur-sm border border-gray-700/20 rounded-2xl p-6">
      <div className="text-center">
        <div className="text-4xl mb-4 opacity-50">🎬</div>
        <h3 className="text-xl font-bold text-white mb-2">Video Upload Processor</h3>
        <p className="text-gray-400 mb-4">
          Video processing functionality is not yet implemented.
        </p>
        <p className="text-sm text-gray-500">
          This is a placeholder component to prevent import errors.
        </p>
      </div>
    </div>
  );
};

export default VideoUploadProcessor; 