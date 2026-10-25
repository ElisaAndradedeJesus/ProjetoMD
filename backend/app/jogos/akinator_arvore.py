"""
Árvore de decisão do Akinator: cada nó é uma pergunta e cada folha um personagem.
Nº de perguntas até alguém = profundidade da folha; pior caso = altura da árvore.
Como uma árvore binária de altura h tem no máximo 2^h folhas, nenhuma estratégia
acha 1 entre n com menos de ⌈log2 n⌉ perguntas no pior caso.
"""
import math
import random
from collections import Counter
from typing import Callable

from app.complexidade import ContadorOperacoes
from app.jogos.akinator import PERSONAGENS, TRACOS, escolher_traco_metade

# (nome, traços)
Base = list[tuple[str, frozenset[str]]]
Estrategia = Callable[[list[frozenset[str]], set[str], ContadorOperacoes | None], str | None]


def _separadores(candidatos: list[frozenset[str]], perguntados: set[str],
                 contador: ContadorOperacoes | None) -> list[str]:
    # traços ainda não perguntados que separam os candidatos em dois grupos
    n, uteis = len(candidatos), []
    for traco in TRACOS:
        if traco in perguntados:
            continue
        com = sum(1 for tracos in candidatos if traco in tracos)
        if contador:
            contador.registrar("verificacao_traco", n)
        if 0 < com < n:
            uteis.append(traco)
    return uteis


def estrategia_ordem_fixa(candidatos, perguntados, contador=None):
    uteis = _separadores(candidatos, perguntados, contador)
    return uteis[0] if uteis else None


def estrategia_aleatoria(semente: int) -> Estrategia:
    rnd = random.Random(semente)

    def escolher(candidatos, perguntados, contador=None):
        uteis = _separadores(candidatos, perguntados, contador)
        return rnd.choice(uteis) if uteis else None
    return escolher


# lambda pra cada requisição ganhar uma aleatória nova, com a mesma semente
ESTRATEGIAS: dict[str, Callable[[], Estrategia]] = {
    "metade": lambda: escolher_traco_metade,
    "ordem_fixa": lambda: estrategia_ordem_fixa,
    "aleatoria": lambda: estrategia_aleatoria(0),
}


def base_real() -> Base:
    return [(p["name"], frozenset(p["traits"])) for p in PERSONAGENS]


def frequencia_real() -> dict[str, float]:
    return {t: sum(t in p["traits"] for p in PERSONAGENS) / len(PERSONAGENS) for t in TRACOS}


def base_sintetica(n: int, semente: int = 42) -> Base:
    # Usa a frequência de cada traço da base real (ruivo é raro, sorriso é comum).
    # Com 50% pra todos, qualquer pergunta já dividiria ao meio e a comparação não diria nada.
    if n > 2_000:
        raise ValueError("Use n <= 2000: com essas frequências há poucos perfis diferentes "
                         "prováveis (~2^13,9), e o sorteio de perfis únicos fica lento.")
    freq = frequencia_real()
    rnd, vistos, base = random.Random(semente), set(), []
    while len(base) < n:
        tracos = frozenset(t for t in TRACOS if rnd.random() < freq[t])
        if tracos not in vistos:
            vistos.add(tracos)
            base.append((f"P{len(base) + 1:05d}", tracos))
    return base


def construir_arvore(base: Base, estrategia: Estrategia = escolher_traco_metade,
                     contador: ContadorOperacoes | None = None, com_nomes: bool = True) -> dict:
    # é como jogar todas as partidas de uma vez, só com sim/não

    def no(candidatos: Base, perguntados: frozenset[str], profundidade: int) -> dict:
        nomes = [nome for nome, _ in candidatos]
        traco = None
        if len(candidatos) > 1:
            traco = estrategia([t for _, t in candidatos], set(perguntados), contador)
        if traco is None:
            # folha (pode ter mais de um se ninguém conseguir separá-los)
            folha = {"tipo": "palpite", "profundidade": profundidade,
                     "candidatos": len(candidatos), "personagem": nomes[0]}
            if com_nomes:
                folha["nomes"] = nomes
            return folha
        sim = [c for c in candidatos if traco in c[1]]
        nao = [c for c in candidatos if traco not in c[1]]
        if contador:
            contador.registrar("divisao_no", len(candidatos))
        interno = {
            "tipo": "pergunta", "profundidade": profundidade, "candidatos": len(candidatos),
            "traco": traco, "rotulo": TRACOS[traco]["rotulo"],
            "texto": f"O personagem que você pensou {TRACOS[traco]['pergunta']}",
            "sim": no(sim, perguntados | {traco}, profundidade + 1),
            "nao": no(nao, perguntados | {traco}, profundidade + 1),
        }
        if com_nomes:
            interno["nomes"] = nomes
        return interno

    return no(base, frozenset(), 0)


def folhas(arvore: dict):
    pilha = [arvore]
    while pilha:
        atual = pilha.pop()
        if atual["tipo"] == "palpite":
            yield atual
        else:
            pilha += [atual["nao"], atual["sim"]]


def estatisticas(arvore: dict) -> dict:
    n = arvore["candidatos"]
    prof = Counter()
    nos_pergunta = 0
    pilha = [arvore]
    while pilha:
        atual = pilha.pop()
        if atual["tipo"] == "palpite":
            prof[atual["profundidade"]] += atual["candidatos"]
        else:
            nos_pergunta += 1
            pilha += [atual["sim"], atual["nao"]]
    return {
        "personagens": n,
        "altura": max(prof),  # = pior caso
        "melhor_caso": min(prof),
        "media_perguntas": round(sum(d * q for d, q in prof.items()) / n, 2),
        "limite_teorico": math.ceil(math.log2(n)) if n > 1 else 0,  # ⌈log2 n⌉
        "nos_pergunta": nos_pergunta,
        "folhas": sum(1 for _ in folhas(arvore)),
        "inseparaveis": sum(f["candidatos"] for f in folhas(arvore) if f["candidatos"] > 1),
        "distribuicao": {str(d): prof[d] for d in sorted(prof)},
    }


def estatisticas_linear(n: int) -> dict:
    # "É a Ana? É o Bruno?..." O último sai por eliminação, então o pior caso é n-1.
    custos = [min(i, n - 1) for i in range(1, n + 1)]
    prof = Counter(custos)
    return {
        "personagens": n,
        "altura": max(custos),
        "melhor_caso": min(custos),
        "media_perguntas": round(sum(custos) / n, 2),
        "limite_teorico": math.ceil(math.log2(n)) if n > 1 else 0,
        "distribuicao": {str(d): prof[d] for d in sorted(prof)},
    }
