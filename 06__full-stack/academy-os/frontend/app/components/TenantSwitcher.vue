<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Building2, ChevronDown, Plus, Check, ShieldCheck, UserCheck, Layers, LayoutDashboard } from 'lucide-vue-next'
import { useTenant, type TenantMembership } from '~/composables/useTenant'
import CreateTenantModal from './CreateTenantModal.vue'

const { tenants, currentTenant, fetchTenants, selectTenant } = useTenant()
const isModalOpen = ref(false)
const isDropdownOpen = ref(false)

onMounted(async () => {
  if (tenants.value.length === 0) {
    await fetchTenants()
  }
})

function handleSelect(item: TenantMembership | any) {
  selectTenant(item)
  isDropdownOpen.value = false
  const targetSlug = item.tenant?.slug || item.slug
  if (targetSlug) {
    navigateTo(`/t/${targetSlug}/dashboard`)
  }
}

function roleBadgeClass(role?: string) {
  if (!role) return 'badge-ghost'
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
  <div class="relative">
    <!-- Trigger Button -->
    <div class="dropdown dropdown-end" :class="{ 'dropdown-open': isDropdownOpen }">
      <button
        @click="isDropdownOpen = !isDropdownOpen"
        class="btn btn-ghost btn-sm gap-2 font-normal hover:bg-base-200 border border-base-300 rounded-xl px-3 py-1.5 h-auto transition-all"
      >
        <div class="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-extrabold text-xs">
          <Building2 class="w-3.5 h-3.5" />
        </div>

        <div class="text-left hidden sm:block">
          <div class="text-xs font-bold text-base-content leading-tight flex items-center gap-1.5">
            <span>{{ currentTenant?.name || 'Select Tenant' }}</span>
            <span v-if="currentTenant" class="badge badge-xs font-mono font-semibold" :class="roleBadgeClass(currentTenant.role)">
              {{ currentTenant.role }}
            </span>
          </div>
          <div class="text-[10px] font-mono text-base-content/50 leading-tight">
            {{ currentTenant ? `@${currentTenant.slug}` : 'No active space' }}
          </div>
        </div>

        <ChevronDown class="w-3.5 h-3.5 text-base-content/60 transition-transform duration-200" :class="{ 'rotate-180': isDropdownOpen }" />
      </button>

      <!-- Dropdown Content -->
      <div
        v-if="isDropdownOpen"
        class="dropdown-content z-50 menu p-2 shadow-xl bg-base-100 border border-base-300 rounded-2xl w-64 mt-2 space-y-1"
      >
        <div class="px-3 py-2 border-b border-base-200 flex justify-between items-center text-xs font-bold text-base-content/60 uppercase tracking-wider">
          <span>Your Organizations</span>
          <span class="badge badge-xs font-mono">{{ tenants.length }}</span>
        </div>

        <!-- Tenant List -->
        <div class="max-h-60 overflow-y-auto space-y-1 py-1">
          <div v-if="tenants.length === 0" class="p-3 text-center text-xs text-base-content/50">
            No tenant memberships found.
          </div>

          <button
            v-for="(t, idx) in tenants"
            :key="t.tenant?.id || t.id || idx"
            @click="handleSelect(t)"
            class="w-full text-left p-2.5 rounded-xl hover:bg-base-200 transition-colors flex items-center justify-between group"
            :class="{ 'bg-primary/5 border border-primary/20': currentTenant?.id === (t.tenant?.id || t.id) }"
          >
            <div class="flex items-center gap-2.5 min-w-0">
              <div
                class="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-colors"
                :class="currentTenant?.id === (t.tenant?.id || t.id) ? 'bg-primary text-primary-content' : 'bg-base-200 text-base-content/70 group-hover:bg-base-300'"
              >
                {{ (t.tenant?.name || t.name || 'T').charAt(0).toUpperCase() }}
              </div>
              <div class="min-w-0">
                <div class="text-xs font-bold text-base-content truncate">{{ t.tenant?.name || t.name }}</div>
                <div class="text-[10px] font-mono text-base-content/50 truncate">@{{ t.tenant?.slug || t.slug }}</div>
              </div>
            </div>

            <div class="flex items-center gap-1 shrink-0">
              <span class="badge badge-xs font-mono text-[9px]" :class="roleBadgeClass(t.role)">
                {{ t.role }}
              </span>
              <Check v-if="currentTenant?.id === (t.tenant?.id || t.id)" class="w-3.5 h-3.5 text-primary ml-1 shrink-0" />
            </div>
          </button>
        </div>

        <!-- Actions -->
        <div class="border-t border-base-200 pt-1.5 space-y-1">
          <NuxtLink
            v-if="currentTenant"
            :to="`/t/${currentTenant.slug}/dashboard`"
            @click="isDropdownOpen = false"
            class="w-full btn btn-ghost btn-xs justify-start gap-2 font-medium text-xs rounded-lg"
          >
            <LayoutDashboard class="w-3.5 h-3.5 text-secondary" />
            Tenant Dashboard
          </NuxtLink>

          <button
            @click="isModalOpen = true; isDropdownOpen = false"
            class="w-full btn btn-outline btn-primary btn-xs justify-start gap-2 font-medium text-xs rounded-lg"
          >
            <Plus class="w-3.5 h-3.5" />
            Create New Tenant
          </button>
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
</template>
