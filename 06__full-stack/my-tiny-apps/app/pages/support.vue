<script setup lang="ts">
useSeoMeta({
  title: 'Support & Help — My Tiny Apps',
  ogTitle: 'Support & Help — My Tiny Apps',
  description: 'Get help with purchases, licenses, bug reports, and My Tiny Apps software products.',
  ogDescription: 'Get help with purchases, licenses, bug reports, and My Tiny Apps software products.',
  twitterCard: 'summary_large_image',
})

const copiedEmail = ref(false)

const copyEmail = async () => {
  try {
    await navigator.clipboard.writeText('support@mytinyapps.com')
    copiedEmail.value = true
    setTimeout(() => {
      copiedEmail.value = false
    }, 2000)
  }
  catch {
    // Fallback if clipboard API is restricted
    copiedEmail.value = false
  }
}

const faqs = [
  {
    question: 'How do app licenses work?',
    answer: 'Every app purchase is a one-time payment for lifetime access. There are no recurring monthly or yearly fees, and all future maintenance updates are included at no extra charge.',
  },
  {
    question: 'Can I install my purchased app on multiple personal devices?',
    answer: 'Yes. A personal license allows you to install and activate the app on all personal devices running the supported operating system.',
  },
  {
    question: 'What is your refund policy?',
    answer: 'If an app does not work as expected on your device and our support team cannot resolve the problem, we provide a full refund within 14 days of purchase.',
  },
  {
    question: 'Do tiny apps require an active internet connection?',
    answer: 'No. Offline-capable apps (like Tiny Image Compressor) are built to execute 100% locally on your device without sending any data over the network.',
  },
]
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
            Help & Support
          </div>

          <h1 class="mt-5 font-extrabold text-base-content text-4xl sm:text-5xl tracking-tight">
            Need a hand?
          </h1>

          <p class="mt-4 text-base text-base-content/75 sm:text-lg leading-relaxed">
            Have a question about an app, encountered a bug, or need help with a purchase? We're here for you.
          </p>
        </div>
      </Container>
    </section>

    <!-- Support Content Cards -->
    <section class="py-14 sm:py-20">
      <Container>
        <div class="gap-6 grid md:grid-cols-3">
          <!-- Email Support Card -->
          <div
            class="flex flex-col justify-between bg-base-100/90 shadow-xs hover:shadow-md backdrop-blur-xs p-7 border border-base-300/90 hover:border-primary/40 rounded-3xl transition-all hover:-translate-y-0.5 duration-200"
          >
            <div>
              <div
                class="flex justify-center items-center bg-base-200/70 shadow-2xs border border-base-300/80 rounded-2xl w-12 h-12 text-2xl select-none"
              >
                ✉️
              </div>

              <h2 class="mt-6 font-bold text-base-content text-lg sm:text-xl tracking-tight">
                Direct email
              </h2>

              <p class="mt-2 text-sm text-base-content/70 leading-relaxed">
                For order questions, license recovery, feature requests, or technical bug reports.
              </p>
            </div>

            <div class="flex flex-col gap-2 mt-8">
              <a
                href="mailto:support@mytinyapps.com"
                class="shadow-xs rounded-xl focus-visible:outline-none font-semibold btn btn-primary btn-sm"
              >
                <span>Email support</span>
                <span class="arrow-nudge" aria-hidden="true">→</span>
              </a>

              <button
                type="button"
                class="inline-flex justify-center items-center bg-base-200/40 hover:bg-base-200 py-1.5 border border-base-300/80 rounded-xl focus-visible:outline-none font-medium text-xs text-base-content/70 hover:text-base-content transition-colors"
                @click="copyEmail"
              >
                {{ copiedEmail ? '✓ Copied to clipboard!' : 'Copy: support@mytinyapps.com' }}
              </button>
            </div>
          </div>

          <!-- FAQ Summary Card -->
          <div
            class="flex flex-col justify-between bg-base-100/90 shadow-xs hover:shadow-md backdrop-blur-xs p-7 border border-base-300/90 hover:border-primary/40 rounded-3xl transition-all hover:-translate-y-0.5 duration-200"
          >
            <div>
              <div
                class="flex justify-center items-center bg-base-200/70 shadow-2xs border border-base-300/80 rounded-2xl w-12 h-12 text-2xl select-none"
              >
                💳
              </div>

              <h2 class="mt-6 font-bold text-base-content text-lg sm:text-xl tracking-tight">
                Licensing & updates
              </h2>

              <p class="mt-2 text-sm text-base-content/70 leading-relaxed">
                All purchases are one-time payments. Your license is valid for lifetime usage with free future updates.
              </p>
            </div>

            <div class="mt-8">
              <NuxtLink
                to="/apps"
                class="inline-flex items-center gap-1.5 bg-base-200/50 hover:bg-base-200 px-4 py-2 border border-base-300/80 rounded-xl focus-visible:outline-none font-semibold text-sm text-base-content/80 hover:text-base-content transition-colors"
              >
                <span>Explore all apps</span>
                <span class="arrow-nudge" aria-hidden="true">→</span>
              </NuxtLink>
            </div>
          </div>

          <!-- Privacy Guarantee Card -->
          <div
            class="flex flex-col justify-between bg-base-100/90 shadow-xs hover:shadow-md backdrop-blur-xs p-7 border border-base-300/90 hover:border-primary/40 rounded-3xl transition-all hover:-translate-y-0.5 duration-200"
          >
            <div>
              <div
                class="flex justify-center items-center bg-base-200/70 shadow-2xs border border-base-300/80 rounded-2xl w-12 h-12 text-2xl select-none"
              >
                🔒
              </div>

              <h2 class="mt-6 font-bold text-base-content text-lg sm:text-xl tracking-tight">
                Zero data tracking
              </h2>

              <p class="mt-2 text-sm text-base-content/70 leading-relaxed">
                Our apps process everything locally on your hardware. We never sell, track, or inspect your files.
              </p>
            </div>

            <div class="mt-8">
              <NuxtLink
                to="/privacy"
                class="inline-flex items-center gap-1 focus-visible:outline-none font-medium text-primary text-sm hover:underline"
              >
                <span>Read privacy policy</span>
                <span class="arrow-nudge" aria-hidden="true">→</span>
              </NuxtLink>
            </div>
          </div>
        </div>

        <!-- Frequently Asked Questions Accordion -->
        <div class="mt-16 sm:mt-24">
          <div class="mx-auto max-w-3xl">
            <h2 class="font-bold text-base-content text-2xl sm:text-3xl tracking-tight">
              Frequently Asked Questions
            </h2>
            <p class="mt-2 text-sm text-base-content/65">
              Quick answers about licensing, compatibility, and app policies.
            </p>

            <div class="space-y-4 mt-8">
              <details
                v-for="faq in faqs"
                :key="faq.question"
                class="group bg-base-100/90 shadow-xs p-5 border border-base-300/80 open:border-primary/40 rounded-2xl transition-colors"
              >
                <summary class="flex justify-between items-center focus-visible:outline-none font-semibold text-base text-base-content cursor-pointer select-none list-none">
                  <span>{{ faq.question }}</span>
                  <span class="ml-4 text-base-content/50 group-open:rotate-180 transition-transform duration-200 shrink-0">
                    ▼
                  </span>
                </summary>
                <p class="mt-3 text-sm text-base-content/75 leading-relaxed">
                  {{ faq.answer }}
                </p>
              </details>
            </div>
          </div>
        </div>
      </Container>
    </section>
  </div>
</template>

