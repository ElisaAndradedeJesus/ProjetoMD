import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, CircleHelp, GitBranch, RotateCcw, Sparkles, Trophy, X } from "lucide-react";
import {
  confirmarAkinator,
  iniciarAkinator,
  listarPersonagens,
  responderAkinator,
  type EstadoAkinator,
} from "./api.ts";
import ArvoreDecisao from "./ArvoreDecisao.tsx";

type Key =
  | "curto"
  | "loiro"
  | "cacheado"
  | "claros"
  | "oculos"
  | "barba"
  | "chapeu"
  | "sardas"
  | "brincos"
  | "sorriso"
  | "bigode"
  | "colar"
  | "gravata"
  | "ruivo"
  | "maquiagem"
  | "piercing";

export type Person = { name: string; traits: Key[] };
type Answer = "sim" | "psim" | "nsei" | "pnao" | "nao";

const TRAIT: Record<Key, { label: string; question: string }> = {
  curto: { label: "Cabelo curto", question: "possui cabelo curto?" },
  loiro: { label: "Cabelo loiro", question: "tem cabelo loiro?" },
  cacheado: { label: "Cabelo cacheado", question: "tem cabelo cacheado?" },
  claros: { label: "Olhos claros", question: "tem olhos claros?" },
  oculos: { label: "Óculos", question: "usa óculos?" },
  barba: { label: "Barba", question: "tem barba?" },
  chapeu: { label: "Chapéu", question: "usa chapéu?" },
  sardas: { label: "Sardas", question: "tem sardas no rosto?" },
  brincos: { label: "Brincos", question: "usa brincos?" },
  sorriso: { label: "Sorrindo", question: "está sorrindo?" },
  bigode: { label: "Bigode", question: "tem bigode?" },
  colar: { label: "Colar", question: "usa colar?" },
  gravata: { label: "Gravata", question: "está usando gravata?" },
  ruivo: { label: "Cabelo ruivo", question: "tem cabelo ruivo?" },
  maquiagem: { label: "Maquiagem", question: "está usando maquiagem?" },
  piercing: { label: "Piercing", question: "usa piercing no nariz?" },
};

const KEYS = Object.keys(TRAIT) as Key[];
const TOTAL_Q = KEYS.length;

const LOCAL_PEOPLE: Person[] = [
  { name: "Ana", traits: ["loiro", "claros", "sardas", "brincos", "sorriso", "colar", "maquiagem"] },
  { name: "Bruno", traits: ["curto", "barba", "oculos", "gravata"] },
  { name: "Caio", traits: ["cacheado", "claros", "sorriso", "ruivo", "piercing"] },
  { name: "Duda", traits: ["loiro", "oculos", "brincos", "maquiagem", "colar"] },
  { name: "Enzo", traits: ["curto", "loiro", "chapeu", "sorriso", "gravata"] },
  { name: "Fernanda", traits: ["cacheado", "sardas", "brincos", "sorriso", "colar"] },
  { name: "Gui", traits: ["curto", "barba", "chapeu", "oculos", "bigode"] },
  { name: "Helena", traits: ["loiro", "claros", "cacheado", "sorriso", "maquiagem"] },
  { name: "Ivo", traits: ["curto", "claros", "sardas", "chapeu", "piercing"] },
  { name: "Júlia", traits: ["cacheado", "oculos", "brincos", "maquiagem"] },
  { name: "Kai", traits: ["barba", "chapeu", "sorriso", "bigode", "colar"] },
  { name: "Lia", traits: ["loiro", "sardas", "oculos", "brincos", "piercing"] },
  { name: "Maya", traits: ["loiro", "cacheado", "oculos", "sorriso", "gravata"] },
  { name: "Nina", traits: ["curto", "brincos", "sardas", "maquiagem"] },
  { name: "Otto", traits: ["curto", "chapeu", "barba", "sorriso", "claros", "bigode"] },
  { name: "Paula", traits: ["cacheado", "loiro", "sardas", "oculos", "colar"] },
  { name: "Ravi", traits: ["curto", "cacheado", "barba", "brincos", "piercing"] },
  { name: "Sofia", traits: ["loiro", "chapeu", "brincos", "claros", "sorriso", "maquiagem"] },
  { name: "Theo", traits: ["curto", "oculos", "sardas", "sorriso", "gravata"] },
  { name: "Uma", traits: ["cacheado", "claros", "chapeu", "ruivo", "colar"] },
  { name: "Vitor", traits: ["curto", "loiro", "barba", "sardas", "bigode"] },
  { name: "Wesley", traits: ["cacheado", "barba", "chapeu", "oculos", "gravata"] },
  { name: "Yara", traits: ["loiro", "brincos", "sorriso", "claros", "maquiagem", "piercing"] },
  { name: "Zeca", traits: ["curto", "sardas", "chapeu", "oculos", "bigode"] },
];

