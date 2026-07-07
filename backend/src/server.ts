import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import config from './config/env';
import { initializeDatabase } from './database/migrate';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth';

const app = express();
const server = createServer(app);
const io = new SocketServer(server, {
  cors: {
    origin: config.FRONTEND_URL,
    credentials: true,
  },
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: config.FRONTEND_URL,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

// API Routes
app.use('/api/v1/auth', authRoutes);

// Socket.io
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

// Initialize database and start server
async function startServer() {
  try {
    console.log('Starting server...');
    await initializeDatabase();
    
    server.listen(config.PORT, () => {
      console.log(`✅ Server running on http://localhost:${config.PORT}`);
      console.log(`📊 Socket.io running on ws://localhost:${config.SOCKET_PORT}`);
      console.log(`🌍 Environment: ${config.NODE_ENV}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export { app, server, io };
