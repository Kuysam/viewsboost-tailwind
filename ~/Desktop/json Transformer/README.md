# 🤖 JSON Transformer Folder (Desktop)

## 📁 What is this folder?

This is your **Desktop JSON Transformer folder**! Drop your **MP4 video files** here and they'll automatically be **transformed into JSON template files** for your ViewsBoost app!

## 🚀 How to Use:

### **From your ViewsBoost project directory, run:**

**Option 1: Automatic Watch Mode (Recommended)**
```bash
node auto-template-generator.cjs watch
```
- Keeps running and watches this Desktop folder
- **Any time you add MP4 files**, JSON templates are auto-generated
- Perfect for ongoing work

**Option 2: Generate Once**
```bash
node auto-template-generator.cjs generate
```
- Processes current MP4 files once
- Good for quick batch processing

## 📋 Smart Features:

### **🤖 Auto-Detection**
The system automatically detects video types from filenames:
- `tiktok-dance.mp4` → **TikTok Video** template
- `youtube-tutorial.mp4` → **YouTube Video** template  
- `instagram-reel.mp4` → **Instagram Video** template
- `shorts-comedy.mp4` → **YouTube Shorts** template

### **📊 Organized Output**
- Templates are grouped by category
- Separate JSON files for each platform
- Combined file with all templates
- Timestamped files (no overwriting)

## 🎯 Complete Workflow:

1. **Drop MP4 files** into this Desktop "json Transformer" folder
2. **Run the generator** from your ViewsBoost project (watch or generate mode)
3. **Import JSON files** to Admin Panel → Template Category Manager  
4. **Upload MP4 files** using "📹 Upload Videos" button
5. **Sync to Firestore** ✅

## 📁 File Structure:
```
Desktop/
├── json Transformer/          ← Your MP4 files go here (THIS FOLDER)
│   ├── README.md              ← This file
│   ├── tiktok-dance.mp4       ← Example MP4
│   └── youtube-tutorial.mp4   ← Example MP4

ViewsBoost Project/
└── generated-templates/       ← JSON files are created here
    ├── tiktok-video-templates-[timestamp].json
    ├── youtube-video-templates-[timestamp].json
    └── all-templates-[timestamp].json
```

## 💡 Tips:

- **Name your files clearly** for better auto-detection
- **Use keywords** like "tiktok", "youtube", "shorts", "instagram"
- **Keep MP4 files** in this Desktop folder until after you upload them via the admin panel
- **Generated JSON files** are ready to import immediately
- **Run the generator** from your ViewsBoost project directory, not from this folder 