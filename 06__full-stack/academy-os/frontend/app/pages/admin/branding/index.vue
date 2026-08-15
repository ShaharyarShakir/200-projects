<script setup lang="ts">
import { Palette, Check, RefreshCw, Eye } from 'lucide-vue-next'

definePageMeta({
  layout: 'admin'
})

const { tenant } = useTenant()
const activeSlug = computed(() => tenant.value?.slug || '')

const brandName = ref(tenant.value?.name || 'My Branded Academy')
const primaryColor = ref('#4f46e5')
const secondaryColor = ref('#ec4899')
const heroTitle = ref('Master New Skills with Premium Video Courses')
const heroSubtitle = ref('Join thousands of students learning world-class curriculum.')
const savedSuccess = ref(false)

function handleSave() {
  savedSuccess.value = true
  setTimeout(() => {
    savedSuccess.value = false
  }, 3000)
}
</script>

<template>
  <div class="space-y-8">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-base-300 pb-6">
      <div>
        <h1 class="text-3xl font-extrabold tracking-tight">Branding & Theme Customizer</h1>
        <p class="text-sm text-base-content/70 mt-1">
          Customize the visual identity of your white-label academy portal.
        </p>
      </div>

      <button @click="handleSave" class="btn btn-primary gap-2 rounded-xl font-semibold shadow-lg shadow-primary/25">
        <Check class="w-4 h-4" />
        Save Branding Configuration
      </button>
    </div>

    <div v-if="savedSuccess" class="alert alert-success shadow-lg">
      <Check class="w-5 h-5" />
      <span>Branding settings updated successfully!</span>
    </div>

    <!-- Main Grid: Controls + Live Preview -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- Customization Form -->
      <div class="bg-base-200/50 p-6 sm:p-8 rounded-3xl border border-base-300 space-y-6">
        <h2 class="text-xl font-bold text-base-content flex items-center gap-2">
          <Palette class="w-5 h-5 text-primary" />
          Brand Assets & Colors
        </h2>

        <div class="form-control w-full">
          <label class="label font-bold text-xs uppercase tracking-wider text-base-content/70">Academy Brand Name</label>
          <input v-model="brandName" type="text" class="input input-bordered w-full rounded-xl" placeholder="e.g. Acme Academy" />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="form-control">
            <label class="label font-bold text-xs uppercase tracking-wider text-base-content/70">Primary Color</label>
            <div class="flex items-center gap-3">
              <input v-model="primaryColor" type="color" class="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent" />
              <input v-model="primaryColor" type="text" class="input input-bordered font-mono text-xs uppercase w-full rounded-xl" />
            </div>
          </div>

          <div class="form-control">
            <label class="label font-bold text-xs uppercase tracking-wider text-base-content/70">Secondary Color</label>
            <div class="flex items-center gap-3">
              <input v-model="secondaryColor" type="color" class="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent" />
              <input v-model="secondaryColor" type="text" class="input input-bordered font-mono text-xs uppercase w-full rounded-xl" />
            </div>
          </div>
        </div>

        <div class="form-control w-full">
          <label class="label font-bold text-xs uppercase tracking-wider text-base-content/70">Hero Headline</label>
          <input v-model="heroTitle" type="text" class="input input-bordered w-full rounded-xl" />
        </div>

        <div class="form-control w-full">
          <label class="label font-bold text-xs uppercase tracking-wider text-base-content/70">Hero Subtitle</label>
          <textarea v-model="heroSubtitle" class="textarea textarea-bordered w-full rounded-xl h-24"></textarea>
        </div>
      </div>

      <!-- Live Preview Container -->
      <div class="bg-base-200/30 p-6 sm:p-8 rounded-3xl border border-dashed border-base-300 space-y-4">
        <div class="flex items-center justify-between border-b border-base-300 pb-3">
          <span class="text-xs font-bold uppercase tracking-wider text-base-content/50 flex items-center gap-1.5">
            <Eye class="w-4 h-4 text-primary" /> Live Student Page Preview
          </span>
          <span class="badge badge-xs font-mono">@{{ activeSlug }}</span>
        </div>

        <!-- Simulated Student Header -->
        <div class="bg-base-100 p-6 rounded-2xl border border-base-300 shadow-sm space-y-6">
          <div class="flex items-center justify-between border-b border-base-200 pb-4">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white shadow" :style="{ backgroundColor: primaryColor }">
                {{ brandName.charAt(0) }}
              </div>
              <span class="font-extrabold text-base">{{ brandName }}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-xs font-medium text-base-content/70">Courses</span>
              <span class="btn btn-xs rounded-lg text-white" :style="{ backgroundColor: primaryColor }">Enroll Now</span>
            </div>
          </div>

          <!-- Simulated Hero -->
          <div class="py-8 px-6 rounded-xl space-y-3 text-center" :style="{ backgroundColor: `${primaryColor}10` }">
            <h3 class="text-xl font-extrabold" :style="{ color: primaryColor }">{{ heroTitle }}</h3>
            <p class="text-xs text-base-content/70 max-w-md mx-auto">{{ heroSubtitle }}</p>
            <div class="pt-2">
              <button class="btn btn-sm rounded-xl text-white font-bold px-6 shadow-md" :style="{ backgroundColor: primaryColor }">
                Browse Courses
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
