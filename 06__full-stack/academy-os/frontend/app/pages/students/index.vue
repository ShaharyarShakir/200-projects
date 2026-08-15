<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: ['auth']
})
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-white tracking-tight">Students</h1>
      <p class="text-slate-400 text-sm mt-1">View and manage enrolled students across your academy.</p>
    </div>

    <UiBaseCard>
      <div class="p-12 text-center text-slate-400 text-sm">
        No students enrolled yet. Once students join your published courses, they will appear here.
      </div>
    </UiBaseCard>
  </div>
</template>
