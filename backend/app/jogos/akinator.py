"""
Modo 3 — Akinator

A cada rodada a máquina pergunta o traço que divide os candidatos mais perto
do meio, como uma busca binária: 24 -> 12 -> 6 -> 3 -> 2 -> 1.
Sai quem acumula custo 3 (resposta firme contrária custa 3, "provavelmente" 1,5).
"""
import math
from dataclasses import dataclass, field

from app.complexidade import ContadorOperacoes, log

# Mesmos traços do Akinator.tsx
TRACOS: dict[str, dict[str, str]] = {
    "curto": {"rotulo": "Cabelo curto", "pergunta": "possui cabelo curto?"},
    "loiro": {"rotulo": "Cabelo loiro", "pergunta": "tem cabelo loiro?"},
    "cacheado": {"rotulo": "Cabelo cacheado", "pergunta": "tem cabelo cacheado?"},
    "claros": {"rotulo": "Olhos claros", "pergunta": "tem olhos claros?"},
    "oculos": {"rotulo": "Óculos", "pergunta": "usa óculos?"},
    "barba": {"rotulo": "Barba", "pergunta": "tem barba?"},
    "chapeu": {"rotulo": "Chapéu", "pergunta": "usa chapéu?"},
    "sardas": {"rotulo": "Sardas", "pergunta": "tem sardas no rosto?"},
    "brincos": {"rotulo": "Brincos", "pergunta": "usa brincos?"},
    "sorriso": {"rotulo": "Sorrindo", "pergunta": "está sorrindo?"},
    "bigode": {"rotulo": "Bigode", "pergunta": "tem bigode?"},
    "colar": {"rotulo": "Colar", "pergunta": "usa colar?"},
    "gravata": {"rotulo": "Gravata", "pergunta": "está usando gravata?"},
    "ruivo": {"rotulo": "Cabelo ruivo", "pergunta": "tem cabelo ruivo?"},
    "maquiagem": {"rotulo": "Maquiagem", "pergunta": "está usando maquiagem?"},
    "piercing": {"rotulo": "Piercing", "pergunta": "usa piercing no nariz?"},
}

# Chaves em inglês ("name"/"traits") porque é o formato que o front já usa.
PERSONAGENS: list[dict] = [
    {"name": "Ana", "traits": ["loiro", "claros", "sardas", "brincos", "sorriso", "colar", "maquiagem"]},
    {"name": "Bruno", "traits": ["curto", "barba", "oculos", "gravata"]},
    {"name": "Caio", "traits": ["cacheado", "claros", "sorriso", "ruivo", "piercing"]},
    {"name": "Duda", "traits": ["loiro", "oculos", "brincos", "maquiagem", "colar"]},
    {"name": "Enzo", "traits": ["curto", "loiro", "chapeu", "sorriso", "gravata"]},
    {"name": "Fernanda", "traits": ["cacheado", "sardas", "brincos", "sorriso", "colar"]},
    {"name": "Gui", "traits": ["curto", "barba", "chapeu", "oculos", "bigode"]},
    {"name": "Helena", "traits": ["loiro", "claros", "cacheado", "sorriso", "maquiagem"]},
    {"name": "Ivo", "traits": ["curto", "claros", "sardas", "chapeu", "piercing"]},
    {"name": "Júlia", "traits": ["cacheado", "oculos", "brincos", "maquiagem"]},
    {"name": "Kai", "traits": ["barba", "chapeu", "sorriso", "bigode", "colar"]},
    {"name": "Lia", "traits": ["loiro", "sardas", "oculos", "brincos", "piercing"]},
    {"name": "Maya", "traits": ["loiro", "cacheado", "oculos", "sorriso", "gravata"]},
    {"name": "Nina", "traits": ["curto", "brincos", "sardas", "maquiagem"]},
    {"name": "Otto", "traits": ["curto", "chapeu", "barba", "sorriso", "claros", "bigode"]},
    {"name": "Paula", "traits": ["cacheado", "loiro", "sardas", "oculos", "colar"]},
    {"name": "Ravi", "traits": ["curto", "cacheado", "barba", "brincos", "piercing"]},
    {"name": "Sofia", "traits": ["loiro", "chapeu", "brincos", "claros", "sorriso", "maquiagem"]},
    {"name": "Theo", "traits": ["curto", "oculos", "sardas", "sorriso", "gravata"]},
    {"name": "Uma", "traits": ["cacheado", "claros", "chapeu", "ruivo", "colar"]},
    {"name": "Vitor", "traits": ["curto", "loiro", "barba", "sardas", "bigode"]},
    {"name": "Wesley", "traits": ["cacheado", "barba", "chapeu", "oculos", "gravata"]},
    {"name": "Yara", "traits": ["loiro", "brincos", "sorriso", "claros", "maquiagem", "piercing"]},
    {"name": "Zeca", "traits": ["curto", "sardas", "chapeu", "oculos", "bigode"]},
]

