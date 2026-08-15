<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: ['auth']
})
</script>

<template>
  <div class="max-w-3xl space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-white tracking-tight">Settings</h1>
      <p class="text-slate-400 text-sm mt-1">General academy configuration and account settings.</p>
    </div>

    <UiBaseCard title="Academy Details">
      <div class="space-y-4">
        <div>
          <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Timezone</label>
          <div class="text-sm text-white">UTC (Coordinated Universal Time)</div>
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Default Currency</label>
          <div class="text-sm text-white">USD ($)</div>
        </div>
      </div>
    </UiBaseCard>
  </div>
</template>
