import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Trash2, RotateCcw, RotateCw, Copy, Lock, Unlock, Eye, EyeOff, ZoomIn, ZoomOut, Move, MoreHorizontal, Edit3, Type, Palette, Sparkles } from 'lucide-react';
import { TextElement, TextPreset } from '../types/textPresets';
import FloatingTextToolbar from './FloatingTextToolbar';

interface TextElementEditorProps {
  element: TextElement;
  onUpdate: (element: TextElement) => void;
  onDelete: (elementId: string) => void;
  onDuplicate: (element: TextElement) => void;
  isSelected: boolean;
  onSelect: (elementId: string) => void;
  canvasSize: { width: number; height: number };
  zoom: number;
  onStartEdit: (elementId: string) => void;
  onEndEdit: () => void;
  showHandles?: boolean;
}

const TextElementEditor: React.FC<TextElementEditorProps> = ({
  element,
  onUpdate,
  onDelete,
  onDuplicate,
  isSelected,
  onSelect,
  canvasSize,
  zoom,
  onStartEdit,
  onEndEdit,
  showHandles = true
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string>('');
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [elementStart, setElementStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });
  const [tempText, setTempText] = useState(element.text);
  const [toolbarPosition, setToolbarPosition] = useState({ x: 0, y: 0 });
  const [isRotating, setIsRotating] = useState(false);
  const [rotationStart, setRotationStart] = useState({ angle: 0, centerX: 0, centerY: 0 });
  
  const elementRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  // Handle clicking on the element
  const handleElementClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isSelected) {
      onSelect(element.id);
    } else if (!element.locked && !element.isEditing) {
      // If already selected and not locked, start editing on single click
      onStartEdit(element.id);
    }
  };

  // Handle double-click to edit text (keeping for backward compatibility)
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!element.locked) {
      onStartEdit(element.id);
    }
  };

  // Handle text editing
  const handleTextChange = (e: React.ChangeEvent<HTMLDivElement>) => {
    const newText = e.currentTarget.textContent || '';
    setTempText(newText);
    
    // Auto-resize text box based on content
    if (textRef.current) {
      const textElement = textRef.current;
      const computedStyle = window.getComputedStyle(textElement);
      const fontSize = parseInt(computedStyle.fontSize);
      const lineHeight = parseFloat(computedStyle.lineHeight) || fontSize * 1.2;
      
      // Calculate approximate text dimensions
      const lines = newText.split('\n').length;
      const maxLineLength = Math.max(...newText.split('\n').map(line => line.length));
      const charWidth = fontSize * 0.6; // Rough estimate
      
      const newWidth = Math.max(100, Math.min(600, maxLineLength * charWidth + 20));
      const newHeight = Math.max(40, lines * lineHeight + 20);
      
      // Update element dimensions if significantly different
      if (Math.abs(newWidth - element.size.width) > 10 || Math.abs(newHeight - element.size.height) > 10) {
        onUpdate({
          ...element,
          text: newText,
          size: { width: newWidth, height: newHeight },
          updatedAt: new Date()
        });
      }
    }
  };

  const handleTextBlur = () => {
    onUpdate({
      ...element,
      text: tempText,
      updatedAt: new Date()
    });
    onEndEdit();
  };

  const handleTextKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleTextBlur();
    }
    if (e.key === 'Escape') {
      setTempText(element.text);
      onEndEdit();
    }
    
    // Handle keyboard shortcuts for formatting
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault();
          handleBoldToggle();
          break;
        case 'i':
          e.preventDefault();
          handleItalicToggle();
          break;
        case 'u':
          e.preventDefault();
          handleUnderlineToggle();
          break;
        case 'l':
          e.preventDefault();
          handleAlignmentToggle('left');
          break;
        case 'e':
          e.preventDefault();
          handleAlignmentToggle('center');
          break;
        case 'r':
          e.preventDefault();
          handleAlignmentToggle('right');
          break;
      }
    }
  };

  // Auto-focus text element when editing starts
  useEffect(() => {
    if (element.isEditing && textRef.current) {
      textRef.current.focus();
      // Select all text for easier editing
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(textRef.current);
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
  }, [element.isEditing]);

  // Update toolbar position when element is selected or moved
  useEffect(() => {
    if (isSelected && elementRef.current) {
      const rect = elementRef.current.getBoundingClientRect();
      setToolbarPosition({
        x: rect.left + rect.width / 2,
        y: rect.top
      });
    }
  }, [isSelected, element.position, element.size]);

  // Keyboard shortcut handlers
  const handleBoldToggle = () => {
    const currentWeight = element.style.fontWeight || 'normal';
    const newWeight = currentWeight === 'bold' ? 'normal' : 'bold';
    onUpdate({
      ...element,
      style: { ...element.style, fontWeight: newWeight },
      updatedAt: new Date()
    });
  };

  const handleItalicToggle = () => {
    const currentStyle = element.style.fontStyle || 'normal';
    const newStyle = currentStyle === 'italic' ? 'normal' : 'italic';
    onUpdate({
      ...element,
      style: { ...element.style, fontStyle: newStyle },
      updatedAt: new Date()
    });
  };

  const handleUnderlineToggle = () => {
    const currentDecoration = element.style.textDecoration || 'none';
    const newDecoration = currentDecoration === 'underline' ? 'none' : 'underline';
    onUpdate({
      ...element,
      style: { ...element.style, textDecoration: newDecoration },
      updatedAt: new Date()
    });
  };

  const handleAlignmentToggle = (align: 'left' | 'center' | 'right') => {
    onUpdate({
      ...element,
      style: { ...element.style, textAlign: align },
      updatedAt: new Date()
    });
  };

  // Handle drag start
  const handleMouseDown = (e: React.MouseEvent) => {
    if (element.locked || element.isEditing) return;
    
    // Don't start dragging if clicking on text content during editing
    if (element.isEditing && textRef.current?.contains(e.target as Node)) {
      return;
    }
    
    e.stopPropagation();
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setElementStart({ 
      x: element.position.x, 
      y: element.position.y, 
      width: element.size.width, 
      height: element.size.height 
    });
    onSelect(element.id);
  };

  // Handle resize start
  const handleResizeStart = (e: React.MouseEvent, handle: string) => {
    if (element.locked) return;
    
    e.stopPropagation();
    setIsResizing(true);
    setResizeHandle(handle);
    setDragStart({ x: e.clientX, y: e.clientY });
    setElementStart({ 
      x: element.position.x, 
      y: element.position.y, 
      width: element.size.width, 
      height: element.size.height 
    });
  };

  // Handle rotation start
  const handleRotateStart = (e: React.MouseEvent) => {
    if (element.locked) return;
    
    e.stopPropagation();
    setIsRotating(true);
    
    const rect = elementRef.current?.getBoundingClientRect();
    if (rect) {
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      setRotationStart({ 
        angle: element.rotation, 
        centerX, 
        centerY 
      });
    }
  };

  // Handle mouse move
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      const deltaX = (e.clientX - dragStart.x) / zoom;
      const deltaY = (e.clientY - dragStart.y) / zoom;
      
      const newX = Math.max(0, Math.min(canvasSize.width - element.size.width, elementStart.x + deltaX));
      const newY = Math.max(0, Math.min(canvasSize.height - element.size.height, elementStart.y + deltaY));
      
      onUpdate({
        ...element,
        position: { x: newX, y: newY },
        updatedAt: new Date()
      });
    }
    
    if (isResizing) {
      const deltaX = (e.clientX - dragStart.x) / zoom;
      const deltaY = (e.clientY - dragStart.y) / zoom;
      
      let newWidth = elementStart.width;
      let newHeight = elementStart.height;
      let newX = elementStart.x;
      let newY = elementStart.y;
      
      switch (resizeHandle) {
        case 'nw':
          newWidth = Math.max(50, elementStart.width - deltaX);
          newHeight = Math.max(30, elementStart.height - deltaY);
          newX = elementStart.x + (elementStart.width - newWidth);
          newY = elementStart.y + (elementStart.height - newHeight);
          break;
        case 'ne':
          newWidth = Math.max(50, elementStart.width + deltaX);
          newHeight = Math.max(30, elementStart.height - deltaY);
          newY = elementStart.y + (elementStart.height - newHeight);
          break;
        case 'sw':
          newWidth = Math.max(50, elementStart.width - deltaX);
          newHeight = Math.max(30, elementStart.height + deltaY);
          newX = elementStart.x + (elementStart.width - newWidth);
          break;
        case 'se':
          newWidth = Math.max(50, elementStart.width + deltaX);
          newHeight = Math.max(30, elementStart.height + deltaY);
          break;
        case 'n':
          newHeight = Math.max(30, elementStart.height - deltaY);
          newY = elementStart.y + (elementStart.height - newHeight);
          break;
        case 's':
          newHeight = Math.max(30, elementStart.height + deltaY);
          break;
        case 'w':
          newWidth = Math.max(50, elementStart.width - deltaX);
          newX = elementStart.x + (elementStart.width - newWidth);
          break;
        case 'e':
          newWidth = Math.max(50, elementStart.width + deltaX);
          break;
      }
      
      // Ensure element stays within canvas bounds
      newX = Math.max(0, Math.min(canvasSize.width - newWidth, newX));
      newY = Math.max(0, Math.min(canvasSize.height - newHeight, newY));
      
      onUpdate({
        ...element,
        position: { x: newX, y: newY },
        size: { width: newWidth, height: newHeight },
        updatedAt: new Date()
      });
    }
    
    if (isRotating) {
      const deltaX = e.clientX - rotationStart.centerX;
      const deltaY = e.clientY - rotationStart.centerY;
      const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
      const newRotation = angle - 90; // Adjust for vertical reference
      
      onUpdate({
        ...element,
        rotation: newRotation,
        updatedAt: new Date()
      });
    }
  }, [isDragging, isResizing, isRotating, dragStart, elementStart, rotationStart, zoom, canvasSize, element, onUpdate, resizeHandle]);

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setIsRotating(false);
    setResizeHandle('');
  }, []);

  // Add event listeners
  useEffect(() => {
    if (isDragging || isResizing || isRotating) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, isRotating, handleMouseMove, handleMouseUp]);

  // Handle context menu
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  };

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setShowContextMenu(false);
    if (showContextMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showContextMenu]);

  // Handle rotation
  const handleRotate = (direction: 'left' | 'right') => {
    const increment = direction === 'left' ? -15 : 15;
    onUpdate({
      ...element,
      rotation: (element.rotation + increment) % 360,
      updatedAt: new Date()
    });
  };

  // Handle lock/unlock
  const handleToggleLock = () => {
    onUpdate({
      ...element,
      locked: !element.locked,
      updatedAt: new Date()
    });
  };

  // Handle visibility toggle
  const handleToggleVisibility = () => {
    onUpdate({
      ...element,
      visible: !element.visible,
      updatedAt: new Date()
    });
  };

  // Handle duplicate
  const handleDuplicate = () => {
    onDuplicate(element);
  };

  // Handle delete
  const handleDelete = () => {
    onDelete(element.id);
  };

  // Render text with styles
  const renderTextElement = () => {
    const style = element.style;
    const cssStyle: React.CSSProperties = {
      fontFamily: style.fontFamily,
      fontSize: style.fontSize,
      fontWeight: style.fontWeight,
      color: style.color,
      textAlign: style.textAlign,
      textTransform: style.textTransform as any,
      letterSpacing: style.letterSpacing,
      lineHeight: style.lineHeight,
      textShadow: style.textShadow,
      backgroundColor: style.backgroundColor,
      backgroundImage: style.backgroundImage,
      border: style.border,
      borderRadius: style.borderRadius,
      padding: style.padding,
      margin: style.margin,
      WebkitBackgroundClip: style.backgroundImage ? 'text' : 'initial',
      WebkitTextFillColor: style.backgroundImage ? 'transparent' : 'initial',
      position: 'relative',
      zIndex: 1,
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: style.textAlign === 'center' ? 'center' : style.textAlign === 'right' ? 'flex-end' : 'flex-start',
      wordBreak: 'break-word',
      outline: element.isEditing ? '2px solid #fbbf24' : 'none',
      cursor: element.isEditing ? 'text' : 'inherit'
    };

    // Apply outline if defined
    if (style.outline) {
      cssStyle.WebkitTextStroke = `${style.outline.width} ${style.outline.color}`;
    }

    // Apply transform if defined
    if (style.transform) {
      cssStyle.transform = `rotate(${style.transform.rotate || 0}deg) scale(${style.transform.scale || 1}) skew(${style.transform.skew || 0}deg)`;
    }

    // Apply filter if defined
    if (style.filter) {
      cssStyle.filter = `blur(${style.filter.blur || 0}px) brightness(${style.filter.brightness || 1}) contrast(${style.filter.contrast || 1}) saturate(${style.filter.saturate || 1})`;
    }

    return (
      <div
        ref={textRef}
        style={cssStyle}
        contentEditable={element.isEditing}
        suppressContentEditableWarning={true}
        onInput={handleTextChange}
        onBlur={handleTextBlur}
        onKeyDown={handleTextKeyDown}
        className="text-element-content"
      >
        {element.text}
        
        {/* Glow effect */}
        {style.glow && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(circle, ${style.glow.color}${Math.floor(style.glow.intensity * 25.5).toString(16).padStart(2, '0')} 0%, transparent 70%)`,
              filter: `blur(${style.glow.blur}px)`,
              zIndex: -1
            }}
          />
        )}
      </div>
    );
  };

  // Render resize handles
  const renderResizeHandles = () => {
    if (!isSelected || !showHandles || element.locked || element.isEditing) return null;

    const handleStyle = "absolute w-3 h-3 bg-blue-500 border-2 border-white rounded-sm hover:bg-blue-400 cursor-pointer shadow-lg";
    const handleSize = 12;

    return (
      <>
        {/* Corner handles */}
        <div 
          className={`${handleStyle} cursor-nw-resize`}
          style={{ top: -handleSize/2, left: -handleSize/2 }}
          onMouseDown={(e) => handleResizeStart(e, 'nw')}
        />
        <div 
          className={`${handleStyle} cursor-ne-resize`}
          style={{ top: -handleSize/2, right: -handleSize/2 }}
          onMouseDown={(e) => handleResizeStart(e, 'ne')}
        />
        <div 
          className={`${handleStyle} cursor-sw-resize`}
          style={{ bottom: -handleSize/2, left: -handleSize/2 }}
          onMouseDown={(e) => handleResizeStart(e, 'sw')}
        />
        <div 
          className={`${handleStyle} cursor-se-resize`}
          style={{ bottom: -handleSize/2, right: -handleSize/2 }}
          onMouseDown={(e) => handleResizeStart(e, 'se')}
        />
        
        {/* Edge handles */}
        <div 
          className={`${handleStyle} cursor-n-resize`}
          style={{ top: -handleSize/2, left: '50%', transform: 'translateX(-50%)' }}
          onMouseDown={(e) => handleResizeStart(e, 'n')}
        />
        <div 
          className={`${handleStyle} cursor-s-resize`}
          style={{ bottom: -handleSize/2, left: '50%', transform: 'translateX(-50%)' }}
          onMouseDown={(e) => handleResizeStart(e, 's')}
        />
        <div 
          className={`${handleStyle} cursor-w-resize`}
          style={{ left: -handleSize/2, top: '50%', transform: 'translateY(-50%)' }}
          onMouseDown={(e) => handleResizeStart(e, 'w')}
        />
        <div 
          className={`${handleStyle} cursor-e-resize`}
          style={{ right: -handleSize/2, top: '50%', transform: 'translateY(-50%)' }}
          onMouseDown={(e) => handleResizeStart(e, 'e')}
        />
        
        {/* Rotation handle */}
        <div 
          className="absolute w-4 h-4 bg-green-500 border-2 border-white rounded-full hover:bg-green-400 cursor-grab shadow-lg"
          style={{ top: -30, left: '50%', transform: 'translateX(-50%)' }}
          onMouseDown={(e) => handleRotateStart(e)}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-1 h-1 bg-white rounded-full"></div>
          </div>
        </div>
      </>
    );
  };

  // Render toolbar
  const renderToolbar = () => {
    if (!isSelected || !showHandles) return null;

    return (
      <div className="absolute -top-12 left-0 flex items-center gap-1 bg-gray-800 border border-gray-600 rounded-lg p-1 shadow-lg">
        <button
          onClick={handleToggleLock}
          className={`p-1 rounded hover:bg-gray-700 ${element.locked ? 'text-red-400' : 'text-gray-400'}`}
          title={element.locked ? 'Unlock' : 'Lock'}
        >
          {element.locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
        </button>
        <button
          onClick={handleToggleVisibility}
          className={`p-1 rounded hover:bg-gray-700 ${!element.visible ? 'text-red-400' : 'text-gray-400'}`}
          title={element.visible ? 'Hide' : 'Show'}
        >
          {element.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </button>
        <div className="w-px h-4 bg-gray-600" />
        <button
          onClick={() => handleRotate('left')}
          className="p-1 rounded hover:bg-gray-700 text-gray-400"
          title="Rotate Left"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleRotate('right')}
          className="p-1 rounded hover:bg-gray-700 text-gray-400"
          title="Rotate Right"
        >
          <RotateCw className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-gray-600" />
        <button
          onClick={handleDuplicate}
          className="p-1 rounded hover:bg-gray-700 text-gray-400"
          title="Duplicate"
        >
          <Copy className="w-4 h-4" />
        </button>
        <button
          onClick={handleDelete}
          className="p-1 rounded hover:bg-gray-700 text-red-400"
          title="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    );
  };

  // Render context menu
  const renderContextMenu = () => {
    if (!showContextMenu) return null;

    return (
      <div 
        className="fixed bg-gray-800 border border-gray-600 rounded-lg shadow-lg py-2 z-50 min-w-[160px]"
        style={{ left: contextMenuPos.x, top: contextMenuPos.y }}
      >
        <button
          onClick={() => { handleDuplicate(); setShowContextMenu(false); }}
          className="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-700 flex items-center gap-2"
        >
          <Copy className="w-4 h-4" />
          Duplicate
        </button>
        <button
          onClick={() => { handleToggleLock(); setShowContextMenu(false); }}
          className="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-700 flex items-center gap-2"
        >
          {element.locked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
          {element.locked ? 'Unlock' : 'Lock'}
        </button>
        <button
          onClick={() => { handleToggleVisibility(); setShowContextMenu(false); }}
          className="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-700 flex items-center gap-2"
        >
          {element.visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          {element.visible ? 'Hide' : 'Show'}
        </button>
        <div className="border-t border-gray-600 my-1" />
        <button
          onClick={() => { handleDelete(); setShowContextMenu(false); }}
          className="w-full px-4 py-2 text-left text-red-400 hover:bg-gray-700 flex items-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          Delete
        </button>
      </div>
    );
  };

  if (!element.visible) return null;

  return (
    <>
      <div
        ref={elementRef}
        className={`absolute select-none ${
          element.isEditing 
            ? 'ring-2 ring-green-400 ring-opacity-70 shadow-lg' 
            : isSelected 
              ? 'ring-2 ring-blue-400 ring-opacity-60' 
              : ''
        } ${
          element.locked 
            ? 'cursor-not-allowed' 
            : element.isEditing 
              ? 'cursor-text' 
              : 'cursor-move'
        } ${isDragging ? 'cursor-grabbing' : ''}`}
        style={{
          left: element.position.x,
          top: element.position.y,
          width: element.size.width,
          height: element.size.height,
          transform: `rotate(${element.rotation}deg) scale(${element.scale})`,
          opacity: element.opacity,
          zIndex: element.zIndex
        }}
        onClick={handleElementClick}
        onDoubleClick={handleDoubleClick}
        onMouseDown={handleMouseDown}
        onContextMenu={handleContextMenu}
      >
        {renderTextElement()}
        {renderResizeHandles()}
        {renderToolbar()}
      </div>
      {renderContextMenu()}
      
      {/* Floating Text Toolbar */}
      <FloatingTextToolbar
        element={element}
        isVisible={isSelected && !element.locked}
        onUpdate={onUpdate}
        position={toolbarPosition}
      />
    </>
  );
};

export default TextElementEditor;