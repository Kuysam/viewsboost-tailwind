import React, { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';
import { Download, Grid, Settings, Heart } from 'lucide-react';
import { useEditorStore } from '../store/editorStore';
import TemplatesPanel from '../components/Sidebar/TemplatesPanel';
import TextPanel from '../components/Sidebar/TextPanel';
import ShapesPanel from '../components/Sidebar/ShapesPanel';
import LayersPanel from '../components/Sidebar/LayersPanel';

const TABS = [
  { key: "templates", label: "Templates", icon: "🎨" },
  { key: "uploads", label: "Uploads", icon: "📤" },
  { key: "text", label: "Text", icon: "🔤" },
  { key: "shapes", label: "Shapes", icon: "🟦" },
  { key: "colors", label: "Colors", icon: "🎨" },
  { key: "layers", label: "Layers", icon: "📋" }
];

export default function Studio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeTab, setActiveTab] = useState("templates");
  
  const { 
    canvas, 
    setCanvas, 
    canvasSize, 
    setCanvasSize,
    zoom,
    setZoom,
    showGrid,
    toggleGrid 
  } = useEditorStore();

  // Initialize Fabric canvas
  useEffect(() => {
    if (canvasRef.current && !canvas) {
      const fabricCanvas = new fabric.Canvas(canvasRef.current, {
        width: canvasSize.width,
        height: canvasSize.height,
        backgroundColor: "#ffffff",
        selection: true,
      });

      // Set up canvas event listeners
      fabricCanvas.on('object:added', () => {
        console.log('Object added to canvas');
      });

      fabricCanvas.on('object:selected', (e) => {
        console.log('Object selected:', e.target);
      });

      fabricCanvas.on('selection:cleared', () => {
        console.log('Selection cleared');
      });

      setCanvas(fabricCanvas);

      // Cleanup on unmount
      return () => {
        fabricCanvas.dispose();
      };
    }
  }, [canvas, canvasSize, setCanvas]);

  // Handle canvas resize
  useEffect(() => {
    if (canvas) {
      canvas.setDimensions(canvasSize);
      canvas.renderAll();
    }
  }, [canvas, canvasSize]);

  // Handle zoom changes
  useEffect(() => {
    if (canvas) {
      canvas.setZoom(zoom);
      canvas.renderAll();
    }
  }, [canvas, zoom]);

  const handleExport = () => {
    if (!canvas) return;
    const dataUrl = canvas.toDataURL({ format: "png" });
    const link = document.createElement("a");
    link.download = "viewsboost-design.png";
    link.href = dataUrl;
    link.click();
  };

  const renderSidebarContent = () => {
    switch (activeTab) {
      case "templates":
        return <TemplatesPanel />;
      case "text":
        return <TextPanel />;
      case "shapes":
        return <ShapesPanel />;
      case "layers":
        return <LayersPanel />;
      case "uploads":
        return (
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-4">Uploads</h3>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <p className="text-gray-500">Drag and drop files here</p>
              <p className="text-sm text-gray-400 mt-2">or click to browse</p>
            </div>
          </div>
        );
      case "colors":
        return (
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-4">Colors</h3>
            <div className="grid grid-cols-6 gap-2">
              {['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'].map((color) => (
                <button
                  key={color}
                  className="aspect-square rounded border-2 border-gray-200 hover:border-gray-400"
                  style={{ backgroundColor: color }}
                  onClick={() => {
                    if (canvas) {
                      const activeObject = canvas.getActiveObject();
                      if (activeObject) {
                        activeObject.set('fill', color);
                        canvas.renderAll();
                      }
                    }
                  }}
                />
              ))}
            </div>
          </div>
        );
      default:
        return (
          <div className="p-4 text-center text-gray-500">
            <p>Select a tool to get started</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Single Header */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">V</span>
            </div>
            <span className="font-bold text-gray-800">ViewsBoost Studio</span>
          </div>
          <div className="text-gray-400">|</div>
          <span className="text-gray-600">Canvas Editor</span>
          <span className="text-sm text-gray-500">{canvasSize.width} × {canvasSize.height}</span>
          <button 
            className="text-sm text-blue-600 hover:text-blue-700"
            onClick={() => setCanvasSize({ width: 1920, height: 1080 })}
          >
            Resize
          </button>
        </div>
        <div className="flex items-center gap-3">
          <button
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              showGrid ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            onClick={toggleGrid}
          >
            <Grid size={16} className="inline mr-1" />
            Grid
          </button>
          
          <button 
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200 font-medium flex items-center gap-2"
            onClick={handleExport}
          >
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      {/* Left Sidebar */}
      <div className="w-20 bg-gradient-to-b from-gray-50 to-white border-r border-gray-200 flex flex-col items-center py-6 gap-3 mt-16 fixed left-0 top-0 bottom-0 shadow-sm">
        {TABS.map((tab) => (
          <div key={tab.key} className="relative group">
            <button
              onClick={() => setActiveTab(tab.key)}
              className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-300 transform hover:scale-105 text-2xl ${
                activeTab === tab.key
                  ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25"
                  : "text-gray-600 hover:bg-white hover:text-gray-800 hover:shadow-md"
              }`}
              title={tab.label}
            >
              {tab.icon}
            </button>
            {/* Tooltip */}
            <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-gray-800 text-white px-2 py-1 rounded text-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
              {tab.label}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-800 rotate-45"></div>
            </div>
          </div>
        ))}
        
        {/* Sidebar Footer */}
        <div className="mt-auto pt-4 border-t border-gray-200 w-full flex flex-col items-center gap-3">
          <button 
            className="w-10 h-10 rounded-lg bg-gradient-to-r from-green-400 to-emerald-500 text-white flex items-center justify-center hover:shadow-lg hover:scale-105 transition-all duration-200"
            title="Settings"
          >
            <Settings size={20} />
          </button>
          <button 
            className="w-10 h-10 rounded-lg bg-gradient-to-r from-pink-400 to-rose-500 text-white flex items-center justify-center hover:shadow-lg hover:scale-105 transition-all duration-200"
            title="Help"
          >
            <Heart size={20} />
          </button>
        </div>
      </div>

      {/* Secondary Sidebar */}
      <div className="w-80 bg-white border-r border-gray-100 ml-20 mt-16 fixed left-20 top-0 bottom-0 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-xl text-gray-800 capitalize flex items-center gap-2">
              <span className="text-2xl">{TABS.find(t => t.key === activeTab)?.icon}</span>
              {activeTab}
            </h2>
          </div>
        </div>
        
        <div className="p-6 h-full overflow-y-auto">
          {renderSidebarContent()}
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 ml-[400px] mt-16 p-8 flex items-center justify-center bg-gray-100">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
          {showGrid && (
            <div className="absolute inset-0 pointer-events-none" style={{
              backgroundImage: `
                linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
              `,
              backgroundSize: '20px 20px'
            }} />
          )}
          <canvas 
            ref={canvasRef} 
            className="block"
            style={{ 
              maxWidth: '100%',
              maxHeight: 'calc(100vh - 200px)',
            }}
          />
        </div>
      </div>
    </div>
  );
}