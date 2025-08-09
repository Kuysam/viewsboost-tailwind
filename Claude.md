# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Start development server:**
```bash
npm run dev
```

**Type checking:**
```bash
npm run type-check
```

**Build for production:**
```bash
npm run build
```

**Linting:**
```bash
npm run lint
```

**Build with bundle analysis:**
```bash
npm run build:analyze
```

## Architecture Overview

### Core Structure
- **React 18 + TypeScript + Vite** - Modern frontend stack with fast HMR
- **Firebase Integration** - Authentication, Firestore, and Storage for backend services
- **Fabric.js Canvas Editor** - Professional graphics editing in the Studio component
- **Zustand State Management** - Lightweight state management via `src/store/editorStore.ts`
- **YouTube Data API** - Video content integration with quota management

### Key Directories
- `src/components/` - Reusable UI components, organized by feature
- `src/pages/` - Route components with lazy loading for performance
- `src/lib/services/` - Business logic services (21+ specialized services)
- `src/lib/converters/` - File format conversion system (Adobe, Video, Audio, etc.)
- `src/store/` - Zustand state management
- `src/hooks/` - Custom React hooks for editor functionality

### Component Organization
- **Sidebar Panels**: `src/components/Sidebar/` - Templates, Text, Shapes, Layers, Upload panels
- **Canvas System**: Fabric.js-based editor with video template processing
- **Service Layer**: Modular services for analytics, quota management, user stats, etc.

## Firebase Configuration

Environment variables required in `.env`:
```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_YT_API_KEY=
VITE_YOUTUBE_API_BASE_URL=https://www.googleapis.com/youtube/v3
```

## Editor System (Studio)

The Studio component (`src/pages/Studio.tsx`) is the main editor:
- **Canvas**: Fabric.js-based canvas with 800x600 default size
- **State**: Managed via `useEditorStore()` hook
- **Panels**: Template selection, text editing, shapes, layers, file upload
- **Video Processing**: Template-based video editing with Firebase Storage integration

Key editor features:
- Template system with Firebase storage mapping
- Text presets and styling
- Shape library and layers management
- Video template processing and export

## Service Architecture

Services are organized by domain in `src/lib/services/`:
- **Template Services**: `templateService.ts`, `templateAnalyticsService.ts`
- **User Services**: `userAnalyticsService.ts`, `userStats.ts`, `userVideoService.ts`
- **Video Services**: `videoService.ts`, `shortsService.ts`, `liveService.ts`
- **System Services**: `quotaService.ts`, `youtubeQuotaService.ts`, `backupService.ts`

## Performance Optimizations

- **Code Splitting**: Vite configuration with manual chunks for different feature areas
- **Lazy Loading**: All major pages lazy-loaded via React.lazy()
- **Bundle Analysis**: `npm run build:analyze` for bundle size monitoring
- **Firebase Optimization**: Separate chunks for Firebase services

## Standard Workflow
1. First think through the problem, read the codebase for relevant files, and write a plan to tasks/todo.md.
2. The plan should have a list of todo items that you can check off as you complete them
3. Before you begin working, check in with me and I will verify the plan.
4. Then, begin working on the todo items, marking them as complete as you go.
5. Please every step of the way just give me a high level explanation of what changes you made
6. Make every task and code change you do as simple as possible. We want to avoid making any massive or complex changes. Every change should impact as little code as possible. Everything is about simplicity.
7. Finally, add a review section to the [todo.md](http://todo.md/) file with a summary of the changes you made and any other relevant information.
