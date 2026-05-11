import { useState, useRef } from "react";

const ALGORITMOS = [
  { id: "bfs",          nome: "BFS",      cor: "#3b82f6" },
  { id: "ucs",          nome: "UCS",      cor: "#8b5cf6" },
  { id: "dfs",          nome: "DFS",      cor: "#ef4444" },
  { id: "dfs_limitada", nome: "DFS Lim.", cor: "#f97316" },
  { id: "gulosa",       nome: "Gulosa",   cor: "#eab308" },
  { id: "a_estrela",    nome: "A*",       cor: "#22c55e" },
  { id: "ida_estrela",  nome: "IDA*",     cor: "#3aafa9" },
];

const ESTADO_INICIAL = [2, 8, 3, 1, 6, 4, 7, 0, 5];
const GOAL           = [1, 2, 3, 8, 0, 4, 7, 6, 5];

// Posições pré-calculadas para col/row 0,1,2
// step = (100% - 16px)/3 + 8px
// col/row 2 expandido: 2*step = (200% + 16px)/3  (evita calc() aninhado)
const POS = [
  "0px",
  "calc((100% - 16px) / 3 + 8px)",
  "calc((200% + 16px) / 3)",
];

function tileStyle(idx, algCor, inGoal) {
  const row = Math.floor(idx / 3);
  const col = idx % 3;
  return {
    position: "absolute",
    width:  "calc((100% - 16px) / 3)",
    height: "calc((100% - 16px) / 3)",
    left: POS[col],
    top:  POS[row],
    transition: "top 0.28s ease, left 0.28s ease",
    borderRadius: "clamp(8px, 2vw, 12px)",
    background: "#17252a",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "clamp(1.2rem, 5vw, 1.8rem)",
    fontWeight: 800,
    boxShadow: "0 4px 12px rgba(23,37,42,0.2)",
    border: inGoal ? `3px solid ${algCor}` : "3px solid transparent",
    boxSizing: "border-box",
    userSelect: "none",
  };
}

function Board({ estado, algCor }) {
  const emptyIdx = estado.indexOf(0);
  const emptyRow = Math.floor(emptyIdx / 3);
  const emptyCol = emptyIdx % 3;

  return (
    <div style={{
      position: "relative",
      width: "min(264px, calc(100vw - 3rem))",
      aspectRatio: "1 / 1",
      marginBottom: "1.25rem",
    }}>
      {/* Célula vazia */}
      <div style={{
        position: "absolute",
        width:  "calc((100% - 16px) / 3)",
        height: "calc((100% - 16px) / 3)",
        left: POS[emptyCol],
        top:  POS[emptyRow],
        borderRadius: "clamp(8px, 2vw, 12px)",
        background: "#e2e8f0",
      }} />

      {/* Peças numeradas — key pelo valor para animar posição */}
      {estado.map((num, idx) => {
        if (num === 0) return null;
        const inGoal = GOAL[idx] === num;
        return (
          <div key={num} style={tileStyle(idx, algCor, inGoal)}>
            {num}
          </div>
        );
      })}
    </div>
  );
}

