# Busca Binária — Jogos de Adivinhação

Monorepo do trabalho de Matemática Discreta. Dois modos de jogo para estudar complexidade (Big O):

| Modo | Quem adivinha | Intervalo | Tentativas | Complexidade |
|---|---|---|---|---|
| **Desafiar a Máquina** | o usuário | 1–100 | 7 | O(1) por palpite, O(k) por partida |
| **Máquina Vidente** | a máquina (busca binária) | 0–100 | 7 | O(log n) por partida |

Por que 7 tentativas? A busca binária corta o intervalo pela metade a cada palpite.
Para 101 números: 101 → 50 → 25 → 12 → 6 → 3 → 1. Isso dá ⌈log2(101+1)⌉ = **7** passos no pior caso.

```
.
├── backend/            API em Python (FastAPI)
│   ├── app/
│   │   ├── complexidade.py      contador de operações + prints [BIG-O]
│   │   ├── jogos/
│   │   │   ├── desafiar_maquina.py
│   │   │   └── maquina_vidente.py
│   │   ├── api.py               rotas HTTP
│   │   ├── cli.py               jogar pelo terminal
│   │   └── analise.py           linear O(n) x binária O(log n)
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
pytest                             # testes
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

Resultado de `python -m app.analise` (pior caso, nº de comparações):

| n | linear O(n) | binária O(log n) |
|---:|---:|---:|
| 100 | 100 | 7 |
| 1.000 | 1.000 | 10 |
| 1.000.000 | 1.000.000 | 20 |
| 1.000.000.000 | 1.000.000.000 | 30 |
