<script setup lang="ts">
import type { Academy } from '~/types/academy'

const { academy } = useAcademy()

const form = reactive({
  name: academy.value?.name || '',
  description: academy.value?.description || '',
  primaryColor: academy.value?.primaryColor || '#2563eb',
  secondaryColor: academy.value?.secondaryColor || '#ffffff'
})

watch(academy, (newAcademy) => {
  if (newAcademy) {
    if (!form.name) form.name = newAcademy.name || ''
    if (!form.description) form.description = newAcademy.description || ''
    if (!form.primaryColor || form.primaryColor === '#000000') form.primaryColor = newAcademy.primaryColor || '#2563eb'
    if (!form.secondaryColor || form.secondaryColor === '#ffffff') form.secondaryColor = newAcademy.secondaryColor || '#ffffff'
  }
}, { immediate: true })

onMounted(async () => {
  try {
    const fetched = await $fetch<Academy>('/api/academy')
    if (fetched) {
      academy.value = fetched
      form.name = fetched.name || ''
      form.description = fetched.description || ''
      form.primaryColor = fetched.primaryColor || '#2563eb'
      form.secondaryColor = fetched.secondaryColor || '#ffffff'
    }
  } catch (err) {
    console.error('Failed to load active academy branding:', err)
  }
})

const saving = ref(false)
const message = ref('')

async function save() {
  saving.value = true
  message.value = ''

  try {
    const updated = await $fetch<Academy>('/api/academy', {
      method: 'PATCH',
      body: form
    })

    if (updated) {
      academy.value = updated
      message.value = 'Branding changes saved successfully!'
    }
  } catch (err: any) {
    message.value = 'Failed to save branding changes: ' + (err.data?.message || err.message || 'Unknown error')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
    <UiBaseCard>
      <form @submit.prevent="save" class="space-y-6">
        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2">Academy Name</label>
          <input
            v-model="form.name"
            type="text"
            required
            placeholder="e.g. John Academy"
            class="w-full px-4 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-indigo-500 text-sm"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2">Description</label>
          <textarea
            v-model="form.description"
            rows="3"
            placeholder="Learn programming online..."
            class="w-full px-4 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-indigo-500 text-sm"
          ></textarea>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-2">Primary color</label>
            <div class="flex items-center space-x-3">
              <input
                v-model="form.primaryColor"
                type="color"
                class="h-10 w-16 bg-slate-950 border border-slate-800 rounded cursor-pointer p-1"
              />
              <input
                v-model="form.primaryColor"
                type="text"
                class="flex-1 px-4 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 font-mono text-sm uppercase"
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-300 mb-2">Secondary color</label>
            <div class="flex items-center space-x-3">
              <input
                v-model="form.secondaryColor"
                type="color"
                class="h-10 w-16 bg-slate-950 border border-slate-800 rounded cursor-pointer p-1"
              />
              <input
                v-model="form.secondaryColor"
                type="text"
                class="flex-1 px-4 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 font-mono text-sm uppercase"
              />
            </div>
          </div>
        </div>

        <div v-if="message" class="p-3 rounded-lg text-sm" :class="message.includes('successfully') ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'">
          {{ message }}
        </div>

        <div class="flex justify-end pt-2">
          <button
            type="submit"
            :disabled="saving"
            class="px-6 py-2.5 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition-all shadow-md"
          >
            {{ saving ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>
      </form>
    </UiBaseCard>

    <div class="space-y-4">
      <h2 class="text-sm font-semibold uppercase tracking-wider text-slate-400">Live Preview</h2>
      <div
        class="rounded-xl border border-slate-800 bg-slate-950 p-6 shadow-2xl space-y-6"
        :style="{
          '--academy-primary': form.primaryColor,
          '--academy-secondary': form.secondaryColor
        }"
      >
        <div class="flex items-center justify-between pb-4 border-b border-slate-800/80">
          <span class="font-bold text-lg text-white">
            {{ form.name || 'Academy Name' }}
          </span>
          <div class="flex items-center space-x-3 text-xs text-slate-400">
            <span>Home</span>
            <span>Courses</span>
            <span class="px-3 py-1 rounded-full text-white bg-[var(--academy-primary,#2563eb)] font-semibold">
              Login
            </span>
          </div>
        </div>

        <div class="text-center py-8 space-y-4">
          <p class="text-xs uppercase tracking-widest text-slate-400 font-medium">Welcome to</p>
          <h2 class="text-3xl font-extrabold text-white tracking-tight">
            {{ form.name || 'Academy Name' }}
          </h2>
          <p class="text-sm text-slate-300 max-w-sm mx-auto">
            {{ form.description || 'Academy description goes here.' }}
          </p>
          <div class="pt-2">
            <button
              type="button"
              class="px-5 py-2.5 rounded-md text-xs font-bold text-white bg-[var(--academy-primary,#2563eb)] shadow-md hover:opacity-90 transition-opacity"
            >
              Explore Courses
            </button>
          </div>
        </div>

        <div class="pt-4 border-t border-slate-800/80 text-center text-xs text-slate-500">
          © {{ new Date().getFullYear() }} {{ form.name || 'Academy Name' }}
        </div>
      </div>
    </div>
  </div>
</template>
