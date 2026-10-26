# ProjetoMD — Jogos de Adivinhação

Trabalho de Matemática Discreta para a feira de ciência e tecnologia. Uma interface reúne três níveis para explorar busca binária, conjuntos, combinatória e árvores de decisão.

| Nível | Jogo | Como funciona |
| --- | --- | --- |
| 1 · Números | Desafiar a Máquina | Adivinhe um número de 1 a 100 em até 7 palpites. |
| 1 · Números | Máquina Vidente | Pense em um número de 0 a 100; a máquina usa busca binária, com até 7 palpites. |
| 2 · Características | Genius Característico | Pense em um dos 54 perfis; responda até 7 perguntas de Sim/Não. |
| 3 · Personagens | Akinator | Escolha um dos 24 personagens da lista e acompanhe a árvore de decisão. |

## Proposta do projeto

**Como uma máquina consegue descobrir algo fazendo poucas perguntas?** O ProjetoMD transforma essa pergunta em uma experiência interativa. A cada resposta, o participante observa um conjunto de possibilidades diminuir até chegar a um número, um perfil ou um personagem.

O objetivo é relacionar conceitos de Matemática Discreta com algoritmos que podem ser vistos em ação. Os jogos permitem experimentar estratégias, acompanhar decisões e comparar a quantidade de passos necessária para encontrar uma resposta. A proposta é educativa: o participante fornece as pistas, e o programa aplica regras sobre uma base conhecida de possibilidades.

## Os três níveis

### Nível 1 — Busca em um intervalo numérico

Em **Desafiar a Máquina**, o programa sorteia um número de 1 a 100. O jogador tem até sete palpites e recebe dicas de “maior” ou “menor”. É possível experimentar palpites aleatórios ou usar uma estratégia que divida o intervalo ao meio.

Em **Máquina Vidente**, os papéis se invertem: o participante pensa em um número de 0 a 100, e o programa escolhe o meio do intervalo como próximo palpite. As respostas eliminam a metade que não pode conter o número. Com pistas coerentes, a busca binária encontra qualquer número desse intervalo em até sete palpites.

### Nível 2 — Combinações de características

No **Genius Característico**, o participante pensa em um perfil com uma opção de cada categoria: textura do cabelo, comprimento do cabelo, cor dos olhos e uso de óculos. O produto cartesiano dessas opções gera **3 × 3 × 3 × 2 = 54 perfis**.

A máquina faz perguntas de Sim/Não e mostra os candidatos restantes e o histórico. A abertura pode variar; nas perguntas seguintes, o critério minimax procura reduzir o tamanho do maior grupo que poderia restar. Ao sobrar um perfil, o jogo pede a confirmação: a máquina só vence se o participante confirmar que acertou. Se o participante negar o único perfil restante, o jogo informa que nenhuma das opções disponíveis corresponde ao perfil imaginado considerando suas respostas, sem declarar vencedor. Essa confirmação não consome uma das sete perguntas. As perguntas permitidas identificam qualquer perfil em até sete respostas coerentes: no máximo duas para cada categoria com três opções e uma para a categoria com duas opções.

### Nível 3 — Dedução e árvore de decisão

O **Akinator** trabalha com uma lista de **24 personagens cadastrados**, cada um descrito por traços. O participante escolhe alguém da lista e responde às perguntas para que o programa encontre um candidato e peça a confirmação do palpite.

Além de Sim e Não, o motor aceita respostas incertas, como “Não sei” e “Provavelmente”. A interface apresenta a árvore de decisão e permite comparar estratégias de escolha de perguntas. Com respostas firmes e coerentes, é possível acompanhar o caminho percorrido na árvore; com incerteza, a dedução deixa de seguir um único caminho binário.

## Onde entra a Matemática Discreta?

