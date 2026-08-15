<script setup lang="ts">
definePageMeta({
  layout: 'auth',
  middleware: 'guest'
})

const {
  login,
  loading,
  error
} = useAuth()

const email = ref('')
const password = ref('')

const localError = ref('')

async function submit() {
  localError.value = ''

  if (!email.value.trim()) {
    localError.value = 'Please enter your email address.'
    return
  }

  if (!password.value) {
    localError.value = 'Please enter your password.'
    return
  }

  try {
    await login(
      email.value,
      password.value
    )

    await navigateTo('/dashboard')
  } catch {
    // Error is handled by useAuth()
  }
}
</script>

<template>
  <div class="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-8 shadow-2xl shadow-indigo-950/20">
    <div class="mb-6 text-center">
      <h1 class="text-2xl font-bold tracking-tight text-white mb-2">
        Welcome back
      </h1>
      <p class="text-sm text-slate-400">
        Log in to manage your online academy.
      </p>
    </div>

    <form @submit.prevent="submit" class="space-y-4">
      <div>
        <label for="email" class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
          Email Address
        </label>
        <input
          id="email"
          v-model="email"
          type="email"
          autocomplete="email"
          placeholder="john@example.com"
          class="w-full px-4 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm"
        />
      </div>

      <div>
        <label for="password" class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
          Password
        </label>
        <input
          id="password"
          v-model="password"
          type="password"
          autocomplete="current-password"
          placeholder="Your password"
          class="w-full px-4 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm"
        />
      </div>

      <div v-if="localError || error" class="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs font-medium">
        {{ localError || error }}
      </div>

      <button
        type="submit"
        :disabled="loading"
        class="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/25 transition-all transform active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2 mt-2"
      >
        <svg v-if="loading" class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>{{ loading ? 'Logging in...' : 'Log In' }}</span>
      </button>
    </form>

    <div class="mt-6 text-center text-xs text-slate-400">
      Don't have an account?
      <NuxtLink to="/signup" class="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors ml-1">
        Create one
      </NuxtLink>
    </div>
  </div>
</template>
