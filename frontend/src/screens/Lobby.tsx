// screens/Lobby.tsx — (5) Multiplayer Lobby. From setup-lobby.jsx.
// AGENT: Frontend. Room data is mock until BE matchmaking is wired.
import { useState } from "react";
import { ScreenWrap, NavHeader, GoldBtn, GreenBtn, OnlineDot } from "@/components";
import { useGameNav } from "@/lib/nav";

interface Room {
  id: number;
  name: string;
  host: string;
  players: number;
  max: number;
  mode: string;
  pts: number;
  status: "waiting" | "playing";
  region: string;
}

const ROOMS: Room[] = [
  { id: 1, name: "Mesa de los campeones", host: "Luisito", players: 2, max: 4, mode: "Clásico", pts: 100, status: "waiting", region: "🇨🇺" },
  { id: 2, name: "Solo gente seria", host: "Maritza", players: 3, max: 4, mode: "Parejas", pts: 150, status: "waiting", region: "🇲🇽" },
  { id: 3, name: "Principiantes OK", host: "ElTigre", players: 1, max: 4, mode: "Clásico", pts: 50, status: "waiting", region: "🇺🇸" },
  { id: 4, name: "Rápido y al grano", host: "Pedro", players: 4, max: 4, mode: "Rápido", pts: 100, status: "playing", region: "🇵🇷" },
  { id: 5, name: "Amigos virtuales", host: "Carmen", players: 2, max: 4, mode: "Clásico", pts: 200, status: "waiting", region: "🇨🇺" },
];

const TABS: Array<[string, string]> = [
  ["public", "Salas Públicas"],
  ["friends", "Amigos"],
  ["mine", "Mis Salas"],
];

export default function Lobby() {
  const go = useGameNav();
  const [tab, setTab] = useState("public");
  const [search, setSearch] = useState("");

  const filtered = ROOMS.filter((r) =>
    tab === "public"
      ? r.name.toLowerCase().includes(search.toLowerCase())
      : false,
  );

  return (
    <ScreenWrap>
      <NavHeader
        title="MULTIJUGADOR"
        onBack={() => go("menu")}
        right={
          <GoldBtn size="sm" onClick={() => go("game")}>
            CREAR SALA
          </GoldBtn>
        }
      />
      <div className="s-lobby__body">
        <div className="s-lobby__search-row">
          <div className="s-lobby__search">
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden>
              <circle cx="6.5" cy="6.5" r="5" stroke="#F7F1E3" strokeWidth="1.5" />
              <path d="M10 10L13 13" stroke="#F7F1E3" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input
              className="s-lobby__input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar sala…"
            />
          </div>
          <OnlineDot label="384 salas activas" />
        </div>

        <div className="s-lobby__tabs">
          {TABS.map(([id, label]) => (
            <button
              key={id}
              className={`s-lobby__tab${tab === id ? " is-active" : ""}`}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="s-lobby__list">
          {filtered.length === 0 && (
            <div className="s-lobby__empty">
              {tab === "public"
                ? "No se encontraron salas"
                : "Sin resultados aquí"}
            </div>
          )}
          {filtered.map((room) => (
            <div
              key={room.id}
              className={`s-lobby__room${room.status === "waiting" ? " s-lobby__room--open" : ""}`}
            >
              <div className="s-lobby__region">{room.region}</div>
              <div className="s-lobby__rinfo">
                <div className="s-lobby__rname">{room.name}</div>
                <div className="s-lobby__rhost">
                  Creador: <span>{room.host}</span>
                </div>
              </div>
              <div className="s-lobby__rmeta">
                <div className="s-lobby__rmode">{room.mode}</div>
                <div className="s-lobby__rpts">{room.pts} pts</div>
              </div>
              <div className="s-lobby__seats">
                {Array.from({ length: room.max }).map((_, i) => (
                  <div
                    key={i}
                    className={
                      "s-lobby__seat" +
                      (i < room.players
                        ? i === 0
                          ? " s-lobby__seat--host"
                          : " s-lobby__seat--filled"
                        : "")
                    }
                  />
                ))}
              </div>
              <div>
                {room.status === "waiting" ? (
                  <GreenBtn size="sm" onClick={() => go("game")}>
                    UNIRSE
                  </GreenBtn>
                ) : (
                  <div className="s-lobby__playing">EN CURSO</div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="s-lobby__quick">
          <div>
            <div className="s-lobby__quick-t">¿Quieres jugar ya?</div>
            <div className="s-lobby__quick-s">
              Únete a la mejor sala disponible automáticamente
            </div>
          </div>
          <GreenBtn size="md" onClick={() => go("game")}>
            UNIRME RÁPIDO
          </GreenBtn>
        </div>
      </div>
    </ScreenWrap>
  );
}
