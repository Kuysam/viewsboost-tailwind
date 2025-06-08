import { getNextApiKey, BASE_URL } from "../youtube";

function parseISODuration(duration: string): number {
  const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
  const matches = duration.match(regex);
  const hours = parseInt(matches?.[1] || '0', 10);
  const minutes = parseInt(matches?.[2] || '0', 10);
  const seconds = parseInt(matches?.[3] || '0', 10);
  return hours * 3600 + minutes * 60 + seconds;
}

export async function getVideoDurations(videoIds: string[]): Promise<Record<string, number>> {
  const durations: Record<string, number> = {};
  const chunks = [];
  for (let i = 0; i < videoIds.length; i += 50) {
    chunks.push(videoIds.slice(i, i + 50));
  }

  for (const chunk of chunks) {
    const res = await fetch(
      `${BASE_URL}/videos?part=contentDetails&id=${chunk.join(',')}&key=${getNextApiKey()}`
    );
    const json = await res.json();
    for (const item of json.items || []) {
      durations[item.id] = parseISODuration(item.contentDetails.duration);
    }
  }

  return durations;
}
