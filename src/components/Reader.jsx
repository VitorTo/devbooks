import { useState, useEffect, useRef, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { saveProgress, getProgress } from '../utils/storage';
import AnnotationModal from './AnnotationModal';
import AnnotationsList from './AnnotationsList';

// Configure pdf.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export default function Reader({ book, onBack, initialPage }) {
  const canvasRef = useRef(null);
  const viewportRef = useRef(null);
  const pdfDocRef = useRef(null);
  const renderTaskRef = useRef(null);
  const touchStartRef = useRef(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAnnotationModal, setShowAnnotationModal] = useState(false);
  const [showAnnotationsList, setShowAnnotationsList] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [shareToast, setShareToast] = useState(false);
  const [isDarkReader, setIsDarkReader] = useState(() => {
    return localStorage.getItem('dark_reader') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('dark_reader', isDarkReader);
  }, [isDarkReader]);

  // Load PDF
  useEffect(() => {
    let cancelled = false;

    const loadPdf = async () => {
      setLoading(true);
      setError(null);

      try {
        const loadingTask = pdfjsLib.getDocument({
          url: book.url,
          cMapUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/cmaps/`,
          cMapPacked: true,
        });

        const pdf = await loadingTask.promise;
        if (cancelled) return;

        pdfDocRef.current = pdf;
        setTotalPages(pdf.numPages);

        // Restore saved progress, but prefer initialPage from a shared link
        const saved = getProgress(book.id);
        const startPage = initialPage || saved?.lastPage || 1;
        setCurrentPage(Math.min(startPage, pdf.numPages));
        setLoading(false);
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to load PDF:', err);
          setError('Não foi possível carregar o PDF. Verifique sua conexão.');
          setLoading(false);
        }
      }
    };

    loadPdf();
    return () => { cancelled = true; };
  }, [book]);

  // Render page
  const renderPage = useCallback(async (pageNum) => {
    const pdf = pdfDocRef.current;
    const canvas = canvasRef.current;
    if (!pdf || !canvas) return;

    // Cancel any ongoing render
    if (renderTaskRef.current) {
      try {
        renderTaskRef.current.cancel();
      } catch (e) { /* ignore */ }
    }

    try {
      const page = await pdf.getPage(pageNum);
      const containerWidth = viewportRef.current?.clientWidth || window.innerWidth;
      const originalViewport = page.getViewport({ scale: 1 });

      // Render at 2.0x container width for high quality even when zoomed
      const renderScale = (containerWidth / originalViewport.width) * 2.0;
      const viewport = page.getViewport({ scale: renderScale });

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      const ctx = canvas.getContext('2d');
      const renderTask = page.render({
        canvasContext: ctx,
        viewport: viewport,
      });

      renderTaskRef.current = renderTask;
      await renderTask.promise;
    } catch (err) {
      if (err.name !== 'RenderingCancelledException') {
        console.error('Render error:', err);
      }
    }
  }, []);

  useEffect(() => {
    if (!loading && totalPages > 0) {
      renderPage(currentPage);
      saveProgress(book.id, currentPage, totalPages);
    }
  }, [currentPage, loading, totalPages, renderPage, book.id]);

  // Navigation
  const goToPage = (page) => {
    const clamped = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(clamped);
    // Scroll to top when changing page
    if (viewportRef.current) {
      viewportRef.current.scrollTop = 0;
    }
  };

  const nextPage = () => goToPage(currentPage + 1);
  const prevPage = () => goToPage(currentPage - 1);

  // Update URL hash so the current page can be shared
  useEffect(() => {
    window.location.hash = `book=${book.id}&page=${currentPage}`;
  }, [book.id, currentPage]);

  // Clear hash when leaving reader
  const handleBack = () => {
    window.location.hash = '';
    onBack();
  };

  // Share current page
  const sharePage = async () => {
    const url = `${window.location.origin}${window.location.pathname}#book=${book.id}&page=${currentPage}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Fallback for browsers without clipboard API
      const ta = document.createElement('textarea');
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setShareToast(true);
    setTimeout(() => setShareToast(false), 2500);
  };

  // Zoom controls
  const zoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const zoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.25));
  const resetZoom = () => setZoom(1);

  // Touch gestures for swipe
  const handleTouchStart = (e) => {
    touchStartRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (touchStartRef.current === null || zoom > 1) return;
    const diff = touchStartRef.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 60) {
      if (diff > 0) nextPage();
      else prevPage();
    }
    touchStartRef.current = null;
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ') nextPage();
      else if (e.key === 'ArrowLeft') prevPage();
      else if (e.key === 'Escape') onBack();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  });

  return (
    <div className="reader">
      {/* Top Bar */}
      <div className="reader__topbar">
        <button className="reader__back-btn" onClick={handleBack} title="Voltar">
          <i className="fa-solid fa-arrow-left"></i>
        </button>
        <div className="reader__topbar-info">
          <div className="reader__topbar-title">{book.title}</div>
          <div className="reader__topbar-page">
            {totalPages ? `Página ${currentPage} de ${totalPages}` : 'Carregando...'}
          </div>
        </div>
        <div className="reader__topbar-actions">
          <div className="reader__zoom-controls">
            <button className="reader__zoom-btn" onClick={zoomOut} disabled={zoom <= 0.25} title="Diminuir Zoom">
              <i className="fa-solid fa-minus"></i>
            </button>
            <span className="reader__zoom-text" onClick={resetZoom} title="Resetar Zoom">
              {Math.round(zoom * 100)}%
            </span>
            <button className="reader__zoom-btn" onClick={zoomIn} disabled={zoom >= 3} title="Aumentar Zoom">
              <i className="fa-solid fa-plus"></i>
            </button>
          </div>
          <button
            className="reader__nav-btn reader__share-btn"
            onClick={sharePage}
            title="Compartilhar página"
            style={{ padding: '0 0.5rem', fontSize: '1.2rem' }}
          >
            <i className="fa-solid fa-link"></i>
          </button>
          <button
            className={`reader__nav-btn ${isDarkReader ? 'reader__nav-btn--active' : ''}`}
            onClick={() => setIsDarkReader(!isDarkReader)}
            title="Alternar Modo Escuro"
            style={{ padding: '0 0.5rem', fontSize: '1.2rem' }}
          >
            <i className={`fa-solid ${isDarkReader ? 'fa-sun' : 'fa-moon'}`}></i>
          </button>
        </div>
      </div>

      {/* Canvas / Content Area */}
      <div
        className="reader__viewport"
        ref={viewportRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {loading ? (
          <div className="reader__loading">
            <div className="reader__spinner" />
            <span>Carregando PDF...</span>
          </div>
        ) : error ? (
          <div className="reader__error">
            <div className="reader__error-icon"><i className="fa-solid fa-triangle-exclamation"></i></div>
            <p>{error}</p>
            <button className="reader__error-btn" onClick={onBack}>
              Voltar à Biblioteca
            </button>
          </div>
        ) : (
          <>
            <div className="reader__canvas-wrapper">
              <canvas
                ref={canvasRef}
                className="reader__canvas"
                style={{
                  width: `${zoom * 100}%`,
                  maxWidth: 'none',
                  filter: isDarkReader ? 'invert(0.9) hue-rotate(180deg)' : 'none',
                  transition: 'filter 0.3s ease, width 0.2s ease-out'
                }}
              />
            </div>
          </>
        )}
      </div>

      {/* Page Slider */}
      {!loading && !error && totalPages > 0 && (
        <div className="reader__page-slider-container">
          <div className="reader__page-input-wrapper">
            <input
              type="number"
              className="reader__page-input"
              value={currentPage}
              min={1}
              max={totalPages}
              onChange={e => goToPage(Number(e.target.value))}
              onFocus={e => e.target.select()}
            />
            <span className="reader__page-total">/ {totalPages}</span>
          </div>
          <input
            type="range"
            className="reader__page-slider"
            min={1}
            max={totalPages}
            value={currentPage}
            onChange={e => goToPage(Number(e.target.value))}
          />
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="reader__bottombar">
        <button className="reader__nav-btn" onClick={prevPage} disabled={currentPage <= 1}>
          <span className="reader__nav-btn-icon"><i className="fa-solid fa-backward"></i></span>
          Anterior
        </button>
        <button
          className="reader__nav-btn"
          onClick={() => setShowAnnotationModal(true)}
        >
          <span className="reader__nav-btn-icon"><i className="fa-solid fa-pen-to-square"></i></span>
          Anotar
        </button>
        <button
          className={`reader__nav-btn ${showAnnotationsList ? 'reader__nav-btn--active' : ''}`}
          onClick={() => setShowAnnotationsList(!showAnnotationsList)}
        >
          <span className="reader__nav-btn-icon"><i className="fa-solid fa-sticky-note"></i></span>
          Notas
        </button>
        <button className="reader__nav-btn" onClick={nextPage} disabled={currentPage >= totalPages}>
          <span className="reader__nav-btn-icon"><i className="fa-solid fa-forward"></i></span>
          Próxima
        </button>
      </div>

      {/* Annotation Modal */}
      {showAnnotationModal && (
        <AnnotationModal
          bookId={book.id}
          currentPage={currentPage}
          onClose={() => setShowAnnotationModal(false)}
        />
      )}

      {/* Annotations List */}
      {showAnnotationsList && (
        <AnnotationsList
          bookId={book.id}
          onClose={() => setShowAnnotationsList(false)}
          onGoToPage={goToPage}
        />
      )}

      {/* Share Toast */}
      {shareToast && (
        <div className="share-toast">
          <i className="fa-solid fa-check"></i> Link copiado!
        </div>
      )}
    </div>
  );
}
