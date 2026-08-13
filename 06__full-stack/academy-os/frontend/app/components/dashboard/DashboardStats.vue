<script setup lang="ts">
import { Clock, BookOpen, Star, Zap } from 'lucide-vue-next'
</script>

<template>
  <div class="grid grid-cols-1 sm:grid-cols-3 gap-5">
    <!-- Attendance Card -->
    <div class="bg-[#0c0919]/90 rounded-3xl p-5 border border-purple-900/40 shadow-xl backdrop-blur-md hover:border-purple-500/50 transition duration-300 flex flex-col justify-between group">
      <div>
        <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400">Class Attendance</h4>
        <div class="mt-3 flex items-center space-x-3">
          <div class="w-10 h-10 rounded-2xl bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center group-hover:scale-110 transition duration-300">
            <Clock class="w-5 h-5" />
          </div>
          <span class="text-2xl font-black text-white tracking-tight">19/20</span>
        </div>
      </div>
      <p class="text-xs text-slate-400 mt-4 leading-relaxed font-medium">
        Awesome work! Consistently completing lessons each week.
      </p>
    </div>

    <!-- Homework Card -->
    <div class="bg-[#0c0919]/90 rounded-3xl p-5 border border-purple-900/40 shadow-xl backdrop-blur-md hover:border-purple-500/50 transition duration-300 flex flex-col justify-between group">
      <div>
        <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400">Assignments</h4>
        <div class="mt-3 flex items-center space-x-3">
          <div class="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center group-hover:scale-110 transition duration-300">
            <BookOpen class="w-5 h-5" />
          </div>
          <span class="text-2xl font-black text-white tracking-tight">53/56</span>
        </div>
      </div>
      <p class="text-xs text-slate-400 mt-4 leading-relaxed font-medium">
        Your next coding assignment is due in 2 days.
      </p>
    </div>

    <!-- Rating Card -->
    <div class="bg-[#0c0919]/90 rounded-3xl p-5 border border-purple-900/40 shadow-xl backdrop-blur-md hover:border-purple-500/50 transition duration-300 flex flex-col justify-between group">
      <div>
        <div class="flex items-center justify-between">
          <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400">Instructor Rating</h4>
          <span class="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-yellow-400 text-[#0c0919] uppercase tracking-wider">
            <Zap class="w-3 h-3 fill-current" />
            <span>AI Verified</span>
          </span>
        </div>
        <div class="mt-3 flex items-center space-x-3">
          <div class="w-10 h-10 rounded-2xl bg-amber-500/20 text-yellow-400 border border-amber-500/30 flex items-center justify-center group-hover:scale-110 transition duration-300">
            <Star class="w-5 h-5 fill-yellow-400 text-yellow-400" />
          </div>
          <span class="text-2xl font-black text-white tracking-tight">89/100</span>
        </div>
      </div>
      <div class="mt-4 flex items-center justify-between border-t border-purple-900/40 pt-3">
        <span class="text-xs text-slate-400 font-medium">Top 5% Instructor</span>
        <button class="text-xs font-black text-yellow-400 hover:text-yellow-300 flex items-center space-x-1 uppercase tracking-wider">
          <span>View Report</span>
          <span>&rarr;</span>
        </button>
      </div>
    </div>
  </div>
</template>
