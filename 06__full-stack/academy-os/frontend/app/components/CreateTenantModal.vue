<script setup lang="ts">
import { ref, watch } from 'vue'
import { Building2, Plus, Sparkles, AlertCircle, X } from 'lucide-vue-next'
import { useTenant } from '~/composables/useTenant'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'created', slug: string): void
}>()

const { createTenant } = useTenant()

const name = ref('')
const slug = ref('')
const isAutoSlug = ref(true)
const isSubmitting = ref(false)
const errorMessage = ref<string | null>(null)

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
}

watch(name, (newName) => {
  if (isAutoSlug.value) {
    slug.value = slugify(newName)
  }
})

function onSlugInput() {
  isAutoSlug.value = false
}

async function handleSubmit() {
  if (!name.value.trim() || !slug.value.trim()) {
    errorMessage.value = 'Please provide both tenant name and slug'
    return
  }

  isSubmitting.value = true
  errorMessage.value = null

  try {
    const created = await createTenant(name.value.trim(), slug.value.trim())
    name.value = ''
    slug.value = ''
    isAutoSlug.value = true
    emit('created', created.slug)
    emit('close')
  } catch (err: any) {
    errorMessage.value = err?.message || 'Failed to create tenant'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <div v-if="isOpen" class="modal modal-open bg-black/60 backdrop-blur-sm z-50">
      <div class="modal-box bg-base-100 border border-base-300 shadow-2xl max-w-md p-6 rounded-2xl relative">
        <!-- Close Button -->
        <button
          @click="emit('close')"
          class="btn btn-sm btn-circle btn-ghost absolute right-4 top-4 text-base-content/60 hover:text-base-content"
        >
          <X class="w-4 h-4" />
        </button>

        <!-- Header -->
        <div class="flex items-center gap-3 mb-6">
          <div class="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Building2 class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-xl font-extrabold text-base-content tracking-tight">Create New Tenant</h3>
            <p class="text-xs text-base-content/60 mt-0.5">Establish an isolated space for your organization</p>
          </div>
        </div>

        <!-- Error Alert -->
        <div v-if="errorMessage" class="alert alert-error text-xs shadow-sm mb-4 py-2 px-3 flex items-center gap-2">
          <AlertCircle class="w-4 h-4 shrink-0" />
          <span>{{ errorMessage }}</span>
        </div>

        <!-- Form -->
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <!-- Tenant Name -->
          <div class="form-control">
            <label class="label py-1">
              <span class="label-text font-semibold text-sm">Tenant Name</span>
            </label>
            <input
              v-model="name"
              type="text"
              placeholder="e.g. Acme Academy"
              class="input input-bordered input-md w-full focus:input-primary rounded-xl"
              required
            />
          </div>

          <!-- Tenant Slug -->
          <div class="form-control">
            <label class="label py-1 flex justify-between items-center">
              <span class="label-text font-semibold text-sm">URL Slug</span>
              <span class="label-text-alt text-xs text-base-content/50">Unique ID</span>
            </label>
            <input
              v-model="slug"
              @input="onSlugInput"
              type="text"
              placeholder="acme-academy"
              class="input input-bordered input-md w-full font-mono text-sm focus:input-primary rounded-xl"
              required
            />
          </div>

          <!-- URL Preview Box -->
          <div class="bg-base-200/60 p-3 rounded-xl border border-base-300 text-xs font-mono text-base-content/70">
            <div class="text-[10px] text-base-content/50 uppercase tracking-wider font-sans font-bold mb-1">Public Catalog URL</div>
            <div class="truncate text-primary font-semibold">
              /t/{{ slug || 'your-slug' }}/courses
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="modal-action mt-6 gap-2">
            <button
              type="button"
              @click="emit('close')"
              class="btn btn-ghost btn-sm rounded-xl font-medium"
              :disabled="isSubmitting"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="btn btn-primary btn-sm rounded-xl font-semibold gap-2 shadow-md shadow-primary/20"
              :disabled="isSubmitting"
            >
              <span v-if="isSubmitting" class="loading loading-spinner loading-xs"></span>
              <Plus v-else class="w-4 h-4" />
              Create Tenant
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>
