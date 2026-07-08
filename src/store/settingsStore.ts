import { create } from 'zustand'

interface SettingsStore {
  hourHeight: number
  setHourHeight: (height: number) => void
  resetSettings: () => void
}

const DEFAULT_HOUR_HEIGHT = 180

export const useSettingsStore = create<SettingsStore>((set) => ({
  hourHeight: DEFAULT_HOUR_HEIGHT,

  setHourHeight: (height) => {
    const clamped = Math.max(60, Math.min(300, height))
    set({ hourHeight: clamped })
    localStorage.setItem('schedule-hour-height', String(clamped))
  },

  resetSettings: () => {
    set({ hourHeight: DEFAULT_HOUR_HEIGHT })
    localStorage.removeItem('schedule-hour-height')
  },
}))

export function loadSettings() {
  const savedHeight = localStorage.getItem('schedule-hour-height')
  if (savedHeight) {
    useSettingsStore.getState().setHourHeight(parseInt(savedHeight, 10))
  }
}