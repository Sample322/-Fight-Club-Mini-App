class MatchmakingService {
  constructor() {
    // Очередь игроков, ожидающих игру
    this.waitingPlayers = new Map();
    
    // Активные приглашения
    this.invitations = new Map();
    
    // Настройки тайм-аутов
    this.SEARCH_TIMEOUT = 60000; // 60 секунд
    this.INVITATION_TIMEOUT = 30000; // 30 секунд
  }

  /**
   * Добавление игрока в очередь поиска
   */
  addToQueue(playerId, socketId, preferences = {}) {
    const player = {
      id: playerId,
      socketId,
      joinedAt: Date.now(),
      preferences: {
        mode: preferences.mode || 'random', // 'random' или 'select'
        rating: preferences.rating || null,
        ...preferences
      }
    };
    
    this.waitingPlayers.set(playerId, player);
    
    // Автоматическое удаление из очереди по тайм-ауту
    setTimeout(() => {
      if (this.waitingPlayers.has(playerId)) {
        this.removeFromQueue(playerId);
      }
    }, this.SEARCH_TIMEOUT);
    
    return player;
  }

  /**
   * Удаление игрока из очереди
   */
  removeFromQueue(playerId) {
    return this.waitingPlayers.delete(playerId);
  }

  /**
   * Поиск случайного оппонента
   */
  findRandomOpponent(playerId) {
    const currentPlayer = this.waitingPlayers.get(playerId);
    if (!currentPlayer) return null;
    
    const availablePlayers = Array.from(this.waitingPlayers.values())
      .filter(player => player.id !== playerId);
    
    if (availablePlayers.length === 0) return null;
    
    // Случайный выбор оппонента
    const randomIndex = Math.floor(Math.random() * availablePlayers.length);
    const opponent = availablePlayers[randomIndex];
    
    // Удаляем обоих из очереди
    this.removeFromQueue(playerId);
    this.removeFromQueue(opponent.id);
    
    return {
      player1: currentPlayer,
      player2: opponent,
      matchedAt: Date.now()
    };
  }

  /**
   * Получение списка доступных игроков для выбора
   */
  getAvailablePlayersForSelection(playerId, count = 3) {
    const currentPlayer = this.waitingPlayers.get(playerId);
    if (!currentPlayer) return [];
    
    const availablePlayers = Array.from(this.waitingPlayers.values())
      .filter(player => player.id !== playerId);
    
    // Если игроков меньше запрошенного количества, возвращаем всех
    if (availablePlayers.length <= count) {
      return availablePlayers;
    }
    
    // Случайная выборка игроков
    const selectedPlayers = [];
    const playersCopy = [...availablePlayers];
    
    for (let i = 0; i < count; i++) {
      const randomIndex = Math.floor(Math.random() * playersCopy.length);
      selectedPlayers.push(playersCopy[randomIndex]);
      playersCopy.splice(randomIndex, 1);
    }
    
    return selectedPlayers.map(player => ({
      id: player.id,
      joinedAt: player.joinedAt,
      // Можно добавить дополнительную информацию о игроке
      // rating: player.rating,
      // gamesPlayed: player.gamesPlayed
    }));
  }

  /**
   * Создание приглашения на игру
   */
  createInvitation(fromPlayerId, toPlayerId) {
    const invitationId = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const invitation = {
      id: invitationId,
      from: fromPlayerId,
      to: toPlayerId,
      createdAt: Date.now(),
      status: 'pending' // 'pending', 'accepted', 'declined', 'expired'
    };
    
    this.invitations.set(invitationId, invitation);
    
    // Автоматическое истечение приглашения
    setTimeout(() => {
      const inv = this.invitations.get(invitationId);
      if (inv && inv.status === 'pending') {
        inv.status = 'expired';
        this.handleExpiredInvitation(invitationId);
      }
    }, this.INVITATION_TIMEOUT);
    
    return invitation;
  }

  /**
   * Принятие приглашения
   */
  acceptInvitation(invitationId) {
    const invitation = this.invitations.get(invitationId);
    if (!invitation || invitation.status !== 'pending') {
      return { success: false, error: 'Invalid or expired invitation' };
    }
    
    invitation.status = 'accepted';
    
    // Удаляем обоих игроков из очереди
    this.removeFromQueue(invitation.from);
    this.removeFromQueue(invitation.to);
    
    return {
      success: true,
      match: {
        player1Id: invitation.from,
        player2Id: invitation.to,
        matchedAt: Date.now()
      }
    };
  }

  /**
   * Отклонение приглашения
   */
  declineInvitation(invitationId) {
    const invitation = this.invitations.get(invitationId);
    if (!invitation || invitation.status !== 'pending') {
      return { success: false, error: 'Invalid or expired invitation' };
    }
    
    invitation.status = 'declined';
    return { success: true };
  }

  /**
   * Обработка истекшего приглашения
   */
  handleExpiredInvitation(invitationId) {
    const invitation = this.invitations.get(invitationId);
    if (!invitation) return;
    
    // Можно вернуть игроков в очередь или уведомить их
    console.log(`Invitation ${invitationId} expired`);
  }

  /**
   * Получение статистики очереди
   */
  getQueueStats() {
    return {
      waitingPlayers: this.waitingPlayers.size,
      pendingInvitations: Array.from(this.invitations.values())
        .filter(inv => inv.status === 'pending').length,
      players: Array.from(this.waitingPlayers.values()).map(p => ({
        id: p.id,
        waitTime: Date.now() - p.joinedAt,
        mode: p.preferences.mode
      }))
    };
  }

  /**
   * Очистка устаревших данных
   */
  cleanup() {
    const now = Date.now();
    
    // Удаление игроков с истекшим тайм-аутом
    for (const [playerId, player] of this.waitingPlayers) {
      if (now - player.joinedAt > this.SEARCH_TIMEOUT) {
        this.removeFromQueue(playerId);
      }
    }
    
    // Удаление старых приглашений
    for (const [invId, invitation] of this.invitations) {
      if (now - invitation.createdAt > this.INVITATION_TIMEOUT * 2) {
        this.invitations.delete(invId);
      }
    }
  }
}

module.exports = new MatchmakingService();