<script setup lang="ts">
import type { Product } from '~/shared/types/product'

defineProps<{
  product: Product
}>()
</script>

<template>
  <article
    class="group relative flex flex-col justify-between rounded-2xl border border-base-300/90 bg-base-100/90 p-6 sm:p-7 shadow-xs backdrop-blur-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/45 hover:shadow-lg hover:shadow-primary/5 focus-within:ring-2 focus-within:ring-primary/60"
  >
    <div>
      <!-- Top row: Icon & Status / Platform Badges -->
      <div class="flex items-start justify-between gap-4">
        <!-- App Icon with subtle depth -->
        <div
          class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-base-300/70 bg-base-200/70 text-3xl shadow-2xs transition-transform duration-300 group-hover:scale-105 select-none"
        >
          {{ product.icon }}
        </div>

        <div class="flex flex-wrap items-center justify-end gap-1.5">
          <!-- Status Badge -->
          <span
            v-if="product.status === 'coming-soon'"
            class="inline-flex items-center gap-1.5 rounded-full border border-base-300 bg-base-200/80 px-2.5 py-0.5 text-xs font-medium text-base-content/75 shadow-2xs"
          >
            <span class="h-1.5 w-1.5 rounded-full bg-amber-400" />
            <span>Coming soon</span>
          </span>
          <span
            v-else
            class="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 shadow-2xs"
          >
            <span class="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Available</span>
          </span>

          <!-- Platform Pill -->
          <span
            v-for="platform in product.platforms"
            :key="platform"
            class="rounded-md border border-base-300/70 bg-base-200/40 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-base-content/55"
          >
            {{ platform }}
          </span>
        </div>
      </div>

      <!-- App details -->
      <div class="mt-6">
        <h3 class="text-xl font-bold tracking-tight text-base-content transition-colors duration-150 group-hover:text-primary">
          <NuxtLink :to="`/apps/${product.slug}`" class="focus-visible:outline-none">
            {{ product.name }}
          </NuxtLink>
        </h3>

        <p class="mt-2.5 text-sm leading-relaxed text-base-content/70">
          {{ product.shortDescription }}
        </p>
      </div>
    </div>

    <!-- Bottom row: Pricing & Action -->
    <div class="mt-8 flex items-center justify-between border-t border-base-300/80 pt-5">
      <div>
        <span class="block text-[11px] font-semibold uppercase tracking-wider text-base-content/45">
          One-time purchase
        </span>
        <div class="mt-0.5 flex items-baseline gap-1 text-2xl font-extrabold tracking-tight text-base-content">
          <span>${{ product.price }}</span>
          <span class="text-xs font-medium text-base-content/45 uppercase">{{ product.currency }}</span>
        </div>
      </div>

      <NuxtLink
        :to="`/apps/${product.slug}`"
        class="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-content shadow-xs transition-all duration-180 hover:bg-primary/90 hover:shadow-md hover:shadow-primary/20 active:scale-95 focus-visible:outline-none"
      >
        <span>View app</span>
        <span class="arrow-nudge" aria-hidden="true">→</span>
      </NuxtLink>
    </div>
  </article>
</template>

