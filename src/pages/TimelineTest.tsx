import React from 'react';
import { ProfessionalTimeline } from '../components/ProfessionalTimeline';
import { TimelineClip } from '../services/TimelineEngine';

const TimelineTest: React.FC = () => {
  const handleClipSelect = (clip: TimelineClip) => {
    console.log('Clip selected:', clip);
  };

  const handleClipMove = (clip: TimelineClip, newStartTime: number, newTrackIndex: number) => {
    console.log('Clip moved:', { clip: clip.title, newStartTime, newTrackIndex });
  };

  const handleClipResize = (clip: TimelineClip, newDuration: number) => {
    console.log('Clip resized:', { clip: clip.title, newDuration });
  };

  const handlePlayheadMove = (time: number) => {
    console.log('Playhead moved to:', time);
  };

  return (
    <div className="min-h-screen bg-gray-950 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            🎬 Professional Timeline Demo
          </h1>
          <p className="text-gray-400 text-lg max-w-3xl">
            GPU-accelerated timeline powered by PixiJS. Features drag & drop clips, 
            precise playhead control, zoom functionality, and professional editing tools.
          </p>
        </div>

        {/* Features List */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-white mb-3">🚀 GPU Accelerated</h3>
            <p className="text-gray-400">
              Built with PixiJS for smooth 60fps rendering and responsive interactions
            </p>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-white mb-3">🎯 Professional Tools</h3>
            <p className="text-gray-400">
              Cut, copy, split, and manipulate clips with precision like CapCut and Adobe Express
            </p>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-white mb-3">📱 Multi-Track</h3>
            <p className="text-gray-400">
              Separate tracks for video, audio, and graphics with visual indicators
            </p>
          </div>
        </div>

        {/* Timeline Component */}
        <div className="bg-gray-900 rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-white mb-4">Interactive Timeline</h2>
          
          <div className="mb-4 text-gray-400 text-sm">
            <strong>Try these interactions:</strong>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Click on clips to select them</li>
              <li>Drag clips to move them between tracks or time positions</li>
              <li>Use the playhead to scrub through the timeline</li>
              <li>Zoom in/out for precise editing</li>
              <li>Use the split tool to cut clips at the playhead position</li>
            </ul>
          </div>

          <ProfessionalTimeline
            onClipSelect={handleClipSelect}
            onClipMove={handleClipMove}
            onClipResize={handleClipResize}
            onPlayheadMove={handlePlayheadMove}
            className="shadow-2xl"
          />
        </div>

        {/* Technical Details */}
        <div className="mt-8 bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Technical Implementation</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-400">
            <div>
              <h4 className="font-semibold text-white mb-2">Rendering Engine</h4>
              <ul className="space-y-1 text-sm">
                <li>• PixiJS WebGL renderer</li>
                <li>• 60fps smooth animations</li>
                <li>• GPU-accelerated graphics</li>
                <li>• Responsive canvas sizing</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-2">Interaction System</h4>
              <ul className="space-y-1 text-sm">
                <li>• Pointer-based drag & drop</li>
                <li>• Multi-selection support</li>
                <li>• Real-time collision detection</li>
                <li>• Smooth snapping</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Integration Note */}
        <div className="mt-8 bg-blue-900/20 border border-blue-500/30 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-blue-300 mb-2">
            🔗 Ready for ViewsBoost Integration
          </h3>
          <p className="text-blue-200 mb-4">
            This timeline is ready to be integrated into your Studio component, 
            providing professional video editing capabilities that match industry standards.
          </p>
          <div className="text-blue-300 text-sm">
            <strong>Next steps:</strong> Integrate with video templates, add thumbnail generation, 
            and connect to your existing FFmpeg processing pipeline.
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimelineTest; 