SIM, NAO, NAO_SEI, PROV_SIM, PROV_NAO = "sim", "nao", "nsei", "psim", "pnao"
RESPOSTAS = (SIM, NAO, NAO_SEI, PROV_SIM, PROV_NAO)
LIMITE_ELIMINACAO = 3
CUSTO_FIRME, CUSTO_PROVAVEL = 3.0, 1.5


def escolher_traco_metade(candidatos: list[frozenset[str]], perguntados: set[str],
                          contador: ContadorOperacoes | None = None) -> str | None:
    n = len(candidatos)
    melhor, melhor_gap = None, math.inf
    for traco in TRACOS:
        if traco in perguntados:
            continue
        com = sum(1 for tracos in candidatos if traco in tracos)
        if contador:
            contador.registrar("verificacao_traco", n)
        if com == 0 or com == n:  # não separa ninguém
            continue
        gap = abs(com - n / 2)
        if gap < melhor_gap:
            melhor, melhor_gap = traco, gap
    return melhor


@dataclass
class Personagem:
    nome: str
    tracos: frozenset[str]  # set: checar um traço é O(1)
    custo: float = 0.0

    @property
    def eliminado(self) -> bool:
        return self.custo >= LIMITE_ELIMINACAO

    def para_dict(self) -> dict:
        # frozenset não guarda ordem
        return {"name": self.nome, "traits": [t for t in TRACOS if t in self.tracos]}


@dataclass
class RespostaAkinator:
    traco: str
    resposta: str
    candidatos_antes: int
    candidatos_depois: int
    divisao: dict[str, int]


