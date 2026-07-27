import { browser } from '$app/environment';

class ThemeState {
  current = $state<'light' | 'dark'>('dark');

  constructor() {
    if (browser) {
      const saved = localStorage.getItem('theme') as 'light' | 'dark' | null;
      if (saved) {
        this.current = saved;
      } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        this.current = prefersDark ? 'dark' : 'light';
      }
      this.apply();
    }
  }

  toggle() {
    this.current = this.current === 'dark' ? 'light' : 'dark';
    if (browser) {
      localStorage.setItem('theme', this.current);
      this.apply();
    }
  }

  apply() {
    if (!browser) return;
    const root = document.documentElement;
    if (this.current === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }
}

export const theme = new ThemeState();
