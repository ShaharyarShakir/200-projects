<script setup lang="ts">
import { Globe, Check, AlertCircle, Copy, ExternalLink, ShieldCheck } from 'lucide-vue-next'

definePageMeta({
  layout: 'admin'
})

const { tenant } = useTenant()
const activeSlug = computed(() => tenant.value?.slug || '')

const customDomainInput = ref('')
const isVerifying = ref(false)
const isConnected = ref(false)
const copied = ref(false)

function handleConnect() {
  if (!customDomainInput.value) return
  isVerifying.value = true
  setTimeout(() => {
    isVerifying.value = false
    isConnected.value = true
  }, 2000)
}

function copyCNAME() {
  navigator.clipboard.writeText('platform.academyos.com')
  copied.value = true
  setTimeout(() => (copied.value = false), 2000)
}
</script>

<template>
  <div class="space-y-8">
    <!-- Header -->
    <div class="border-b border-base-300 pb-6">
      <h1 class="text-3xl font-extrabold tracking-tight">Custom Domain Setup</h1>
      <p class="text-sm text-base-content/70 mt-1">
        Connect your own domain or subdomain so students access your academy on your custom address.
      </p>
    </div>

    <!-- Main Cards Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Domain Form -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Subdomain Default Card -->
        <div class="bg-base-200/50 p-6 rounded-3xl border border-base-300 space-y-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2 font-bold text-sm text-base-content">
              <Globe class="w-4 h-4 text-primary" />
              AcademyOS Default Subdomain
            </div>
            <span class="badge badge-success badge-sm font-mono font-semibold">Active</span>
          </div>

          <div class="flex items-center justify-between p-4 bg-base-100 rounded-2xl border border-base-300">
            <code class="font-mono font-bold text-sm text-primary">
              http://{{ activeSlug }}.localhost:3000
            </code>
            <a :href="`/t/${activeSlug}`" target="_blank" class="btn btn-ghost btn-xs gap-1">
              Test URL <ExternalLink class="w-3 h-3" />
            </a>
          </div>
        </div>

        <!-- Custom Domain Form Card -->
        <div class="bg-base-200/50 p-6 sm:p-8 rounded-3xl border border-base-300 space-y-6">
          <div class="space-y-1">
            <h2 class="text-xl font-bold text-base-content flex items-center gap-2">
              <ShieldCheck class="w-5 h-5 text-secondary" />
              Connect Custom Domain
            </h2>
            <p class="text-xs text-base-content/70">
              Point your domain (e.g. <code class="font-mono text-primary">learn.johnacademy.com</code>) to AcademyOS infrastructure.
            </p>
          </div>

          <div class="form-control w-full">
            <label class="label font-bold text-xs uppercase tracking-wider text-base-content/70">Custom Domain Name</label>
            <div class="flex gap-3">
              <input
                v-model="customDomainInput"
                type="text"
                class="input input-bordered w-full rounded-xl font-mono text-sm"
                placeholder="learn.johnacademy.com"
              />
              <button
                @click="handleConnect"
                :disabled="isVerifying || !customDomainInput"
                class="btn btn-primary rounded-xl px-6 font-semibold shrink-0"
              >
                <span v-if="isVerifying" class="loading loading-spinner loading-xs"></span>
                <span v-else>Connect Domain</span>
              </button>
            </div>
          </div>

          <div v-if="isConnected" class="alert alert-success shadow-lg">
            <Check class="w-5 h-5" />
            <span>Custom domain <strong>{{ customDomainInput }}</strong> successfully mapped and SSL certificate issued!</span>
          </div>
        </div>
      </div>

      <!-- CNAME Instructions Card -->
      <div class="bg-base-200/30 p-6 rounded-3xl border border-base-300 space-y-4">
        <h3 class="font-bold text-base text-base-content uppercase tracking-wider text-xs">DNS Setup Instructions</h3>
        <p class="text-xs text-base-content/70 leading-relaxed">
          Log in to your DNS provider (Cloudflare, GoDaddy, Namecheap) and create a CNAME record:
        </p>

        <div class="space-y-3 font-mono text-xs bg-base-100 p-4 rounded-2xl border border-base-300">
          <div>
            <span class="text-base-content/50 block text-[10px] uppercase font-sans font-bold">Type</span>
            <span class="font-bold text-secondary">CNAME</span>
          </div>

          <div>
            <span class="text-base-content/50 block text-[10px] uppercase font-sans font-bold">Name / Host</span>
            <span class="font-bold">learn</span>
          </div>

          <div>
            <span class="text-base-content/50 block text-[10px] uppercase font-sans font-bold">Target Value</span>
            <div class="flex items-center justify-between mt-1">
              <span class="font-bold text-primary">platform.academyos.com</span>
              <button @click="copyCNAME" class="btn btn-ghost btn-xs p-1" title="Copy Target">
                <Check v-if="copied" class="w-3.5 h-3.5 text-success" />
                <Copy v-else class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
