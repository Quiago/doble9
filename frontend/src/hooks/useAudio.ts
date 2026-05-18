// hooks/useAudio.ts — SFX + mute toggle (CLAUDE.md §4.5). AGENT: Frontend.
import { useUiStore } from "@/store/uiStore";
import { audio } from "@/audio/AudioEngine";

export function useAudio() {
  const enabled = useUiStore((s) => s.audioEnabled);
  const toggleAudio = useUiStore((s) => s.toggleAudio);

  return {
    enabled,
    toggle: toggleAudio,
    /** UI click feedback for buttons/cards. */
    click: () => audio.click(),
  };
}
