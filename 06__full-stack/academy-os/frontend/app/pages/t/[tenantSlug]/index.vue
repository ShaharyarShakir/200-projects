<script setup lang="ts">
definePageMeta({
  layout: 'tenant',
  middleware: 'tenant'
})

const route = useRoute()
const tenantSlug = route.params.tenantSlug as string
const { tenant, membership } = useTenant()
</script>

<template>
  <div class="space-y-8">
    <!-- Hero / Header -->
    <div class="bg-gradient-to-br from-primary/10 via-base-200 to-base-100 p-8 rounded-3xl border border-primary/20 shadow-sm">
      <div class="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary mb-2">
        <span>Tenant Workspace</span>
        <span>&bull;</span>
        <span class="font-mono text-base-content/70">{{ tenantSlug }}</span>
      </div>
      <h1 class="text-4xl font-extrabold tracking-tight text-base-content">
        Welcome to {{ tenant?.name || tenantSlug }}
      </h1>
      <p class="text-base-content/70 mt-2 max-w-2xl text-base">
        You are currently viewing data isolated to <strong class="text-primary font-semibold">{{ tenant?.name }}</strong> with your role as <span class="badge badge-primary badge-outline font-mono capitalize">{{ membership?.role }}</span>.
      </p>
    </div>

    <!-- Quick Stats Grid -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="bg-base-200/50 p-6 rounded-2xl border border-base-300 shadow-sm flex flex-col justify-between">
        <div>
          <h3 class="text-sm font-semibold text-base-content/60 uppercase tracking-wide">Tenant Name</h3>
          <p class="text-2xl font-bold mt-2 text-base-content">{{ tenant?.name }}</p>
        </div>
        <span class="text-xs text-base-content/40 mt-4">Verified context</span>
      </div>

      <div class="bg-base-200/50 p-6 rounded-2xl border border-base-300 shadow-sm flex flex-col justify-between">
        <div>
          <h3 class="text-sm font-semibold text-base-content/60 uppercase tracking-wide">Slug Identifier</h3>
          <p class="text-2xl font-bold font-mono mt-2 text-primary">{{ tenant?.slug }}</p>
        </div>
        <span class="text-xs text-base-content/40 mt-4">URL key `/t/{{ tenant?.slug }}`</span>
      </div>

      <div class="bg-base-200/50 p-6 rounded-2xl border border-base-300 shadow-sm flex flex-col justify-between">
        <div>
          <h3 class="text-sm font-semibold text-base-content/60 uppercase tracking-wide">Your Role</h3>
          <p class="text-2xl font-bold capitalize mt-2 text-secondary">{{ membership?.role }}</p>
        </div>
        <span class="text-xs text-base-content/40 mt-4">Permission tier</span>
      </div>
    </div>
  </div>
</template>
