import { browser } from '$app/environment';
import { initializeDB } from '$lib/client/db';

export const ssr = false;

export async function load() {
  if (browser) {
    console.info('Initializing database in browser environment');
    try {
      await initializeDB();
      console.info('Database initialization completed');
    } catch (error) {
      console.error('Failed to initialize database:', error);
    }
  }
  return {};
} 
