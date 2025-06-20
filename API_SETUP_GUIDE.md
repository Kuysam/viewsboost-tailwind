# 🚀 ViewsBoost External API Integration Guide

## 🎯 **Goal**: Eliminate 94% Unsplash bias by integrating diverse content APIs

---

## 📋 **Phase 1: Free API Setup (Start Here!)**

### **1. Pexels API** (PRIORITY 1)
- **Sign up**: https://www.pexels.com/api/
- **Free tier**: 200 requests/hour (unlimited downloads)
- **Add to .env**: `VITE_PEXELS_API_KEY=your_api_key_here`
- **Content**: High-quality photos + videos
- **Impact**: Will provide ~33% of diversified content

### **2. Pixabay API** (PRIORITY 2) 
- **Sign up**: https://pixabay.com/api/docs/
- **Free tier**: 100 requests/minute (5000/month)
- **Add to .env**: `VITE_PIXABAY_API_KEY=your_api_key_here`
- **Content**: Photos, vectors, illustrations
- **Impact**: Will provide ~33% of diversified content

### **3. Unsplash API** (Already have - improve usage)
- **Current**: Demo tier (50 requests/hour)
- **Upgrade to**: Free tier (5000 requests/hour)
- **Add to .env**: `VITE_UNSPLASH_ACCESS_KEY=your_access_key_here`
- **Impact**: Better quota for ~33% balanced content

---

## 🛠 **Implementation Steps**

### **Step 1: Get API Keys (15 minutes)**
```bash
# 1. Visit each API signup page
# 2. Create developer accounts  
# 3. Generate API keys
# 4. Add keys to your .env file
```

### **Step 2: Test Integration (5 minutes)**
```bash
# Start dev server
npm run dev

# Open Admin Panel (Ctrl+Shift+A)
# Look for new "🔍 Multi-Platform Search" button
# Test search across all APIs
```

### **Step 3: Import Diverse Content (10 minutes)**
```bash
# In Admin Panel:
# 1. Click "📥 Import from External APIs" 
# 2. Search for "business templates"
# 3. Verify platform distribution shows:
#    - Pexels: ~33%
#    - Pixabay: ~33% 
#    - Unsplash: ~33%
# 4. Import templates and verify diversity
```

---

## 📊 **Expected Results**

### **Before Integration**:
- Unsplash: 720 templates (94%)
- Others: 40+ templates (6%)
- **TOTAL BIAS**: 94% single platform

### **After Phase 1 Integration**:
- Pexels: ~240 templates (30%)
- Pixabay: ~240 templates (30%) 
- Unsplash: ~240 templates (30%)
- Existing Others: 80+ templates (10%)
- **TOTAL DIVERSITY**: 70% multi-platform ✅

---

## ⚡ **Quick Setup Commands**

```bash
# 1. Copy the external API service (already created)
# ✅ src/lib/services/externalApiService.ts

# 2. Add environment variables to .env:
echo "VITE_PEXELS_API_KEY=your_key_here" >> .env
echo "VITE_PIXABAY_API_KEY=your_key_here" >> .env  
echo "VITE_UNSPLASH_ACCESS_KEY=your_key_here" >> .env

# 3. Install any missing dependencies
npm install

# 4. Test the integration
npm run dev
```

---

## 🔥 **Phase 2: Premium APIs (Optional - Week 2)**

If you want even more diversity, add these premium APIs:

### **Freepik API** (Design Templates)
- **Cost**: $10-50/month
- **Content**: Vectors, PSDs, templates
- **ROI**: High - design-focused content

### **Adobe Stock API** (Professional Content)
- **Cost**: $30-100/month  
- **Content**: Premium photos, videos, templates
- **ROI**: High - professional quality

### **Shutterstock API** (Massive Library)
- **Cost**: $29-199/month
- **Content**: 400M+ assets
- **ROI**: Medium - large volume

---

## 🎛 **Integration Architecture**

```
ViewsBoost Template Importer
├── Local JSON Files (existing)
├── External API Service (NEW)
│   ├── Pexels API ────────────► Photos & Videos
│   ├── Pixabay API ───────────► Photos & Vectors  
│   ├── Unsplash API ──────────► Photos (improved)
│   ├── Freepik API ───────────► Design Templates (optional)
│   └── Adobe Stock API ───────► Premium Content (optional)
└── Unified Import Pipeline ───► Firestore Database
```

---

## 🔧 **Admin Panel Features Added**

- **🔍 Multi-Platform Search**: Search across all APIs simultaneously
- **📊 Platform Distribution Analytics**: Real-time bias monitoring  
- **📥 Bulk External Import**: Import from multiple sources at once
- **⚠️ Bias Warning System**: Alerts when single platform >50%
- **📈 API Quota Monitoring**: Track usage across all services

---

## ✅ **Success Metrics**

- [ ] API keys configured for 3+ platforms
- [ ] Platform distribution < 50% any single source
- [ ] Successfully import 100+ diverse templates
- [ ] Admin panel shows balanced analytics
- [ ] No rate limit errors during testing
- [ ] Template quality maintained across sources

---

## 🆘 **Troubleshooting**

### **"API Key Invalid" Errors**
```bash
# Check environment variables loaded
console.log(process.env.VITE_PEXELS_API_KEY)

# Restart dev server after adding .env variables
npm run dev
```

### **Rate Limit Errors**
```bash
# Check rate limiting in console
# Pexels: Max 200/hour
# Pixabay: Max 100/minute
# Reduce concurrent requests if hitting limits
```

### **CORS Errors**
```bash
# Some APIs require server-side proxy
# Consider adding proxy endpoints in functions/ if needed
```

---

**🎯 Next Action**: Get your first API key from Pexels (takes 2 minutes) and test the integration! 