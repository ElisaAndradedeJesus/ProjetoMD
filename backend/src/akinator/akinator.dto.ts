/**
 * Contratos HTTP do modo Akinator ("Módulo Dedução: Perfil").
 *
 * Fonte: protótipo Figma Make "Busca Binária Protótipo - Live" (versão 18) e
 * frontend/src/Akinator.tsx da branch feature/frontend-akinator, que hoje faz a
 * dedução inteira no navegador. Os nomes de campo seguem esse componente
 * (name, traits) e as respostas usam os mesmos ids dos botões.
 *
 * Rotas:
 *   GET  /api/akinator/people   -> PersonDTO[]       (o frontend já chama esta rota)
 *   POST /api/akinator/start    -> AkinatorStateDTO   phase "pergunta"
 *   POST /api/akinator/answer   -> AkinatorStateDTO   phase "pergunta" ou "palpite"
 *   POST /api/akinator/confirm  -> AkinatorStateDTO   phase "fim"
 * Erros: { detail: string }, o mesmo formato que frontend/src/api.ts já lê.
 */

/* ---------- domínio ---------- */

/** O Figma usa os 10 primeiros traços ("Pergunta 01 de 10"); a branch do frontend usa os 16. */
export const TRAIT_KEYS = [
  "curto",
  "loiro",
  "cacheado",
  "claros",
  "oculos",
  "barba",
  "chapeu",
  "sardas",
  "brincos",
  "sorriso",
  "bigode",
  "colar",
  "gravata",
  "ruivo",
  "maquiagem",
  "piercing",
] as const;
export type TraitKey = (typeof TRAIT_KEYS)[number];

/** Botões Sim (tecla 1), Não (2), Não Sei (3), Provavelmente Sim (4), Provavelmente Não (5). */
export const ANSWERS = ["sim", "nao", "nsei", "psim", "pnao"] as const;
export type AnswerId = (typeof ANSWERS)[number];

/** Perfil cru. O retrato SVG é desenhado no cliente a partir de `traits`. */
export interface PersonDTO {
  name: string;
  traits: TraitKey[];
}

/* ---------- requests ---------- */

/** POST /api/akinator/start, sem corpo. Também atende "Jogar de novo", "Tentar Novamente" e "Reiniciar dedução". */
export type StartRequestDTO = Record<string, never>;

/** POST /api/akinator/answer */
export interface AnswerRequestDTO {
  sessionId: string;
  /** Traço da pergunta que o usuário viu. Se não for a pergunta atual, responder 409 (clique + tecla duplicados). */
  questionKey: TraitKey;
  answer: AnswerId;
}

/** POST /api/akinator/confirm: botões "Sim" e "Tentar Novamente" do modal "A máquina acertou?". */
export interface ConfirmRequestDTO {
  sessionId: string;
  correct: boolean;
}

/* ---------- responses ---------- */

/** Card da grade "Candidatos": destacado se `possible`, esmaecido se não. */
export interface CandidateDTO extends PersonDTO {
  possible: boolean;
  /** Soma das contradições: Sim/Não = 3, Provavelmente = 1,5, Não Sei = 0. Eliminado quando cost >= 3. */
  cost: number;
}

/** Chip de "Traços deduzidos". `tentative` vem de Provavelmente Sim/Não (o "?" de "Sorrindo?"). */
export interface DeducedTraitDTO {
  key: TraitKey;
  label: string;
  answer: AnswerId;
  tentative: boolean;
}

/** Cartão central da pergunta. */
export interface QuestionDTO {
  key: TraitKey;
  /** Texto pronto: "O personagem que você pensou possui cabelo curto?" */
  text: string;
  /** Começa em 1: "Pergunta 01". */
  number: number;
  /** Painel "Como a máquina decide": candidatos possíveis com e sem o traço. */
  split: { yes: number; no: number };
}

export interface ProgressDTO {
  answered: number;
  /** Limite de perguntas: 10 no Figma, 16 na branch do frontend. */
  total: number;
  /** round(answered / total * 100). É a barra do cartão, não a confiança do palpite. */
  percent: number;
}

/** Por que a máquina parou de perguntar. */
export type GuessReason = "unico_candidato" | "limite_perguntas" | "sem_traco_divisor";

/** Modal "Palpite final". */
export interface GuessDTO {
  person: PersonDTO;
  /** Linha "Cabelo curto · Cabelo cacheado · Barba · Olhos claros". */
  traitLabels: string[];
  /**
   * De 0 a 1. peso(p) = 2^(-cost(p) / 1,5) e confiança = peso(palpite) / soma dos pesos dos possíveis.
   * O Figma ainda não mostra esse número.
   */
  confidence: number;
  reason: GuessReason;
}

/** Modal "Resultado". */
export interface ResultDTO {
  correct: boolean;
  /** "A máquina acertou em 6 perguntas!" */
  questionsAsked: number;
}

/** Mesmo bloco `complexidade` que os modos em Python devolvem em toda resposta. */
export interface ComplexidadeDTO {
  operacoes_por_tipo: Record<string, number>;
  total_operacoes: number;
  tempo_ms: number;
  etapas_medidas: number;
}

interface StateBase {
  sessionId: string;
  /** Badge "12 Candidatos Restantes" e contador "N de M". */
  remaining: number;
  candidates: CandidateDTO[];
  deduced: { confirmed: DeducedTraitDTO[]; eliminated: DeducedTraitDTO[] };
  progress: ProgressDTO;
  complexidade: ComplexidadeDTO;
}

/** O badge do cabeçalho mostra "Deduzindo" em "pergunta" e "Palpite pronto" nas outras fases. */
export type AkinatorStateDTO =
  | (StateBase & { phase: "pergunta"; question: QuestionDTO; guess: null; result: null })
  | (StateBase & { phase: "palpite"; question: null; guess: GuessDTO; result: null })
  | (StateBase & { phase: "fim"; question: null; guess: GuessDTO; result: ResultDTO });

export interface ErrorDTO {
  detail: string;
}

/* ---------- validação dos corpos ---------- */

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null;

export const isTraitKey = (v: unknown): v is TraitKey => TRAIT_KEYS.some((k) => k === v);

export const isAnswerId = (v: unknown): v is AnswerId => ANSWERS.some((a) => a === v);

export function isAnswerRequest(body: unknown): body is AnswerRequestDTO {
  return (
    isObject(body) &&
    typeof body.sessionId === "string" &&
    isTraitKey(body.questionKey) &&
    isAnswerId(body.answer)
  );
}

export function isConfirmRequest(body: unknown): body is ConfirmRequestDTO {
  return isObject(body) && typeof body.sessionId === "string" && typeof body.correct === "boolean";
}
