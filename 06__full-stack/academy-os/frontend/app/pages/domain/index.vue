<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: ['auth']
})
</script>

<template>
  <AdminDomainSettings />
</template>
