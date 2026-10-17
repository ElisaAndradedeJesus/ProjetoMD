import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Bot,
  Check,
  Delete,
  RotateCcw,
  Send,
  Trophy,
  Wand2,
} from "lucide-react";

type Screen = "menu" | "player" | "machine";
type Hint = "maior" | "menor" | "acerto";

const BLUE = "#3b82f6";
const ORANGE = "#f97316";
const GREEN = "#22c55e";
const MAX_ATTEMPTS = 7;

/* ---------- shared bits ---------- */

function TopBar({
  onBack,
  children,
}: {
  onBack: () => void;
  children?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 pt-[max(env(safe-area-inset-top),3.5rem)] sm:pt-[max(env(safe-area-inset-top),0.5rem)] backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center gap-3 px-4 sm:h-20 sm:px-8">
        <button
          onClick={onBack}
          aria-label="Voltar ao menu"
          className="key-3d flex size-10 sm:size-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 shadow-[0_4px_0_#cbd5e1,0_8px_14px_rgba(15,23,42,0.08)] hover:bg-slate-50"
          style={{ ["--depth" as string]: "4px", ["--edge" as string]: "#cbd5e1" }}
        >
          <ArrowLeft size={20} strokeWidth={2.5} />
        </button>
        <h1 className="min-w-0 flex-1 truncate text-base font-bold text-ink sm:text-xl">
          Busca Binária
          <span className="hidden font-normal text-slate-400 sm:inline"> · O Desafio</span>
        </h1>
        {children}
      </div>
    </header>
  );
}

function Tactile({
  color,
  edge,
  className = "",
  depth = 8,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  color: string;
  edge: string;
  depth?: number;
}) {
  return (
    <button
      {...props}
      className={`key-3d select-none outline-none focus-visible:ring-4 focus-visible:ring-slate-900/20 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      style={{
        background: color,
        boxShadow: `0 ${depth}px 0 ${edge}, 0 ${depth + 10}px 22px rgba(15,23,42,0.16)`,
        ["--depth" as string]: `${depth}px`,
        ["--edge" as string]: edge,
      }}
    />
  );
}

/* ---------- tela inicial ---------- */

function Menu({ go }: { go: (s: Screen) => void }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col items-center justify-center px-5 py-8 pt-[max(env(safe-area-inset-top),3.5rem)] sm:py-12 sm:px-8">
      <div className="rise mb-3 flex gap-2" aria-hidden>
        {[BLUE, ORANGE, GREEN].map((c) => (
          <span
            key={c}
            className="size-4 rounded-full"
            style={{ background: c, boxShadow: `0 3px 0 ${c}99` }}
          />
        ))}
      </div>
      <h1 className="rise text-center text-[clamp(1.875rem,9.5vw,3.75rem)] font-extrabold leading-tight tracking-tight text-ink">
        Busca Binária:
        <br />
        <span className="text-slate-500">O Desafio</span>
      </h1>
      <p className="rise mt-5 max-w-md text-center text-base text-slate-500 sm:text-lg" style={{ animationDelay: "80ms" }}>
        Encontre um número entre 1 e 100 em no máximo 7 tentativas. Escolha quem adivinha.
      </p>

      <div className="mt-8 grid w-full max-w-3xl grid-cols-1 gap-4 sm:mt-12 sm:gap-6 sm:grid-cols-2 sm:gap-8">
        {[
          {
            id: "player" as const,
            title: "Desafiar a Máquina",
            sub: "Você adivinha o número secreto da máquina.",
            color: BLUE,
            tint: "bg-blue-50",
            Icon: Bot,
          },
          {
            id: "machine" as const,
            title: "Máquina Vidente",
            sub: "Pense num número e a máquina vai descobrir.",
            color: ORANGE,
            tint: "bg-orange-50",
            Icon: Wand2,
          },
        ].map(({ id, title, sub, color, tint, Icon }, i) => (
          <button
            key={id}
            onClick={() => go(id)}
            className="rise group flex flex-col items-center gap-3 rounded-3xl sm:gap-5 border border-slate-100 bg-white p-5 text-center shadow-[0_10px_30px_rgba(15,23,42,0.08)] outline-none transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_28px_60px_rgba(15,23,42,0.16)] focus-visible:ring-4 focus-visible:ring-slate-900/20 active:translate-y-0 sm:p-10"
            style={{ animationDelay: `${160 + i * 100}ms` }}
          >
            <span
              className={`flex size-20 sm:size-28 items-center justify-center rounded-full ${tint} transition-transform duration-300 group-hover:scale-110`}
            >
              <Icon size={60} className="size-9 sm:size-[60px]" strokeWidth={1.8} color={color} />
            </span>
            <span className="text-xl sm:text-2xl font-bold text-ink">{title}</span>
            <span className="text-sm text-slate-500">{sub}</span>
            <span
              className="mt-1 rounded-full px-5 py-2 text-sm font-semibold text-white"
              style={{ background: color, boxShadow: `0 4px 0 ${color}aa` }}
            >
              Jogar
            </span>
          </button>
        ))}
      </div>
    </main>
  );
}

/* ---------- tela 2 - Desafiar a Máquina ---------- */

type Guess = { n: number; hint: Hint };

const HintBadge = ({ hint }: { hint: Hint }) => {
  if (hint === "acerto")
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
        <Check size={14} strokeWidth={3} /> Acertou
      </span>
    );
  const more = hint === "maior";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
        more ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"
      }`}
    >
      {more ? <ArrowUp size={14} strokeWidth={3} /> : <ArrowDown size={14} strokeWidth={3} />}
      {more ? "Maior" : "Menor"}
    </span>
  );
};

