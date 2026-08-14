<script setup lang="ts">
import { ref } from 'vue'
import { Calendar } from 'lucide-vue-next'

const selectedDay = ref('Thu')

const days = [
  { day: 'Mon', date: '25' },
  { day: 'Tue', date: '26' },
  { day: 'Wed', date: '27' },
  { day: 'Thu', date: '28' },
  { day: 'Fri', date: '29' },
  { day: 'Sat', date: '30' },
  { day: 'Sun', date: '31' }
]

const scheduleItems = [
  {
    time: '08:00',
    title: 'Algorithms & Fullstack Architecture',
    duration: '08:00 - 09:00',
    subject: 'Engineering',
    subjectColor: 'bg-purple-600 text-white',
    avatars: [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=80'
    ]
  },
  {
    time: '09:00',
    title: 'Distributed Multi-Tenant Systems',
    duration: '09:00 - 10:00',
    subject: 'Backend Go',
    subjectColor: 'bg-indigo-600 text-white',
    avatars: [
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=80&q=80'
    ]
  },
  {
    time: '10:00',
    title: 'Coffee & Review Break',
    duration: '10:00 - 10:30',
    isBreak: true,
    liveMarker: '10:15'
  }
]
</script>

<template>
  <div class="bg-[#0c0919]/90 rounded-3xl p-6 border border-purple-900/40 shadow-xl backdrop-blur-md flex flex-col justify-between">
    <!-- Header -->
    <div class="flex items-center justify-between mb-5">
      <div class="flex items-center space-x-2">
        <h3 class="text-base font-extrabold text-white tracking-tight uppercase">Live Schedule</h3>
        <Calendar class="w-4 h-4 text-yellow-400" />
      </div>
      <span class="text-xs font-mono text-purple-300">Mar 28, 2026</span>
    </div>

    <!-- Interactive Day Selector -->
    <div class="grid grid-cols-7 gap-1.5 p-1 bg-purple-950/40 rounded-2xl mb-6 border border-purple-900/50">
      <button
        v-for="d in days"
        :key="d.day"
        @click="selectedDay = d.day"
        class="flex flex-col items-center justify-center py-2.5 rounded-xl transition-all duration-200"
        :class="selectedDay === d.day ? 'bg-[#facc15] text-[#0c0919] font-black shadow-lg shadow-yellow-500/20 scale-105' : 'text-slate-400 hover:text-white font-semibold'"
      >
        <span class="text-[10px] uppercase tracking-wider mb-0.5" :class="selectedDay === d.day ? 'text-[#0c0919]' : 'text-slate-400'">{{ d.day }}</span>
        <span class="text-sm leading-none">{{ d.date }}</span>
      </button>
    </div>

    <!-- Schedule List -->
    <div class="space-y-4">
      <div v-for="item in scheduleItems" :key="item.title" class="relative pl-14">
        <!-- Time Marker Column -->
        <div class="absolute left-0 top-1 text-xs font-bold text-slate-400">
          <span>{{ item.time }}</span>
          <span v-if="item.liveMarker" class="block mt-4 px-1.5 py-0.5 rounded text-[10px] font-black bg-yellow-400 text-[#0c0919]">
            {{ item.liveMarker }}
          </span>
        </div>

        <!-- Schedule Card -->
        <div
          class="rounded-2xl p-4 transition-all duration-200 border"
          :class="item.isBreak ? 'bg-purple-950/20 border-dashed border-purple-900/50' : 'bg-purple-950/40 border-purple-900/40 hover:border-purple-500/60'"
        >
          <div class="flex items-center justify-between">
            <div>
              <h4 class="text-xs font-extrabold text-white leading-snug">{{ item.title }}</h4>
              <span class="text-[11px] font-medium text-slate-400 mt-1 block">{{ item.duration }}</span>
            </div>

            <!-- Subject Badge or Break Indicator -->
            <div class="flex items-center space-x-3">
              <div v-if="item.avatars" class="hidden sm:flex items-center -space-x-2">
                <img
                  v-for="(img, idx) in item.avatars"
                  :key="idx"
                  :src="img"
                  alt="Student"
                  class="w-6 h-6 rounded-full border-2 border-[#0c0919] object-cover"
                />
              </div>

              <span
                v-if="item.subject"
                class="px-3 py-1 rounded-xl text-[11px] font-bold shadow-sm"
                :class="item.subjectColor"
              >
                {{ item.subject }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
