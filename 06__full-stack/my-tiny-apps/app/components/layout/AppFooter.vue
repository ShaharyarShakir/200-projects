<template>
  <footer class="bg-base-200/40 border-base-300/80 border-t transition-colors duration-200" aria-label="Site Footer">
    <Container>
      <div class="flex sm:flex-row flex-col justify-between sm:items-start gap-10 py-12 sm:py-16">
        <!-- Brand column -->
        <div class="max-w-sm">
          <NuxtLink
            to="/"
            class="group inline-flex items-center hover:opacity-90 focus-visible:outline-none transition-opacity"
            aria-label="My Tiny Apps Homepage"
          >
            <AppLogo size="md" />
          </NuxtLink>

          <p class="mt-3.5 text-sm text-base-content/70 leading-relaxed">
            Tiny apps for annoying problems. Crafted with care, zero bloat, and total privacy by design.
          </p>

          <div class="inline-flex items-center gap-2 bg-base-100/80 shadow-2xs mt-5 px-3 py-1 border border-base-300/80 rounded-full font-medium text-xs text-base-content/70">
            <span class="relative flex w-2 h-2">
              <span class="inline-flex absolute bg-emerald-400 opacity-75 rounded-full w-full h-full animate-ping" />
              <span class="inline-flex relative bg-emerald-500 rounded-full w-2 h-2" />
            </span>
            <span>Indie Software Studio</span>
          </div>
        </div>

        <!-- Links -->
        <div class="gap-x-12 gap-y-4 sm:gap-x-16 grid grid-cols-2 text-sm">
          <div class="flex flex-col gap-2.5">
            <p class="font-bold text-xs text-base-content/45 uppercase tracking-wider">
              Store
            </p>
            <NuxtLink
              to="/apps"
              class="focus-visible:outline-none hover:text-primary text-base-content/75 transition-colors duration-150"
            >
              All Apps
            </NuxtLink>
            <NuxtLink
              to="/support"
              class="focus-visible:outline-none hover:text-primary text-base-content/75 transition-colors duration-150"
            >
              Support & Help
            </NuxtLink>
          </div>

          <div class="flex flex-col gap-2.5">
            <p class="font-bold text-xs text-base-content/45 uppercase tracking-wider">
              Legal
            </p>
            <NuxtLink
              to="/privacy"
              class="focus-visible:outline-none hover:text-primary text-base-content/75 transition-colors duration-150"
            >
              Privacy Policy
            </NuxtLink>
            <NuxtLink
              to="/terms"
              class="focus-visible:outline-none hover:text-primary text-base-content/75 transition-colors duration-150"
            >
              Terms of Service
            </NuxtLink>
          </div>
        </div>
      </div>

      <!-- Bottom Bar -->
      <div
        class="flex sm:flex-row flex-col justify-between items-center gap-4 py-6 border-base-300/80 border-t text-xs text-base-content/55"
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

