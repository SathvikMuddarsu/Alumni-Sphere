require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const { initSocket } = require('./socket');

const app = express();
const server = http.createServer(app);

// Configure allowed CORS origins
const configuredOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(o => o.trim()).filter(Boolean)
  : [];

const defaultOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5177',
  'http://127.0.0.1:5173',
  'https://alumni-sphere-2.vercel.app',
];

const allowedOrigins = Array.from(new Set([...defaultOrigins, ...configuredOrigins]));

const corsOptions = {
  origin: (origin, callback) => {
    // 1. Allow requests with no origin (curl, mobile apps, server-to-server)
    if (!origin) return callback(null, true);

    // 2. Allow if origin is explicitly in allowedOrigins (includes https://alumni-sphere-2.vercel.app)
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // 3. Allow localhost origins for local development
    if (
      origin.startsWith('http://localhost:') ||
      origin.startsWith('http://127.0.0.1:')
    ) {
      return callback(null, true);
    }

    // 4. Reject unrecognized browser origins with an appropriate CORS error
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

const io = new Server(server, {
  cors: corsOptions,
  maxHttpBufferSize: 15 * 1024 * 1024, // 15MB buffer for image/document transfer
});

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/connections', require('./routes/connections'));
app.use('/api/mentorship', require('./routes/mentorship'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/opportunities', require('./routes/opportunities'));
app.use('/api/notifications', require('./routes/notifications'));

// Root and Health Check
const startTime = Date.now();
const getHealthStatus = () => ({
  status: 'ok',
  service: 'AlumniSphere API',
  timestamp: new Date().toISOString(),
  uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
  dbStatus: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  nodeEnv: process.env.NODE_ENV || 'development',
});

app.get('/api/health', (req, res) => res.json(getHealthStatus()));
app.get('/', (req, res) => res.json(getHealthStatus()));

// 404 Handler
app.use((req, res, next) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err.stack || err.message);
  res.status(err.status || 500).json({
    message: err.message || 'Something went wrong on the server',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

// Init Socket.io
initSocket(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 AlumniSphere API running on port ${PORT}`));
