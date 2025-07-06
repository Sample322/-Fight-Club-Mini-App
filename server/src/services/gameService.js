class GameService {
  constructor() {
    // Зоны атаки и защиты
    this.ZONES = {
      HEAD: 'head',
      BODY: 'body',
      LEGS: 'legs'
    };
    
    // Базовые параметры урона
    this.DAMAGE = {
      HEAD: 35,  // Высокий урон, но сложнее попасть
      BODY: 25,  // Средний урон, средняя вероятность
      LEGS: 20   // Низкий урон, но легче попасть
    };
    
    // Множители урона
    this.MULTIPLIERS = {
      CRITICAL: 1.5,    // Критический удар
      BLOCKED: 0.3,     // Заблокированный удар
      COUNTER: 1.2      // Контратака
    };
    
    // Игровые параметры
    this.MAX_HEALTH = 100;
    this.MAX_STAMINA = 100;
    this.STAMINA_COST = {
      ATTACK: 15,
      BLOCK: 10,
      DODGE: 20
    };
    this.STAMINA_REGEN = 5; // За ход
  }

  /**
   * Создание новой игры
   */
  createGame(player1Id, player2Id) {
    return {
      id: this.generateGameId(),
      players: {
        [player1Id]: {
          id: player1Id,
          health: this.MAX_HEALTH,
          stamina: this.MAX_STAMINA,
          currentAction: null,
          stats: {
            damageDealt: 0,
            damageTaken: 0,
            blocksSuccessful: 0,
            criticalHits: 0
          }
        },
        [player2Id]: {
          id: player2Id,
          health: this.MAX_HEALTH,
          stamina: this.MAX_STAMINA,
          currentAction: null,
          stats: {
            damageDealt: 0,
            damageTaken: 0,
            blocksSuccessful: 0,
            criticalHits: 0
          }
        }
      },
      currentTurn: 1,
      status: 'active',
      winner: null,
      history: [],
      createdAt: new Date(),
      lastActionAt: new Date()
    };
  }

  /**
   * Обработка действий игроков
   */
  processActions(game, player1Action, player2Action) {
    const player1 = game.players[player1Action.playerId];
    const player2 = game.players[player2Action.playerId];
    
    // Проверка достаточности стамины
    if (!this.hasEnoughStamina(player1, player1Action) || 
        !this.hasEnoughStamina(player2, player2Action)) {
      return { error: 'Insufficient stamina' };
    }
    
    // Применение стоимости стамины
    this.applyStaminaCost(player1, player1Action);
    this.applyStaminaCost(player2, player2Action);
    
    // Расчет результатов
    const results = {
      player1: this.calculateActionResult(player1Action, player2Action, player1, player2),
      player2: this.calculateActionResult(player2Action, player1Action, player2, player1)
    };
    
    // Применение урона
    this.applyDamage(player1, results.player2.damage);
    this.applyDamage(player2, results.player1.damage);
    
    // Обновление статистики
    this.updateStats(player1, results.player1);
    this.updateStats(player2, results.player2);
    
    // Регенерация стамины
    this.regenerateStamina(player1);
    this.regenerateStamina(player2);
    
    // Добавление в историю
    game.history.push({
      turn: game.currentTurn,
      player1Action,
      player2Action,
      results,
      timestamp: new Date()
    });
    
    // Проверка победителя
    game.winner = this.checkWinner(game);
    if (game.winner) {
      game.status = 'finished';
    }
    
    game.currentTurn++;
    game.lastActionAt = new Date();
    
    return {
      success: true,
      results,
      gameState: game
    };
  }

  /**
   * Расчет результата действия
   */
  calculateActionResult(attackerAction, defenderAction, attacker, defender) {
    const result = {
      damage: 0,
      blocked: false,
      critical: false,
      counter: false,
      message: ''
    };
    
    // Если атакующий выбрал атаку
    if (attackerAction.type === 'attack') {
      const baseDamage = this.DAMAGE[attackerAction.zone.toUpperCase()];
      
      // Проверка блока
      if (defenderAction.type === 'block' && defenderAction.zone === attackerAction.zone) {
        result.blocked = true;
        result.damage = Math.round(baseDamage * this.MULTIPLIERS.BLOCKED);
        result.message = 'Удар заблокирован!';
        
        // Возможность контратаки при успешном блоке
        if (Math.random() < 0.3) { // 30% шанс контратаки
          result.counter = true;
          result.damage = 0; // Атака полностью отражена
          result.message = 'Контратака!';
        }
      } else {
        // Проверка критического удара
        if (Math.random() < 0.2) { // 20% шанс крита
          result.critical = true;
          result.damage = Math.round(baseDamage * this.MULTIPLIERS.CRITICAL);
          result.message = 'Критический удар!';
        } else {
          result.damage = baseDamage;
          result.message = 'Успешная атака!';
        }
      }
      
      // Уклонение
      if (defenderAction.type === 'dodge') {
        if (Math.random() < 0.6) { // 60% шанс уклонения
          result.damage = 0;
          result.message = 'Уклонение!';
        }
      }
    }
    
    return result;
  }

  /**
   * Проверка достаточности стамины
   */
  hasEnoughStamina(player, action) {
    const cost = this.STAMINA_COST[action.type.toUpperCase()];
    return player.stamina >= cost;
  }

  /**
   * Применение стоимости стамины
   */
  applyStaminaCost(player, action) {
    const cost = this.STAMINA_COST[action.type.toUpperCase()];
    player.stamina = Math.max(0, player.stamina - cost);
  }

  /**
   * Применение урона
   */
  applyDamage(player, damage) {
    player.health = Math.max(0, player.health - damage);
  }

  /**
   * Регенерация стамины
   */
  regenerateStamina(player) {
    player.stamina = Math.min(this.MAX_STAMINA, player.stamina + this.STAMINA_REGEN);
  }

  /**
   * Обновление статистики
   */
  updateStats(player, result) {
    player.stats.damageDealt += result.damage;
    if (result.blocked) player.stats.blocksSuccessful++;
    if (result.critical) player.stats.criticalHits++;
  }

  /**
   * Проверка победителя
   */
  checkWinner(game) {
    const players = Object.values(game.players);
    
    if (players[0].health <= 0 && players[1].health <= 0) {
      return 'draw'; // Ничья
    }
    
    if (players[0].health <= 0) {
      return players[1].id;
    }
    
    if (players[1].health <= 0) {
      return players[0].id;
    }
    
    return null;
  }

  /**
   * Генерация ID игры
   */
  generateGameId() {
    return `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Валидация действия
   */
  validateAction(action) {
    const validTypes = ['attack', 'block', 'dodge'];
    const validZones = Object.values(this.ZONES);
    
    if (!validTypes.includes(action.type)) {
      return { valid: false, error: 'Invalid action type' };
    }
    
    if (action.type !== 'dodge' && !validZones.includes(action.zone)) {
      return { valid: false, error: 'Invalid zone' };
    }
    
    return { valid: true };
  }
}

module.exports = new GameService();