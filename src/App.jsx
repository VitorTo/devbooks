import { useState } from 'react';
import Home from './components/Home';
import Reader from './components/Reader';

function App() {
  const [currentBook, setCurrentBook] = useState(null);

  const handleOpenBook = (book) => {
    setCurrentBook(book);
  };

  const handleBack = () => {
    setCurrentBook(null);
  };

  return (
    <div className="app">
      {currentBook ? (
        <Reader book={currentBook} onBack={handleBack} />
      ) : (
        <Home onOpenBook={handleOpenBook} />
      )}
    </div>
  );
}

export default App;
