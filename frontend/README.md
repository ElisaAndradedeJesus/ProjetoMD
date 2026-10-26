# Frontend — três níveis de adivinhação

React 19, TypeScript, Vite e Tailwind CSS. O menu reúne os dois jogos numéricos, Genius e Akinator. Todos usam a API Python por padrão.

## Executar

Com Node.js 24 e pnpm 12.14.0, na pasta `frontend`:

```bash
corepack pnpm install --frozen-lockfile
corepack pnpm dev --host 127.0.0.1
```

Abra http://localhost:5173 e mantenha a API em http://localhost:8000. Não é necessário criar outro worktree.
Veja a [instalação completa](../README.md).

## Configurar

Opcionalmente crie `frontend/.env.local` (não enviar ao Git):

```dotenv
VITE_API_URL=http://localhost:8000
VITE_GENIUS_MODE=api
```

Reinicie o Vite depois de mudar variáveis. No build, as variáveis ficam incorporadas aos arquivos gerados.
`VITE_GENIUS_MODE=local` ativa o Genius no navegador. O botão de modo também inicia uma nova partida no modo escolhido. Os demais jogos precisam da API.

## Conferir

```bash
corepack pnpm test
corepack pnpm typecheck
corepack pnpm build
corepack pnpm preview --host 127.0.0.1
```

Os testes percorrem os 54 perfis do Genius, conferem isolamento/reinício de sessões e o contrato HTTP do adaptador. O build também verifica os tipos.

## Jogar

- Nível 1: palpites de 1 a 100 no desafio; na Máquina Vidente, pense em 0 a 100 e informe se seu número é maior, menor ou igual ao palpite.
- Nível 2: mantenha uma característica de cada categoria; as 54 combinações podem ser identificadas em até sete respostas coerentes.
- Nível 3: escolha um personagem da lista exibida pelo Akinator. Respostas Sim/Não permitem acompanhar o caminho na árvore; respostas incertas usam a dedução do motor.

Falha de conexão: confira `/health`, a porta 8000 e `VITE_API_URL`. Se a API foi reiniciada, volte ao menu e abra outra partida.
