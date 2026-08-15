<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useApi } from '~/composables/useApi'
import type { VideoAsset } from '~/types/course'
import VideoPlayer from '~/components/player/VideoPlayer.vue'
import { CheckCircle2, Loader2, Upload, AlertCircle, Video, Play, Eye, EyeOff } from 'lucide-vue-next'

const props = defineProps<{
  courseId: string
  sectionId: string
  lessonId: string
  videoAssetId?: string | null
  existingVideoAsset?: VideoAsset | null
}>()

const emit = defineEmits<{
  updated: []
}>()

const api = useApi()
const file = ref<File | null>(null)
const uploading = ref(false)
const processing = ref(false)
const progress = ref(0)
const error = ref('')
const currentStatus = ref<string | null>(props.existingVideoAsset?.status || null)
const duration = ref<number | undefined>(props.existingVideoAsset?.durationSeconds)
const streamUrl = ref<string>('')
const showPreview = ref<boolean>(false)

onMounted(async () => {
  const targetAssetId = props.videoAssetId || props.existingVideoAsset?.id
  if (targetAssetId) {
    await fetchAndPollAsset(targetAssetId)
  }
})

async function fetchAndPollAsset(assetId: string) {
  try {
    const assetInfo: any = await api.request(`/api/video-assets/${assetId}`)
    currentStatus.value = assetInfo.status
    if (assetInfo.duration_seconds) {
      duration.value = assetInfo.duration_seconds
    }
    if (assetInfo.stream_url) {
      streamUrl.value = assetInfo.stream_url.startsWith('http')
        ? assetInfo.stream_url
        : `${api.baseURL}${assetInfo.stream_url}`
    }

    if (assetInfo.status === 'ready') {
      processing.value = false
    } else if (assetInfo.status === 'failed') {
      processing.value = false
      error.value = assetInfo.error_message || 'Video processing failed'
    } else {
      await pollAssetStatus(assetId)
    }
  } catch (err) {
    console.warn('Could not fetch video asset:', err)
  }
}

function selectFile(event: Event) {
  const input = event.target as HTMLInputElement
  file.value = input.files?.[0] ?? null
  error.value = ''
}