| Conceito | Aplicação no projeto |
| --- | --- |
| Conjuntos e predicados | Cada característica define quais candidatos permanecem após uma resposta. |
| Produto cartesiano e combinatória | As opções das quatro categorias formam os 54 perfis do Genius. |
| Busca binária e logaritmos | Dividir o intervalo numérico ao meio reduz o número de palpites para O(log n). |
| Árvores binárias de decisão | Cada pergunta cria ramificações Sim/Não até chegar a uma folha com um candidato. |
| Estratégias de busca | Perguntas equilibradas são comparadas com ordem fixa, escolha aleatória e busca linear. |
| Complexidade de algoritmos | Contadores e análises ajudam a discutir operações, quantidade de perguntas e uso de memória. |

Uma árvore binária com altura h comporta no máximo 2^h folhas. Por isso, distinguir 24 personagens exige altura de pelo menos ⌈log₂ 24⌉ = 5. Na base atual, a estratégia equilibrada atinge esse limite com respostas Sim/Não coerentes.

**Quantidade de perguntas e tempo de processamento são medidas diferentes.** Escolher uma boa pergunta também exige avaliar candidatos e características. A [documentação do backend](backend/README.md#matemática-e-custo-computacional) detalha essa distinção e os custos dos algoritmos.

## Tecnologias e funcionamento

| Camada | Tecnologias | Responsabilidade |
| --- | --- | --- |
| Interface web | React 19, TypeScript, Vite e Tailwind CSS | Exibir os jogos, receber respostas e visualizar o espaço de busca. |
| API principal | Python, FastAPI e Pydantic | Manter as partidas, validar entradas e executar a lógica dos quatro modos. |
| Verificação | pytest, testes Node/TypeScript e GitHub Actions | Conferir regras dos jogos, contratos HTTP, tipos e build. |
| Implementação alternativa | Express e TypeScript | Preservar outro motor de Akinator para estudo, separado da API usada pela interface. |

O navegador envia ações à API principal, que devolve o estado atualizado da partida. O Genius também oferece um modo local executado no próprio navegador. As sessões da API ficam em memória, sem banco de dados ou login.

## Começar

Requisitos: Python 3.10 ou superior, Node.js 24 e pnpm 12.14.0. A demonstração completa usa **somente a API Python e o frontend**, na mesma cópia deste repositório.

Terminal 1, na raiz:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python -m uvicorn app.api:app --host 127.0.0.1 --port 8000
```

No Windows: use `python` no lugar de `python3` e `.venv\Scripts\activate` para ativar o ambiente.

Terminal 2, na raiz:

```bash
cd frontend
corepack pnpm install --frozen-lockfile
corepack pnpm dev --host 127.0.0.1
```

Abra http://localhost:5173. Saúde da API: http://localhost:8000/health. Documentação interativa: http://localhost:8000/docs.
Se `corepack` não estiver instalado, instale o pnpm e use `pnpm` nos comandos.

## Documentação

- [Preparação e roteiro de apresentação](docs/apresentacao.md)
- [Backend, endpoints e complexidade](backend/README.md)
- [Frontend e configuração](frontend/README.md)
- [Resultados da validação](docs/validacao.md)
- [Mapa da integração das branches](docs/integracao.md)
- [Como contribuir](CONTRIBUTING.md)
- [Proteção da main](docs/protecao-github.md)

## Verificar a entrega

```bash
cd backend
python -m pytest -q
cd ../frontend
corepack pnpm test
corepack pnpm build
```

O build verifica TypeScript e gera `frontend/dist`. Depois use `corepack pnpm preview --host 127.0.0.1` para conferir a versão de produção. Mantenha a API ligada.

## Organização

`frontend/src` contém a interface React/TypeScript; `backend/app` contém todos os jogos e a API FastAPI; `backend/tests` contém os testes Python.
`backend/src` preserva uma implementação alternativa do Akinator em Express/TypeScript, com contrato próprio em `/api/akinator`. Ela não é usada pela interface integrada. Veja o [mapa da integração](docs/integracao.md).

As partidas ficam em memória. Reiniciar a API apaga as sessões; abra uma nova partida no menu. Instale as dependências antes da apresentação: com os pacotes instalados, os jogos não precisam de serviços externos.

## Participação do grupo

Para enviar alterações, siga o [guia de contribuição](CONTRIBUTING.md). As tarefas e o acompanhamento das entregas estão descritos no [guia de issues e organização](docs/tarefas.md).
