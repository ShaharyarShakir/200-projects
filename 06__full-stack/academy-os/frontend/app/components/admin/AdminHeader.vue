<script setup lang="ts">
const { academy } = useAcademy()
const { logout } = useAuth()
</script>

<template>
  <header class="h-16 px-6 bg-slate-900/80 backdrop-blur border-b border-slate-800 flex items-center justify-between sticky top-0 z-20">
    <div class="flex items-center space-x-4">
      <AdminTenantSwitcher />
    </div>

    <div class="flex items-center space-x-4">
      <a
        v-if="academy?.slug"
        :href="`http://${academy.slug}.localhost:3000`"
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-300 hover:text-white bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-800/80 rounded-md transition shadow-sm"
      >
        <span>View Academy</span>
        <span class="text-xs">↗</span>
      </a>

      <button
        @click="logout"
        class="text-xs text-slate-400 hover:text-slate-200 transition"
      >
        Sign Out
      </button>
    </div>
  </header>
</template>
