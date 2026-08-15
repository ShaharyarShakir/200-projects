<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue'
import Hls from 'hls.js'
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  RotateCcw,
  RotateCw,
  Loader2,
  Tv2,
  Settings,
  Sparkles
} from 'lucide-vue-next'

const props = defineProps<{
  src: string
  title?: string
  initialTime?: number
  autoplay?: boolean
}>()

const emit = defineEmits<{
  (e: 'timeupdate', currentTime: number): void
  (e: 'pause', currentTime: number): void
  (e: 'ended'): void
}>()

const containerRef = ref<HTMLElement | null>(null)
const videoRef = ref<HTMLVideoElement | null>(null)
let hlsInstance: Hls | null = null

// Player State
const isPlaying = ref(false)
const isBuffering = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const bufferedProgress = ref(0)
const volume = ref(1)
const isMuted = ref(false)
const playbackRate = ref(1)
const isFullscreen = ref(false)
const showControls = ref(true)
const showSpeedMenu = ref(false)
const hasError = ref(false)
const errorMessage = ref('')

let hideControlsTimeout: ReturnType<typeof setTimeout> | null = null

const playbackRates = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0]

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  const hrs = Math.floor(mins / 60)
  const remMins = mins % 60

  if (hrs > 0) {
    return `${hrs.toString().padStart(2, '0')}:${remMins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

function loadVideo() {
  if (!videoRef.value || !props.src) return

  hasError.value = false
  errorMessage.value = ''
  isBuffering.value = true

  if (hlsInstance) {
    hlsInstance.destroy()
    hlsInstance = null
  }

  const { academy } = useAcademy()
  const academyId = academy.value?.id

  if (Hls.isSupported()) {
    hlsInstance = new Hls({
      xhrSetup: (xhr) => {
        xhr.withCredentials = true
        if (academyId) {
          xhr.setRequestHeader('X-Tenant-ID', academyId)
        }
      }
    })

    hlsInstance.loadSource(props.src)
    hlsInstance.attachMedia(videoRef.value)

    hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
      isBuffering.value = false
      if (props.initialTime && videoRef.value) {
        videoRef.value.currentTime = props.initialTime
      }
      if (props.autoplay && videoRef.value) {
        videoRef.value.play().catch(() => {
          isPlaying.value = false
        })
      }
    })

    hlsInstance.on(Hls.Events.ERROR, (_event, data) => {
      if (data.fatal) {
        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            hlsInstance?.startLoad()
            break
          case Hls.ErrorTypes.MEDIA_ERROR:
            hlsInstance?.recoverMediaError()
            break
          default:
            hasError.value = true
            errorMessage.value = 'Failed to load video stream.'
            hlsInstance?.destroy()
            break
        }
      }
    })
  } else if (videoRef.value.canPlayType('application/vnd.apple.mpegurl')) {
    videoRef.value.src = props.src
    isBuffering.value = false
    if (props.initialTime) {
      videoRef.value.currentTime = props.initialTime
    }
  } else {
    hasError.value = true
    errorMessage.value = 'HLS video playback is not supported in this browser.'
  }
}

// Controls logic
function togglePlay() {
  if (!videoRef.value) return
  if (isPlaying.value) {
    videoRef.value.pause()
  } else {
    videoRef.value.play()
  }
}

function seek(seconds: number) {
  if (!videoRef.value) return
  videoRef.value.currentTime = Math.max(0, Math.min(seconds, duration.value))
}

function skip(seconds: number) {
  if (!videoRef.value) return
  seek(videoRef.value.currentTime + seconds)
}

function handleProgressScrub(e: MouseEvent) {
  const bar = e.currentTarget as HTMLElement
  if (!bar) return
  const rect = bar.getBoundingClientRect()
  const pos = (e.clientX - rect.left) / rect.width
  seek(pos * duration.value)
}

function toggleMute() {
  if (!videoRef.value) return
  videoRef.value.muted = !videoRef.value.muted
  isMuted.value = videoRef.value.muted
}

function setVolume(val: number) {
  if (!videoRef.value) return
  volume.value = val
  videoRef.value.volume = val
  videoRef.value.muted = val === 0
  isMuted.value = val === 0
}

function setSpeed(rate: number) {
  playbackRate.value = rate
  if (videoRef.value) {
    videoRef.value.playbackRate = rate
  }
  showSpeedMenu.value = false
}

async function togglePiP() {
  if (!videoRef.value) return
  try {
    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture()
    } else {
      await videoRef.value.requestPictureInPicture()
    }
  } catch (err) {
    console.error('PiP error:', err)
  }
}

function toggleFullscreen() {
  if (!containerRef.value) return
  if (!document.fullscreenElement) {
    containerRef.value.requestFullscreen().catch((err) => {
      console.error('Fullscreen error:', err)
    })
    isFullscreen.value = true
  } else {
    document.exitFullscreen()
    isFullscreen.value = false
  }
}

function handleMouseMove() {
  showControls.value = true
  if (hideControlsTimeout) clearTimeout(hideControlsTimeout)
  if (isPlaying.value) {
    hideControlsTimeout = setTimeout(() => {
      showControls.value = false
      showSpeedMenu.value = false
    }, 3000)
  }
}

function handleKeyDown(e: KeyboardEvent) {
  if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return

  switch (e.key.toLowerCase()) {
    case ' ':
    case 'k':
      e.preventDefault()
      togglePlay()
      break
    case 'f':
      e.preventDefault()
      toggleFullscreen()
      break
    case 'm':
      e.preventDefault()
      toggleMute()
      break
    case 'arrowleft':
      e.preventDefault()
      skip(-10)
      break
    case 'arrowright':
      e.preventDefault()
      skip(10)
      break
  }
}

// Media Event Handlers
function onPlay() {
  isPlaying.value = true
  isBuffering.value = false
}

function onPause() {
  isPlaying.value = false
  showControls.value = true
  if (videoRef.value) {
    emit('pause', Math.floor(videoRef.value.currentTime))
  }
}

function onTimeUpdate() {
  if (!videoRef.value) return
  currentTime.value = videoRef.value.currentTime
  duration.value = videoRef.value.duration || 0
  emit('timeupdate', Math.floor(currentTime.value))

  // Calculate buffer range progress
  if (videoRef.value.buffered.length > 0) {
    const end = videoRef.value.buffered.end(videoRef.value.buffered.length - 1)
    bufferedProgress.value = (end / duration.value) * 100
  }
}

function onWaiting() {
  isBuffering.value = true
}

function onPlaying() {
  isBuffering.value = false
}

function onEnded() {
  isPlaying.value = false
  showControls.value = true
  emit('ended')
}

onMounted(() => {
  loadVideo()
  window.addEventListener('keydown', handleKeyDown)
  document.addEventListener('fullscreenchange', () => {
    isFullscreen.value = !!document.fullscreenElement
  })
})

watch(() => props.src, () => {
  loadVideo()
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyDown)
  if (hideControlsTimeout) clearTimeout(hideControlsTimeout)
  if (hlsInstance) {
    hlsInstance.destroy()
    hlsInstance = null
  }
})
</script>

<template>
  <div
    ref="containerRef"
    @mousemove="handleMouseMove"
    @mouseleave="showControls = !isPlaying"
    class="relative w-full aspect-video bg-[#05030a] rounded-3xl overflow-hidden shadow-2xl border border-purple-900/50 group select-none font-sans"
  >
    <!-- HTML5 Video Element -->
    <video
      ref="videoRef"
      playsinline
      class="w-full h-full object-contain cursor-pointer"
      @click="togglePlay"
      @play="onPlay"
      @pause="onPause"
      @timeupdate="onTimeUpdate"
      @waiting="onWaiting"
      @playing="onPlaying"
      @ended="onEnded"
    ></video>

    <!-- Ambient Gradient Overlays -->
    <div
      class="absolute inset-0 bg-gradient-to-t from-[#0c0919]/90 via-transparent to-[#0c0919]/40 pointer-events-none transition-opacity duration-300"
      :class="showControls || !isPlaying ? 'opacity-100' : 'opacity-0'"
    ></div>

    <!-- Error Display -->
    <div v-if="hasError" class="absolute inset-0 bg-[#0c0919]/95 flex flex-col items-center justify-center p-6 text-center space-y-3 z-30">
      <div class="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center font-bold">
        !
      </div>
      <h4 class="text-white font-black text-lg uppercase tracking-tight">Playback Error</h4>
      <p class="text-slate-400 text-xs max-w-sm">{{ errorMessage }}</p>
      <button @click="loadVideo" class="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all">
        Retry Playback
      </button>
    </div>

    <!-- Loading / Buffering Spinner -->
    <div v-if="isBuffering && !hasError" class="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
      <div class="p-4 bg-[#0c0919]/80 backdrop-blur-xl border border-purple-500/30 rounded-full shadow-2xl">
        <Loader2 class="w-8 h-8 text-yellow-400 animate-spin" />
      </div>
    </div>

    <!-- Center Play/Pause Overlay Icon on click/hover -->
    <div
      v-if="!isPlaying && !isBuffering && !hasError"
      @click="togglePlay"
      class="absolute inset-0 flex items-center justify-center cursor-pointer z-20 group-hover:scale-105 transition-transform"
    >
      <div class="w-20 h-20 rounded-full bg-gradient-to-tr from-yellow-400 to-amber-500 text-[#0c0919] flex items-center justify-center shadow-2xl shadow-yellow-500/40 hover:scale-110 active:scale-95 transition-all">
        <Play class="w-9 h-9 fill-current ml-1" />
      </div>
    </div>

    <!-- Video Title Header Bar -->
    <div
      v-if="props.title"
      class="absolute top-0 left-0 right-0 p-6 flex items-center justify-between z-20 transition-opacity duration-300"
      :class="showControls || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'"
    >
      <div class="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0c0919]/80 backdrop-blur-md border border-purple-500/30 text-white text-xs font-bold truncate max-w-md">
        <Sparkles class="w-3.5 h-3.5 text-yellow-400 shrink-0" />
        <span class="truncate">{{ props.title }}</span>
      </div>
    </div>

    <!-- Custom Cosmic Controls Bottom Bar -->
    <div
      class="absolute bottom-0 left-0 right-0 p-4 sm:p-6 space-y-3 z-20 transition-all duration-300"
      :class="showControls || !isPlaying ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'"
    >
      <!-- Progress Bar Slider -->
      <div
        @click="handleProgressScrub"
        class="relative w-full h-2 hover:h-3 bg-purple-950/80 rounded-full cursor-pointer overflow-hidden transition-all group/bar"
      >
        <!-- Buffered Progress Bar -->
        <div
          class="absolute top-0 bottom-0 left-0 bg-purple-600/40 rounded-full transition-all"
          :style="{ width: `${bufferedProgress}%` }"
        ></div>

        <!-- Played Progress Bar -->
        <div
          class="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full"
          :style="{ width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' }"
        >
          <div class="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-yellow-300 rounded-full shadow-lg scale-0 group-hover/bar:scale-100 transition-transform"></div>
        </div>
      </div>

      <!-- Action Buttons Row -->
      <div class="flex items-center justify-between text-slate-200">
        <div class="flex items-center gap-2 sm:gap-4">
          <!-- Play / Pause -->
          <button
            @click="togglePlay"
            class="p-2 rounded-xl hover:bg-white/10 text-white hover:text-yellow-400 transition-all cursor-pointer"
            :title="isPlaying ? 'Pause (Space)' : 'Play (Space)'"
          >
            <Pause v-if="isPlaying" class="w-5 h-5 fill-current" />
            <Play v-else class="w-5 h-5 fill-current" />
          </button>

          <!-- Skip Back / Forward -->
          <button @click="skip(-10)" class="p-2 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition-all cursor-pointer" title="Skip -10s">
            <RotateCcw class="w-4 h-4" />
          </button>
          <button @click="skip(10)" class="p-2 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition-all cursor-pointer" title="Skip +10s">
            <RotateCw class="w-4 h-4" />
          </button>

          <!-- Volume Controls -->
          <div class="flex items-center gap-2 group/vol">
            <button @click="toggleMute" class="p-2 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition-all cursor-pointer" title="Mute (M)">
              <VolumeX v-if="isMuted || volume === 0" class="w-5 h-5 text-rose-400" />
              <Volume2 v-else class="w-5 h-5" />
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              :value="isMuted ? 0 : volume"
              @input="(e) => setVolume(parseFloat((e.target as HTMLInputElement).value))"
              class="w-16 sm:w-20 h-1 bg-purple-900 rounded-lg appearance-none cursor-pointer accent-yellow-400 opacity-80 group-hover/vol:opacity-100 transition-opacity"
            />
          </div>

          <!-- Time Indicator -->
          <div class="text-xs font-mono text-slate-300 font-semibold ml-2 select-none">
            <span class="text-yellow-400 font-bold">{{ formatTime(currentTime) }}</span>
            <span class="text-slate-500 mx-1">/</span>
            <span>{{ formatTime(duration) }}</span>
          </div>
        </div>

        <!-- Right Side Controls: Speed, PiP, Fullscreen -->
        <div class="flex items-center gap-2 relative">
          <!-- Playback Speed Menu -->
          <div class="relative">
            <button
              @click="showSpeedMenu = !showSpeedMenu"
              class="px-2.5 py-1.5 rounded-xl hover:bg-white/10 text-xs font-mono font-bold text-slate-300 hover:text-yellow-400 transition-all flex items-center gap-1 cursor-pointer"
            >
              <span>{{ playbackRate }}x</span>
              <Settings class="w-3.5 h-3.5" />
            </button>

            <!-- Speed Options Dropdown -->
            <div
              v-if="showSpeedMenu"
              class="absolute bottom-full right-0 mb-2 w-28 bg-[#0c0919]/95 backdrop-blur-xl border border-purple-500/40 rounded-2xl shadow-2xl p-1.5 space-y-0.5 z-30"
            >
              <button
                v-for="rate in playbackRates"
                :key="rate"
                @click="setSpeed(rate)"
                class="w-full text-left px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center justify-between cursor-pointer"
                :class="playbackRate === rate ? 'bg-yellow-400 text-[#0c0919]' : 'text-slate-300 hover:bg-white/10'"
              >
                <span>{{ rate }}x</span>
                <span v-if="playbackRate === rate" class="text-[10px] font-sans font-black">✓</span>
              </button>
            </div>
          </div>

          <!-- Picture in Picture -->
          <button @click="togglePiP" class="p-2 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition-all cursor-pointer" title="Picture in Picture">
            <Tv2 class="w-4 h-4" />
          </button>

          <!-- Fullscreen -->
          <button @click="toggleFullscreen" class="p-2 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition-all cursor-pointer" title="Fullscreen (F)">
            <Minimize v-if="isFullscreen" class="w-5 h-5 text-yellow-400" />
            <Maximize v-else class="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Custom range slider styling */
input[type='range']::-webkit-slider-thumb {
  appearance: none;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #facc15;
  cursor: pointer;
}
</style>
