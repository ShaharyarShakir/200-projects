<script setup lang="ts">
defineProps<{
  screenshots?: string[]
  productName?: string
}>()
</script>

<template>
  <div>
    <!-- When real mobile screenshots exist -->
    <div
      v-if="screenshots?.length"
      class="flex flex-col items-center justify-center"
    >
      <div class="flex flex-wrap justify-center gap-8 w-full">
        <div
          v-for="(screenshot, index) in screenshots"
          :key="screenshot"
          class="relative mx-auto max-w-[320px] sm:max-w-[340px] w-full"
        >
          <!-- Modern Smartphone Mockup Frame -->
          <div class="relative bg-base-900 border-[6px] border-base-content/15 dark:border-base-content/20 rounded-[2.5rem] shadow-2xl p-1.5 overflow-hidden transition-all duration-300 hover:scale-[1.01]">
            <!-- Top Speaker & Camera Notch -->
            <div class="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center justify-center gap-2 bg-black/60 backdrop-blur-md px-4 py-1 rounded-full">
              <span class="w-2.5 h-2.5 rounded-full bg-slate-800 border border-slate-700 inline-block" />
              <span class="w-8 h-1 rounded-full bg-slate-800 inline-block" />
            </div>

            <!-- Screen Container -->
            <div class="rounded-[2.1rem] overflow-hidden bg-neutral-950">
              <img
                :src="screenshot"
                :alt="productName ? `${productName} screenshot ${index + 1}` : 'Product screenshot'"
                class="w-full h-auto object-cover block"
                loading="lazy"
              >
            </div>
          </div>

          <p class="mt-3 text-center text-xs font-medium text-base-content/50">
            Real app interface • On-device result
          </p>
        </div>
      </div>
    </div>

    <!-- Intentional Premium Mockup Placeholder Canvas -->
    <div
      v-else
      class="bg-base-100 shadow-xs border border-base-300/90 rounded-3xl overflow-hidden transition-colors"
    >
      <!-- Simulated Window Frame Bar -->
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

      <!-- Preview Mockup Body -->
      <div class="relative p-8 sm:p-12">
        <!-- Subtle background grid -->
        <div class="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />

        <div class="relative mx-auto max-w-xl">
          <!-- Central Mock Card -->
          <div class="bg-base-200/40 backdrop-blur-xs p-6 sm:p-8 border border-base-300/80 rounded-2xl">
            <div class="flex flex-col items-center text-center">
              <div
                class="flex justify-center items-center bg-base-100 shadow-xs border border-base-300 rounded-2xl w-16 h-16 text-3xl hover:scale-105 transition-transform"
              >
                🖼️
              </div>

              <h3 class="mt-5 font-bold text-base-content text-lg tracking-tight">
                Local Compression Engine
              </h3>

              <p class="mt-2 max-w-sm text-xs text-base-content/65">
                Drop images to compress locally. Files never leave your device.
              </p>

              <!-- Simulated Controls -->
              <div class="space-y-3 mt-6 w-full">
                <div class="flex justify-between items-center text-xs text-base-content/70">
                  <span>Compression Quality</span>
                  <span class="font-mono font-semibold text-primary">82%</span>
                </div>
                <div class="bg-base-300 rounded-full w-full h-2 overflow-hidden">
                  <div class="bg-primary rounded-full w-[82%] h-full" />
                </div>
              </div>

              <!-- Format Support Badges -->
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

          <!-- Bottom caption -->
          <p class="mt-6 text-xs text-base-content/50 text-center">
            Official production screenshots will be published with the v1.0.0 release.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

