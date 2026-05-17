// components/organisms/ChatPanel.tsx — From GamePanels.jsx ChatPanel.
// AGENT: Frontend. Sending dispatches A.SEND_CHAT (server-authoritative echo).
import { useState, type FormEvent } from "react";
import { PLAYER_COLORS } from "@/lib/constants";
import { dispatcher } from "@/store/dispatcher";
import { A } from "@/store/types";

export interface ChatMsg {
  seat: number;
  name: string;
  text: string;
  time: string;
  isMe: boolean;
}

interface ChatPanelProps {
  messages: ChatMsg[];
}

export function ChatPanel({ messages }: ChatPanelProps) {
  const [draft, setDraft] = useState("");

  const send = (e: FormEvent) => {
    e.preventDefault();
    const message = draft.trim();
    if (!message) return;
    dispatcher.dispatch({ type: A.SEND_CHAT, payload: { message } });
    setDraft("");
  };

  return (
    <div className="c-gp c-chat">
      <div className="c-gp__h">Chat</div>
      <div className="c-chat__body">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`c-chat__msg${m.isMe ? " c-chat__msg--me" : ""}`}
          >
            <div className="c-chat__meta">
              <span
                className="c-chat__author"
                style={{ color: PLAYER_COLORS[m.seat % 4] }}
              >
                {m.name}
              </span>
              <span className="c-chat__time">{m.time}</span>
            </div>
            <div className="c-chat__bubble">{m.text}</div>
          </div>
        ))}
      </div>
      <form className="c-chat__input" onSubmit={send}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Escribe un mensaje..."
          maxLength={240}
        />
        <button type="submit" aria-label="Enviar" style={{ opacity: 0.5 }}>
          😄
        </button>
      </form>
    </div>
  );
}
