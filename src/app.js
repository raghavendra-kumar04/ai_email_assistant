const express = require('express');
const helmet = require('helmet');
const cors = require('cors');

const healthRoutes = require('./routes/health');
const authRoutes = require('./routes/auth');
const webhookRoutes = require('./routes/webhook');
const jobRoutes = require('./routes/jobs');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Security and standard middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Core API Routes
app.use('/health', healthRoutes);
app.use('/auth', authRoutes);
app.use('/webhook', webhookRoutes);
app.use('/jobs', jobRoutes);

// Root route
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'AI Email Assistant Backend is active',
    status: 'running',
    endpoints: {
      health: '/health',
      auth: '/auth/google',
      webhook: '/webhook/telegram',
      jobs: ['/jobs/digest', '/jobs/poll-emails']
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint Not Found' });
});

// Global error handler
app.use(errorHandler);

module.exports = app;
