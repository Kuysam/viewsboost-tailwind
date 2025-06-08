import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Video } from './videoService';

/**
 * Parses ISO 8601 duration strings (e.g., "PT5M33S") into total seconds.
 */
function parseISODuration(iso: string): number {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  const seconds = parseInt(match[3] || '0');
  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Determines the type of video: "short", "live", or "video".
 */
function getVideoType(details: any): 'short' | 'live' | 'video' {
  const durationSec = parseISODuration(details.contentDetails?.duration || '');
  const isShort =
    durationSec < 60 &&
    (details.snippet?.title?.toLowerCase().includes('short') ||
      (details.snippet?.thumbnails?.maxres?.height >
        details.snippet?.thumbnails?.maxres?.width));
  if (isShort) return 'short';
  if (
    details.snippet?.liveBroadcastContent === 'live' ||
    details.liveStreamingDetails
  )
    return 'live';
  return 'video';
}

/**
 * Caches video metadata in Firestore for fast lookups and reduced API usage.
 */
export async function storeVideoMetadata(
  video: Video & { rawDetails?: any } // now accepts raw YouTube details too
) {
  if (!video?.id) {
    console.warn('⚠️ Invalid video object passed to storeVideoMetadata.');
    return;
  }

  try {
    const ref = doc(db, 'videoMetadata', video.id);

    await setDoc(
      ref,
      {
        id: video.id,
        title: video.title || 'Untitled',
        thumbnail:
          video.thumbnail ||
          `https://img.youtube.com/vi/${video.id}/hqdefault.jpg`,
        duration: video.duration || 0,
        updatedAt: serverTimestamp(),
        type: video.rawDetails ? getVideoType(video.rawDetails) : (video.type || 'video'),
        source: 'youtube',
      },
      { merge: true }
    );
  } catch (err) {
    console.error(`❌ Failed to cache metadata for video ${video.id}:`, err);
  }
}
