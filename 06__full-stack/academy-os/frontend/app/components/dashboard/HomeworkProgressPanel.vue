<script setup lang="ts">
import { ref } from 'vue'
import { CheckCircle2, Circle, ChevronDown, Clock } from 'lucide-vue-next'
import gsap from 'gsap'

interface Task {
  id: number
  title: string
  deadline: string
  status: 'todo' | 'review' | 'completed'
}

const tasks = ref<Task[]>([
  { id: 1, title: 'Multi-Tenant Database Migrations & Session Schema', deadline: '30 Mar, 2026', status: 'todo' },
  { id: 2, title: 'Go Monolith API Integration & Auth Handlers', deadline: '29 Mar, 2026', status: 'todo' },
  { id: 3, title: 'FFmpeg HLS Transcoding & Worker Queue setup', deadline: '03 Apr, 2026', status: 'todo' },
  { id: 4, title: 'Branded Tenant Domain Scoping & SSL Setup', deadline: '30 Mar, 2026', status: 'review' },
  { id: 5, title: 'Nuxt 4 Authentication Composable & Route Guard', deadline: '25 Mar, 2026', status: 'completed' },
  { id: 6, title: 'Cosmic Dark Astronaut Landing Page & Hero GSAP', deadline: '24 Mar, 2026', status: 'completed' }
])

const toggleTask = (task: Task, event: MouseEvent) => {
  const target = event.currentTarget as HTMLElement
  if (task.status === 'completed') {
    task.status = 'todo'
  } else {
    task.status = 'completed'
    // Bounce animation using GSAP
    gsap.fromTo(target, { scale: 0.9 }, { scale: 1, duration: 0.3, ease: 'back.out(2)' })
  }
}
</script>

<template>
  <div class="bg-[#0c0919]/90 rounded-3xl p-6 border border-purple-900/40 shadow-xl backdrop-blur-md flex flex-col h-full">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6 pb-4 border-b border-purple-900/40">
      <h3 class="text-base font-extrabold text-white tracking-tight uppercase">Module Milestones</h3>
      <div class="flex items-center space-x-1 text-xs font-bold text-yellow-400 hover:text-yellow-300 cursor-pointer uppercase tracking-wider">
        <span>All</span>
        <ChevronDown class="w-3.5 h-3.5" />
      </div>
    </div>

    <div class="space-y-6 overflow-y-auto pr-1 flex-1">
      <!-- Section 1: To Do -->
      <div>
        <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">To do</h4>
        <div class="space-y-3">
          <div
            v-for="task in tasks.filter(t => t.status === 'todo')"
            :key="task.id"
            @click="toggleTask(task, $event)"
            class="flex items-start space-x-3 p-3.5 rounded-2xl bg-purple-950/40 border border-purple-900/40 hover:border-purple-500/60 transition-all duration-200 cursor-pointer group"
          >
            <Circle class="w-5 h-5 text-purple-400 group-hover:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div class="flex-1">
              <h5 class="text-xs font-extrabold text-white leading-snug group-hover:text-yellow-400 transition-colors">
                {{ task.title }}
              </h5>
              <div class="flex items-center space-x-1.5 mt-1 text-[11px] text-slate-400">
                <Clock class="w-3 h-3 text-purple-400" />
                <span>Deadline {{ task.deadline }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Section 2: On Review -->
      <div>
        <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">On review</h4>
        <div class="space-y-3">
          <div
            v-for="task in tasks.filter(t => t.status === 'review')"
            :key="task.id"
            @click="toggleTask(task, $event)"
            class="flex items-start space-x-3 p-3.5 rounded-2xl bg-purple-950/40 border border-purple-900/40 hover:border-purple-500/60 transition-all duration-200 cursor-pointer group"
          >
            <Circle class="w-5 h-5 text-purple-400 group-hover:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div class="flex-1">
              <h5 class="text-xs font-extrabold text-white leading-snug group-hover:text-yellow-400 transition-colors">
                {{ task.title }}
              </h5>
              <div class="flex items-center space-x-1.5 mt-1 text-[11px] text-slate-400">
                <Clock class="w-3 h-3 text-purple-400" />
                <span>Deadline {{ task.deadline }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Section 3: Completed -->
      <div>
        <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Completed</h4>
        <div class="space-y-3">
          <div
            v-for="task in tasks.filter(t => t.status === 'completed')"
            :key="task.id"
            @click="toggleTask(task, $event)"
            class="flex items-start space-x-3 p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-900/40 transition-all duration-200 cursor-pointer group"
          >
            <CheckCircle2 class="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div class="flex-1">
              <h5 class="text-xs font-extrabold text-slate-300 leading-snug line-through decoration-slate-500">
                {{ task.title }}
              </h5>
              <div class="flex items-center space-x-1.5 mt-1 text-[11px] text-slate-400">
                <Clock class="w-3 h-3 text-emerald-500" />
                <span>Completed {{ task.deadline }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
