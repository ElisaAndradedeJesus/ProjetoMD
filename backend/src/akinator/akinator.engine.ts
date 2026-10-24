/**
 * Modo Akinator — o usuário pensa em um dos perfis e a máquina tenta
 * adivinhar quem é com perguntas de sim/não sobre os traços.
 * A regra é a mesma de frontend/src/Akinator.tsx:
 *
 *   custo(p) = soma das contradições entre as respostas e os traços de p
 *              (Sim/Não contraditório = 3, Provavelmente = 1,5, Não Sei = 0)
 *   p continua possível enquanto custo(p) < 3
 *   próxima pergunta = traço ainda não perguntado que divide os possíveis
 *                      mais perto da metade: min |nSim − n/2|
 *
 * Complexidade (n = perfis, k = traços):
 *   - Atualizar os custos depois de uma resposta ... O(n)
 *   - Escolher a próxima pergunta ................. O(k · n)
 *   - Partida: se cada Sim/Não cortasse os possíveis ao meio, bastariam
 *     ⌈log2 n⌉ perguntas (24 perfis -> 5). Os traços nem sempre dividem
 *     ao meio, então o número real pode ser um pouco maior.
 */
import { randomUUID } from "node:crypto";
import { ContadorOperacoes, log } from "../complexidade.ts";
import { PEOPLE, TRAITS } from "./akinator.data.ts";
import {
  TRAIT_KEYS,
  type AkinatorStateDTO,
  type AnswerId,
  type DeducedTraitDTO,
  type GuessDTO,
  type PersonDTO,
  type QuestionDTO,
  type ResultDTO,
  type TraitKey,
} from "./akinator.dto.ts";

const LIMITE_CUSTO = 3;
const CUSTO_FIRME = 3;
const CUSTO_PROVAVEL = 1.5;

/** Erro com o código HTTP que a rota deve devolver. */
export class AkinatorError extends Error {
  constructor(
    public status: 400 | 404 | 409,
    message: string,
  ) {
    super(message);
  }
}

type Resposta = { key: TraitKey; answer: AnswerId };

export class AkinatorGame {
  readonly contador = new ContadorOperacoes("Akinator");
  private readonly perfis: { pessoa: PersonDTO; tracos: Set<TraitKey> }[];
  private readonly custos: number[];
  private readonly respostas: Resposta[] = [];
  private proxima: { key: TraitKey; sim: number } | null = null;
  private palpite: GuessDTO | null = null;
  private resultado: ResultDTO | null = null;

  constructor(
    readonly sessionId: string = randomUUID(),
    pessoas: PersonDTO[] = PEOPLE,
    readonly maxPerguntas: number = TRAIT_KEYS.length,
  ) {
    // Set deixa a consulta "p tem o traço?" em O(1).
    this.perfis = pessoas.map((pessoa) => ({ pessoa, tracos: new Set(pessoa.traits) }));
    this.custos = pessoas.map(() => 0);
    const n = pessoas.length;
    log(`Nova partida: ${n} perfis, ${TRAIT_KEYS.length} traços, até ${maxPerguntas} perguntas`);
    log(`log2(${n}) = ${Math.log2(n).toFixed(2)} -> dividindo sempre ao meio bastariam ` +
      `${Math.ceil(Math.log2(n))} perguntas`);
    this.contador.medir("primeira pergunta", () => this.avancar());
  }

  private possiveis(): number[] {
    const indices: number[] = [];
    this.custos.forEach((custo, i) => {
      if (custo < LIMITE_CUSTO) indices.push(i);
    });
    return indices;
  }

  /** Escolhe a próxima pergunta ou, se não houver mais o que perguntar, fecha o palpite. */
  private avancar(): void {
    const possiveis = this.possiveis();
    this.proxima = possiveis.length > 1 && this.respostas.length < this.maxPerguntas
      ? this.escolherTraco(possiveis)
      : null;
    if (this.proxima) {
      const { key, sim } = this.proxima;
      log(`--- Pergunta ${this.respostas.length + 1}/${this.maxPerguntas}: ${TRAITS[key].label} ` +
        `-> Sim: ${sim} · Não: ${possiveis.length - sim} (ideal: ${possiveis.length / 2})`);
      return;
    }
    this.palpite = this.calcularPalpite(possiveis);
    log(`Palpite: ${this.palpite.person.name} (confiança ${(this.palpite.confidence * 100).toFixed(1)}%, ` +
      `motivo: ${this.palpite.reason})`);
    this.contador.imprimirResumo(
      "O(k · n) por pergunta; ~⌈log2 n⌉ perguntas quando os traços dividem ao meio",
      this.perfis.length,
    );
  }

