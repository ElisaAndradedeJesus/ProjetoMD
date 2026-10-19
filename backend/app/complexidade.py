"""
Ferramentas para observar a complexidade (Big O) durante a execução.

Cada operação relevante (comparação, atribuição, inserção no histórico...)
é registrada em um ContadorOperacoes. Os prints mostram, passo a passo,
quanto trabalho foi feito e qual é a complexidade teórica esperada.

Para desligar os prints: variável de ambiente BIGO_VERBOSE=0
"""
import math
import os
import time
from contextlib import contextmanager

VERBOSE = os.getenv("BIGO_VERBOSE", "1") != "0"

# Tempo gasto imprimindo os logs. É descontado das medições para que
# o tempo reportado seja só o do algoritmo, não o do print no terminal.
_tempo_em_log = 0.0


def log(msg: str) -> None:
    global _tempo_em_log
    if VERBOSE:
        t0 = time.perf_counter()
        print(f"[BIG-O] {msg}")
        _tempo_em_log += time.perf_counter() - t0

class ContadorOperacoes:
    """Conta operações elementares por categoria e soma o tempo de processamento.

    O tempo NÃO é medido do início ao fim da partida (isso incluiria o tempo
    que o usuário leva para digitar). Cada etapa de processamento é medida
    separadamente com `medir()` e os tempos são somados.
    """

    def __init__(self, nome: str):
        self.nome = nome
        self.operacoes: dict[str, int] = {}
        self._tempo_total = 0.0  # segundos
        self.etapas_medidas = 0

    @contextmanager
    def medir(self, rotulo: str):
        """Mede o tempo de um bloco de código, descontando o tempo dos prints."""
        log_antes = _tempo_em_log
        t0 = time.perf_counter()
        try:
            yield
        finally:
            gasto = (time.perf_counter() - t0) - (_tempo_em_log - log_antes)
            self._tempo_total += gasto
            self.etapas_medidas += 1
            log(f"{self.nome}: tempo de processamento de '{rotulo}' = {gasto * 1000:.4f} ms "
                f"(acumulado: {self.tempo_ms:.4f} ms)")

    def registrar(self, tipo: str, quantidade: int = 1, detalhe: str = "") -> None:
        self.operacoes[tipo] = self.operacoes.get(tipo, 0) + quantidade
        extra = f" -> {detalhe}" if detalhe else ""
        log(f"{self.nome}: +{quantidade} {tipo} (total {tipo}: {self.operacoes[tipo]}){extra}")

    @property
    def total(self) -> int:
        return sum(self.operacoes.values())

    @property
    def tempo_ms(self) -> float:
        return self._tempo_total * 1000

    def resumo(self) -> dict:
        return {
            "operacoes_por_tipo": dict(self.operacoes),
            "total_operacoes": self.total,
            "tempo_ms": round(self.tempo_ms, 4),
            "etapas_medidas": self.etapas_medidas,
        }

    def imprimir_resumo(self, complexidade_teorica: str, n: int) -> None:
        log("=" * 60)
        log(f"RESUMO: {self.nome}")
        log(f"  n (tamanho do intervalo)   = {n}")
        log(f"  log2(n)                    = {math.log2(n):.2f}")
        log(f"  teto(log2(n)) = pior caso  = {pior_caso_busca_binaria(n)} passos")
        for tipo, qtd in self.operacoes.items():
            log(f"  {tipo:<27}= {qtd}")
        log(f"  total de operações         = {self.total}")
        log(f"  etapas medidas             = {self.etapas_medidas}")
        log(f"  tempo de processamento     = {self.tempo_ms:.4f} ms (soma das etapas, sem prints)")
        if self.etapas_medidas:
            log(f"  tempo médio por etapa      = {self.tempo_ms / self.etapas_medidas:.4f} ms")
        log(f"  complexidade teórica       = {complexidade_teorica}")
        log("=" * 60)


def pior_caso_busca_binaria(n: int) -> int:
    """Número máximo de palpites para achar 1 entre n valores: ⌈log2(n+1)⌉."""
    return math.ceil(math.log2(n + 1))
