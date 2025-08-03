import React, { useRef, useState, useCallback, useEffect } from 'react';
import { TransformWrapper, TransformComponent, ReactZoomPanPinchRef } from 'react-zoom-pan-pinch';
import { ZoomIn, ZoomOut, Maximize2, RotateCcw, Grid as GridIcon, Eye } from 'lucide-react';

interface InfiniteCanvasProps {
  children: React.ReactNode;
  initialScale?: number;
  minScale?: number;
  maxScale?: number;
  showGrid?: boolean;
  showMinimap?: boolean;
  onTransformChange?: (scale: number, positionX: number, positionY: number) => void;
  className?: string;
}

interface GridProps {
  scale: number;
  positionX: number;
  positionY: number;
  gridSize?: number;
  visible?: boolean;
}

function Grid({ scale, positionX, positionY, gridSize = 20, visible = true }: GridProps) {
  if (!visible) return null;

  const adjustedGridSize = gridSize * scale;
  const opacity = Math.max(0.1, Math.min(0.4, scale * 0.3));

  // Calculate grid offset based on pan position
  const offsetX = positionX % adjustedGridSize;
  const offsetY = positionY % adjustedGridSize;

  return (
    <div 
      className="absolute inset-0 pointer-events-none"
      style={{
        backgroundImage: `
          linear-gradient(to right, rgba(255,255,255,${opacity}) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(255,255,255,${opacity}) 1px, transparent 1px)
        `,
        backgroundSize: `${adjustedGridSize}px ${adjustedGridSize}px`,
        backgroundPosition: `${offsetX}px ${offsetY}px`,
      }}
    />
  );
}

interface MinimapProps {
  scale: number;
  positionX: number;
  positionY: number;
  canvasWidth: number;
  canvasHeight: number;
  viewportWidth: number;
  viewportHeight: number;
  onMinimapClick: (x: number, y: number) => void;
}

function Minimap({
  scale,
  positionX,
  positionY,
  canvasWidth,
  canvasHeight,
  viewportWidth,
  viewportHeight,
  onMinimapClick,
}: MinimapProps) {
  const minimapSize = 200;
  const aspectRatio = canvasWidth / canvasHeight;
  const minimapWidth = minimapSize;
  const minimapHeight = minimapSize / aspectRatio;

  // Calculate viewport rectangle on minimap
  const viewportScaleX = minimapWidth / canvasWidth;
  const viewportScaleY = minimapHeight / canvasHeight;
  
  const viewportRectWidth = (viewportWidth / scale) * viewportScaleX;
  const viewportRectHeight = (viewportHeight / scale) * viewportScaleY;
  const viewportRectX = (-positionX / scale) * viewportScaleX;
  const viewportRectY = (-positionY / scale) * viewportScaleY;

  const handleMinimapClick = (event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const canvasX = (x / minimapWidth) * canvasWidth;
    const canvasY = (y / minimapHeight) * canvasHeight;
    
    onMinimapClick(canvasX, canvasY);
  };

  return (
    <div className="absolute bottom-4 right-4 bg-gray-800/90 backdrop-blur-sm rounded-lg border border-gray-600 p-2 z-50">
      <div className="text-white text-xs mb-2 font-medium">Minimap</div>
      <div
        className="relative bg-gray-700 rounded cursor-pointer"
        style={{ width: minimapWidth, height: minimapHeight }}
        onClick={handleMinimapClick}
      >
        {/* Canvas representation */}
        <div className="absolute inset-0 bg-gray-600 rounded" />
        
        {/* Viewport indicator */}
        <div
          className="absolute border-2 border-blue-400 bg-blue-400/20 rounded"
          style={{
            left: Math.max(0, Math.min(minimapWidth - viewportRectWidth, viewportRectX)),
            top: Math.max(0, Math.min(minimapHeight - viewportRectHeight, viewportRectY)),
            width: Math.min(viewportRectWidth, minimapWidth),
            height: Math.min(viewportRectHeight, minimapHeight),
          }}
        />
      </div>
      
      <div className="text-white text-xs mt-2 space-y-1">
        <div>Zoom: {Math.round(scale * 100)}%</div>
        <div>X: {Math.round(positionX)}</div>
        <div>Y: {Math.round(positionY)}</div>
      </div>
    </div>
  );
}

