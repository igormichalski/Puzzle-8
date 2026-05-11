def buscar(grafo, inicio, objetivo, heuristica):
    explorados = []

    def dfs_limitado(caminho, g, limite, visitados):
        cidade = caminho[-1]
        f = g + heuristica[cidade]
        if f > limite:
            return 'CONTINUAR', f
        explorados.append(cidade)
        if cidade == objetivo:
            return 'ENCONTRADO', g
        proximo_minimo = float('inf')
        for vizinho, peso in grafo[cidade]:
            if vizinho not in visitados:
                visitados.add(vizinho)
                caminho.append(vizinho)
                resultado, valor = dfs_limitado(caminho, g + peso, limite, visitados)
                if resultado == 'ENCONTRADO':
                    return 'ENCONTRADO', valor
                if valor < proximo_minimo:
                    proximo_minimo = valor
                caminho.pop()
                visitados.remove(vizinho)
        return 'CONTINUAR', proximo_minimo

    limite = heuristica[inicio]

    while True:
        caminho = [inicio]
        visitados = {inicio}
        resultado, valor = dfs_limitado(caminho, 0, limite, visitados)

        if resultado == 'ENCONTRADO':
            for no in explorados:
                yield {"tipo": "no", "no": no}
            yield {"tipo": "caminho", "caminho": caminho, "custo": valor, "nos_expandidos": len(explorados)}
            return

        if valor == float('inf'):
            for no in explorados:
                yield {"tipo": "no", "no": no}
            yield {"tipo": "sem_solucao"}
            return

        limite = valor
