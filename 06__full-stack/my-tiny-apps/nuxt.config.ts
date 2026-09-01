import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2026-08-24',

  telemetry: false,

  devtools: { enabled: true },

  app: {
    head: {
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' },
      ],
    },
  },

  runtimeConfig: {
    tursoDatabaseUrl: process.env.TURSO_DATABASE_URL || '',
    tursoAuthToken: process.env.TURSO_AUTH_TOKEN || '',
    paddleApiKey: process.env.PADDLE_API_KEY || '',
    paddleWebhookSecret: process.env.PADDLE_WEBHOOK_SECRET || '',
    public: {
      paddleClientToken: process.env.PADDLE_CLIENT_TOKEN || '',
      paddleEnvironment: (process.env.PADDLE_ENVIRONMENT || 'sandbox') as 'sandbox' | 'production',
    },
  },

  modules: [
    '@nuxtjs/color-mode',
    '@nuxt/eslint',
    '@nuxt/icon',
    '@nuxt/image',
  ],

  css: ['~/assets/css/main.css'],

  vite: {
    plugins: [tailwindcss()],
  },

  components: [
    {
      path: '~/components',
      pathPrefix: false,
    },
  ],

  colorMode: {
    classSuffix: '',
    dataValue: 'theme',
  },
})