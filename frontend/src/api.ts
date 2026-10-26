/**
 * camada de acesso do backend
 */

export const apiUrl = (import.meta.env.VITE_API_URL ?? "http://localhost:8000").replace(/\/$/, "");

export type resultado = "maior" | "menor" | "acertou";

/*-- modo 1 --*/

export type estadoDesafio = {
    id: string;
    modo: "desafiarMaquina";
    intervalo: [number, number];
    status: "jogando" | "venceu" | "perdeu";
    tentativas_usadas: number;
    tentativas_restantes: number;
    max_tentativas: number;
    historico: { numero: number; resultado: resultado }[];
    /** Só vem preenchido quando a partida termina. */
    segredo: number | null;
};

/* ---------- Modo 2: Máquina Vidente ---------- */

export type PassoVidente = {
    numero: number;
    intervalo: [number, number];
    candidatos: number;
    pensamento: string;
    /** null enquanto o usuário ainda não respondeu a este palpite. */
    feedback: resultado | null;
};

export type EstadoVidente = {
    id: string;
    modo: "maquina_vidente";
    intervalo: [number, number];
    intervalo_ativo: [number, number];
    candidatos: number;
    status: "jogando" | "acertou" | "perdeu" | "inconsistente";
    palpite_atual: number | null;
    ciclo: number;
    max_tentativas: number;
    historico: PassoVidente[];
};

/* ---------- HTTP ---------- */

export class ApiError extends Error {
    constructor(
        message: string,
        /** Código HTTP; 0 quando o servidor nem respondeu. */
        public status: number,
    ) {
        super(message);
    }
}

export const errorMessage = (e: unknown) => (e instanceof Error ? e.message : "Erro inesperado.");

async function request<T>(path: string, init?: RequestInit): Promise<T> {
    let res: Response;
    try {
        res = await fetch(`${apiUrl}${path}`, {
        ...init,
        headers: { "Content-Type": "application/json" },
        });
    } catch {
        throw new ApiError("Sem conexão com o servidor.", 0);
    }

    if (!res.ok) {
        let msg = `Erro ${res.status} no servidor.`;
        try {
        // FastAPI: { detail: "texto" } (HTTPException) ou { detail: [{ msg }] } (validação)
        const body = await res.json();
        if (typeof body.detail === "string") msg = body.detail;
        else if (Array.isArray(body.detail) && body.detail[0]?.msg) msg = body.detail[0].msg;
        } catch {
        /* corpo sem JSON: mantém a mensagem padrão */
        }
        throw new ApiError(msg, res.status);
    }
    return res.json() as Promise<T>;
}

const post = <T>(path: string, body?: unknown) =>
  request<T>(path, { method: "POST", body: body === undefined ? undefined : JSON.stringify(body) });

export const iniciarDesafio = () => post<estadoDesafio>("/desafiar-maquina");

export const enviarPalpite = (id: string, numero: number) =>
  post<estadoDesafio>(`/desafiar-maquina/${id}/palpite`, { numero });

export const iniciarVidente = () => post<EstadoVidente>("/maquina-vidente");

export const enviarFeedback = (id: string, feedback: resultado) =>
  post<EstadoVidente>(`/maquina-vidente/${id}/feedback`, { feedback });

/* ---------- Modo 3: Akinator ---------- */

export type RespostaAkinator = "sim" | "nao" | "nsei" | "psim" | "pnao";
export type Divisao = { sim: number; nao: number };

export type PersonagemApi = { name: string; traits: string[] };

export type EstadoAkinator = {
    id: string;
    modo: "akinator";
    status: "jogando" | "palpite" | "acertou" | "errou";
    pergunta_atual: {
        traco: string;
        rotulo: string;
        texto: string;
        numero: number;
        divisao: Divisao;
    } | null;
    perguntas_feitas: number;
    total_perguntas: number;
    candidatos_restantes: string[];
    quantidade_restantes: number;
    historico: {
        traco: string;
        resposta: RespostaAkinator;
        candidatos_antes: number;
        candidatos_depois: number;
        divisao: Divisao;
    }[];
    palpite: PersonagemApi | null;
    /** null se teve "não sei"/"provavelmente". */
    caminho_na_arvore: ("sim" | "nao")[] | null;
};

export type EstrategiaAkinator = "metade" | "ordem_fixa" | "aleatoria";

export type NoArvore =
    | {
          tipo: "pergunta";
          profundidade: number;
          candidatos: number;
          traco: string;
          rotulo: string;
          texto: string;
          nomes: string[];
          sim: NoArvore;
          nao: NoArvore;
      }
    | {
          tipo: "palpite";
          profundidade: number;
          candidatos: number;
          personagem: string;
          nomes: string[];
      };

export type EstatisticasArvore = {
    personagens: number;
    altura: number;
    melhor_caso: number;
    media_perguntas: number;
    limite_teorico: number;
    nos_pergunta?: number;
    folhas?: number;
};

export type ArvoreAkinator = {
    estrategia: EstrategiaAkinator;
    estatisticas: EstatisticasArvore;
    arvore: NoArvore;
};

export type LinhaAnalise = { base: string } & Record<
    "linear" | "ordem_fixa" | "aleatoria" | "metade",
    EstatisticasArvore
>;

export const listarPersonagens = () => request<PersonagemApi[]>("/akinator/personagens");

export const iniciarAkinator = () => post<EstadoAkinator>("/akinator");

export const responderAkinator = (id: string, resposta: RespostaAkinator) =>
    post<EstadoAkinator>(`/akinator/${id}/resposta`, { resposta });

export const confirmarAkinator = (id: string, acertou: boolean) =>
    post<EstadoAkinator>(`/akinator/${id}/confirmacao`, { acertou });

export const buscarArvore = (estrategia: EstrategiaAkinator = "metade") =>
    request<ArvoreAkinator>(`/akinator/arvore?estrategia=${estrategia}`);

export const buscarAnalise = () => request<LinhaAnalise[]>("/akinator/analise");
