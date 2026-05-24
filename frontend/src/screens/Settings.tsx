// screens/Settings.tsx — (9) Settings. From design-reference/profile-settings.jsx.
// AGENT: Frontend. SFX toggle is wired to the audio engine; rest is local UI
// until a settings endpoint exists.
import { useState, useEffect } from "react";
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
import { useUserStore } from "@/store/userStore";
import { useUiStore } from "@/store/uiStore";
import { api } from "@/services/api";

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

function Row({ label, sub, right }: { label: string; sub?: string | ReactNode; right: ReactNode }) {
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
  const user = useUserStore((s) => s.user);
  const setUser = useUserStore((s) => s.setUser);
  const toast = useUiStore((s) => s.toast);

  const [music, setMusic] = useState(70);
  const [sfx, setSfx] = useState(85);
  const [anim, setAnim] = useState(true);
  const [notifs, setNotifs] = useState(true);
  const [quality, setQuality] = useState<(typeof QUALITIES)[number]>("alta");
  const [table, setTable] = useState("madera");
  const [lang, setLang] = useState("es");

  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [usernameInput, setUsernameInput] = useState("");
  const [saving, setSaving] = useState(false);

  // Initialize states when user settings are loaded
  useEffect(() => {
    if (user) {
      setUsernameInput(user.username);
      const settings = user.settings || {};
      if (settings.music !== undefined) setMusic(Number(settings.music));
      if (settings.sfx !== undefined) setSfx(Number(settings.sfx));
      if (settings.anim !== undefined) setAnim(Boolean(settings.anim));
      if (settings.notifs !== undefined) setNotifs(Boolean(settings.notifs));
      if (QUALITIES.includes(settings.quality as any)) {
        setQuality(settings.quality as any);
      }
      if (settings.table !== undefined) setTable(String(settings.table));
      if (settings.lang !== undefined) setLang(String(settings.lang));
    }
  }, [user]);

  const onLogout = () => {
    dlog("ui", "settings logout");
    logout();
    go("landing");
  };

  const onSave = async () => {
    setSaving(true);
    try {
      const updatedSettings = {
        music,
        sfx,
        anim,
        notifs,
        quality,
        table,
        lang,
      };

      const payload: { username?: string; settings: Record<string, unknown> } = {
        settings: updatedSettings,
      };

      if (usernameInput.trim() !== user?.username) {
        if (usernameInput.trim().length < 3) {
          toast("El nombre de usuario debe tener al menos 3 caracteres", "error");
          setSaving(false);
          return;
        }
        payload.username = usernameInput.trim();
      }

      const updatedUser = await api.updateMe(payload);
      setUser(updatedUser);
      toast("Configuración guardada correctamente", "success");
      go("menu");
    } catch (err: any) {
      console.error("Error saving settings", err);
      toast(err.message || "Error al guardar la configuración", "error");
    } finally {
      setSaving(false);
    }
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
          <Row
            label="Nombre de usuario"
            sub={isEditingUsername ? undefined : `@${user?.username || "jugador_pro"}`}
            right={
              isEditingUsername ? (
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <input
                    type="text"
                    className="s-set__input"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    autoFocus
                  />
                  <GhostBtn size="sm" onClick={() => setIsEditingUsername(false)}>
                    LISTO
                  </GhostBtn>
                </div>
              ) : (
                <GhostBtn size="sm" onClick={() => {
                  setUsernameInput(user?.username || "");
                  setIsEditingUsername(true);
                }}>
                  CAMBIAR
                </GhostBtn>
              )
            }
          />
          <Divider gold />
          <Row label="Cerrar sesión" right={<RedBtn size="sm" onClick={onLogout}>SALIR</RedBtn>} />
          <Row
            label="Eliminar cuenta"
            sub="Esta acción no se puede deshacer"
            right={<RedBtn size="sm">ELIMINAR</RedBtn>}
          />
        </Section>

        <div className="s-set__save">
          <GoldBtn fullWidth onClick={onSave} disabled={saving}>
            {saving ? "GUARDANDO..." : "GUARDAR CAMBIOS"}
          </GoldBtn>
        </div>
      </div>
    </ScreenWrap>
  );
}
