// store/uiStore.ts — transient client-only UI state (never sent to server).
// AGENT: Frontend.
import { create } from "zustand";
import type { SpecialPlayType, Seat } from "@shared/game";

export type ConnStatus = "connecting" | "online" | "offline" | "reconnecting";

export interface Toast {
  id: string;
  message: string;
  variant: "info" | "success" | "error";
}

/** Drives the React overlay above the Phaser canvas (Pollona/Capicúa). */
export interface SpecialFx {
  type: SpecialPlayType;
  bySeat: Seat;
  key: number;
}

interface UiSlice {
  conn: ConnStatus;
  audioEnabled: boolean;
  toasts: Toast[];
  specialFx: SpecialFx | null;

  setConn: (c: ConnStatus) => void;
  toggleAudio: () => void;
  toast: (message: string, variant?: Toast["variant"]) => void;
  dismissToast: (id: string) => void;
  triggerSpecialFx: (type: SpecialPlayType, bySeat: Seat) => void;
  clearSpecialFx: () => void;
}

export const useUiStore = create<UiSlice>((set, get) => ({
  conn: "connecting",
  audioEnabled: true,
  toasts: [],
  specialFx: null,

  setConn: (conn) => set({ conn }),

  toggleAudio: () => set((s) => ({ audioEnabled: !s.audioEnabled })),

  toast: (message, variant = "info") => {
    const id = crypto.randomUUID();
    set((s) => ({ toasts: [...s.toasts, { id, message, variant }] }));
    setTimeout(() => get().dismissToast(id), 3000);
  },

  dismissToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  triggerSpecialFx: (type, bySeat) =>
    set({ specialFx: { type, bySeat, key: Date.now() } }),

  clearSpecialFx: () => set({ specialFx: null }),
}));
