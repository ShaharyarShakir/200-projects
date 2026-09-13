<script setup lang="ts">
const props = defineProps<{
  screenshots?: string[]
  productName?: string
}>()

const gridRef = ref<HTMLElement | null>(null)
const failedImages = ref<Record<string, boolean>>({})
const loadedImages = ref<Record<string, boolean>>({})

// Active image index for display
const activeIndex = ref(0)

// Lightbox Modal state
const isModalOpen = ref(false)
const activeModalIndex = ref(0)

const handleImageError = (url: string) => {
  failedImages.value[url] = true
}

const handleImageLoad = (url: string) => {
  loadedImages.value[url] = true
}

// True if all provided screenshots have failed or no screenshots provided
const allScreenshotsFailed = computed(() => {
  if (!props.screenshots || props.screenshots.length === 0) return true
  return props.screenshots.every(url => failedImages.value[url])
})

// Only show the screenshot gallery if at least one screenshot is valid/loading
const showGallery = computed(() => {
  return Boolean(props.screenshots && props.screenshots.length > 0 && !allScreenshotsFailed.value)
})

const selectImage = (index: number) => {
  activeIndex.value = index
}

const nextImage = () => {
  if (!props.screenshots?.length) return
  activeIndex.value = (activeIndex.value + 1) % props.screenshots.length
}

const prevImage = () => {
  if (!props.screenshots?.length) return
  activeIndex.value = (activeIndex.value - 1 + props.screenshots.length) % props.screenshots.length
}

// Lightbox modal methods
const openModal = (index: number) => {
  if (props.screenshots?.[index] && !failedImages.value[props.screenshots[index]]) {
    activeModalIndex.value = index
    isModalOpen.value = true
    if (import.meta.client) {
      document.body.style.overflow = 'hidden'
    }
  }
}

const closeModal = () => {
  isModalOpen.value = false
  if (import.meta.client) {
    document.body.style.overflow = ''
  }
}

const nextModalImage = () => {
  if (!props.screenshots?.length) return
  activeModalIndex.value = (activeModalIndex.value + 1) % props.screenshots.length
}

const prevModalImage = () => {
  if (!props.screenshots?.length) return
  activeModalIndex.value =
    (activeModalIndex.value - 1 + props.screenshots.length) % props.screenshots.length
}

const handleKeydown = (e: KeyboardEvent) => {
  if (!isModalOpen.value) return

  if (e.key === 'Escape') {
    closeModal()
  } else if (e.key === 'ArrowRight') {
    nextModalImage()
  } else if (e.key === 'ArrowLeft') {
    prevModalImage()
  }
}

onMounted(() => {
  if (import.meta.client) {
    window.addEventListener('keydown', handleKeydown)
  }
})

onUnmounted(() => {
  if (import.meta.client) {
    document.body.style.overflow = ''
    window.removeEventListener('keydown', handleKeydown)
  }
})
</script>