function PlayerGame({ back }: { back: () => void }) {
  const newSecret = () => Math.floor(Math.random() * 100) + 1;
  const [secret, setSecret] = useState(newSecret);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<Guess[]>([]);
  const [shake, setShake] = useState(0);
  const [error, setError] = useState("");

  const won = history.some((g) => g.hint === "acerto");
  const lost = !won && history.length >= MAX_ATTEMPTS;
  const over = won || lost;

  const press = useCallback(
    (d: string) => {
      if (over) return;
      setError("");
      setInput((v) => (v.length >= 3 ? v : v === "0" ? d : v + d));
    },
    [over],
  );
  const erase = useCallback(() => {
    setError("");
    setInput((v) => v.slice(0, -1));
  }, []);

  const submit = useCallback(() => {
    if (over) return;
    const n = Number(input);
    if (!input || n < 1 || n > 100) {
      setError("Digite um número de 1 a 100");
      setShake((s) => s + 1);
      return;
    }
    const hint: Hint = n === secret ? "acerto" : n < secret ? "maior" : "menor";
    setHistory((h) => [...h, { n, hint }]);
    setInput("");
    setError("");
  }, [input, over, secret]);

  const restart = () => {
    setSecret(newSecret());
    setHistory([]);
    setInput("");
    setError("");
  };

  const ref = useRef({ press, erase, submit, restart, over });
  ref.current = { press, erase, submit, restart, over };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const r = ref.current;
      if (/^\d$/.test(e.key)) r.press(e.key);
      else if (e.key === "Backspace") r.erase();
      else if (e.key === "Enter") r.over ? r.restart() : r.submit();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const last = history[history.length - 1];
  const dotColor = (i: number) => {
    const g = history[i];
    if (!g) return "#e2e8f0";
    return g.hint === "acerto" ? GREEN : g.hint === "maior" ? BLUE : ORANGE;
  };

  return (
    <div className="min-h-dvh">
      <TopBar onBack={back}>
        <div className="flex flex-col items-end gap-1" aria-label={`Tentativas: ${history.length} de ${MAX_ATTEMPTS}`}>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            Tentativas {history.length}/{MAX_ATTEMPTS}
          </span>
          <div className="flex gap-1.5">
            {Array.from({ length: MAX_ATTEMPTS }).map((_, i) => (
              <span
                key={i}
                className="size-3.5 rounded-full transition-colors duration-300 sm:size-4"
                style={{
                  background: dotColor(i),
                  boxShadow: history[i] ? `0 2px 0 ${dotColor(i)}99` : "inset 0 1px 2px rgba(0,0,0,0.12)",
                }}
              />
            ))}
          </div>
        </div>
      </TopBar>

      <main className="mx-auto grid w-full max-w-5xl gap-4 px-3 py-4 sm:px-8 sm:py-10 md:grid-cols-[minmax(0,1fr)_minmax(0,300px)] md:items-start md:gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)] lg:gap-10">
        <section className="mx-auto flex w-full max-w-lg flex-col gap-4 sm:gap-5 md:mx-0 md:max-w-none">
          {/* display */}
          <div
            key={shake}
            className={`relative overflow-hidden rounded-3xl border border-slate-100 bg-white px-6 pb-5 pt-4 shadow-[0_14px_40px_rgba(15,23,42,0.10)] ${shake ? "shake" : ""}`}
          >
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-widest text-slate-400">
              <span>Seu palpite</span>
              <span>1 – 100</span>
            </div>
            <div
              className="mt-2 flex h-24 items-center justify-end rounded-2xl bg-slate-50 px-5 text-[64px] font-extrabold leading-none tabular-nums text-ink shadow-[inset_0_3px_8px_rgba(15,23,42,0.08)] sm:h-36 sm:px-6 sm:text-[110px]"
              aria-live="polite"
            >
              {input || <span className="text-slate-300">0</span>}
              {!over && <span className="ml-1 h-[0.7em] w-1 animate-pulse rounded bg-blue-500" />}
            </div>
            <p className={`mt-3 h-5 text-sm font-medium ${error ? "text-red-500" : "text-slate-500"}`}>
              {error ||
                (last
                  ? last.hint === "acerto"
                    ? "Você acertou!"
                    : `O segredo é ${last.hint === "maior" ? "MAIOR" : "MENOR"} que ${last.n}.`
                  : "Digite um número e envie seu palpite.")}
            </p>
          </div>

          {/* keypad */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
              <Tactile
                key={d}
                color="#f1f5f9"
                edge="#cbd5e1"
                depth={6}
                disabled={over}
                onClick={() => press(d)}
                className="h-12 rounded-2xl text-2xl sm:text-3xl font-bold text-ink hover:brightness-105 sm:h-[72px]"
              >
                {d}
              </Tactile>
            ))}
            <Tactile
              color="#e2e8f0"
              edge="#b6c2d1"
              depth={6}
              disabled={over}
              onClick={erase}
              aria-label="Apagar"
              className="flex h-12 items-center justify-center rounded-2xl text-slate-600 sm:h-[72px]"
            >
              <Delete size={28} />
            </Tactile>
            <Tactile
              color="#f1f5f9"
              edge="#cbd5e1"
              depth={6}
              disabled={over}
              onClick={() => press("0")}
              className="h-12 rounded-2xl text-2xl sm:text-3xl font-bold text-ink hover:brightness-105 sm:h-[72px]"
            >
              0
            </Tactile>
            <div />
          </div>

          <Tactile
            color={GREEN}
            edge="#15803d"
            depth={8}
            disabled={over}
            onClick={submit}
            className="flex h-12 items-center justify-center gap-3 rounded-2xl text-base font-bold text-white hover:brightness-105 sm:h-[72px] sm:text-xl"
          >
            <Send size={22} strokeWidth={2.5} />
            Enviar Palpite
          </Tactile>
        </section>

        {/* history */}
        <aside className="h-fit rounded-3xl border border-slate-100 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] sm:p-6">
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400">Histórico de palpites</h2>
          {history.length === 0 ? (
            <div className="mt-4 flex h-32 items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 text-center text-sm text-slate-400">
              Nenhum palpite ainda.
              <br />
              Faça o primeiro!
            </div>
          ) : (
            <ul className="mt-4 flex flex-col gap-2">
              {[...history].reverse().map((g, i) => (
                <li
                  key={history.length - i}
                  className="slide-in flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-2.5"
                >
                  <span className="flex items-baseline gap-2">
                    <span className="text-xs font-semibold text-slate-400">#{history.length - i}</span>
                    <span className="text-2xl font-extrabold tabular-nums text-ink">{g.n}</span>
                  </span>
                  <HintBadge hint={g.hint} />
                </li>
              ))}
            </ul>
          )}
        </aside>
      </main>

      {over && (
        <EndModal
          won={won}
          title={won ? "Você acertou!" : "Fim das tentativas"}
          detail={
            won
              ? `Número ${secret} encontrado em ${history.length} ${history.length === 1 ? "tentativa" : "tentativas"}.`
              : `O número secreto era ${secret}.`
          }
          onRestart={restart}
          onMenu={back}
        />
      )}
    </div>
  );
}

