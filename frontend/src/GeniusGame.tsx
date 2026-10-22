import { useState } from "react";
import { ArrowLeft, Check, Play } from "lucide-react";

type Props = {
  back: () => void;
};

const grupos = [
  {
    id: "textura",
    titulo: "Textura do cabelo",
    opcoes: ["Cabelo Cacheado", "Cabelo Ondulado", "Cabelo Liso"],
    surface: "bg-blue-50 border-blue-100 shadow-[0_5px_0_#a4c3f5,0_10px_18px_rgba(15,23,42,0.08)]",
    selected: "bg-blue-600 border-blue-700 text-white shadow-[0_5px_0_#1d4ed8]",
    dot: "bg-blue-500",
  },
  {
    id: "comprimento",
    titulo: "Comprimento do cabelo",
    opcoes: ["Cabelo Curto", "Cabelo Médio", "Cabelo Longo"],
    surface: "bg-orange-50 border-orange-100 shadow-[0_5px_0_#edb48e,0_10px_18px_rgba(15,23,42,0.08)]",
    selected: "bg-orange-600 border-orange-700 text-white shadow-[0_5px_0_#c2410c]",
    dot: "bg-orange-500",
  },
  {
    id: "olhos",
    titulo: "Olhos",
    opcoes: ["Olhos Castanhos", "Olhos Azuis", "Olhos Verdes"],
    surface: "bg-green-50 border-green-100 shadow-[0_5px_0_#8fd5b1,0_10px_18px_rgba(15,23,42,0.08)]",
    selected: "bg-green-700 border-green-800 text-white shadow-[0_5px_0_#166534]",
    dot: "bg-green-500",
  },
  {
    id: "oculos",
    titulo: "Acessórios",
    opcoes: ["Com Óculos", "Sem Óculos"],
    surface: "bg-slate-100 border-slate-200 shadow-[0_5px_0_#a8b3c3,0_10px_18px_rgba(15,23,42,0.08)]",
    selected: "bg-slate-600 border-slate-700 text-white shadow-[0_5px_0_#334155]",
    dot: "bg-slate-500",
  },
];

function RostoOpcao({ grupo, indice }: { grupo: string; indice: number }) {
  const cabelo = grupo === "textura" || grupo === "comprimento";
  const corCabelo = grupo === "textura" ? "#3b82f6" : "#f97316";
  const corOlhos = grupo === "olhos" ? ["#8b542a", "#38bdf8", "#22c55e"][indice] : "#334155";

  return (
    <svg viewBox="0 0 80 80" className="size-14 shrink-0 sm:size-16" fill="none" aria-hidden="true" focusable="false">
      {/* O cabelo fica atrás do rosto; a franja é desenhada por cima. */}
      {cabelo && (
        grupo === "textura" && indice === 0 ? (
          <g fill={corCabelo}>
            {[ [22, 23], [33, 19], [45, 19], [57, 23], [18, 34], [61, 34], [17, 46], [63, 46], [24, 53], [56, 53] ].map(([cx, cy], i) => <circle key={i} cx={cx} cy={cy} r="9" />)}
          </g>
        ) : grupo === "textura" && indice === 1 ? (
          <path d="M40 12C32 5 20 9 17 19C15 26 7 27 9 35C11 42 5 45 8 52C11 58 7 63 12 68C16 72 15 76 23 74L31 65H49L57 74C65 76 64 70 68 66C74 60 68 56 72 49C76 42 68 38 71 31C74 23 63 23 62 17C60 8 48 5 40 12Z" fill={corCabelo} />
        ) : (
          <path
            d={grupo === "comprimento" && indice === 0
              ? "M17 40C17 7 63 7 63 40L59 49H21Z"
              : grupo === "comprimento" && indice === 1
                ? "M16 39C16 6 64 6 64 39V71H51V47H29V71H16Z"
                : grupo === "comprimento" && indice === 2
                  ? "M14 39C14 5 66 5 66 39V77Q59 80 51 77V47H29V77Q21 80 14 77Z"
                  : "M16 39C16 6 64 6 64 39V71H51V47H29V71H16Z"}
            fill={corCabelo}
          />
        )
      )}
      <ellipse cx="40" cy="43" rx="21" ry="26" fill="#ffead8" stroke="#334155" strokeWidth="3" />
      {!cabelo && <path d="M23 29C29 16 51 16 57 29C47 21 33 21 23 29Z" fill="#94a3b8" />}
      {cabelo && (
        grupo === "textura" && indice === 0 ? (
          <g fill={corCabelo}>
            <circle cx="26" cy="23" r="9" /><circle cx="40" cy="21" r="10" /><circle cx="54" cy="23" r="9" />
          </g>
        ) : grupo === "textura" && indice === 1 ? (
          <>
            {/* Une raie souple et deux mèches continues encadrent le visage. */}
            <path d="M40 13C31 8 20 14 18 25C17 33 12 35 17 43C22 50 13 54 17 61C22 68 15 70 21 74L28 71C22 65 29 61 24 54C19 47 26 43 22 36C19 29 27 23 33 23Q38 23 40 18Q44 23 50 23C57 23 61 29 58 36C54 43 62 47 57 54C52 61 59 65 53 72L60 74C66 70 59 66 64 60C69 53 60 49 65 42C70 35 63 31 63 25C62 14 50 8 40 13Z" fill={corCabelo} />
            <g stroke="#2457a6" strokeWidth="2" strokeLinecap="round">
              <path d="M37 15C28 12 21 19 21 27C21 34 15 36 20 43C25 50 17 54 21 61C25 67 21 70 22 71" />
              <path d="M44 15C53 12 60 20 60 27C59 34 66 36 61 43C56 50 64 54 60 61C56 67 60 70 59 71" />
            </g>
          </>
        ) : (
          <path d="M19 31C20 9 60 9 61 31L50 27Q40 35 29 27Z" fill={corCabelo} />
        )
      )}
      <circle cx="32" cy="43" r={grupo === "olhos" ? 5.5 : 3.2} fill={corOlhos} stroke="#334155" strokeWidth={grupo === "olhos" ? 1.5 : 0} />
      <circle cx="49" cy="43" r={grupo === "olhos" ? 5.5 : 3.2} fill={corOlhos} stroke="#334155" strokeWidth={grupo === "olhos" ? 1.5 : 0} />
      <path d="M33 57Q40 64 48 57" stroke="#334155" strokeWidth="3" strokeLinecap="round" />
      {grupo === "oculos" && indice === 0 && (
        <g stroke="#334155" strokeWidth="3">
          <circle cx="30" cy="43" r="10" /><circle cx="51" cy="43" r="10" />
          <path d="M40 42H41M20 41L16 39M61 41L65 39" strokeLinecap="round" />
        </g>
      )}
    </svg>
  );
}

