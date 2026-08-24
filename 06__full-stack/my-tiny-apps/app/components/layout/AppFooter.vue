<template>
  <footer class="border-t border-base-300 bg-base-200/50 transition-colors">
    <Container>
      <div
        class="flex flex-col gap-10 py-14 sm:flex-row sm:items-start sm:justify-between"
      >
        <!-- Brand column -->
        <div class="max-w-sm">
          <NuxtLink
            to="/"
            class="inline-flex items-center gap-2.5 font-bold tracking-tight text-base-content"
          >
            <span
              class="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-xs font-black text-primary-content shadow-xs"
            >
              ✦
            </span>
            <span class="text-lg">My Tiny Apps</span>
          </NuxtLink>

          <p class="mt-3 text-sm leading-relaxed text-base-content/65">
            Tiny apps for annoying problems. Crafted with care, zero bloat, and total privacy by design.
          </p>
        </div>

        <!-- Links -->
        <div class="grid grid-cols-2 gap-x-12 gap-y-3 text-sm">
          <div class="flex flex-col gap-2.5">
            <p class="text-xs font-semibold uppercase tracking-wider text-base-content/40">
              Store
            </p>
            <NuxtLink
              to="/apps"
              class="text-base-content/75 transition-colors hover:text-primary"
            >
              All Apps
            </NuxtLink>
            <NuxtLink
              to="/support"
              class="text-base-content/75 transition-colors hover:text-primary"
            >
              Support & Help
            </NuxtLink>
          </div>

          <div class="flex flex-col gap-2.5">
            <p class="text-xs font-semibold uppercase tracking-wider text-base-content/40">
              Legal
            </p>
            <NuxtLink
              to="/privacy"
              class="text-base-content/75 transition-colors hover:text-primary"
            >
              Privacy Policy
            </NuxtLink>
            <NuxtLink
              to="/terms"
              class="text-base-content/75 transition-colors hover:text-primary"
            >
              Terms of Service
            </NuxtLink>
          </div>
        </div>
      </div>

      <!-- Bottom Bar -->
      <div
        class="flex flex-col items-center justify-between gap-4 border-t border-base-300/80 py-6 text-xs text-base-content/50 sm:flex-row"
      >
        <p>© {{ new Date().getFullYear() }} My Tiny Apps. All rights reserved.</p>

        <p class="inline-flex items-center gap-1.5 text-base-content/40">
          <span>Buy once</span>
          <span>•</span>
          <span>Use forever</span>
          <span>•</span>
          <span>No nonsense</span>
        </p>
      </div>
    </Container>
  </footer>
</template>
