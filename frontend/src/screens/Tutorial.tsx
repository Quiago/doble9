// screens/Tutorial.tsx — (7) Tutorial. From design-reference/tutorial.jsx.
// AGENT: Frontend. 10 static steps; pure UI, no backend.
import { useState } from "react";
import { useParams } from "react-router-dom";
import {
  ScreenWrap,
  NavHeader,
  Panel,
  GoldBtn,
  GhostBtn,
  ChromaImg,
  DominoTile,
} from "@/components";
import { ASSETS } from "@/lib/constants";
import { useGameNav } from "@/lib/nav";
import { dlog } from "@/lib/debug";

type Visual =
  | "overview" | "tiles" | "deal" | "start" | "play"
  | "pass" | "capicua" | "pollona" | "score" | "ready";

interface Step {
  title: string;
  body: string;
  tip: string;
  visual: Visual;
}

const STEPS: Step[] = [
  { title: "¿Qué es el Dominó Cubano?", body: "El dominó cubano es un juego de mesa para 4 jugadores donde se usan fichas con dos mitades numeradas. El objetivo es quedar sin fichas o acumular la menor puntuación posible. ¡Es rápido, estratégico y muy divertido!", tip: "¡La mesa es donde nace la amistad y la rivalidad!", visual: "overview" },
  { title: "Las Fichas del Doble 9", body: 'El juego usa 55 fichas con valores del 0 al 9. Cada ficha tiene dos mitades con un número cada una. Las fichas "dobles" (0-0, 1-1... 9-9) tienen el mismo número en ambas mitades y son especialmente poderosas.', tip: "El Doble 9 es la ficha más alta y quien la tenga ¡comienza la partida!", visual: "tiles" },
  { title: "Preparando la Partida", body: 'Las 55 fichas se mezclan boca abajo y cada jugador toma 10. Las 15 fichas restantes forman el "boneyard" (cementerio). Coloca tus fichas de pie para que solo tú las veas.', tip: "Nunca muestres tus fichas. ¡El secreto es parte de la estrategia!", visual: "deal" },
  { title: "¿Quién Comienza?", body: "El jugador que tenga el doble más alto (generalmente el 9-9) coloca su ficha primero. Si nadie tiene dobles, comienza quien tenga la ficha más alta. Desde ahí se juega en sentido de las agujas del reloj.", tip: "¡El Doble 9 es el rey de la mesa! Quien lo tenga parte con ventaja.", visual: "start" },
  { title: "Cómo Jugar una Ficha", body: "En tu turno debes colocar una ficha cuyos extremos coincidan con alguno de los números libres en los extremos de la cadena. Arrastra tu ficha al extremo que corresponda. Si no puedes jugar, debes robar del boneyard.", tip: "Las fichas se pueden girar 180° para adaptarlas — explora las dos posiciones.", visual: "play" },
  { title: "Pasar el Turno", body: "Si el boneyard está vacío y no puedes jugar ninguna ficha, debes pasar tu turno. El juego continúa con el siguiente jugador. ¡Pasar demasiado puede costarte la partida!", tip: "Guardar fichas versátiles (las que pegan en muchos lados) es clave para no pasar.", visual: "pass" },
  { title: "La Capicúa ✦", body: "La capicúa ocurre cuando juegas la última ficha y ambos extremos de la cadena coinciden con tus números. Es un cierre perfecto que vale el doble de puntos — ¡una jugada de maestro!", tip: "¡La capicúa es la jugada más elegante del dominó. Planifícala con cuidado!", visual: "capicua" },
  { title: "¡Pollonaaaa! 🐔", body: "La Pollona ocurre cuando un jugador gana sin haber jugado ni una sola ficha (su equipo las jugó todas). Es la victoria más vergonzosa para el rival — ¡y la más celebrada en la mesa!", tip: "¡Cuidado con la Pollona! Manolito y su gallina aparecen para celebrarla.", visual: "pollona" },
  { title: "Contando los Puntos", body: "La ronda termina cuando alguien juega todas sus fichas o nadie puede mover. Los perdedores suman el valor de sus fichas restantes. El ganador va acumulando esa puntuación. ¡Llega a 100 puntos para ganar la partida!", tip: "Vaciarte de fichas altas rápido reduce tu riesgo de sumar puntos al rival.", visual: "score" },
  { title: "¡A La Mesa!", body: "¡Ya conoces todo lo que necesitas para jugar! Recuerda: el dominó cubano es pasión, estrategia y mucha diversión. Cada partida es única. ¡Que comience el juego!", tip: "¡La mesa ya no tiene fronteras! Juega con gente de todo el mundo.", visual: "ready" },
];

const SCORE_ROWS: Array<[string, string, string]> = [
  ["Luisito", "43 pts", "#3498DB"],
  ["Maritza", "28 pts", "#E91E63"],
  ["Yo — GANADOR", "0 pts", "#D4AF37"],
  ["El Tigre", "19 pts", "#F39C12"],
];