  private escolherTraco(possiveis: number[]): { key: TraitKey; sim: number } | null {
    const perguntados = new Set(this.respostas.map((r) => r.key));
    const n = possiveis.length;
    let melhor: { key: TraitKey; sim: number } | null = null;
    let melhorDistancia = Infinity;
    let contagens = 0;
    for (const key of TRAIT_KEYS) {
      if (perguntados.has(key)) continue;
      const sim = possiveis.filter((i) => this.perfis[i].tracos.has(key)).length;
      contagens += n;
      // Um traço que todos (ou ninguém) têm não separa nada.
      if (sim === 0 || sim === n) continue;
      const distancia = Math.abs(sim - n / 2);
      if (distancia < melhorDistancia) {
        melhorDistancia = distancia;
        melhor = { key, sim };
      }
    }
    this.contador.registrar("contagem_particao", contagens, `traços restantes × ${n} possíveis`);
    return melhor;
  }

  private calcularPalpite(possiveis: number[]): GuessDTO {
    // Se as respostas eliminaram todos, chuta entre todos os perfis.
    const grupo = possiveis.length ? possiveis : this.perfis.map((_, i) => i);
    const peso = (i: number) => 2 ** (-this.custos[i] / CUSTO_PROVAVEL);
    let escolhido = grupo[0];
    for (const i of grupo) if (this.custos[i] < this.custos[escolhido]) escolhido = i;
    const somaPesos = grupo.reduce((soma, i) => soma + peso(i), 0);
    const { pessoa } = this.perfis[escolhido];
    return {
      person: pessoa,
      traitLabels: pessoa.traits.map((t) => TRAITS[t].label),
      confidence: Number((peso(escolhido) / somaPesos).toFixed(4)),
      reason: possiveis.length <= 1
        ? "unico_candidato"
        : this.respostas.length >= this.maxPerguntas
          ? "limite_perguntas"
          : "sem_traco_divisor",
    };
  }

  responder(questionKey: TraitKey, answer: AnswerId): void {
    if (!this.proxima) throw new AkinatorError(409, "A máquina já deu o palpite; confirme o resultado ou comece outra partida.");
    if (questionKey !== this.proxima.key) {
      throw new AkinatorError(409, `A pergunta atual é sobre "${TRAITS[this.proxima.key].label}", não "${TRAITS[questionKey].label}".`);
    }
    const antes = this.possiveis().length;
    log(`Resposta do usuário para ${TRAITS[questionKey].label}: ${answer.toUpperCase()}`);

    // Só este bloco é cronometrado: o tempo que o usuário leva respondendo fica de fora.
    this.contador.medir(`resposta '${answer}' para ${questionKey}`, () => {
      this.respostas.push({ key: questionKey, answer });
      this.contador.registrar("insercao_historico", 1, "Array.push é O(1)");
      if (answer !== "nsei") {
        const disseSim = answer === "sim" || answer === "psim";
        const custo = answer === "sim" || answer === "nao" ? CUSTO_FIRME : CUSTO_PROVAVEL;
        this.perfis.forEach(({ tracos }, i) => {
          if (tracos.has(questionKey) !== disseSim) this.custos[i] += custo;
        });
        this.contador.registrar("atualizacao_custo", this.perfis.length, "um custo por perfil: O(n)");
      }
      const depois = this.possiveis().length;
      log(`Possíveis: ${antes} -> ${depois} (reduziu ${(100 * (1 - depois / antes)).toFixed(0)}%)`);
      this.avancar();
    });
  }

  confirmar(correct: boolean): void {
    if (!this.palpite) throw new AkinatorError(409, "A máquina ainda não deu o palpite.");
    if (this.resultado) throw new AkinatorError(409, "O resultado desta partida já foi confirmado.");
    this.resultado = { correct, questionsAsked: this.respostas.length };
    log(`Resultado confirmado: a máquina ${correct ? "acertou" : "errou"} em ${this.respostas.length} perguntas`);
  }

  estado(): AkinatorStateDTO {
    const possiveis = this.possiveis();
    const deduzido = (r: Resposta): DeducedTraitDTO => ({
      key: r.key,
      label: TRAITS[r.key].label,
      answer: r.answer,
      tentative: r.answer === "psim" || r.answer === "pnao",
    });
    const base = {
      sessionId: this.sessionId,
      remaining: possiveis.length,
      candidates: this.perfis.map(({ pessoa }, i) => ({
        ...pessoa,
        possible: this.custos[i] < LIMITE_CUSTO,
        cost: this.custos[i],
      })),
      deduced: {
        confirmed: this.respostas.filter((r) => r.answer === "sim" || r.answer === "psim").map(deduzido),
        eliminated: this.respostas.filter((r) => r.answer === "nao" || r.answer === "pnao").map(deduzido),
      },
      progress: {
        answered: this.respostas.length,
        total: this.maxPerguntas,
        percent: Math.round((this.respostas.length / this.maxPerguntas) * 100),
      },
      complexidade: this.contador.resumo(),
    };

    if (this.proxima) {
      const { key, sim } = this.proxima;
      const question: QuestionDTO = {
        key,
        text: `O personagem que você pensou ${TRAITS[key].question}`,
        number: this.respostas.length + 1,
        split: { yes: sim, no: possiveis.length - sim },
      };
      return { ...base, phase: "pergunta", question, guess: null, result: null };
    }
    const guess = this.palpite!;
    if (this.resultado) return { ...base, phase: "fim", question: null, guess, result: this.resultado };
    return { ...base, phase: "palpite", question: null, guess, result: null };
  }
}
