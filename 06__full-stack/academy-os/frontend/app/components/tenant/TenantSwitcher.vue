<script setup lang="ts">
import type { TenantMembership } from '~/types/tenant'

const props = defineProps<{
  memberships: TenantMembership[]
  currentSlug?: string
}>()

const router = useRouter()

function switchTenant(event: Event) {
  const select = event.target as HTMLSelectElement
  const selectedSlug = select.value
  if (selectedSlug && selectedSlug !== props.currentSlug) {
    router.push(`/t/${selectedSlug}`)
  }
}
</script>

<template>
  <div class="relative inline-block">
    <select
      :value="currentSlug"
      @change="switchTenant"
      class="select select-bordered select-sm font-semibold bg-base-200 text-base-content hover:bg-base-300 transition-colors cursor-pointer pr-8"
    >
      <option
        v-for="item in memberships"
        :key="item.tenant.id"
        :value="item.tenant.slug"
      >
        {{ item.tenant.name }}
      </option>
    </select>
  </div>
</template>
