<script setup lang="ts">
interface Props {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'lg',
})

const sizeClasses = {
  sm: 'max-w-3xl',
  md: 'max-w-5xl',
  lg: 'max-w-6xl',
  xl: 'max-w-7xl',
  full: 'max-w-full',
}
</script>

<template>
  <div :class="['mx-auto w-full px-4 sm:px-6 lg:px-8', sizeClasses[props.size]]">
    <slot />
  </div>
</template>


