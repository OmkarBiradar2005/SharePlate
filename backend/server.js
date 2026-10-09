const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
const connectDB = require('./config/db');
const { apiLimiter } = require('./middleware/rateLimiter');
const { startCronJobs } = require('./utils/cronJobs');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = socketIO(server, {
  cors: {
    origin: function(origin, callback) {
      // Allow requests with no origin (file://) or from allowed origins
      if (!origin) return callback(null, true);
      const allowedOrigins = [
        'http://localhost:3000', 
        'http://127.0.0.1:3000', 
        'http://localhost:5500', 
        'http://127.0.0.1:5500'
      ];
      callback(null, true); // For development, allow all
    },
    credentials: true
  }
});

// Make io accessible to routes
app.set('io', io);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`✅ User connected: ${socket.id}`);

  // Join room for specific donation
  socket.on('join_donation', (donationId) => {
    socket.join(donationId);
    console.log(`📦 User ${socket.id} joined donation room: ${donationId}`);
  });

  // Join chat room
  socket.on('join_chat', (chatId) => {
    socket.join(chatId);
    console.log(`💬 User ${socket.id} joined chat room: ${chatId}`);
  });

  // Handle typing indicator
  socket.on('typing', (data) => {
    socket.to(data.chatId).emit('user_typing', {
      userId: data.userId,
      isTyping: data.isTyping
    });
  });

  socket.on('disconnect', () => {
    console.log(`❌ User disconnected: ${socket.id}`);
  });
});

// Security middleware
app.use(helmet());
app.use(mongoSanitize());
app.use(compression());

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Enable CORS for frontend
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, or file://)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000', 
      'http://127.0.0.1:3000', 
      'http://localhost:5500', 
      'http://127.0.0.1:5500',
      'null' // For file:// protocol
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1 || origin === 'null') {
      callback(null, true);
    } else {
      callback(null, true); // For development, allow all origins
    }
  },
  credentials: true
}));

// Apply rate limiting to all API routes
app.use('/api/', apiLimiter);

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/donations', require('./routes/donationRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/chats', require('./routes/chatRoutes'));
app.use('/api/gamification', require('./routes/gamificationRoutes'));
app.use('/api/blog', require('./routes/blogRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/impact', require('./routes/impactRoutes'));
app.use('/api/tax', require('./routes/taxRoutes'));
app.use('/api/food-safety', require('./routes/foodSafetyRoutes'));

// Welcome route with full API documentation
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to SharePlate API - Food Waste Donation System',
    version: '2.0.0',
    tagline: 'Fighting Food Waste Together 🌍',
    features: [
      '🔐 Authentication & Authorization',
      '🍽️ Donation Management with Advanced Search',
      '💬 Real-time Chat',
      '⭐ Reviews & Ratings',
      '📊 Analytics Dashboard',
      '🏆 Gamification System with Badges',
      '📝 Blog & News',
      '👨‍💼 Admin Panel',
      '🔔 Real-time Notifications',
      '📸 Image Upload (Cloudinary)',
      '📄 PDF Reports & CSV Export',
      '🔍 QR Code Verification',
      '📍 Location-based Search',
      '🌙 Dark Mode Support',
      '🌐 Multi-language Ready',
      '⏰ Urgency Timer & Expiration Tracking',
      '🤖 Smart Matching Algorithm',
      '📱 SMS Notifications (Twilio)',
      '🌱 Environmental Impact Tracking',
      '📋 Tax Documentation & Certificates',
      '🛡️ Food Safety Verification',
      '🔄 Recurring Donations',
      '📊 Real-time Impact Dashboard'
    ],
    endpoints: {
      auth: '/api/auth - Authentication routes',
      donations: '/api/donations - Donation CRUD and search',
      reviews: '/api/reviews - Rating and review system',
      analytics: '/api/analytics - Dashboard statistics',
      chats: '/api/chats - Real-time messaging',
      gamification: '/api/gamification - Badges and points',
      blog: '/api/blog - Blog posts and articles',
      admin: '/api/admin - Admin management',
      notifications: '/api/notifications - User notifications',
      upload: '/api/upload - File uploads',
      reports: '/api/reports - PDF and CSV generation',
      impact: '/api/impact - Impact tracking & metrics',
      tax: '/api/tax - Tax documentation & certificates',
      foodSafety: '/api/food-safety - Food safety verification'
    },
    documentation: 'https://github.com/shareplate/api-docs'
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Something went wrong!',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Handle 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║                                                        ║
║         🍽️  SharePlate Server v2.0.0                  ║
║         Fighting Food Waste Together 🌍                ║
║                                                        ║
╠════════════════════════════════════════════════════════╣
║                                                        ║
║  🌐 Server:      http://localhost:${PORT}                   ║
║  📚 API Docs:    http://localhost:${PORT}/api               ║
║  🏥 Health:      http://localhost:${PORT}/api/health        ║
║  🔑 Environment: ${(process.env.NODE_ENV || 'development').padEnd(11)} ║
║  ✨ Socket.IO:   Enabled                               ║
║  🎯 Features:    All systems operational               ║
║  ⏰ Cron Jobs:   Starting automated tasks...           ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
  `);
  
  // Start automated tasks
  startCronJobs();
});

module.exports = { app, server, io };
