<script setup lang="ts">
defineProps<{
  features: string[]
}>()
</script>

<template>
  <ul class="space-y-3" role="list">
    <li
      v-for="feature in features"
      :key="feature"
      class="group flex items-start gap-3 hover:bg-base-200/50 p-2 rounded-xl transition-colors duration-150"
    >
      <div
        class="flex justify-center items-center bg-primary/10 shadow-2xs mt-0.5 border border-primary/20 rounded-lg w-5 h-5 text-primary group-hover:scale-110 transition-transform duration-200 shrink-0"
        aria-hidden="true"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="w-3 h-3"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fill-rule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clip-rule="evenodd"
          />
        </svg>
      </div>

      <span class="text-sm text-base-content/80 group-hover:text-base-content leading-relaxed transition-colors">
        {{ feature }}
      </span>
    </li>
  </ul>
</template>

