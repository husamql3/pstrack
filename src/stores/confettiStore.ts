import { create } from 'zustand'

type ConfettiStore = {
  triggerConfetti: () => void
  setTriggerConfetti: (trigger: () => void) => void
}

export const useConfettiStore = create<ConfettiStore>((set) => ({
  triggerConfetti: () => {},
  setTriggerConfetti: (trigger) => set({ triggerConfetti: trigger }),
}))
