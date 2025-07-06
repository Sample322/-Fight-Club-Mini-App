import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isAuthenticated: false,
  user: null,
  telegramUser: null,
  token: null,
  stats: {
    gamesPlayed: 0,
    gamesWon: 0,
    gamesLost: 0,
    gamesDraw: 0,
    winStreak: 0,
    bestWinStreak: 0
  },
  loading: false,
  error: null
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    
    loginSuccess: (state, action) => {
      const { user, token, telegramUser } = action.payload;
      state.isAuthenticated = true;
      state.user = user;
      state.telegramUser = telegramUser;
      state.token = token;
      state.loading = false;
      state.error = null;
      
      // Сохраняем токен в localStorage
      if (token) {
        localStorage.setItem('auth_token', token);
      }
    },
    
    loginFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
      state.isAuthenticated = false;
    },
    
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.telegramUser = null;
      state.token = null;
      localStorage.removeItem('auth_token');
    },
    
    updateStats: (state, action) => {
      state.stats = { ...state.stats, ...action.payload };
    },
    
    incrementGamesPlayed: (state) => {
      state.stats.gamesPlayed += 1;
    },
    
    gameWon: (state) => {
      state.stats.gamesWon += 1;
      state.stats.winStreak += 1;
      if (state.stats.winStreak > state.stats.bestWinStreak) {
        state.stats.bestWinStreak = state.stats.winStreak;
      }
    },
    
    gameLost: (state) => {
      state.stats.gamesLost += 1;
      state.stats.winStreak = 0;
    },
    
    gameDraw: (state) => {
      state.stats.gamesDraw += 1;
    }
  }
});

export const {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  updateStats,
  incrementGamesPlayed,
  gameWon,
  gameLost,
  gameDraw
} = userSlice.actions;

export default userSlice.reducer;