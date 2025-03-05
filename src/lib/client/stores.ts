import { writable } from 'svelte/store';

export interface User {
  id: string;
  username: string;
  age: number;
}

export const users = writable<User[]>([]); 
