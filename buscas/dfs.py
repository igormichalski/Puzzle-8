from collections import deque


def buscar(grafo, inicio, objetivo, heuristica=None):
    pilha = [(inicio, [inicio], 0)]
    visitados = set()

    while pilha:
        cidade, caminho, custo = pilha.pop()
        if cidade in visitados:
            continue
        visitados.add(cidade)
        yield {"tipo": "no", "no": cidade}
        if cidade == objetivo:
            yield {"tipo": "caminho", "caminho": caminho, "custo": custo, "nos_expandidos": len(visitados)}
            return
        for vizinho, peso in reversed(grafo[cidade]):
            if vizinho not in visitados:
                pilha.append((vizinho, caminho + [vizinho], custo + peso))

    yield {"tipo": "sem_solucao"}