export function InfiniteCanvas({
  children,
  initialScale = 1,
  minScale = 0.1,
  maxScale = 5,
  showGrid = true,
  showMinimap = false,
  onTransformChange,
  className = '',
}: InfiniteCanvasProps) {
  const transformRef = useRef<ReactZoomPanPinchRef>(null);
  const [isGridVisible, setIsGridVisible] = useState(showGrid);
  const [isMinimapVisible, setIsMinimapVisible] = useState(showMinimap);
  const [transformState, setTransformState] = useState({
    scale: initialScale,
    positionX: 0,
    positionY: 0,
  });

  const handleTransform = useCallback((ref: ReactZoomPanPinchRef) => {
    const { scale, positionX, positionY } = ref.state;
    setTransformState({ scale, positionX, positionY });
    onTransformChange?.(scale, positionX, positionY);
  }, [onTransformChange]);

  const zoomIn = useCallback(() => {
    transformRef.current?.zoomIn(0.5);
  }, []);

  const zoomOut = useCallback(() => {
    transformRef.current?.zoomOut(0.5);
  }, []);

  const resetTransform = useCallback(() => {
    transformRef.current?.resetTransform();
  }, []);

  const fitToScreen = useCallback(() => {
    transformRef.current?.centerView(initialScale);
  }, [initialScale]);

  const handleMinimapClick = useCallback((x: number, y: number) => {
    if (transformRef.current) {
      const { scale } = transformRef.current.state;
      transformRef.current.setTransform(
        -x * scale + window.innerWidth / 2,
        -y * scale + window.innerHeight / 2,
        scale
      );
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (event.code) {
        case 'Equal':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            zoomIn();
          }
          break;
        case 'Minus':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            zoomOut();
          }
          break;
        case 'Digit0':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            resetTransform();
          }
          break;
        case 'Digit1':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            fitToScreen();
          }
          break;
        case 'KeyG':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            setIsGridVisible(prev => !prev);
          }
          break;
        case 'KeyM':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            setIsMinimapVisible(prev => !prev);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [zoomIn, zoomOut, resetTransform, fitToScreen]);

  return (
    <div className={`relative w-full h-full overflow-hidden bg-gray-900 ${className}`}>
      {/* Canvas Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-50">
        <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg border border-gray-600 p-2">
          <div className="flex flex-col gap-1">
            <button
              onClick={zoomIn}
              className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded transition"
              title="Zoom In (Ctrl/Cmd + +)"
            >
              <ZoomIn size={18} />
            </button>
            <button
              onClick={zoomOut}
              className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded transition"
              title="Zoom Out (Ctrl/Cmd + -)"
            >
              <ZoomOut size={18} />
            </button>
            <button
              onClick={fitToScreen}
              className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded transition"
              title="Fit to Screen (Ctrl/Cmd + 1)"
            >
              <Maximize2 size={18} />
            </button>
            <button
              onClick={resetTransform}
              className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded transition"
              title="Reset View (Ctrl/Cmd + 0)"
            >
              <RotateCcw size={18} />
            </button>
          </div>
        </div>

        <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg border border-gray-600 p-2">
          <div className="flex flex-col gap-1">
            <button
              onClick={() => setIsGridVisible(!isGridVisible)}
              className={`p-2 rounded transition ${
                isGridVisible
                  ? 'text-blue-400 bg-blue-400/20'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700'
              }`}
              title="Toggle Grid (Ctrl/Cmd + G)"
            >
              <GridIcon size={18} />
            </button>
            <button
              onClick={() => setIsMinimapVisible(!isMinimapVisible)}
              className={`p-2 rounded transition ${
                isMinimapVisible
                  ? 'text-blue-400 bg-blue-400/20'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700'
              }`}
              title="Toggle Minimap (Ctrl/Cmd + M)"
            >
              <Eye size={18} />
            </button>
          </div>
        </div>

        {/* Zoom Level Display */}
        <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg border border-gray-600 px-3 py-2">
          <div className="text-white text-sm font-mono">
            {Math.round(transformState.scale * 100)}%
          </div>
        </div>
      </div>

      {/* Transform Wrapper */}
      <TransformWrapper
        ref={transformRef}
        initialScale={initialScale}
        minScale={minScale}
        maxScale={maxScale}
        centerOnInit
        wheel={{ step: 0.1 }}
        pinch={{ step: 5 }}
        doubleClick={{ disabled: false, step: 0.7 }}
        onTransformed={handleTransform}
        limitToBounds={false}
        centerZoomedOut={false}
        disablePadding
      >
        <TransformComponent
          wrapperClass="w-full h-full"
          contentClass="w-full h-full"
        >
          <div className="relative w-full h-full">
            {/* Grid */}
            <Grid
              scale={transformState.scale}
              positionX={transformState.positionX}
              positionY={transformState.positionY}
              visible={isGridVisible}
            />
            
            {/* Canvas Content */}
            <div className="relative w-full h-full">
              {children}
            </div>
          </div>
        </TransformComponent>
      </TransformWrapper>

      {/* Minimap */}
      {isMinimapVisible && (
        <Minimap
          scale={transformState.scale}
          positionX={transformState.positionX}
          positionY={transformState.positionY}
          canvasWidth={2000} // Default canvas size
          canvasHeight={2000}
          viewportWidth={window.innerWidth}
          viewportHeight={window.innerHeight}
          onMinimapClick={handleMinimapClick}
        />
      )}

      {/* Instructions */}
      <div className="absolute bottom-4 left-4 bg-gray-800/90 backdrop-blur-sm rounded-lg border border-gray-600 p-3 z-50">
        <div className="text-white text-sm space-y-1">
          <div className="font-medium mb-2">Controls:</div>
          <div className="text-gray-300 text-xs space-y-1">
            <div>• Scroll to zoom</div>
            <div>• Drag to pan</div>
            <div>• Double-click to zoom</div>
            <div>• Pinch to zoom (touch)</div>
          </div>
        </div>
      </div>
    </div>
  );
}