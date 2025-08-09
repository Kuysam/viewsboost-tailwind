# ⚡ ViewsBoost Studio - Quick Reference Guide

*Fast access to implementation details, APIs, and code patterns*

---

# 🛠️ **DEVELOPMENT SETUP**

## **Prerequisites**
```bash
Node.js >= 18.0.0
npm >= 9.0.0
Git
Firebase CLI (optional)
```

## **Quick Start**
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run type checking
npm run type-check

# Build for production
npm run build
```

## **Environment Variables**
```bash
# .env file
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_PROJECT_ID=viewsboostv2
VITE_UNSPLASH_ACCESS_KEY=your_unsplash_key
VITE_OPENAI_API_KEY=your_openai_key
```

---

# 📂 **PROJECT STRUCTURE**

```
src/
├── components/           # React components
│   ├── Canvas/          # Canvas-related components
│   ├── Sidebar/         # Panel components
│   │   ├── TemplatesPanel.tsx
│   │   ├── TextPanel.tsx
│   │   ├── ShapesPanel.tsx
│   │   ├── LayersPanel.tsx
│   │   └── ColorsPanel.tsx
│   ├── Toolbar/         # Top toolbar components
│   └── UI/              # Reusable UI components
├── services/            # Business logic & API calls
│   ├── backgroundRemovalService.ts
│   ├── stockPhotoService.ts
│   ├── exportService.ts
│   ├── animationService.ts
│   └── brandKitService.ts
├── hooks/               # Custom React hooks
├── types/               # TypeScript definitions
├── utils/               # Helper functions
├── constants/           # App constants
└── pages/               # Main pages
    └── Studio.tsx       # Main editor page
```

---

# 🎨 **CANVAS MANAGEMENT**

## **Adding Objects to Canvas**
```typescript
// Add image to canvas
const addImageToCanvas = (imageUrl: string) => {
  fabric.Image.fromURL(imageUrl, (img) => {
    img.scaleToWidth(200);
    canvas.add(img);
    canvas.setActiveObject(img);
    canvas.renderAll();
  });
};

// Add text to canvas
const addTextToCanvas = (text: string) => {
  const textObj = new fabric.IText(text, {
    left: 100,
    top: 100,
    fontFamily: 'Arial',
    fontSize: 20,
    fill: '#000000'
  });
  canvas.add(textObj);
  canvas.setActiveObject(textObj);
  canvas.renderAll();
};

// Add shape to canvas
const addShapeToCanvas = (shapeType: 'rectangle' | 'circle') => {
  let shape;
  if (shapeType === 'rectangle') {
    shape = new fabric.Rect({
      left: 100,
      top: 100,
      width: 100,
      height: 100,
      fill: '#3b82f6'
    });
  } else {
    shape = new fabric.Circle({
      left: 100,
      top: 100,
      radius: 50,
      fill: '#3b82f6'
    });
  }
  canvas.add(shape);
  canvas.setActiveObject(shape);
  canvas.renderAll();
};
```

## **Canvas Event Handling**
```typescript
// Object selection
canvas.on('selection:created', (e) => {
  const activeObject = e.selected[0];
  // Update UI based on selected object
});

// Object modification
canvas.on('object:modified', (e) => {
  const modifiedObject = e.target;
  // Save state for undo/redo
});

// Object movement
canvas.on('object:moving', (e) => {
  const movingObject = e.target;
  // Show alignment guides
});
```

---

# 🔧 **SERVICE PATTERNS**

## **API Service Template**
```typescript
// src/services/exampleService.ts
export class ExampleService {
  private static apiKey = import.meta.env.VITE_API_KEY;
  
  static async fetchData(params: RequestParams): Promise<ResponseData> {
    try {
      const response = await fetch(`${API_BASE_URL}/endpoint`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      });
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Service Error:', error);
      throw error;
    }
  }
}
```

## **Firebase Service Pattern**
```typescript
// src/services/firebaseService.ts
import { collection, doc, setDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config/firebase';

export class FirebaseService {
  static async saveDocument(collectionName: string, docId: string, data: any) {
    const docRef = doc(db, collectionName, docId);
    await setDoc(docRef, data);
    return docRef;
  }
  
  static async uploadFile(file: File, path: string): Promise<string> {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
  }
}
```

---

# 🎯 **COMMON PATTERNS**

## **React Component Template**
```typescript
// src/components/Example/ExampleComponent.tsx
import React, { useState, useEffect } from 'react';
import { ExampleService } from '../../services/exampleService';
import { ExampleType } from '../../types/example';

interface ExampleComponentProps {
  onSomething: (data: ExampleType) => void;
  className?: string;
}

export const ExampleComponent: React.FC<ExampleComponentProps> = ({
  onSomething,
  className = ''
}) => {
  const [data, setData] = useState<ExampleType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await ExampleService.fetchData();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className={`example-component ${className}`}>
      {/* Component content */}
    </div>
  );
};
```

## **Custom Hook Template**
```typescript
// src/hooks/useExample.ts
import { useState, useEffect } from 'react';
import { ExampleService } from '../services/exampleService';

