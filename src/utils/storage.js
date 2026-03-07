// ===== Reading Progress =====

export const saveProgress = (bookId, pageNumber, totalPages) => {
  const progress = JSON.parse(localStorage.getItem('reading_progress')) || {};
  progress[bookId] = {
    lastPage: pageNumber,
    totalPages: totalPages,
    updatedAt: new Date().toISOString()
  };
  localStorage.setItem('reading_progress', JSON.stringify(progress));

  // Update recent books
  const recent = JSON.parse(localStorage.getItem('recent_books')) || [];
  const filtered = recent.filter(id => id !== bookId);
  filtered.unshift(bookId);
  localStorage.setItem('recent_books', JSON.stringify(filtered.slice(0, 10)));
};

export const getProgress = (bookId) => {
  const progress = JSON.parse(localStorage.getItem('reading_progress')) || {};
  return progress[bookId] || null;
};

export const getRecentBooks = () => {
  return JSON.parse(localStorage.getItem('recent_books')) || [];
};

export const getAllProgress = () => {
  return JSON.parse(localStorage.getItem('reading_progress')) || {};
};

// ===== Annotations =====

export const saveAnnotation = (bookId, page, text) => {
  const notes = JSON.parse(localStorage.getItem('annotations')) || {};
  if (!notes[bookId]) notes[bookId] = [];

  notes[bookId].push({
    page,
    text,
    date: new Date().toISOString()
  });

  localStorage.setItem('annotations', JSON.stringify(notes));
};

export const getAnnotations = (bookId) => {
  const notes = JSON.parse(localStorage.getItem('annotations')) || {};
  return notes[bookId] || [];
};

export const deleteAnnotation = (bookId, index) => {
  const notes = JSON.parse(localStorage.getItem('annotations')) || {};
  if (notes[bookId]) {
    notes[bookId].splice(index, 1);
    localStorage.setItem('annotations', JSON.stringify(notes));
  }
};
