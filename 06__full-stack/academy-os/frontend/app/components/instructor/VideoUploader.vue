<script setup lang="ts">
import { ref } from 'vue'
import { useApi } from '~/composables/useApi'
import type { VideoAsset } from '~/types/course'

const props = defineProps<{
  courseId: string
  sectionId: string
  lessonId: string
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

function selectFile(event: Event) {
  const input = event.target as HTMLInputElement
  file.value = input.files?.[0] ?? null
  error.value = ''
}

function uploadFileWithXHR(url: string, fileToUpload: File): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', url)
    xhr.setRequestHeader('Content-Type', fileToUpload.type)

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
      const assetInfo: any = await $fetch(`${api.baseURL}/api/video-assets/${assetId}`)
      currentStatus.value = assetInfo.status

      if (assetInfo.status === 'ready') {
        processing.value = false
        duration.value = assetInfo.duration_seconds
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
    const res: any = await $fetch(`${api.baseURL}/api/video-assets`, {
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
    const uploadUrl = res.upload_url

    // Direct PUT to Garage S3
    await uploadFileWithXHR(uploadUrl, file.value)

    // Complete upload
    await $fetch(`${api.baseURL}/api/video-assets/${assetId}/complete`, {
      method: 'POST'
    })

    uploading.value = false
    await pollAssetStatus(assetId)
  } catch (err: any) {
    uploading.value = false
    processing.value = false
    error.value = err.message || 'Video upload failed'
  }
}
</script>

<template>
  <div class="video-uploader">
    <div v-if="currentStatus === 'ready'" class="status-box ready">
      <span>✓ Video Ready</span>
      <span v-if="duration"> (Duration: {{ Math.floor(duration / 60) }}m {{ duration % 60 }}s)</span>
    </div>

    <div v-else-if="processing || currentStatus === 'processing'" class="status-box processing">
      <div class="spinner"></div>
      <span>Processing video... FFmpeg HLS transcoding in progress</span>
    </div>

    <div v-else class="upload-controls">
      <input type="file" accept="video/*" @change="selectFile" :disabled="uploading" />

      <div v-if="uploading" class="progress-bar-container">
        <div class="progress-bar" :style="{ width: progress + '%' }"></div>
        <span>Uploading... {{ progress }}%</span>
      </div>

      <button
        v-if="file && !uploading"
        @click="startUpload"
        class="btn-upload"
      >
        Upload Video
      </button>
    </div>

    <p v-if="error" class="error-text">
      ✕ {{ error }}
    </p>
  </div>
</template>

<style scoped>
.video-uploader {
  margin-top: 0.5rem;
  padding: 0.75rem;
  background-color: #f9fafb;
  border: 1px dashed #d1d5db;
  border-radius: 6px;
}
.status-box {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
}
.ready {
  color: #16a34a;
}
.processing {
  color: #d97706;
}
.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid #d97706;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
.upload-controls {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.btn-upload {
  align-self: flex-start;
  padding: 0.35rem 0.75rem;
  background-color: #2563eb;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.progress-bar-container {
  height: 18px;
  background-color: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
  font-size: 11px;
  text-align: center;
  line-height: 18px;
  color: #374151;
}
.progress-bar {
  height: 100%;
  background-color: #3b82f6;
  position: absolute;
  left: 0;
  top: 0;
  transition: width 0.2s ease;
}
.error-text {
  color: #dc2626;
  font-size: 12px;
  margin-top: 0.25rem;
}
</style>
