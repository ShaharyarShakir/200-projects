<script setup lang="ts">
const events = [
  {
    id: 1,
    title: 'Vue 3 & Nuxt 4 Architecture Workshop',
    date: '18 Apr, 2026, 12:00',
    image: '/images/cosmic_pink_planet.png'
  },
  {
    id: 2,
    title: 'Go Monolith & Database Session Masterclass',
    date: '20 May, 2026, 15:00',
    image: '/images/cosmic_astronaut.png'
  },
  {
    id: 3,
    title: 'AI Ingestion & FFmpeg Video Pipeline',
    date: '09 Jun, 2026, 09:30',
    image: '/images/cosmic_pink_planet.png'
  }
]
</script>

<template>
  <div class="bg-[#0c0919]/90 rounded-3xl p-6 border border-purple-900/40 shadow-xl backdrop-blur-md flex flex-col justify-between">
    <!-- Header -->
    <div class="flex items-center justify-between mb-5">
      <h3 class="text-base font-extrabold text-white tracking-tight uppercase">Upcoming Events</h3>
      <span class="text-xs font-bold text-yellow-400 hover:text-yellow-300 cursor-pointer uppercase tracking-wider">See all</span>
    </div>

    <!-- Event Cards Grid -->
    <div class="space-y-3.5">
      <div
        v-for="ev in events"
        :key="ev.id"
        class="group relative h-24 rounded-2xl overflow-hidden border border-purple-900/40 hover:border-purple-500/50 hover:shadow-2xl transition-all duration-300 flex items-center justify-between px-5 cursor-pointer"
      >
        <!-- Background Cover Image with Overlay -->
        <img
          :src="ev.image"
          :alt="ev.title"
          class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-40"
        />
        <div class="absolute inset-0 bg-gradient-to-r from-[#0c0919] via-purple-950/80 to-[#0c0919]/60"></div>

        <!-- Event Meta Text -->
        <div class="relative z-10 text-white">
          <h4 class="text-xs sm:text-sm font-extrabold tracking-tight group-hover:text-yellow-400 transition-colors duration-200">
            {{ ev.title }}
          </h4>
          <span class="text-[11px] font-mono text-purple-300 block mt-0.5">
            {{ ev.date }}
          </span>
        </div>

        <!-- Action Pill Button -->
        <div class="relative z-10">
          <button class="px-3.5 py-1.5 rounded-full text-[11px] font-black text-[#0c0919] bg-[#facc15] hover:bg-[#fde047] group-hover:scale-105 transition-all duration-200 uppercase">
            More details
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
