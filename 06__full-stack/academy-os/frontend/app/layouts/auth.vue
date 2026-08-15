<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white relative overflow-hidden">
    <!-- Background subtle ambient light gradients -->
    <div class="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>
    <div class="absolute -bottom-40 -right-40 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl pointer-events-none"></div>

    <header class="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between z-10">
      <NuxtLink to="/" class="flex items-center gap-3 group">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform duration-200">
          A
        </div>
        <span class="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
          AcademyOS
        </span>
      </NuxtLink>
    </header>

    <main class="flex-1 flex items-center justify-center p-6 z-10">
      <div class="w-full max-w-md">
        <slot />
      </div>
    </main>

    <footer class="w-full max-w-7xl mx-auto px-6 py-6 text-center text-xs text-slate-500 z-10">
      &copy; {{ new Date().getFullYear() }} AcademyOS. All rights reserved.
    </footer>
  </div>
</template>