function TutorialVisual({ type, step }: { type: Visual; step: number }) {
  if (type === "tiles")
    return (
      <div className="s-tut__tiles">
        {([[9, 9], [0, 0], [5, 3], [7, 2], [4, 8], [1, 6]] as const).map((t, i) => (
          <DominoTile key={i} left={t[0]} right={t[1]} orientation="vertical" size={38} />
        ))}
      </div>
    );

  if (type === "play")
    return (
      <div className="s-tut__vcol">
        <div className="s-tut__chain">
          {([[2, 4], [4, 4], [4, 7], [7, 3]] as const).map((t, i) => (
            <DominoTile key={i} left={t[0]} right={t[1]} orientation="horizontal" size={34} />
          ))}
        </div>
        <div className="s-tut__ends">
          <span className="s-tut__end s-tut__end--green">← extremo: 2</span>
          <span className="s-tut__end s-tut__end--gold">extremo: 3 →</span>
        </div>
      </div>
    );

  if (type === "capicua")
    return (
      <div className="s-tut__vcol">
        <div className="s-tut__chain">
          {([[5, 3], [3, 1], [1, 7], [7, 5]] as const).map((t, i) => (
            <DominoTile
              key={i}
              left={t[0]}
              right={t[1]}
              orientation="horizontal"
              size={32}
              style={i === 0 || i === 3 ? { filter: "drop-shadow(0 0 6px rgba(212,175,55,0.7))" } : undefined}
            />
          ))}
        </div>
        <span className="s-tut__tag">✦ CAPICÚA — DOBLE PUNTOS</span>
      </div>
    );

  if (type === "pollona")
    return (
      <div className="s-tut__vcol">
        <ChromaImg className="s-tut__pollona" src={ASSETS.pollona} alt="Pollona" />
        <div className="s-tut__pollona-txt">¡POLLONAAAA!</div>
      </div>
    );

  if (type === "score")
    return (
      <div className="s-tut__score">
        {SCORE_ROWS.map(([name, pts, col]) => {
          const winner = name.includes("GANADOR");
          return (
            <div key={name} className={`s-tut__srow${winner ? " s-tut__srow--win" : ""}`}>
              <span className="s-tut__sname">
                <span className="s-tut__sdot" style={{ background: col }} />
                {name}
              </span>
              <span className="s-tut__spts" style={winner ? { color: "var(--dorado)" } : undefined}>
                {pts}
              </span>
            </div>
          );
        })}
      </div>
    );

  if (type === "ready")
    return (
      <div className="s-tut__vcol">
        <ChromaImg className="s-tut__ready" src={ASSETS.manolitoWave} alt="Manolito" />
        <div className="s-tut__ready-txt">¡Estás listo para jugar!</div>
      </div>
    );

  // Default diagram (overview / deal / start / pass).
  return (
    <div className="s-tut__tiles">
      {([[step + 1, step % 5], [step % 4, step + 2], [step % 3, step + 1]] as const).map((t, i) => (
        <DominoTile key={i} left={t[0] % 10} right={t[1] % 10} orientation="vertical" size={44} />
      ))}
    </div>
  );
}

export default function Tutorial() {
  const go = useGameNav();
  const { level } = useParams();
  const start = Math.min(Math.max((Number(level) || 1) - 1, 0), STEPS.length - 1);
  const [step, setStep] = useState(start);
  const total = STEPS.length;
  const cur = STEPS[step];
  const isLast = step === total - 1;

  const goStep = (n: number) => {
    dlog("ui", `tutorial step=${n + 1}/${total}`);
    setStep(n);
  };

  return (
    <ScreenWrap className="s-tut s-wood">
      <div className="s-tut__dim" />
      <NavHeader
        title={`TUTORIAL — PASO ${step + 1} DE ${total}`}
        onBack={() => (step > 0 ? goStep(step - 1) : go("menu"))}
      />

      <div className="s-tut__progress">
        <div className="s-tut__progress-fill" style={{ width: `${((step + 1) / total) * 100}%` }} />
      </div>

      <div className="s-tut__body">
        <div className="s-tut__content" key={step}>
          <div className="s-tut__dots">
            {Array.from({ length: total }).map((_, i) => (
              <button
                key={i}
                className={`s-tut__dot${i === step ? " is-active" : ""}${i < step ? " is-done" : ""}`}
                onClick={() => goStep(i)}
                aria-label={`Paso ${i + 1}`}
              />
            ))}
          </div>

          <div>
            <div className="s-tut__kicker">Paso {step + 1}</div>
            <h1 className="s-tut__title">{cur.title}</h1>
          </div>

          <p className="s-tut__text">{cur.body}</p>

          <Panel className="s-tut__visual">
            <TutorialVisual type={cur.visual} step={step} />
          </Panel>

          <div className="s-tut__nav">
            {step > 0 && <GhostBtn onClick={() => goStep(step - 1)}>ANTERIOR</GhostBtn>}
            {isLast ? (
              <GoldBtn size="lg" onClick={() => go("menu")}>¡A JUGAR!</GoldBtn>
            ) : (
              <GoldBtn onClick={() => goStep(step + 1)}>SIGUIENTE →</GoldBtn>
            )}
            {!isLast && (
              <button className="s-tut__skip" onClick={() => go("menu")}>
                Saltar tutorial
              </button>
            )}
          </div>
        </div>

        <div className="s-tut__side">
          <ChromaImg className="s-tut__manolito" src={ASSETS.manolitoHold} alt="Manolito" />
          <Panel gold className="s-tut__bubble">
            <div className="s-tut__bubble-arrow" />
            <div className="s-tut__bubble-txt">"{cur.tip}"</div>
            <div className="s-tut__bubble-by">— Manolito Doble 9</div>
          </Panel>
        </div>
      </div>
    </ScreenWrap>
  );
}
