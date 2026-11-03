import mongoose from 'mongoose';

export async function connectDB(uri) {
  if (!uri) {
    throw new Error('MONGO_URI is not set. Copy server/.env.example to server/.env');
  }
  mongoose.set('strictQuery', true);
  // A pool lets many requests talk to MongoDB at the same time (default is 5 in older setups)
  await mongoose.connect(uri, { maxPoolSize: Number(process.env.DB_POOL_SIZE) || 20 });
  console.log('MongoDB connected');
}
