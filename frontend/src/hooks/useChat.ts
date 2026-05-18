// hooks/useChat.ts — match chat list + send (CLAUDE.md social). AGENT: Frontend.
import { useGameStore } from "@/store/gameStore";
import { useUserStore } from "@/store/userStore";
import { dispatcher } from "@/store/dispatcher";
import { A } from "@/store/types";

export function useChat() {
  const chat = useGameStore((s) => s.chat);
  const players = useGameStore((s) => s.game?.players ?? []);
  const meId = useUserStore((s) => s.user?.id) ?? "u-yo";

  const messages = chat.map((c) => ({
    seat: c.bySeat,
    name: players[c.bySeat]?.name ?? `P${c.bySeat + 1}`,
    text: c.message,
    timestamp: c.timestamp,
    isMe: c.userId === meId,
  }));

  return {
    messages,
    send: (message: string) => {
      const m = message.trim();
      if (m) dispatcher.dispatch({ type: A.SEND_CHAT, payload: { message: m } });
    },
  };
}
