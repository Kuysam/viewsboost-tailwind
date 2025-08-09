# Media Sourcing Agent

A comprehensive Node.js application for sourcing, downloading, and managing media assets from Pexels and Unsplash APIs. Built with modern ES6 modules, queue systems, and robust error handling for scalable media workflows.

## Features

### 🎯 Core Capabilities
- **Multi-Source Support**: Pexels (images & videos) and Unsplash (images)
- **Intelligent Download Management**: Queue-based downloads with rate limiting
- **Metadata Tracking**: Complete media asset management with searchable metadata
- **Format Validation**: Comprehensive image and video validation
- **Rate Limit Handling**: Automatic rate limiting with adaptive backoff

### 📊 Advanced Features
- **Batch Operations**: Download multiple assets simultaneously
- **Search & Filter**: Advanced search with multiple filter options
- **Analytics & Statistics**: Detailed usage statistics and performance metrics
- **Local Media Search**: Search through downloaded assets by metadata
- **Automatic Retry**: Intelligent retry mechanisms for failed requests

## Quick Start

### Installation

```bash
# Clone or create the project directory
cd media-sourcing-agent

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
```

### Configuration

Edit `.env` with your API keys:

```bash
# API Keys
PEXELS_API_KEY=your_pexels_api_key_here
UNSPLASH_ACCESS_KEY=your_unsplash_access_key_here

# Optional: Customize paths and limits
DOWNLOADS_PATH=./downloads
MAX_IMAGE_SIZE=5242880
MAX_VIDEO_SIZE=104857600
```

### Basic Usage

```javascript
import { MediaSourcingAgent } from './src/index.js';

const agent = new MediaSourcingAgent();

// Search for images
const images = await agent.searchImages('nature', ['pexels', 'unsplash']);
console.log(`Found ${images.totalResults} images`);

// Download first 3 images
const downloads = await agent.downloadImages(images.images.slice(0, 3));
console.log('Downloads completed:', downloads);
```

## API Documentation

### MediaSourcingAgent

#### Constructor Options
```javascript
const agent = new MediaSourcingAgent({
  autoDownload: false,        // Auto-download search results
  maxResults: 50,             // Max search results per query
  downloadQuality: 'high',    // 'low', 'medium', 'high', 'original'
  imageFormats: ['jpg', 'png', 'webp'],
  videoFormats: ['mp4']
});
```

#### Search Methods

##### `searchImages(query, sources, options)`
Search for images across multiple sources.

```javascript
const results = await agent.searchImages('mountain sunset', ['pexels', 'unsplash'], {
  maxResults: 20,
  orientation: 'landscape',  // 'landscape', 'portrait', 'square'
  color: 'blue',            // Color filter
  size: 'large'             // 'large', 'medium', 'small'
});
```

##### `searchVideos(query, sources, options)`
Search for videos (Pexels only).

```javascript
const results = await agent.searchVideos('ocean waves', ['pexels'], {
  maxResults: 10,
  orientation: 'landscape',
  size: 'large'
});
```

#### Download Methods

##### `downloadImages(images, options)`
Download multiple images with processing options.

```javascript
const downloads = await agent.downloadImages(images, {
  quality: 80,              // JPEG quality (1-100)
  resize: {                 // Optional resize
    width: 1920,
    height: 1080,
    fit: 'cover'
  },
  format: 'jpeg'            // Convert format
});
```

##### `downloadVideos(videos, options)`
Download multiple videos.

```javascript
const downloads = await agent.downloadVideos(videos, {
  quality: 'hd'             // 'sd', 'hd', 'uhd'
});
```

#### Utility Methods

##### `getStats()`
Get comprehensive statistics about downloaded media.

```javascript
const stats = await agent.getStats();
console.log(`Total files: ${stats.totalFiles}`);
console.log(`Storage used: ${stats.totalSize} bytes`);
```

##### `searchLocalMedia(query, filters)`
Search through downloaded media metadata.

```javascript
const localResults = await agent.searchLocalMedia('landscape', {
  type: 'image',
  source: 'pexels',
  orientation: 'landscape',
  minSize: 1000000          // Min file size in bytes
});
```

##### `getRateLimitStatus()`
Check current rate limit status for all APIs.

```javascript
const limits = await agent.getRateLimitStatus();
console.log(`Pexels: ${limits.pexels.remaining} requests remaining`);
```

## Architecture

### Project Structure
```
media-sourcing-agent/
├── src/
│   ├── agents/              # Main orchestrator classes
│   │   └── MediaSourcingAgent.js
│   ├── clients/             # API client classes
│   │   ├── PexelsClient.js
│   │   └── UnsplashClient.js
│   ├── utils/               # Utility classes
│   │   ├── MediaDownloadManager.js
│   │   ├── MetadataTracker.js
│   │   ├── MediaValidator.js
│   │   ├── RateLimitManager.js
│   │   └── Logger.js
│   ├── config/              # Configuration
│   │   └── config.js
│   └── index.js             # Main entry point
├── downloads/               # Downloaded media storage
│   ├── images/
│   ├── videos/
│   ├── temp/
│   └── metadata.json
├── logs/                    # Application logs
└── .env                     # Environment variables
```

