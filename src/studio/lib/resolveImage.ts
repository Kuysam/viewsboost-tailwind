import { getDownloadURL, ref as sRef } from 'firebase/storage';
import { storage } from '../../lib/firebase';

export async function resolveImageProps(input: any): Promise<any> {
  const props = { ...(input || {}) };
  // Accept different keys from older data
  let src: string | null =
    props.src || props.url || props.downloadURL || null;

  // If we only have a Storage path, fetch a signed URL
  const pathKey = props.path || props.filePath || null;
  if (!src && pathKey) {
    try {
      src = await getDownloadURL(sRef(storage, String(pathKey)));
    } catch (e) {
      console.warn('Failed to resolve getDownloadURL for', pathKey, e);
    }
  }

  return { ...props, src };
}
