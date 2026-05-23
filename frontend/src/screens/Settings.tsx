// screens/Settings.tsx — (9) Settings. From design-reference/profile-settings.jsx.
// AGENT: Frontend. SFX toggle is wired to the audio engine; rest is local UI
// until a settings endpoint exists.
import { useState } from "react";
import type { ReactNode } from "react";
import {
  ScreenWrap,
  NavHeader,
  Panel,
  Divider,
  GoldBtn,
  GhostBtn,
  RedBtn,
} from "@/components";
import { useGameNav } from "@/lib/nav";
import { useAudio, useAuth } from "@/hooks";
import { dlog } from "@/lib/debug";

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      className={`s-set__toggle${on ? " is-on" : ""}`}
      onClick={() => onChange(!on)}
      aria-pressed={on}
    >
      <span className="s-set__knob" />
    </button>
  );
}

function Slider({
  val,
  onChange,
  label,
}: {
  val: number;
  onChange: (v: number) => void;
  label: string;
}) {
  return (
    <div className="s-set__slider">
      <span className="s-set__slider-l">{label}</span>
      <input
        type="range"
        min={0}
        max={100}
        value={val}
        onChange={(e) => onChange(Number(e.target.value))}
        className="s-set__range"
      />
      <span className="s-set__slider-v">{val}%</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Panel className="s-set__section">
      <div className="s-set__section-h">{title}</div>
      <div className="s-set__rows">{children}</div>
    </Panel>
  );
}

function Row({ label, sub, right }: { label: string; sub?: string; right: ReactNode }) {
  return (
    <div className="s-set__row">
      <div>
        <div className="s-set__row-l">{label}</div>
        {sub && <div className="s-set__row-s">{sub}</div>}
      </div>
      {right}
    </div>
  );
}

const QUALITIES = ["baja", "media", "alta"] as const;
const TABLES: Array<[string, string]> = [
  ["madera", "🪵"],
  ["fieltro", "🟩"],
  ["mármol", "🪨"],
];

export default function Settings() {
  const go = useGameNav();
  const { enabled: sfxEnabled, toggle: toggleSfx } = useAudio();
  const { logout } = useAuth();

  const [music, setMusic] = useState(70);
  const [sfx, setSfx] = useState(85);
  const [anim, setAnim] = useState(true);
  const [notifs, setNotifs] = useState(true);
  const [quality, setQuality] = useState<(typeof QUALITIES)[number]>("alta");
  const [table, setTable] = useState("madera");
  const [lang, setLang] = useState("es");

  const onLogout = () => {
    dlog("ui", "settings logout");
    logout();
    go("landing");
  };

  return (
    <ScreenWrap>
      <NavHeader title="CONFIGURACIÓN" onBack={() => go("menu")} />
      <div className="s-set__body">
        <Section title="🔊 Audio">
          <Slider val={music} onChange={setMusic} label="Música" />
          <Slider val={sfx} onChange={setSfx} label="Efectos" />
          <Row
            label="Sonidos de fichas"
            sub="Clic al colocar fichas"
            right={<Toggle on={sfxEnabled} onChange={toggleSfx} />}
          />
        </Section>

        <Section title="🎨 Visual">
          <Row
            label="Calidad gráfica"
            right={
              <div className="s-set__pills">
                {QUALITIES.map((q) => (
                  <button
                    key={q}
                    className={`s-set__pill${quality === q ? " is-active" : ""}`}
                    onClick={() => setQuality(q)}
                  >
                    {q}
                  </button>
                ))}
              </div>
            }
          />
          <Row
            label="Animaciones"
            sub="Efectos especiales y transiciones"
            right={<Toggle on={anim} onChange={setAnim} />}
          />
          <Row
            label="Mesa de juego"
            right={
              <div className="s-set__pills">
                {TABLES.map(([id, icon]) => (
                  <button
                    key={id}
                    className={`s-set__pill s-set__pill--icon${table === id ? " is-active" : ""}`}
                    onClick={() => setTable(id)}
                  >
                    {icon} {id}
                  </button>
                ))}
              </div>
            }
          />
        </Section>

        <Section title="🔔 Notificaciones">
          <Row
            label="Notificaciones push"
            sub="Alertas cuando te inviten a jugar"
            right={<Toggle on={notifs} onChange={setNotifs} />}
          />
          <Row
            label="Turno en partidas activas"
            sub="Recuerda cuando sea tu turno"
            right={<Toggle on onChange={() => {}} />}
          />
          <Row label="Resultados de torneos" right={<Toggle on onChange={() => {}} />} />
        </Section>

        <Section title="👤 Cuenta">
          <Row
            label="Idioma"
            right={
              <select
                className="s-set__select"
                value={lang}
                onChange={(e) => setLang(e.target.value)}
              >
                <option value="es">Español</option>
                <option value="en">English</option>
                <option value="pt">Português</option>
              </select>
            }
          />
          <Row label="Nombre de usuario" sub="@jugador_pro" right={<GhostBtn size="sm">CAMBIAR</GhostBtn>} />
          <Divider gold />
          <Row label="Cerrar sesión" right={<RedBtn size="sm" onClick={onLogout}>SALIR</RedBtn>} />
          <Row
            label="Eliminar cuenta"
            sub="Esta acción no se puede deshacer"
            right={<RedBtn size="sm">ELIMINAR</RedBtn>}
          />
        </Section>

        <div className="s-set__save">
          <GoldBtn fullWidth onClick={() => go("menu")}>GUARDAR CAMBIOS</GoldBtn>
        </div>
      </div>
    </ScreenWrap>
  );
}
