import express from "express";
import cors from "cors";
import multer from "multer";
import path from "node:path";
import { v4 as uuidv4 } from "uuid";
import fs from "node:fs";
import { exec } from "node:child_process";
import { stderr, stdout } from "node:process";

const app = express();

//multer middleware

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads");
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + "-" + uuidv4() + path.extname(file.originalname));
  },
});

// multer config

const upload = multer({ storage: storage });

app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:5173"],
  }),
);

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));

app.get("/health", function (req, res) {
  res.json({ data: "server is running" });
});
app.post("/upload", upload.single("file"), function (req, res) {
  const lessonId = uuidv4();
  const videoPath = req.file.path;
  const outputPath = `./uploads/courses/${lessonId}`;
  const hlsPath = `${outputPath}/index.m3u8`;

  console.log("hls Path: ", hlsPath);

  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true });
  }
  // ffmpeg
  const ffmpegCommand = `ffmpeg -i ${videoPath} -codec:v libx264 -codec:a  aac -hls_time 10 -hls_playlist_type vod -hls_segment_filename "${outputPath}/segement%03d.ts" -start_number 0 ${hlsPath}`;

  exec(ffmpegCommand, (error, stdout, stderr) => {
    if (error) {
      console.log(`exec error: ${error}`);
    }
    console.log(`stdout: ${stdout}`);
    console.log(`stderr: ${stderr}`);
    const videoUrl = `http://localhost:8000/uploads/courses/${lessonId}/index.m3u8`;
    res.json({
      message: "video processed successfully",
      videoUrl: videoUrl,
      lessonId: lessonId,
    });
  });


});
app.listen(8000, () => console.log("server start at port 8000"));
