# O que há no nosso Frontend?

Interface do jogo da busca binária, feita com React, Vite e Tailwind CSS.
Há dois modos: **Desafiar a Máquina** (você adivinha um número de 1 a 100 em até 7 tentativas) e **Máquina Vidente** (você pensa em um número e a máquina descobre).

## Tecnologias

- [React 19](https://react.dev/)
- [Vite](https://vite.dev/)
- [Tailwind CSS 4](https://tailwindcss.com/)
- [TypeScript](https://www.typescriptlang.org/)
- [lucide-react](https://lucide.dev/) (ícones)
- [pnpm](https://pnpm.io/) como gerenciador de pacotes

## Pré-requisitos

Instale uma vez em cada computador:

1. **Git** — https://git-scm.com
2. **Node.js LTS (24.22.0)** — https://nodejs.org
   Na instalação, deixe as opções padrão (com "Add to PATH" marcado). Depois, feche e abra o VS Code.
3. **pnpm** — no terminal, rode:
   ```bash
   npm i -g pnpm
   ```

Confira se tudo foi instalado:

```bash
git -v
node -v
pnpm -v
```

Os três comandos devem mostrar uma versão.

## Primeira vez: baixar e rodar

1. Baixe o repositório (se ainda não o tem na máquina):
   ```bash
   git clone https://github.com/ElisaAndradedeJesus/ProjetoMD.git
   cd ProjetoMD
   ```
   Se já tem o repositório, entre na pasta dele e rode `git fetch`.

2. Vá para a branch de trabalho e atualize:
   ```bash
   git checkout NOME-DA-BRANCH
   git pull
   ```

3. Instale as dependências e rode o projeto:
   ```bash
   cd frontend
   pnpm install
   pnpm dev
   ```

4. Abra no navegador o endereço que aparecer no terminal (normalmente http://localhost:5173).

Para parar o servidor, use `Ctrl+C` no terminal.

## Comandos

Rode dentro da pasta `frontend/`:

| Comando        | O que faz                                          |
| -------------- | -------------------------------------------------- |
| `pnpm dev`     | Inicia o servidor de desenvolvimento               |
| `pnpm build`   | Gera a versão de produção na pasta `dist/`         |
| `pnpm preview` | Abre localmente a versão gerada pelo `pnpm build`  |

## Rotina do dia a dia

Antes de começar a mexer:

```bash
git pull
```

Se o `package.json` ou o `pnpm-lock.yaml` mudaram, rode `pnpm install` de novo dentro de `frontend/`.

Antes de enviar suas alterações:

```bash
pnpm build        # confirma que o projeto compila
git status        # confirma o que vai entrar no commit
git add frontend
git commit -m "descreva a mudança"
git push
```

## Regras para trabalhar em dupla

- **Use sempre pnpm**, nunca `npm install` nem `yarn`. O `npm install` cria um `package-lock.json` que conflita com o `pnpm-lock.yaml`.
- **Não faça commit de `node_modules/`, `dist/` nem arquivos `.env`.** O `.gitignore` já protege, mas confira o `git status` antes de commitar.
- **Faça commit do `pnpm-lock.yaml`** sempre que ele mudar (depois de instalar ou remover uma biblioteca).
- **Combinar no que mexer antes de realizar as mudanças de fato** isso será feito para evitar conflitos.
- **Faça `git pull` antes de começar** e commits pequenos e frequentes.

## Problemas comuns

**`node` ou `pnpm` não é reconhecido?**
Feche e abra o VS Code por completo. Se continuar, reinicie o computador.

**No PowerShell: "a execução de scripts foi desabilitada neste sistema"**
Rode uma vez:
```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```
e confirme com `S`.

**Erro estranho depois de um `git pull`**
Apague a pasta `node_modules` e rode `pnpm install` de novo.

**A porta 5173 já está em uso?**
Feche o outro servidor que está rodando, ou o Vite escolherá outra porta e mostrará no terminal qual é.

