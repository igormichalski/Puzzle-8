import heapq


def buscar(grafo, inicio, objetivo, heuristica=None):
    heap = [(0, 0, inicio, [inicio])]
    visitados = set()
    contador = 0

    while heap:
        custo, _, cidade, caminho = heapq.heappop(heap)
        if cidade in visitados:
            continue
        visitados.add(cidade)
        yield {"tipo": "no", "no": cidade}
        if cidade == objetivo:
            yield {"tipo": "caminho", "caminho": caminho, "custo": custo, "nos_expandidos": len(visitados)}
            return
        for vizinho, peso in grafo[cidade]:
            if vizinho not in visitados:
                contador += 1
                heapq.heappush(heap, (custo + peso, contador, vizinho, caminho + [vizinho]))

    yield {"tipo": "sem_solucao"}
