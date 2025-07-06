const gameService = require('../services/gameService');
const matchmakingService = require('../services/matchmakingService');

// Хранилище активных игр
const activeGames = new Map();

// Связь socketId с playerId
const socketToPlayer = new Map();
const playerToSocket = new Map();

module.exports = function registerSocketHandlers(io, socket) {
  // Регистрация игрока при подключении
  socket.on('register', (data) => {
    const { playerId } = data;
    
    // Сохраняем связь socket-player
    socketToPlayer.set(socket.id, playerId);
    playerToSocket.set(playerId, socket.id);
    
    socket.join(`player:${playerId}`);
    
    socket.emit('registered', { 
      success: true, 
      playerId,
      socketId: socket.id 
    });
  });

  // ===== MATCHMAKING HANDLERS =====
  
  // Присоединение к очереди поиска
  socket.on('join_queue', (data) => {
    const playerId = socketToPlayer.get(socket.id);
    if (!playerId) {
      socket.emit('error', { message: 'Not registered' });
      return;
    }
    
    const { mode = 'random' } = data;
    
    matchmakingService.addToQueue(playerId, socket.id, { mode });
    
    socket.emit('queue_joined', { 
      success: true,
      mode,
      playersInQueue: matchmakingService.getQueueStats().waitingPlayers 
    });
    
    // Если режим случайного поиска, пытаемся найти оппонента сразу
    if (mode === 'random') {
      const match = matchmakingService.findRandomOpponent(playerId);
      if (match) {
        startGame(io, match.player1, match.player2);
      }
    }
  });
  
  // Покинуть очередь
  socket.on('leave_queue', () => {
    const playerId = socketToPlayer.get(socket.id);
    if (!playerId) return;
    
    matchmakingService.removeFromQueue(playerId);
    socket.emit('queue_left', { success: true });
  });
  
  // Запрос списка доступных игроков
  socket.on('get_available_players', () => {
    const playerId = socketToPlayer.get(socket.id);
    if (!playerId) {
      socket.emit('error', { message: 'Not registered' });
      return;
    }
    
    const availablePlayers = matchmakingService.getAvailablePlayersForSelection(playerId);
    socket.emit('available_players', { players: availablePlayers });
  });
  
  // Выбор оппонента из списка
  socket.on('select_opponent', (data) => {
    const playerId = socketToPlayer.get(socket.id);
    const { opponentId } = data;
    
    if (!playerId || !opponentId) {
      socket.emit('error', { message: 'Invalid request' });
      return;
    }
    
    const invitation = matchmakingService.createInvitation(playerId, opponentId);
    
    // Отправляем приглашение выбранному игроку
    const opponentSocketId = playerToSocket.get(opponentId);
    if (opponentSocketId) {
      io.to(opponentSocketId).emit('game_invitation', {
        invitationId: invitation.id,
        from: playerId,
        expiresIn: 30000 // 30 секунд
      });
    }
    
    socket.emit('invitation_sent', { 
      success: true, 
      invitationId: invitation.id 
    });
  });
  
  // Принятие приглашения
  socket.on('accept_invitation', (data) => {
    const { invitationId } = data;
    const result = matchmakingService.acceptInvitation(invitationId);
    
    if (result.success) {
      const { player1Id, player2Id } = result.match;
      const player1SocketId = playerToSocket.get(player1Id);
      const player2SocketId = playerToSocket.get(player2Id);
      
      if (player1SocketId && player2SocketId) {
        const player1 = { id: player1Id, socketId: player1SocketId };
        const player2 = { id: player2Id, socketId: player2SocketId };
        startGame(io, player1, player2);
      }
    } else {
      socket.emit('error', { message: result.error });
    }
  });
  
  // Отклонение приглашения
  socket.on('decline_invitation', (data) => {
    const { invitationId } = data;
    matchmakingService.declineInvitation(invitationId);
    socket.emit('invitation_declined', { success: true });
  });
  
  // ===== GAME HANDLERS =====
  
  // Действие игрока (атака/защита/уклонение)
  socket.on('game_action', (data) => {
    const playerId = socketToPlayer.get(socket.id);
    if (!playerId) return;
    
    const { gameId, action } = data;
    const game = activeGames.get(gameId);
    
    if (!game) {
      socket.emit('error', { message: 'Game not found' });
      return;
    }
    
    // Валидация действия
    const validation = gameService.validateAction(action);
    if (!validation.valid) {
      socket.emit('error', { message: validation.error });
      return;
    }
    
    // Сохраняем действие игрока
    if (!game.pendingActions) {
      game.pendingActions = {};
    }
    
    game.pendingActions[playerId] = {
      ...action,
      playerId,
      timestamp: Date.now()
    };
    
    // Уведомляем игрока о принятии действия
    socket.emit('action_accepted', { success: true });
    
    // Проверяем, выбрали ли оба игрока действия
    const playerIds = Object.keys(game.players);
    const allActionsReceived = playerIds.every(id => game.pendingActions[id]);
    
    if (allActionsReceived) {
      // Обрабатываем ход
      processTurn(io, gameId);
    }
  });
  
  // Запрос состояния игры
  socket.on('get_game_state', (data) => {
    const { gameId } = data;
    const game = activeGames.get(gameId);
    
    if (!game) {
      socket.emit('error', { message: 'Game not found' });
      return;
    }
    
    socket.emit('game_state', { game });
  });
  
  // ===== DISCONNECT HANDLER =====
  
  socket.on('disconnect', () => {
    const playerId = socketToPlayer.get(socket.id);
    
    if (playerId) {
      // Удаляем из очереди
      matchmakingService.removeFromQueue(playerId);
      
      // Проверяем активные игры
      for (const [gameId, game] of activeGames) {
        if (game.players[playerId]) {
          // Уведомляем другого игрока о дисконнекте
          const otherPlayerId = Object.keys(game.players).find(id => id !== playerId);
          const otherSocketId = playerToSocket.get(otherPlayerId);
          
          if (otherSocketId) {
            io.to(otherSocketId).emit('opponent_disconnected', { gameId });
          }
          
          // Можно приостановить игру или завершить с техническим поражением
          game.status = 'paused';
          game.pausedAt = Date.now();
        }
      }
      
      // Очищаем связи
      socketToPlayer.delete(socket.id);
      playerToSocket.delete(playerId);
    }
  });
};

