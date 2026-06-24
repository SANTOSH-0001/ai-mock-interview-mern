import mongoose from 'mongoose';

export async function connectDB() {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error('MONGO_URI environmental variable is missing.');
  }

  // Enforce schema-strict query filters
  mongoose.set('strictQuery', true);

  // Monitor connection states dynamically
  mongoose.connection.on('connected', () => {
    console.log('MongoDB successfully connected.');
  });

  mongoose.connection.on('error', (err) => {
    console.error(`MongoDB runtime connection error: ${err.message}`);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected! Attempting reconnect...');
  });

  // Execute connection with explicit configuration options
  await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 5000, // Fail fast (5s) instead of hanging if DB is down
    autoIndex: process.env.NODE_ENV !== 'production', // Don't build indexes in production for performance
  });
}