import { writable } from 'svelte/store';
import { browser } from '$app/environment';

type Theme = 'light' | 'dark';

function createThemeStore() {
  // Check for saved theme preference or default to 'light'
  const storedTheme = browser ? localStorage.getItem('theme') as Theme : 'light';
  const prefersDark = browser ? window.matchMedia('(prefers-color-scheme: dark)').matches : false;
  const initialTheme = storedTheme || (prefersDark ? 'dark' : 'light');
  
  const { subscribe, set, update } = writable<Theme>(initialTheme);
  
  return {
    subscribe,
    toggle: () => {
      update(theme => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        if (browser) {
          localStorage.setItem('theme', newTheme);
          document.documentElement.classList.toggle('dark', newTheme === 'dark');
        }
        return newTheme;
      });
    },
    set: (theme: Theme) => {
      set(theme);
      if (browser) {
        localStorage.setItem('theme', theme);
        document.documentElement.classList.toggle('dark', theme === 'dark');
      }
    },
    init: () => {
      if (browser) {
        document.documentElement.classList.toggle('dark', initialTheme === 'dark');
      }
    }
  };
}

export const theme = createThemeStore();