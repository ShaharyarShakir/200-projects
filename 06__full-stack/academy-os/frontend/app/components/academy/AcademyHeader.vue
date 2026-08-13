<script setup lang="ts">
const { academy } = useAcademy()
const { user } = useAuth()
</script>

<template>
  <header class="bg-[#0c0919]/90 backdrop-blur-md sticky top-0 z-50 border-b border-purple-900/40 px-4 lg:px-8 py-4">
    <div class="max-w-7xl mx-auto flex items-center justify-between">
      <!-- Logo / Brand -->
      <NuxtLink to="/" class="flex items-center space-x-3 group">
        <img
          v-if="academy?.logoUrl"
          :src="academy.logoUrl"
          :alt="academy.name"
          class="h-9 w-auto object-contain"
        />
        <div v-else class="flex items-center gap-2.5">
          <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-yellow-400 to-amber-500 flex items-center justify-center font-black text-[#0c0919] shadow-lg shadow-yellow-500/20 group-hover:scale-105 transition-transform">
            A
          </div>
          <span class="text-xl font-black tracking-tight text-white uppercase group-hover:text-yellow-400 transition-colors">
            {{ academy?.name || 'AcademyOS' }}
          </span>
        </div>
      </NuxtLink>

      <!-- Navigation & Auth Controls -->
      <nav class="flex items-center space-x-6 text-sm font-semibold">
        <NuxtLink to="/" class="text-slate-300 hover:text-yellow-400 transition-colors">
          Home
        </NuxtLink>

        <NuxtLink to="/courses" class="text-slate-300 hover:text-yellow-400 transition-colors">
          Courses
        </NuxtLink>

        <template v-if="user">
          <NuxtLink
            to="/dashboard"
            class="px-5 py-2 rounded-full text-xs font-black text-[#0c0919] bg-[#facc15] hover:bg-[#fde047] shadow-lg shadow-yellow-500/20 hover:scale-105 transition-all uppercase"
          >
            Dashboard
          </NuxtLink>
        </template>

        <template v-else>
          <NuxtLink to="/login" class="text-slate-300 hover:text-white transition-colors">
            Log in
          </NuxtLink>

          <NuxtLink
            to="/signup"
            class="px-5 py-2 rounded-full text-xs font-black text-[#0c0919] bg-[#facc15] hover:bg-[#fde047] shadow-lg shadow-yellow-500/20 hover:scale-105 transition-all uppercase"
          >
            Get Started
          </NuxtLink>
        </template>
      </nav>
    </div>
  </header>
</template>
