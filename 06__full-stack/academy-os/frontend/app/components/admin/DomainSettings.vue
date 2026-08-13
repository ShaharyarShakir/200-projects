<script setup lang="ts">
const { academy } = useAcademy()
</script>

<template>
  <div class="max-w-3xl space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-white tracking-tight">Domain Configuration</h1>
      <p class="text-slate-400 text-sm mt-1">
        Manage domain routing for your tenant academy site.
      </p>
    </div>

    <UiBaseCard title="AcademyOS Subdomain">
      <div class="flex items-center justify-between p-4 bg-slate-950 rounded-lg border border-slate-800">
        <div>
          <div class="text-sm font-semibold text-white font-mono">
            http://{{ academy?.slug || 'john' }}.localhost:3000
          </div>
          <div class="text-xs text-slate-400 mt-0.5">
            Default platform URL for local development
          </div>
        </div>
        <UiBaseBadge variant="success">Active</UiBaseBadge>
      </div>
    </UiBaseCard>

    <UiBaseCard title="Custom Domain">
      <div class="space-y-4">
        <p class="text-sm text-slate-300">
          Connect your own branded domain (e.g. <code class="font-mono text-indigo-400">learn.johnacademy.com</code>).
        </p>

        <div v-if="academy?.customDomain" class="flex items-center justify-between p-4 bg-slate-950 rounded-lg border border-slate-800">
          <div class="text-sm font-semibold text-white font-mono">
            {{ academy.customDomain }}
          </div>
          <UiBaseBadge variant="info">Connected</UiBaseBadge>
        </div>

        <div v-else class="p-4 bg-slate-950 rounded-lg border border-slate-800 text-center space-y-3">
          <p class="text-xs text-slate-400">No custom domain connected yet.</p>
          <UiBaseButton variant="outline" size="sm">
            Connect Domain
          </UiBaseButton>
        </div>
      </div>
    </UiBaseCard>
  </div>
</template>
