import { spawn } from "child_process";
import { PlaylistData, PlaylistItem } from "./playlist.types";

export async function getPlaylist(url: string): Promise<PlaylistData> {
  return new Promise((resolve, reject) => {
    let output = "";
    let errorOutput = "";

    const proc = spawn("yt-dlp", [
      "--flat-playlist",
      "-J",
      url,
    ]);

    proc.stdout.on("data", (data) => {
      output += data.toString();
    });

    proc.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    proc.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(errorOutput.trim() || `yt-dlp exited with code ${code}`));
        return;
      }

      try {
        const raw = JSON.parse(output);

        // Map entries safely
        const entries: PlaylistItem[] = (raw.entries || []).map((entry: any) => {
          let videoUrl = entry.url;
          if (!videoUrl && entry.id) {
            videoUrl = `https://www.youtube.com/watch?v=${entry.id}`;
          }
          return {
            id: entry.id || String(Math.random()),
            title: entry.title || "Untitled Video",
            url: videoUrl || "",
            duration: entry.duration,
          };
        }).filter((entry: PlaylistItem) => entry.url);

        const playlist: PlaylistData = {
          id: raw.id || url,
          title: raw.title || "Untitled Playlist",
          uploader: raw.uploader || raw.author || "Unknown Uploader",
          thumbnail: raw.thumbnail || (raw.thumbnails && raw.thumbnails.length > 0 ? raw.thumbnails[raw.thumbnails.length - 1].url : undefined),
          entries,
        };

        resolve(playlist);
      } catch (err) {
        reject(new Error("Failed to parse playlist JSON. Ensure the URL is valid."));
      }
    });
  });
}
