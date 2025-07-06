import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
});

// Обработка базовых событий
socket.on('connect', () => {
  console.log('Connected to server');
});

socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
});

socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
});

// Автоматическая регистрация при подключении
export const connectWithAuth = (playerId) => {
  socket.connect();
  
  socket.on('connect', () => {
    socket.emit('register', { playerId });
  });
};

// Вспомогательные функции
export const joinQueue = (mode = 'random') => {
  return new Promise((resolve, reject) => {
    socket.emit('join_queue', { mode });
    
    socket.once('queue_joined', (data) => {
      if (data.success) {
        resolve(data);
      } else {
        reject(new Error('Failed to join queue'));
      }
    });
    
    socket.once('error', (error) => {
      reject(error);
    });
  });
};

export const leaveQueue = () => {
  socket.emit('leave_queue');
};

export const getAvailablePlayers = () => {
  return new Promise((resolve) => {
    socket.emit('get_available_players');
    
    socket.once('available_players', (data) => {
      resolve(data.players);
    });
  });
};

export const selectOpponent = (opponentId) => {
  return new Promise((resolve, reject) => {
    socket.emit('select_opponent', { opponentId });
    
    socket.once('invitation_sent', (data) => {
      if (data.success) {
        resolve(data);
      } else {
        reject(new Error('Failed to send invitation'));
      }
    });
  });
};

export const acceptInvitation = (invitationId) => {
  socket.emit('accept_invitation', { invitationId });
};

export const declineInvitation = (invitationId) => {
  socket.emit('decline_invitation', { invitationId });
};

export const sendGameAction = (gameId, action) => {
  socket.emit('game_action', { gameId, action });
};

export default socket;