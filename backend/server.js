/**
 * watsonx.data Demo Application - Backend Server
 * 
 * Main server file that initializes Express app and routes
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const config = require('./src/config/watsonx.config');
const logger = require('./src/utils/logger');

// Import routes
const authRoutes = require('./src/routes/authRoutes');
const ingestionRoutes = require('./src/routes/ingestionRoutes');
const uploadRoutes = require('./src/routes/uploadRoutes');
const monitoringRoutes = require('./src/routes/monitoringRoutes');
const queryRoutes = require('./src/routes/queryRoutes');

// Import monitoring service
const monitoringService = require('./src/services/monitoringService');

// Initialize Express app
const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: config.server.corsOrigin,
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// HTTP request logging
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));

// Monitoring middleware - track all API requests
app.use('/api/', (req, res, next) => {
  const startTime = Date.now();
  
  // Capture response
  const originalSend = res.send;
  res.send = function(data) {
    const responseTime = Date.now() - startTime;
    const success = res.statusCode >= 200 && res.statusCode < 400;
    
    monitoringService.recordRequest(
      req.path,
      success,
      responseTime
    );
    
    originalSend.call(this, data);
  };
  
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/ingestion', ingestionRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/monitoring', monitoringRoutes);
app.use('/api/query', queryRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'watsonx.data Demo API',
    version: '1.0.0',
    description: 'Backend API for watsonx.data Developer Edition demonstration',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      ingestion: '/api/ingestion',
      upload: '/api/upload',
      monitoring: '/api/monitoring',
      query: '/api/query'
    },
    documentation: '/docs'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path
  });
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path
  });

  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
const PORT = config.server.port;
const HOST = config.server.host;

const server = app.listen(PORT, HOST, () => {
  logger.info(`Server started successfully`, {
    port: PORT,
    host: HOST,
    environment: process.env.NODE_ENV || 'development',
    watsonxUrl: config.watsonxData.baseUrl
  });
  
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   watsonx.data Demo Application - Backend Server         ║
║                                                           ║
║   Server running at: http://${HOST}:${PORT}              ║
║   Health check: http://${HOST}:${PORT}/health            ║
║   API docs: http://${HOST}:${PORT}/docs                  ║
║                                                           ║
║   watsonx.data URL: ${config.watsonxData.baseUrl}        ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason, promise });
  process.exit(1);
});

module.exports = app;

// Made with Bob
