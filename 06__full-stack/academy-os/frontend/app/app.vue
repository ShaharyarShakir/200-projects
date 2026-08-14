<script setup lang="ts">
import { onMounted } from 'vue'
import { useTheme } from '~/composables/useTheme'

const { initTheme } = useTheme()

onMounted(() => {
  initTheme()
})
</script>

<template>
  <div class="min-h-screen bg-base-100 text-base-content font-sans antialiased">
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage :page-key="route => route.fullPath" />
    </NuxtLayout>
  </div>
</template>
