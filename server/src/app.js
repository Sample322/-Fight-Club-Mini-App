require('dotenv').config();
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Import configurations
const { initDatabase } = require('./config/database');
const { configureSocket } = require('./config/socket');

// Import routes
const authRoutes = require('./routes/auth');
const gameRoutes = require('./routes/game');
const lobbyRoutes = require('./routes/lobby');

// Import socket handlers
const registerSocketHandlers = require('./socket');

const app = express();
const httpServer = createServer(app);

// Configure Socket.IO with dynamic CORS
const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      // Разрешаем запросы от localhost, ngrok, localtunnel и Telegram
      const allowedPatterns = [
        /^http:\/\/localhost/,
        /^http:\/\/127\.0\.0\.1/,
        /^https:\/\/.*\.ngrok-free\.app$/,
        /^https:\/\/.*\.ngrok\.io$/,
        /^https:\/\/.*\.loca\.lt$/,
        /^https:\/\/.*\.localtunnel\.me$/,
        /^https:\/\/t\.me$/,
        /^https:\/\/web\.telegram\.org$/
      ];
      
      // В development режиме разрешаем также null origin (для некоторых случаев)
      if (!origin && process.env.NODE_ENV === 'development') {
        callback(null, true);
        return;
      }
      
      if (!origin || allowedPatterns.some(pattern => pattern.test(origin))) {
        callback(null, true);
      } else {
        console.log('Blocked origin:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST']
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

// Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Отключаем для работы с Telegram Web App
  crossOriginEmbedderPolicy: false
}));

// Dynamic CORS for Express
app.use(cors({
  origin: (origin, callback) => {
    // Те же паттерны что и для Socket.IO
    const allowedPatterns = [
      /^http:\/\/localhost/,
      /^http:\/\/127\.0\.0\.1/,
      /^https:\/\/.*\.ngrok-free\.app$/,
      /^https:\/\/.*\.ngrok\.io$/,
      /^https:\/\/.*\.loca\.lt$/,
      /^https:\/\/.*\.localtunnel\.me$/,
      /^https:\/\/t\.me$/,
      /^https:\/\/web\.telegram\.org$/
    ];
    
    if (!origin && process.env.NODE_ENV === 'development') {
      callback(null, true);
      return;
    }
    
    if (!origin || allowedPatterns.some(pattern => pattern.test(origin))) {
      callback(null, true);
    } else {
      console.log('Blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Length', 'X-Request-Id']
}));

app.use(express.json());
app.use(limiter);

// Request logging in development
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path} - Origin: ${req.headers.origin || 'No origin'}`);
    next();
  });
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/lobby', lobbyRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    cors: 'dynamic',
    environment: process.env.NODE_ENV
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Fight Club API Server',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      game: '/api/game',
      lobby: '/api/lobby'
    }
  });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`New connection: ${socket.id} from ${socket.handshake.headers.origin || 'unknown origin'}`);
  
  // Register all socket handlers
  registerSocketHandlers(io, socket);
  
  socket.on('disconnect', () => {
    console.log(`Disconnected: ${socket.id}`);
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  
  // CORS specific error
  if (err.message && err.message.includes('CORS')) {
    return res.status(403).json({ 
      error: 'CORS policy violation',
      origin: req.headers.origin,
      message: 'This origin is not allowed'
    });
  }
  
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Initialize database and start server
const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    await initDatabase();
    
    httpServer.listen(PORT, '0.0.0.0', () => {
      console.log(`
========================================
🚀 Server running on port ${PORT}
🌍 Environment: ${process.env.NODE_ENV || 'development'}
🔒 CORS: Dynamic (ngrok, localhost, telegram)
⚡ Socket.IO: Enabled
========================================
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  httpServer.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  httpServer.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

module.exports = { app, io };