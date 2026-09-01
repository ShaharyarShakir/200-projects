<script setup lang="ts">
import type { Product } from '~/shared/types/product'

defineProps<{
  product: Product
}>()
</script>

<template>
  <article
    class="group relative flex flex-col justify-between bg-base-100/90 shadow-xs hover:shadow-lg hover:shadow-primary/5 backdrop-blur-xs p-6 sm:p-7 border border-base-300/90 hover:border-primary/45 rounded-2xl focus-within:ring-2 focus-within:ring-primary/60 transition-all hover:-translate-y-0.5 duration-200"
  >
    <div>
      <!-- Top row: Icon & Status / Platform Badges -->
      <div class="flex justify-between items-start gap-4">
        <!-- App Icon with subtle depth -->
        <div
          class="flex justify-center items-center bg-base-200/70 shadow-2xs border border-base-300/70 rounded-2xl w-14 h-14 text-3xl group-hover:scale-105 transition-transform duration-300 select-none shrink-0"
        >
          {{ product.icon }}
        </div>

        <div class="flex flex-wrap justify-end items-center gap-1.5">
          <!-- Status Badge -->
          <span
            v-if="product.status === 'coming-soon'"
            class="inline-flex items-center gap-1.5 bg-base-200/80 shadow-2xs px-2.5 py-0.5 border border-base-300 rounded-full font-medium text-xs text-base-content/75"
          >
            <span class="bg-amber-400 rounded-full w-1.5 h-1.5" />
            <span>Coming soon</span>
          </span>
          <span
            v-else
            class="inline-flex items-center gap-1.5 bg-emerald-500/10 shadow-2xs px-2.5 py-0.5 border border-emerald-500/20 rounded-full font-medium text-emerald-600 dark:text-emerald-400 text-xs"
          >
            <span class="bg-emerald-500 rounded-full w-1.5 h-1.5 animate-pulse" />
            <span>Available</span>
          </span>

          <!-- Platform Pill -->
          <span
            v-for="platform in product.platforms"
            :key="platform"
            class="bg-base-200/40 px-2 py-0.5 border border-base-300/70 rounded-md font-semibold text-[11px] text-base-content/55 uppercase tracking-wider"
          >
            {{ platform }}
          </span>
        </div>
      </div>

      <!-- App details -->
      <div class="mt-6">
        <h3 class="font-bold group-hover:text-primary text-base-content text-xl tracking-tight transition-colors duration-150">
          <NuxtLink :to="`/apps/${product.slug}`" class="focus-visible:outline-none">
            {{ product.name }}
          </NuxtLink>
        </h3>

        <p class="mt-2.5 text-sm text-base-content/70 leading-relaxed">
          {{ product.shortDescription }}
        </p>
      </div>
    </div>

    <!-- Bottom row: Pricing & Action -->
    <div class="flex justify-between items-center mt-8 pt-5 border-base-300/80 border-t">
      <div>
        <span class="block font-semibold text-[11px] text-base-content/45 uppercase tracking-wider">
          One-time purchase
        </span>
        <div class="flex items-baseline gap-1 mt-0.5 font-extrabold text-base-content text-2xl tracking-tight">
          <span>${{ product.price }}</span>
          <span class="font-medium text-xs text-base-content/45 uppercase">{{ product.currency }}</span>
        </div>
      </div>

      <NuxtLink
        :to="`/apps/${product.slug}`"
        class="inline-flex items-center gap-1.5 bg-primary hover:bg-primary/90 shadow-xs hover:shadow-md hover:shadow-primary/20 px-4 py-2 rounded-xl focus-visible:outline-none font-semibold text-primary-content text-sm active:scale-95 transition-all duration-180"
      >
        <span>View app</span>
        <span class="arrow-nudge" aria-hidden="true">→</span>
      </NuxtLink>
    </div>
  </article>
</template>

