# Firebase Data Extraction Guide

## Overview

The `extract-firebase-data.js` script comprehensively extracts and analyzes all Firebase data needed to fix template URL mappings.

## Usage

### Quick Start
```bash
# Run the extraction script
node extract-firebase-data.js
```

### What It Does

1. **Connects to Firebase** using your existing `serviceAccountKey.json`
2. **Extracts Firestore data** from all template collections (`templates`, `Templates`, `videoTemplates`, `imageTemplates`)
3. **Lists Firebase Storage files** in `Templates/Video/` and `Templates/Images/` folders
4. **Analyzes mappings** between template titles and storage files
5. **Generates comprehensive reports** in multiple formats

### Generated Files

After running the script, you'll get:

#### 1. `firebase-data-extraction-report.json`
- Complete raw data in JSON format
- All Firestore documents with full field values
- All Storage files with metadata
- Detailed mapping analysis

#### 2. `firebase-mapping-summary.md`
- Human-readable analysis report
- All Firestore templates with their fields
- All Storage files organized by folder
- Mapping analysis showing matches/misses
- Missing files report
- Ready-to-copy TypeScript code

#### 3. `suggested-firebase-mappings.ts`
- TypeScript code for your `firebaseStorageMapper.ts`
- Auto-generated mappings based on exact matches
- Ready to copy-paste into your codebase

## Output Sections

### 📊 Overview
- Total counts of templates and files
- Quick summary of missing mappings

### 🗃️ All Firestore Templates
- Every template with all fields:
  - `id`, `collection`, `title`, `displayName`
  - `category`, `type`, `videoSource`, `preview`
  - `imageUrl` and all other custom fields

### 📁 Firebase Storage Files
- **Templates/Video/** - All video files with:
  - Full path, filename, size, creation date
  - Public URL for direct access
  - Content type and metadata

- **Templates/Images/** - All image files with:
  - Same detailed information as videos
  - Organized by folder structure

### 🔍 Mapping Analysis
For each template:
- **Exact matches** - Files that perfectly match template titles
- **Possible matches** - Partial matches requiring review
- **Suggestions** - Actionable recommendations

### ❌ Missing Files Report
- Templates with no matching storage files
- Expected filename variations
- Guidance for creating missing files

### 🛠️ Suggested Mappings Code
- Ready-to-use TypeScript code
- Paste directly into `firebaseStorageMapper.ts`
- Based on confirmed exact matches

## Error Handling

The script includes comprehensive error handling:
- Graceful handling of missing collections
- Permission errors logged but don't stop execution
- Network timeouts and storage access issues handled
- Detailed error messages for troubleshooting

## Security

- Uses existing `serviceAccountKey.json`
- Read-only operations (no data modification)
- Secure Firebase Admin SDK initialization
- No sensitive data exposed in output files

## Troubleshooting

### "Failed to initialize Firebase Admin"
- Verify `serviceAccountKey.json` exists in root directory
- Check file permissions are readable
- Ensure service account has Storage and Firestore read access

### "Collection access denied"
- Service account needs Firestore read permissions
- Some collections may not exist (this is normal)
- Check Firebase console for collection names

### "Storage access errors"
- Service account needs Storage Object Viewer role
- Verify bucket name is correct (`viewsboostv2.firebasestorage.app`)
- Check Firebase Storage rules

## Next Steps

1. **Run the script**: `node extract-firebase-data.js`
2. **Review the markdown summary**: Open `firebase-mapping-summary.md`
3. **Copy suggested mappings**: Use code from `suggested-firebase-mappings.ts`
4. **Update your mapper**: Paste into `src/lib/services/firebaseStorageMapper.ts`
5. **Test the mappings**: Verify templates load correctly in your app

## Integration

The generated mappings integrate with your existing `FirebaseStorageMapper` class:

```typescript
// In src/lib/services/firebaseStorageMapper.ts
static getKnownFileMappings(): Record<string, { video?: string, image?: string }> {
  return {
    // Paste the generated mappings here
    'tiktok6': { 
      video: 'Templates%2FVideo%2Ftiktok6.mp4',
      image: 'Templates%2FImages%2Ftiktok6.jpg'
    },
    // ... more mappings
  };
}
```

This ensures your template URLs are correctly mapped to actual Firebase Storage files.