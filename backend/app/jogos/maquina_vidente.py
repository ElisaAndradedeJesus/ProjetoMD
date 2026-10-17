"""
Modo 2 — Máquina Vidente
O usuário pensa em um número entre 0 e 100; a máquina tenta adivinhar
em até 7 tentativas usando BUSCA BINÁRIA. O usuário responde
"maior", "menor" ou "acertou".

Complexidade:
  - Calcular o próximo palpite (meio do intervalo) ... O(1)
  - Atualizar o intervalo após o feedback ............ O(1)
  - Partida inteira .................................. O(log n)
    A cada passo o intervalo cai pela metade: n, n/2, n/4, ... 1
    Logo são no máximo ⌈log2(n+1)⌉ passos. Para 0..100 (n = 101): 7 passos.
"""
import math
from dataclasses import dataclass, field

from app.complexidade import ContadorOperacoes, log, pior_caso_busca_binaria

MAIOR, MENOR, ACERTOU = "maior", "menor", "acertou"

@dataclass
class PalpiteMaquina:
    numero: int
    intervalo: tuple[int, int]
    candidatos: int
    pensamento: str
    feedback: str | None = None

@dataclass
class MaquinaVidente:
    minimo: int = 0
    maximo: int = 100
    max_tentativas: int = 7
    historico: list[PalpiteMaquina] = field(default_factory=list)
    status: str = "jogando"  # "jogando" | "acertou" | "perdeu" | "inconsistente"

    def __post_init__(self):
        self.contador = ContadorOperacoes("MaquinaVidente")
        self.baixo, self.alto = self.minimo, self.maximo
        n = self.maximo - self.minimo + 1
        log(f"Nova partida: intervalo [{self.minimo}, {self.maximo}], n = {n}")
        log(f"log2({n}) = {math.log2(n):.2f} -> a busca binária precisa de no máximo "
            f"{pior_caso_busca_binaria(n)} palpites")
        self._proximo_palpite()

    @property
    def candidatos(self) -> int:
        return self.alto - self.baixo + 1

    @property
    def palpite_atual(self) -> PalpiteMaquina | None:
        if self.historico and self.historico[-1].feedback is None:
            return self.historico[-1]
        return None

    def _proximo_palpite(self) -> None:
        passo = len(self.historico) + 1
        meio = (self.baixo + self.alto) // 2
        self.contador.registrar("calculo_meio", detalhe=f"({self.baixo} + {self.alto}) // 2 = {meio}")

        pensamento = (f"Analisando intervalo de {self.baixo} a {self.alto}... "
                      f"{self.candidatos} candidatos. Descartando 50% das possibilidades.")
        log(f"--- Passo {passo}/{self.max_tentativas} ---")
        log(f"Intervalo [{self.baixo}, {self.alto}] = {self.candidatos} candidatos "
            f"(log2 = {math.log2(self.candidatos):.2f} passos restantes no pior caso)")
        log(f"Palpite da máquina: {meio}")

        self.historico.append(PalpiteMaquina(meio, (self.baixo, self.alto), self.candidatos, pensamento))
        self.contador.registrar("insercao_historico", detalhe="list.append é O(1)")

    def responder(self, feedback: str) -> None:
        """feedback: 'maior' (seu número é maior que o palpite), 'menor' ou 'acertou'."""
        if self.status != "jogando":
            raise ValueError("A partida já terminou.")
        if feedback not in (MAIOR, MENOR, ACERTOU):
            raise ValueError("Feedback deve ser 'maior', 'menor' ou 'acertou'.")

        palpite = self.palpite_atual
        palpite.feedback = feedback
        antes = self.candidatos
        log(f"Feedback do usuário para {palpite.numero}: {feedback.upper()}")

        self.contador.registrar("comparacao", detalhe="verifica tipo de feedback")
        if feedback == ACERTOU:
            self.status = "acertou"
        else:
            if feedback == MAIOR:
                self.baixo = palpite.numero + 1
            else:
                self.alto = palpite.numero - 1
            self.contador.registrar("atualizacao_intervalo",
                                    detalhe=f"novo intervalo [{self.baixo}, {self.alto}]")

            if self.baixo > self.alto:
                # o usuário deu dicas contraditórias: não sobrou nenhum candidato
                self.status = "inconsistente"
                log("Intervalo vazio! As dicas foram contraditórias.")
            else:
                log(f"Candidatos: {antes} -> {self.candidatos} "
                    f"(reduziu {100 * (1 - self.candidatos / antes):.0f}%)")
                if len(self.historico) >= self.max_tentativas:
                    self.status = "perdeu"
                else:
                    self._proximo_palpite()

        if self.status != "jogando":
            self.contador.imprimir_resumo(
                "O(log n) — o intervalo cai pela metade a cada passo",
                self.maximo - self.minimo + 1,
            )

    def estado(self) -> dict:
        atual = self.palpite_atual
        return {
            "modo": "maquina_vidente",
            "intervalo": [self.minimo, self.maximo],
            "intervalo_ativo": [self.baixo, self.alto],
            "candidatos": max(self.candidatos, 0),
            "status": self.status,
            "palpite_atual": atual.numero if atual else None,
            "ciclo": len(self.historico),
            "max_tentativas": self.max_tentativas,
            "historico": [
                {**vars(p), "intervalo": list(p.intervalo)} for p in self.historico
            ],
            "complexidade": self.contador.resumo(),
        }
