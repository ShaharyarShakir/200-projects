<script setup lang="ts">
import { onMounted, ref } from 'vue'
import gsap from 'gsap'
import DashboardHeroBanner from '../dashboard/DashboardHeroBanner.vue'
import DashboardStats from '../dashboard/DashboardStats.vue'
import DashboardTimetable from '../dashboard/DashboardTimetable.vue'
import DashboardUpcomingEvents from '../dashboard/DashboardUpcomingEvents.vue'
import HomeworkProgressPanel from '../dashboard/HomeworkProgressPanel.vue'

const { user } = useAuth()
const heroRef = ref<HTMLElement | null>(null)
const statsRef = ref<HTMLElement | null>(null)
const timetableRef = ref<HTMLElement | null>(null)
const eventsRef = ref<HTMLElement | null>(null)
const homeworkRef = ref<HTMLElement | null>(null)

onMounted(() => {
  const tl = gsap.timeline({ defaults: { ease: 'power3.out', duration: 0.7 } })

  if (heroRef.value) {
    tl.fromTo(heroRef.value, { opacity: 0, scale: 0.96, y: -10 }, { opacity: 1, scale: 1, y: 0, ease: 'back.out(1.2)' })
  }

  if (statsRef.value) {
    tl.fromTo(statsRef.value.children, { opacity: 0, y: 20 }, { opacity: 1, y: 0, stagger: 0.1 }, '-=0.4')
  }

  if (timetableRef.value && eventsRef.value) {
    tl.fromTo([timetableRef.value, eventsRef.value], { opacity: 0, y: 25 }, { opacity: 1, y: 0, stagger: 0.15 }, '-=0.3')
  }

  if (homeworkRef.value) {
    tl.fromTo(homeworkRef.value, { opacity: 0, x: 30 }, { opacity: 1, x: 0 }, '-=0.5')
  }
})
</script>

<template>
  <div class="min-h-screen bg-[#0c0919] text-white p-4 sm:p-6 lg:p-8 space-y-6">
    <!-- Top Search & User Bar -->
    <div class="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#0c0919]/90 rounded-3xl p-4 border border-purple-900/40 shadow-xl backdrop-blur-md">
      <!-- Search Input -->
      <div class="relative w-full sm:w-96">
        <input
          type="text"
          placeholder="Search courses, lessons, homework..."
          class="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-purple-950/40 text-xs font-semibold text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 border border-purple-900/50"
        />
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 absolute left-3.5 top-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      <!-- Right User & Notifications -->
      <div class="flex items-center space-x-4">
        <button class="relative p-2.5 rounded-2xl bg-purple-950/40 hover:bg-purple-900/50 transition text-slate-300 border border-purple-900/40">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span class="absolute top-2 right-2 w-2 h-2 rounded-full bg-yellow-400"></span>
        </button>

        <div class="flex items-center space-x-3 border-l border-purple-900/40 pl-4">
          <div class="w-10 h-10 rounded-full bg-gradient-to-tr from-yellow-400 to-amber-500 flex items-center justify-center font-black text-[#0c0919] shadow-md">
            {{ (user?.name || 'A')[0].toUpperCase() }}
          </div>
          <div class="hidden md:flex flex-col">
            <span class="text-xs font-extrabold text-white leading-tight">{{ user?.name || 'Instructor' }}</span>
            <span class="text-[10px] font-bold text-yellow-400 uppercase tracking-wider">Instructor</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Grid Layout (2-Column Desktop View) -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      <!-- Left 2 Columns -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Hero Welcome Banner -->
        <div ref="heroRef">
          <DashboardHeroBanner :userName="user?.name || 'Instructor'" :progressPercent="75" />
        </div>

        <!-- Stat Cards Row -->
        <div ref="statsRef">
          <DashboardStats />
        </div>

        <!-- Timetable & Events 2-Column Split -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div ref="timetableRef">
            <DashboardTimetable />
          </div>
          <div ref="eventsRef">
            <DashboardUpcomingEvents />
          </div>
        </div>
      </div>

      <!-- Right 1 Column (Homework Progress Panel) -->
      <div ref="homeworkRef" class="h-full">
        <HomeworkProgressPanel />
      </div>
    </div>
  </div>
</template>
