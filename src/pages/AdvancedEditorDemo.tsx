import React from 'react';
import AdvancedEditor from '../components/AdvancedEditor';
import { Toaster } from 'react-hot-toast';

const AdvancedEditorDemo: React.FC = () => {
  const handleSave = (dataURL: string) => {
    console.log('Canvas saved:', dataURL);
  };

  return (
    <div className="w-full h-screen">
      <Toaster position="top-right" />
      <AdvancedEditor
        width={1200}
        height={800}
        backgroundColor="#ffffff"
        onSave={handleSave}
        enableAI={true}
        enableAudio={true}
        enableCollaboration={true}
      />
    </div>
  );
};

export default AdvancedEditorDemo; 