type AnswerEntry = { key: Key; ans: Answer };

function isPerson(value: unknown): value is Person {
  if (!value || typeof value !== "object" || !("name" in value) || !("traits" in value)) return false;
  return (
    typeof value.name === "string" &&
    Array.isArray(value.traits) &&
    value.traits.every((trait: unknown) => typeof trait === "string" && KEYS.some((key) => key === trait))
  );
}

const BUTTONS: { id: Answer; label: string; hint: string }[] = [
  { id: "sim", label: "Sim", hint: "1" },
  { id: "nao", label: "Não", hint: "2" },
  { id: "nsei", label: "Não Sei", hint: "3" },
  { id: "psim", label: "Provavelmente Sim", hint: "4" },
  { id: "pnao", label: "Provavelmente Não", hint: "5" },
];

const pad = (n: number) => String(n).padStart(2, "0");

function candidateCost(person: Person, answers: AnswerEntry[]) {
  return answers.reduce((cost, { key, ans }) => {
    if (ans === "nsei") return cost;
    const saidYes = ans === "sim" || ans === "psim";
    if (person.traits.includes(key) === saidYes) return cost;
    return cost + (ans === "sim" || ans === "nao" ? 3 : 1.5);
  }, 0);
}

/* ---------- motor de dedução ---------- */
// Quem decide é o back. Se ele não responder, o mesmo algoritmo roda aqui (localEngine).

type Engine = {
  possible: Set<string>;
  next: Key | null;
  finished: boolean;
  guessName: string | undefined;
  split: { key: Key; yes: number; no: number; active: boolean } | null;
};

function localEngine(people: Person[], log: AnswerEntry[]): Engine {
  const scored = people.map((p) => ({ p, cost: candidateCost(p, log) }));
  const remaining = scored.filter((s) => s.cost < 3);
  const asked = new Set(log.map((l) => l.key));
  const n = remaining.length;
  let next: Key | null = null;
  let bestGap = Infinity;
  for (const k of KEYS) {
    if (asked.has(k)) continue;
    const c = remaining.filter((r) => r.p.traits.includes(k)).length;
    if (c === 0 || c === n) continue;
    const gap = Math.abs(c - n / 2);
    if (gap < bestGap) {
      bestGap = gap;
      next = k;
    }
  }
  const finished = remaining.length <= 1 || log.length >= TOTAL_Q || next === null;
  const guessName = [...(remaining.length ? remaining : scored)].sort((a, b) => a.cost - b.cost)[0]?.p.name;

  let split: Engine["split"] = null;
  if (!finished && next) {
    const yes = remaining.filter(({ p }) => p.traits.includes(next)).length;
    split = { key: next, yes, no: n - yes, active: true };
  } else if (log.length) {
    const last = log[log.length - 1].key;
    const previous = people.filter((p) => candidateCost(p, log.slice(0, -1)) < 3);
    const yes = previous.filter((p) => p.traits.includes(last)).length;
    split = { key: last, yes, no: previous.length - yes, active: false };
  }
  return {
    possible: new Set(remaining.map((r) => r.p.name)),
    next: finished ? null : next,
    finished,
    guessName,
    split,
  };
}

