import { useState, useEffect, useMemo } from 'react';
import { getRecentBooks, getAllProgress } from '../utils/storage';

export default function Home({ onOpenBook, onGoToHistory }) {
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [progress, setProgress] = useState({});
  const [recentIds, setRecentIds] = useState([]);

  useEffect(() => {
    fetch('/books.json')
      .then(r => r.json())
      .then(setBooks)
      .catch(console.error);

    setProgress(getAllProgress());
    setRecentIds(getRecentBooks());
  }, []);

  const categories = useMemo(() => {
    const cats = [...new Set(books.map(b => b.category))];
    return ['Todos', ...cats.sort()];
  }, [books]);

  const recentBooks = useMemo(() => {
    return recentIds
      .map(id => books.find(b => b.id === id))
      .filter(Boolean)
      .slice(0, 5);
  }, [recentIds, books]);

  const filteredBooks = useMemo(() => {
    return books.filter(book => {
      const matchesSearch = book.title.toLowerCase().includes(search.toLowerCase()) ||
                           book.author.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = activeCategory === 'Todos' || book.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [books, search, activeCategory]);

  const getProgressPercent = (bookId) => {
    const p = progress[bookId];
    if (!p || !p.totalPages) return 0;
    return Math.round((p.lastPage / p.totalPages) * 100);
  };

  return (
    <div className="home">
      <header className="home__header">
        <h1 className="home__logo">
          <span className="home__logo-icon"><i className="fa-solid fa-book-open"></i></span>
          BibliotecaDev
        </h1>
        <p className="home__subtitle">Sua biblioteca de livros de programação</p>
        <button className="home__history-link" onClick={onGoToHistory}>
          <i className="fa-solid fa-clock-rotate-left"></i> Ver meu histórico de leitura
        </button>
      </header>

      {/* Search */}
      <div className="search-bar">
        <span className="search-bar__icon"><i className="fa-solid fa-magnifying-glass"></i></span>
        <input
          id="search-input"
          className="search-bar__input"
          type="text"
          placeholder="Buscar livro ou autor..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Category Pills */}
      <div className="categories">
        {categories.map(cat => (
          <button
            key={cat}
            className={`category-pill ${activeCategory === cat ? 'category-pill--active' : ''}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Continue Reading */}
      {recentBooks.length > 0 && (
        <section className="continue-reading">
          <h2 className="section-title"><i className="fa-solid fa-bookmark"></i> Continue Lendo</h2>
          <div className="continue-reading__scroll">
            {recentBooks.map(book => {
              const pct = getProgressPercent(book.id);
              const p = progress[book.id];
              return (
                <div
                  key={book.id}
                  className="continue-card"
                  onClick={() => onOpenBook(book)}
                >
                  <div className="continue-card__title">{book.title}</div>
                  <div className="continue-card__author">{book.author}</div>
                  <div className="continue-card__progress-bar">
                    <div
                      className="continue-card__progress-fill"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="continue-card__progress-text">
                    Pág. {p?.lastPage || 1} de {p?.totalPages || '?'} ({pct}%)
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* All Books */}
      <section>
        <h2 className="section-title"><i className="fa-solid fa-books"></i> Biblioteca ({filteredBooks.length})</h2>

        {filteredBooks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon"><i className="fa-solid fa-magnifying-glass"></i></div>
            <p className="empty-state__text">Nenhum livro encontrado</p>
          </div>
        ) : (
          <div className="books-grid">
            {filteredBooks.map(book => {
              const pct = getProgressPercent(book.id);
              return (
                <div
                  key={book.id}
                  className="book-card"
                  onClick={() => onOpenBook(book)}
                >
                  <div className="book-card__icon"><i className="fa-solid fa-book"></i></div>
                  <div className="book-card__title">{book.title}</div>
                  <div className="book-card__author">{book.author}</div>
                  <div className="book-card__category">{book.category}</div>
                  {pct > 0 && (
                    <div className="book-card__progress-mini">
                      <div
                        className="book-card__progress-mini-fill"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
