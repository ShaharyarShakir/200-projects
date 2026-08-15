<script setup lang="ts">
import type { TenantMembership } from '~/types/tenant'

const { tenant, membership } = useTenant()
const route = useRoute()
const { getTenants } = useTenantApi()

const memberships = ref<TenantMembership[]>([])

onMounted(async () => {
  try {
    memberships.value = await getTenants()
  } catch (e) {
    // handled in middleware or silent fallback
  }
})

const tenantSlug = computed(() => (route.params.tenantSlug as string) || tenant.value?.slug || '')
</script>

<template>
  <div class="min-h-screen bg-[#0c0919] text-white flex flex-col font-sans antialiased">
    <!-- Cosmic Dark Header -->
    <AppNavbar />

    <!-- Main Content -->
    <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <slot />
    </main>

    <!-- Footer -->
    <footer class="border-t border-purple-900/40 py-6 text-center text-xs text-slate-500 bg-[#090713]">
      AcademyOS Multi-Tenant Platform &bull; Active Academy: <code class="font-mono text-yellow-400">@{{ tenantSlug }}</code>
    </footer>
  </div>
</template>
