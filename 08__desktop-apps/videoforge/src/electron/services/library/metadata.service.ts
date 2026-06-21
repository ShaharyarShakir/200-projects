import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const ffprobePath = require("ffprobe-static");

if (ffmpegPath) {
    ffmpeg.setFfmpegPath(ffmpegPath);
}

if (ffprobePath && ffprobePath.path) {
    ffmpeg.setFfprobePath(ffprobePath.path);
}

export async function getMetadata(filePath: string): Promise<ffmpeg.FfprobeData> {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(filePath, (err, metadata) => {
            if (err) return reject(err);
            resolve(metadata);
        });
    });
}
