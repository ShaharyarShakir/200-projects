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
  <div class="flex min-h-screen flex-col items-center justify-center bg-base-100 px-4 py-20 text-base-content selection:bg-primary/20 selection:text-primary">
    <div
      class="relative w-full max-w-md overflow-hidden rounded-3xl border border-base-300/90 bg-base-100/90 p-8 sm:p-10 text-center shadow-md backdrop-blur-xs"
    >
      <!-- Ambient background grid -->
      <div class="pointer-events-none absolute inset-0 bg-grid-pattern opacity-10" aria-hidden="true" />

      <div class="relative">
        <div
          class="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-base-300/80 bg-base-200/70 text-3xl shadow-2xs select-none"
        >
          🧭
        </div>

        <div class="mt-6 inline-flex items-center gap-2 rounded-full border border-base-300 bg-base-200/60 px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-primary shadow-2xs">
          Error {{ error.statusCode || 404 }}
        </div>

        <h1 class="mt-4 text-3xl font-extrabold tracking-tight text-base-content sm:text-4xl">
          {{ error.statusCode === 404 ? 'Page not found' : 'Something went wrong' }}
        </h1>

        <p class="mt-3 text-sm leading-relaxed text-base-content/70">
          {{ error.statusCode === 404
            ? "Looks like this tiny app couldn't find the page or product you're looking for."
            : (error.statusMessage || 'An unexpected error occurred while loading this page.')
          }}
        </p>

        <div class="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            class="btn btn-primary rounded-xl px-6 text-sm font-semibold shadow-md shadow-primary/20 focus-visible:outline-none"
            @click="handleError"
          >
            <span>Return to home</span>
            <span class="arrow-nudge" aria-hidden="true">→</span>
          </button>
        </div>

        <!-- Quick Links -->
        <div class="mt-8 border-t border-base-300/80 pt-6 text-xs text-base-content/60">
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

