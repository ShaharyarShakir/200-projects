<script setup lang="ts">
const { academy, load } = usePublicAcademy()

await load()
</script>

<template>
  <div class="academy-layout min-h-screen flex flex-col bg-slate-950 text-slate-100">
    <header class="border-b border-slate-800 bg-slate-900/80 backdrop-blur px-6 py-4 flex items-center justify-between">
      <NuxtLink to="/" class="text-xl font-bold text-indigo-400 hover:text-indigo-300 transition-colors">
        {{ academy?.name || 'Academy' }}
      </NuxtLink>

      <nav class="flex items-center gap-6 text-sm font-medium">
        <NuxtLink to="/" class="hover:text-indigo-400 transition-colors">
          Home
        </NuxtLink>

        <NuxtLink to="/courses" class="hover:text-indigo-400 transition-colors">
          Courses
        </NuxtLink>

        <NuxtLink to="/login" class="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors">
          Login
        </NuxtLink>
      </nav>
    </header>

    <main class="flex-1 container mx-auto px-6 py-8">
      <slot />
    </main>

    <footer class="border-t border-slate-800 bg-slate-900/30 px-6 py-6 text-center text-sm text-slate-400">
      &copy; {{ new Date().getFullYear() }} {{ academy?.name || 'Academy' }}. Powered by AcademyOS.
    </footer>
  </div>
</template>
