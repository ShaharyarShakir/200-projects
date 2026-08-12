<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import Hls from 'hls.js'

const props = defineProps<{
  src: string
  initialTime?: number
}>()

const emit = defineEmits<{
  (e: 'timeupdate', currentTime: number): void
  (e: 'pause', currentTime: number): void
  (e: 'ended'): void
}>()

const videoRef = ref<HTMLVideoElement | null>(null)
let hlsInstance: Hls | null = null

function loadVideo() {
  if (!videoRef.value || !props.src) return

  if (hlsInstance) {
    hlsInstance.destroy()
    hlsInstance = null
  }

  if (Hls.isSupported()) {
    hlsInstance = new Hls()
    hlsInstance.loadSource(props.src)
    hlsInstance.attachMedia(videoRef.value)
    hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
      if (props.initialTime && videoRef.value) {
        videoRef.value.currentTime = props.initialTime
      }
    })
  } else if (videoRef.value.canPlayType('application/vnd.apple.mpegurl')) {
    videoRef.value.src = props.src
    if (props.initialTime) {
      videoRef.value.currentTime = props.initialTime
    }
  }
}

function onTimeUpdate() {
  if (videoRef.value) {
    emit('timeupdate', Math.floor(videoRef.value.currentTime))
  }
}

function onPause() {
  if (videoRef.value) {
    emit('pause', Math.floor(videoRef.value.currentTime))
  }
}

function onEnded() {
  emit('ended')
}

onMounted(() => {
  loadVideo()
})

watch(() => props.src, () => {
  loadVideo()
})

onBeforeUnmount(() => {
  if (hlsInstance) {
    hlsInstance.destroy()
    hlsInstance = null
  }
})
</script>

<template>
  <div class="video-container">
    <video
      ref="videoRef"
      controls
      playsinline
      class="video-element"
      @timeupdate="onTimeUpdate"
      @pause="onPause"
      @ended="onEnded"
    ></video>
  </div>
</template>

<style scoped>
.video-container {
  width: 100%;
  aspect-ratio: 16 / 9;
  background-color: #000;
  border-radius: 8px;
  overflow: hidden;
}

.video-element {
  width: 100%;
  height: 100%;
}
</style>
