# Busca Binária e Árvores de Decisão — Jogos de Adivinhação

Monorepo do trabalho de Matemática Discreta. Três modos de jogo para estudar complexidade (Big O) e partição do espaço amostral:

| Modo | Quem adivinha | Espaço de Busca | Tentativas | Complexidade |
|---|---|---|---|---|
| **Desafiar a Máquina** | o usuário | 1–100 (números) | 7 | O(1) por palpite, O(k) por partida |
| **Máquina Vidente** | a máquina (busca binária) | 0–100 (números) | 7 | O(log n) por partida |
| **Genius Característico** | a máquina (árvore minimax) | 54 perfis combinatórios | 7 | O(log n) equivalente |

Por que 7 tentativas?
- Na **Máquina Vidente**, a busca binária corta o intervalo pela metade a cada palpite. Para 101 números: 101 → 50 → 25 → 12 → 6 → 3 → 1. Isso dá ⌈log2(101+1)⌉ = **7** passos no pior caso.
- No **Genius Característico**, o espaço amostral tem $3 \times 3 \times 3 \times 2 = 54$ perfis. Com divisões ternárias e binárias, 7 perguntas garantem matematicamente 100% de taxa de descoberta para qualquer perfil.

```
.
├── backend/            API em Python (FastAPI)
│   ├── app/
│   │   ├── complexidade.py      contador de operações + prints [BIG-O]
│   │   ├── jogos/
│   │   │   ├── desafiar_maquina.py
│   │   │   ├── maquina_vidente.py
│   │   │   └── genius.py        árvore minimax com desempate estocástico
│   │   ├── api.py               rotas HTTP (FastAPI)
│   │   ├── cli.py               jogar pelo terminal
│   │   └── analise.py           linear O(n) x binária O(log n)
│   └── tests/                   162 testes automatizados (pytest)
└── frontend/           Interface visual (React + Vite + Tailwind)
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

**Genius Característico**
- `POST /genius` → cria partida, sorteia abertura dinâmica entre as 4 categorias e calcula a 1ª pergunta
- `POST /genius/{id}/resposta` body `{"resposta": true | false}` → atualiza candidatos por árvore minimax e calcula próxima pergunta
- `GET  /genius/{id}` → estado completo da partida, candidatos remanescentes, histórico e perfil descoberto

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
| Partida do Genius Característico | **O(log n)** equivalente | árvore minimax reduz os candidatos exponencialmente |
| Busca linear (comparação) | O(n) | testa número por número |

Resultado de `python -m app.analise` (pior caso, nº de comparações):

| n | linear O(n) | binária O(log n) |
|---:|---:|---:|
| 100 | 100 | 7 |
| 1.000 | 1.000 | 10 |
| 1.000.000 | 1.000.000 | 20 |
| 1.000.000.000 | 1.000.000.000 | 30 |
