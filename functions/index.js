const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();
const bucket = admin.storage().bucket();

// Auto-update template video URLs when new templates are created
exports.autoUpdateTemplateVideos = functions.firestore
  .document('templates/{templateId}')
  .onCreate(async (snap, context) => {
    const templateData = snap.data();
    const templateId = context.params.templateId;
    
    console.log('New template created:', templateId, 'title:', templateData.title);
    
    // Skip if template already has a videoSource
    if (templateData.videoSource && templateData.videoSource.startsWith('https://')) {
      console.log('Template', templateId, 'already has videoSource, skipping');
      return null;
    }
    
    // Skip if no title
    if (!templateData.title) {
      console.log('Template', templateId, 'has no title, skipping');
      return null;
    }
    
    try {
      // Look for matching video file in Storage
      const videoPath = 'Templates/Video/' + templateData.title + '.mp4';
      const file = bucket.file(videoPath);
      
      // Check if the video file exists
      const [exists] = await file.exists();
      if (!exists) {
        console.log('No video found at', videoPath, 'for template', templateId);
        return null;
      }
      
      // Generate public URL for the video
      const [url] = await file.getSignedUrl({
        action: 'read',
        expires: '03-01-2500' // Far future expiration
      });
      
      // Update the template with video URLs
      await snap.ref.update({
        videoSource: url,
        preview: url,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log('Successfully updated template', templateId, 'with video URL:', url);
      return null;
      
    } catch (error) {
      console.error('Error updating template', templateId, ':', error);
      return null;
    }
  });

// Track YouTube API quota usage
exports.logApiUsage = functions.https.onCall(async (data, context) => {
  const { keyUsed } = data;
  const today = new Date().toISOString().split("T")[0];

  const ref = db.collection("usage").doc(today);
  await db.runTransaction(async (t) => {
    const doc = await t.get(ref);
    const existing = doc.exists ? doc.data().quota || {} : {};
    const updated = {
      ...existing,
      [keyUsed]: (existing[keyUsed] || 0) + 1,
    };
    t.set(ref, { quota: updated }, { merge: true });
  });

  return { success: true };
});

// Track user login
exports.logLogin = functions.https.onCall(async (data, context) => {
  const uid = context.auth?.uid;
  if (!uid) {
    throw new functions.https.HttpsError("unauthenticated", "User not logged in");
  }

  const today = new Date().toISOString().split("T")[0];
  const ref = db.collection("usage").doc(today);
  await db.runTransaction(async (t) => {
    const doc = await t.get(ref);
    const logins = doc.exists ? doc.data().logins || 0 : 0;
    t.set(ref, { logins: logins + 1 }, { merge: true });
  });

  return { success: true };
}); 