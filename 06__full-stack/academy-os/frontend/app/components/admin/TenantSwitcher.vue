<script setup lang="ts">
const { academy, setAcademy } = useAcademy()
const { fetch: apiFetch } = useApi()

interface TenantOption {
  id: string
  name: string
  slug: string
}

const tenants = ref<TenantOption[]>([])
const isOpen = ref(false)

onMounted(async () => {
  try {
    const res = await apiFetch<any>('/api/me/tenants')
    if (Array.isArray(res)) {
      tenants.value = res.map((m: any) => ({
        id: m.tenant?.id || m.id,
        name: m.tenant?.name || m.name,
        slug: m.tenant?.slug || m.slug
      }))
    }
  } catch (e) {
    console.error('Failed to load instructor tenants', e)
  }
})

function selectTenant(t: TenantOption) {
  setAcademy({
    id: t.id,
    name: t.name,
    slug: t.slug
  })
  isOpen.value = false
}
</script>

<template>
  <div class="relative">
    <button
      @click="isOpen = !isOpen"
      class="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-sm font-medium transition"
    >
      <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
      <span>{{ academy?.name || 'Select Academy' }}</span>
      <span class="text-xs text-slate-400">▼</span>
    </button>

    <div
      v-if="isOpen"
      class="absolute left-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-xl shadow-xl z-50 py-2"
    >
      <div class="px-3 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
        Your Academies
      </div>
      <button
        v-for="t in tenants"
        :key="t.id"
        @click="selectTenant(t)"
        class="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white flex items-center justify-between"
      >
        <span>{{ t.name }}</span>
        <span v-if="academy?.id === t.id" class="text-indigo-400 text-xs font-bold">✓</span>
      </button>
    </div>
  </div>
</template>