### Core Components

#### MediaSourcingAgent
Main orchestrator that coordinates all operations:
- Manages API clients (Pexels, Unsplash)
- Handles search operations across multiple sources
- Coordinates downloads with queue management
- Provides unified interface for all operations

#### API Clients
- **PexelsClient**: Handles Pexels API for images and videos
- **UnsplashClient**: Handles Unsplash API for images only
- Built-in rate limiting and error handling
- Automatic retry mechanisms

#### MediaDownloadManager
- Queue-based download system with concurrency control
- Image processing with Sharp (resize, format conversion, quality adjustment)
- Comprehensive error handling and validation
- Progress tracking and statistics

#### MetadataTracker
- SQLite-like JSON-based metadata storage
- Advanced search and filtering capabilities
- Usage tracking and analytics
- Metadata export functionality

#### RateLimitManager
- Intelligent rate limiting with multiple strategies
- Adaptive rate limiting based on success rates
- Queue management with priority support
- Exponential backoff with jitter

## Advanced Usage

### Custom Download Processing

```javascript
// Download with custom processing
const downloads = await agent.downloadImages(images, {
  resize: { width: 1920, height: 1080, fit: 'cover' },
  quality: 85,
  format: 'webp',
  prefix: 'hero'
});
```

### Batch Operations

```javascript
// Process large batches efficiently
const batchResults = await agent.downloadManager.downloadBatch([
  { type: 'image', url: 'https://...', options: { quality: 90 } },
  { type: 'video', url: 'https://...', options: { quality: 'hd' } }
], { batchSize: 10 });
```

### Metadata Management

```javascript
// Advanced metadata search
const results = await agent.searchLocalMedia('sunset', {
  type: 'image',
  orientation: 'landscape',
  minSize: 2000000,
  dateFrom: '2024-01-01',
  dateTo: '2024-12-31'
});

// Export metadata
const exportPath = await agent.metadataTracker.exportMetadata('csv');
```

### Rate Limiting Configuration

```javascript
// Create custom rate limiter
agent.rateLimitManager.createAdaptiveLimiter('custom', {
  concurrency: 3,
  interval: 1000,
  intervalCap: 5
}, {
  successRateThreshold: 0.85,
  adjustmentFactor: 0.7,
  recoveryFactor: 1.2
});
```

## Error Handling

The system includes comprehensive error handling:

```javascript
try {
  const results = await agent.searchImages('query');
} catch (error) {
  if (error.message.includes('Rate limit exceeded')) {
    console.log('Rate limited - waiting...');
    // Implement backoff strategy
  } else if (error.message.includes('API key')) {
    console.error('Invalid API configuration');
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## Monitoring & Logging

### Log Files
- `logs/app.log` - General application logs
- `logs/error.log` - Error-specific logs
- `logs/downloads.log` - Download activity
- `logs/exceptions.log` - Uncaught exceptions

### Statistics Tracking
```javascript
const stats = await agent.getStats();
// Returns: totalFiles, images, videos, totalSize, sources, categories, etc.

const queueStatus = await agent.getQueueStatus();
// Returns: pending, size, isPaused status
```

## Performance Optimization

### Recommended Settings
```bash
# .env optimizations
QUEUE_CONCURRENCY=5          # Adjust based on your bandwidth
CONCURRENT_DOWNLOADS=3       # Balance speed vs system resources
REQUEST_DELAY=1000          # Prevent API rate limiting
PEXELS_RATE_LIMIT=180       # Leave buffer under 200/hour limit
```

### Memory Management
- Images are processed in streams to minimize memory usage
- Temporary files are cleaned up automatically
- Metadata is stored efficiently in JSON format

## API Rate Limits

| Service  | Limit | Included Features |
|----------|-------|-------------------|
| Pexels   | 200/hour | Images, Videos, Search |
| Unsplash | 50/hour | Images, Collections, Random |

The system automatically handles rate limiting with intelligent backoff strategies.

## Troubleshooting

### Common Issues

1. **API Key Errors**
   ```bash
   Error: Pexels API key is required
   ```
   Solution: Verify `.env` file has correct API keys

2. **Rate Limit Exceeded**
   ```bash
   Error: Rate limit exceeded. Reset in 3600 seconds
   ```
   Solution: Wait for reset or implement custom backoff

3. **Download Failures**
   ```bash
   Error: Image too large: 10485760 bytes
   ```
   Solution: Increase `MAX_IMAGE_SIZE` or filter by size

4. **Permission Errors**
   ```bash
   Error: EACCES: permission denied, mkdir './downloads'
   ```
   Solution: Check directory permissions or use absolute paths

### Debug Mode
```bash
LOG_LEVEL=debug npm start
```

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## License

MIT License - see LICENSE file for details.

## API Documentation

- [Pexels API Documentation](https://www.pexels.com/api/documentation/)
- [Unsplash API Documentation](https://unsplash.com/documentation)