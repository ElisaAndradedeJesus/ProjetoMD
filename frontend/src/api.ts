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
