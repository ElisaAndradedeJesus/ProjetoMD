"""
Jogar no terminal (útil para ver os prints de Big O sem frontend).
Rodar:  python -m app.cli
"""
from app.jogos import DesafiarMaquina, MaquinaVidente


def jogar_desafio():
    jogo = DesafiarMaquina()
    print(f"\nPensei em um número de {jogo.minimo} a {jogo.maximo}. Você tem {jogo.max_tentativas} tentativas.")
    while jogo.status == "jogando":
        try:
            p = jogo.palpitar(int(input(f"\n[{jogo.tentativas_restantes} restantes] Seu palpite: ")))
        except ValueError as e:
            print(f"Entrada inválida: {e}")
            continue
        print({"maior": "O segredo é MAIOR.", "menor": "O segredo é MENOR.", "acertou": "ACERTOU!"}[p.resultado])
        print("Histórico:", ", ".join(f"#{i} {h.numero} ({h.resultado})" for i, h in enumerate(jogo.historico, 1)))
    if jogo.status == "perdeu":
        print(f"\nFim das tentativas! O número era {jogo.segredo}.")


def jogar_vidente():
    jogo = MaquinaVidente()
    print(f"\nPense em um número de {jogo.minimo} a {jogo.maximo}. Responda: maior / menor / acertou")
    while jogo.status == "jogando":
        p = jogo.palpite_atual
        print(f"\n> {p.pensamento}\nO seu número é {p.numero}?")
        try:
            jogo.responder(input("Resposta: ").strip().lower())
        except ValueError as e:
            print(e)
    print({"acertou": f"\nAcertei em {len(jogo.historico)} tentativas!",
           "perdeu": "\nNão consegui em 7 tentativas.",
           "inconsistente": "\nSuas dicas foram contraditórias, não sobrou nenhum número."}[jogo.status])


def main():
    while True:
        op = input("\n1) Desafiar a Máquina  2) Máquina Vidente  0) Sair\n> ").strip()
        if op == "1":
            jogar_desafio()
        elif op == "2":
            jogar_vidente()
        elif op == "0":
            break
        if op in ("1", "2") and input("\nJogar novamente? (s/n) ").strip().lower() != "s":
            break


if __name__ == "__main__":
    main()
