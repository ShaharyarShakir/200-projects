<script setup lang="ts">
import { products } from '~/shared/data/products'

useSeoMeta({
  title: 'My Tiny Apps — Tiny apps for annoying problems',
  ogTitle: 'My Tiny Apps — Tiny apps for annoying problems',
  description: 'Simple software that does one thing really well. Buy once. Use forever. No recurring subscriptions.',
  ogDescription: 'Simple software that does one thing really well. Buy once. Use forever. No recurring subscriptions.',
  twitterCard: 'summary_large_image',
})

const featuredProduct = products[0]
</script>

<template>
  <div>
    <!-- Hero Section -->
    <section class="relative py-20 sm:py-32 overflow-hidden">
      <!-- Subtle ambient background pattern -->
      <div class="absolute inset-0 bg-grid-pattern opacity-[0.03] dark:opacity-[0.07] pointer-events-none" aria-hidden="true" />

      <!-- Very subtle, restrained ambient radial glow -->
      <div
        class="top-1/2 left-1/2 -z-10 absolute bg-primary/10 dark:bg-primary/15 blur-[100px] rounded-full w-95 h-95 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        aria-hidden="true"
      />

      <Container>
        <div class="mx-auto max-w-3xl text-center">
          <!-- Kicker Badge -->
          <div class="animate-hero-fade">
            <div
              class="inline-flex items-center gap-2 bg-base-200/60 shadow-2xs backdrop-blur-xs px-3.5 py-1 border border-base-300/80 rounded-full font-semibold text-xs text-base-content/80 tracking-wide"
            >
              <span class="relative flex w-2 h-2">
                <span class="inline-flex absolute bg-primary opacity-75 rounded-full w-full h-full animate-ping" />
                <span class="inline-flex relative bg-primary rounded-full w-2 h-2" />
              </span>
              <span>Independent software store</span>
            </div>
          </div>

          <!-- Hero Headline -->
          <h1
            class="mt-7 font-extrabold text-base-content text-4xl sm:text-6xl lg:text-7xl tracking-tight animate-hero-fade animation-delay-100"
          >
            Tiny apps for
            <span class="block text-primary">
              annoying problems.
            </span>
          </h1>

          <!-- Hero Subtitle -->
          <p
            class="mx-auto mt-6 max-w-xl text-base text-base-content/75 sm:text-lg leading-relaxed animate-hero-fade animation-delay-200"
          >
            Simple software that does one thing really well.
            <span class="font-medium text-base-content">Buy once. Use forever.</span>
          </p>

          <!-- Hero CTA Actions -->
          <div
            class="flex sm:flex-row flex-col justify-center items-center gap-3 mt-9 animate-hero-fade animation-delay-300"
          >
            <NuxtLink
              to="/apps"
              class="px-6 rounded-xl focus-visible:outline-none font-semibold text-sm sm:text-base btn btn-primary"
            >
              <span>Explore apps</span>
              <span class="arrow-nudge" aria-hidden="true">→</span>
            </NuxtLink>

            <a
              href="#featured"
              class="inline-flex justify-center items-center bg-base-100/80 hover:bg-base-200/60 shadow-2xs backdrop-blur-xs px-6 py-2.5 border border-base-300/90 hover:border-primary/40 rounded-xl focus-visible:outline-none font-medium text-sm text-base-content/80 sm:text-base hover:text-base-content active:scale-95 transition-all duration-180"
            >
              See what's coming
            </a>
          </div>

          <!-- Subtle Trust Metrics -->
          <div class="flex flex-wrap justify-center items-center gap-x-6 gap-y-2 mt-12 font-medium text-xs text-base-content/55 animate-hero-fade animation-delay-300">
            <span class="inline-flex items-center gap-1.5">
              <span class="font-bold text-primary">✓</span> 100% Offline Processing
            </span>
            <span class="inline-flex items-center gap-1.5">
              <span class="font-bold text-primary">✓</span> No Subscriptions
            </span>
            <span class="inline-flex items-center gap-1.5">
              <span class="font-bold text-primary">✓</span> Zero Telemetry
            </span>
          </div>
        </div>
      </Container>
    </section>

    <!-- Featured Apps Section -->
    <section
      id="featured"
      class="bg-base-200/30 py-20 sm:py-28 border-base-300/80 border-t transition-colors duration-200"
    >
      <Container>
        <div class="flex sm:flex-row flex-col justify-between items-start sm:items-end gap-4 mb-10">
          <div>
            <div class="inline-flex items-center gap-2">
              <span class="font-bold text-primary text-xs uppercase tracking-wider">
                Featured apps
              </span>
              <span class="bg-base-100 px-1.5 py-0.5 border border-base-300 rounded-md font-semibold text-[10px] text-base-content/60">
                1 App
              </span>
            </div>

            <h2 class="mt-2 font-bold text-base-content text-2xl sm:text-3xl tracking-tight">
              Built to solve one problem.
            </h2>

            <p class="mt-1.5 text-sm text-base-content/65">
              No bloated feature lists. No background sync. Just pure utility.
            </p>
          </div>

          <NuxtLink
            to="/apps"
            class="group inline-flex items-center gap-1 hover:opacity-85 focus-visible:outline-none font-semibold text-primary text-sm transition-opacity"
          >
            <span>View all apps</span>
            <span class="arrow-nudge" aria-hidden="true">→</span>
          </NuxtLink>
        </div>

        <div class="gap-6 grid md:grid-cols-2 lg:grid-cols-3">
          <ProductCard
            v-if="featuredProduct"
            :product="featuredProduct"
          />
        </div>
      </Container>
    </section>

    <!-- Why My Tiny Apps Section -->
    <section class="py-20 sm:py-28 border-base-300/80 border-t">
      <Container>
        <div class="mx-auto max-w-2xl text-center">
          <p class="font-bold text-primary text-xs uppercase tracking-wider">
            Why My Tiny Apps?
          </p>

          <h2 class="mt-2 font-bold text-base-content text-2xl sm:text-4xl tracking-tight">
            Software without the baggage.
          </h2>

          <p class="mt-3.5 text-sm text-base-content/70 sm:text-base leading-relaxed">
            Lightweight, dependable tools crafted to solve everyday frictions without recurring fees.
          </p>
        </div>

        <div class="gap-6 sm:gap-8 grid md:grid-cols-3 mt-12">
          <!-- Buy once -->
          <div
            class="group bg-base-100/80 shadow-xs hover:shadow-md backdrop-blur-xs p-7 border border-base-300/90 hover:border-primary/40 rounded-2xl transition-all hover:-translate-y-0.5 duration-200"
          >
            <div
              class="flex justify-center items-center bg-base-200/70 shadow-2xs border border-base-300/80 rounded-xl w-11 h-11 text-2xl group-hover:scale-105 transition-transform duration-300 select-none"
            >
              💳
            </div>

            <h3 class="mt-5 font-bold text-base-content text-lg tracking-tight">
              Buy once
            </h3>

            <p class="mt-2 text-sm text-base-content/70 leading-relaxed">
              Pay for the app once and keep it forever. No monthly charges, no recurring fees, and free lifetime updates.
            </p>
          </div>

          <!-- Privacy first -->
          <div
            class="group bg-base-100/80 shadow-xs hover:shadow-md backdrop-blur-xs p-7 border border-base-300/90 hover:border-primary/40 rounded-2xl transition-all hover:-translate-y-0.5 duration-200"
          >
            <div
              class="flex justify-center items-center bg-base-200/70 shadow-2xs border border-base-300/80 rounded-xl w-11 h-11 text-2xl group-hover:scale-105 transition-transform duration-300 select-none"
            >
              🔒
            </div>

            <h3 class="mt-5 font-bold text-base-content text-lg tracking-tight">
              Privacy first
            </h3>

            <p class="mt-2 text-sm text-base-content/70 leading-relaxed">
              Files and data are processed locally on your own hardware. Zero telemetry, zero analytics tracking, zero cloud leaks.
            </p>
          </div>

          <!-- One job -->
          <div
            class="group bg-base-100/80 shadow-xs hover:shadow-md backdrop-blur-xs p-7 border border-base-300/90 hover:border-primary/40 rounded-2xl transition-all hover:-translate-y-0.5 duration-200"
          >
            <div
              class="flex justify-center items-center bg-base-200/70 shadow-2xs border border-base-300/80 rounded-xl w-11 h-11 text-2xl group-hover:scale-105 transition-transform duration-300 select-none"
            >
              🎯
            </div>

            <h3 class="mt-5 font-bold text-base-content text-lg tracking-tight">
              One job
            </h3>

            <p class="mt-2 text-sm text-base-content/70 leading-relaxed">
              Each tiny app eliminates a single specific headache. Fast startup, no onboarding friction, and zero bloat.
            </p>
          </div>
        </div>
      </Container>
    </section>

    <!-- Bottom CTA Banner -->
    <section class="bg-base-200/40 py-16 sm:py-20 border-base-300/80 border-t transition-colors duration-200">
      <Container>
        <div class="mx-auto max-w-2xl text-center">
          <h2 class="font-bold text-base-content text-2xl sm:text-3xl tracking-tight">
            Find your next tiny tool.
          </h2>

          <p class="mt-3 text-sm text-base-content/70 sm:text-base">
            Explore our curated catalog of small, reliable indie software.
          </p>

          <div class="mt-7">
            <NuxtLink
              to="/apps"
              class="px-7 rounded-xl focus-visible:outline-none font-semibold text-sm sm:text-base btn btn-primary"
            >
              <span>Browse apps</span>
              <span class="arrow-nudge" aria-hidden="true">→</span>
            </NuxtLink>
          </div>
        </div>
      </Container>
    </section>
  </div>
</template>

