<script setup lang="ts">
const colorMode = useColorMode()
const isMounted = ref(false)

onMounted(() => {
  isMounted.value = true
})

const isDark = computed(() => {
  if (!isMounted.value) return false
  return colorMode.value === 'dark'
})

const toggleTheme = () => {
  colorMode.preference = isDark.value ? 'light' : 'dark'
}
</script>

<template>
  <button
    type="button"
    class="relative flex justify-center items-center bg-base-100/80 hover:bg-base-200/80 shadow-2xs backdrop-blur-xs border border-base-300/80 hover:border-primary/40 rounded-xl w-9 h-9 text-base-content/80 hover:text-base-content active:scale-95 transition-all duration-200"
    :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
    :title="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
    @click="toggleTheme"
  >
    <!-- Sun icon (shown when dark) -->
    <svg
      xmlns="http://www.w3.org/2000/svg"
      class="w-4.5 h-4.5 text-amber-400 transition-all duration-300"
      :class="isDark ? 'rotate-0 scale-100 opacity-100' : 'absolute rotate-90 scale-0 opacity-0'"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      stroke-width="2"
      aria-hidden="true"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>

    <!-- Moon icon (shown when light) -->
    <svg
      xmlns="http://www.w3.org/2000/svg"
      class="w-4.5 h-4.5 text-base-content/80 transition-all duration-300"
      :class="!isDark ? 'rotate-0 scale-100 opacity-100' : 'absolute -rotate-90 scale-0 opacity-0'"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      stroke-width="2"
      aria-hidden="true"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
      />
    </svg>
  </button>
</template>

