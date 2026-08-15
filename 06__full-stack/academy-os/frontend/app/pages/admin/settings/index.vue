<script setup lang="ts">
import { gsap } from 'gsap'
import { Settings, Building2, Globe, FileText, Save, Loader2, AlertCircle, Check } from 'lucide-vue-next'

definePageMeta({
  layout: 'admin',
  middleware: 'auth'
})

const { academy, setAcademy } = useAcademy()
const { fetch: apiFetch } = useApi()

const name = ref(academy.value?.name || '')
const description = ref(academy.value?.description || '')
const customDomain = ref(academy.value?.customDomain || '')
const saving = ref(false)
const error = ref('')
const success = ref(false)
const pageContainer = ref<HTMLElement | null>(null)

watch(academy, (newVal) => {
  if (newVal) {
    name.value = newVal.name || ''
    description.value = newVal.description || ''
    customDomain.value = newVal.customDomain || ''
  }
}, { immediate: true })

async function saveSettings() {
  error.value = ''
  success.value = false

  if (!name.value.trim()) {
    error.value = 'Academy name cannot be empty.'
    return
  }

  saving.value = true

  try {
    const updated = await apiFetch<any>('/api/academy', {
      method: 'PATCH',
      body: {
        name: name.value.trim(),
        description: description.value.trim(),
        customDomain: customDomain.value.trim()
      }
    })

    if (updated) {
      setAcademy(updated)
      success.value = true
      setTimeout(() => {
        success.value = false
      }, 4000)
    }
  } catch (err: any) {
    error.value = err?.data?.message || err?.message || 'Failed to update academy settings.'
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  if (pageContainer.value) {
    gsap.from(pageContainer.value.querySelectorAll('.gsap-card'), {
      opacity: 0,
      y: 25,
      duration: 0.6,
      stagger: 0.08,
      ease: 'power3.out'
    })
  }
})
</script>

<template>
  <div ref="pageContainer" class="space-y-8 select-none max-w-4xl">
    <!-- Header Banner -->
    <div class="gsap-card bg-gradient-to-r from-purple-950/80 via-indigo-900/50 to-[#0c0919] p-8 rounded-3xl border border-purple-500/30 shadow-2xl backdrop-blur-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
      <div class="space-y-2">
        <div class="inline-flex items-center gap-2 px-3 py-1 bg-yellow-400/10 border border-yellow-400/30 rounded-full text-xs font-black text-yellow-400 uppercase tracking-widest">
          <Settings class="w-3.5 h-3.5" />
          <span>Academy Config</span>
        </div>
        <h1 class="text-3xl font-black tracking-tight text-white uppercase leading-tight">
          Academy <span class="bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 bg-clip-text text-transparent">Settings</span>
        </h1>
        <p class="text-slate-300 text-sm max-w-xl">
          Manage general settings, platform titles, and custom domains for <strong class="text-white">{{ academy?.name || 'your academy' }}</strong>.
        </p>
      </div>
    </div>

    <!-- Alert Messages -->
    <div v-if="success" class="gsap-card p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-300 text-xs font-semibold flex items-center gap-2">
      <Check class="w-4 h-4 text-emerald-400 shrink-0" />
      <span>Academy settings updated successfully!</span>
    </div>

    <div v-if="error" class="gsap-card p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 text-xs font-semibold flex items-center gap-2">
      <AlertCircle class="w-4 h-4 text-rose-400 shrink-0" />
      <span>{{ error }}</span>
    </div>

    <!-- Settings Form -->
    <form @submit.prevent="saveSettings" class="space-y-6">
      <div class="gsap-card bg-[#0c0919]/90 border border-purple-900/40 p-8 rounded-3xl shadow-xl backdrop-blur-md space-y-6">
        <div>
          <label class="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-2">
            <Building2 class="w-4 h-4 text-purple-400" />
            <span>Academy Name</span>
          </label>
          <input
            v-model="name"
            type="text"
            placeholder="e.g. John's Programming Academy"
            class="w-full px-4 py-3.5 bg-[#0c0919] border border-purple-900/60 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all text-sm font-medium"
          />
        </div>

        <div>
          <label class="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-2">
            <Globe class="w-4 h-4 text-cyan-400" />
            <span>Subdomain Slug (Read Only)</span>
          </label>
          <div class="flex items-center bg-[#0c0919] border border-purple-900/40 rounded-2xl px-4 py-3.5 text-slate-400 font-mono text-sm">
            <span>{{ academy?.slug || 'my-academy' }}.academyos.local</span>
          </div>
        </div>

        <div>
          <label class="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-2">
            <Globe class="w-4 h-4 text-yellow-400" />
            <span>Custom Domain (Optional)</span>
          </label>
          <input
            v-model="customDomain"
            type="text"
            placeholder="e.g. learn.yourdomain.com"
            class="w-full px-4 py-3.5 bg-[#0c0919] border border-purple-900/60 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all text-sm font-mono"
          />
        </div>

        <div>
          <label class="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-2">
            <FileText class="w-4 h-4 text-purple-400" />
            <span>Academy Description</span>
          </label>
          <textarea
            v-model="description"
            rows="4"
            placeholder="Tell your students about your academy..."
            class="w-full px-4 py-3.5 bg-[#0c0919] border border-purple-900/60 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all text-sm font-medium"
          ></textarea>
        </div>

        <button
          type="submit"
          :disabled="saving"
          class="py-4 px-8 bg-[#facc15] hover:bg-[#fde047] disabled:opacity-50 disabled:cursor-not-allowed text-[#0c0919] font-black rounded-2xl shadow-lg shadow-yellow-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-wider text-xs flex items-center gap-2 cursor-pointer"
        >
          <Loader2 v-if="saving" class="w-4 h-4 animate-spin" />
          <Save v-else class="w-4 h-4" />
          <span>Save Academy Settings</span>
        </button>
      </div>
    </form>
  </div>
</template>
