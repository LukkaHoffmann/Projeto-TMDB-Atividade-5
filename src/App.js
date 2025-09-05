import React, { useEffect, useState } from "react";
import "./App.css"; 

export default function App() {
  const apiKey = "SUA_CHAVE_AQUI";
  const IMAGE_BASE = "https://image.tmdb.org/t/p/w300";

  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [results, setResults] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [favorites, setFavorites] = useState({});


  useEffect(() => {
    try {
      const raw = localStorage.getItem("tmdb_favs_v1");
      if (raw) setFavorites(JSON.parse(raw));
    } catch (e) {
      console.error("Erro ao carregar favoritos", e);
    }
  }, []);

  
  useEffect(() => {
    try {
      localStorage.setItem("tmdb_favs_v1", JSON.stringify(favorites));
      console.log("Favoritos salvos", Object.keys(favorites).length);
    } catch (e) {
      console.error("Erro ao salvar favoritos", e);
    }
  }, [favorites]);


  async function searchMovies(q, pg = 1) {
    if (!q || q.trim().length === 0) return;
    setLoading(true);
    setError(null);
    console.log(`Buscando: ${q} (página ${pg})`);
    try {
      const url = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&language=pt-BR&query=${encodeURIComponent(
        q
      )}&page=${pg}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setResults(data.results || []);
      setTotalPages(data.total_pages || 1);
      setPage(pg);
      if ((data.results || []).length === 0)
        setError("Nenhum resultado encontrado.");
    } catch (err) {
      console.error(err);
      setError("Erro ao buscar. Verifique sua conexão e a chave de API.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }


  async function fetchDetails(id) {
    setLoading(true);
    setError(null);
    console.log("Carregando detalhes de", id);
    try {
      const url = `https://api.themoviedb.org/3/movie/${id}?api_key=${apiKey}&language=pt-BR&append_to_response=credits`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setSelected(data);
    } catch (err) {
      console.error(err);
      setError("Erro ao carregar detalhes do filme.");
    } finally {
      setLoading(false);
    }
  }

 
  function toggleFavorite(movie) {
    setFavorites((prev) => {
      const copy = { ...prev };
      if (copy[movie.id]) {
        delete copy[movie.id];
        console.log("Removido dos favoritos:", movie.title);
      } else {
        copy[movie.id] = {
          id: movie.id,
          title: movie.title,
          poster_path: movie.poster_path,
          year: (movie.release_date || "").slice(0, 4),
        };
        console.log("Adicionado aos favoritos:", movie.title);
      }
      return copy;
    });
  }

  function handleSearchSubmit(e) {
    e && e.preventDefault();
    if (!query.trim()) return setError("Digite um termo para buscar.");
    searchMovies(query, 1);
  }

  return (
    <div className="app">
      <div className="header">
        <div className="title">
          MovieFinder <span className="clapper">🎬</span>
        </div>
        
      </div>

      <form className="searchRow" onSubmit={handleSearchSubmit}>
        <input
          className="input"
          placeholder="Buscar filmes (ex: O Poderoso Chefão)"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setError(null);
          }}
        />
        <button className="btn" onClick={handleSearchSubmit} type="submit">
          Buscar
        </button>
        <button
          className="btn"
          type="button"
          onClick={() => {
            setQuery("");
            setResults([]);
            setError(null);
          }}
          style={{ background: "#444" }}
        >
          Limpar
        </button>
      </form>

      <div style={{ display: "flex", marginTop: 16, gap: 12, alignItems: "center" }}>
        <div style={{ fontSize: 14, color: "var(--muted)" }}>
          Favoritos: {Object.keys(favorites).length}
        </div>
        <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
          <button
            className="btn"
            onClick={() => {
              const favList = Object.values(favorites);
              if (favList.length) {
                setResults(favList);
                setTotalPages(1);
                setPage(1);
              }
            }}
          >
            Ver favoritos
          </button>
        </div>
      </div>

      {loading && <div className="loading">Carregando...</div>}
      {error && <div style={{ color: "#ffb4a2", marginTop: 10 }}>{error}</div>}

      <div className="results">
        {results.map((m) => (
          <div className="card" key={m.id}>
            <img
              className="poster"
              src={
                m.poster_path
                  ? IMAGE_BASE + m.poster_path
                  : `https://via.placeholder.com/300x450?text=Sem+Imagem`
              }
              alt={m.title}
            />
            <div className="meta">
              <div className="movieTitle">{m.title}</div>
              <div className="metaSmall">
                {(m.release_date || "").slice(0, 4)} • Nota:{" "}
                {m.vote_average || "N/A"}
              </div>
              <div className="actions">
                <button className="fav" onClick={() => fetchDetails(m.id)}>
                  Ver detalhes
                </button>
                <button
                  className={"fav " + (favorites[m.id] ? "active" : "")}
                  onClick={() => toggleFavorite(m)}
                >
                  {favorites[m.id] ? "Remover" : "Favoritar"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="pager">
          <button
            className="fav"
            disabled={page <= 1}
            onClick={() => searchMovies(query, page - 1)}
          >
            Anterior
          </button>
          <div style={{ alignSelf: "center", color: "var(--muted)" }}>
            Página {page} de {totalPages}
          </div>
          <button
            className="fav"
            disabled={page >= totalPages}
            onClick={() => searchMovies(query, page + 1)}
          >
            Próxima
          </button>
        </div>
      )}

      {selected && (
        <div className="detailsOverlay" onClick={() => setSelected(null)}>
          <div className="detailsCard" onClick={(e) => e.stopPropagation()}>
            <div>
              <img
                src={
                  selected.poster_path
                    ? IMAGE_BASE + selected.poster_path
                    : `https://via.placeholder.com/300x450?text=Sem+Imagem`
                }
                alt={selected.title}
                style={{ width: "100%", borderRadius: 8 }}
              />
              <div style={{ marginTop: 10, color: "var(--muted)" }}>
                Lançamento: {selected.release_date}
              </div>
              <div style={{ marginTop: 6, color: "var(--muted)" }}>
                Duração: {selected.runtime ? selected.runtime + " min" : "N/A"}
              </div>
            </div>
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <h2 style={{ margin: 0 }}>{selected.title}</h2>
                <button className="closeBtn" onClick={() => setSelected(null)}>
                  Fechar
                </button>
              </div>
              <p style={{ color: "var(--muted)" }}>{selected.tagline}</p>
              <h3>Sinopse</h3>
              <p style={{ lineHeight: 1.4 }}>
                {selected.overview || "Sem sinopse."}
              </p>

              <h3>Direção</h3>
              <div className="metaSmall">
                {selected.credits && selected.credits.crew
                  ? selected.credits.crew
                      .filter((c) => c.job === "Director")
                      .map((d) => d.name)
                      .join(", ")
                  : "N/A"}
              </div>

              <h3 style={{ marginTop: 10 }}>Elenco</h3>
              <div className="metaSmall">
                {selected.credits && selected.credits.cast
                  ? selected.credits.cast
                      .slice(0, 6)
                      .map((c) => c.name + " como " + (c.character || ""))
                      .join("; ")
                  : "N/A"}
              </div>

              <h3 style={{ marginTop: 10 }}>Avaliação</h3>
              <div className="metaSmall">
                {selected.vote_average} / 10 ({selected.vote_count} avaliações)
              </div>

              <div style={{ marginTop: 12 }}>
                <button
                  className={"fav " + (favorites[selected.id] ? "active" : "")}
                  onClick={() => toggleFavorite(selected)}
                >
                  {favorites[selected.id]
                    ? "Remover dos favoritos"
                    : "Adicionar aos favoritos"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
