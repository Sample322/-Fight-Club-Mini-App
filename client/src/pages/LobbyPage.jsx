import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { socket, joinQueue, leaveQueue } from '../services/socket';
import { setSearching, gameStarted, addInvitation } from '../store/gameSlice';
import LobbyList from '../components/Lobby/LobbyList';
import Loading from '../components/Common/Loading';

const LobbyPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode') || 'random';
  
  const { status, invitations } = useSelector(state => state.game);
  const [queuePosition, setQueuePosition] = useState(0);

  useEffect(() => {
    // Подключаемся к очереди
    startSearch();

    // Обработчики событий
    socket.on('queue_joined', (data) => {
      setQueuePosition(data.playersInQueue);
    });

    socket.on('game_started', (data) => {
      dispatch(gameStarted({
        gameId: data.gameId,
        players: data.players,
        currentPlayerId: socket.id
      }));
      navigate(`/game/${data.gameId}`);
    });

    socket.on('game_invitation', (data) => {
      dispatch(addInvitation(data));
    });

    socket.on('opponent_disconnected', () => {
      alert('Противник отключился');
      navigate('/');
    });

    return () => {
      leaveQueue();
      socket.off('queue_joined');
      socket.off('game_started');
      socket.off('game_invitation');
      socket.off('opponent_disconnected');
    };
  }, [mode]);

  const startSearch = async () => {
    dispatch(setSearching({ mode }));
    try {
      await joinQueue(mode);
    } catch (error) {
      console.error('Failed to join queue:', error);
      navigate('/');
    }
  };

  const handleCancelSearch = () => {
    leaveQueue();
    navigate('/');
  };

  const handleAcceptInvitation = (invitationId) => {
    socket.emit('accept_invitation', { invitationId });
  };

  const handleDeclineInvitation = (invitationId) => {
    socket.emit('decline_invitation', { invitationId });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-4">
      <div className="max-w-4xl mx-auto">
        {/* Заголовок */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold mb-2">
            {mode === 'random' ? '⚔️ Быстрая игра' : '🎯 Выбор противника'}
          </h1>
        </motion.div>

        {/* Приглашения */}
        {invitations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-yellow-600 bg-opacity-20 border-2 border-yellow-600 rounded-lg p-4 mb-6"
          >
            <h3 className="text-xl font-bold mb-3">📨 Входящие приглашения</h3>
            {invitations.map(inv => (
              <div key={inv.invitationId} className="flex justify-between items-center mb-2">
                <span>Игрок {inv.from} вызывает вас на бой!</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAcceptInvitation(inv.invitationId)}
                    className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
                  >
                    Принять
                  </button>
                  <button
                    onClick={() => handleDeclineInvitation(inv.invitationId)}
                    className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
                  >
                    Отклонить
                  </button>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {/* Контент в зависимости от режима */}
        {mode === 'random' ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-gray-800 rounded-lg p-8 text-center"
          >
            <div className="mb-6">
              <div className="text-6xl mb-4">🎲</div>
              <h2 className="text-2xl font-bold mb-2">Поиск случайного противника</h2>
              <p className="text-gray-400">Ожидайте подходящего соперника...</p>
            </div>

            <div className="mb-6">
              <div className="flex justify-center items-center gap-2">
                <motion.div
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="w-3 h-3 bg-blue-500 rounded-full"
                />
                <motion.div
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                  className="w-3 h-3 bg-blue-500 rounded-full"
                />
                <motion.div
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 1 }}
                  className="w-3 h-3 bg-blue-500 rounded-full"
                />
              </div>
            </div>

            {queuePosition > 0 && (
              <p className="text-sm text-gray-400 mb-4">
                Игроков в очереди: {queuePosition}
              </p>
            )}

            <button
              onClick={handleCancelSearch}
              className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg font-semibold"
            >
              Отменить поиск
            </button>
          </motion.div>
        ) : (
          <div>
            <LobbyList />
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-6 text-center"
            >
              <button
                onClick={handleCancelSearch}
                className="bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-lg font-semibold"
              >
                Вернуться в меню
              </button>
            </motion.div>
          </div>
        )}
      </div>

      {/* Индикатор загрузки при поиске игры */}
      {status === 'searching' && mode === 'random' && (
        <Loading message="Поиск противника..." />
      )}
    </div>
  );
};

export default LobbyPage;