import React, { useState, useRef, useCallback, useEffect } from 'react';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import { Crop as CropIcon, RotateCw, FlipHorizontal, FlipVertical, Square, Maximize, Check, X } from 'lucide-react';
import 'react-image-crop/dist/ReactCrop.css';

interface AspectRatioPreset {
  name: string;
  value: number | undefined;
  label: string;
}

interface ImageCropToolProps {
  imageSrc: string;
  onCropComplete: (croppedImageBlob: Blob) => void;
  onCancel: () => void;
  initialCrop?: Crop;
}

const ASPECT_RATIO_PRESETS: AspectRatioPreset[] = [
  { name: 'free', value: undefined, label: 'Free' },
  { name: 'square', value: 1, label: '1:1' },
  { name: 'landscape', value: 16 / 9, label: '16:9' },
  { name: 'portrait', value: 9 / 16, label: '9:16' },
  { name: 'story', value: 9 / 16, label: 'Story' },
  { name: 'post', value: 1, label: 'Post' },
  { name: 'cover', value: 16 / 9, label: 'Cover' },
  { name: 'banner', value: 3 / 1, label: 'Banner' },
];

export function ImageCropTool({
  imageSrc,
  onCropComplete,
  onCancel,
  initialCrop
}: ImageCropToolProps) {
  const [crop, setCrop] = useState<Crop>(
    initialCrop || {
      unit: '%',
      x: 10,
      y: 10,
      width: 80,
      height: 80,
    }
  );
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<number | undefined>();
  const [rotation, setRotation] = useState(0);
  const [flipHorizontal, setFlipHorizontal] = useState(false);
  const [flipVertical, setFlipVertical] = useState(false);
  const [scale, setScale] = useState(1);
  
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    
    if (selectedAspectRatio) {
      const newCrop = centerCrop(
        makeAspectCrop(
          {
            unit: '%',
            width: 80,
          },
          selectedAspectRatio,
          width,
          height,
        ),
        width,
        height,
      );
      setCrop(newCrop);
    }
  }

  const handleAspectRatioChange = useCallback((aspectRatio: number | undefined) => {
    setSelectedAspectRatio(aspectRatio);
    
    if (aspectRatio && imgRef.current) {
      const { width, height } = imgRef.current;
      const newCrop = centerCrop(
        makeAspectCrop(
          {
            unit: '%',
            width: 80,
          },
          aspectRatio,
          width,
          height,
        ),
        width,
        height,
      );
      setCrop(newCrop);
    }
  }, []);

  const generateCroppedImage = useCallback(async () => {
    if (!completedCrop || !imgRef.current || !canvasRef.current) {
      return;
    }

    const image = imgRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('No 2d context');
    }

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    const pixelRatio = window.devicePixelRatio;
    canvas.width = Math.floor(completedCrop.width * scaleX * pixelRatio);
    canvas.height = Math.floor(completedCrop.height * scaleY * pixelRatio);

    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.imageSmoothingQuality = 'high';

    // Apply transformations
    const centerX = completedCrop.width * scaleX / 2;
    const centerY = completedCrop.height * scaleY / 2;

    ctx.save();
    ctx.translate(centerX, centerY);
    
    if (rotation !== 0) {
      ctx.rotate((rotation * Math.PI) / 180);
    }
    
    if (flipHorizontal || flipVertical) {
      ctx.scale(flipHorizontal ? -1 : 1, flipVertical ? -1 : 1);
    }

    ctx.scale(scale, scale);
    ctx.translate(-centerX, -centerY);

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
    );

    ctx.restore();

    return new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        }
      }, 'image/jpeg', 0.95);
    });
  }, [completedCrop, rotation, flipHorizontal, flipVertical, scale]);

  const handleCropComplete = useCallback(async () => {
    try {
      const croppedBlob = await generateCroppedImage();
      if (croppedBlob) {
        onCropComplete(croppedBlob);
      }
    } catch (error) {
      console.error('Error generating cropped image:', error);
    }
  }, [generateCroppedImage, onCropComplete]);

  const resetTransformations = useCallback(() => {
    setRotation(0);
    setFlipHorizontal(false);
    setFlipVertical(false);
    setScale(1);
  }, []);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-gray-900 rounded-lg shadow-2xl max-w-6xl max-h-[90vh] w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <CropIcon size={20} className="text-blue-400" />
            <h2 className="text-white font-semibold">Crop Image</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition"
            >
              <X size={16} className="inline mr-2" />
              Cancel
            </button>
            <button
              onClick={handleCropComplete}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
            >
              <Check size={16} className="inline mr-2" />
              Apply
            </button>
          </div>
        </div>

        <div className="flex">
          {/* Left Sidebar - Controls */}
          <div className="w-80 p-4 border-r border-gray-700 bg-gray-800/50 max-h-[calc(90vh-80px)] overflow-y-auto">
            {/* Aspect Ratio Presets */}
            <div className="mb-6">
              <h3 className="text-white font-medium mb-3">Aspect Ratio</h3>
              <div className="grid grid-cols-2 gap-2">
                {ASPECT_RATIO_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => handleAspectRatioChange(preset.value)}
                    className={`p-2 rounded-lg text-sm font-medium transition ${
                      selectedAspectRatio === preset.value
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Transform Controls */}
            <div className="mb-6">
              <h3 className="text-white font-medium mb-3">Transform</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setRotation(prev => prev - 90)}
                    className="flex-1 p-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition"
                  >
                    <RotateCw size={16} className="inline mr-2 transform scale-x-[-1]" />
                    Rotate Left
                  </button>
                  <button
                    onClick={() => setRotation(prev => prev + 90)}
                    className="flex-1 p-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition"
                  >
                    <RotateCw size={16} className="inline mr-2" />
                    Rotate Right
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setFlipHorizontal(prev => !prev)}
                    className={`flex-1 p-2 rounded-lg transition ${
                      flipHorizontal
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    <FlipHorizontal size={16} className="inline mr-2" />
                    Flip H
                  </button>
                  <button
                    onClick={() => setFlipVertical(prev => !prev)}
                    className={`flex-1 p-2 rounded-lg transition ${
                      flipVertical
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    <FlipVertical size={16} className="inline mr-2" />
                    Flip V
                  </button>
                </div>

                <button
                  onClick={resetTransformations}
                  className="w-full p-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition text-sm"
                >
                  Reset Transformations
                </button>
              </div>
            </div>

            {/* Scale Control */}
            <div className="mb-6">
              <h3 className="text-white font-medium mb-3">Scale</h3>
              <div className="space-y-2">
                <input
                  type="range"
                  min="0.5"
                  max="3"
                  step="0.1"
                  value={scale}
                  onChange={(e) => setScale(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-400">
                  <span>50%</span>
                  <span className="text-white">{Math.round(scale * 100)}%</span>
                  <span>300%</span>
                </div>
              </div>
            </div>

            {/* Rotation Display */}
            {rotation !== 0 && (
              <div className="mb-4">
                <div className="text-sm text-gray-400">Rotation: {rotation}°</div>
              </div>
            )}
          </div>

          {/* Main Content - Image Crop Area */}
          <div className="flex-1 p-4 max-h-[calc(90vh-80px)] overflow-auto">
            <div className="flex items-center justify-center h-full">
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={selectedAspectRatio}
                minWidth={50}
                minHeight={50}
                keepSelection
              >
                <img
                  ref={imgRef}
                  alt="Crop preview"
                  src={imageSrc}
                  onLoad={onImageLoad}
                  style={{
                    transform: `rotate(${rotation}deg) scaleX(${flipHorizontal ? -1 : 1}) scaleY(${flipVertical ? -1 : 1}) scale(${scale})`,
                    maxWidth: '100%',
                    maxHeight: '100%',
                  }}
                />
              </ReactCrop>
            </div>
          </div>
        </div>

        {/* Hidden canvas for image generation */}
        <canvas
          ref={canvasRef}
          style={{ display: 'none' }}
        />
      </div>
    </div>
  );
}