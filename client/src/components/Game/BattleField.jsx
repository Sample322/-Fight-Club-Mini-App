import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { socket } from '../../services/socket';

const ZONES = {
  HEAD: { name: 'Голова', damage: 35, icon: '🎯' },
  BODY: { name: 'Корпус', damage: 25, icon: '🛡️' },
  LEGS: { name: 'Ноги', damage: 20, icon: '🦵' }
};

const ACTION_TYPES = {
  ATTACK: 'attack',
  BLOCK: 'block',
  DODGE: 'dodge'
};

const BattleField = ({ gameId }) => {
  const dispatch = useDispatch();
  const { players, currentPlayer, opponent, turnActive } = useSelector(state => state.game);
  
  const [selectedAction, setSelectedAction] = useState(null);
  const [selectedZone, setSelectedZone] = useState(null);
  const [turnResult, setTurnResult] = useState(null);
  const [timeLeft, setTimeLeft] = useState(30);

  // Таймер хода
  useEffect(() => {
    if (!turnActive) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleTimeout();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [turnActive]);

  // Обработка результатов хода
  useEffect(() => {
    socket.on('turn_result', (data) => {
      setTurnResult(data.results);
      setSelectedAction(null);
      setSelectedZone(null);
      setTimeLeft(30);
      
      // Скрываем результат через 3 секунды
      setTimeout(() => setTurnResult(null), 3000);
    });

    return () => {
      socket.off('turn_result');
    };
  }, []);

  const handleActionSelect = (action) => {
    if (!turnActive) return;
    
    setSelectedAction(action);
    if (action === ACTION_TYPES.DODGE) {
      setSelectedZone(null);
    }
  };

  const handleZoneSelect = (zone) => {
    if (!turnActive || !selectedAction) return;
    if (selectedAction === ACTION_TYPES.DODGE) return;
    
    setSelectedZone(zone);
  };

  const submitAction = () => {
    if (!selectedAction || (selectedAction !== ACTION_TYPES.DODGE && !selectedZone)) {
      return;
    }

    socket.emit('game_action', {
      gameId,
      action: {
        type: selectedAction,
        zone: selectedZone
      }
    });
  };

  const handleTimeout = () => {
    // Автоматический выбор действия при истечении времени
    const randomAction = ACTION_TYPES.BLOCK;
    const randomZone = 'BODY';
    
    socket.emit('game_action', {
      gameId,
      action: {
        type: randomAction,
        zone: randomZone
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-4">
      {/* Таймер */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 bg-gray-800 rounded-full px-6 py-3">
          <span className="text-gray-400">Время на ход:</span>
          <span className={`text-2xl font-bold ${timeLeft <= 10 ? 'text-red-500' : 'text-green-500'}`}>
            {timeLeft}
          </span>
        </div>
      </div>

      {/* Статистика игроков */}
      <div className="grid grid-cols-2 gap-4 mb-8 max-w-4xl mx-auto">
        {/* Игрок */}
        <div className="bg-gray-800 rounded-lg p-4 border-2 border-blue-500">
          <h3 className="text-xl font-bold mb-2 text-blue-400">Вы</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Здоровье:</span>
              <div className="w-32 bg-gray-700 rounded-full h-6 relative">
                <motion.div
                  className="bg-red-500 h-full rounded-full"
                  initial={{ width: '100%' }}
                  animate={{ width: `${currentPlayer?.health || 0}%` }}
                  transition={{ duration: 0.5 }}
                />
                <span className="absolute inset-0 flex items-center justify-center text-sm">
                  {currentPlayer?.health || 0}/100
                </span>
              </div>
            </div>
            <div className="flex justify-between">
              <span>Выносливость:</span>
              <div className="w-32 bg-gray-700 rounded-full h-6 relative">
                <motion.div
                  className="bg-yellow-500 h-full rounded-full"
                  animate={{ width: `${currentPlayer?.stamina || 0}%` }}
                  transition={{ duration: 0.5 }}
                />
                <span className="absolute inset-0 flex items-center justify-center text-sm">
                  {currentPlayer?.stamina || 0}/100
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Оппонент */}
        <div className="bg-gray-800 rounded-lg p-4 border-2 border-red-500">
          <h3 className="text-xl font-bold mb-2 text-red-400">Противник</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Здоровье:</span>
              <div className="w-32 bg-gray-700 rounded-full h-6 relative">
                <motion.div
                  className="bg-red-500 h-full rounded-full"
                  animate={{ width: `${opponent?.health || 0}%` }}
                  transition={{ duration: 0.5 }}
                />
                <span className="absolute inset-0 flex items-center justify-center text-sm">
                  {opponent?.health || 0}/100
                </span>
              </div>
            </div>
            <div className="flex justify-between">
              <span>Выносливость:</span>
              <div className="w-32 bg-gray-700 rounded-full h-6 relative">
                <motion.div
                  className="bg-yellow-500 h-full rounded-full"
                  animate={{ width: `${opponent?.stamina || 0}%` }}
                  transition={{ duration: 0.5 }}
                />
                <span className="absolute inset-0 flex items-center justify-center text-sm">
                  {opponent?.stamina || 0}/100
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Поле боя */}
      <div className="max-w-2xl mx-auto mb-8">
        <div className="bg-gray-800 rounded-lg p-8 relative">
          {/* Фигура противника */}
          <div className="text-center mb-8">
            <div className="inline-block relative">
              <div className="text-8xl">🥷</div>
              
              {/* Зоны для выбора */}
              {selectedAction && selectedAction !== ACTION_TYPES.DODGE && (
                <div className="absolute inset-0 flex flex-col justify-between">
                  {Object.entries(ZONES).map(([key, zone]) => (
                    <motion.button
                      key={key}
                      className={`bg-gray-700 bg-opacity-80 rounded-lg p-2 m-1 hover:bg-opacity-100 
                        ${selectedZone === key ? 'ring-2 ring-yellow-500' : ''}`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleZoneSelect(key)}
                    >
                      <span className="text-2xl">{zone.icon}</span>
                      <div className="text-xs">{zone.name}</div>
                      <div className="text-xs text-gray-400">{zone.damage} урона</div>
                    </motion.button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Результат хода */}
          <AnimatePresence>
            {turnResult && (
              <motion.div
                className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="bg-gray-900 rounded-lg p-6 max-w-md">
                  <h3 className="text-2xl font-bold mb-4 text-center">Результат хода</h3>
                  <div className="space-y-2">
                    {/* Здесь отображаем результаты */}
                    <p className="text-center">Обработка...</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Панель действий */}
      <div className="max-w-2xl mx-auto">
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-bold mb-3 text-center">Выберите действие</h3>
          
          <div className="grid grid-cols-3 gap-4 mb-4">
            <motion.button
              className={`bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition
                ${selectedAction === ACTION_TYPES.ATTACK ? 'ring-2 ring-red-500' : ''}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleActionSelect(ACTION_TYPES.ATTACK)}
              disabled={!turnActive}
            >
              <div className="text-3xl mb-2">⚔️</div>
              <div className="font-bold">Атака</div>
              <div className="text-xs text-gray-400">15 выносливости</div>
            </motion.button>

            <motion.button
              className={`bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition
                ${selectedAction === ACTION_TYPES.BLOCK ? 'ring-2 ring-blue-500' : ''}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleActionSelect(ACTION_TYPES.BLOCK)}
              disabled={!turnActive}
            >
              <div className="text-3xl mb-2">🛡️</div>
              <div className="font-bold">Блок</div>
              <div className="text-xs text-gray-400">10 выносливости</div>
            </motion.button>

            <motion.button
              className={`bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition
                ${selectedAction === ACTION_TYPES.DODGE ? 'ring-2 ring-green-500' : ''}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleActionSelect(ACTION_TYPES.DODGE)}
              disabled={!turnActive}
            >
              <div className="text-3xl mb-2">💨</div>
              <div className="font-bold">Уклонение</div>
              <div className="text-xs text-gray-400">20 выносливости</div>
            </motion.button>
          </div>

          {/* Кнопка подтверждения */}
          <motion.button
            className={`w-full py-3 rounded-lg font-bold text-lg transition
              ${selectedAction && (selectedAction === ACTION_TYPES.DODGE || selectedZone)
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}
            whileHover={{ scale: selectedAction ? 1.02 : 1 }}
            whileTap={{ scale: selectedAction ? 0.98 : 1 }}
            onClick={submitAction}
            disabled={!selectedAction || (selectedAction !== ACTION_TYPES.DODGE && !selectedZone)}
          >
            Подтвердить действие
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default BattleField;