export default function GeniusGame({ back }: Props) {
  const [selecoes, setSelecoes] = useState<Record<string, string>>({});

  return (
    <div className="min-h-dvh text-ink">
      <header className="border-b border-slate-200 bg-white/95 pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3 px-4 py-4 sm:px-8">
          <button
            type="button"
            onClick={back}
            aria-label="Voltar ao menu"
            className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 shadow-[0_3px_0_#cbd5e1] transition-transform active:translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600 motion-reduce:transform-none motion-reduce:transition-none"
          >
            <ArrowLeft size={20} aria-hidden="true" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-sm font-bold leading-snug tracking-tight sm:text-lg">Módulo Adivinhação: Perfil</h1>
            <span className="mt-1 inline-flex items-center gap-1.5 text-xs font-medium text-slate-600">
              <span className="size-1.5 rounded-full bg-slate-400" aria-hidden="true" />
              Pronto para começar
            </span>
          </div>
          <span className="ml-auto rounded-full bg-blue-50 px-3 py-2 text-xs font-semibold tabular-nums text-blue-700" aria-label="Tentativas: zero de seis">
            Tentativa 00/06
          </span>
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl gap-6 px-4 py-6 sm:px-8 sm:py-8 md:grid-cols-[minmax(0,1fr)_15rem] md:items-start">
        <section aria-labelledby="genius-instrucoes" className="rounded-3xl border border-slate-100 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)] sm:p-6">
          <h2 id="genius-instrucoes" className="flex items-start gap-2 text-base font-bold leading-snug sm:text-lg">
            <span className="mt-2 size-2 shrink-0 rounded-full bg-slate-400" aria-hidden="true" />
            A máquina vai adivinhar suas características em até 6 tentativas.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            Pense em um traço de cada categoria: textura e comprimento do cabelo, olhos e óculos.
          </p>
          <div className="mt-4 grid grid-cols-6 gap-1.5" aria-label="Nenhuma das seis tentativas foi usada">
            {Array.from({ length: 6 }, (_, i) => <span key={i} className="h-1 rounded-full bg-slate-200" />)}
          </div>
        </section>

        <aside aria-labelledby="espaco-busca" className="rounded-3xl border border-slate-100 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)] md:col-start-2 md:row-start-1">
          <h2 id="espaco-busca" className="text-xs font-semibold uppercase tracking-wide text-slate-600">Espaço de busca</h2>
          <p className="mt-2 text-sm text-slate-600"><strong className="text-3xl font-extrabold tabular-nums text-ink">54</strong> / 54 candidatos</p>
          <div className="mt-3 h-2 rounded-full bg-slate-100" aria-hidden="true" />
          <p className="mt-3 text-xs leading-relaxed text-slate-600">Busca reduzida em <b>0%</b> · Restam no máximo <b>6 perguntas</b>.</p>
        </aside>

        <div className="flex min-w-0 flex-col gap-6 md:col-start-1">
          {grupos.map((grupo) => (
            <fieldset key={grupo.id} className="min-w-0">
              <legend className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600">
                <span className={`size-1.5 rounded-full ${grupo.dot}`} aria-hidden="true" />
                {grupo.titulo}
              </legend>
              <div className={`grid gap-2.5 sm:gap-4 ${grupo.opcoes.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
                {grupo.opcoes.map((opcao, indice) => {
                  const selecionada = selecoes[grupo.id] === opcao;
                  return (
                    <button
                      type="button"
                      key={opcao}
                      aria-pressed={selecionada}
                      onClick={() => setSelecoes((atual) => ({ ...atual, [grupo.id]: selecionada ? "" : opcao }))}
                      className={`relative flex min-h-28 min-w-0 flex-col items-center justify-center gap-2 rounded-2xl border px-2 py-5 text-center text-xs font-bold leading-snug transition-[transform,background-color,color] duration-150 active:translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600 motion-reduce:transform-none motion-reduce:transition-none sm:min-h-36 sm:px-4 sm:text-sm ${selecionada ? grupo.selected : grupo.surface}`}
                    >
                      <RostoOpcao grupo={grupo.id} indice={indice} />
                      <span className="font-extrabold">{opcao}</span>
                      {selecionada && <span className="inline-flex items-center gap-1 text-[10px] font-medium"><Check size={12} aria-hidden="true" /> Selecionado</span>}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ))}

          <div className="pb-4">
            <button type="button" className="flex min-h-12 w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-slate-700 px-5 py-3 text-sm font-semibold text-white shadow-[0_4px_0_#1e293b]">
              <Play size={16} aria-hidden="true" /> Começar
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
