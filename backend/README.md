# Busca Binária — Jogos de Adivinhação

Monorepo do trabalho de Matemática Discreta. Modos de jogo para estudar complexidade (Big O):

| Modo | Quem adivinha | Intervalo | Tentativas | Complexidade |
|---|---|---|---|---|
| **Desafiar a Máquina** | o usuário | 1–100 | 7 | O(1) por palpite, O(k) por partida |
| **Máquina Vidente** | a máquina (busca binária) | 0–100 | 7 | O(log n) por partida |
| **Akinator** | a máquina (perguntas de sim/não) | 24 perfis | até 16 perguntas | ~⌈log2 n⌉ perguntas, O(k · n) por pergunta |

Por que 7 tentativas? A busca binária corta o intervalo pela metade a cada palpite.
Para 101 números: 101 → 50 → 25 → 12 → 6 → 3 → 1. Isso dá ⌈log2(101+1)⌉ = **7** passos no pior caso.

```
.
├── backend/            API em Python (FastAPI) + API do Akinator em Node.js (Express)
│   ├── app/
│   │   ├── complexidade.py      contador de operações + prints [BIG-O]
│   │   ├── jogos/
│   │   │   ├── desafiar_maquina.py
│   │   │   └── maquina_vidente.py
│   │   ├── api.py               rotas HTTP
│   │   ├── cli.py               jogar pelo terminal
│   │   └── analise.py           linear O(n) x binária O(log n)
│   ├── src/                     Akinator (TypeScript)
│   │   ├── akinator/
│   │   │   ├── akinator.data.ts     24 perfis e 16 traços (os mesmos do frontend)
│   │   │   ├── akinator.dto.ts      contratos JSON das rotas
│   │   │   ├── akinator.engine.ts   motor de dedução
│   │   │   └── akinator.routes.ts   rotas HTTP
│   │   ├── complexidade.ts      versão TS do contador [BIG-O]
│   │   ├── app.ts
│   │   └── server.ts
│   └── tests/
└── frontend/           (próxima etapa)
```

## Rodando o backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt

python -m app.cli                  # jogar no terminal vendo os prints de Big O
python -m app.analise              # tabela comparando busca linear e binária
uvicorn app.api:app --reload       # API em http://localhost:8000/docs
python -m pytest                   # testes
```

## Rodando o backend no Ubuntu

```bash
sudo apt install python3-venv python3-pip   # só na primeira vez
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Para desligar os prints: `BIGO_VERBOSE=0`.

## Endpoints

**Desafiar a Máquina**
- `POST /desafiar-maquina` → cria partida (a máquina sorteia o número)
- `POST /desafiar-maquina/{id}/palpite` body `{"numero": 27}` → responde `maior`, `menor` ou `acertou`
- `GET  /desafiar-maquina/{id}` → estado e histórico. O `segredo` só aparece quando a partida termina.

**Máquina Vidente**
- `POST /maquina-vidente` → cria partida, já com o primeiro palpite (50)
- `POST /maquina-vidente/{id}/feedback` body `{"feedback": "maior" | "menor" | "acertou"}`
- `GET  /maquina-vidente/{id}` → estado, intervalo ativo, candidatos, histórico e "pensamento" de cada passo

Toda resposta traz um campo `complexidade` com as operações contadas e o tempo em ms.

## Akinator (Node.js + TypeScript)

O usuário pensa em um dos 24 perfis e a máquina pergunta sobre traços (cabelo curto, óculos, chapéu...).
Cada pergunta usa o traço que divide os perfis ainda possíveis mais perto da metade. Com 24 perfis, o ideal
seria ⌈log2 24⌉ = **5** perguntas; respondendo com sinceridade, a máquina acerta todos os 24 com 4 ou 5 (média 4,67).

Respostas "Provavelmente" não eliminam de cara: cada contradição soma um custo (Sim/Não = 3,
Provavelmente = 1,5, Não Sei = 0) e o perfil sai quando o custo chega a 3.

```bash
npm i -g pnpm        # só na primeira vez
cd backend
pnpm install
pnpm dev             # API em http://localhost:3001 (outra porta: PORT=4000)
pnpm test            # testes do motor e das rotas
pnpm typecheck       # confere os tipos
```

Endpoints (contratos completos em `src/akinator/akinator.dto.ts`):
- `GET  /api/akinator/people` → os 24 perfis
- `POST /api/akinator/start` → cria partida, já com a primeira pergunta
- `POST /api/akinator/answer` body `{"sessionId": "...", "questionKey": "sorriso", "answer": "sim"}` → próxima pergunta ou o palpite (`phase: "palpite"`, com `confidence`). `answer` aceita `sim`, `nao`, `nsei`, `psim` e `pnao`
- `POST /api/akinator/confirm` body `{"sessionId": "...", "correct": true}` → fecha a partida (`phase: "fim"`)

Erros voltam como `{"detail": "..."}` (400, 404 ou 409), o mesmo formato da API em Python.
O `Akinator.tsx` do frontend lê `VITE_API_URL`, a mesma variável dos modos em Python: para usar os dois
backends juntos, o frontend precisa de uma variável própria ou de um proxy `/api` → `localhost:3001` no Vite.

## Análise de complexidade

| Operação | Custo | Por quê |
|---|---|---|
| Sortear o número | O(1) | `random.randint` |
| Avaliar um palpite | O(1) | no máximo 2 comparações |
| Calcular o meio do intervalo | O(1) | `(baixo + alto) // 2` |
| Guardar no histórico | O(1) amortizado | `list.append` |
| Buscar partida pelo id | O(1) médio | dicionário (hash table) |
| Partida da Máquina Vidente | **O(log n)** | o intervalo cai pela metade a cada passo |
| Busca linear (comparação) | O(n) | testa número por número |
| Akinator: atualizar custos após uma resposta | O(n) | um custo por perfil |
| Akinator: escolher a próxima pergunta | O(k · n) | para cada traço restante, conta quantos possíveis o têm |

Resultado de `python -m app.analise` (pior caso, nº de comparações):

| n | linear O(n) | binária O(log n) |
|---:|---:|---:|
| 100 | 100 | 7 |
| 1.000 | 1.000 | 10 |
| 1.000.000 | 1.000.000 | 20 |
| 1.000.000.000 | 1.000.000.000 | 30 |
