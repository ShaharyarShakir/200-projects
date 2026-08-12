<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Building2, Plus, ShieldCheck, Check, LayoutDashboard, Globe, ExternalLink } from 'lucide-vue-next'
import { useTenant, type TenantMembership } from '~/composables/useTenant'
import CreateTenantModal from '~/components/CreateTenantModal.vue'

const { tenants, currentTenant, fetchTenants, selectTenant, isLoading } = useTenant()
const isModalOpen = ref(false)

onMounted(async () => {
  await fetchTenants()
})

function handleActivate(tenant: TenantMembership) {
  selectTenant(tenant)
}

function roleBadgeClass(role: string) {
  switch (role.toLowerCase()) {
    case 'owner':
      return 'badge-primary'
    case 'admin':
      return 'badge-secondary'
    case 'instructor':
      return 'badge-accent'
    default:
      return 'badge-ghost'
  }
}
</script>

<template>
  <div class="min-h-screen bg-base-100 text-base-content py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-5xl mx-auto space-y-8">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-base-300 pb-6">
        <div>
          <div class="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider">
            <Building2 class="w-4 h-4" />
            <span>Multi-Tenant Hub</span>
          </div>
          <h1 class="text-3xl font-black tracking-tight mt-1">Your Organizations & Tenants</h1>
          <p class="text-sm text-base-content/60 mt-1">Manage and switch between your isolated tenant environments</p>
        </div>

        <button
          @click="isModalOpen = true"
          class="btn btn-primary btn-md gap-2 rounded-xl font-semibold shadow-lg shadow-primary/25"
        >
          <Plus class="w-4 h-4" />
          Create New Tenant
        </button>
      </div>

      <!-- Loading Spinner -->
      <div v-if="isLoading" class="flex justify-center items-center py-20">
        <span class="loading loading-spinner loading-lg text-primary"></span>
      </div>

      <!-- Empty State -->
      <div v-else-if="tenants.length === 0" class="text-center py-16 bg-base-200/50 rounded-3xl border border-dashed border-base-300 space-y-4">
        <div class="w-16 h-16 bg-primary/10 text-primary rounded-2xl mx-auto flex items-center justify-center">
          <Building2 class="w-8 h-8" />
        </div>
        <div>
          <h3 class="text-lg font-bold">No Organizations Found</h3>
          <p class="text-sm text-base-content/60 max-w-sm mx-auto mt-1">You are not currently a member of any tenant. Create your first organization to get started.</p>
        </div>
        <button
          @click="isModalOpen = true"
          class="btn btn-primary btn-sm gap-2 rounded-xl"
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
          class="card bg-base-200/40 border transition-all duration-200 flex flex-col justify-between rounded-2xl overflow-hidden"
          :class="currentTenant?.id === t.id ? 'border-primary shadow-lg ring-2 ring-primary/20' : 'border-base-300 hover:border-base-400 hover:bg-base-200/70'"
        >
          <div class="card-body p-6">
            <!-- Active Indicator & Role -->
            <div class="flex justify-between items-center mb-3">
              <span
                v-if="currentTenant?.id === t.id"
                class="badge badge-primary gap-1 font-semibold text-xs py-2 px-3 rounded-lg"
              >
                <Check class="w-3.5 h-3.5" /> Active Space
              </span>
              <span v-else class="text-xs text-base-content/50 font-mono">ID: {{ t.id.substring(0, 8) }}...</span>

              <span class="badge font-mono font-bold uppercase text-[10px] px-2.5 py-1" :class="roleBadgeClass(t.role)">
                {{ t.role }}
              </span>
            </div>

            <!-- Tenant Title & Slug -->
            <h2 class="text-xl font-bold text-base-content flex items-center gap-2">
              {{ t.name }}
            </h2>
            <p class="text-xs font-mono text-base-content/60 mt-1">
              slug: <span class="text-primary font-semibold">@{{ t.slug }}</span>
            </p>
          </div>

          <!-- Card Actions -->
          <div class="p-4 bg-base-200/80 border-t border-base-300 flex flex-wrap items-center justify-between gap-2">
            <button
              v-if="currentTenant?.id !== t.id"
              @click="handleActivate(t)"
              class="btn btn-outline btn-sm rounded-xl font-semibold gap-1.5"
            >
              <Check class="w-4 h-4" />
              Switch to Tenant
            </button>
            <span v-else class="text-xs font-bold text-primary flex items-center gap-1">
              <Check class="w-4 h-4" /> Selected
            </span>

            <div class="flex items-center gap-2">
              <NuxtLink
                :to="`/t/${t.slug}/courses`"
                class="btn btn-ghost btn-sm text-xs rounded-xl gap-1"
                title="View Public Catalog"
              >
                <Globe class="w-3.5 h-3.5 text-base-content/70" />
                Public Catalog
              </NuxtLink>
              <NuxtLink
                :to="`/t/${t.slug}/dashboard`"
                class="btn btn-primary btn-sm rounded-xl gap-1"
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
