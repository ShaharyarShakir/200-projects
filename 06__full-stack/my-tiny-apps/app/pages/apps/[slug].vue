<script setup lang="ts">
import { products } from '~/shared/data/products'

const route = useRoute()
const { openCheckout, isLoading: isPaddleLoading } = usePaddle()
const isPurchasing = ref(false)

const product = computed(() =>
  products.find(
    item =>
      item.slug === route.params.slug ||
      (route.params.slug === 'tiny-image-compressor' && item.slug === 'tiny-compressor'),
  ),
)

if (!product.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'App not found',
  })
}

const handleBuyNow = async () => {
  if (!product.value?.paddlePriceId) {
    alert(
      'Paddle Price ID is not configured yet for this product. You can set PADDLE_PRICE_ID in your catalog or .env.',
    )
    return
  }

  isPurchasing.value = true
  try {
    await openCheckout(product.value.paddlePriceId)
  } catch (error) {
    console.error('Failed to open Paddle checkout:', error)
  } finally {
    isPurchasing.value = false
  }
}

useSeoMeta({
  title: () => `${product.value?.name} — My Tiny Apps`,
  ogTitle: () => `${product.value?.name} — My Tiny Apps`,
  description: () => product.value?.shortDescription,
  ogDescription: () => product.value?.shortDescription,
  twitterCard: 'summary_large_image',
})
</script>

