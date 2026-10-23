"""
Modo 3 — Genius Característico
O usuário pensa em um perfil com 4 características (textura, comprimento,
olhos, óculos), totalizando 3 * 3 * 3 * 2 = 54 perfis possíveis.
A máquina descobre o perfil em até 7 perguntas usando árvore de decisão minimax
(análogo à busca binária no espaço de candidatos).

Complexidade:
  - Espaço inicial de busca: n = 54 candidatos
  - Pior caso ótimo com partições ternárias: até 7 perguntas
  - A cada passo, avaliamos as perguntas possíveis e escolhemos a que
    minimiza o pior subconjunto remanescente: min(max(|Sim|, |Não|)).
"""
import math
import random
import uuid
from dataclasses import dataclass, field
from typing import Any

from app.complexidade import ContadorOperacoes, log

CATEGORIAS: dict[str, list[str]] = {
    "textura": ["Cabelo Cacheado", "Cabelo Ondulado", "Cabelo Liso"],
    "comprimento": ["Cabelo Curto", "Cabelo Médio", "Cabelo Longo"],
    "olhos": ["Olhos Castanhos", "Olhos Azuis", "Olhos Verdes"],
    "oculos": ["Com Óculos", "Sem Óculos"],
}

PERFIS: list[dict[str, str]] = [
    {"textura": t, "comprimento": c, "olhos": o, "oculos": oc}
    for t in CATEGORIAS["textura"]
    for c in CATEGORIAS["comprimento"]
    for o in CATEGORIAS["olhos"]
    for oc in CATEGORIAS["oculos"]
]


@dataclass
class Pergunta:
    categoria: str
    opcao: str
    texto: str


def escolher_pergunta(
    candidatos: list[dict[str, str]],
    contador: ContadorOperacoes | None = None,
) -> Pergunta | None:
    n_candidatos = len(candidatos)
    if n_candidatos <= 1:
        return None

    # Na 1ª pergunta (espaço inicial com todos os 54 candidatos):
    # Sorteia aleatoriamente entre as categorias e opções para dinamizar a abertura do jogo.
    if n_candidatos == len(PERFIS):
        cat = random.choice(list(CATEGORIAS.keys()))
        op = random.choice(CATEGORIAS[cat])
        if contador:
            for c, opcoes in CATEGORIAS.items():
                for o in opcoes:
                    contador.registrar("avaliacao_pergunta", detalhe=f"{c}={o}")
        return Pergunta(
            categoria=cat,
            opcao=op,
            texto=f"O perfil possui {op.lower()}?",
        )

    # Passos seguintes: Minimax ótimo com desempate aleatório entre as melhores perguntas
    candidatas: list[Pergunta] = []
    custo_minimo = float("inf")

    for categoria, opcoes in CATEGORIAS.items():
        for opcao in opcoes:
            sim = sum(1 for p in candidatos if p[categoria] == opcao)
            if contador:
                contador.registrar("avaliacao_pergunta", detalhe=f"{categoria}={opcao}")
            if sim == 0 or sim == n_candidatos:
                continue
            pior_grupo = max(sim, n_candidatos - sim)
            if pior_grupo < custo_minimo:
                custo_minimo = pior_grupo
                candidatas = [
                    Pergunta(
                        categoria=categoria,
                        opcao=opcao,
                        texto=f"O perfil possui {opcao.lower()}?",
                    )
                ]
            elif pior_grupo == custo_minimo:
                candidatas.append(
                    Pergunta(
                        categoria=categoria,
                        opcao=opcao,
                        texto=f"O perfil possui {opcao.lower()}?",
                    )
                )

    return random.choice(candidatas) if candidatas else None


@dataclass
class Genius:
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    max_tentativas: int = 7
    status: str = "jogando"  # "jogando" | "descobriu" | "limite"
    usadas: int = 0
    candidatos: list[dict[str, str]] = field(default_factory=lambda: [dict(p) for p in PERFIS])
    pergunta: Pergunta | None = None
    historico: list[dict[str, Any]] = field(default_factory=list)
    perfil: dict[str, str] | None = None

    def __post_init__(self):
        self.contador = ContadorOperacoes("Genius")
        n = len(self.candidatos)
        log(f"Nova partida Genius: {n} candidatos iniciais")
        log(
            f"log2({n}) = {math.log2(n):.2f} -> espaço de busca requer no máximo "
            f"{self.max_tentativas} perguntas"
        )
        with self.contador.medir("primeira pergunta"):
            self.pergunta = escolher_pergunta(self.candidatos, self.contador)
        if self.pergunta:
            log(f"Pergunta inicial: {self.pergunta.texto}")

    def responder(self, resposta: bool) -> None:
        if not isinstance(resposta, bool):
            raise ValueError("Resposta inválida: use Sim ou Não.")
        if self.status != "jogando" or self.pergunta is None:
            raise ValueError("Esta partida já terminou.")

        pergunta_atual = self.pergunta
        antes = len(self.candidatos)
        log(f"Resposta do usuário para '{pergunta_atual.texto}': {'SIM' if resposta else 'NÃO'}")

        with self.contador.medir(
            f"resposta '{'sim' if resposta else 'nao'}' para {pergunta_atual.opcao}"
        ):
            self.candidatos = [
                p
                for p in self.candidatos
                if (p[pergunta_atual.categoria] == pergunta_atual.opcao) == resposta
            ]
            self.contador.registrar(
                "filtragem_candidatos",
                detalhe=f"{antes} -> {len(self.candidatos)} candidatos",
            )
            self.usadas += 1
            self.historico.append({
                "pergunta": {
                    "categoria": pergunta_atual.categoria,
                    "opcao": pergunta_atual.opcao,
                    "texto": pergunta_atual.texto,
                },
                "resposta": resposta,
            })

            reducao = 100 * (1 - len(self.candidatos) / antes) if antes > 0 else 0
            log(
                f"Candidatos restantes: {len(self.candidatos)} (reduziu {reducao:.0f}%) "
                f"| Tentativa {self.usadas}/{self.max_tentativas}"
            )

            if len(self.candidatos) == 1:
                self.status = "descobriu"
                self.perfil = self.candidatos[0]
                self.pergunta = None
                log(f"Genius descobriu o perfil: {self.perfil} em {self.usadas} tentativa(s)!")
            elif self.usadas >= self.max_tentativas:
                self.status = "limite"
                self.perfil = None
                self.pergunta = None
                log(
                    f"Genius atingiu o limite de {self.max_tentativas} tentativas. "
                    f"Restaram {len(self.candidatos)} perfis."
                )
            else:
                self.pergunta = escolher_pergunta(self.candidatos, self.contador)
                if self.pergunta:
                    log(f"Próxima pergunta: {self.pergunta.texto}")

        if self.status != "jogando":
            self.contador.imprimir_resumo(
                "O(log n) equivalente — partição do espaço de estados em árvore de decisão minimax",
                len(PERFIS),
            )

    def estado(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "status": self.status,
            "usadas": self.usadas,
            "candidatos": self.candidatos,
            "pergunta": {
                "categoria": self.pergunta.categoria,
                "opcao": self.pergunta.opcao,
                "texto": self.pergunta.texto,
            }
            if self.pergunta
            else None,
            "historico": self.historico,
            "perfil": self.perfil,
            "complexidade": self.contador.resumo(),
        }

