<template>
  <div class="min-h-screen flex flex-col bg-[#0c0919] text-white font-sans selection:bg-purple-600 selection:text-white relative overflow-hidden">
    <!-- Cosmic background glow halos -->
    <div class="absolute -top-40 -left-40 w-96 h-96 bg-purple-600/15 rounded-full blur-[140px] pointer-events-none"></div>
    <div class="absolute top-1/3 right-0 w-[450px] h-[450px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none"></div>

    <AppNavbar />
    <main class="flex-1 z-10 relative">
      <slot />
    </main>
    <AppFooter />
  </div>
</template>
