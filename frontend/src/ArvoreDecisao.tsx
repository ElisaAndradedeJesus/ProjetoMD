import { useEffect, useMemo, useState, type ReactNode } from "react";
import { GitBranch, X } from "lucide-react";
import {
  buscarAnalise,
  buscarArvore,
  errorMessage,
  type ArvoreAkinator,
  type EstrategiaAkinator,
  type LinhaAnalise,
  type NoArvore,
} from "./api.ts";

type Caminho = ("sim" | "nao")[] | null;

const ESTRATEGIAS: { id: EstrategiaAkinator; label: string }[] = [
  { id: "metade", label: "Dividir ao meio (a nossa)" },
  { id: "ordem_fixa", label: "Ordem fixa" },
  { id: "aleatoria", label: "Aleatória" },
];

const COLUNAS = [
  { id: "linear", label: "Um por um" },
  { id: "ordem_fixa", label: "Ordem fixa" },
  { id: "aleatoria", label: "Aleatória" },
  { id: "metade", label: "Dividir ao meio" },
] as const;

const GREEN = "#22c55e";
const ORANGE = "#f97316";
const COL = 158; // espaço entre níveis
const ROW = 36; // espaço entre folhas
const NODE_W = 128;
const NODE_H = 30;
const PAD = 20;

type Posicionado = {
  id: string; // "" = raiz, "sn" = sim e depois não
  no: NoArvore;
  x: number;
  y: number;
  filhos: { resp: "sim" | "nao"; alvo: Posicionado }[];
};

// folhas empilhadas, cada pai na altura do meio dos filhos
function posicionar(raiz: NoArvore) {
  let folha = 0;
  const nos: Posicionado[] = [];
  const visitar = (no: NoArvore, id: string): Posicionado => {
    const x = PAD + no.profundidade * COL;
    if (no.tipo === "palpite") {
      const p = { id, no, x, y: PAD + folha++ * ROW, filhos: [] };
      nos.push(p);
      return p;
    }
    const sim = visitar(no.sim, id + "s");
    const nao = visitar(no.nao, id + "n");
    const p: Posicionado = {
      id,
      no,
      x,
      y: (sim.y + nao.y) / 2,
      filhos: [
        { resp: "sim", alvo: sim },
        { resp: "nao", alvo: nao },
      ],
    };
    nos.push(p);
    return p;
  };
  visitar(raiz, "");
  const profundidade = Math.max(...nos.map((n) => n.no.profundidade));
  return {
    nos,
    largura: PAD * 2 + profundidade * COL + 140,
    altura: PAD * 2 + (folha - 1) * ROW + NODE_H,
  };
}

function Estat({ titulo, valor, detalhe }: { titulo: string; valor: ReactNode; detalhe?: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{titulo}</p>
      <p className="mt-1 text-2xl font-extrabold text-ink tabular-nums">{valor}</p>
      {detalhe && <p className="mt-0.5 text-xs text-slate-500">{detalhe}</p>}
    </div>
  );
}

