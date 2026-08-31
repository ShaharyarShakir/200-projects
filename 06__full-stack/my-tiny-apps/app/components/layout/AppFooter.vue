<template>
  <footer class="border-t border-base-300/80 bg-base-200/40 transition-colors duration-200" aria-label="Site Footer">
    <Container>
      <div class="flex flex-col justify-between gap-10 py-12 sm:flex-row sm:items-start sm:py-16">
        <!-- Brand column -->
        <div class="max-w-sm">
          <NuxtLink
            to="/"
            class="group inline-flex items-center transition-opacity hover:opacity-90 focus-visible:outline-none"
            aria-label="My Tiny Apps Homepage"
          >
            <AppLogo size="md" />
          </NuxtLink>

          <p class="mt-3.5 text-sm leading-relaxed text-base-content/70">
            Tiny apps for annoying problems. Crafted with care, zero bloat, and total privacy by design.
          </p>

          <div class="mt-5 inline-flex items-center gap-2 rounded-full border border-base-300/80 bg-base-100/80 px-3 py-1 text-xs font-medium text-base-content/70 shadow-2xs">
            <span class="relative flex h-2 w-2">
              <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span class="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span>Indie Software Studio</span>
          </div>
        </div>

        <!-- Links -->
        <div class="grid grid-cols-2 gap-x-12 gap-y-4 text-sm sm:gap-x-16">
          <div class="flex flex-col gap-2.5">
            <p class="text-xs font-bold uppercase tracking-wider text-base-content/45">
              Store
            </p>
            <NuxtLink
              to="/apps"
              class="text-base-content/75 transition-colors duration-150 hover:text-primary focus-visible:outline-none"
            >
              All Apps
            </NuxtLink>
            <NuxtLink
              to="/support"
              class="text-base-content/75 transition-colors duration-150 hover:text-primary focus-visible:outline-none"
            >
              Support & Help
            </NuxtLink>
          </div>

          <div class="flex flex-col gap-2.5">
            <p class="text-xs font-bold uppercase tracking-wider text-base-content/45">
              Legal
            </p>
            <NuxtLink
              to="/privacy"
              class="text-base-content/75 transition-colors duration-150 hover:text-primary focus-visible:outline-none"
            >
              Privacy Policy
            </NuxtLink>
            <NuxtLink
              to="/terms"
              class="text-base-content/75 transition-colors duration-150 hover:text-primary focus-visible:outline-none"
            >
              Terms of Service
            </NuxtLink>
          </div>
        </div>
      </div>

      <!-- Bottom Bar -->
      <div
        class="flex flex-col items-center justify-between gap-4 border-t border-base-300/80 py-6 text-xs text-base-content/55 sm:flex-row"
      >
        <p>© {{ new Date().getFullYear() }} My Tiny Apps. All rights reserved.</p>

        <p class="inline-flex items-center gap-2 text-base-content/45">
          <span>Buy once</span>
          <span class="text-base-content/25">•</span>
          <span>Use forever</span>
          <span class="text-base-content/25">•</span>
          <span>No nonsense</span>
        </p>
      </div>
    </Container>
  </footer>
</template>

