const mongoose = require('mongoose');

let isConnected = false;

const connectMongo = async () => {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri || mongoUri.includes('<db_username>') || mongoUri.includes('<db_password>') || mongoUri.includes('<password>')) {
    console.log('ℹ️ MONGODB_URI contains placeholder \'<db_password>\'. Please replace \'<db_password>\' in backend/.env with your MongoDB Atlas database password.');
    return false;
  }

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      serverApi: {
        version: '1',
        strict: true,
        deprecationErrors: true,
      },
    });
    isConnected = true;
    console.log('--- 🍃 MongoDB connection established successfully (Communication Subsystem) ---');
    return true;
  } catch (err) {
    console.warn('⚠️ MongoDB connection warning (non-blocking):', err.message);
    isConnected = false;
    return false;
  }
};

const getMongoStatus = () => {
  if (!process.env.MONGODB_URI) return 'NOT_CONFIGURED';
  return isConnected && mongoose.connection.readyState === 1 ? 'CONNECTED' : 'DISCONNECTED';
};

module.exports = {
  connectMongo,
  getMongoStatus,
  mongoose,
};
