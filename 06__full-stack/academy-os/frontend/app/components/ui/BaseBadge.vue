<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'success' | 'warning' | 'info' | 'neutral' | 'danger'
  }>(),
  {
    variant: 'info'
  }
)
</script>

<template>
  <span
    :class="[
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border',
      variant === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : '',
      variant === 'warning' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : '',
      variant === 'info' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' : '',
      variant === 'neutral' ? 'bg-slate-800 text-slate-400 border-slate-700' : '',
      variant === 'danger' ? 'bg-red-500/10 text-red-400 border-red-500/30' : ''
    ]"
  >
    <slot />
  </span>
</template>
