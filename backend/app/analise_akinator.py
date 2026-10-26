"""
Compara quantas perguntas cada estratégia do Akinator precisa (média e pior caso).
Rodar: python -m app.analise_akinator
"""
import time

from app.jogos.akinator_arvore import (
    base_real, base_sintetica, construir_arvore, estatisticas, estatisticas_linear,
    estrategia_aleatoria, estrategia_ordem_fixa,
)
from app.jogos.akinator import escolher_traco_metade

SEMENTES_ALEATORIA = 5


def comparar(base) -> dict:
    resultado = {"linear": estatisticas_linear(len(base))}
    for nome, estrategia in [("ordem_fixa", estrategia_ordem_fixa), ("metade", escolher_traco_metade)]:
        t0 = time.perf_counter()
        est = estatisticas(construir_arvore(base, estrategia, com_nomes=False))
        est["tempo_construcao_ms"] = round((time.perf_counter() - t0) * 1000, 2)
        resultado[nome] = est

    # média de várias sementes, uma só podia dar sorte ou azar
    rodadas = [estatisticas(construir_arvore(base, estrategia_aleatoria(s), com_nomes=False))
               for s in range(SEMENTES_ALEATORIA)]
    resultado["aleatoria"] = {
        "personagens": len(base),
        "altura": max(r["altura"] for r in rodadas),
        "media_perguntas": round(sum(r["media_perguntas"] for r in rodadas) / len(rodadas), 2),
        "limite_teorico": rodadas[0]["limite_teorico"],
        "rodadas": len(rodadas),
    }
    return resultado


def analise(tamanhos: list[int]) -> list[dict]:
    linhas = [{"base": "real (24 do jogo)", **comparar(base_real())}]
    for n in tamanhos:
        linhas.append({"base": f"sintética n={n:,}".replace(",", "."), **comparar(base_sintetica(n))})
    return linhas


COLUNAS = ["linear", "ordem_fixa", "aleatoria", "metade"]
TITULOS = {"linear": "linear", "ordem_fixa": "ordem fixa", "aleatoria": "aleatória", "metade": "metade"}


def main():
    def fmt(e):
        return f"{e['media_perguntas']:.2f} / {e['altura']}"

    print("Perguntas por partida: média / pior caso\n")
    cab = f"{'base':<20} | {'⌈log2 n⌉':>8} | " + " | ".join(f"{TITULOS[c]:>16}" for c in COLUNAS)
    print(cab)
    print("-" * len(cab))
    for linha in analise([100, 500, 1_000, 2_000]):
        print(f"{linha['base']:<20} | {linha['metade']['limite_teorico']:>8} | "
              + " | ".join(f"{fmt(linha[c]):>16}" for c in COLUNAS))
    print("""
Conclusões:
- linear: a média é ~n/2 e o pior caso n-1 -> O(n).
- metade: a média fica perto de ⌈log2 n⌉ -> O(log n). Nenhuma estratégia de
  perguntas sim/não consegue pior caso abaixo de ⌈log2 n⌉ (árvore binária de
  altura h tem no máximo 2^h folhas). O pior caso passa um pouco disso porque
  os traços nem sempre dividem exatamente ao meio.
- ordem fixa / aleatória: perto de log2 n na média, mas com pior caso maior,
  porque perguntam coisas que dividem mal (ex.: "é ruivo?" separa só 2 de 24).""")


if __name__ == "__main__":
    main()
