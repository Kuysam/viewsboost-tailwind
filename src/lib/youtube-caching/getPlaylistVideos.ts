import { getNextApiKey, BASE_URL } from "../youtube";
import { handleAPIError, APIError } from "../errorHandling";

export async function getPlaylistVideos(playlistId: string, pageToken = "") {
  try {
    const url = new URL(`${BASE_URL}/playlistItems`);
    url.searchParams.set("part", "snippet");
    url.searchParams.set("playlistId", playlistId);
    url.searchParams.set("maxResults", "50");
    url.searchParams.set("key", getNextApiKey());
    if (pageToken) url.searchParams.set("pageToken", pageToken);

    const res = await fetch(url.toString());
    if (!res.ok) throw new APIError("Failed to fetch playlist videos", res.status);
    const data = await res.json();
    return data.items.map((item: any) => ({
      id: item.snippet.resourceId.videoId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails.medium.url,
    }));
  } catch (error) {
    throw handleAPIError(error);
  }
}
