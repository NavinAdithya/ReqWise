import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { exec } from 'child_process';

let connectPromise: Promise<void> | null = null;

export const connectDB = async (): Promise<void> => {
  if (mongoose.connection.readyState === 1) {
    console.log('MongoDB connection is already active. Skipping connectDB.');
    return;
  }

  if (connectPromise) {
    console.log('MongoDB connection is already in progress. Reusing connection promise...');
    return connectPromise;
  }

  connectPromise = (async () => {
    let connUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/reqwise';

    if (process.env.NODE_ENV === 'development' || connUri.includes('127.0.0.1') || process.env.NODE_ENV === 'test') {
      // Reuse global memory server if it exists (e.g. across sequential Jest tests)
      if (!(global as any).__MONGO_URI__) {
        const mongoServer = await MongoMemoryServer.create();
        (global as any).__MONGO_SERVER__ = mongoServer;
        (global as any).__MONGO_URI__ = mongoServer.getUri();
        console.log('Started global MongoDB Memory Server.');
      }
      connUri = (global as any).__MONGO_URI__;
      process.env.MONGODB_URI = connUri;
    }

    // Disconnect any active connections to reset connection state in Mongoose
    await mongoose.disconnect();

    console.log(`Connecting to MongoDB at ${connUri}...`);
    await mongoose.connect(connUri);
    console.log(`MongoDB Connected successfully`);

    // Auto-seed if we are using the local/in-memory database, even in production on Render
    if (connUri.includes('127.0.0.1') && !(global as any).__SEEDED__) {
      (global as any).__SEEDED__ = true;
      console.log('Running auto-seed for in-memory database...');
      exec('node dist/scripts/seedProduction.js', { env: { ...process.env, MONGODB_URI: connUri } }, (error, stdout, stderr) => {
        if (error) {
          console.error(`Auto-seed error: ${error.message}`);
          return;
        }
        console.log(`Auto-seed finished successfully.`);
      });
    }
  })();

  try {
    await connectPromise;
  } catch (error) {
    connectPromise = null; // Reset on failure so we can retry
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};
