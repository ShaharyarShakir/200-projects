<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { gsap } from 'gsap'
import { Building2, Plus, ShieldCheck, Check, LayoutDashboard, Globe, ExternalLink, Sparkles } from 'lucide-vue-next'
import { useTenant } from '~/composables/useTenant'
import type { TenantMembership } from '~/types/tenant'
import CreateTenantModal from '~/components/CreateTenantModal.vue'

const { tenants, currentTenant, fetchTenants, selectTenant, isLoading } = useTenant()
const isModalOpen = ref(false)
const pageContainer = ref<HTMLElement | null>(null)

onMounted(async () => {
  await fetchTenants()
  if (pageContainer.value) {
    gsap.from(pageContainer.value.querySelectorAll('.gsap-card'), {
      opacity: 0,
      y: 30,
      duration: 0.7,
      stagger: 0.08,
      ease: 'power3.out'
    })
  }
})

function handleActivate(tenant: TenantMembership) {
  selectTenant(tenant)
}

function roleBadgeClass(role: string) {
  switch (role.toLowerCase()) {
    case 'owner':
      return 'bg-yellow-400 text-[#0c0919]'
    case 'admin':
      return 'bg-purple-600 text-white'
    case 'instructor':
      return 'bg-cyan-500 text-slate-950'
    default:
      return 'bg-slate-800 text-slate-300'
  }
}
</script>

<template>
  <div ref="pageContainer" class="min-h-screen bg-[#0c0919] text-white py-12 px-4 sm:px-6 lg:px-8 select-none">
    <div class="max-w-5xl mx-auto space-y-8">
      <!-- Header -->
      <div class="gsap-card flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-purple-900/40 pb-6">
        <div>
          <div class="flex items-center gap-2 text-xs font-black text-yellow-400 uppercase tracking-widest">
            <Building2 class="w-4 h-4" />
            <span>Multi-Tenant Hub</span>
          </div>
          <h1 class="text-3xl sm:text-4xl font-black tracking-tight text-white uppercase mt-1">Your Organizations & Tenants</h1>
          <p class="text-sm text-slate-300 mt-1">Manage and switch between your isolated tenant environments</p>
        </div>

        <button
          @click="isModalOpen = true"
          class="px-6 py-3 rounded-2xl text-xs sm:text-sm font-black text-[#0c0919] bg-[#facc15] hover:bg-[#fde047] shadow-xl shadow-yellow-500/20 hover:scale-105 transition-all uppercase flex items-center gap-2"
        >
          <Plus class="w-4 h-4" />
          Create New Tenant
        </button>
      </div>

      <!-- Loading Spinner -->
      <div v-if="isLoading" class="flex justify-center items-center py-20">
        <span class="loading loading-spinner loading-lg text-yellow-400"></span>
      </div>

      <!-- Empty State -->
      <div v-else-if="tenants.length === 0" class="gsap-card text-center py-16 px-6 bg-[#0c0919]/90 backdrop-blur-xl rounded-3xl border border-dashed border-purple-900/60 shadow-2xl space-y-4">
        <div class="w-16 h-16 bg-yellow-400/20 text-yellow-400 border border-yellow-400/30 rounded-2xl mx-auto flex items-center justify-center">
          <Building2 class="w-8 h-8" />
        </div>
        <div>
          <h3 class="text-xl font-black text-white uppercase">No Organizations Found</h3>
          <p class="text-sm text-slate-300 max-w-sm mx-auto mt-2">You are not currently a member of any tenant. Create your first organization to get started.</p>
        </div>
        <button
          @click="isModalOpen = true"
          class="px-6 py-3 rounded-2xl text-xs sm:text-sm font-black text-[#0c0919] bg-[#facc15] hover:bg-[#fde047] shadow-xl shadow-yellow-500/20 hover:scale-105 transition-all uppercase inline-flex items-center gap-2"
        >
          <Plus class="w-4 h-4" />
          Create Tenant Now
        </button>
      </div>

      <!-- Tenant Grid -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div
          v-for="t in tenants"
          :key="t.id"
          class="gsap-card bg-[#0c0919]/90 border transition-all duration-300 flex flex-col justify-between rounded-3xl overflow-hidden shadow-xl backdrop-blur-md"
          :class="currentTenant?.id === t.id ? 'border-yellow-400/80 shadow-2xl shadow-purple-950/60 ring-2 ring-yellow-400/20' : 'border-purple-900/40 hover:border-purple-500/50'"
        >
          <div class="p-6 space-y-4">
            <!-- Active Indicator & Role -->
            <div class="flex justify-between items-center">
              <span
                v-if="currentTenant?.id === t.id"
                class="px-3 py-1 bg-yellow-400/20 border border-yellow-400/40 text-yellow-400 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5"
              >
                <Check class="w-3.5 h-3.5" /> Active Space
              </span>
              <span v-else class="text-xs text-slate-400 font-mono">ID: {{ t.id.substring(0, 8) }}...</span>

              <span class="font-mono font-bold uppercase text-[10px] px-3 py-1 rounded-full shadow-sm" :class="roleBadgeClass(t.role)">
                {{ t.role }}
              </span>
            </div>

            <!-- Tenant Title & Slug -->
            <div>
              <h2 class="text-xl font-black text-white uppercase tracking-tight">
                {{ t.name }}
              </h2>
              <p class="text-xs font-mono text-slate-400 mt-1">
                slug: <span class="text-yellow-400 font-semibold">@{{ t.slug }}</span>
              </p>
            </div>
          </div>

          <!-- Card Actions -->
          <div class="p-4 bg-purple-950/30 border-t border-purple-900/40 flex flex-wrap items-center justify-between gap-2">
            <button
              v-if="currentTenant?.id !== t.id"
              @click="handleActivate(t)"
              class="px-4 py-2 rounded-xl text-xs font-bold text-slate-200 bg-white/5 hover:bg-white/10 border border-slate-700/80 transition-all flex items-center gap-1.5"
            >
              <Check class="w-4 h-4 text-yellow-400" />
              Switch to Tenant
            </button>
            <span v-else class="text-xs font-black text-yellow-400 uppercase tracking-wider flex items-center gap-1">
              <Check class="w-4 h-4" /> Selected Space
            </span>

            <div class="flex items-center gap-2">
              <NuxtLink
                :to="`/t/${t.slug}/courses`"
                class="px-3 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-1"
                title="View Public Catalog"
              >
                <Globe class="w-3.5 h-3.5 text-purple-400" />
                Public Catalog
              </NuxtLink>
              <NuxtLink
                :to="`/t/${t.slug}/dashboard`"
                class="px-4 py-2 rounded-xl text-xs font-black text-[#0c0919] bg-[#facc15] hover:bg-[#fde047] transition-all uppercase flex items-center gap-1"
              >
                <LayoutDashboard class="w-3.5 h-3.5" />
                Dashboard
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>

      <!-- Create Tenant Modal -->
      <CreateTenantModal
        :isOpen="isModalOpen"
        @close="isModalOpen = false"
        @created="(slug) => navigateTo(`/t/${slug}/dashboard`)"
      />
    </div>
  </div>
</template>