function serverEngine(estado: EstadoAkinator): Engine {
  const atual = estado.pergunta_atual;
  const ultimo = estado.historico[estado.historico.length - 1];
  const split: Engine["split"] = atual
    ? { key: atual.traco as Key, yes: atual.divisao.sim, no: atual.divisao.nao, active: true }
    : ultimo
      ? { key: ultimo.traco as Key, yes: ultimo.divisao.sim, no: ultimo.divisao.nao, active: false }
      : null;
  return {
    possible: new Set(estado.candidatos_restantes),
    next: (atual?.traco as Key | undefined) ?? null,
    finished: estado.status !== "jogando",
    guessName: estado.palpite?.name,
    split,
  };
}

/* ---------- portrait ---------- */

function Portrait({ person, className = "" }: { person: Person; className?: string }) {
  const has = (k: Key) => person.traits.includes(k);
  const hair = has("ruivo") ? "#b45309" : has("loiro") ? "#eab308" : "#44281a";
  const eye = has("claros") ? "#38bdf8" : "#44281a";
  const curls = [18, 24, 30, 36, 42, 48];
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" role="img" aria-label={`Retrato de ${person.name}`}>
      {!has("curto") && !has("cacheado") && (
        <path d="M14 30c0-14 8-20 18-20s18 6 18 20v26c0 2-2 3-4 3h-6V34H24v25h-6c-2 0-4-1-4-3z" fill={hair} />
      )}
      {!has("curto") && has("cacheado") &&
        [16, 48].flatMap((x) => [28, 36, 44].map((y) => <circle key={`${x}${y}`} cx={x} cy={y} r="6" fill={hair} />))}
      <ellipse cx="32" cy="34" rx="15" ry="17" fill="#fde7d3" stroke="#1f2937" strokeWidth="2.2" />
      {has("barba") && (
        <path d="M17.5 38c0 12 6 19 14.500 19s14.500-7 14.500-19c-3 6-8 8-14.500 8s-11.500-2-14.500-8z" fill={hair} />
      )}
      {has("cacheado")
        ? curls.map((x, i) => <circle key={x} cx={x} cy={i % 2 ? 19 : 21} r="6.5" fill={hair} />)
        : has("curto")
          ? <path d="M16 31c-1-13 7-19 16-19s17 6 16 19c-3-6-7-9-10-10-5 3-14 3-18 0-3 2-3 6-4 10z" fill={hair} />
          : <path d="M17 33c0-12 6-18 15-18s15 6 15 18c-4-4-6-9-7-12-6 3-13 3-18 0-1 4-3 8-5 12z" fill={hair} />}
      <circle cx="26" cy="35" r="3" fill={eye} stroke="#1f2937" strokeWidth="1.2" />
      <circle cx="38" cy="35" r="3" fill={eye} stroke="#1f2937" strokeWidth="1.2" />
      {has("maquiagem") && (
        <g fill="#fb7185" opacity="0.65">
          <ellipse cx="21" cy="41" rx="3" ry="1.5" />
          <ellipse cx="43" cy="41" rx="3" ry="1.5" />
        </g>
      )}
      {has("sardas") && (
        <g fill="#c2763f">
          {[[22, 40], [25, 42], [39, 42], [42, 40], [30, 38], [34, 38]].map(([x, y]) => (
            <circle key={`${x}${y}`} cx={x} cy={y} r="0.9" />
          ))}
        </g>
      )}
      {has("oculos") && (
        <g stroke="#1f2937" strokeWidth="2.2" strokeLinecap="round">
          <circle cx="26" cy="35" r="6.5" fill="#ffffff55" />
          <circle cx="38" cy="35" r="6.5" fill="#ffffff55" />
          <path d="M32.5 35h-1M19.5 34l-4-2M44.5 34l4-2" />
        </g>
      )}
      {has("bigode") && (
        <path d="M25 41c2-2 5-2 7 0 2-2 5-2 7 0-1 4-4 5-7 3-3 2-6 1-7-3z" fill={hair} />
      )}
      {has("piercing") && <circle cx="33" cy="40" r="1.5" fill="#e2e8f0" stroke="#64748b" strokeWidth="0.8" />}
      <path
        d={has("sorriso") ? "M26 44c3 4.500 9 4.500 12 0" : "M27.500 45.500h9"}
        stroke={has("maquiagem") ? "#be123c" : has("barba") ? "#fde7d3" : "#1f2937"}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      {has("brincos") && (
        <g fill="#f97316" stroke="#c2410c" strokeWidth="1">
          <circle cx="17" cy="42" r="2.200" />
          <circle cx="47" cy="42" r="2.200" />
        </g>
      )}
      {has("colar") && (
        <g fill="none" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round">
          <path d="M21 49c2 8 7 11 11 11s9-3 11-11" />
          <circle cx="32" cy="59" r="2" fill="#f97316" />
        </g>
      )}
      {has("gravata") && (
        <path d="M28 49h8l-1.5 4 2.5 8-5 2-5-2 2.5-8z" fill="#2563eb" stroke="#1d4ed8" strokeWidth="1" />
      )}
      {has("chapeu") && (
        <g>
          <ellipse cx="32" cy="20" rx="21" ry="4.500" fill="#2563eb" stroke="#1d4ed8" strokeWidth="1.500" />
          <path d="M20 20c0-9 5-13 12-13s12 4 12 13z" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="1.500" />
          <path d="M20.500 17h23" stroke="#f97316" strokeWidth="2.500" />
        </g>
      )}
    </svg>
  );
}

