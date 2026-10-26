# API dos jogos

A API principal usa Python 3.10+ e FastAPI. Ela atende todos os níveis em http://localhost:8000. Siga a [instalação na raiz](../README.md#começar).

```bash
# dentro de backend, com .venv ativado
python -m uvicorn app.api:app --reload
python -m pytest -q
python -m app.cli
python -m app.analise
python -m app.analise_akinator
```

A CLI oferece os jogos numéricos e o Genius. O Akinator tem interface web. `BIGO_VERBOSE=0` desativa os logs de operações. A análise do Akinator compara perguntas equilibradas, ordem fixa, aleatórias e busca linear.

## Rotas principais

| Operação | Rota | Corpo JSON |
| --- | --- | --- |
| Saúde | `GET /health` | — |
| Criar desafio | `POST /desafiar-maquina` | — |
| Palpitar | `POST /desafiar-maquina/{id}/palpite` | `{"numero": 50}` |
| Criar vidente | `POST /maquina-vidente` | — |
| Responder vidente | `POST /maquina-vidente/{id}/feedback` | `{"feedback": "maior"}` (ou `menor`, `acertou`) |
| Criar Genius | `POST /genius` | — |
| Responder Genius | `POST /genius/{id}/resposta` | `{"resposta": true}` (ou `false`) |
| Listar personagens | `GET /akinator/personagens` | — |
| Criar Akinator | `POST /akinator` | — |
| Responder Akinator | `POST /akinator/{id}/resposta` | `{"resposta": "sim"}` (ou `nao`, `nsei`, `psim`, `pnao`) |
| Confirmar palpite | `POST /akinator/{id}/confirmacao` | `{"acertou": true}` |
| Árvore | `GET /akinator/arvore?estrategia=metade` | — |
| Comparar estratégias | `GET /akinator/analise` | — |

Cada jogo também oferece `GET /<jogo>/{id}` para consultar a sessão. Consulte os schemas em `/docs`. Sessões ficam em memória; não rode múltiplos workers para a demonstração. Erros de sessão retornam 404; ações inválidas, 400; corpos inválidos, 422.

## Matemática e custo computacional

- **Desafio:** comparação O(1) por palpite, O(k) para k palpites e histórico O(k). O jogador pode usar busca binária, mas o jogo não impõe essa estratégia.
- **Vidente:** o intervalo de 101 números diminui pela metade; no máximo 7 palpites. O algoritmo de busca usa O(log n) passos e histórico O(log n). A serialização do histórico e os logs têm custo adicional.
- **Genius:** produto cartesiano 3 × 3 × 3 × 2 = 54 perfis. Perguntas testam uma opção de uma categoria; cada categoria ternária exige no máximo duas respostas e a binária, uma: 2 + 2 + 2 + 1 = 7. A primeira pergunta varia; depois o critério minimax minimiza o maior grupo restante. O limite de perguntas não é o custo de CPU: avaliar q perguntas sobre c candidatos custa O(q·c), além de filtrar e serializar candidatos. O jogo mantém O(n + k) dados de candidatos/histórico, com quantidade fixa de atributos.
- **Akinator:** a árvore equilibrada dos 24 personagens tem altura 5 e média próxima de 4,67 perguntas com Sim/Não coerentes. O limite informacional é ⌈log₂(24)⌉ = 5; traços arbitrários nem sempre permitem atingir esse limite. O motor avalia traços e candidatos, portanto contar perguntas não equivale a medir o tempo total de execução. Respostas incertas podem sair do caminho da árvore.

Tempos medidos variam com máquina e instrumentação. Os contadores registram operações explícitas, sem substituir uma análise completa de CPU/memória.

## Akinator alternativo em TypeScript

A entrega de `feature/backend-akinator` foi preservada em `backend/src`, com Express, testes e contrato próprio. **A interface integrada usa a implementação Python.** Para estudar a alternativa:

```bash
corepack pnpm install --frozen-lockfile
corepack pnpm typecheck
corepack pnpm test
corepack pnpm dev
```

Porta padrão 3001. Rotas: `GET /api/akinator/people`, `POST /api/akinator/start`, `/answer` e `/confirm`. Os corpos e respostas estão em `src/akinator/akinator.dto.ts`; eles diferem da API Python. Não substitua `VITE_API_URL` por essa porta para apresentar o projeto completo.
