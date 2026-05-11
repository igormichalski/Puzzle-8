LIMITE_PADRAO = 50


def buscar(grafo, inicio, objetivo, heuristica=None, limite=LIMITE_PADRAO):
    pilha = [(inicio, [inicio], 0, 0)]
    visitados = set()

    while pilha:
        cidade, caminho, custo, profundidade = pilha.pop()
        if cidade in visitados:
            continue
        visitados.add(cidade)
        yield {"tipo": "no", "no": cidade}
        if cidade == objetivo:
            yield {"tipo": "caminho", "caminho": caminho, "custo": custo, "nos_expandidos": len(visitados)}
            return
        if profundidade < limite:
            for vizinho, peso in reversed(grafo[cidade]):
                if vizinho not in visitados:
                    pilha.append((vizinho, caminho + [vizinho], custo + peso, profundidade + 1))

    yield {"tipo": "sem_solucao"}
