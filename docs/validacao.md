# Validação da integração — 26/10/2026

Ambiente: Python 3.12, Node.js 24.18.0 e pnpm 12.14.0.

| Verificação | Resultado |
| --- | --- |
| API Python: `python -m pytest -q backend/tests` | 424 testes passaram. |
| Frontend: `pnpm test` | Arquivo de testes passou; percorre 54 perfis, reinício, isolamento e adaptador HTTP. |
| Frontend: `pnpm build` | TypeScript e build Vite passaram. |
| Akinator TypeScript: `pnpm typecheck` | Passou. |
| Akinator TypeScript: `pnpm test` | 12 testes passaram, incluindo HTTP. |
| Instalação dos dois pacotes com `--frozen-lockfile` | Passou com pnpm 12.14.0. |

O teste de integração confirma que as respostas booleanas do Genius e as respostas textuais do Akinator coexistem sem conflito, e que IDs de jogos diferentes retornam 404.

A execução Python exibiu um aviso de depreciação de integração Starlette/httpx no ambiente existente; não houve falha. O workflow `Validar projeto` repete as verificações no GitHub; seu resultado remoto depende da execução do Actions.

Não foi feita inspeção interativa em navegador nem no projetor. O [roteiro de apresentação](apresentacao.md) contém a conferência manual restante. A fonte Poppins usa Google Fonts; sem internet, o CSS usa a fonte de sistema. Os jogos não usam serviços externos durante a partida.
