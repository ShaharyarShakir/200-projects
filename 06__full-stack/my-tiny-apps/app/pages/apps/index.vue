<script setup lang="ts">
import { products } from '~/shared/data/products'

useSeoMeta({
  title: 'All Apps — My Tiny Apps',
  ogTitle: 'All Apps — My Tiny Apps',
  description: 'Explore small, focused apps built to solve annoying everyday frictions. Pay once, own forever.',
  ogDescription: 'Explore small, focused apps built to solve annoying everyday frictions. Pay once, own forever.',
  twitterCard: 'summary_large_image',
})
</script>

<template>
  <div>
    <!-- Header -->
    <section class="bg-base-200/30 py-16 sm:py-24 border-base-300/80 border-b transition-colors duration-200">
      <Container>
        <div class="max-w-2xl">
          <div
            class="inline-flex items-center gap-2 bg-base-100/90 shadow-2xs px-3.5 py-1 border border-base-300/80 rounded-full font-semibold text-primary text-xs uppercase tracking-wider"
          >
            <span>The Collection</span>
            <span class="text-base-content/30">•</span>
            <span class="text-base-content/70">{{ products.length }} {{ products.length === 1 ? 'App' : 'Apps' }}</span>
          </div>

          <h1 class="mt-5 font-extrabold text-base-content text-4xl sm:text-5xl lg:text-6xl tracking-tight">
            Tiny apps.
            <span class="block text-primary">Real problems.</span>
          </h1>

          <p class="mt-4 text-base text-base-content/75 sm:text-lg leading-relaxed">
            Focused software designed to do one thing exceptionally well. Pay once, own it forever, with zero recurring subscriptions.
          </p>
        </div>
      </Container>
    </section>

    <!-- Catalog Grid -->
    <section class="py-14 sm:py-20">
      <Container>
        <!-- Grid Header -->
        <div class="flex justify-between items-center mb-8">
          <p class="font-bold text-xs text-base-content/50 uppercase tracking-wider">
            Available & Upcoming Software
          </p>
          <span class="text-xs text-base-content/50">
            Showing {{ products.length }} {{ products.length === 1 ? 'app' : 'apps' }}
          </span>
        </div>

        <div
          v-if="products.length"
          class="gap-6 grid md:grid-cols-2 lg:grid-cols-3"
        >
          <ProductCard
            v-for="product in products"
            :key="product.slug"
            :product="product"
          />
        </div>

        <!-- Intentional Empty State -->
        <div
          v-else
          class="bg-base-200/30 p-16 border border-base-300 border-dashed rounded-3xl text-center"
        >
          <div class="flex justify-center items-center bg-base-100 shadow-xs mx-auto rounded-2xl w-14 h-14 text-2xl">
            ✨
          </div>
          <h3 class="mt-4 font-bold text-base text-base-content">
            No apps found
          </h3>
          <p class="mt-1.5 text-sm text-base-content/60">
            New tiny apps are currently in development. Check back soon!
          </p>
        </div>
      </Container>
    </section>
  </div>
</template>

