<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from '#imports'
import { Building2, BookOpen, Plus, Globe, Video, ShieldCheck, Layers, Sparkles, Edit3, ArrowRight, RefreshCw, CheckCircle2, Clock } from 'lucide-vue-next'
import { useTenant } from '~/composables/useTenant'
import { useApi } from '~/composables/useApi'

const route = useRoute()
const tenantSlug = computed(() => (route.params.tenantSlug as string) || '')

const { tenants, currentTenant, selectTenant, fetchTenants } = useTenant()
const api = useApi()

interface Course {
  id: string
  title: string
  description?: string
  status?: string
  created_at?: string
}

const isInstructorOrOwner = computed(() => {
  const role = currentTenant.value?.role?.toLowerCase()
  return role === 'owner' || role === 'instructor' || role === 'admin'
})

// Fetch courses (all courses if instructor/owner, public courses otherwise)
const { data: coursesData, pending, refresh } = await useAsyncData<any>(
  `dashboard-courses-${tenantSlug.value}`,
  async () => {
    try {
      if (isInstructorOrOwner.value) {
        const res: any = await api.request('/api/courses')
        return Array.isArray(res) ? res : res?.courses || []
      }
      const res: any = await api.request(`/api/public/tenants/${tenantSlug.value}/courses`)
      return Array.isArray(res) ? res : []
    } catch {
      return []
    }
  },
  { watch: [tenantSlug, isInstructorOrOwner] }
)

const courses = computed<Course[]>(() => coursesData.value || [])

onMounted(async () => {
  if (tenants.value.length === 0) {
    await fetchTenants()
  }
  const matched = tenants.value.find((t: any) => t.slug === tenantSlug.value || t.tenant?.slug === tenantSlug.value)
  if (matched && currentTenant.value?.id !== (matched.id || matched.tenant?.id)) {
    selectTenant(matched)
  }
})
</script>

