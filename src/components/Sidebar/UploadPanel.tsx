import React, { useRef } from 'react';
import { Upload, Image, FileVideo } from 'lucide-react';

interface UploadPanelProps {
  canvas: fabric.Canvas | null;
  onUpload: (files: FileList) => void;
}

export function UploadPanel({ canvas, onUpload }: UploadPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      onUpload(files);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Upload</h3>
        <Upload className="w-5 h-5 text-gray-600" />
      </div>

      {/* Upload Button */}
      <div className="space-y-4">
        <button
          onClick={handleUploadClick}
          className="w-full p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors flex flex-col items-center justify-center space-y-2"
        >
          <Upload className="w-8 h-8 text-gray-400" />
          <span className="text-gray-600 font-medium">Upload Files</span>
          <span className="text-sm text-gray-500">Images and videos</span>
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Supported Formats */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Supported Formats</h4>
          
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Image className="w-4 h-4" />
            <span>Images: JPG, PNG, GIF, WebP</span>
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <FileVideo className="w-4 h-4" />
            <span>Videos: MP4, WebM</span>
          </div>
        </div>

        {/* Tips */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <h4 className="text-sm font-medium text-blue-800 mb-1">Tips</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Maximum file size: 10MB</li>
            <li>• Images will be automatically resized</li>
            <li>• Videos will be converted to canvas objects</li>
          </ul>
        </div>
      </div>
    </div>
  );
}