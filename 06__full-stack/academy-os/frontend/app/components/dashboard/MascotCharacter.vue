<script setup lang="ts">
import { onMounted, ref } from 'vue'
import gsap from 'gsap'

const mascotRef = ref<HTMLElement | null>(null)

onMounted(() => {
  if (mascotRef.value) {
    // Floating idle animation
    gsap.to(mascotRef.value, {
      y: -10,
      rotate: 1.5,
      duration: 2.2,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    })
  }
})
</script>

<template>
  <div ref="mascotRef" class="relative w-32 h-36 sm:w-40 sm:h-44 pointer-events-none select-none flex items-center justify-center">
    <!-- SVG Animated Mascot Character -->
    <svg viewBox="0 0 200 220" class="w-full h-full drop-shadow-[0_15px_20px_rgba(0,102,255,0.3)]" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- Horns -->
      <path d="M55 45 C45 20 25 15 35 40 Z" fill="#ff9900" stroke="#cc7a00" stroke-width="3" />
      <path d="M145 45 C155 20 175 15 165 40 Z" fill="#ff9900" stroke="#cc7a00" stroke-width="3" />

      <!-- Head & Body (Teal/Turquoise Monster) -->
      <path d="M35 80 C35 35 165 35 165 80 C165 140 155 170 140 180 C110 190 90 190 60 180 C45 170 35 140 35 80 Z" fill="#00c9b7" stroke="#009688" stroke-width="4" />
      
      <!-- Head Tuft Hair -->
      <path d="M90 36 C95 15 105 15 110 36 Z" fill="#00c9b7" stroke="#009688" stroke-width="3" />
      <path d="M80 40 C75 25 85 20 90 40 Z" fill="#00c9b7" stroke="#009688" stroke-width="3" />

      <!-- Big Goggles / Glasses Frame -->
      <rect x="38" y="65" width="56" height="52" rx="16" fill="#1e1b4b" stroke="#f43f5e" stroke-width="5" />
      <rect x="106" y="65" width="56" height="52" rx="16" fill="#1e1b4b" stroke="#f43f5e" stroke-width="5" />
      <line x1="94" y1="91" x2="106" y2="91" stroke="#f43f5e" stroke-width="5" />

      <!-- Big Eyes -->
      <circle cx="66" cy="91" r="20" fill="white" />
      <circle cx="66" cy="91" r="10" fill="#0f172a" />
      <circle cx="70" cy="87" r="4" fill="white" />

      <circle cx="134" cy="91" r="20" fill="white" />
      <circle cx="134" cy="91" r="10" fill="#0f172a" />
      <circle cx="138" cy="87" r="4" fill="white" />

      <!-- Cute Smile -->
      <path d="M85 130 Q100 142 115 130" stroke="#0f172a" stroke-width="4" stroke-linecap="round" fill="none" />
      <path d="M72 128 C65 128 65 136 72 136 Z" fill="#ff4d8d" opacity="0.6" />
      <path d="M128 128 C135 128 135 136 128 136 Z" fill="#ff4d8d" opacity="0.6" />

      <!-- Cute Little Legs -->
      <rect x="75" y="176" width="14" height="28" rx="7" fill="#00a896" />
      <rect x="111" y="176" width="14" height="28" rx="7" fill="#00a896" />
      <ellipse cx="82" cy="204" rx="12" ry="6" fill="#f43f5e" />
      <ellipse cx="118" cy="204" rx="12" ry="6" fill="#f43f5e" />

      <!-- Holding Red Book / Notebook -->
      <rect x="118" y="125" width="40" height="48" rx="6" fill="#e11d48" stroke="#9f1239" stroke-width="3" transform="rotate(-12 138 149)" />
      <line x1="126" y1="135" x2="150" y2="130" stroke="white" stroke-width="3" stroke-linecap="round" />
      <line x1="124" y1="145" x2="148" y2="140" stroke="white" stroke-width="3" stroke-linecap="round" />
    </svg>
  </div>
</template>
