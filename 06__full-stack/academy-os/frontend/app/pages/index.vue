<script setup lang="ts">
import {
  isAdminHost,
  getHostname
} from '~/utils/host'
import AcademyHero from '~/components/academy/AcademyHero.vue'
import AcademyStatsBar from '~/components/academy/AcademyStatsBar.vue'
import AcademyFeaturesShowcase from '~/components/academy/AcademyFeaturesShowcase.vue'
import AcademyCtaSection from '~/components/academy/AcademyCtaSection.vue'

const event = import.meta.server ? useRequestEvent() : undefined
const hostname = getHostname(event) || ''

const isAdmin = computed(() => isAdminHost(hostname))

const { user } = useAuth()
const { academy: instructorAcademy } = useAcademy()
const { academy, load: loadPublicAcademy } = usePublicAcademy()
const { publicCourses, isLoading, fetchPublicCourses } = useCourses()

onMounted(() => {
  if (!isAdmin.value) {
    fetchPublicCourses()
  }
})

if (!isAdmin.value) {
  await loadPublicAcademy()
}

definePageMeta({
  layout: 'academy'
})
</script>

<template>
  <div>
    <!-- Public Student Academy Homepage (Host: john.academyos.local) -->
    <div v-if="!isAdmin" class="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 py-16">
      <div v-if="academy" class="space-y-6 max-w-3xl">
        <span class="inline-block px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-bold uppercase tracking-wider">
          Public Student Academy
        </span>
        <h1 class="text-4xl sm:text-6xl font-black text-white tracking-tight">
          {{ academy.name }}
        </h1>
        <p class="text-lg sm:text-xl text-slate-300">
          Learn from <span class="font-bold text-indigo-400">{{ academy.name }}</span>. Access world-class interactive masterclasses.
        </p>
        <div class="pt-4 flex flex-wrap justify-center gap-4">
          <NuxtLink to="/courses" class="px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-lg shadow-indigo-600/30">
            Browse Courses &rarr;
          </NuxtLink>
        </div>
      </div>
      <div v-else class="space-y-4">
        <h2 class="text-2xl font-bold text-slate-300">Loading Academy...</h2>
      </div>
    </div>

    <!-- Instructor Platform App Homepage (Host: app.academyos.local) -->
    <div v-else class="bg-[#0c0919] min-h-screen text-white select-none">
      <!-- Cosmic Astronaut Hero with GSAP Entrance & Parallax -->
      <AcademyHero />

      <!-- Animated Verified Metrics Bar -->
      <AcademyStatsBar />

      <!-- Interactive 3D Features Showcase -->
      <AcademyFeaturesShowcase />

      <!-- Main Content Section: Featured Courses & Community -->
      <section class="bg-[#0c0919] relative z-20 pb-16">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <!-- Authenticated Welcome Banner if logged in -->
          <div v-if="user" class="mb-16 p-8 bg-gradient-to-r from-purple-900/40 via-indigo-900/30 to-slate-900/60 border border-purple-500/30 rounded-3xl backdrop-blur-xl shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <span class="px-3 py-1 bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 rounded-full text-xs font-black uppercase tracking-wider">
                Active Session
              </span>
              <h2 class="text-2xl sm:text-3xl font-black text-white mt-2">
                Welcome back, {{ user.name }}!
              </h2>
              <p class="text-sm text-slate-300 mt-1">
                Logged in as <span class="text-yellow-400 font-extrabold">{{ user.name }}</span>. Ready to manage your online academy?
              </p>
            </div>
            <NuxtLink to="/dashboard" class="px-8 py-3.5 rounded-full text-sm font-black text-[#0c0919] bg-[#facc15] hover:bg-[#fde047] shadow-xl shadow-yellow-500/25 hover:scale-105 transition-all uppercase whitespace-nowrap">
              Open Dashboard &rarr;
            </NuxtLink>
          </div>

          <!-- Featured Courses Grid -->
          <section v-if="publicCourses && publicCourses.length > 0" class="pt-4">
            <div class="flex items-center justify-between mb-8 border-b border-purple-900/40 pb-4">
              <div>
                <h2 class="text-2xl sm:text-4xl font-black uppercase tracking-tight text-white">
                  Featured Masterclasses
                </h2>
                <p class="text-slate-400 text-xs sm:text-sm mt-1">
                  Explore top interactive masterclasses from world-class instructors.
                </p>
              </div>
              <NuxtLink to="/courses" class="text-xs sm:text-sm font-bold text-yellow-400 hover:text-yellow-300 uppercase tracking-wider">
                View All Catalog &rarr;
              </NuxtLink>
            </div>

            <AcademyCourseGrid :courses="publicCourses" :loading="isLoading" />
          </section>
        </div>
      </section>

      <!-- Cosmic Call to Action Banner -->
      <AcademyCtaSection />
    </div>
  </div>
</template>
