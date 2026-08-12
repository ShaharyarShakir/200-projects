<template>
  <div class="min-h-screen flex flex-col bg-base-100 text-base-content transition-colors duration-300">
    <AppNavbar />
    <main class="flex-1">
      <slot />
    </main>
    <AppFooter />
  </div>
</template>