// ===== HELPER FUNCTIONS =====

/**
 * Начало новой игры
 */
function startGame(io, player1, player2) {
  const game = gameService.createGame(player1.id, player2.id);
  const gameRoom = `game:${game.id}`;
  
  // Сохраняем игру
  activeGames.set(game.id, game);
  
  // Добавляем игроков в комнату игры
  io.sockets.sockets.get(player1.socketId)?.join(gameRoom);
  io.sockets.sockets.get(player2.socketId)?.join(gameRoom);
  
  // Уведомляем игроков о начале игры
  io.to(gameRoom).emit('game_started', {
    gameId: game.id,
    players: {
      [player1.id]: { id: player1.id, health: 100, stamina: 100 },
      [player2.id]: { id: player2.id, health: 100, stamina: 100 }
    },
    yourTurn: true
  });
}

/**
 * Обработка хода
 */
function processTurn(io, gameId) {
  const game = activeGames.get(gameId);
  if (!game || !game.pendingActions) return;
  
  const playerIds = Object.keys(game.players);
  const action1 = game.pendingActions[playerIds[0]];
  const action2 = game.pendingActions[playerIds[1]];
  
  // Обрабатываем действия
  const result = gameService.processActions(game, action1, action2);
  
  if (result.error) {
    io.to(`game:${gameId}`).emit('error', { message: result.error });
    return;
  }
  
  // Очищаем pending actions
  game.pendingActions = {};
  
  // Отправляем результаты
  io.to(`game:${gameId}`).emit('turn_result', {
    turnNumber: game.currentTurn - 1,
    actions: {
      [playerIds[0]]: action1,
      [playerIds[1]]: action2
    },
    results: result.results,
    gameState: {
      players: game.players,
      status: game.status,
      winner: game.winner
    }
  });
  
  // Если игра завершена
  if (game.status === 'finished') {
    io.to(`game:${gameId}`).emit('game_finished', {
      winner: game.winner,
      stats: game.players
    });
    
    // Можно сохранить результаты в БД
    // await saveGameResults(game);
    
    // Удаляем игру через некоторое время
    setTimeout(() => {
      activeGames.delete(gameId);
    }, 60000); // 1 минута
  }
}