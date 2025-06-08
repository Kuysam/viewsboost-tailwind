import { getNextApiKey, BASE_URL } from "../youtube";
import { handleAPIError, APIError, ErrorMessages } from "../errorHandling";

export async function getUploadsPlaylistId(channelId: string): Promise<string> {
  try {
    const url = `${BASE_URL}/channels?part=contentDetails&id=${channelId}&key=${getNextApiKey()}`;
    const res = await fetch(url);
    if (!res.ok) throw new APIError('Failed to fetch channel contentDetails', res.status);
    const data = await res.json();
    const item = data.items?.[0];
    if (!item) throw new APIError(ErrorMessages.NOT_FOUND, 404);
    return item.contentDetails.relatedPlaylists.uploads;
  } catch (error) {
    throw handleAPIError(error);
  }
}
