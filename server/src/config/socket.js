const configureSocket = (io) => {
  // Middleware для аутентификации сокетов
  io.use((socket, next) => {
    // Можно добавить проверку токена
    const token = socket.handshake.auth.token;
    
    // Пока пропускаем всех
    next();
  });

  // Настройка пространств имен
  io.of('/').adapter.on('create-room', (room) => {
    console.log(`Room ${room} was created`);
  });

  io.of('/').adapter.on('join-room', (room, id) => {
    console.log(`Socket ${id} joined room ${room}`);
  });

  io.of('/').adapter.on('leave-room', (room, id) => {
    console.log(`Socket ${id} left room ${room}`);
  });

  io.of('/').adapter.on('delete-room', (room) => {
    console.log(`Room ${room} was deleted`);
  });

  return io;
};

module.exports = { configureSocket };