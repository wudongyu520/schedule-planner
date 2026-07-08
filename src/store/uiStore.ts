import { create } from 'zustand'

export interface ContextMenuState {
  menuId: string | null
  openMenu: (id: string) => void
  closeMenu: () => void
  closeSpecificMenu: (id: string) => void
}

export const useUIStore = create<ContextMenuState>((set) => ({
  menuId: null,

  openMenu: (id) => set({ menuId: id }),

  closeMenu: () => set({ menuId: null }),

  closeSpecificMenu: (id) => set((state) => ({
    menuId: state.menuId === id ? null : state.menuId,
  })),
}))