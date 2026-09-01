<script setup lang="ts">
useSeoMeta({
  title: 'Privacy Policy — My Tiny Apps',
  ogTitle: 'Privacy Policy — My Tiny Apps',
  description: 'Our clear, transparent privacy commitment: offline first, no tracking, and no subscriptions.',
  ogDescription: 'Our clear, transparent privacy commitment: offline first, no tracking, and no subscriptions.',
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
            <span>Transparency</span>
            <span class="text-base-content/30">•</span>
            <span class="text-base-content/70">Updated August 2026</span>
          </div>

          <h1 class="mt-5 font-extrabold text-base-content text-4xl sm:text-5xl tracking-tight">
            Privacy Policy
          </h1>

          <p class="mt-4 text-base text-base-content/75 sm:text-lg leading-relaxed">
            My Tiny Apps is built around a simple principle: collect as little information as humanly possible.
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
              1. Purchases & Payment Data
            </h2>
            <p class="mt-3.5 text-sm text-base-content/75 sm:text-base leading-relaxed">
              When you purchase an app, payment processing is handled securely by our payment partners. We receive only the minimal details necessary to issue your license and fulfill your order (such as your email address and transaction ID). We never see, process, or store your full payment card numbers.
            </p>
          </div>

          <div class="bg-base-100/90 shadow-xs backdrop-blur-xs p-7 sm:p-9 border border-base-300/90 rounded-3xl">
            <h2 class="font-bold text-base-content text-xl sm:text-2xl tracking-tight">
              2. Offline Local Processing
            </h2>
            <p class="mt-3.5 text-sm text-base-content/75 sm:text-base leading-relaxed">
              Apps designed for offline use (such as Tiny Image Compressor) process files 100% locally on your machine. Your images, documents, and data never leave your device and are never transmitted to our servers or third parties.
            </p>
          </div>

          <div class="bg-base-100/90 shadow-xs backdrop-blur-xs p-7 sm:p-9 border border-base-300/90 rounded-3xl">
            <h2 class="font-bold text-base-content text-xl sm:text-2xl tracking-tight">
              3. Analytics & Tracking
            </h2>
            <p class="mt-3.5 text-sm text-base-content/75 sm:text-base leading-relaxed">
              We do not run invasive third-party ad trackers, keystroke loggers, or cross-site tracking scripts. Any metrics we collect on our website are strictly aggregated and privacy-friendly.
            </p>
          </div>

          <div class="bg-base-100/90 shadow-xs backdrop-blur-xs p-7 sm:p-9 border border-base-300/90 rounded-3xl">
            <h2 class="font-bold text-base-content text-xl sm:text-2xl tracking-tight">
              4. Contact Us
            </h2>
            <p class="mt-3.5 text-sm text-base-content/75 sm:text-base leading-relaxed">
              If you have any questions or concerns regarding our privacy practices, please reach out to <a href="mailto:support@mytinyapps.com" class="font-semibold text-primary decoration-primary/40 hover:decoration-primary underline underline-offset-4">support@mytinyapps.com</a>.
            </p>
          </div>
        </div>
      </Container>
    </section>
  </div>
</template>

