import { getUploadsPlaylistId } from './lib/youtube';
import 'dotenv/config';


(async () => {
  const channelId = 'UC8qWBvVShlZkIx8WCHYOz4g';

  try {
    const playlistId = await getUploadsPlaylistId(channelId);
    console.log('✅ Uploads Playlist ID:', playlistId);
  } catch (err) {
    console.error('❌ Error fetching uploads playlist ID:', err);
  }
})();
