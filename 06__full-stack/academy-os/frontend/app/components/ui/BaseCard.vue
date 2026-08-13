<script setup lang="ts">
defineProps<{
  title?: string
  subtitle?: string
}>()
</script>

<template>
  <div class="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
    <div v-if="title || subtitle || $slots.header" class="mb-4 flex items-center justify-between">
      <div>
        <h3 v-if="title" class="text-base font-semibold text-white tracking-tight">
          {{ title }}
        </h3>
        <p v-if="subtitle" class="text-xs text-slate-400 mt-0.5">
          {{ subtitle }}
        </p>
      </div>
      <slot name="header" />
    </div>

    <div>
      <slot />
    </div>

    <div v-if="$slots.footer" class="mt-6 pt-4 border-t border-slate-800/80">
      <slot name="footer" />
    </div>
  </div>
</template>
