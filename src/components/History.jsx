import { useState, useEffect } from 'react';
import { getAllProgress, getAllAnnotations, exportAllData } from '../utils/storage';
import booksData from '../../public/books.json';

export default function History({ onBack, onImport }) {
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({ totalBooks: 0, totalPages: 0, totalNotes: 0 });

  useEffect(() => {
    const progress = getAllProgress();
    const annotations = getAllAnnotations();
    
    const historyList = Object.entries(progress).map(([id, data]) => {
      const book = booksData.find(b => b.id === id);
      const bookNotes = annotations[id] || [];
      return {
        id,
        title: book?.title || id,
        author: book?.author || 'Autor desconhecido',
        lastPage: data.lastPage,
        totalPages: data.totalPages,
        percent: Math.round((data.lastPage / data.totalPages) * 100),
        updatedAt: new Date(data.updatedAt).toLocaleDateString(),
        notesCount: bookNotes.length
      };
    }).sort((a, b) => b.percent - a.percent);

    setHistory(historyList);

    const totalPages = historyList.reduce((acc, curr) => acc + curr.lastPage, 0);
    const totalNotes = Object.values(annotations).reduce((acc, curr) => acc + curr.length, 0);
    setStats({
      totalBooks: historyList.length,
      totalPages,
      totalNotes
    });
  }, []);

  const handleExport = () => {
    const data = exportAllData();
    const date = new Date().toISOString().split('T')[0];
    const fileName = `bibliotecadev-backup-${date}.json`;
    
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    
    // Append to body to ensure it's clickable in all browsers
    document.body.appendChild(link);
    link.click();
    
    // Clean up with a longer delay
    setTimeout(() => {
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }, 200);
  };

  const handleImportClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target.result);
          onImport(data);
        } catch (err) {
          alert('Erro ao ler o arquivo de backup. Verifique se o formato está correto.');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <div className="history">
      <div className="history__header">
        <button className="history__back-btn" onClick={onBack}>
          <i className="fa-solid fa-arrow-left"></i>
        </button>
        <h1 className="history__title">Meu Histórico</h1>
      </div>

      <div className="history__stats-grid">
        <div className="history__stat-card">
          <div className="history__stat-value">{stats.totalBooks}</div>
          <div className="history__stat-label">Livros lidos</div>
        </div>
        <div className="history__stat-card">
          <div className="history__stat-value">{stats.totalPages}</div>
          <div className="history__stat-label">Páginas lidas</div>
        </div>
        <div className="history__stat-card">
          <div className="history__stat-value">{stats.totalNotes}</div>
          <div className="history__stat-label">Anotações</div>
        </div>
      </div>

      <div className="history__actions">
        <button className="history__action-btn history__action-btn--export" onClick={handleExport}>
          <i className="fa-solid fa-download"></i> Exportar Backup
        </button>
        <button className="history__action-btn history__action-btn--import" onClick={handleImportClick}>
          <i className="fa-solid fa-upload"></i> Importar Backup
        </button>
      </div>

      <div className="history__list">
        <h2 className="history__list-title">Progresso Detalhado</h2>
        {history.length === 0 ? (
          <div className="history__empty">
            <i className="fa-solid fa-clock-rotate-left"></i>
            <p>Você ainda não começou nenhum livro.</p>
          </div>
        ) : (
          history.map(item => (
            <div key={item.id} className="history__item">
              <div className="history__item-info">
                <div className="history__item-title">{item.title}</div>
                <div className="history__item-meta">
                  {item.author} • {item.notesCount} notas
                </div>
              </div>
              <div className="history__item-progress">
                <div className="history__item-percent">{item.percent}%</div>
                <div className="history__item-pages">pág. {item.lastPage} de {item.totalPages}</div>
              </div>
              <div className="history__item-bar">
                <div className="history__item-bar-fill" style={{ width: `${item.percent}%` }}></div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