@dataclass
class Akinator:
    personagens_base: list[dict] = field(default_factory=lambda: PERSONAGENS)
    historico: list[RespostaAkinator] = field(default_factory=list)
    status: str = "jogando"  # "jogando" | "palpite" | "acertou" | "errou"

    def __post_init__(self):
        self.contador = ContadorOperacoes("Akinator")
        self.personagens = [Personagem(p["name"], frozenset(p["traits"])) for p in self.personagens_base]
        self.pergunta_atual: str | None = None
        self.palpite: Personagem | None = None
        n, t = len(self.personagens), len(TRACOS)
        log(f"Nova partida: n = {n} personagens, t = {t} traços")
        log(f"Divisão perfeita (busca binária): ⌈log2({n})⌉ = {math.ceil(math.log2(n))} perguntas")
        with self.contador.medir("primeira pergunta"):
            self._avancar()

    @property
    def restantes(self) -> list[Personagem]:
        return [p for p in self.personagens if not p.eliminado]  # O(n)

    @property
    def total_perguntas(self) -> int:
        return len(TRACOS)

    def divisao(self, traco: str) -> dict[str, int]:
        restantes = self.restantes
        sim = sum(1 for p in restantes if traco in p.tracos)
        return {"sim": sim, "nao": len(restantes) - sim}

    def _escolher_pergunta(self) -> str | None:
        perguntados = {r.traco for r in self.historico}
        restantes = self.restantes
        melhor = escolher_traco_metade([p.tracos for p in restantes], perguntados, self.contador)
        if melhor:
            d = self.divisao(melhor)
            log(f"Melhor pergunta: '{melhor}' divide {len(restantes)} em "
                f"{d['sim']} (sim) x {d['nao']} (não)")
        return melhor

    def _escolher_palpite(self) -> Personagem:
        pool = self.restantes or self.personagens
        self.contador.registrar("comparacao_palpite", len(pool))
        return min(pool, key=lambda p: p.custo)  # empate fica com o primeiro, igual ao front

    def _avancar(self) -> None:
        proxima = None
        if len(self.restantes) > 1 and len(self.historico) < self.total_perguntas:
            proxima = self._escolher_pergunta()
        if proxima is None:
            self.pergunta_atual = None
            self.palpite = self._escolher_palpite()
            self.status = "palpite"
            log(f"Palpite final: {self.palpite.nome} após {len(self.historico)} perguntas")
        else:
            self.pergunta_atual = proxima

    def responder(self, resposta: str) -> None:
        if self.status != "jogando":
            raise ValueError("A máquina já fez o palpite.")
        if resposta not in RESPOSTAS:
            raise ValueError(f"Resposta deve ser uma de: {', '.join(RESPOSTAS)}.")

        traco = self.pergunta_atual
        antes = len(self.restantes)
        divisao = self.divisao(traco)
        log(f"--- Pergunta {len(self.historico) + 1}: '{traco}' -> {resposta.upper()} ---")

        with self.contador.medir(f"resposta '{resposta}' para '{traco}'"):
            if resposta != NAO_SEI:
                disse_sim = resposta in (SIM, PROV_SIM)
                peso = CUSTO_FIRME if resposta in (SIM, NAO) else CUSTO_PROVAVEL
                # só aplica a resposta nova, sem refazer o histórico: O(n)
                for p in self.personagens:
                    if (traco in p.tracos) != disse_sim:
                        p.custo += peso
                self.contador.registrar("atualizacao_custo", len(self.personagens))

            depois = len(self.restantes)
            self.historico.append(RespostaAkinator(traco, resposta, antes, depois, divisao))
            self.contador.registrar("insercao_historico", detalhe="list.append é O(1)")
            log(f"Candidatos: {antes} -> {depois}")
            self._avancar()

        if self.status == "palpite":
            self.imprimir_resumo()

    def confirmar(self, acertou: bool) -> None:
        if self.status != "palpite":
            raise ValueError("Ainda não há palpite para confirmar.")
        self.status = "acertou" if acertou else "errou"
        log(f"Usuário confirmou: {'ACERTOU' if acertou else 'ERROU'}")

    def imprimir_resumo(self) -> None:
        self.contador.imprimir_resumo(
            "O(t·n) por pergunta; ~log2(n) perguntas quando os traços dividem ao meio",
            len(self.personagens),
        )

    def estado(self) -> dict:
        pergunta = None
        if self.pergunta_atual:
            pergunta = {
                "traco": self.pergunta_atual,
                "rotulo": TRACOS[self.pergunta_atual]["rotulo"],
                "texto": f"O personagem que você pensou {TRACOS[self.pergunta_atual]['pergunta']}",
                "numero": len(self.historico) + 1,
                "divisao": self.divisao(self.pergunta_atual),
            }
        rotulo = lambda r: {"traco": r.traco, "rotulo": TRACOS[r.traco]["rotulo"]}  # noqa: E731
        return {
            "modo": "akinator",
            "status": self.status,
            "pergunta_atual": pergunta,
            "perguntas_feitas": len(self.historico),
            "total_perguntas": self.total_perguntas,
            "candidatos_restantes": [p.nome for p in self.restantes],
            "quantidade_restantes": len(self.restantes),
            "tracos_confirmados": [rotulo(r) for r in self.historico if r.resposta in (SIM, PROV_SIM)],
            "tracos_eliminados": [rotulo(r) for r in self.historico if r.resposta in (NAO, PROV_NAO)],
            "historico": [vars(r) for r in self.historico],
            "palpite": self.palpite.para_dict() if self.palpite else None,
            # vira None com "não sei"/"provavelmente", aí a partida sai da árvore
            "caminho_na_arvore": (
                [r.resposta for r in self.historico]
                if all(r.resposta in (SIM, NAO) for r in self.historico) else None
            ),
            "complexidade": self.contador.resumo(),
        }
