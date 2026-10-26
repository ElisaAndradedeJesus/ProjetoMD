export const categorias = {
  textura: ["Cabelo Cacheado", "Cabelo Ondulado", "Cabelo Liso"],
  comprimento: ["Cabelo Curto", "Cabelo Médio", "Cabelo Longo"],
  olhos: ["Olhos Castanhos", "Olhos Azuis", "Olhos Verdes"],
  oculos: ["Com Óculos", "Sem Óculos"],
};
export type Categoria = keyof typeof categorias;
export type Perfil = Record<Categoria, string>;
export type Pergunta = { categoria: Categoria; opcao: string; texto: string };
export type Estado = {
  id: string;
  status: "jogando" | "palpite" | "descobriu" | "sem_correspondencia" | "limite";
  usadas: number;
  candidatos: Perfil[];
  pergunta: Pergunta | null;
  historico: { pergunta: Pergunta; resposta: boolean }[];
  perfil: Perfil | null;
};
export interface ServicoGenius {
  iniciarPartida(): Promise<Estado>;
  responder(id: string, resposta: boolean): Promise<Estado>;
  confirmar(id: string, acertou: boolean): Promise<Estado>;
}
export const perfis: Perfil[] = categorias.textura.flatMap(textura =>
  categorias.comprimento.flatMap(comprimento => categorias.olhos.flatMap(olhos =>
    categorias.oculos.map(oculos => ({ textura, comprimento, olhos, oculos })))));

// Minimiza o maior grupo restante com desempate aleatório e abertura dinâmica.
export function escolherPergunta(candidatos: Perfil[]): Pergunta | null {
  if (candidatos.length <= 1) return null;

  // Na 1ª pergunta: sorteia aleatoriamente entre qualquer categoria e opção
  if (candidatos.length === perfis.length) {
    const cats = Object.keys(categorias) as Categoria[];
    const cat = cats[Math.floor(Math.random() * cats.length)];
    const opcoes = categorias[cat];
    const opcao = opcoes[Math.floor(Math.random() * opcoes.length)];
    return { categoria: cat, opcao, texto: `O perfil possui ${opcao.toLocaleLowerCase("pt-BR")}?` };
  }

  let candidatas: Pergunta[] = [];
  let menorCusto = Infinity;
  for (const categoria of Object.keys(categorias) as Categoria[]) {
    for (const opcao of categorias[categoria]) {
      const sim = candidatos.filter(p => p[categoria] === opcao).length;
      if (sim === 0 || sim === candidatos.length) continue;
      const piorGrupo = Math.max(sim, candidatos.length - sim);
      if (piorGrupo < menorCusto) {
        menorCusto = piorGrupo;
        candidatas = [{ categoria, opcao, texto: `O perfil possui ${opcao.toLocaleLowerCase("pt-BR")}?` }];
      } else if (piorGrupo === menorCusto) {
        candidatas.push({ categoria, opcao, texto: `O perfil possui ${opcao.toLocaleLowerCase("pt-BR")}?` });
      }
    }
  }
  return candidatas.length > 0 ? candidatas[Math.floor(Math.random() * candidatas.length)] : null;
}

export function criarServicoLocal(): ServicoGenius {
  const partidas = new Map<string, Estado>();
  return {
    async iniciarPartida() {
      // Uma nova partida substitui a anterior deste serviço.
      partidas.clear();
      const estado: Estado = { id: crypto.randomUUID(), status: "jogando", usadas: 0,
        candidatos: structuredClone(perfis), pergunta: escolherPergunta(perfis), historico: [], perfil: null };
      partidas.set(estado.id, estado);
      return structuredClone(estado);
    },
    async responder(id, resposta) {
      if (typeof resposta !== "boolean") throw new Error("Resposta inválida: use Sim ou Não.");
      const anterior = partidas.get(id);
      if (!anterior) throw new Error("Partida não encontrada. Inicie uma nova partida.");
      if (anterior.status !== "jogando" || !anterior.pergunta) throw new Error("Esta partida já terminou.");
      const pergunta = anterior.pergunta;
      const candidatos = anterior.candidatos.filter(p => (p[pergunta.categoria] === pergunta.opcao) === resposta);
      const usadas = anterior.usadas + 1;
      const status = candidatos.length === 1 ? "palpite" : usadas >= 7 ? "limite" : "jogando";
      const estado: Estado = { id, status, usadas, candidatos,
        pergunta: status === "jogando" ? escolherPergunta(candidatos) : null,
        historico: [...anterior.historico, { pergunta, resposta }],
        perfil: status === "palpite" ? candidatos[0] : null };
      partidas.set(id, estado);
      return structuredClone(estado);
    },
    async confirmar(id, acertou) {
      if (typeof acertou !== "boolean") throw new Error("Confirmação inválida: use Sim ou Não.");
      const anterior = partidas.get(id);
      if (!anterior) throw new Error("Partida não encontrada. Inicie uma nova partida.");
      if (anterior.status !== "palpite") throw new Error("Não há palpite aguardando confirmação.");
      const estado: Estado = { ...anterior, status: acertou ? "descobriu" : "sem_correspondencia" };
      partidas.set(id, estado);
      return structuredClone(estado);
    },
  };
}

export function criarServicoApi(base: string, solicitar: typeof fetch = fetch): ServicoGenius {
  async function post(caminho: string, body?: unknown): Promise<Estado> {
    let response: Response;
    try {
      response = await solicitar(`${base.replace(/\/$/, "")}${caminho}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(10000),
      });
    } catch { throw new Error("Não foi possível conectar à API do Genius. Tente novamente ou inicie uma partida local."); }
    if (!response.ok) throw new Error(`A API do Genius retornou erro ${response.status}.`);
    return response.json();
  }
  return {
    iniciarPartida: () => post("/genius"),
    responder: (id, resposta) => post(`/genius/${encodeURIComponent(id)}/resposta`, { resposta }),
    confirmar: (id, acertou) => post(`/genius/${encodeURIComponent(id)}/confirmacao`, { acertou }),
  };
}
