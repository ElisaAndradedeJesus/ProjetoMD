"""
Jogar no terminal ( ver os prints de Big O sem frontend).
Rodar:  python -m app.cli
"""
from app.jogos import DesafiarMaquina, Genius, MaquinaVidente

def jogar_desafio():
    jogo = DesafiarMaquina(resumo_automatico=False)  # o resumo sai depois da resposta
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
    jogo.imprimir_resumo()

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

def jogar_genius():
    jogo = Genius()
    print("\nPense em um perfil (Textura, Comprimento, Olhos, Óculos).")
    print(f"A máquina tentará adivinhar em até {jogo.max_tentativas} perguntas.")
    while jogo.status == "jogando":
        pergunta = jogo.pergunta
        if not pergunta:
            break
        print(f"\n[Tentativa {jogo.usadas + 1}/{jogo.max_tentativas}] {pergunta.texto}")
        resp = input("Resposta (s/n): ").strip().lower()
        if resp not in ("s", "sim", "n", "nao", "não"):
            print("Entrada inválida. Digite 's' (sim) ou 'n' (não).")
            continue
        jogo.responder(resp in ("s", "sim"))
    if jogo.status == "palpite":
        print("\nMeu palpite: " + " · ".join((jogo.perfil or {}).values()))
        while True:
            confirmacao = input("Esse é o seu perfil? (s/n): ").strip().lower()
            if confirmacao in ("s", "sim", "n", "nao", "não"):
                jogo.confirmar(confirmacao in ("s", "sim"))
                break
            print("Entrada inválida. Digite 's' ou 'n'.")
    if jogo.status == "descobriu":
        print(f"\nAcertei em {jogo.usadas} perguntas! Seu perfil é:")
        for cat, val in (jogo.perfil or {}).items():
            print(f"  - {cat.capitalize()}: {val}")
    elif jogo.status == "sem_correspondencia":
        print("\nNenhuma das opções disponíveis corresponde ao perfil imaginado considerando suas respostas. Confira as características e tente novamente.")
    else:
        print(f"\nAtingi o limite de {jogo.max_tentativas} perguntas. Você venceu!")

def main():
    while True:
        op = input("\n1) Desafiar a Máquina  2) Máquina Vidente  3) Genius Característico  0) Sair\n> ").strip()
        if op == "1":
            jogar_desafio()
        elif op == "2":
            jogar_vidente()
        elif op == "3":
            jogar_genius()
        elif op == "0":
            break
        if op in ("1", "2", "3") and input("\nJogar novamente? (s/n) ").strip().lower() != "s":
            break

if __name__ == "__main__":
    main()