from collections import deque

def buscar(grafo, inicio, objetivo, heuristica=None):
    fila = deque([(inicio, [inicio], 0)])
    visitados = set()

    while fila:
        cidade, caminho, custo = fila.popleft()
        if cidade in visitados:
            continue
        visitados.add(cidade)
        yield {"tipo": "no", "no": cidade}
        if cidade == objetivo:
            yield {"tipo": "caminho", "caminho": caminho, "custo": custo, "nos_expandidos": len(visitados)}
            return
        for vizinho, peso in grafo[cidade]:
            if vizinho not in visitados:
                fila.append((vizinho, caminho + [vizinho], custo + peso))

    yield {"tipo": "sem_solucao"}
