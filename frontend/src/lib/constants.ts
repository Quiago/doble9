// lib/constants.ts — static UI constants (recreated from shared.jsx).
// AGENT: Frontend. Asset paths are absolute (Vite serves /public).
export const ASSETS = {
  wood: "/assets/wood-texture.png",
  manolitoWave: "/assets/manolito-waving.png",
  manolitoHold: "/assets/manolito-holding-tile.png",
  manolitoSurp: "/assets/manolito-surprised.png",
  pollona: "/assets/pollona-greenscreen.png",
  logoGreen: "/assets/logo-greenscreen.png",
  goldRing: "/assets/gold-ring-frame.png",
  tableTop: "/assets/table-top.png",
} as const;

export interface AvatarMeta {
  name: string;
  color: string;
  initials: string;
}

/** Seat-indexed accent colors (GamePanels.jsx PLAYER_COLORS). */
export const PLAYER_COLORS = ["#3498DB", "#E91E63", "#D4AF37", "#F39C12"] as const;

export const PLAYER_AVATARS: AvatarMeta[] = [
  { name: "Luisito", color: "#3498DB", initials: "L" },
  { name: "Maritza", color: "#E91E63", initials: "M" },
  { name: "Yo", color: "#D4AF37", initials: "Y" },
  { name: "El Tigre", color: "#F39C12", initials: "T" },
];
