# Template Preview Testing Guide

## 🎯 **COMPREHENSIVE TESTING CHECKLIST**

This guide will help you test all template preview functionality for videos, images, and documents.

### **🚀 Prerequisites**
1. Dev server running on `http://localhost:5173/`
2. Browser console open (F12 → Console tab)
3. Clear browser cache if needed (Ctrl+Shift+R)

---

## **📹 VIDEO TEMPLATE TESTING**

### **Test 1: TikTok Video Templates**
1. Navigate to: `http://localhost:5173/category/TikTok%20Video`
2. Wait for templates to load
3. **Click on the first template**
4. **✅ EXPECTED:** Preview modal opens (NOT navigation to video URL)
5. **✅ CHECK:** Modal shows template details, aspect ratio info
6. **✅ CHECK:** "Edit Template" button present
7. **✅ CHECK:** URL remains on category page (no `/videos/` in URL)
8. Close modal and repeat with 2-3 more templates

### **Test 2: YouTube Video Templates**
1. Navigate to: `http://localhost:5173/category/YouTube%20Video`
2. Repeat same steps as TikTok Video test
3. **✅ EXPECTED:** All templates open preview modal correctly

### **🔍 Video Template Debug Commands**
Run in browser console:
```javascript
// Check for video navigation issues
console.log('Current URL:', window.location.href);
document.querySelectorAll('video').forEach((video, i) => {
  console.log(`Video ${i}:`, video.src, 'Events:', video.onclick);
});
```

---

## **🖼️ IMAGE TEMPLATE TESTING**

### **Test 3: Instagram Post Templates**
1. Navigate to: `http://localhost:5173/category/Instagram%20Post`
2. **Click on the first template**
3. **✅ EXPECTED:** Preview modal opens with square (1:1) format info
4. **✅ CHECK:** "Edit Template" button navigates to `/editor/square`
5. Test 2-3 more templates

### **Test 4: Instagram Story Templates**
1. Navigate to: `http://localhost:5173/category/Instagram%20Story`
2. **Click on templates**
3. **✅ EXPECTED:** Preview modal shows vertical (9:16) format info
4. **✅ CHECK:** "Edit Template" button navigates to `/editor/story`

### **Test 5: Facebook Post Templates**
1. Navigate to: `http://localhost:5173/category/Facebook%20Post`
2. Test template clicks
3. **✅ EXPECTED:** Preview modal opens correctly

---

## **📄 DOCUMENT TEMPLATE TESTING**

### **Test 6: Business Templates**
1. Navigate to: `http://localhost:5173/category/Business`
2. **Click on templates**
3. **✅ EXPECTED:** Preview modal opens with document format info
4. **✅ CHECK:** Edit button works correctly

### **Test 7: Presentation Templates**
1. Navigate to: `http://localhost:5173/category/Presentation`
2. Test template preview functionality
3. **✅ EXPECTED:** All document templates work correctly

---

## **🧪 AUTOMATED TESTING**

### **Browser Console Test**
1. Navigate to any category page
2. Open browser console (F12)
3. Copy and paste the content from `test-template-previews.js`
4. Press Enter to run the comprehensive test
5. **✅ EXPECTED:** 90%+ pass rate

### **Manual Click Test**
Run this in console on any category page:
```javascript
// Quick manual test
const cards = document.querySelectorAll('[data-testid="template-card"]');
console.log(`Found ${cards.length} template cards`);
if (cards.length > 0) {
  console.log('Testing first template...');
  const urlBefore = window.location.href;
  cards[0].click();
  setTimeout(() => {
    const modal = document.querySelector('.fixed.inset-0.z-\\[10000\\]');
    const urlAfter = window.location.href;
    console.log('Modal opened:', !!modal);
    console.log('URL changed:', urlBefore !== urlAfter);
    console.log('Navigated to video:', urlAfter.includes('/videos/'));
  }, 1000);
}
```

---

## **🚨 TROUBLESHOOTING**

### **❌ Problem: Templates navigate to video URLs**
**Symptoms:** URL changes to `localhost:5173/videos/filename.mp4`
**Solution:** 
- Clear browser cache
- Restart dev server
- Check console for errors

### **❌ Problem: Modal doesn't open**
**Symptoms:** Nothing happens when clicking templates
**Solutions:**
- Check browser console for JavaScript errors
- Verify `data-testid="template-card"` exists on template cards
- Check if `TemplatePreviewModal` is imported correctly

### **❌ Problem: Edit Template button doesn't work**
**Symptoms:** Button exists but doesn't navigate to editor
**Solutions:**
- Verify editor routes are loaded in `App.tsx`
- Check sessionStorage for template data
- Verify `TemplateEditor.tsx` exists

---

## **✅ SUCCESS CRITERIA**

**🎉 ALL TESTS PASS IF:**
1. **Video templates** open preview modal (no navigation to video URLs)
2. **Image templates** show correct aspect ratio info
3. **Document templates** preview correctly
4. **Edit Template buttons** work for all template types
5. **No JavaScript errors** in console
6. **URL stays on category page** when clicking templates
7. **Modals close properly** when clicking outside or close button

---

## **📊 EXPECTED RESULTS**

After running all tests, you should see:
- **VIDEO**: 90-100% success rate
- **IMAGE**: 90-100% success rate  
- **DOCUMENT**: 90-100% success rate
- **NAVIGATION**: 100% success rate (no unwanted URL changes)

**🎯 OVERALL TARGET: 95%+ success rate across all template types** 