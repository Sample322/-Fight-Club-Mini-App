import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { socket, getAvailablePlayers, selectOpponent } from '../../services/socket';

const LobbyList = () => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  useEffect(() => {
    loadPlayers();
    
    // Обновление списка каждые 5 секунд
    const interval = setInterval(loadPlayers, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const loadPlayers = async () => {
    setLoading(true);
    try {
      const availablePlayers = await getAvailablePlayers();
      setPlayers(availablePlayers);
    } catch (error) {
      console.error('Failed to load players:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlayer = async (playerId) => {
    setSelectedPlayer(playerId);
    try {
      await selectOpponent(playerId);
    } catch (error) {
      console.error('Failed to select opponent:', error);
      setSelectedPlayer(null);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Доступные игроки</h2>
        <button
          onClick={loadPlayers}
          className="text-blue-400 hover:text-blue-300"
          disabled={loading}
        >
          🔄 Обновить
        </button>
      </div>

      {loading && players.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          Поиск игроков...
        </div>
      ) : players.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          Нет доступных игроков. Подождите...
        </div>
      ) : (
        <div className="space-y-3">
          {players.map((player, index) => (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gray-700 rounded-lg p-4 flex justify-between items-center hover:bg-gray-600 transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center text-xl">
                  👤
                </div>
                <div>
                  <div className="font-semibold">{player.username || `Игрок ${player.id.slice(0, 6)}`}</div>
                  <div className="text-sm text-gray-400">
                    В лобби: {Math.floor((Date.now() - player.joinedAt) / 1000)}с
                  </div>
                </div>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSelectPlayer(player.id)}
                disabled={selectedPlayer === player.id}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  selectedPlayer === player.id
                    ? 'bg-yellow-600 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {selectedPlayer === player.id ? 'Ожидание...' : 'Вызвать'}
              </motion.button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LobbyList;