<script setup lang="ts">
import { gsap } from 'gsap'
import { Users, Search, GraduationCap, Calendar, BookOpen, AlertCircle, RefreshCw } from 'lucide-vue-next'

definePageMeta({
  layout: 'admin',
  middleware: 'auth'
})

const { academy } = useAcademy()
const { fetch: apiFetch } = useApi()
const pageContainer = ref<HTMLElement | null>(null)
const searchQuery = ref('')

interface StudentItem {
  enrollment_id: string
  user_id: string
  student_name: string
  student_email: string
  course_id: string
  course_title: string
  joined_at: string
}

const { data: studentResponse, pending, refresh } = await useAsyncData<{ students: StudentItem[] }>(
  'academy-students-list',
  () => apiFetch<{ students: StudentItem[] }>('/api/academy/students').catch(() => ({ students: [] }))
)

const students = computed(() => studentResponse.value?.students || [])

const filteredStudents = computed(() => {
  if (!searchQuery.value.trim()) return students.value
  const q = searchQuery.value.toLowerCase()
  return students.value.filter(
    (s) => s.student_name.toLowerCase().includes(q) || s.student_email.toLowerCase().includes(q) || s.course_title.toLowerCase().includes(q)
  )
})

onMounted(() => {
  if (pageContainer.value) {
    gsap.from(pageContainer.value.querySelectorAll('.gsap-card'), {
      opacity: 0,
      y: 25,
      duration: 0.6,
      stagger: 0.08,
      ease: 'power3.out'
    })
  }
})
</script>

<template>
  <div ref="pageContainer" class="space-y-8 select-none">
    <!-- Header Banner -->
    <div class="gsap-card bg-gradient-to-r from-purple-950/80 via-indigo-900/50 to-[#0c0919] p-8 rounded-3xl border border-purple-500/30 shadow-2xl backdrop-blur-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
      <div class="space-y-2">
        <div class="inline-flex items-center gap-2 px-3 py-1 bg-yellow-400/10 border border-yellow-400/30 rounded-full text-xs font-black text-yellow-400 uppercase tracking-widest">
          <Users class="w-3.5 h-3.5" />
          <span>Student Roster</span>
        </div>
        <h1 class="text-3xl font-black tracking-tight text-white uppercase leading-tight">
          Enrolled <span class="bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 bg-clip-text text-transparent">Students</span>
        </h1>
        <p class="text-slate-300 text-sm max-w-xl">
          View and manage students enrolled across courses in <strong class="text-white">{{ academy?.name || 'your academy' }}</strong>.
        </p>
      </div>

      <button
        @click="() => refresh()"
        class="px-4 py-2.5 bg-purple-900/40 hover:bg-purple-800/60 border border-purple-500/40 rounded-2xl text-xs font-bold text-purple-200 transition-all flex items-center gap-2"
      >
        <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': pending }" />
        <span>Refresh Roster</span>
      </button>
    </div>

    <!-- Search & Filter Bar -->
    <div class="gsap-card bg-[#0c0919]/90 border border-purple-900/40 p-4 rounded-2xl shadow-xl backdrop-blur-md flex items-center gap-3">
      <Search class="w-4 h-4 text-purple-400 shrink-0 ml-2" />
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search by student name, email, or course..."
        class="w-full bg-transparent text-white placeholder-slate-500 text-sm font-medium focus:outline-none"
      />
    </div>

    <!-- Student Table / Grid -->
    <div class="gsap-card bg-[#0c0919]/90 border border-purple-900/40 rounded-3xl shadow-xl backdrop-blur-md overflow-hidden">
      <div v-if="pending" class="p-12 text-center text-slate-400 text-sm">
        Loading student roster...
      </div>

      <div v-else-if="filteredStudents.length === 0" class="p-12 text-center space-y-3">
        <GraduationCap class="w-12 h-12 text-purple-500/40 mx-auto" />
        <h3 class="text-lg font-black text-white uppercase">No enrolled students found</h3>
        <p class="text-xs text-slate-400 max-w-md mx-auto">
          When students enroll in your courses, their profile and enrollment details will appear here.
        </p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left text-sm text-slate-300">
          <thead class="bg-purple-950/40 text-[11px] font-black text-slate-400 uppercase tracking-wider border-b border-purple-900/40">
            <tr>
              <th scope="col" class="px-6 py-4">Student</th>
              <th scope="col" class="px-6 py-4">Enrolled Course</th>
              <th scope="col" class="px-6 py-4">Joined Date</th>
              <th scope="col" class="px-6 py-4 text-right">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-purple-900/20">
            <tr v-for="student in filteredStudents" :key="student.enrollment_id" class="hover:bg-purple-950/20 transition-colors">
              <td class="px-6 py-4 flex items-center gap-3">
                <div class="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center font-bold text-yellow-400 text-sm">
                  {{ student.student_name.charAt(0).toUpperCase() }}
                </div>
                <div>
                  <div class="font-bold text-white">{{ student.student_name }}</div>
                  <div class="text-xs text-slate-400 font-mono">{{ student.student_email }}</div>
                </div>
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center gap-2">
                  <BookOpen class="w-3.5 h-3.5 text-yellow-400" />
                  <span class="font-semibold text-slate-200">{{ student.course_title }}</span>
                </div>
              </td>
              <td class="px-6 py-4 text-xs font-mono text-slate-400">
                {{ student.joined_at ? new Date(student.joined_at).toLocaleDateString() : 'Active' }}
              </td>
              <td class="px-6 py-4 text-right">
                <span class="px-2.5 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-full text-[10px] font-black text-emerald-400 uppercase">
                  Enrolled
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
