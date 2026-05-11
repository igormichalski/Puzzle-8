import heapq

def buscar(grafo, inicio, objetivo, heuristica):
    heap = [(heuristica[inicio], 0, inicio, [inicio])]
    visitados = set()

    while heap:
        f, g, cidade, caminho = heapq.heappop(heap)
        if cidade in visitados:
            continue
        visitados.add(cidade)
        yield {"tipo": "no", "no": cidade}
        if cidade == objetivo:
            yield {"tipo": "caminho", "caminho": caminho, "custo": g, "nos_expandidos": len(visitados)}
            return
        for vizinho, peso in grafo[cidade]:
            if vizinho not in visitados:
                g_novo = g + peso
                heapq.heappush(heap, (g_novo + heuristica[vizinho], g_novo, vizinho, caminho + [vizinho]))

    yield {"tipo": "sem_solucao"}
