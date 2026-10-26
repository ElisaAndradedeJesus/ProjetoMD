# Integração para apresentação

Base consultada em 26/10/2026: `origin/main` em `0bba1a5`.

| Branch | Entrega incorporada |
| --- | --- |
| `staging`, `feature/backend`, `feature/frontend` | Jogos numéricos, API e frontend; já presentes na main por squash. |
| `feature/frontend-genius` (`e80a888`) | Interface e backend Python do Genius, sete perguntas e testes. |
| `feature/frontend-akinator` (`077d400`) | Interface inicial, ancestral da entrega Python do Akinator. |
| `feature/akinator-backend` (`5c277e8`) | Akinator Python, integração HTTP, árvore e comparação de estratégias. |
| `feature/backend-akinator` (`aacd9bd`) | Alternativa Express/TypeScript preservada em `backend/src`. |
| `docs/organizacao-grupos` (`b17e6bd`) | Fluxo de issues e template de PR. |

A versão de apresentação usa FastAPI para todos os jogos: isso corresponde ao contrato usado pelo frontend e às rotas da visualização da árvore. O backend TypeScript permanece disponível para estudo e testes com seu contrato próprio.

Merges anteriores por squash causaram conflitos de arquivos adicionados nas duas linhas de histórico. A integração preservou os jogos e unificou os imports, os modelos distintos de resposta de Genius/Akinator e o menu. Não foi necessário apagar branches nem reescrever histórico.

Os três níveis são pedagógicos; o nível numérico oferece dois modos. As páginas `grupo-1`, `grupo-2` e `grupo-3` descrevem os níveis sem atribuir autoria não registrada.