function uploadFileWithXHR(url: string, fileToUpload: File): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', url)
    xhr.withCredentials = true
    xhr.setRequestHeader('Content-Type', fileToUpload.type || 'video/mp4')

    const currentTenantState = useState<any>('current-tenant')
    if (currentTenantState.value?.id) {
      xhr.setRequestHeader('X-Tenant-ID', currentTenantState.value.id)
    }

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        progress.value = Math.round((event.loaded / event.total) * 100)
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve()
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`))
      }
    }

    xhr.onerror = () => {
      reject(new Error('Network error during file upload'))
    }

    xhr.send(fileToUpload)
  })
}

async function pollAssetStatus(assetId: string) {
  processing.value = true
  currentStatus.value = 'processing'

  while (processing.value) {
    try {
      const assetInfo: any = await api.request(`/api/video-assets/${assetId}`)
      currentStatus.value = assetInfo.status

      if (assetInfo.status === 'ready') {
        processing.value = false
        duration.value = assetInfo.duration_seconds
        if (assetInfo.stream_url) {
          streamUrl.value = assetInfo.stream_url.startsWith('http')
            ? assetInfo.stream_url
            : `${api.baseURL}${assetInfo.stream_url}`
        }
        emit('updated')
        return
      }

      if (assetInfo.status === 'failed') {
        processing.value = false
        error.value = assetInfo.error_message || 'Video processing failed'
        emit('updated')
        return
      }
    } catch (err) {
      console.warn('Error polling asset status:', err)
    }

    await new Promise(resolve => setTimeout(resolve, 3000))
  }
}

async function startUpload() {
  if (!file.value) return

  uploading.value = true
  progress.value = 0
  error.value = ''

  try {
    const res: any = await api.request('/api/video-assets', {
      method: 'POST',
      body: {
        course_id: props.courseId,
        section_id: props.sectionId,
        lesson_id: props.lessonId,
        filename: file.value.name,
        mime_type: file.value.type || 'video/mp4'
      }
    })

    const assetId = res.asset_id
    const targetUrl = `${api.baseURL}/api/video-assets/${assetId}/upload`

    // Stream upload directly through backend API
    await uploadFileWithXHR(targetUrl, file.value)

    // Complete upload
    await api.request(`/api/video-assets/${assetId}/complete`, {
      method: 'POST'
    })

    uploading.value = false
    await pollAssetStatus(assetId)
  } catch (err: any) {
    uploading.value = false
    processing.value = false
    error.value = err.data?.message || err.message || 'Video upload failed'
  }
}
</script>

<template>
  <div class="space-y-3 pt-2">
    <!-- Status: Ready -->
    <div v-if="currentStatus === 'ready'" class="space-y-3">
      <div
        class="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-emerald-400 font-medium"
      >
        <div class="flex items-center gap-2">
          <CheckCircle2 class="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Video Asset Ready & Streamable</span>
          <span v-if="duration" class="font-mono bg-emerald-500/20 px-2 py-0.5 rounded text-[11px] ml-1">
            {{ Math.floor(duration / 60) }}m {{ duration % 60 }}s
          </span>
        </div>

        <div class="flex items-center gap-2">
          <button
            @click="showPreview = !showPreview"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-950 bg-emerald-400 hover:bg-emerald-300 transition-colors uppercase tracking-wider cursor-pointer"
          >
            <component :is="showPreview ? EyeOff : Play" class="w-3.5 h-3.5 fill-current" />
            <span>{{ showPreview ? 'Hide Preview' : 'Preview Video' }}</span>
          </button>

          <label class="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-300 bg-white/5 hover:bg-white/10 border border-slate-700/80 transition-colors uppercase tracking-wider shrink-0">
            <Upload class="w-3.5 h-3.5" />
            <span>Replace Video</span>
            <input type="file" accept="video/*" class="hidden" @change="selectFile" :disabled="uploading" />
          </label>
        </div>
      </div>

      <!-- Embedded Video Player Preview -->
      <div v-if="showPreview && streamUrl" class="rounded-2xl overflow-hidden border border-purple-800/50 bg-black/90 p-2 shadow-2xl space-y-2">
        <div class="flex items-center justify-between px-2 pt-1 text-[11px] font-mono text-purple-300">
          <span class="flex items-center gap-1.5">
            <Play class="w-3 h-3 text-yellow-400 fill-current" />
            <span>HLS Stream Preview</span>
          </span>
          <button @click="showPreview = false" class="text-slate-400 hover:text-white transition-colors cursor-pointer">
            Close
          </button>
        </div>
        <VideoPlayer :src="streamUrl" class="w-full rounded-xl overflow-hidden" />
      </div>

      <!-- Selected replacement file notice -->
      <div v-if="file && !uploading" class="p-3 bg-purple-900/20 border border-purple-500/30 rounded-xl flex items-center justify-between text-xs text-slate-200 font-medium">
        <span class="truncate">Selected replacement file: {{ file.name }}</span>
        <button
          @click="startUpload"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-[#0c0919] bg-[#facc15] hover:bg-[#fde047] uppercase tracking-wider cursor-pointer shrink-0"
        >
          <Upload class="w-3.5 h-3.5 stroke-[3]" />
          <span>Upload Replacement</span>
        </button>
      </div>
    </div>

    <!-- Status: Processing -->
    <div
      v-else-if="processing || currentStatus === 'processing'"
      class="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center gap-3 text-xs text-amber-300 font-medium"
    >
      <Loader2 class="w-4 h-4 text-amber-400 animate-spin shrink-0" />
      <span>Processing video... FFmpeg HLS transcoding in progress</span>
    </div>

    <!-- Upload Controls -->
    <div v-else class="space-y-3">
      <div class="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 bg-[#0c0919]/60 border border-dashed border-purple-800/50 hover:border-purple-500/60 rounded-xl transition-colors">
        <div class="flex items-center gap-3 min-w-0">
          <Video class="w-4 h-4 text-purple-400 shrink-0" />
          <span class="text-xs text-slate-300 truncate font-medium">
            {{ file ? file.name : 'No video file selected' }}
          </span>
        </div>

        <label class="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-300 bg-white/5 hover:bg-white/10 border border-slate-700/80 transition-colors uppercase tracking-wider shrink-0">
          <Upload class="w-3.5 h-3.5" />
          <span>{{ file ? 'Change File' : 'Browse File' }}</span>
          <input type="file" accept="video/*" class="hidden" @change="selectFile" :disabled="uploading" />
        </label>
      </div>

      <!-- Upload Progress Bar -->
      <div v-if="uploading" class="space-y-1">
        <div class="h-2.5 bg-slate-900 border border-purple-900/60 rounded-full overflow-hidden relative">
          <div
            class="h-full bg-gradient-to-r from-purple-600 to-amber-400 transition-all duration-200"
            :style="{ width: progress + '%' }"
          ></div>
        </div>
        <div class="flex justify-between text-[11px] text-slate-400 font-mono font-medium">
          <span>Uploading video payload to storage...</span>
          <span class="text-yellow-400">{{ progress }}%</span>
        </div>
      </div>

      <!-- Start Upload Button -->
      <button
        v-if="file && !uploading"
        @click="startUpload"
        class="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black text-[#0c0919] bg-[#facc15] hover:bg-[#fde047] shadow-lg shadow-yellow-500/20 hover:scale-105 transition-all uppercase tracking-wider cursor-pointer"
      >
        <Upload class="w-3.5 h-3.5 stroke-[3]" />
        <span>Start Video Upload</span>
      </button>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2 text-red-400 text-xs font-semibold">
      <AlertCircle class="w-4 h-4 shrink-0" />
      <span>{{ error }}</span>
    </div>
  </div>
</template>