export default function App() {
  const [algoritmo,   setAlgoritmo]   = useState("a_estrela");
  const [estadoAtual, setEstadoAtual] = useState(ESTADO_INICIAL);
  const [passos,      setPassos]      = useState([]);
  const [passoAtual,  setPassoAtual]  = useState(0);
  const [rodando,     setRodando]     = useState(false);
  const [status,      setStatus]      = useState("Pronto");
  const [stats,       setStats]       = useState(null);
  const intervaloRef = useRef(null);
  const abortRef     = useRef(null);

  function resetar() {
    abortRef.current?.abort();
    clearInterval(intervaloRef.current);
    setEstadoAtual(ESTADO_INICIAL);
    setPassos([]);
    setPassoAtual(0);
    setRodando(false);
    setStatus("Pronto");
    setStats(null);
  }

  async function resolver() {
    resetar();
    setStatus("Resolvendo...");
    setRodando(true);

    const { fetchEventSource } = await import("@microsoft/fetch-event-source");
    abortRef.current = new AbortController();

    try {
      await fetchEventSource("http://localhost:8000/resolver", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado_inicial: ESTADO_INICIAL, algoritmo }),
        signal: abortRef.current.signal,
        onmessage(ev) {
          const dados = JSON.parse(ev.data);

          if (dados.tipo === "caminho") {
            setPassos(dados.passos);
            setStatus("Animando solução...");
            animarPassos(dados.passos, dados.custo, dados.nos_expandidos);
          }
          if (dados.tipo === "sem_solucao") {
            setStatus("Sem solução encontrada.");
            setRodando(false);
          }
          if (dados.tipo === "erro") {
            setStatus(`Erro: ${dados.mensagem}`);
            setRodando(false);
          }
        },
      });
    } catch (e) {
      if (e?.name !== "AbortError") {
        setStatus("Erro de conexão com o servidor.");
        setRodando(false);
      }
    }
  }

  function animarPassos(lista, movimentos, nosExpandidos) {
    let i = 0;
    intervaloRef.current = setInterval(() => {
      if (i >= lista.length) {
        clearInterval(intervaloRef.current);
        setRodando(false);
        setStats({ movimentos, nos_expandidos: nosExpandidos });
        setStatus(`Solução encontrada! ${movimentos} movimentos`);
        return;
      }
      setEstadoAtual(lista[i]);
      setPassoAtual(i);
      i++;
    }, 380);
  }

  const alg = ALGORITMOS.find((a) => a.id === algoritmo);

  return (
    <div style={{
      minHeight: "100svh",
      background: "#f8fafc",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      padding: "clamp(1rem, 5vw, 2rem)",
    }}>

      <h1 style={{
        color: "#17252a",
        fontSize: "clamp(1.5rem, 6vw, 2rem)",
        fontWeight: 800,
        margin: "0 0 0.25rem",
      }}>
        8-Puzzle
      </h1>
      <p style={{ color: "#2b7a78", marginBottom: "1.5rem", fontSize: "clamp(0.8rem, 3vw, 0.95rem)" }}>
        Visualizador de Algoritmos de Busca
      </p>

      {/* Seleção de algoritmo */}
      <div style={{
        display: "flex",
        gap: "0.4rem",
        flexWrap: "wrap",
        justifyContent: "center",
        marginBottom: "1.5rem",
        maxWidth: "360px",
        width: "100%",
      }}>
        {ALGORITMOS.map((a) => (
          <button
            key={a.id}
            onClick={() => { setAlgoritmo(a.id); resetar(); }}
            style={{
              padding: "0.35rem 0.75rem",
              borderRadius: "8px",
              border: `2px solid ${a.cor}`,
              background: algoritmo === a.id ? a.cor : "white",
              color: algoritmo === a.id ? "white" : a.cor,
              fontWeight: 600,
              cursor: "pointer",
              fontSize: "clamp(0.72rem, 2.5vw, 0.85rem)",
              transition: "all 0.15s",
              touchAction: "manipulation",
            }}
          >
            {a.nome}
          </button>
        ))}
      </div>

      <Board estado={estadoAtual} algCor={alg?.cor ?? "#22c55e"} />

      {/* Status */}
      <p style={{
        color: "#2b7a78",
        fontWeight: 600,
        marginBottom: "0.75rem",
        fontSize: "clamp(0.8rem, 3vw, 0.95rem)",
        textAlign: "center",
        padding: "0 1rem",
      }}>
        {status}
      </p>

      {/* Stats */}
      {stats && (
        <div style={{ display: "flex", gap: "1.5rem", marginBottom: "1.25rem", flexWrap: "wrap", justifyContent: "center" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ color: "#17252a", fontWeight: 800, fontSize: "clamp(1.1rem, 4vw, 1.5rem)" }}>{stats.movimentos}</div>
            <div style={{ color: "#64748b", fontSize: "0.75rem" }}>movimentos</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ color: "#17252a", fontWeight: 800, fontSize: "clamp(1.1rem, 4vw, 1.5rem)" }}>{stats.nos_expandidos}</div>
            <div style={{ color: "#64748b", fontSize: "0.75rem" }}>nós explorados</div>
          </div>
          {passos.length > 0 && (
            <div style={{ textAlign: "center" }}>
              <div style={{ color: "#17252a", fontWeight: 800, fontSize: "clamp(1.1rem, 4vw, 1.5rem)" }}>{passoAtual + 1}/{passos.length}</div>
              <div style={{ color: "#64748b", fontSize: "0.75rem" }}>passo atual</div>
            </div>
          )}
        </div>
      )}

      {/* Botões */}
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center" }}>
        <button
          onClick={resolver}
          disabled={rodando}
          style={{
            padding: "0.65rem 1.75rem",
            borderRadius: "10px",
            background: rodando ? "#94a3b8" : alg?.cor,
            color: "white",
            fontWeight: 700,
            border: "none",
            cursor: rodando ? "not-allowed" : "pointer",
            fontSize: "clamp(0.85rem, 3vw, 1rem)",
            transition: "background 0.15s",
            touchAction: "manipulation",
          }}
        >
          {rodando ? "⏳ Resolvendo..." : "▶ Resolver"}
        </button>
        <button
          onClick={resetar}
          style={{
            padding: "0.65rem 1.75rem",
            borderRadius: "10px",
            background: "white",
            color: "#17252a",
            fontWeight: 700,
            border: "2px solid #17252a",
            cursor: "pointer",
            fontSize: "clamp(0.85rem, 3vw, 1rem)",
            touchAction: "manipulation",
          }}
        >
          ↺ Reset
        </button>
      </div>

      {/* Estado Objetivo */}
      <div style={{ marginTop: "2rem", textAlign: "center" }}>
        <p style={{ color: "#94a3b8", fontSize: "0.75rem", marginBottom: "0.4rem" }}>Estado Objetivo</p>
        <div style={{
          position: "relative",
          width: "min(120px, 30vw)",
          aspectRatio: "1 / 1",
        }}>
          {GOAL.map((num, idx) => {
            const row = Math.floor(idx / 3);
            const col = idx % 3;
            const step = "calc((100% - 6px) / 3 + 3px)";
            return (
              <div key={idx} style={{
                position: "absolute",
                width:  "calc((100% - 6px) / 3)",
                height: "calc((100% - 6px) / 3)",
                left: col === 0 ? "0px" : `calc(${col} * ${step})`,
                top:  row === 0 ? "0px" : `calc(${row} * ${step})`,
                borderRadius: "5px",
                background: num === 0 ? "#e2e8f0" : "#3aafa9",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "clamp(0.65rem, 2vw, 0.9rem)",
                fontWeight: 700,
              }}>
                {num !== 0 ? num : ""}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
