<script setup lang="ts">
definePageMeta({
  layout: 'tenant',
  middleware: 'tenant'
})

const { tenant, membership } = useTenant()
</script>

<template>
  <div class="space-y-8">
    <header class="border-b border-base-300 pb-6">
      <h1 class="text-3xl font-extrabold tracking-tight">Tenant Settings</h1>
      <p class="text-sm text-base-content/70 mt-1">
        Overview of environment and security context for this workspace.
      </p>
    </header>

    <div class="bg-base-200/50 p-8 rounded-3xl border border-base-300 shadow-sm max-w-3xl">
      <dl class="divide-y divide-base-300">
        <div class="py-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <dt class="text-sm font-semibold text-base-content/70">Name</dt>
          <dd class="text-sm font-medium text-base-content sm:col-span-2">{{ tenant?.name }}</dd>
        </div>

        <div class="py-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <dt class="text-sm font-semibold text-base-content/70">Slug</dt>
          <dd class="text-sm font-mono text-primary font-medium sm:col-span-2">{{ tenant?.slug }}</dd>
        </div>

        <div class="py-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <dt class="text-sm font-semibold text-base-content/70">Tenant ID</dt>
          <dd class="text-sm font-mono text-base-content/70 sm:col-span-2">{{ tenant?.id }}</dd>
        </div>

        <div class="py-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <dt class="text-sm font-semibold text-base-content/70">Your Role</dt>
          <dd class="text-sm font-medium sm:col-span-2">
            <span class="badge badge-secondary capitalize font-mono">{{ membership?.role }}</span>
          </dd>
        </div>
      </dl>
    </div>
  </div>
</template>
