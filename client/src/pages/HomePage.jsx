import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { loginStart, loginSuccess, loginFailure } from '../store/userSlice';
import { connectWithAuth } from '../services/socket';
import { getTelegramWebApp, getTelegramUser, getTelegramInitData } from '../services/telegram';
import api from '../services/api';

const HomePage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated, user, stats, loading } = useSelector(state => state.user);
  const [isDevMode, setIsDevMode] = useState(false);

  useEffect(() => {
    const authenticateUser = async () => {
      const tg = getTelegramWebApp();
      const initData = getTelegramInitData();
      
      // Проверяем, запущено ли в Telegram
      if (!tg || !initData) {
        console.log('Not running in Telegram, using dev mode');
        setIsDevMode(true);
        
        // Режим разработки - используем тестового пользователя
        const testUser = {
          id: 'test-user-' + Math.random().toString(36).substr(2, 9),
          telegram_id: 123456789,
          username: 'testuser',
          first_name: 'Test',
          last_name: 'User'
        };
        
        dispatch(loginSuccess({
          user: testUser,
          token: 'dev-token',
          telegramUser: testUser
        }));
        
        connectWithAuth(testUser.id);
        return;
      }

      try {
        dispatch(loginStart());
        
        // Отправляем данные Telegram для валидации
        const response = await api.post('/auth/telegram', {
          initData: initData
        });
        
        const { token, user } = response.data;
        const telegramUser = getTelegramUser();
        
        dispatch(loginSuccess({
          user,
          token,
          telegramUser
        }));
        
        connectWithAuth(user.id);
        
      } catch (error) {
        console.error('Authentication error:', error);
        
        // В случае ошибки переходим в dev режим
        if (error.response?.status === 401) {
          setIsDevMode(true);
          const testUser = {
            id: 'test-user-' + Math.random().toString(36).substr(2, 9),
            telegram_id: 123456789,
            username: 'testuser',
            first_name: 'Test',
            last_name: 'User'
          };
          
          dispatch(loginSuccess({
            user: testUser,
            token: 'dev-token',
            telegramUser: testUser
          }));
          
          connectWithAuth(testUser.id);
        } else {
          dispatch(loginFailure(error.message));
        }
      }
    };

    if (!isAuthenticated) {
      authenticateUser();
    }
  }, [isAuthenticated, dispatch]);

  const startRandomGame = () => {
    navigate('/lobby?mode=random');
  };

  const startSelectGame = () => {
    navigate('/lobby?mode=select');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
        <div className="text-white text-xl">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-4">
      <div className="max-w-4xl mx-auto">
        {/* Индикатор режима разработки */}
        {isDevMode && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-yellow-600 text-black text-center p-2 rounded mb-4 text-sm"
          >
            ⚠️ Режим разработки - Telegram авторизация недоступна
          </motion.div>
        )}

        {/* Заголовок */}
        <motion.div
          className="text-center mb-8 pt-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
            FIGHT CLUB
          </h1>
          <p className="text-gray-400">Первое правило - не говорить о Fight Club</p>
        </motion.div>

        {/* Профиль игрока */}
        {user && (
          <motion.div
            className="bg-gray-800 rounded-lg p-6 mb-8"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gray-600 flex items-center justify-center text-2xl">
                  👤
                </div>
                <div>
                  <h2 className="text-2xl font-bold">
                    {user.first_name} {user.last_name}
                  </h2>
                  <p className="text-gray-400">@{user.username}</p>
                </div>
              </div>
            </div>

            {/* Статистика */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-700 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-blue-400">{stats.gamesPlayed}</div>
                <div className="text-sm text-gray-400">Игр сыграно</div>
              </div>
              <div className="bg-gray-700 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-green-400">{stats.gamesWon}</div>
                <div className="text-sm text-gray-400">Побед</div>
              </div>
              <div className="bg-gray-700 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-red-400">{stats.gamesLost}</div>
                <div className="text-sm text-gray-400">Поражений</div>
              </div>
              <div className="bg-gray-700 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-yellow-400">
                  {stats.gamesPlayed > 0 
                    ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100) 
                    : 0}%
                </div>
                <div className="text-sm text-gray-400">Винрейт</div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Кнопки игры */}
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <motion.button
            className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 
                     text-white font-bold py-6 px-8 rounded-lg text-xl shadow-lg transform transition"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={startRandomGame}
          >
            <div className="flex items-center justify-center gap-3">
              <span className="text-3xl">⚔️</span>
              <div>
                <div>Быстрая игра</div>
                <div className="text-sm opacity-80">Случайный противник</div>
              </div>
            </div>
          </motion.button>

          <motion.button
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 
                     text-white font-bold py-6 px-8 rounded-lg text-xl shadow-lg transform transition"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={startSelectGame}
          >
            <div className="flex items-center justify-center gap-3">
              <span className="text-3xl">🎯</span>
              <div>
                <div>Выбор противника</div>
                <div className="text-sm opacity-80">Выберите из списка онлайн</div>
              </div>
            </div>
          </motion.button>
        </motion.div>

        {/* Правила игры */}
        <motion.div
          className="mt-8 bg-gray-800 rounded-lg p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.6 }}
        >
          <h3 className="text-xl font-bold mb-4">Как играть:</h3>
          <div className="space-y-2 text-gray-300">
            <p>• Выберите зону атаки (голова, корпус, ноги)</p>
            <p>• Выберите зону защиты или уклонение</p>
            <p>• Действия выполняются одновременно</p>
            <p>• Побеждает тот, кто первым снизит здоровье противника до 0</p>
            <p>• Следите за выносливостью - каждое действие требует энергии</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default HomePage;