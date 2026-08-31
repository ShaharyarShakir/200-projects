<script setup lang="ts">
useHead({
  htmlAttrs: {
    lang: 'en',
  },
  titleTemplate: '%s',
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { name: 'theme-color', content: '#059669' },
  ],
})
</script>

<template>
  <div>
    <NuxtLoadingIndicator color="var(--color-primary)" :height="2.5" />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>


