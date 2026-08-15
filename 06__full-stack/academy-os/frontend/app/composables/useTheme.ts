import { ref } from 'vue'

export function useTheme() {
  const theme = ref<'dark' | 'light'>('dark')

  function initTheme() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('academy_theme') as 'dark' | 'light' | null
      if (saved) {
        theme.value = saved
      } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        theme.value = 'light'
      } else {
        theme.value = 'dark'
      }
      applyTheme(theme.value)
    }
  }

  function toggleTheme() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
    applyTheme(theme.value)
  }

  function applyTheme(newTheme: 'dark' | 'light') {
    if (typeof window !== 'undefined') {
      document.documentElement.setAttribute('data-theme', newTheme)
      localStorage.setItem('academy_theme', newTheme)
    }
  }

  return {
    theme,
    initTheme,
    toggleTheme
  }
}
