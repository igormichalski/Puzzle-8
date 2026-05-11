from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List
import json

from buscas import bfs, ucs, dfs, dfs_limitada, gulosa, a_estrela, ida_estrela

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

ALGORITMOS = {
    'bfs':          ('BFS',       bfs),
    'ucs':          ('UCS',       ucs),
    'dfs':          ('DFS',       dfs),
    'dfs_limitada': ('DFS Lim.',  dfs_limitada),
    'gulosa':       ('Gulosa',    gulosa),
    'a_estrela':    ('A*',        a_estrela),
    'ida_estrela':  ('IDA*',      ida_estrela),
}

GOAL     = (1, 2, 3, 8, 0, 4, 7, 6, 5)
MAX_NOS  = 1000

def heuristica_puzzle(estado):
    """Distância de Manhattan para o estado objetivo."""
    dist = 0
    for i, peca in enumerate(estado):
        if peca == 0:
            continue
        j = GOAL.index(peca)
        dist += abs(i // 3 - j // 3) + abs(i % 3 - j % 3)
    return dist

class HeuristicaPuzzle:
    def __getitem__(self, estado):
        return heuristica_puzzle(estado)

def sucessores_puzzle(estado):
    pos = estado.index(0)
    row, col = pos // 3, pos % 3
    movimentos = []
    if row > 0: movimentos.append(pos - 3)
    if row < 2: movimentos.append(pos + 3)
    if col > 0: movimentos.append(pos - 1)
    if col < 2: movimentos.append(pos + 1)
    resultado = []
    for novo_pos in movimentos:
        lista = list(estado)
        lista[pos], lista[novo_pos] = lista[novo_pos], lista[pos]
        resultado.append((tuple(lista), 1))
    return resultado

class GrafoPuzzle:
    def __getitem__(self, estado):
        return sucessores_puzzle(estado)

class BuscarRequest(BaseModel):
    estado_inicial: List[int]
    algoritmo: str

def gerar_eventos(req: BuscarRequest):
    if req.algoritmo not in ALGORITMOS:
        yield f"data: {json.dumps({'tipo': 'erro', 'mensagem': 'Algoritmo inválido'})}\n\n"
        return

    nome, modulo = ALGORITMOS[req.algoritmo]
    inicio   = tuple(req.estado_inicial)
    objetivo = GOAL
    grafo    = GrafoPuzzle()
    h        = HeuristicaPuzzle()

    try:
        nos_expandidos = 0
        for evento in modulo.buscar(grafo, inicio, objetivo, h):
            if evento["tipo"] == "no":
                nos_expandidos += 1
                if nos_expandidos > MAX_NOS:
                    yield f"data: {json.dumps({'tipo': 'erro', 'mensagem': f'Limite de {MAX_NOS} nós atingido. Use um algoritmo mais eficiente (A*, IDA*, Gulosa).'})}\n\n"
                    return
                yield f"data: {json.dumps({'tipo': 'estado', 'estado': list(evento['no'])})}\n\n"
            elif evento["tipo"] == "caminho":
                passos = [list(s) for s in evento["caminho"]]
                yield f"data: {json.dumps({'tipo': 'caminho', 'passos': passos, 'custo': evento['custo'], 'nos_expandidos': evento['nos_expandidos']})}\n\n"
            elif evento["tipo"] == "sem_solucao":
                yield f"data: {json.dumps({'tipo': 'sem_solucao'})}\n\n"
    except Exception as e:
        yield f"data: {json.dumps({'tipo': 'erro', 'mensagem': str(e)})}\n\n"

    yield f"data: {json.dumps({'tipo': 'fim'})}\n\n"

@app.get("/")
def raiz():
    return {"status": "Puzzle backend rodando"}

@app.post("/resolver")
def resolver(req: BuscarRequest):
    return StreamingResponse(
        gerar_eventos(req),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        }
    )
