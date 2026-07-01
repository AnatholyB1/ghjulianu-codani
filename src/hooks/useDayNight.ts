import { useDayNightStore } from '@/store/dayNightStore';

export const useDayNight = () => {
  const { mode, setMode, toggleMode } = useDayNightStore();

  return {
    mode,
    setMode,
    toggleMode,
  };
};