function EndModal({
  won,
  title,
  detail,
  onRestart,
  onMenu,
}: {
  won: boolean;
  title: string;
  detail: string;
  onRestart: () => void;
  onMenu: () => void;
}) {
  return (
    <div className="fixed inset-0 z-20 flex bg-slate-900/30 overflow-y-auto px-4 pb-4 pt-[max(env(safe-area-inset-top),3.5rem)] backdrop-blur-sm sm:p-5" role="dialog" aria-modal>
      <div className="pop m-auto w-full max-w-sm rounded-3xl bg-white p-8 text-center shadow-[0_30px_80px_rgba(15,23,42,0.3)]">
        <span
          className="mx-auto flex size-20 items-center justify-center rounded-full text-white"
          style={{ background: won ? GREEN : ORANGE, boxShadow: `0 6px 0 ${won ? "#15803d" : "#c2410c"}` }}
        >
          {won ? <Trophy size={38} /> : <RotateCcw size={36} />}
        </span>
        <h2 className="mt-6 text-2xl font-extrabold text-ink">{title}</h2>
        <p className="mt-2 text-slate-500">{detail}</p>
        <div className="mt-7 flex flex-col gap-3">
          <Tactile
            color={BLUE}
            edge="#1d4ed8"
            depth={6}
            onClick={onRestart}
            className="h-14 rounded-2xl font-bold text-white"
          >
            Jogar novamente <span className="ml-1 text-xs opacity-70">(Enter)</span>
          </Tactile>
          <button onClick={onMenu} className="h-11 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-100">
            Voltar ao menu
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- tela 3 - Máquina Vidente ---------- */

type Step = { lo: number; hi: number; guess: number; answer: "maior" | "menor" | null };

const mid = (lo: number, hi: number) => Math.floor((lo + hi) / 2);
const newStep = (lo: number, hi: number): Step => ({ lo, hi, guess: mid(lo, hi), answer: null });

function NodeIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M12 12 5 6M12 12l7-6M12 12v7" />
      <circle cx="12" cy="12" r="2.6" fill="currentColor" />
      <circle cx="5" cy="6" r="2" fill="white" />
      <circle cx="19" cy="6" r="2" fill="white" />
      <circle cx="12" cy="19" r="2" fill="white" />
    </svg>
  );
}

