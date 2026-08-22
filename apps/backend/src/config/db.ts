import mongoose from 'mongoose';
import logger from './logger.js';

export const connectDB = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/hyperkonnect';
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 2000 });
    logger.info('Connected to MongoDB successfully via Mongoose.');
  } catch (error) {
    logger.warn('Failed to connect to MongoDB: ' + error + '. Continuing without database connection.');
  }
};