/* ---------- tactile button ---------- */

function Key3D({
  color,
  edge,
  text = "text-white",
  className = "",
  onClick,
  children,
}: {
  color: string;
  edge: string;
  text?: string;
  className?: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`key-3d select-none rounded-2xl outline-none focus-visible:ring-4 focus-visible:ring-slate-900/20 ${text} ${className}`}
      style={{
        background: color,
        boxShadow: `0 6px 0 ${edge}, 0 14px 22px rgba(15,23,42,0.14)`,
        ["--depth" as string]: "6px",
        ["--edge" as string]: edge,
      }}
    >
      {children}
    </button>
  );
}

/* ---------- main ---------- */

export default function Akinator({ back }: { back: () => void }) {
  const [log, setLog] = useState<AnswerEntry[]>([]);
  const [won, setWon] = useState(false);
  const [round, setRound] = useState(0);
  const [people, setPeople] = useState<Person[]>([]);
  const [peopleLoading, setPeopleLoading] = useState(true);
  const [usingLocalPeople, setUsingLocalPeople] = useState(false);
  // online = null enquanto a partida no back ainda está sendo criada
  const [server, setServer] = useState<EstadoAkinator | null>(null);
  const [online, setOnline] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [treeOpen, setTreeOpen] = useState(false);

  useEffect(() => {
    let active = true;
    listarPersonagens()
      .then((data) => {
        if (!active) return;
        if (Array.isArray(data) && data.length > 0 && data.every(isPerson)) {
          setPeople(data);
        } else {
          setPeople(LOCAL_PEOPLE);
          setUsingLocalPeople(true);
        }
      })
      .catch(() => {
        if (!active) return;
        setPeople(LOCAL_PEOPLE);
        setUsingLocalPeople(true);
      })
      .finally(() => active && setPeopleLoading(false));
    return () => {
      active = false;
    };
  }, []);

  // partida nova no back a cada rodada, assim se ele voltar o jogo volta a usar
  useEffect(() => {
    if (peopleLoading) return;
    if (usingLocalPeople) {
      setOnline(false);
      return;
    }
    let active = true;
    setServer(null);
    setOnline(null);
    iniciarAkinator()
      .then((estado) => {
        if (!active) return;
        setServer(estado);
        setOnline(true);
      })
      .catch(() => active && setOnline(false));
    return () => {
      active = false;
    };
  }, [round, peopleLoading, usingLocalPeople]);

  const engine = useMemo(
    () => (online && server ? serverEngine(server) : localEngine(people, log)),
    [online, server, people, log],
  );
  const { next, finished } = engine;
  const remainingCount = engine.possible.size;
  const guess = people.find((p) => p.name === engine.guessName) ?? people[0];
  const activeQuestion = engine.split?.active ? engine.split.key : null;
  const splitKey = engine.split?.key ?? null;
  const yesCount = engine.split?.yes ?? 0;
  const noCount = engine.split?.no ?? 0;
  const splitTotal = yesCount + noCount;
  const lastAnswer = log[log.length - 1];
  const lastAnswerLabel = lastAnswer ? BUTTONS.find((button) => button.id === lastAnswer.ans)?.label : null;
  // só existe enquanto as respostas forem Sim/Não
  const treePath =
    online && server
      ? server.caminho_na_arvore
      : log.every((l) => l.ans === "sim" || l.ans === "nao")
        ? log.map((l) => l.ans as "sim" | "nao")
        : null;
  const waiting = online === null || busy;

  const answer = useCallback(
    (ans: Answer) => {
      if (waiting || finished || !next) return;
      const entry = { key: next, ans };
      if (online && server) {
        setBusy(true);
        responderAkinator(server.id, ans)
          .then((estado) => {
            setServer(estado);
            setLog((l) => [...l, entry]);
          })
          .catch(() => {
            // back caiu no meio: segue no navegador
            setOnline(false);
            setLog((l) => [...l, entry]);
          })
          .finally(() => setBusy(false));
      } else {
        setLog((l) => [...l, entry]);
      }
    },
    [waiting, finished, next, online, server],
  );

  const reset = useCallback(() => {
    setLog([]);
    setWon(false);
    setRound((r) => r + 1);
  }, []);

  const confirm = useCallback(
    (acertou: boolean) => {
      if (online && server) confirmarAkinator(server.id, acertou).catch(() => {});
      if (acertou) setWon(true);
      else reset();
    },
    [online, server, reset],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (treeOpen || e.metaKey || e.ctrlKey || e.altKey) return;
      const b = BUTTONS.find((x) => x.hint === e.key);
      if (b) answer(b.id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [answer, treeOpen]);

  const confirmed = log.filter((l) => l.ans === "sim" || l.ans === "psim");
  const eliminated = log.filter((l) => l.ans === "nao" || l.ans === "pnao");
  const qNum = Math.min(log.length + 1, TOTAL_Q);

  if (peopleLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-slate-50 p-6">
        <p className="text-center text-lg font-semibold text-slate-600">Carregando personagens...</p>
      </div>
    );
  }

  if (people.length === 0) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-slate-50 p-6 text-center">
        <p className="max-w-lg text-lg font-semibold text-slate-700">Não há perfis disponíveis para iniciar o jogo.</p>
        <button onClick={back} className="rounded-xl bg-slate-200 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-300">
          Voltar
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 pt-[max(env(safe-area-inset-top),3.5rem)] backdrop-blur sm:pt-[max(env(safe-area-inset-top),0.5rem)]">
        <div className="mx-auto flex min-h-14 w-full max-w-5xl items-center gap-3 px-4 py-2 sm:min-h-20 sm:px-8">
          <button
            onClick={back}
            aria-label="Voltar ao menu"
            className="key-3d flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 shadow-[0_4px_0_#cbd5e1,0_8px_14px_rgba(15,23,42,0.08)] hover:bg-slate-50 sm:size-11"
            style={{ ["--depth" as string]: "4px", ["--edge" as string]: "#cbd5e1" }}
          >
            <ArrowLeft size={20} strokeWidth={2.5} />
          </button>
          <div className="flex min-w-0 flex-1 flex-col items-start gap-0.5 sm:flex-row sm:items-center sm:gap-3">
            <h1 className="max-w-full truncate text-base font-bold text-ink sm:text-xl">Módulo Dedução: Perfil</h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
              <span
                className="size-2 rounded-full"
                style={{ background: finished ? "#22c55e" : "#f97316" }}
              />
              {finished ? "Palpite pronto" : "Deduzindo"}
            </span>
          </div>
          <span className="shrink-0 rounded-full bg-orange-50 px-3 py-1.5 text-xs font-bold text-orange-700 ring-1 ring-orange-200 sm:text-sm">
            <span className="tabular-nums">{remainingCount}</span>
            <span className="hidden sm:inline"> {remainingCount === 1 ? "Candidato Restante" : "Candidatos Restantes"}</span>
            <span className="sm:hidden"> cand.</span>
          </span>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-5xl gap-6 px-4 py-6 sm:px-8 sm:py-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-8">
        {online === false && (
          <p className="rounded-2xl bg-blue-50 px-4 py-3 text-center text-sm font-medium text-blue-800 lg:col-span-2">
            Modo demonstração: o backend não está disponível, então a dedução está rodando no navegador.
          </p>
        )}
        <section key={round} className="rise flex flex-col items-center">
          <div className="relative mb-[-2.5rem] z-[1] flex size-24 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-[0_6px_0_#1d4ed8,0_16px_28px_rgba(59,130,246,0.35)] sm:size-28">
            <Sparkles size={44} strokeWidth={1.8} />
            <span className="absolute -right-1 -top-1 size-5 rounded-full border-2 border-white bg-orange-500" />
            <span className="absolute -left-1 bottom-2 size-4 rounded-full border-2 border-white bg-green-500" />
          </div>

          <div className="w-full rounded-3xl border border-slate-100 bg-white px-5 pb-7 pt-14 text-center shadow-[0_10px_30px_rgba(15,23,42,0.08)] sm:px-10 sm:pb-10">
            <div className="mb-5">
              <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-500 sm:text-sm">
                <span>
                  Pergunta {pad(qNum)} de {TOTAL_Q}
                </span>
                <span className="tabular-nums">{Math.round((log.length / TOTAL_Q) * 100)}%</span>
              </div>
              <div
                className="h-3 w-full overflow-hidden rounded-full bg-slate-100"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={TOTAL_Q}
                aria-valuenow={log.length}
              >
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500"
                  style={{ width: `${(log.length / TOTAL_Q) * 100}%` }}
                />
              </div>
            </div>

            <p key={log.length} className="slide-in min-h-[5.5rem] text-xl font-bold leading-snug text-ink sm:min-h-[6.5rem] sm:text-3xl">
              {next && !finished ? (
                <>O personagem que você pensou {TRAIT[next].question}</>
              ) : (
                <>Já sei quem é! Deixe-me revelar...</>
              )}
            </p>
          </div>

          <div className="mt-8 grid w-full grid-cols-2 gap-4 sm:gap-5">
            <Key3D
              color="#22c55e"
              edge="#15803d"
              onClick={() => answer("sim")}
              className="flex items-center justify-center gap-2 py-5 text-xl font-extrabold disabled:opacity-50 sm:py-6 sm:text-2xl"
            >
              <Check size={26} strokeWidth={3} /> Sim
              <kbd className="ml-1 hidden rounded bg-black/15 px-1.5 text-xs font-semibold lg:inline">1</kbd>
            </Key3D>
            <Key3D
              color="#f97316"
              edge="#c2410c"
              onClick={() => answer("nao")}
              className="flex items-center justify-center gap-2 py-5 text-xl font-extrabold sm:py-6 sm:text-2xl"
            >
              <X size={26} strokeWidth={3} /> Não
              <kbd className="ml-1 hidden rounded bg-black/15 px-1.5 text-xs font-semibold lg:inline">2</kbd>
            </Key3D>
          </div>

          <div className="mt-5 grid w-full grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
            {BUTTONS.slice(2).map((b) => (
              <Key3D
                key={b.id}
                color="#ffffff"
                edge="#cbd5e1"
                text="text-slate-700"
                onClick={() => answer(b.id)}
                className="flex items-center justify-center gap-2 border border-slate-100 px-3 py-3.5 text-sm font-semibold sm:flex-col sm:gap-0.5 sm:py-4"
              >
                {b.id === "nsei" && <CircleHelp size={18} className="text-slate-400" />}
                <span>{b.label}</span>
                <kbd className="hidden text-[11px] font-medium text-slate-400 lg:inline">tecla {b.hint}</kbd>
              </Key3D>
            ))}
          </div>
        </section>

        <aside className="flex flex-col gap-5">
          <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-ink sm:text-lg">Candidatos</h2>
                <p className="mt-1 text-sm text-slate-500">Os possíveis ficam destacados; os eliminados aparecem esmaecidos.</p>
              </div>
              <span className="rounded-full bg-blue-50 px-3 py-1.5 text-sm font-bold text-blue-800 ring-1 ring-blue-100">
                {remainingCount} de {people.length}
              </span>
            </div>
            <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-3 lg:grid-cols-3">
              {people.map((p) => {
                const possible = engine.possible.has(p.name);
                return (
                  <li
                    key={p.name}
                    className={`flex min-w-0 flex-col items-center gap-2 rounded-xl border p-3 text-center transition-all duration-300 sm:gap-1 sm:p-2 ${
                      possible
                        ? "border-blue-200 bg-blue-50 shadow-sm"
                        : "border-slate-100 bg-slate-50 opacity-45 grayscale"
                    }`}
                    aria-label={`${p.name}: ${possible ? "possível" : "eliminado"}`}
                  >
                    <span className={`size-20 overflow-hidden rounded-full bg-white ring-2 ${possible ? "ring-blue-300" : "ring-slate-200"} sm:size-12 lg:size-16`}>
                      <Portrait person={p} className="size-full" />
                    </span>
                    <span className={`max-w-full break-words text-xs font-bold leading-tight sm:text-xs ${possible ? "text-slate-800" : "text-slate-500"}`}>{p.name}</span>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Traços deduzidos</h2>
            <div className="mt-4">
              <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-green-700">
                <Check size={16} strokeWidth={3} /> Confirmados ({confirmed.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {confirmed.length === 0 && <span className="text-sm text-slate-400">Nenhum ainda</span>}
                {confirmed.map((l) => (
                  <span key={l.key} className="pop rounded-full bg-green-50 px-3 py-1 text-sm font-medium text-green-800 ring-1 ring-green-200">
                    {TRAIT[l.key].label}
                    {l.ans === "psim" && <span className="text-green-600">?</span>}
                  </span>
                ))}
              </div>
            </div>
            <div className="mt-5">
              <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-orange-700">
                <X size={16} strokeWidth={3} /> Eliminados ({eliminated.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {eliminated.length === 0 && <span className="text-sm text-slate-400">Nenhum ainda</span>}
                {eliminated.map((l) => (
                  <span key={l.key} className="pop rounded-full bg-orange-50 px-3 py-1 text-sm font-medium text-orange-800 line-through ring-1 ring-orange-200">
                    {TRAIT[l.key].label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={reset}
            className="flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-semibold text-slate-500 outline-none hover:bg-slate-100 focus-visible:ring-4 focus-visible:ring-slate-900/20"
          >
            <RotateCcw size={16} /> Reiniciar dedução
          </button>
        </aside>

        <section className="rounded-3xl border border-blue-100 bg-blue-50/70 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)] lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-bold uppercase tracking-wide text-blue-900">Como a máquina decide</h2>
              <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-semibold text-slate-600 ring-1 ring-blue-100">
                {online ? "calculado no servidor (Python)" : "calculado no navegador"}
              </span>
            </div>
            {online && (
              <button
                onClick={() => setTreeOpen(true)}
                className="key-3d flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold text-blue-700 shadow-[0_4px_0_#bfdbfe,0_8px_14px_rgba(15,23,42,0.08)] outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
                style={{ ["--depth" as string]: "4px", ["--edge" as string]: "#bfdbfe" }}
              >
                <GitBranch size={16} strokeWidth={2.5} /> Ver árvore de decisão
              </button>
            )}
          </div>
          <p className="mt-3 text-sm leading-relaxed text-slate-700">
            Cada pergunta divide o conjunto de candidatos em dois grupos. A máquina escolhe o traço que deixa esses grupos o mais equilibrados possível.
          </p>
          <div className="mt-4 grid gap-3 rounded-2xl bg-white p-4 text-sm text-slate-700 ring-1 ring-blue-100 sm:grid-cols-2 lg:grid-cols-3">
            <p>
              <span className="font-semibold">Conjunto atual:</span>{" "}
              <code className="rounded bg-slate-100 px-1.5 py-0.5">Sᵢ</code> tem{" "}
              <strong>{remainingCount}</strong> de {people.length} candidatos.
            </p>
            <p className="break-words font-mono text-xs leading-relaxed">
              Sᵢ = {"{p ∈ S₀ | custo(p) < 3}"}
            </p>
            <p className="text-xs leading-relaxed text-slate-500">
              Custo: contradição em Sim/Não = 3; em resposta provável = 1,5; Não Sei = 0.
            </p>
            {splitKey ? (
              <>
                <p>
                  <span className="font-semibold">{activeQuestion ? "Traço escolhido:" : "Último traço:"}</span>{" "}
                  {TRAIT[splitKey].label}
                </p>
                <p className="font-mono text-xs leading-relaxed">
                  Sim: {yesCount} · Não: {noCount} · Total: {splitTotal}
                </p>
                {activeQuestion && (
                  <p className="text-xs leading-relaxed text-slate-500">
                    A escolha minimiza |nₛᵢₘ − |Sᵢ|/2| entre os traços ainda não perguntados.
                  </p>
                )}
              </>
            ) : (
              <p className="text-xs text-slate-500">Não há outro traço que divida os candidatos restantes.</p>
            )}
            {lastAnswer && (
              <p className="border-t border-slate-100 pt-3 sm:border-t-0">
                <span className="font-semibold">Última resposta:</span> {lastAnswerLabel};{" "}
                {remainingCount} candidato(s) continuam possíveis.
              </p>
            )}
          </div>
          <p className="mt-3 text-xs leading-relaxed text-slate-500">
            Na busca binária ideal, dividir pela metade exige cerca de ⌈log₂({people.length})⌉ ={" "}
            {Math.ceil(Math.log2(people.length))} perguntas. Aqui, as partições dependem dos traços disponíveis; por isso, a quantidade pode variar.
          </p>
        </section>
      </main>

      {finished && (
        <div
          className="fixed inset-0 z-20 flex items-end justify-center bg-slate-900/40 p-4 pb-[max(env(safe-area-inset-bottom),1rem)] backdrop-blur-sm sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-label="Palpite final"
        >
          <div className="pop w-full max-w-md rounded-3xl bg-white p-6 text-center shadow-[0_30px_80px_rgba(15,23,42,0.35)] sm:p-8">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
              {won ? "Resultado" : "Palpite final"}
            </p>
            <div className="mx-auto mt-4 size-36 overflow-hidden rounded-full bg-blue-50 ring-4 ring-white shadow-[0_0_0_4px_#3b82f6,0_14px_28px_rgba(59,130,246,0.3)] sm:size-40">
              <Portrait person={guess} className="size-full" />
            </div>
            <h2 className="mt-5 text-3xl font-extrabold text-ink">{guess.name}</h2>
            <p className="mt-1 text-sm text-slate-500">{guess.traits.map((t) => TRAIT[t].label).join(" · ")}</p>

            {won ? (
              <>
                <p className="mt-5 flex items-center justify-center gap-2 text-lg font-bold text-green-600">
                  <Trophy size={22} /> A máquina acertou em {log.length} perguntas!
                </p>
                <Key3D color="#3b82f6" edge="#1d4ed8" onClick={reset} className="mt-6 flex w-full items-center justify-center gap-2 py-4 text-lg font-bold">
                  <RotateCcw size={20} /> Jogar de novo
                </Key3D>
              </>
            ) : (
              <>
                <p className="mt-5 text-xl font-bold text-ink">A máquina acertou?</p>
                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Key3D color="#22c55e" edge="#15803d" onClick={() => confirm(true)} className="flex items-center justify-center gap-2 py-4 text-lg font-bold">
                    <Check size={22} strokeWidth={3} /> Sim
                  </Key3D>
                  <Key3D color="#f97316" edge="#c2410c" onClick={() => confirm(false)} className="flex items-center justify-center gap-2 py-4 text-base font-bold">
                    <RotateCcw size={20} /> Tentar Novamente
                  </Key3D>
                </div>
              </>
            )}
            {online && (
              <button
                onClick={() => setTreeOpen(true)}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-semibold text-blue-700 outline-none hover:bg-blue-50 focus-visible:ring-4 focus-visible:ring-blue-200"
              >
                <GitBranch size={16} /> Ver o caminho na árvore de decisão
              </button>
            )}
          </div>
        </div>
      )}

      {treeOpen && (
        <ArvoreDecisao
          path={treePath}
          avatar={(name) => {
            const person = people.find((p) => p.name === name);
            return person ? <Portrait person={person} className="size-full" /> : null;
          }}
          onClose={() => setTreeOpen(false)}
        />
      )}
    </div>
  );
}
