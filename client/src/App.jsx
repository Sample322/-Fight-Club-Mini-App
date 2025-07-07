import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import store from './store/store';
import HomePage from './pages/HomePage';
import LobbyPage from './pages/LobbyPage';
import GamePage from './pages/GamePage';
import { initTelegramWebApp } from './services/telegram';

function App() {
  useEffect(() => {
    // Отладка
    console.log('Telegram WebApp available:', !!window.Telegram?.WebApp);
    console.log('Init data:', window.Telegram?.WebApp?.initData);
    console.log('User:', window.Telegram?.WebApp?.initDataUnsafe?.user);
    
    // Инициализация
    const tg = initTelegramWebApp();
    if (tg) {
      console.log('Telegram Web App initialized successfully');
      // Показываем версию
      
    }
  }, []);

  return (
    <Provider store={store}>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/lobby" element={<LobbyPage />} />
          <Route path="/game/:gameId" element={<GamePage />} />
        </Routes>
      </Router>
    </Provider>
  );
}

export default App;