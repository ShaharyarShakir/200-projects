<script setup lang="ts">
const { academy } = useAcademy()
</script>

<template>
  <footer class="bg-[#0c0919] border-t border-purple-900/40 py-8 px-4 text-center text-slate-400 text-sm">
    <div class="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
      <div class="flex items-center space-x-2">
        <span class="font-black text-white uppercase">{{ academy?.name || 'AcademyOS' }}</span>
        <span class="text-xs text-purple-400">&bull; Powered by Cosmic SaaS Engine</span>
      </div>
      <p class="text-xs text-slate-500">
        &copy; {{ new Date().getFullYear() }} {{ academy?.name || 'AcademyOS' }}. All rights reserved.
      </p>
    </div>
  </footer>
</template>
