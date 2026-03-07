import { useState } from 'react';
import { saveAnnotation } from '../utils/storage';

export default function AnnotationModal({ bookId, currentPage, onClose }) {
  const [text, setText] = useState('');

  const handleSave = () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    saveAnnotation(bookId, currentPage, trimmed);
    onClose();
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal">
        <div className="modal__handle" />
        <h3 className="modal__title">Nova Anotação</h3>
        <p className="modal__subtitle">Página {currentPage}</p>

        <textarea
          className="modal__textarea"
          placeholder="Escreva sua anotação aqui..."
          value={text}
          onChange={e => setText(e.target.value)}
          autoFocus
        />

        <div className="modal__actions">
          <button className="modal__btn modal__btn--secondary" onClick={onClose}>
            Cancelar
          </button>
          <button
            className="modal__btn modal__btn--primary"
            onClick={handleSave}
            disabled={!text.trim()}
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