export const useExample = (param: string) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!param) return;
    
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await ExampleService.fetchData(param);
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [param]);

  return { data, loading, error };
};
```

---

# 📋 **FEATURE IMPLEMENTATION CHECKLIST**

## **New Feature Template**
```typescript
// 1. Define types
// src/types/newFeature.ts
export interface NewFeatureType {
  id: string;
  name: string;
  config: FeatureConfig;
}

// 2. Create service
// src/services/newFeatureService.ts
export class NewFeatureService {
  static async processFeature(data: NewFeatureType) {
    // Implementation
  }
}

// 3. Create component
// src/components/Sidebar/NewFeaturePanel.tsx
export const NewFeaturePanel = () => {
  // Component implementation
};

// 4. Add to main sidebar
// src/components/Sidebar/Sidebar.tsx
// Import and add new panel

// 5. Update types and constants
// Add new panel type to constants
// Update sidebar state management

// 6. Add tests
// src/__tests__/newFeature.test.ts
// Unit tests for service and components

// 7. Update documentation
// Update README and feature docs
```

---

# 🔍 **DEBUGGING TOOLS**

## **Canvas Debugging**
```typescript
// Debug canvas objects
console.log('Canvas objects:', canvas.getObjects());
console.log('Active object:', canvas.getActiveObject());
console.log('Canvas size:', canvas.getWidth(), canvas.getHeight());

// Debug object properties
const activeObj = canvas.getActiveObject();
if (activeObj) {
  console.log('Object type:', activeObj.type);
  console.log('Object properties:', activeObj.toObject());
}
```

## **Performance Monitoring**
```typescript
// Monitor render performance
const startTime = performance.now();
canvas.renderAll();
const endTime = performance.now();
console.log(`Render time: ${endTime - startTime}ms`);

// Monitor memory usage
console.log('Memory usage:', (performance as any).memory);
```

## **Error Boundaries**
```typescript
// src/components/UI/ErrorBoundary.tsx
import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div>Something went wrong.</div>;
    }
    return this.props.children;
  }
}
```

---

# 📊 **PERFORMANCE OPTIMIZATION**

## **Canvas Optimization**
```typescript
// Disable canvas events during batch operations
canvas.selection = false;
canvas.evented = false;

// Batch operations
canvas.discardActiveObject();
// ... multiple operations ...
canvas.renderAll();

// Re-enable events
canvas.selection = true;
canvas.evented = true;
```

## **Image Optimization**
```typescript
// Compress images before adding to canvas
const compressImage = (file: File, quality: number = 0.8): Promise<Blob> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(resolve, 'image/jpeg', quality);
    };
    
    img.src = URL.createObjectURL(file);
  });
};
```

## **Memory Management**
```typescript
// Clean up fabric objects
const disposeObject = (obj: fabric.Object) => {
  if (obj.type === 'image') {
    const imgObj = obj as fabric.Image;
    if (imgObj.getElement()) {
      URL.revokeObjectURL(imgObj.getSrc());
    }
  }
  obj.dispose && obj.dispose();
};

// Clean up canvas
const cleanupCanvas = () => {
  canvas.getObjects().forEach(disposeObject);
  canvas.clear();
  canvas.dispose();
};
```

---

# 🔐 **SECURITY BEST PRACTICES**

## **File Upload Validation**
```typescript
const validateFile = (file: File): boolean => {
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type');
  }
  
  // Check file size (5MB limit)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error('File too large');
  }
  
  return true;
};
```

## **API Key Security**
```typescript
// Never expose API keys in client-side code
// Use environment variables
const apiKey = import.meta.env.VITE_API_KEY;

// Validate API responses
const validateResponse = (data: any): boolean => {
  // Implement proper validation
  return typeof data === 'object' && data !== null;
};
```

---

# 🚀 **DEPLOYMENT**

## **Build Commands**
```bash
# Development build
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Type checking
npm run type-check

# Linting
npm run lint
```

## **Environment Setup**
```bash
# Production environment variables
VITE_FIREBASE_API_KEY=prod_api_key
VITE_FIREBASE_PROJECT_ID=viewsboostv2-prod
VITE_UNSPLASH_ACCESS_KEY=prod_unsplash_key
```

---

*This quick reference should be your go-to guide for common development tasks and patterns in ViewsBoost Studio.*

**Last Updated**: August 4, 2025  
**Version**: 1.0