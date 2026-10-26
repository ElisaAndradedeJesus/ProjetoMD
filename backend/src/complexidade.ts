/**
 * Ferramentas para observar a complexidade (Big O) durante a execução.
 * Versão TypeScript de app/complexidade.py: mesmos prints [BIG-O] e mesmo
 * formato de resumo, para o Akinator aparecer igual aos outros modos.
 *
 * Para desligar os prints: variável de ambiente BIGO_VERBOSE=0
 */
import { performance } from "node:perf_hooks";
import type { ComplexidadeDTO } from "./akinator/akinator.dto.ts";

// Tempo gasto imprimindo os logs. É descontado das medições para que
// o tempo reportado seja só o do algoritmo, não o do print no terminal.
let tempoEmLog = 0;

export function log(msg: string): void {
  // Lido a cada chamada para que os testes possam desligar os prints.
  if (process.env.BIGO_VERBOSE === "0") return;
  const t0 = performance.now();
  console.log(`[BIG-O] ${msg}`);
  tempoEmLog += performance.now() - t0;
}

/**
 * Conta operações elementares por categoria e soma o tempo de processamento.
 * O tempo NÃO é medido do início ao fim da partida (isso incluiria o tempo que
 * o usuário leva para responder): cada etapa é medida com `medir()` e somada.
 */
export class ContadorOperacoes {
  private operacoes: Record<string, number> = {};
  private tempoTotalMs = 0;
  private etapasMedidas = 0;

  constructor(private nome: string) {}

  /** Mede o tempo de um bloco de código, descontando o tempo dos prints. */
  medir<T>(rotulo: string, bloco: () => T): T {
    const logAntes = tempoEmLog;
    const t0 = performance.now();
    try {
      return bloco();
    } finally {
      const gasto = performance.now() - t0 - (tempoEmLog - logAntes);
      this.tempoTotalMs += gasto;
      this.etapasMedidas += 1;
      log(`${this.nome}: tempo de processamento de '${rotulo}' = ${gasto.toFixed(4)} ms ` +
        `(acumulado: ${this.tempoTotalMs.toFixed(4)} ms)`);
    }
  }

  registrar(tipo: string, quantidade = 1, detalhe = ""): void {
    this.operacoes[tipo] = (this.operacoes[tipo] ?? 0) + quantidade;
    const extra = detalhe ? ` -> ${detalhe}` : "";
    log(`${this.nome}: +${quantidade} ${tipo} (total ${tipo}: ${this.operacoes[tipo]})${extra}`);
  }

  get total(): number {
    return Object.values(this.operacoes).reduce((soma, qtd) => soma + qtd, 0);
  }

  resumo(): ComplexidadeDTO {
    return {
      operacoes_por_tipo: { ...this.operacoes },
      total_operacoes: this.total,
      tempo_ms: Number(this.tempoTotalMs.toFixed(4)),
      etapas_medidas: this.etapasMedidas,
    };
  }

  imprimirResumo(complexidadeTeorica: string, n: number): void {
    log("=".repeat(60));
    log(`RESUMO: ${this.nome}`);
    log(`  n (tamanho da entrada)     = ${n}`);
    log(`  log2(n)                    = ${Math.log2(n).toFixed(2)}`);
    log(`  teto(log2(n)) = ideal      = ${Math.ceil(Math.log2(n))} perguntas`);
    for (const [tipo, qtd] of Object.entries(this.operacoes)) log(`  ${tipo.padEnd(27)}= ${qtd}`);
    log(`  total de operações         = ${this.total}`);
    log(`  etapas medidas             = ${this.etapasMedidas}`);
    log(`  tempo de processamento     = ${this.tempoTotalMs.toFixed(4)} ms (soma das etapas, sem prints)`);
    if (this.etapasMedidas) {
      log(`  tempo médio por etapa      = ${(this.tempoTotalMs / this.etapasMedidas).toFixed(4)} ms`);
    }
    log(`  complexidade teórica       = ${complexidadeTeorica}`);
    log("=".repeat(60));
  }
}
