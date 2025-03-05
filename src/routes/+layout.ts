import { browser } from '$app/environment';
import { initializeDB } from '$lib/client/db';

export const ssr = false;

export async function load() {
  if (browser) {
    try {
      await initializeDB();
      console.log('Database initialized in layout.ts');
    } catch (error) {
      console.error('Failed to initialize database:', error);
    }
  }
  return {};
} 
