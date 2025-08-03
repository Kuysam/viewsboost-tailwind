# 🤖 JSON Transformer Folder

## 📁 What is this folder?

Drop your **video files**, **images**, and **documents** here and they'll automatically be **transformed into JSON template files** for your ViewsBoost app!

## 🎯 Supported File Types:

### 🎬 **Videos**
- **MP4**, MOV, AVI, WebM, MKV, M4V, FLV, WMV
- Perfect for social media content, tutorials, ads

### 🖼️ **Images** 
- **JPEG**, PNG, GIF, SVG, WebP, BMP, TIFF, ICO
- Great for thumbnails, social posts, banners, logos

### 📄 **Documents**
- **PDF**, DOC, DOCX, PPT, PPTX, XLS, XLSX, TXT, RTF
- Ideal for presentations, reports, resumes, flyers

## 🚀 How to Use:

### **Option 1: Automatic Watch Mode (Recommended)**
```bash
node auto-template-generator.cjs watch
```
- Keeps running and watches this folder
- **Any time you add supported files**, JSON templates are auto-generated
- Perfect for ongoing work

### **Option 2: Generate Once**
```bash
node auto-template-generator.cjs generate
```
- Processes current files once
- Good for quick batch processing

## 📋 Smart Features:

### **🤖 Auto-Detection**
The system automatically detects content types from filenames:

**Videos:**
- `tiktok-dance.mp4` → **TikTok Shorts** template
- `youtube-tutorial.mp4` → **YouTube Video** template  
- `instagram-reel.mp4` → **Instagram Reel** template
- `shorts-comedy.mp4` → **YouTube Shorts** template
- `facebook-ad.mp4` → **Facebook Video** template

**Images:**
- `thumbnail-gaming.jpg` → **YouTube** template
- `social-post.png` → **Social Media Posts** template
- `instagram-story.jpg` → **Instagram Story** template
- `logo-brand.svg` → **Personal Branding** template
- `quote-motivation.png` → **Quote/Motivational** template

**Documents:**
- `resume-2024.pdf` → **Personal Branding** template
- `presentation-pitch.pptx` → **Presentation** template
- `newsletter-march.docx` → **Newsletter** template
- `invoice-client.pdf` → **Invoice** template
- `certificate-course.pdf` → **Certificate** template

### **📊 Organized Output**
- Templates are grouped by category
- Separate JSON files for each content type
- Combined file with all templates
- Timestamped files (no overwriting)

## 🎯 Complete Workflow:

1. **Drop files** into this "json Transformer" folder
2. **Run the generator** (watch or generate mode)
3. **Import JSON files** to Admin Panel → Template Category Manager  
4. **Upload files** using the appropriate upload buttons:
   - 🎬 **"📹 Upload Videos"** for video files
   - 🖼️ **"🖼️ Upload Images"** for image files  
   - 📄 **"📄 Upload Documents"** for document files
5. **Sync to Firestore** ✅

## 📁 File Structure:
```
json Transformer/          ← Your files go here
generated-templates/       ← JSON files are created here
  ├── youtube-video-templates-[timestamp].json
  ├── social-media-posts-templates-[timestamp].json
  ├── personal-branding-templates-[timestamp].json
  └── all-templates-[timestamp].json
```

## 💡 Pro Tips:

### **📝 File Naming for Better Detection:**
- **Use descriptive keywords** in filenames
- **Include platform names**: "youtube", "tiktok", "instagram", "facebook"
- **Include content type**: "thumbnail", "story", "post", "reel", "shorts"
- **Include purpose**: "tutorial", "ad", "presentation", "resume", "logo"

### **🎨 Content Categories:**
- **Videos**: YouTube, TikTok, Instagram Reels, Facebook, LinkedIn, Twitter
- **Images**: Social Posts, Stories, Thumbnails, Banners, Logos, Infographics
- **Documents**: Presentations, Reports, Resumes, Certificates, Newsletters

### **⚡ Performance:**
- **Keep files** in this folder until after you upload them via the admin panel
- **Generated JSON files** are ready to import immediately
- **Watch mode** is most efficient for ongoing work
- **File detection** works automatically based on extensions and names

## 🔧 Technical Details:

- **Smart categorization** based on filename keywords
- **Platform-specific** aspect ratios and properties
- **File type detection** with appropriate metadata
- **Real-time monitoring** with debounced regeneration
- **Comprehensive logging** for easy debugging

Ready to transform your content into professional templates! 🚀
