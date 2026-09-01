<script setup lang="ts">
const props = defineProps<{
  error: {
    statusCode?: number
    statusMessage?: string
  }
}>()

useHead({
  title: computed(() => `Error ${props.error?.statusCode || 404} — My Tiny Apps`),
})

const handleError = () => clearError({ redirect: '/' })
</script>

<template>
  <div class="flex flex-col justify-center items-center bg-base-100 selection:bg-primary/20 px-4 py-20 min-h-screen selection:text-primary text-base-content">
    <div
      class="relative bg-base-100/90 shadow-md backdrop-blur-xs p-8 sm:p-10 border border-base-300/90 rounded-3xl w-full max-w-md overflow-hidden text-center"
    >
      <!-- Ambient background grid -->
      <div class="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" aria-hidden="true" />

      <div class="relative">
        <div
          class="flex justify-center items-center bg-base-200/70 shadow-2xs mx-auto border border-base-300/80 rounded-2xl w-16 h-16 text-3xl select-none"
        >
          🧭
        </div>

        <div class="inline-flex items-center gap-2 bg-base-200/60 shadow-2xs mt-6 px-3 py-0.5 border border-base-300 rounded-full font-bold text-primary text-xs uppercase tracking-wider">
          Error {{ error.statusCode || 404 }}
        </div>

        <h1 class="mt-4 font-extrabold text-base-content text-3xl sm:text-4xl tracking-tight">
          {{ error.statusCode === 404 ? 'Page not found' : 'Something went wrong' }}
        </h1>

        <p class="mt-3 text-sm text-base-content/70 leading-relaxed">
          {{ error.statusCode === 404
            ? "Looks like this tiny app couldn't find the page or product you're looking for."
            : (error.statusMessage || 'An unexpected error occurred while loading this page.')
          }}
        </p>

        <div class="flex sm:flex-row flex-col sm:justify-center gap-3 mt-8">
          <button
            type="button"
            class="shadow-md shadow-primary/20 px-6 rounded-xl focus-visible:outline-none font-semibold text-sm btn btn-primary"
            @click="handleError"
          >
            <span>Return to home</span>
            <span class="arrow-nudge" aria-hidden="true">→</span>
          </button>
        </div>

        <!-- Quick Links -->
        <div class="mt-8 pt-6 border-base-300/80 border-t text-xs text-base-content/60">
          <span>Need help finding something? </span>
          <NuxtLink to="/apps" class="font-semibold text-primary hover:underline" @click="handleError">
            Browse apps
          </NuxtLink>
          <span> or </span>
          <NuxtLink to="/support" class="font-semibold text-primary hover:underline" @click="handleError">
            contact support
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