<template>
  <div v-if="product">
    <!-- Hero & Purchase Overview Section -->
    <section class="py-12 sm:py-20">
      <Container>
        <!-- Breadcrumb back link -->
        <NuxtLink
          to="/apps"
          class="group inline-flex items-center gap-1.5 focus-visible:outline-none font-semibold hover:text-primary text-xs text-base-content/60 uppercase tracking-wider transition-colors duration-150"
        >
          <span class="inline-block transition-transform group-hover:-translate-x-1 duration-150" aria-hidden="true">←</span>
          <span>All apps</span>
        </NuxtLink>

        <!-- Main Product Grid: Details & Purchase Card -->
        <div class="gap-10 lg:gap-14 grid lg:grid-cols-[1fr_360px] mt-8">
          <!-- Left Column: Product Details & Showcase -->
          <div>
            <!-- Header Row with Icon -->
            <div class="flex items-start gap-6">
              <div
                class="flex justify-center items-center bg-base-200/60 shadow-xs border border-base-300/80 rounded-3xl w-20 h-20 text-4xl select-none shrink-0"
              >
                {{ product.icon }}
              </div>

              <div class="flex-1">
                <div class="flex flex-wrap items-center gap-2">
                  <!-- Status badge -->
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

                  <!-- Version -->
                  <span class="font-mono text-xs text-base-content/50">
                    v{{ product.version }}
                  </span>

                  <!-- Platform tags -->
                  <span
                    v-for="platform in product.platforms"
                    :key="platform"
                    class="bg-base-200/40 px-2 py-0.5 border border-base-300/80 rounded-md font-semibold text-[11px] text-base-content/55 uppercase tracking-wider"
                  >
                    {{ platform }}
                  </span>
                </div>

                <h1
                  class="mt-3 font-extrabold text-base-content text-3xl sm:text-4xl lg:text-5xl tracking-tight"
                >
                  {{ product.name }}
                </h1>
              </div>
            </div>

            <p
              class="mt-5 text-base text-base-content/75 sm:text-lg leading-relaxed"
            >
              {{ product.shortDescription }}
            </p>

            <!-- Product Preview / Screenshots -->
            <div class="mt-10">
              <ProductScreenshots
                :screenshots="product.screenshots"
                :product-name="product.name"
              />
            </div>
          </div>

          <!-- Right Column: Sticky Purchase Card -->
          <div class="lg:relative">
            <div
              class="lg:top-24 lg:sticky bg-base-100/90 shadow-xs backdrop-blur-xs p-7 border border-base-300/90 rounded-3xl transition-colors"
            >
              <!-- Card Header -->
              <div class="flex justify-between items-center">
                <span class="font-bold text-xs text-base-content/50 uppercase tracking-wider">
                  One-time purchase
                </span>
                <span class="inline-flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 border border-emerald-500/20 rounded-md font-semibold text-emerald-600 dark:text-emerald-400 text-xs">
                  Lifetime access
                </span>
              </div>

              <!-- Price Typography -->
              <div class="flex items-baseline gap-1.5 mt-4">
                <span class="font-extrabold text-base-content text-4xl tracking-tight">
                  ${{ product.price }}
                </span>
                <span class="font-mono font-semibold text-xs text-base-content/50 uppercase">
                  {{ product.currency }}
                </span>
              </div>

              <p class="mt-1 text-xs text-base-content/55">
                No monthly or yearly recurring subscription.
              </p>

              <!-- CTA Button -->
              <div class="mt-6">
                <button
                  v-if="product.status === 'available'"
                  :disabled="isPurchasing || isPaddleLoading"
                  class="shadow-md shadow-primary/20 rounded-xl focus-visible:outline-none w-full font-semibold text-base btn btn-primary"
                  @click="handleBuyNow"
                >
                  <span v-if="isPurchasing || isPaddleLoading" class="loading loading-spinner loading-sm" />
                  <span v-else>Buy now</span>
                  <span v-if="!isPurchasing && !isPaddleLoading" class="arrow-nudge" aria-hidden="true">→</span>
                </button>

                <button
                  v-else
                  disabled
                  class="flex justify-center items-center bg-base-200/60 shadow-2xs py-3 border border-base-300 rounded-xl w-full font-semibold text-sm text-base-content/45 cursor-not-allowed select-none"
                >
                  Coming soon
                </button>
              </div>

              <!-- Included Highlights -->
              <div class="mt-7 pt-6 border-base-300/80 border-t">
                <p class="font-bold text-xs text-base-content/50 uppercase tracking-wider">
                  What's included
                </p>

                <ul class="space-y-2.5 mt-3.5">
                  <li
                    v-for="feature in product.features.slice(0, 4)"
                    :key="feature"
                    class="flex items-start gap-2.5 text-xs text-base-content/80"
                  >
                    <span class="font-bold text-primary">✓</span>
                    <span>{{ feature }}</span>
                  </li>
                </ul>
              </div>

              <!-- Guarantee Note -->
              <div class="bg-base-200/30 mt-6 p-3 border border-base-300/60 rounded-xl text-[11px] text-base-content/60 text-center">
                14-day refund policy • Free future updates
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>

    <!-- Detailed About & Features Section -->
    <section class="bg-base-200/25 py-16 sm:py-24 border-base-300/80 border-t transition-colors duration-200">
      <Container>
        <div class="gap-12 lg:gap-14 grid lg:grid-cols-[1fr_360px]">
          <div>
            <div class="inline-flex items-center gap-2 bg-base-100 shadow-2xs px-3 py-0.5 border border-base-300 rounded-full font-semibold text-primary text-xs">
              Overview
            </div>

            <h2 class="mt-3 font-bold text-base-content text-2xl sm:text-3xl tracking-tight">
              About {{ product.name }}
            </h2>

            <p
              class="mt-4 text-base text-base-content/75 sm:text-lg leading-relaxed"
            >
              {{ product.description }}
            </p>

            <div class="bg-base-100 shadow-xs mt-8 p-6 border border-base-300/80 rounded-2xl">
              <h3 class="font-bold text-sm text-base-content/50 uppercase tracking-wider">
                System Compatibility
              </h3>
              <div class="flex flex-wrap gap-2 mt-3">
                <span
                  v-for="platform in product.platforms"
                  :key="platform"
                  class="inline-flex items-center gap-1.5 bg-base-200/60 px-3 py-1 border border-base-300 rounded-lg font-medium text-xs text-base-content/80"
                >
                  <span class="bg-primary rounded-full w-1.5 h-1.5" />
                  <span class="capitalize">{{ platform }} OS</span>
                </span>
              </div>
            </div>
          </div>

          <div>
            <h2 class="font-bold text-base text-base-content/50 uppercase tracking-wider">
              All Capabilities
            </h2>

            <div class="mt-4">
              <ProductFeatures :features="product.features" />
            </div>
          </div>
        </div>
      </Container>
    </section>

    <!-- Privacy Guarantee Section -->
    <section class="py-16 sm:py-20 border-base-300/80 border-t">
      <Container>
        <div
          class="bg-base-100/90 shadow-xs backdrop-blur-xs mx-auto p-8 sm:p-10 border border-base-300/90 rounded-3xl max-w-2xl text-center"
        >
          <div
            class="flex justify-center items-center bg-base-200 shadow-2xs mx-auto border border-base-300/80 rounded-2xl w-13 h-13 text-2xl select-none"
          >
            🔒
          </div>

          <h2 class="mt-5 font-bold text-base-content text-2xl sm:text-3xl tracking-tight">
            Your files stay yours.
          </h2>

          <p class="mt-3 text-sm text-base-content/70 sm:text-base leading-relaxed">
            {{ product.name }} executes 100% locally on your machine. Zero cloud uploads, zero telemetry beacons, and zero account requirements.
          </p>

          <div class="flex justify-center mt-6">
            <NuxtLink
              to="/privacy"
              class="group inline-flex items-center gap-1 focus-visible:outline-none font-semibold text-primary text-xs hover:underline uppercase tracking-wider"
            >
              <span>Read our privacy architecture</span>
              <span class="arrow-nudge" aria-hidden="true">→</span>
            </NuxtLink>
          </div>
        </div>
      </Container>
    </section>
  </div>
</template>

