#!/usr/bin/env bash

set -euo pipefail

INPUT="/work/input/original.mp4"
OUTPUT="/work/output"

mkdir -p "$OUTPUT"

echo "Starting HLS processing..."

ffmpeg \
  -i "$INPUT" \
  -filter_complex "\
    [0:v]split=4[v1080][v720][v480][v360]; \
    [v1080]scale=w=1920:h=-2[v1080out]; \
    [v720]scale=w=1280:h=-2[v720out]; \
    [v480]scale=w=854:h=-2[v480out]; \
    [v360]scale=w=640:h=-2[v360out]" \
  \
  -map "[v1080out]" -map 0:a? \
  -c:v:0 libx264 -b:v:0 5000k \
  -c:a:0 aac -b:a:0 128k \
  \
  -map "[v720out]" -map 0:a? \
  -c:v:1 libx264 -b:v:1 3000k \
  -c:a:1 aac -b:a:1 128k \
  \
  -map "[v480out]" -map 0:a? \
  -c:v:2 libx264 -b:v:2 1500k \
  -c:a:2 aac -b:a:2 96k \
  \
  -map "[v360out]" -map 0:a? \
  -c:v:3 libx264 -b:v:3 800k \
  -c:a:3 aac -b:a:3 96k \
  \
  -f hls \
  -hls_time 6 \
  -hls_playlist_type vod \
  -hls_segment_filename "$OUTPUT/segment_%v_%03d.ts" \
  -master_pl_name master.m3u8 \
  -var_stream_map "v:0,a:0 v:1,a:1 v:2,a:2 v:3,a:3" \
  "$OUTPUT/stream_%v.m3u8"

echo "Processing completed."
