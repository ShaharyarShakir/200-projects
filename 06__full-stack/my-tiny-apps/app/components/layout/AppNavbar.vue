<script setup lang="ts">
const route = useRoute()
const mobileMenuOpen = ref(false)

const closeMobileMenu = () => {
  mobileMenuOpen.value = false
}

// Close mobile menu on route change
watch(
  () => route.path,
  () => {
    mobileMenuOpen.value = false
  },
)

// Handle Escape key to close mobile menu
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && mobileMenuOpen.value) {
    closeMobileMenu()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})

const isRouteActive = (path: string) => {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}
</script>

<template>
  <header
    class="top-0 z-40 sticky bg-base-100/80 backdrop-blur-md border-base-300/80 border-b w-full transition-colors duration-200"
  >
    <div class="flex justify-between items-center mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl h-16">
      <!-- Brand -->
      <div class="flex items-center">
        <NuxtLink
          to="/"
          class="group inline-flex items-center gap-2 hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 transition-opacity duration-200"
          aria-label="My Tiny Apps Homepage"
          @click="closeMobileMenu"
        >
          <AppLogo size="md" />
        </NuxtLink>
      </div>

      <!-- Desktop Navigation -->
      <nav class="hidden sm:flex items-center gap-1" aria-label="Main Navigation">
        <NuxtLink
          to="/apps"
          class="relative px-3.5 py-1.5 rounded-lg font-medium text-sm transition-all duration-150"
          :class="
            isRouteActive('/apps')
              ? 'bg-base-200/90 text-primary font-semibold'
              : 'text-base-content/75 hover:bg-base-200/50 hover:text-base-content'
          "
        >
          <span>Apps</span>
          <span
            v-if="isRouteActive('/apps')"
            class="-bottom-2.5 left-1/2 absolute bg-primary rounded-full w-4 h-0.5 -translate-x-1/2"
            aria-hidden="true"
          />
        </NuxtLink>

        <NuxtLink
          to="/support"
          class="relative px-3.5 py-1.5 rounded-lg font-medium text-sm transition-all duration-150"
          :class="
            isRouteActive('/support')
              ? 'bg-base-200/90 text-primary font-semibold'
              : 'text-base-content/75 hover:bg-base-200/50 hover:text-base-content'
          "
        >
          <span>Support</span>
          <span
            v-if="isRouteActive('/support')"
            class="-bottom-2.5 left-1/2 absolute bg-primary rounded-full w-4 h-0.5 -translate-x-1/2"
            aria-hidden="true"
          />
        </NuxtLink>
      </nav>

      <!-- Right Controls -->
      <div class="flex items-center gap-2">
        <ThemeToggle />

        <!-- Mobile Menu Toggle Button -->
        <button
          type="button"
          class="sm:hidden flex justify-center items-center bg-base-100/80 hover:bg-base-200/80 shadow-2xs backdrop-blur-xs border border-base-300/80 hover:border-primary/40 rounded-xl w-9 h-9 text-base-content/80 transition-all duration-200"
          aria-label="Toggle mobile menu"
          :aria-expanded="mobileMenuOpen"
          @click="mobileMenuOpen = !mobileMenuOpen"
        >
          <svg
            v-if="!mobileMenuOpen"
            xmlns="http://www.w3.org/2000/svg"
            class="w-4.5 h-4.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>

          <svg
            v-else
            xmlns="http://www.w3.org/2000/svg"
            class="w-4.5 h-4.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>

    <!-- Mobile Navigation Drawer with Vue Transition -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 -translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-2"
    >
      <div
        v-if="mobileMenuOpen"
        class="sm:hidden bg-base-100/95 shadow-lg backdrop-blur-md px-4 py-3 border-base-300/80 border-t"
      >
        <nav class="flex flex-col gap-1" aria-label="Mobile Navigation">
          <NuxtLink
            to="/apps"
            class="flex justify-between items-center px-4 py-2.5 rounded-xl font-medium text-sm transition-colors"
            :class="
              isRouteActive('/apps')
                ? 'bg-primary/10 text-primary font-semibold'
                : 'text-base-content/80 hover:bg-base-200/60 hover:text-base-content'
            "
            @click="closeMobileMenu"
          >
            <span>Apps</span>
            <span class="text-xs text-base-content/40">Browse catalog →</span>
          </NuxtLink>

          <NuxtLink
            to="/support"
            class="flex justify-between items-center px-4 py-2.5 rounded-xl font-medium text-sm transition-colors"
            :class="
              isRouteActive('/support')
                ? 'bg-primary/10 text-primary font-semibold'
                : 'text-base-content/80 hover:bg-base-200/60 hover:text-base-content'
            "
            @click="closeMobileMenu"
          >
            <span>Support</span>
            <span class="text-xs text-base-content/40">Help & FAQs →</span>
          </NuxtLink>
        </nav>
      </div>
    </Transition>
  </header>
</template>

