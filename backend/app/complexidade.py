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

VERBOSE = os.getenv("BIGO_VERBOSE", "1") != "0"


def log(msg: str) -> None:
    if VERBOSE:
        print(f"[BIG-O] {msg}")


class ContadorOperacoes:
    """Conta operações elementares por categoria e mede o tempo total."""

    def __init__(self, nome: str):
        self.nome = nome
        self.operacoes: dict[str, int] = {}
        self._inicio = time.perf_counter()

    def registrar(self, tipo: str, quantidade: int = 1, detalhe: str = "") -> None:
        self.operacoes[tipo] = self.operacoes.get(tipo, 0) + quantidade
        extra = f" -> {detalhe}" if detalhe else ""
        log(f"{self.nome}: +{quantidade} {tipo} (total {tipo}: {self.operacoes[tipo]}){extra}")

    @property
    def total(self) -> int:
        return sum(self.operacoes.values())

    @property
    def tempo_ms(self) -> float:
        return (time.perf_counter() - self._inicio) * 1000

    def resumo(self) -> dict:
        return {
            "operacoes_por_tipo": dict(self.operacoes),
            "total_operacoes": self.total,
            "tempo_ms": round(self.tempo_ms, 4),
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
        log(f"  tempo de execução          = {self.tempo_ms:.4f} ms")
        log(f"  complexidade teórica       = {complexidade_teorica}")
        log("=" * 60)


def pior_caso_busca_binaria(n: int) -> int:
    """Número máximo de palpites para achar 1 entre n valores: ⌈log2(n+1)⌉."""
    return math.ceil(math.log2(n + 1))