<template>
  <div>
    <!-- Google Play Store Style Grid with Active Full-Size Display -->
    <div
      v-if="showGallery"
      class="group/gallery relative"
    >
      <!-- Section Header -->
      <div class="flex justify-between items-center mb-4 px-1">
        <div class="flex items-center gap-2.5">
          <span class="font-bold text-xs text-base-content/65 uppercase tracking-wider">
            Screenshots
          </span>
          <span
            v-if="screenshots && screenshots.length > 1"
            class="bg-base-200/80 px-2.5 py-0.5 rounded-full font-mono font-medium text-[11px] text-base-content/60"
          >
            {{ screenshots.length }} previews
          </span>
        </div>
      </div>

      <!-- Main Display Container -->
      <div class="flex flex-col sm:flex-row gap-5 sm:gap-6">
        <!-- Large Active Screenshot with Navigation Arrows -->
        <div class="relative w-full shrink-0 mx-auto sm:mx-0 max-w-[280px]">
          <!-- Active Screenshot Display -->
          <div class="group/active relative bg-base-200/50 hover:bg-base-200 shadow-sm hover:shadow-lg border border-base-300/80 rounded-2xl overflow-hidden cursor-zoom-in transition-all duration-200" @click="openModal(activeIndex)">
            <div class="relative flex justify-center items-center bg-neutral-950 w-full aspect-[9/16] overflow-hidden">
              <!-- Loading Shimmer -->
              <div
                v-if="!loadedImages[screenshots[activeIndex]] && !failedImages[screenshots[activeIndex]]"
                class="absolute inset-0 flex flex-col justify-center items-center bg-neutral-900 p-4 text-center animate-pulse"
              >
                <div class="flex justify-center items-center bg-neutral-800 mb-2 rounded-xl w-10 h-10 text-lg">
                  <Icon name="ph:device-mobile-fill" />
                </div>
                <span class="font-medium text-neutral-400 text-xs">Loading...</span>
              </div>

              <!-- Fallback Error State -->
              <div
                v-if="failedImages[screenshots[activeIndex]]"
                class="flex flex-col justify-center items-center bg-gradient-to-b from-neutral-900 to-neutral-950 p-6 w-full h-full text-neutral-300 text-center"
              >
                <div class="flex justify-center items-center bg-neutral-800 shadow-inner mb-3 border border-neutral-700/60 rounded-2xl w-12 h-12 text-xl">
                  <Icon name="ph:image-fill" />
                </div>
                <h4 class="font-semibold text-neutral-200 text-xs">
                  {{ productName || 'App' }} Preview
                </h4>
                <p class="mt-1.5 text-[11px] text-neutral-400 leading-relaxed">
                  Preview will update with release.
                </p>
              </div>

              <!-- Active Screenshot Image -->
              <img
                v-show="!failedImages[screenshots[activeIndex]]"
                :src="screenshots[activeIndex]"
                :alt="productName ? `${productName} screenshot ${activeIndex + 1}` : 'Product screenshot'"
                class="block w-full h-full object-cover group-hover/active:scale-[1.02] transition-transform duration-300"
                loading="eager"
                @error="handleImageError(screenshots[activeIndex])"
                @load="handleImageLoad(screenshots[activeIndex])"
              >

              <!-- Hover Expand Icon -->
              <div
                v-if="loadedImages[screenshots[activeIndex]] && !failedImages[screenshots[activeIndex]]"
                class="absolute inset-0 flex justify-center items-center bg-black/35 opacity-0 group-hover/active:opacity-100 backdrop-blur-[2px] transition-opacity duration-200 pointer-events-none"
              >
                <span class="inline-flex items-center gap-1.5 bg-neutral-900/90 shadow-lg px-3 py-1.5 border border-white/20 rounded-full font-medium text-white text-xs">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                  </svg>
                  <span>Expand</span>
                </span>
              </div>
            </div>
          </div>

          <!-- Navigation Arrows - Only show if multiple screenshots -->
          <button
            v-if="screenshots && screenshots.length > 1"
            type="button"
            class="top-1/2 left-2 sm:left-4 z-20 absolute flex justify-center items-center bg-base-100/90 hover:bg-base-100 shadow-lg backdrop-blur-md border border-base-300 rounded-full w-9 sm:w-10 h-9 sm:h-10 text-base-content hover:scale-110 active:scale-95 transition-transform -translate-y-1/2"
            aria-label="Previous screenshot"
            @click="prevImage"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 sm:w-5 h-4 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            v-if="screenshots && screenshots.length > 1"
            type="button"
            class="top-1/2 right-2 sm:right-4 z-20 absolute flex justify-center items-center bg-base-100/90 hover:bg-base-100 shadow-lg backdrop-blur-md border border-base-300 rounded-full w-9 sm:w-10 h-9 sm:h-10 text-base-content hover:scale-110 active:scale-95 transition-transform -translate-y-1/2"
            aria-label="Next screenshot"
            @click="nextImage"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 sm:w-5 h-4 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <!-- Counter Badge -->
          <div
            v-if="screenshots && screenshots.length > 1"
            class="top-3 right-3 absolute bg-base-100/90 backdrop-blur-md px-3 py-1.5 border border-base-300/80 rounded-full font-mono font-semibold text-xs text-base-content"
          >
            {{ activeIndex + 1 }} / {{ screenshots.length }}
          </div>
        </div>

        <!-- Grid of Thumbnails (2x2 on desktop, 1x1 on mobile) -->
        <div class="flex-1 min-w-0 flex flex-col justify-between">
          <div
            v-if="screenshots && screenshots.length > 1"
            ref="gridRef"
            class="gap-3 grid auto-rows-max sm:max-h-[480px] overflow-x-hidden overflow-y-auto pr-1 grid-cols-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3"
          >
          <button
            v-for="(screenshot, index) in screenshots"
            :key="screenshot"
            type="button"
            class="group/thumb relative border-2 rounded-lg overflow-hidden transition-all duration-200 cursor-pointer"
            :class="
              activeIndex === index
                ? 'border-primary shadow-md shadow-primary/40 scale-100'
                : 'border-base-300/60 opacity-60 hover:opacity-85 hover:border-base-300'
            "
            :aria-label="`Select screenshot ${index + 1}`"
            @click="selectImage(index)"
          >
            <!-- Thumbnail Image -->
            <div class="relative flex justify-center items-center bg-neutral-950 aspect-[9/16] overflow-hidden">
              <!-- Dimmed Overlay for non-active thumbnails -->
              <div
                v-show="activeIndex !== index"
                class="z-10 absolute inset-0 bg-black/50 group-hover/thumb:bg-black/30 transition-opacity duration-200"
              />

              <!-- Loading State -->
              <div
                v-if="!loadedImages[screenshot] && !failedImages[screenshot]"
                class="absolute inset-0 flex justify-center items-center bg-neutral-900 text-neutral-500 text-xs animate-pulse"
              >
                <Icon name="ph:device-mobile-fill" />
              </div>

              <!-- Error State -->
              <div
                v-if="failedImages[screenshot]"
                class="absolute inset-0 flex justify-center items-center bg-neutral-900 text-neutral-600 text-xs"
              >
                <Icon name="ph:image-fill" />
              </div>

              <!-- Thumbnail Image -->
              <img
                v-show="!failedImages[screenshot]"
                :src="screenshot"
                :alt="productName ? `${productName} screenshot ${index + 1}` : 'Thumbnail'"
                class="block w-full h-full object-cover opacity-100"
                loading="eager"
                @error="handleImageError(screenshot)"
                @load="handleImageLoad(screenshot)"
              >
            </div>
          </button>
        </div>

        <!-- Play Store Style Carousel Pagination Dots -->
      <div
        v-if="screenshots && screenshots.length > 1"
        class="flex justify-center items-center gap-1.5 mt-4 sm:mt-0 sm:pt-4"
      >
        <button
          v-for="(_, index) in screenshots"
          :key="index"
          type="button"
          class="rounded-full transition-all duration-200"
          :class="
            activeIndex === index
              ? 'w-6 h-1.5 bg-primary'
              : 'w-1.5 h-1.5 bg-base-content/20 hover:bg-base-content/40'
          "
          :aria-label="`Scroll to screenshot ${index + 1}`"
          @click="selectImage(index)"
        />
      </div>
        </div>
      </div>
    </div>

    <!-- Fallback Placeholder when no screenshots are present -->
    <div
      v-else
      class="bg-base-100 shadow-xs border border-base-300/90 rounded-3xl overflow-hidden transition-colors"
    >
      <div class="flex justify-between items-center bg-base-200/50 px-5 py-3 border-base-300/80 border-b">
        <div class="flex items-center gap-2">
          <span class="bg-red-400/70 rounded-full w-3 h-3" />
          <span class="bg-amber-400/70 rounded-full w-3 h-3" />
          <span class="bg-emerald-400/70 rounded-full w-3 h-3" />
          <span class="ml-2 font-mono text-xs text-base-content/60">{{ productName || 'Tiny Image Compressor' }} • Interface Preview</span>
        </div>

        <span class="bg-base-100 px-2.5 py-0.5 border border-base-300 rounded-full font-medium text-[11px] text-primary">
          Offline Mode
        </span>
      </div>

      <div class="relative p-8 sm:p-12">
        <div class="relative mx-auto max-w-xl">
          <div class="bg-base-200/40 backdrop-blur-xs p-6 sm:p-8 border border-base-300/80 rounded-2xl">
            <div class="flex flex-col items-center text-center">
              <div
                class="flex justify-center items-center bg-base-100 shadow-xs border border-base-300 rounded-2xl w-16 h-16 text-3xl hover:scale-105 transition-transform"
              >
                <Icon name="ph:image-fill" />
              </div>

              <h3 class="mt-5 font-bold text-base-content text-lg tracking-tight">
                Local Compression Engine
              </h3>

              <p class="mt-2 max-w-sm text-xs text-base-content/65">
                Drop images to compress locally. Files never leave your device.
              </p>

              <div class="space-y-3 mt-6 w-full">
                <div class="flex justify-between items-center text-xs text-base-content/70">
                  <span>Compression Quality</span>
                  <span class="font-mono font-semibold text-primary">82%</span>
                </div>
                <div class="bg-base-300 rounded-full w-full h-2 overflow-hidden">
                  <div class="bg-primary rounded-full w-[82%] h-full" />
                </div>
              </div>

              <div class="flex flex-wrap justify-center items-center gap-2 mt-6">
                <span class="bg-base-100 px-2.5 py-1 border border-base-300 rounded-md font-mono font-medium text-xs text-base-content/80">
                  JPG
                </span>
                <span class="bg-base-100 px-2.5 py-1 border border-base-300 rounded-md font-mono font-medium text-xs text-base-content/80">
                  PNG
                </span>
                <span class="bg-base-100 px-2.5 py-1 border border-base-300 rounded-md font-mono font-medium text-xs text-base-content/80">
                  WebP
                </span>
                <span class="bg-emerald-500/10 px-2.5 py-1 border border-emerald-500/20 rounded-md font-mono font-semibold text-emerald-600 dark:text-emerald-400 text-xs">
                  ~65% reduction
                </span>
              </div>
            </div>
          </div>

          <p class="mt-6 text-xs text-base-content/50 text-center">
            Official production screenshots will be published with the v1.0.0 release.
          </p>
        </div>
      </div>
    </div>

    <!-- Fullscreen Google Play Style Lightbox Modal -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="isModalOpen && screenshots?.length"
          class="z-50 fixed inset-0 flex flex-col justify-between bg-black/90 backdrop-blur-md p-4 sm:p-6 select-none"
          role="dialog"
          aria-modal="true"
          :aria-label="`${productName || 'Product'} Screenshots Preview`"
          @click.self="closeModal"
        >
          <!-- Top Navigation Bar: Product Name, Counter, and Unobstructed Close Button -->
          <div class="z-30 flex justify-between items-center mx-auto w-full max-w-6xl">
            <div class="flex items-center gap-3">
              <span class="font-bold text-white text-sm sm:text-base">
                {{ productName }}
              </span>
              <span class="bg-white/15 px-2.5 py-0.5 rounded-full font-mono text-white/80 text-xs">
                {{ activeModalIndex + 1 }} / {{ screenshots.length }}
              </span>
            </div>

            <!-- Clear, Unobstructed Close ("X") Button -->
            <button
              type="button"
              class="flex justify-center items-center bg-white/15 hover:bg-white/30 shadow-lg border border-white/20 rounded-full w-11 h-11 text-white active:scale-90 transition-all cursor-pointer"
              aria-label="Close screenshot viewer"
              @click="closeModal"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Main Stage: Left Button, Direct Screenshot Image (Clean, No Fake Bezel), Right Button -->
          <div
            class="relative flex flex-1 justify-center items-center mx-auto py-2 w-full max-w-5xl overflow-hidden"
            @click.self="closeModal"
          >
            <!-- Previous Button -->
            <button
              v-if="screenshots.length > 1"
              type="button"
              class="left-2 sm:left-6 z-30 absolute flex justify-center items-center bg-black/60 hover:bg-black/90 shadow-2xl backdrop-blur-md border border-white/20 rounded-full w-12 h-12 text-white active:scale-95 transition-all cursor-pointer"
              aria-label="Previous screenshot"
              @click.stop="prevModalImage"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <!-- Clean Screenshot Display without artificial bezels/notches -->
            <div
              class="relative flex justify-center items-center shadow-2xl border border-white/10 rounded-2xl max-h-[76vh] overflow-hidden"
              @click.stop
            >
              <img
                :src="screenshots[activeModalIndex]"
                :alt="productName ? `${productName} screenshot ${activeModalIndex + 1}` : 'Screenshot'"
                class="block rounded-2xl w-auto max-w-full max-h-[76vh] object-contain"
              >
            </div>

            <!-- Next Button -->
            <button
              v-if="screenshots.length > 1"
              type="button"
              class="right-2 sm:right-6 z-30 absolute flex justify-center items-center bg-black/60 hover:bg-black/90 shadow-2xl backdrop-blur-md border border-white/20 rounded-full w-12 h-12 text-white active:scale-95 transition-all cursor-pointer"
              aria-label="Next screenshot"
              @click.stop="nextModalImage"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <!-- Bottom Navigation Thumbnail Strip -->
          <div
            v-if="screenshots.length > 1"
            class="z-30 flex justify-center items-center gap-2.5 mx-auto py-2 max-w-lg overflow-x-auto no-scrollbar"
          >
            <button
              v-for="(img, idx) in screenshots"
              :key="idx"
              type="button"
              class="relative bg-neutral-900 border-2 rounded-xl w-11 h-16 overflow-hidden transition-all duration-150 cursor-pointer shrink-0"
              :class="activeModalIndex === idx ? 'border-primary scale-105 shadow-md shadow-primary/40' : 'border-white/20 opacity-50 hover:opacity-85'"
              :aria-label="`Jump to screenshot ${idx + 1}`"
              @click.stop="activeModalIndex = idx"
            >
              <img :src="img" :alt="`Thumbnail ${idx + 1}`" class="w-full h-full object-cover">
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
/* Utility for hiding scrollbar while preserving touch & trackpad horizontal scroll */
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
