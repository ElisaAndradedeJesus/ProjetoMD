"""
Modo 1 — Desafiar a Máquina
A máquina sorteia um número; o usuário tem 7 tentativas para adivinhar.
A cada palpite a máquina responde "maior", "menor" ou "acertou".

Complexidade:
  - Sortear o número ............ O(1)
  - Avaliar um palpite .......... O(1)  (no máximo 2 comparações)
  - Guardar no histórico ........ O(1)  (append em lista)
  - Partida inteira ............. O(k), k = nº de tentativas (k <= 7)
  - Estratégia ótima do usuário . O(log n): com busca binária, 7 palpites
                                  bastam para n = 100, pois ⌈log2(101)⌉ = 7
"""
import random
from dataclasses import dataclass, field

from app.complexidade import ContadorOperacoes, log, pior_caso_busca_binaria

MAIOR, MENOR, ACERTOU = "maior", "menor", "acertou"

@dataclass
class Palpite:
    numero: int
    resultado: str  # "maior" | "menor" | "acertou"

@dataclass
class DesafiarMaquina:
    minimo: int = 1
    maximo: int = 100
    max_tentativas: int = 7
    segredo: int | None = None
    historico: list[Palpite] = field(default_factory=list)
    status: str = "jogando"  # "jogando" | "venceu" | "perdeu"
    # Se False, quem chama (ex.: o CLI) decide quando imprimir o resumo final.
    resumo_automatico: bool = True

    def __post_init__(self):
        self.contador = ContadorOperacoes("DesafiarMaquina")
        with self.contador.medir("sorteio"):
            if self.segredo is None:
                self.segredo = random.randint(self.minimo, self.maximo)
            self.contador.registrar("sorteio", detalhe="random.randint é O(1)")
        n = self.maximo - self.minimo + 1
        log(f"Nova partida: intervalo [{self.minimo}, {self.maximo}], n = {n}")
        log(f"Com busca binária o usuário precisa de no máximo "
            f"{pior_caso_busca_binaria(n)} palpites -> O(log n)")

    @property
    def tentativas_usadas(self) -> int:
        return len(self.historico)  # len() em lista é O(1)

    @property
    def tentativas_restantes(self) -> int:
        return self.max_tentativas - self.tentativas_usadas

    def palpitar(self, numero: int) -> Palpite:
        if self.status != "jogando":
            raise ValueError("A partida já terminou.")
        if not (self.minimo <= numero <= self.maximo):
            raise ValueError(f"O palpite deve estar entre {self.minimo} e {self.maximo}.")

        log(f"--- Tentativa {self.tentativas_usadas + 1}/{self.max_tentativas}: palpite {numero} ---")

        # Só este bloco é cronometrado: o tempo que o usuário leva digitando fica de fora.
        with self.contador.medir(f"palpite {numero}"):
            # Avaliação: no máximo 2 comparações -> O(1)
            self.contador.registrar("comparacao", detalhe=f"{numero} == {self.segredo}?")
            if numero == self.segredo:
                resultado = ACERTOU
            else:
                self.contador.registrar("comparacao", detalhe=f"{numero} < {self.segredo}?")
                resultado = MAIOR if numero < self.segredo else MENOR

            palpite = Palpite(numero, resultado)
            self.historico.append(palpite)
            self.contador.registrar("insercao_historico", detalhe="list.append é O(1) amortizado")

            if resultado == ACERTOU:
                self.status = "venceu"
            elif self.tentativas_restantes == 0:
                self.status = "perdeu"

        if resultado == ACERTOU:
            log(f"Resposta: ACERTOU! O segredo era {self.segredo} | custo deste palpite: O(1)")
        else:
            log(f"Resposta: o segredo é {resultado.upper()} que {numero} | custo deste palpite: O(1)")

        if self.status != "jogando" and self.resumo_automatico:
            self.imprimir_resumo()
        return palpite

    def imprimir_resumo(self) -> None:
        self.contador.imprimir_resumo(
            "O(k) por partida (k = tentativas), cada palpite O(1)",
            self.maximo - self.minimo + 1,
        )

    def estado(self) -> dict:
        return {
            "modo": "desafiar_maquina",
            "intervalo": [self.minimo, self.maximo],
            "status": self.status,
            "tentativas_usadas": self.tentativas_usadas,
            "tentativas_restantes": self.tentativas_restantes,
            "max_tentativas": self.max_tentativas,
            "historico": [vars(p) for p in self.historico],
            # o segredo só é revelado quando a partida termina
            "segredo": self.segredo if self.status != "jogando" else None,
            "complexidade": self.contador.resumo(),
        }