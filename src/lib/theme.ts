export function setMode(mode: 'day' | 'night'): void {
  const root = document.documentElement;
  if (mode === 'day') {
    root.classList.add('day');
    root.classList.remove('night');
  } else {
    root.classList.add('night');
    root.classList.remove('day');
  }
}