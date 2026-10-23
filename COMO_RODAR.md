# 🚀 Guia de Execução: Backend + Frontend

Este guia passo a passo foi feito para que qualquer pessoa (mesmo quem nunca rodou o projeto antes) consiga baixar, configurar e rodar o **Backend (FastAPI)** e o **Frontend (React)** funcionando juntos de forma 100% local.

---

## 📋 1. Pré-requisitos

Antes de começar, certifique-se de ter instalado em seu computador:

1. **Git:** [Download do Git](https://git-scm.com/)
2. **Python (versão 3.10 ou superior):** [Download do Python](https://www.python.org/)
   - *Importante no Windows:* Marque a caixinha **"Add python.exe to PATH"** na tela de instalação.
3. **Node.js (versão LTS 20 ou 24):** [Download do Node.js](https://nodejs.org/)
4. **pnpm (gerenciador de pacotes do frontend):**
   - Se já tiver o Node.js, basta rodar uma vez no terminal:
     ```bash
     npm install -g pnpm
     ```
     *(ou ative o Corepack do Node com `corepack enable`)*

---

## 📥 2. Baixar o Projeto e Selecionar a Branch

Abra o seu terminal (ou o terminal integrado do VS Code) e execute:

```bash
# 1. Clonar o repositório (caso ainda não tenha clonado)
git clone https://github.com/ElisaAndradedeJesus/ProjetoMD.git

# 2. Entrar na pasta do projeto
cd ProjetoMD

# 3. Baixar as branches mais recentes do GitHub
git fetch

# 4. Alternar para a branch com o backend e frontend completos
git checkout feature/backend-genius
```

---

## ⚙️ 3. Iniciando o Backend (Terminal 1)

O backend roda em Python com **FastAPI** na porta `8000`.

Abra uma aba de terminal na pasta raiz `ProjetoMD` e execute:

### No Linux / macOS:
```bash
# Entrar na pasta do backend
cd backend

# Criar o ambiente virtual (apenas na 1ª vez)
python3 -m venv .venv

# Ativar o ambiente virtual
source .venv/bin/activate

# Instalar as dependências
pip install -r requirements.txt

# Iniciar o servidor com reload automático
uvicorn app.api:app --reload --port 8000
```

### No Windows (PowerShell):
```powershell
# Entrar na pasta do backend
cd backend

# Criar o ambiente virtual (apenas na 1ª vez)
python -m venv .venv

# Ativar o ambiente virtual
.venv\Scripts\Activate.ps1

# Se der erro de política de execução no PowerShell, execute antes:
# Set-ExecutionPolicy -Scope CurrentUser RemoteSigned

# Instalar as dependências
pip install -r requirements.txt

# Iniciar o servidor
uvicorn app.api:app --reload --port 8000
```

✅ **Como saber se o backend funcionou?**
- O terminal exibirá: `Uvicorn running on http://127.0.0.1:8000`
- Acesse a documentação interativa das rotas no navegador: [http://localhost:8000/docs](http://localhost:8000/docs)

> **Deixe esse terminal aberto rodando!**

---

## 🎨 4. Iniciando o Frontend (Terminal 2)

O frontend roda com **React, TypeScript e Vite** na porta `5173`.

Abra um **segundo terminal** (sem fechar o primeiro) na pasta raiz `ProjetoMD` e execute:

```bash
# 1. Entrar na pasta do frontend
cd frontend

# 2. Instalar as dependências do Node (apenas na 1ª vez)
pnpm install

# 3. Iniciar o servidor de desenvolvimento
pnpm dev
```

✅ **Como saber se o frontend funcionou?**
- O terminal exibirá: `➜ Local: http://localhost:5173/`
- Abra o navegador e acesse: **[http://localhost:5173](http://localhost:5173)**

---

## 🎮 5. Jogando e Conferindo a Integração

Com os dois terminais abertos:

1. Acesse **[http://localhost:5173](http://localhost:5173)** no seu navegador.
2. Na tela inicial, clique no card verde: **"Genius Característico"**.
3. Observe no cabeçalho da página:
   - Você verá a indicação: **`🟢 Modo API (FastAPI) · Pronto para começar`**.
4. Clique no botão **"Começar"**:
   - O frontend fará uma requisição `POST /genius` para o seu backend local.
   - A máquina sorteará uma pergunta de abertura dinâmica.
5. Conforme você responder **"Sim"** ou **"Não"**:
   - O frontend enviará cada resposta para o backend.
   - Olhe para a tela do **Terminal 1 (Backend)**: você verá em tempo real os logs de **Big-O** calculando a eliminação dos candidatos e a próxima pergunta ótima!
6. No final, a máquina acertará seu perfil em até 7 tentativas!

---

## 💻 6. Modo Bônus: Jogando pelo Terminal (CLI)

Se quiser testar o jogo direto no terminal sem abrir o navegador:

No Terminal 1 (com o ambiente `.venv` ativado):
```bash
cd backend
python -m app.cli
```
1. Digite `3` para escolher o **Genius Característico**.
2. O terminal fará as perguntas e aceitará respostas `s` (sim) ou `n` (não), exibindo as métricas de tempo e operações assintóticas após cada jogada.

---

## 🧪 7. Rodando os Testes Automatizados

Para certificar-se de que tudo está funcionando perfeitamente:

### Testes do Backend (162 testes):
```bash
cd backend
source .venv/bin/activate   # ou .venv\Scripts\Activate no Windows
pytest
```

### Testes do Frontend:
```bash
cd frontend
node --experimental-strip-types --test tests/genius.test.ts
pnpm build
```

---

## ❓ 8. Solução de Problemas Frequentes

- **"A porta 8000 já está em uso"**:
  Feche qualquer outra janela ou processo rodando na porta 8000 ou finalize com `fuser -k 8000/tcp` (Linux) ou pelo Gerenciador de Tarefas (Windows).
- **"pnpm: comando não encontrado"**:
  Rode `npm install -g pnpm` ou utilize o Corepack: `corepack enable`.
- **"Modo local ativado / Erro de conexão com a API"**:
  Confira se o Terminal 1 com o `uvicorn` ainda está rodando e acessível em `http://localhost:8000/health`. Se o backend for interrompido, o frontend automaticamente permite jogar no modo local offline sem quebrar.
