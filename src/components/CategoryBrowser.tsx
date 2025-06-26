import React from 'react';

// Placeholder CategoryBrowser component
// This prevents import errors in AdminPanel

interface CategoryBrowserProps {
  onTemplateSelect?: (template: any) => void;
}

const CategoryBrowser: React.FC<CategoryBrowserProps> = ({ onTemplateSelect }) => {
  return (
    <div className="bg-gradient-to-br from-gray-900/30 to-gray-800/30 backdrop-blur-sm border border-gray-700/20 rounded-2xl p-6">
      <div className="text-center">
        <div className="text-4xl mb-4 opacity-50">📋</div>
        <h3 className="text-xl font-bold text-white mb-2">Template Browser</h3>
        <p className="text-gray-400 mb-4">
          Template browsing functionality is not yet implemented.
        </p>
        <p className="text-sm text-gray-500">
          This is a placeholder component to prevent import errors.
        </p>
        {onTemplateSelect && (
          <button
            onClick={() => onTemplateSelect?.({})}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Test Template Selection
          </button>
        )}
      </div>
    </div>
  );
};

export default CategoryBrowser; 