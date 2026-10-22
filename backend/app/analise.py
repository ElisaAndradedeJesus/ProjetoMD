"""
Comparação empírica: busca LINEAR O(n) x busca BINÁRIA O(log n).
Para cada n, procura o pior caso e conta as comparações.
Rodar:  python -m app.analise
"""
import math
import time


def busca_linear(n: int, alvo: int) -> int:
    comparacoes = 0
    for x in range(n):
        comparacoes += 1
        if x == alvo:
            break
    return comparacoes


def busca_binaria(n: int, alvo: int) -> int:
    baixo, alto, comparacoes = 0, n - 1, 0
    while baixo <= alto:
        meio = (baixo + alto) // 2
        comparacoes += 1
        if meio == alvo:
            break
        if meio < alvo:
            baixo = meio + 1
        else:
            alto = meio - 1
    return comparacoes


def pior_caso(busca, n: int) -> int:
    return max(busca(n, alvo) for alvo in range(n)) if n <= 10_000 else busca(n, n - 1)


def main():
    print(f"{'n':>13} | {'linear O(n)':>12} | {'binária O(log n)':>16} | {'⌈log2(n+1)⌉':>11} | {'tempo bin (µs)':>14}")
    print("-" * 80)
    for n in [10, 100, 1_000, 10_000, 100_000, 1_000_000, 1_000_000_000]:
        lin = pior_caso(busca_linear, n) if n <= 1_000_000 else n  # linear em 1 bilhão demoraria demais
        binr = pior_caso(busca_binaria, n)
        t0 = time.perf_counter()
        busca_binaria(n, n - 1)  # mede o tempo de UMA busca
        dt = (time.perf_counter() - t0) * 1e6
        print(f"{n:>13,} | {lin:>12,} | {binr:>16} | {math.ceil(math.log2(n + 1)):>11} | {dt:>14.1f}")
    print("\nConclusão: multiplicar n por 10 soma ~3,3 passos na binária (log2 10 ≈ 3,32),")
    print("enquanto na linear multiplica os passos por 10. Para n = 100, 7 palpites bastam.")


if __name__ == "__main__":
    main()
