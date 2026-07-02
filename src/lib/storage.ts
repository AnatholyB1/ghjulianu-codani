/**
 * Utility functions for localStorage operations with error handling.
 */

/**
 * Safely get an item from localStorage.
 * @param key - The key of the item to retrieve.
 * @returns The parsed value or null if not found or on error.
 */
export function getItem<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const item = window.localStorage.getItem(key);
    return item ? (JSON.parse(item) as T) : null;
  } catch (error) {
    console.warn(`Error reading localStorage key "${key}":`, error);
    return null;
  }
}

/**
 * Safely set an item in localStorage.
 * @param key - The key to store the item under.
 * @param value - The value to store (will be JSON.stringified).
 * @returns true if successful, false otherwise.
 */
export function setItem<T>(key: string, value: T): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const serialized = JSON.stringify(value);
    window.localStorage.setItem(key, serialized);
    return true;
  } catch (error) {
    console.warn(`Error setting localStorage key "${key}":`, error);
    return false;
  }
}

/**
 * Safely remove an item from localStorage.
 * @param key - The key of the item to remove.
 * @returns true if successful, false otherwise.
 */
export function removeItem(key: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    window.localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.warn(`Error removing localStorage key "${key}":`, error);
    return false;
  }
}

/**
 * Safely clear all items from localStorage.
 * @returns true if successful, false otherwise.
 */
export function clear(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    window.localStorage.clear();
    return true;
  } catch (error) {
    console.warn('Error clearing localStorage:', error);
    return false;
  }
}
