# Preparação para a apresentação — 27/10/2026

## Antes de sair

1. Use a versão consolidada. Instale os pacotes nos dois diretórios seguindo o [README](../README.md).
2. Execute os testes Python, os testes do frontend e o build. Guarde o projeto e dependências no computador que será usado.
3. Inicie a API na porta 8000 e o frontend. Confira `/health` e abra o menu.
4. Ensaie os quatro cartões dos três níveis, incluindo voltar ao menu e reiniciar uma partida.
5. Gere o build e ensaie com `corepack pnpm preview --host 127.0.0.1` na pasta frontend. Abra o endereço informado e mantenha a API ligada.
6. Confira tela/projetor e zoom. Evite instalar ou atualizar pacotes durante a apresentação.

## Roteiro de 5–8 minutos

**Abertura:** “Vamos mostrar como eliminar possibilidades torna a busca mais eficiente.” Os três níveis ampliam o espaço de decisão: números, combinações de características e personagens.

**Nível 1 — números:** abra Desafiar a Máquina, comece pelo 50 e ajuste o intervalo conforme as dicas. Depois abra Máquina Vidente, pense em 73: para palpites 50, 75, 62, 68, 71, 73, responda Maior, Menor, Maior, Maior, Maior, Acertou. Mostre a redução do intervalo. A Máquina Vidente aceita de 0 a 100; o desafio, de 1 a 100.

**Nível 2 — Genius:** pense em cabelo cacheado, curto, olhos castanhos e com óculos. As perguntas variam: responda conforme esse perfil até a descoberta. Explique 3 × 3 × 3 × 2 = 54 e o limite de sete perguntas. Mostre candidatos restantes e histórico. O modo local permite demonstrar esse nível se a API estiver indisponível.

**Nível 3 — Akinator:** abra a lista, escolha um dos 24 personagens e leia seus traços. Responda Sim/Não de forma coerente; confirme o palpite e mostre o caminho na árvore. Compare as estratégias na visualização. “Não sei” e “Provavelmente” demonstram incerteza, mas deixam de seguir um caminho binário exato.

**Fechamento:** compare busca linear com partições equilibradas. Separe quantidade de perguntas de custo de processamento: escolher uma boa pergunta também exige trabalho. Veja a [análise de complexidade](../backend/README.md).

## Se algo falhar

- Sem conexão: confira se o terminal da API continua aberto e se `/health` responde. Confira `VITE_API_URL`; reinicie o Vite se mudar o ambiente.
- Partida não encontrada: reiniciar a API apaga sessões. Volte ao menu e inicie outra partida.
- Porta ocupada: encerre o servidor anterior com Ctrl+C ou ajuste a porta e a configuração correspondente.
- Genius: a troca local/API começa outra partida; não transfere o histórico.
- Akinator: escolha alguém da lista do jogo e mantenha os mesmos traços; personagens externos não fazem parte da base.

## Conferência manual no computador da apresentação

- [ ] Desafio: entrada fora do intervalo, dicas e término.
- [ ] Vidente: 0, 73 e 100; acerto e dicas contraditórias.
- [ ] Genius: descoberta, reinício e troca de modo nos dois sentidos.
- [ ] Akinator: lista, perguntas, confirmação e árvore.
- [ ] Menu, foco de teclado, projeção e versão de produção.

Testes automatizados ajudam a validar a lógica e a API; esta conferência visual precisa ser feita no computador/projetor da apresentação.
