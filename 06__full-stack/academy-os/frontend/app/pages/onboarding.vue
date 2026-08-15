<script setup lang="ts">
import { ref, watch } from 'vue'
import { Sparkles, Building2, Globe, ArrowRight, Loader2, AlertCircle } from 'lucide-vue-next'

definePageMeta({
  layout: 'auth',
  middleware: 'auth'
})

const api = useApi()
const name = ref('')
const slug = ref('')

const loading = ref(false)
const error = ref('')

// Auto-generate slug from name if user hasn't manually modified it
const isSlugManuallyEdited = ref(false)

function slugify(val: string) {
  return val
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 63)
}

watch(name, (newName) => {
  if (!isSlugManuallyEdited.value) {
    slug.value = slugify(newName)
  }
})

function onSlugInput(e: Event) {
  isSlugManuallyEdited.value = true
  const input = e.target as HTMLInputElement
  slug.value = slugify(input.value)
}

async function createAcademy() {
  error.value = ''

  const trimmedName = name.value.trim()
  const trimmedSlug = slug.value.trim()

  if (!trimmedName) {
    error.value = 'Please enter an academy name.'
    return
  }

  if (!trimmedSlug) {
    error.value = 'Please choose an academy URL slug.'
    return
  }

  if (trimmedSlug.length < 3) {
    error.value = 'Academy URL slug must be at least 3 characters.'
    return
  }

  loading.value = true

  try {
    await api.request<{
      academy: {
        id: string
        name: string
        slug: string
      }
    }>('/api/academies', {
      method: 'POST',
      body: {
        name: trimmedName,
        slug: trimmedSlug
      }
    })

    await navigateTo('/dashboard')
  } catch (err: any) {
    error.value = err?.data?.message || err?.data?.error || err?.message || 'Unable to create academy.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="bg-[#130f26]/90 backdrop-blur-xl border border-purple-900/40 rounded-3xl p-8 shadow-2xl shadow-purple-950/40 max-w-lg w-full mx-auto relative overflow-hidden">
    <!-- Ambient Glow Background -->
    <div class="absolute -top-24 -left-24 w-48 h-48 bg-purple-600/20 rounded-full blur-3xl pointer-events-none"></div>
    <div class="absolute -bottom-24 -right-24 w-48 h-48 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none"></div>

    <div class="mb-8 text-center relative z-10">
      <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-900/40 border border-purple-500/30 text-purple-300 text-xs font-semibold uppercase tracking-wider mb-4">
        <Sparkles class="w-3.5 h-3.5 text-yellow-400" />
        <span>Step 2 of 2 — Workspace Setup</span>
      </div>

      <h1 class="text-3xl font-black tracking-tight text-white mb-2">
        Create your academy
      </h1>
      <p class="text-sm text-slate-400">
        Let's get your teaching platform started. You can add courses and branding next.
      </p>
    </div>

    <form @submit.prevent="createAcademy" class="space-y-5 relative z-10">
      <div>
        <label for="name" class="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-2">
          <Building2 class="w-3.5 h-3.5 text-purple-400" />
          <span>Academy name</span>
        </label>
        <input
          id="name"
          v-model="name"
          type="text"
          placeholder="e.g. John's Programming Academy"
          class="w-full px-4 py-3 bg-[#0c0919] border border-purple-900/60 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all text-sm font-medium"
        />
      </div>

      <div>
        <label for="slug" class="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-2">
          <Globe class="w-3.5 h-3.5 text-purple-400" />
          <span>Academy URL</span>
        </label>
        
        <div class="flex items-center bg-[#0c0919] border border-purple-900/60 rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-purple-500/30 focus-within:border-purple-500 transition-all">
          <span class="px-3.5 py-3 text-xs font-mono text-slate-500 border-r border-purple-900/40 bg-purple-950/20 select-none shrink-0">
            academyos.local/
          </span>
          <input
            id="slug"
            :value="slug"
            @input="onSlugInput"
            type="text"
            placeholder="john-programming"
            class="w-full px-3.5 py-3 bg-transparent text-yellow-400 placeholder-slate-600 focus:outline-none text-sm font-mono"
          />
        </div>
        <p class="text-[11px] text-slate-500 mt-1.5 font-medium">
          Only lowercase letters, numbers, and hyphens allowed.
        </p>
      </div>

      <div v-if="error" class="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 text-xs font-medium flex items-center gap-2">
        <AlertCircle class="w-4 h-4 text-rose-400 shrink-0" />
        <span>{{ error }}</span>
      </div>

      <button
        type="submit"
        :disabled="loading"
        class="w-full py-4 px-5 bg-[#facc15] hover:bg-[#fde047] disabled:opacity-50 disabled:cursor-not-allowed text-[#0c0919] font-black rounded-2xl shadow-lg shadow-yellow-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-wider text-xs flex items-center justify-center gap-2 cursor-pointer mt-2"
      >
        <Loader2 v-if="loading" class="w-4 h-4 animate-spin" />
        <span v-else class="flex items-center gap-2">
          <span>Create Academy</span>
          <ArrowRight class="w-4 h-4 stroke-[3]" />
        </span>
      </button>
    </form>
  </div>
</template>
