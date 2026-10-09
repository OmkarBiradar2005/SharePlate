const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Enable CORS for frontend
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5500', 'http://127.0.0.1:5500'],
  credentials: true
}));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/donations', require('./routes/donationRoutes'));

// Welcome route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to SharePlate API - Food Waste Donation System',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      donations: '/api/donations'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!'
  });
});

// Handle 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`
🍽️  SharePlate Server is running!
🌐 Server: http://localhost:${PORT}
📚 API Docs: http://localhost:${PORT}/api
🔑 Environment: ${process.env.NODE_ENV || 'development'}
  `);
});

module.exports = app;