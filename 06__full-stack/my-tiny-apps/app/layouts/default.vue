<template>
  <div class="flex flex-col bg-base-100 selection:bg-primary/20 min-h-screen selection:text-primary text-base-content">
    <!-- Skip to content for keyboard accessibility -->
    <a
      href="#main-content"
      class="sr-only focus:not-sr-only focus:top-4 focus:left-4 focus:z-50 focus:fixed focus:bg-primary focus:shadow-lg focus:px-4 focus:py-2.5 focus:rounded-xl focus:outline-none focus:font-medium focus:text-primary-content focus:text-sm"
    >
      Skip to main content
    </a>

    <AppNavbar />

    <main id="main-content" class="flex-1 focus:outline-none" tabindex="-1">
      <slot />
    </main>

    <AppFooter />
  </div>
</template>