function MachineGame({ back }: { back: () => void }) {
  const [steps, setSteps] = useState<Step[]>([newStep(1, 100)]);
  const [done, setDone] = useState(false);
  const [broken, setBroken] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  const cur = steps[steps.length - 1];
  const left = cur.hi - cur.lo + 1;

  const answer = useCallback(
    (kind: "maior" | "menor" | "acerto") => {
      if (done || broken) return;
      if (kind === "acerto") return setDone(true);
      const { lo, hi, guess } = steps[steps.length - 1];
      const next = kind === "maior" ? { lo: guess + 1, hi } : { lo, hi: guess - 1 };
      setSteps((s) => {
        const copy = s.slice();
        copy[copy.length - 1] = { ...copy[copy.length - 1], answer: kind };
        return next.lo > next.hi ? copy : [...copy, newStep(next.lo, next.hi)];
      });
      if (next.lo > next.hi) setBroken(true);
    },
    [done, broken, steps],
  );

  const restart = () => {
    setSteps([newStep(1, 100)]);
    setDone(false);
    setBroken(false);
  };

  const ref = useRef({ answer, restart, done, broken });
  ref.current = { answer, restart, done, broken };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const r = ref.current;
      if (e.key === "ArrowLeft") r.answer("maior");
      else if (e.key === "ArrowRight") r.answer("menor");
      else if (e.key === "Enter") r.done || r.broken ? r.restart() : r.answer("acerto");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
  }, [steps.length, done, broken]);

  const pct = (n: number) => `${n}%`;
  const pinLeft = cur.guess - 0.5;

  const Machine = ({ children, strong = false, tone = "blue" }: { children: React.ReactNode; strong?: boolean; tone?: "blue" | "green" | "red" }) => {
    const ring = tone === "green" ? "border-green-300 bg-green-50" : tone === "red" ? "border-red-200 bg-red-50" : "border-blue-200 bg-white";
    return (
      <div className="slide-in flex items-start gap-3">
        <span className="mt-1 flex size-9 shrink-0 items-center justify-center rounded-xl bg-white text-blue-500 shadow-[0_3px_0_#dbeafe,0_6px_12px_rgba(59,130,246,0.15)]">
          <NodeIcon className="size-5" />
        </span>
        <div
          className={`max-w-[88%] rounded-2xl rounded-tl-md ${
            strong
              ? `border-2 ${ring} px-4 py-3 text-base font-medium text-ink shadow-[0_8px_24px_rgba(59,130,246,0.14)] sm:text-lg`
              : "bg-slate-100 px-3.5 py-2.5 text-xs text-slate-500 sm:text-[13px]"
          }`}
        >
          {children}
        </div>
      </div>
    );
  };

  const buttons = [
    { k: "maior" as const, label: "É MAIOR", key: "←", color: BLUE, edge: "#1d4ed8", Icon: ArrowUp, main: false },
    { k: "acerto" as const, label: "ACERTOU!", key: "Enter", color: GREEN, edge: "#15803d", Icon: Check, main: true },
    { k: "menor" as const, label: "É MENOR", key: "→", color: ORANGE, edge: "#c2410c", Icon: ArrowDown, main: false },
  ];

  return (
    <div className="min-h-dvh bg-slate-50">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 pt-[max(env(safe-area-inset-top),3.5rem)] sm:pt-[max(env(safe-area-inset-top),0.5rem)] backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-3xl items-center gap-3 px-4 sm:h-20 sm:px-8">
          <button
            onClick={back}
            aria-label="Voltar ao menu"
            className="key-3d flex size-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 shadow-[0_4px_0_#cbd5e1,0_8px_14px_rgba(15,23,42,0.08)]"
            style={{ ["--depth" as string]: "4px", ["--edge" as string]: "#cbd5e1" }}
          >
            <ArrowLeft size={20} strokeWidth={2.5} />
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-[11px] font-medium text-green-600 sm:text-xs">
              <span className="relative flex size-2.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-green-400 opacity-70" />
                <span className="relative inline-flex size-2.5 rounded-full bg-green-500" />
              </span>
              <span className="truncate">Conexão Neural Estabelecida</span>
            </div>
            <h1 className="truncate text-lg font-bold text-ink sm:text-2xl">Módulo de Adivinhação</h1>
          </div>
          <div className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-500 shadow-sm">
            ciclo <b className="text-ink">{String(steps.length).padStart(2, "0")}</b>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-5 sm:gap-6 sm:px-8 sm:py-8">
        {/* chat */}
        <section className="rounded-3xl border border-slate-100 bg-white shadow-[0_2px_0_#e2e8f0,0_14px_36px_rgba(15,23,42,0.08)]">
          <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-3 text-[11px] uppercase tracking-widest text-slate-400">
            <span className="size-2 rounded-full bg-blue-500" /> log de pensamento
          </div>
          <div ref={chatRef} className="flex max-h-[40dvh] min-h-[150px] flex-col gap-3 overflow-y-auto p-4 sm:max-h-[340px] sm:p-5" aria-live="polite">
            {steps.map((s, i) => {
              const n = s.hi - s.lo + 1;
              return (
                <div key={i} className="flex flex-col gap-3">
                  <Machine>
                    &gt; Analisando intervalo de {s.lo} a {s.hi}... {n} candidatos. Descartando 50% das possibilidades.
                  </Machine>
                  <Machine strong>
                    {i === 0
                      ? "A probabilidade máxima aponta para o meio. "
                      : n <= 3
                        ? "Estou quase lá. "
                        : "Recalibrando a rede com sua dica. "}
                    O seu número é <b className="text-blue-600">{s.guess}</b>?
                  </Machine>
                  {s.answer && (
                    <div className="pop flex justify-end">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-white"
                        style={{ background: s.answer === "maior" ? BLUE : ORANGE }}
                      >
                        {s.answer === "maior" ? <ArrowUp size={14} strokeWidth={3} /> : <ArrowDown size={14} strokeWidth={3} />}
                        {s.answer === "maior" ? "É maior" : "É menor"}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
            {done && (
              <Machine strong tone="green">
                Padrão confirmado. Encontrei <b className="text-green-600">{cur.guess}</b> em {steps.length}{" "}
                {steps.length === 1 ? "ciclo" : "ciclos"}.
              </Machine>
            )}
            {broken && (
              <Machine strong tone="red">
                Inconsistência detectada: nenhum número satisfaz suas dicas. Vamos reiniciar a rede?
              </Machine>
            )}
          </div>
        </section>

        {/* spectrum */}
        <section className="rounded-3xl border border-slate-100 bg-white px-4 pb-6 pt-5 shadow-[0_2px_0_#e2e8f0,0_14px_36px_rgba(15,23,42,0.08)] sm:px-8">
          <div className="flex items-end justify-between text-[11px] uppercase tracking-widest text-slate-400">
            <span>espectro de busca</span>
            <span className="normal-case tracking-normal text-slate-500">
              ativo: <b className="text-ink">{broken ? "—" : `${cur.lo}–${cur.hi}`}</b> · {broken ? 0 : left} candidatos
            </span>
          </div>

          <div className="relative mx-7 mt-14 sm:mx-8 sm:mt-20">
            {/* pin */}
            {!broken && (
              <div
                className="absolute bottom-0 z-10 -translate-x-1/2 transition-[left] duration-700 ease-out"
                style={{ left: pct(pinLeft) }}
              >
                <div className="flex flex-col items-center">
                  <div
                    key={cur.guess}
                    className="pop mb-1 flex min-w-14 items-center justify-center rounded-2xl bg-blue-500 px-3 py-1 text-2xl font-semibold text-white shadow-[0_5px_0_#1d4ed8,0_0_28px_rgba(59,130,246,0.55)] sm:min-w-20 sm:px-4 sm:py-1.5 sm:text-4xl"
                  >
                    {done ? <Check size={34} strokeWidth={3} className="my-1" /> : cur.guess}
                  </div>
                  <div className="h-0 w-0 border-x-[9px] border-t-[11px] border-x-transparent border-t-blue-500" />
                  <div className="h-10 w-1.5 rounded-b-full bg-blue-500 shadow-[0_0_18px_6px_rgba(59,130,246,0.35)] sm:h-16" />
                </div>
              </div>
            )}

            {/* bar */}
            <div className="relative mb-0 h-11 w-full overflow-hidden rounded-2xl bg-slate-100 shadow-[inset_0_3px_8px_rgba(15,23,42,0.12)] sm:h-16">
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "repeating-linear-gradient(135deg,#e2e8f0 0 6px,#f1f5f9 6px 12px)",
                }}
              />
              {!broken && (
                <div
                  className="absolute inset-y-0 transition-[left,width] duration-700 ease-out"
                  style={{
                    left: pct(cur.lo - 1),
                    width: pct(left),
                    background: done ? "linear-gradient(180deg,#4ade80,#22c55e)" : "linear-gradient(180deg,#60a5fa,#3b82f6)",
                    boxShadow: "inset 0 -4px 0 rgba(0,0,0,0.14), 0 0 24px rgba(59,130,246,0.35)",
                  }}
                />
              )}
              {steps.slice(0, -1).map((s, i) => (
                <span
                  key={i}
                  className="absolute inset-y-0 w-px bg-white/70"
                  style={{ left: pct(s.guess - 0.5), display: "none" }}
                />
              ))}
            </div>
            <div className="relative mt-2 h-5 text-[11px] text-slate-400">
              {[1, 25, 50, 75, 100].map((t) => (
                <span
                  key={t}
                  className="absolute -translate-x-1/2"
                  style={{ left: pct(t === 1 ? 0.5 : t - 0.5) }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* controls */}
        <section className="pb-4 pt-1">
          <p className="mb-4 text-center text-xs text-slate-500 sm:text-sm">Forneça o feedback para a rede:</p>
          {broken ? (
            <div className="flex justify-center">
              <Tactile color={BLUE} edge="#1d4ed8" depth={7} onClick={restart} className="flex h-12 items-center gap-3 rounded-2xl px-6 text-base font-bold text-white">
                <RotateCcw size={22} /> Reiniciar rede
              </Tactile>
            </div>
          ) : (
            <div className="grid grid-cols-2 items-stretch gap-2.5 sm:mx-auto sm:max-w-xl sm:grid-cols-[1fr_1.2fr_1fr] sm:gap-4">
              {buttons.map(({ k, label, key, color, edge, Icon, main }) => (
                <Tactile
                  key={k}
                  color={color}
                  edge={edge}
                  depth={main ? 7 : 6}
                  disabled={done}
                  onClick={() => answer(k)}
                  className={`flex flex-col items-center justify-center gap-1 rounded-2xl px-2 sm:gap-1.5 sm:rounded-3xl text-white hover:brightness-105 ${
                    main ? "order-first col-span-2 min-h-16 sm:order-none sm:col-span-1 sm:min-h-32" : "min-h-16 sm:min-h-28"
                  }`}
                >
                  <Icon strokeWidth={3} className={main ? "size-7 sm:size-9" : "size-6 sm:size-8"} />
                  <span className={`font-extrabold tracking-wide ${main ? "text-base sm:text-xl" : "text-sm sm:text-base"}`}>{label}</span>
                </Tactile>
              ))}
            </div>
          )}
        </section>
      </main>

      {done && (
        <EndModal
          won
          title="A máquina acertou!"
          detail={`Descobriu seu número em ${steps.length} ${steps.length === 1 ? "tentativa" : "tentativas"}.`}
          onRestart={restart}
          onMenu={back}
        />
      )}
    </div>
  );
}

/* ---------- app ---------- */

export default function App() {
  const [screen, setScreen] = useState<Screen>("menu");
  const back = () => setScreen("menu");
  return (
    <div className="font-sans text-ink">
      {screen === "menu" && <Menu go={setScreen} />}
      {screen === "player" && <PlayerGame back={back} />}
      {screen === "machine" && <MachineGame back={back} />}
    </div>
  );
}
