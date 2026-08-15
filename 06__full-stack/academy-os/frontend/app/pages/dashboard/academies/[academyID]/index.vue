<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'academy']
})

const route = useRoute()
const academyID = computed(() => route.params.academyID as string)

const { academies, fetchAcademies } = useAcademies()
const { academy, setAcademy } = useAcademy()

const currentAcademy = computed(() => {
  return academies.value.find((a) => a.id === academyID.value) || academy.value
})

onMounted(async () => {
  if (academies.value.length === 0) {
    await fetchAcademies()
  }
  const found = academies.value.find((a) => a.id === academyID.value)
  if (found) {
    setAcademy(found as any)
  }
})
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 p-8">
    <div class="max-w-7xl mx-auto space-y-8">
      <!-- Top header with tenant context -->
      <div class="flex items-center justify-between border-b border-slate-800 pb-6">
        <div>
          <div class="flex items-center gap-3">
            <h1 class="text-3xl font-bold text-white">
              {{ currentAcademy?.name || 'Academy Dashboard' }}
            </h1>
            <span class="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Active Tenant
            </span>
          </div>
          <p class="text-slate-400 text-sm mt-1 font-mono">
            Academy ID: {{ academyID }}
          </p>
        </div>

        <NuxtLink
          to="/dashboard"
          class="px-4 py-2 text-sm font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
        >
          ← Switch Academy
        </NuxtLink>
      </div>

      <!-- Quick Action Navigation Tabs -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <NuxtLink
          :to="`/dashboard/academies/${academyID}/courses`"
          class="p-5 bg-slate-900/60 border border-slate-800 hover:border-indigo-500/50 rounded-xl transition-all group"
        >
          <div class="text-2xl mb-2">📚</div>
          <h3 class="font-semibold text-slate-100 group-hover:text-indigo-400 transition-colors">
            Courses
          </h3>
          <p class="text-xs text-slate-400 mt-1">
            Manage course modules, lessons, and assets.
          </p>
        </NuxtLink>

        <NuxtLink
          :to="`/dashboard/academies/${academyID}/students`"
          class="p-5 bg-slate-900/60 border border-slate-800 hover:border-violet-500/50 rounded-xl transition-all group"
        >
          <div class="text-2xl mb-2">🎓</div>
          <h3 class="font-semibold text-slate-100 group-hover:text-violet-400 transition-colors">
            Students
          </h3>
          <p class="text-xs text-slate-400 mt-1">
            View student enrollments and progress.
          </p>
        </NuxtLink>

        <NuxtLink
          :to="`/dashboard/academies/${academyID}/settings`"
          class="p-5 bg-slate-900/60 border border-slate-800 hover:border-cyan-500/50 rounded-xl transition-all group"
        >
          <div class="text-2xl mb-2">⚙️</div>
          <h3 class="font-semibold text-slate-100 group-hover:text-cyan-400 transition-colors">
            Settings
          </h3>
          <p class="text-xs text-slate-400 mt-1">
            Configure branding, domains, and access.
          </p>
        </NuxtLink>

        <div class="p-5 bg-slate-900/60 border border-slate-800 rounded-xl">
          <div class="text-2xl mb-2">📊</div>
          <h3 class="font-semibold text-slate-100">
            Analytics
          </h3>
          <p class="text-xs text-slate-400 mt-1">
            Tenant performance and student engagement metrics.
          </p>
        </div>
      </div>

      <!-- Overview Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="p-6 bg-slate-900 border border-slate-800 rounded-xl">
          <span class="text-slate-400 text-xs font-semibold uppercase tracking-wider">Tenant Scope</span>
          <p class="text-2xl font-bold text-slate-100 mt-2">Isolated</p>
          <p class="text-xs text-slate-400 mt-1">All API requests explicitly locked to this academy context</p>
        </div>

        <div class="p-6 bg-slate-900 border border-slate-800 rounded-xl">
          <span class="text-slate-400 text-xs font-semibold uppercase tracking-wider">Access Protocol</span>
          <p class="text-2xl font-bold text-slate-100 mt-2">Server Validated</p>
          <p class="text-xs text-slate-400 mt-1">RBAC & session verified on every backend request</p>
        </div>

        <div class="p-6 bg-slate-900 border border-slate-800 rounded-xl">
          <span class="text-slate-400 text-xs font-semibold uppercase tracking-wider">Status</span>
          <p class="text-2xl font-bold text-emerald-400 mt-2">Active</p>
          <p class="text-xs text-slate-400 mt-1">Tenant operating normally</p>
        </div>
      </div>
    </div>
  </div>
</template>
