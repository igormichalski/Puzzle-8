import heapq


def buscar(grafo, inicio, objetivo, heuristica):
    heap = [(heuristica[inicio], 0, inicio, [inicio], 0)]
    visitados = set()
    contador = 0

    while heap:
        h, _, cidade, caminho, custo = heapq.heappop(heap)
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
                heapq.heappush(heap, (heuristica[vizinho], contador, vizinho, caminho + [vizinho], custo + peso))

    yield {"tipo": "sem_solucao"}
