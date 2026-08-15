<script setup lang="ts">
definePageMeta({
  layout: 'academy'
})

const { academy } = usePublicAcademy()
</script>

<template>
  <div class="space-y-6">
    <div class="border-b border-slate-800 pb-4">
      <h1 class="text-3xl font-bold tracking-tight text-white">
        Course Catalog
      </h1>
      <p class="text-slate-400 mt-2">
        Explore courses provided by {{ academy?.name || 'this academy' }}.
      </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div class="p-6 rounded-xl border border-slate-800 bg-slate-900/50 hover:border-slate-700 transition">
        <span class="text-xs font-semibold px-2.5 py-1 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">Featured</span>
        <h3 class="text-lg font-semibold text-white mt-3">Public Catalog Shell</h3>
        <p class="text-sm text-slate-400 mt-2">Public course catalog for {{ academy?.name || 'Academy' }} will be loaded here in Phase 2I.</p>
      </div>
    </div>
  </div>
</template>
