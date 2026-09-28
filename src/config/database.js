const mongoose = require('mongoose');
const dns = require('dns');
const logger = require('../utils/logger');

// Configure robust DNS resolution for MongoDB Atlas SRV records (prevents queryTxt ETIMEOUT on Windows/ISPs)
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
  if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder('ipv4first');
  }
} catch (e) {
  // Ignore in environments where setting DNS servers is restricted
}

let isConnected = false;

async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    logger.warn('MONGODB_URI is not defined. Database operations will not work.');
    return;
  }

  if (isConnected) {
    logger.debug('MongoDB already connected.');
    return;
  }

  try {
    mongoose.connection.on('connected', () => {
      isConnected = true;
      logger.info('✅ MongoDB Atlas connected successfully');
    });

    mongoose.connection.on('error', (err) => {
      logger.error({ err: err.message }, '❌ MongoDB connection error');
    });

    mongoose.connection.on('disconnected', () => {
      isConnected = false;
      logger.warn('⚠️ MongoDB disconnected. Attempting reconnection...');
    });

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      family: 4
    });
  } catch (error) {
    logger.error({ error: error.message }, '❌ Failed to connect to MongoDB');
  }
}

async function closeDB() {
  if (isConnected) {
    await mongoose.connection.close();
    isConnected = false;
    logger.info('MongoDB connection closed.');
  }
}

module.exports = {
  connectDB,
  closeDB,
  mongoose
};