<template>
  <div class="min-h-screen bg-[#0c0919] text-white py-10 px-4 sm:px-6 lg:px-8 select-none">
    <div class="max-w-6xl mx-auto space-y-8">
      <!-- Tenant Overview Header -->
      <div class="bg-[#130f26]/80 border border-purple-900/40 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div class="space-y-2">
          <div class="inline-flex items-center gap-2 px-3 py-1 bg-yellow-400/10 border border-yellow-400/30 rounded-full text-xs font-black text-yellow-400 uppercase tracking-widest">
            <Building2 class="w-3.5 h-3.5" />
            <span>Organization Dashboard</span>
          </div>

          <div class="flex flex-wrap items-center gap-3">
            <h1 class="text-3xl sm:text-4xl font-black tracking-tight text-white uppercase">{{ currentTenant?.name || tenantSlug }}</h1>
            <span class="px-3 py-1 bg-purple-600/20 border border-purple-500/30 text-purple-300 font-mono font-bold uppercase rounded-full text-xs">
              {{ currentTenant?.role || 'Member' }}
            </span>
          </div>

          <p class="text-xs font-mono text-slate-400">
            Domain/Slug: <span class="text-yellow-400 font-semibold">@{{ tenantSlug }}</span>
          </p>
        </div>

        <!-- Header Actions -->
        <div class="flex flex-wrap items-center gap-3">
          <NuxtLink
            :to="`/t/${tenantSlug}/courses`"
            class="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold text-slate-300 bg-purple-950/60 hover:bg-purple-900/60 border border-purple-800/40 hover:text-white transition-all"
          >
            <Globe class="w-4 h-4 text-purple-400" />
            <span>Public Catalog</span>
          </NuxtLink>

          <NuxtLink
            v-if="isInstructorOrOwner"
            to="/instructor/courses"
            class="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black text-[#0c0919] bg-[#facc15] hover:bg-[#fde047] shadow-xl shadow-yellow-500/20 hover:scale-105 transition-all uppercase cursor-pointer"
          >
            <Video class="w-4 h-4 stroke-[2.5]" />
            <span>Instructor Studio</span>
          </NuxtLink>
        </div>
      </div>

      <!-- Quick Metrics Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <!-- Card 1: Courses Count -->
        <div class="bg-[#130f26]/60 border border-purple-900/30 rounded-2xl p-5 flex items-center gap-4 backdrop-blur-md">
          <div class="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/30 text-yellow-400 flex items-center justify-center font-bold">
            <BookOpen class="w-6 h-6" />
          </div>
          <div>
            <div class="text-2xl font-black text-white">{{ courses.length }}</div>
            <div class="text-xs text-slate-400 font-medium uppercase tracking-wider">Total Courses</div>
          </div>
        </div>

        <!-- Card 2: User Role -->
        <div class="bg-[#130f26]/60 border border-purple-900/30 rounded-2xl p-5 flex items-center gap-4 backdrop-blur-md">
          <div class="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center font-bold">
            <ShieldCheck class="w-6 h-6" />
          </div>
          <div>
            <div class="text-2xl font-black text-white capitalize">{{ currentTenant?.role || 'Member' }}</div>
            <div class="text-xs text-slate-400 font-medium uppercase tracking-wider">Permission Level</div>
          </div>
        </div>

        <!-- Card 3: Storage Isolation -->
        <div class="bg-[#130f26]/60 border border-purple-900/30 rounded-2xl p-5 flex items-center gap-4 backdrop-blur-md">
          <div class="w-12 h-12 rounded-2xl bg-amber-600/20 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold">
            <Layers class="w-6 h-6" />
          </div>
          <div>
            <div class="text-xs font-mono font-bold text-amber-400 uppercase">Isolated S3 Storage</div>
            <div class="text-[11px] text-slate-400 font-mono truncate max-w-[160px] mt-0.5">tenants/{{ tenantSlug }}/...</div>
          </div>
        </div>
      </div>

      <!-- Courses List Section -->
      <div class="space-y-4">
        <div class="flex justify-between items-center border-b border-purple-900/40 pb-3">
          <h2 class="text-xl font-black text-white uppercase tracking-tight">Organization Courses</h2>
          <button @click="refresh()" class="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-yellow-400 transition-colors">
            <RefreshCw class="w-3.5 h-3.5" /> Refresh
          </button>
        </div>

        <!-- Loading State -->
        <div v-if="pending" class="flex justify-center py-16 bg-[#130f26]/40 border border-purple-900/30 rounded-3xl">
          <div class="flex items-center gap-3 text-slate-400 text-sm font-medium">
            <div class="w-6 h-6 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
            Loading courses...
          </div>
        </div>

        <!-- Empty State -->
        <div v-else-if="courses.length === 0" class="text-center py-14 bg-[#130f26]/60 border border-purple-900/40 rounded-3xl backdrop-blur-xl flex flex-col items-center justify-center space-y-4">
          <div class="w-14 h-14 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-yellow-400">
            <BookOpen class="w-7 h-7" />
          </div>
          <div class="space-y-1 max-w-sm">
            <h3 class="text-lg font-black text-white uppercase">No Courses Found</h3>
            <p class="text-xs text-slate-400 leading-relaxed">This organization has no courses created or published yet.</p>
          </div>
          <NuxtLink
            v-if="isInstructorOrOwner"
            to="/instructor/courses/new"
            class="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black text-[#0c0919] bg-[#facc15] hover:bg-[#fde047] shadow-lg shadow-yellow-500/20 hover:scale-105 transition-all uppercase cursor-pointer"
          >
            <Plus class="w-4 h-4 stroke-[3]" />
            <span>Create First Course</span>
          </NuxtLink>
        </div>

        <!-- Course Cards Grid -->
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            v-for="course in courses"
            :key="course.id"
            class="bg-[#0c0919]/90 border border-purple-900/40 hover:border-purple-500/60 p-6 rounded-3xl shadow-xl backdrop-blur-md hover:shadow-2xl hover:shadow-purple-900/20 transition-all duration-300 flex flex-col justify-between group space-y-5"
          >
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <span
                  class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border"
                  :class="course.status === 'published' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'"
                >
                  <CheckCircle2 v-if="course.status === 'published'" class="w-3.5 h-3.5" />
                  <Clock v-else class="w-3.5 h-3.5" />
                  {{ course.status || 'Draft' }}
                </span>
              </div>

              <h3 class="text-lg font-black text-white group-hover:text-yellow-400 transition-colors line-clamp-2">
                {{ course.title }}
              </h3>

              <p class="text-slate-400 text-xs line-clamp-3 leading-relaxed">
                {{ course.description || 'No description provided.' }}
              </p>
            </div>

            <div class="pt-4 border-t border-purple-900/30 flex items-center justify-between gap-2">
              <NuxtLink
                v-if="isInstructorOrOwner"
                :to="`/instructor/courses/${course.id}`"
                class="inline-flex items-center gap-1.5 text-xs font-black text-[#0c0919] bg-[#facc15] hover:bg-[#fde047] px-3.5 py-2 rounded-xl shadow-md transition-all uppercase"
              >
                <Edit3 class="w-3.5 h-3.5" />
                <span>Edit & Upload</span>
              </NuxtLink>

              <NuxtLink
                :to="`/t/${tenantSlug}/courses/${course.id}`"
                class="inline-flex items-center gap-1 text-xs font-bold text-slate-300 hover:text-white transition-colors"
              >
                <span>Preview</span>
                <ArrowRight class="w-3.5 h-3.5" />
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

