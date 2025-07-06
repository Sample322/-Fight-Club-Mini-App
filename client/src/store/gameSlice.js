import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  gameId: null,
  status: 'idle', // idle, searching, in-game, finished
  players: {},
  currentPlayerId: null,
  currentPlayer: null,
  opponent: null,
  turnActive: false,
  turnNumber: 1,
  lastAction: null,
  lastResult: null,
  winner: null,
  searchMode: 'random',
  availablePlayers: [],
  invitations: [],
  error: null
};

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    setSearching: (state, action) => {
      state.status = 'searching';
      state.searchMode = action.payload.mode || 'random';
      state.error = null;
    },
    
    setAvailablePlayers: (state, action) => {
      state.availablePlayers = action.payload;
    },
    
    addInvitation: (state, action) => {
      state.invitations.push(action.payload);
    },
    
    removeInvitation: (state, action) => {
      state.invitations = state.invitations.filter(
        inv => inv.id !== action.payload
      );
    },
    
    gameStarted: (state, action) => {
      const { gameId, players, currentPlayerId } = action.payload;
      state.gameId = gameId;
      state.status = 'in-game';
      state.players = players;
      state.currentPlayerId = currentPlayerId;
      state.currentPlayer = players[currentPlayerId];
      state.opponent = Object.values(players).find(p => p.id !== currentPlayerId);
      state.turnActive = true;
      state.turnNumber = 1;
      state.error = null;
    },
    
    updateGameState: (state, action) => {
      const { players, status, winner } = action.payload;
      state.players = players;
      if (state.currentPlayerId) {
        state.currentPlayer = players[state.currentPlayerId];
        state.opponent = Object.values(players).find(
          p => p.id !== state.currentPlayerId
        );
      }
      if (status) state.status = status;
      if (winner) state.winner = winner;
    },
    
    setTurnResult: (state, action) => {
      const { results, gameState } = action.payload;
      state.lastResult = results;
      state.turnNumber += 1;
      state.turnActive = true;
      
      // Обновляем состояние игроков
      if (gameState) {
        state.players = gameState.players;
        state.currentPlayer = gameState.players[state.currentPlayerId];
        state.opponent = Object.values(gameState.players).find(
          p => p.id !== state.currentPlayerId
        );
        
        if (gameState.status === 'finished') {
          state.status = 'finished';
          state.winner = gameState.winner;
          state.turnActive = false;
        }
      }
    },
    
    actionSubmitted: (state) => {
      state.turnActive = false;
    },
    
    gameFinished: (state, action) => {
      state.status = 'finished';
      state.winner = action.payload.winner;
      state.turnActive = false;
    },
    
    resetGame: (state) => {
      return initialState;
    },
    
    setError: (state, action) => {
      state.error = action.payload;
    },
    
    clearError: (state) => {
      state.error = null;
    }
  }
});

export const {
  setSearching,
  setAvailablePlayers,
  addInvitation,
  removeInvitation,
  gameStarted,
  updateGameState,
  setTurnResult,
  actionSubmitted,
  gameFinished,
  resetGame,
  setError,
  clearError
} = gameSlice.actions;

export default gameSlice.reducer;