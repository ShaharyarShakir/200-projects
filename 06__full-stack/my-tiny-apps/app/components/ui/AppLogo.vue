<script setup lang="ts">
interface Props {
  size?: 'sm' | 'md' | 'lg'
  withText?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  withText: true,
})

const iconSizes = {
  sm: 'h-6 w-6 rounded-lg',
  md: 'h-8 w-8 rounded-xl',
  lg: 'h-10 w-10 rounded-xl',
}

const textSizes = {
  sm: 'text-sm font-semibold tracking-tight',
  md: 'text-base font-semibold tracking-tight',
  lg: 'text-lg font-bold tracking-tight',
}
</script>

<template>
  <div class="inline-flex items-center gap-2.5 select-none">
    <!-- Geometric Gem Icon -->
    <div
      :class="[
        iconSizes[props.size],
        'relative flex shrink-0 items-center justify-center transition-all duration-300 group-hover:scale-105 group-hover:rotate-3 shadow-xs',
      ]"
    >
      <svg
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        class="drop-shadow-xs w-full h-full"
        aria-hidden="true"
      >
        <defs>
          <!-- Primary Emerald-to-Cyan Gradient -->
          <linearGradient
            id="emerald-aurora"
            x1="0"
            y1="0"
            x2="40"
            y2="40"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stop-color="var(--color-primary, #059669)" />
            <stop offset="50%" stop-color="var(--color-secondary, #0ea5e9)" />
            <stop offset="100%" stop-color="var(--color-accent, #34d399)" />
          </linearGradient>

          <!-- Glass Facet Gradient -->
          <linearGradient
            id="facet-light"
            x1="20"
            y1="2"
            x2="20"
            y2="38"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stop-color="#ffffff" stop-opacity="0.45" />
            <stop offset="100%" stop-color="#ffffff" stop-opacity="0.05" />
          </linearGradient>

          <linearGradient
            id="facet-dark"
            x1="20"
            y1="2"
            x2="20"
            y2="38"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stop-color="#000000" stop-opacity="0" />
            <stop offset="100%" stop-color="#000000" stop-opacity="0.25" />
          </linearGradient>
        </defs>

        <!-- Rounded Hexagonal Base -->
        <path
          d="M20 3L35 11.66V28.34L20 37L5 28.34V11.66L20 3Z"
          fill="url(#emerald-aurora)"
        />

        <!-- Outer Facet Shading -->
        <path
          d="M20 3L35 11.66L28 15.5L20 11L12 15.5L5 11.66L20 3Z"
          fill="url(#facet-light)"
        />
        <path
          d="M5 28.34L20 37L20 29L12 24.5L5 28.34Z"
          fill="url(#facet-dark)"
        />
        <path
          d="M35 28.34L20 37L20 29L28 24.5L35 28.34Z"
          fill="url(#facet-dark)"
        />

        <!-- Inner Floating Hexagon -->
        <path
          d="M20 11L28 15.5V24.5L20 29L12 24.5V15.5L20 11Z"
          fill="#ffffff"
          fill-opacity="0.22"
          stroke="#ffffff"
          stroke-opacity="0.4"
          stroke-width="1"
        />

        <!-- Central Sparkle Star -->
        <path
          d="M20 14C20 17.5 17.5 20 14 20C17.5 20 20 22.5 20 26C20 22.5 22.5 20 26 20C22.5 20 20 17.5 20 14Z"
          fill="#ffffff"
        />
      </svg>
    </div>

    <!-- Brand Typography -->
    <span
      v-if="props.withText"
      :class="[
        textSizes[props.size],
        'text-base-content transition-colors group-hover:text-primary',
      ]"
    >
      My Tiny Apps
    </span>
  </div>
</template>


