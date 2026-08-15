<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost'
    size?: 'sm' | 'md' | 'lg'
    disabled?: boolean
    type?: 'button' | 'submit' | 'reset'
  }>(),
  {
    variant: 'primary',
    size: 'md',
    disabled: false,
    type: 'button'
  }
)
</script>

<template>
  <button
    :type="type"
    :disabled="disabled"
    :class="[
      'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed',
      size === 'sm' ? 'px-3 py-1.5 text-xs' : '',
      size === 'md' ? 'px-4 py-2 text-sm' : '',
      size === 'lg' ? 'px-6 py-3 text-base' : '',
      variant === 'primary' ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm shadow-indigo-600/30' : '',
      variant === 'secondary' ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700' : '',
      variant === 'outline' ? 'border border-indigo-500/50 text-indigo-400 hover:bg-indigo-950/40' : '',
      variant === 'danger' ? 'bg-red-600 hover:bg-red-500 text-white' : '',
      variant === 'ghost' ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60' : ''
    ]"
  >
    <slot />
  </button>
</template>
