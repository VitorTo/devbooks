import { useState, useEffect } from 'react';
import { getAnnotations, deleteAnnotation } from '../utils/storage';

export default function AnnotationsList({ bookId, onClose, onGoToPage }) {
  const [annotations, setAnnotations] = useState([]);

  useEffect(() => {
    setAnnotations(getAnnotations(bookId));
  }, [bookId]);

  const handleDelete = (index) => {
    deleteAnnotation(bookId, index);
    setAnnotations(getAnnotations(bookId));
  };

  const formatDate = (dateStr) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="annotations-panel">
      <div className="annotations-panel__header">
        <h3 className="annotations-panel__title"><i className="fa-solid fa-sticky-note"></i> Anotações ({annotations.length})</h3>
        <button className="annotations-panel__close" onClick={onClose}><i className="fa-solid fa-xmark"></i></button>
      </div>

      <div className="annotations-panel__list">
        {annotations.length === 0 ? (
          <div className="annotations-panel__empty">
            <div className="annotations-panel__empty-icon"><i className="fa-regular fa-note-sticky"></i></div>
            <p>Nenhuma anotação ainda.</p>
            <p style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>
              Use o botão "Anotar" para criar sua primeira nota.
            </p>
          </div>
        ) : (
          annotations.map((note, i) => (
            <div
              key={i}
              className="annotation-item"
              onClick={() => onGoToPage(note.page)}
              style={{ cursor: 'pointer' }}
            >
              <div className="annotation-item__page">Página {note.page}</div>
              <div className="annotation-item__text">{note.text}</div>
              <div className="annotation-item__date">{formatDate(note.date)}</div>
              <button
                className="annotation-item__delete"
                onClick={(e) => { e.stopPropagation(); handleDelete(i); }}
                title="Excluir anotação"
              >
                <i className="fa-solid fa-trash"></i>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
