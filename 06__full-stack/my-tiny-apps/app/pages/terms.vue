<script setup lang="ts">
useSeoMeta({
  title: 'Terms of Service — My Tiny Apps',
  ogTitle: 'Terms of Service — My Tiny Apps',
  description: 'Terms of service and licensing guidelines for My Tiny Apps software products.',
  ogDescription: 'Terms of service and licensing guidelines for My Tiny Apps software products.',
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
            <span>Agreement</span>
            <span class="text-base-content/30">•</span>
            <span class="text-base-content/70">Updated August 2026</span>
          </div>

          <h1 class="mt-5 font-extrabold text-base-content text-4xl sm:text-5xl tracking-tight">
            Terms of Service
          </h1>

          <p class="mt-4 text-base text-base-content/75 sm:text-lg leading-relaxed">
            Simple, honest terms governing the purchase and usage of software distributed through My Tiny Apps.
          </p>
        </div>
      </Container>
    </section>

    <!-- Content -->
    <section class="py-14 sm:py-20">
      <Container>
        <div class="space-y-8 mx-auto max-w-3xl">
          <div class="bg-base-100/90 shadow-xs backdrop-blur-xs p-7 sm:p-9 border border-base-300/90 rounded-3xl">
            <h2 class="font-bold text-base-content text-xl sm:text-2xl tracking-tight">
              1. Purchases & Licensing
            </h2>
            <p class="mt-3.5 text-sm text-base-content/75 sm:text-base leading-relaxed">
              When you purchase an app, you receive a perpetual, non-exclusive license to download, install, and use the software on your personal or commercial devices according to the license terms specified at checkout.
            </p>
          </div>

          <div class="bg-base-100/90 shadow-xs backdrop-blur-xs p-7 sm:p-9 border border-base-300/90 rounded-3xl">
            <h2 class="font-bold text-base-content text-xl sm:text-2xl tracking-tight">
              2. Updates & Support
            </h2>
            <p class="mt-3.5 text-sm text-base-content/75 sm:text-base leading-relaxed">
              Minor updates, maintenance fixes, performance improvements, and bug patches for the purchased version are provided free of charge. Product support is provided through our official email channel.
            </p>
          </div>

          <div class="bg-base-100/90 shadow-xs backdrop-blur-xs p-7 sm:p-9 border border-base-300/90 rounded-3xl">
            <h2 class="font-bold text-base-content text-xl sm:text-2xl tracking-tight">
              3. Refund Policy
            </h2>
            <p class="mt-3.5 text-sm text-base-content/75 sm:text-base leading-relaxed">
              If an app does not work as advertised on your device and our support cannot resolve the issue, contact us within 14 days of purchase for a prompt full refund.
            </p>
          </div>

          <div class="bg-base-100/90 shadow-xs backdrop-blur-xs p-7 sm:p-9 border border-base-300/90 rounded-3xl">
            <h2 class="font-bold text-base-content text-xl sm:text-2xl tracking-tight">
              4. Questions
            </h2>
            <p class="mt-3.5 text-sm text-base-content/75 sm:text-base leading-relaxed">
              For any legal or licensing inquiries, email us directly at <a href="mailto:support@mytinyapps.com" class="font-semibold text-primary decoration-primary/40 hover:decoration-primary underline underline-offset-4">support@mytinyapps.com</a>.
            </p>
          </div>
        </div>
      </Container>
    </section>
  </div>
</template>

