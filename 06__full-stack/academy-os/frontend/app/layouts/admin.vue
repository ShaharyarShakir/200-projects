<script setup lang="ts">
</script>

<template>
  <div class="min-h-screen flex flex-col md:flex-row bg-[#0c0919] text-white font-sans selection:bg-purple-600 selection:text-white relative overflow-hidden">
    <!-- Cosmic background glow halos -->
    <div class="absolute -top-40 -left-40 w-96 h-96 bg-purple-600/15 rounded-full blur-[140px] pointer-events-none"></div>
    <div class="absolute top-1/3 right-0 w-[450px] h-[450px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none"></div>

    <AdminSidebar />
    <div class="flex-1 flex flex-col min-w-0 z-10 relative">
      <main class="flex-1 overflow-y-auto p-6 md:p-8">
        <slot />
      </main>
    </div>
  </div>
</template>
