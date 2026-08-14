import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  app: {
    pageTransition: false,
    layoutTransition: false
  },
  css: ['~/assets/css/main.css'],
  routeRules: {
    '/api/**': { proxy: `${process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:8080'}/api/**` }
  },
  devServer: {
    port: 3000,
    host: 'localhost'
  },
  vite: {
    plugins: [
      tailwindcss()
    ],
    server: {
      allowedHosts: true,
      ws: {
        protocol: 'ws',
        host: 'localhost',
        port: 3000
      }
    }
  },
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:8080'
    }
  }
})