export default function ArvoreDecisao({
  path,
  avatar,
  onClose,
}: {
  path: Caminho;
  avatar: (name: string) => ReactNode;
  onClose: () => void;
}) {
  const [estrategia, setEstrategia] = useState<EstrategiaAkinator>("metade");
  const [dados, setDados] = useState<ArvoreAkinator | null>(null);
  const [analise, setAnalise] = useState<LinhaAnalise[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;
    setDados(null);
    buscarArvore(estrategia)
      .then((d) => ativo && setDados(d))
      .catch((e) => ativo && setErro(errorMessage(e)));
    return () => {
      ativo = false;
    };
  }, [estrategia]);

  useEffect(() => {
    buscarAnalise()
      .then(setAnalise)
      .catch(() => setAnalise([]));
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const layout = useMemo(() => (dados ? posicionar(dados.arvore) : null), [dados]);

  // o jogo usa a "metade", então o caminho só vale nessa aba
  const caminhoAtivo = estrategia === "metade" && path && path.length > 0 ? path : null;
  const noCaminho = useMemo(() => {
    const ids = new Set<string>();
    if (!caminhoAtivo) return ids;
    let id = "";
    ids.add(id);
    for (const r of caminhoAtivo) {
      id += r === "sim" ? "s" : "n";
      ids.add(id);
    }
    return ids;
  }, [caminhoAtivo]);
  const atual = caminhoAtivo ? caminhoAtivo.map((r) => (r === "sim" ? "s" : "n")).join("") : null;
  const apagar = (id: string) => (caminhoAtivo && !noCaminho.has(id) ? 0.28 : 1);

  const est = dados?.estatisticas;

  return (
    <div
      className="fixed inset-0 z-30 flex items-stretch justify-center bg-slate-900/40 p-2 backdrop-blur-sm sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Árvore de decisão"
      onClick={onClose}
    >
      <div
        className="pop flex w-full max-w-6xl flex-col overflow-hidden rounded-3xl bg-white shadow-[0_30px_80px_rgba(15,23,42,0.35)]"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 sm:px-8">
          <span className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <GitBranch size={22} strokeWidth={2.5} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold text-ink sm:text-xl">Árvore de decisão</h2>
            <p className="text-xs text-slate-500 sm:text-sm">
              Cada caixa é uma pergunta, cada folha é um personagem. Nº de perguntas = profundidade da folha.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="flex size-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-8">
          <div className="flex flex-wrap gap-2" role="tablist">
            {ESTRATEGIAS.map((e) => (
              <button
                key={e.id}
                role="tab"
                aria-selected={estrategia === e.id}
                onClick={() => setEstrategia(e.id)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  estrategia === e.id ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {e.label}
              </button>
            ))}
          </div>

          {erro && <p className="mt-4 rounded-2xl bg-orange-50 px-4 py-3 text-sm text-orange-800">{erro}</p>}

          {est && (
            <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Estat
                titulo="Pior caso"
                valor={`${est.altura} perguntas`}
                detalhe={`altura da árvore · mínimo possível ⌈log₂ ${est.personagens}⌉ = ${est.limite_teorico}`}
              />
              <Estat titulo="Média" valor={est.media_perguntas.toFixed(2).replace(".", ",")} detalhe="perguntas por personagem" />
              <Estat titulo="Perguntas na árvore" valor={est.nos_pergunta ?? "-"} detalhe={`n − 1 = ${est.personagens - 1} nós internos`} />
              <Estat titulo="Folhas" valor={est.folhas ?? "-"} detalhe="um personagem em cada" />
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-slate-600">
            <span className="flex items-center gap-1.5">
              <span className="h-1 w-5 rounded" style={{ background: GREEN }} /> Sim
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1 w-5 rounded" style={{ background: ORANGE }} /> Não
            </span>
            {estrategia === "metade" && (
              <span className="text-slate-500">
                {caminhoAtivo
                  ? "Caminho da sua partida aceso."
                  : path === null
                    ? "Sua partida usou “Não sei” ou “Provavelmente”, então saiu da árvore."
                    : "Responda perguntas para ver o caminho aceso."}
              </span>
            )}
          </div>

          <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-100 bg-slate-50/60">
            {!layout ? (
              <p className="p-10 text-center text-sm font-semibold text-slate-500">{erro ? "" : "Montando a árvore..."}</p>
            ) : (
              <svg
                width={layout.largura}
                height={layout.altura}
                viewBox={`0 0 ${layout.largura} ${layout.altura}`}
                role="img"
                aria-label={`Árvore de decisão com altura ${est?.altura}`}
                className="block"
              >
                {layout.nos.flatMap((pai) =>
                  pai.filhos.map(({ resp, alvo }) => {
                    const x1 = pai.x + NODE_W;
                    const y1 = pai.y + NODE_H / 2;
                    const x2 = alvo.x;
                    const y2 = alvo.y + NODE_H / 2;
                    const meio = (x1 + x2) / 2;
                    const aceso = noCaminho.has(alvo.id);
                    return (
                      <path
                        key={alvo.id}
                        d={`M${x1},${y1} C${meio},${y1} ${meio},${y2} ${x2},${y2}`}
                        fill="none"
                        stroke={resp === "sim" ? GREEN : ORANGE}
                        strokeWidth={aceso ? 4 : 2}
                        opacity={apagar(alvo.id)}
                      />
                    );
                  }),
                )}
                {layout.nos.map(({ id, no, x, y }) => {
                  const ehAtual = id === atual;
                  if (no.tipo === "pergunta") {
                    return (
                      <g key={id || "raiz"} opacity={apagar(id)}>
                        <title>{`${no.texto} (${no.candidatos} candidatos)`}</title>
                        <rect
                          x={x}
                          y={y}
                          width={NODE_W}
                          height={NODE_H}
                          rx={10}
                          fill={noCaminho.has(id) ? "#2563eb" : "#ffffff"}
                          stroke={noCaminho.has(id) ? "#1d4ed8" : "#cbd5e1"}
                          strokeWidth={ehAtual ? 3 : 1.5}
                        />
                        <text
                          x={x + NODE_W / 2}
                          y={y + NODE_H / 2 + 4}
                          textAnchor="middle"
                          fontSize={11.5}
                          fontWeight={700}
                          fill={noCaminho.has(id) ? "#ffffff" : "#1f2937"}
                        >
                          {no.rotulo}?
                        </text>
                        <text x={x + NODE_W / 2} y={y - 4} textAnchor="middle" fontSize={9.5} fill="#64748b">
                          {no.candidatos} candidatos
                        </text>
                      </g>
                    );
                  }
                  return (
                    <g key={id} opacity={apagar(id)}>
                      <title>{`${no.nomes.join(", ")} · ${no.profundidade} perguntas`}</title>
                      {ehAtual && <circle cx={x + 15} cy={y + NODE_H / 2} r={19} fill="#bfdbfe" />}
                      <foreignObject x={x} y={y} width={NODE_H} height={NODE_H}>
                        <div className="size-full overflow-hidden rounded-full bg-white ring-2 ring-slate-200">
                          {avatar(no.personagem)}
                        </div>
                      </foreignObject>
                      <text x={x + NODE_H + 7} y={y + NODE_H / 2 + 4} fontSize={12} fontWeight={700} fill="#1f2937">
                        {no.nomes.join(" / ")}
                      </text>
                      <text x={x + NODE_H + 7} y={y + NODE_H / 2 + 16} fontSize={9.5} fill="#64748b">
                        {no.profundidade} perguntas
                      </text>
                    </g>
                  );
                })}
              </svg>
            )}
          </div>

          <section className="mt-8">
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">Comparando estratégias</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Perguntas por partida (<strong>média / pior caso</strong>). As bases sintéticas têm personagens inventados
              com a mesma frequência de traços dos 24 do jogo.
            </p>
            {analise === null ? (
              <p className="mt-4 text-sm text-slate-500">Calculando...</p>
            ) : analise.length === 0 ? (
              <p className="mt-4 text-sm text-orange-700">Não foi possível carregar a comparação.</p>
            ) : (
              <div className="mt-4 overflow-x-auto rounded-2xl ring-1 ring-slate-100">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Base</th>
                      <th className="px-4 py-3 text-right font-semibold normal-case">⌈log₂ n⌉</th>
                      {COLUNAS.map((c) => (
                        <th
                          key={c.id}
                          className={`px-4 py-3 text-right font-semibold ${c.id === "metade" ? "bg-blue-50 text-blue-800" : ""}`}
                        >
                          {c.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {analise.map((linha) => (
                      <tr key={linha.base}>
                        <td className="px-4 py-3 font-medium text-slate-700">{linha.base}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-slate-500">{linha.metade.limite_teorico}</td>
                        {COLUNAS.map((c) => (
                          <td
                            key={c.id}
                            className={`px-4 py-3 text-right tabular-nums ${
                              c.id === "metade" ? "bg-blue-50/60 font-bold text-blue-900" : "text-slate-700"
                            }`}
                          >
                            {linha[c.id].media_perguntas.toFixed(2).replace(".", ",")} / {linha[c.id].altura}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className="mt-4 text-xs leading-relaxed text-slate-500">
              Por que ninguém faz melhor que ⌈log₂ n⌉ no pior caso? Cada pergunta de sim/não tem 2 saídas, então uma
              árvore de altura h tem no máximo 2ʰ folhas. Para caber n personagens, 2ʰ ≥ n ⇒ h ≥ ⌈log₂ n⌉. Perguntar
              “um por um” vira uma árvore torta de altura n − 1, ou seja, O(n).
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
