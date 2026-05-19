import { useState, useEffect, useRef } from 'react';
import Home from './components/Home';
import Reader from './components/Reader';
import History from './components/History';
import { exportAllData, importAllData } from './utils/storage';

function App() {
  const [view, setView] = useState('home'); // 'home', 'reader', 'history'
  const [currentBook, setCurrentBook] = useState(null);
  const [initialPage, setInitialPage] = useState(null);
  const [importFlow, setImportFlow] = useState({ active: false, backup: null, timeLeft: 0 });
  const timerRef = useRef(null);

  // On startup, read hash to open a shared link: #book=BOOK_ID&page=N
  useEffect(() => {
    const parseHash = () => {
      const hash = window.location.hash.slice(1);
      if (!hash) return;
      const params = Object.fromEntries(new URLSearchParams(hash));
      if (params.book) {
        // Load books.json to find the book object
        fetch('/books.json')
          .then(r => r.json())
          .then(books => {
            const book = books.find(b => b.id === params.book);
            if (book) {
              setInitialPage(params.page ? parseInt(params.page, 10) : 1);
              setCurrentBook(book);
              setView('reader');
            }
          })
          .catch(console.error);
      }
    };
    parseHash();
  }, []);

  const handleOpenBook = (book) => {
    setInitialPage(null); // Clear any shared page when opening normally
    setCurrentBook(book);
    setView('reader');
  };

  const handleBack = () => {
    setView('home');
    setCurrentBook(null);
  };

  const handleImport = (newData) => {
    // 1. Create safety backup
    const backup = exportAllData();
    
    // 2. Perform import
    importAllData(newData);
    
    // 3. Start 60s flow
    setImportFlow({ active: true, backup, timeLeft: 60 });
    
    // Refresh current view if we are in History to see changes
    if (view === 'history') setView('home');
    setTimeout(() => setView('history'), 10);
  };

  useEffect(() => {
    if (importFlow.active && importFlow.timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setImportFlow(prev => {
          if (prev.timeLeft <= 1) {
            clearInterval(timerRef.current);
            return { ...prev, active: false, timeLeft: 0 };
          }
          return { ...prev, timeLeft: prev.timeLeft - 1 };
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [importFlow.active, importFlow.timeLeft]);

  const cancelImport = () => {
    if (importFlow.backup) {
      importAllData(importFlow.backup);
      window.location.reload(); // Hard refresh to ensure all components see old data
    }
    setImportFlow({ active: false, backup: null, timeLeft: 0 });
  };

  const applyImport = () => {
    setImportFlow({ active: false, backup: null, timeLeft: 0 });
  };

  return (
    <div className="app">
      {view === 'reader' && currentBook ? (
        <Reader book={currentBook} onBack={handleBack} initialPage={initialPage} />
      ) : view === 'history' ? (
        <History onBack={handleBack} onImport={handleImport} />
      ) : (
        <Home onOpenBook={handleOpenBook} onGoToHistory={() => setView('history')} />
      )}

      {/* Persistent Safety Popup */}
      {importFlow.active && (
        <div className="safety-popup">
          <div className="safety-popup__content">
            <div className="safety-popup__title">
              <i className="fa-solid fa-triangle-exclamation"></i> Backup restaurado
            </div>
            <p className="safety-popup__text">
              Deseja manter essas alterações? O backup anterior será excluído em <strong>{importFlow.timeLeft}s</strong>.
            </p>
            <div className="safety-popup__actions">
              <button className="safety-popup__btn safety-popup__btn--cancel" onClick={cancelImport}>
                Cancelar Importação
              </button>
              <button className="safety-popup__btn safety-popup__btn--apply" onClick={applyImport}>
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
