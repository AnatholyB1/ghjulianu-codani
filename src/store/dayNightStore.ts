import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { dayNightBroadcastChannel } from '@/lib/broadcastChannel';

interface DayNightState {
  mode: 'day' | 'night';
  setMode: (mode: 'day' | 'night') => void;
  toggleMode: () => void;
}

export const useDayNightStore = create<DayNightState>()(
  persist(
    (set, get) => ({
      mode: 'night',
      setMode: (mode) => {
        set({ mode });
        // Broadcast the change to other tabs
        dayNightBroadcastChannel.send('DAY_NIGHT_UPDATE', { mode });
      },
      toggleMode: () => {
        const newMode = get().mode === 'day' ? 'night' : 'day';
        set({ mode: newMode });
        dayNightBroadcastChannel.send('DAY_NIGHT_UPDATE', { mode: newMode });
      },
    }),
    {
      name: 'day-night-storage',
      getStorage: () => localStorage,
    }
  )
);

// Subscribe to broadcast channel to receive updates from other tabs
dayNightBroadcastChannel.subscribe('DAY_NIGHT_UPDATE', ({ mode }) => {
  // Only update if the mode is different to avoid loops
  useDayNightStore.getState().mode !== mode && useDayNightStore.getState().setMode(mode);
});
