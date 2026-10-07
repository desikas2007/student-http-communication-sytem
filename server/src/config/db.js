import mongoose from 'mongoose';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Connects to MongoDB Atlas using the MONGODB_URI environment variable.
 * The connection string is never hardcoded or logged.
 *
 * Atlas free tiers can drop the first connection attempt, so the connect
 * is retried with a short backoff before giving up.
 */
export const connectDB = async ({ retries = 3, delayMs = 3000 } = {}) => {
  const uri = process.env.MONGODB_URI;

  if (!uri || uri === 'your_mongodb_atlas_connection_string') {
    throw new Error(
      'MONGODB_URI is missing or still set to the placeholder value. ' +
        'Copy server/.env.example to server/.env and paste your MongoDB Atlas connection string.'
    );
  }

  mongoose.set('strictQuery', true);

  if (!mongoose.connection.eventNames().includes('connected')) {
    mongoose.connection.on('connected', () => {
      console.log('MongoDB connected successfully');
    });

    mongoose.connection.on('error', (err) => {
      console.error(`MongoDB connection error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected');
    });
  }

  const options = {
    serverSelectionTimeoutMS: 30000,
    connectTimeoutMS: 30000,
    socketTimeoutMS: 45000,
    maxPoolSize: 10,
    retryWrites: true,
  };

  let lastError;
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      await mongoose.connect(uri, options);
      return mongoose.connection;
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        console.warn(
          `[db] Connection attempt ${attempt}/${retries} failed: ${error.message}. Retrying in ${delayMs / 1000}s...`
        );
        await sleep(delayMs);
      }
    }
  }

  throw lastError;
};

/** Closes the active connection gracefully. */
export const disconnectDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
  }
};

/**
 * Runs an async operation, retrying on transient MongoDB/network errors.
 * Used by the seed script so a single dropped socket does not abort the run.
 */
export const withRetry = async (operation, { retries = 3, delayMs = 3000, label = 'operation' } = {}) => {
  let lastError;
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const transient =
        error.message?.includes('timed out') ||
        error.message?.includes('buffering') ||
        error.message?.includes('ECONNRESET') ||
        error.message?.includes('topology') ||
        error.name === 'MongoNetworkError' ||
        error.name === 'MongoServerSelectionError';
      if (!transient || attempt === retries) throw error;
      console.warn(`[db] ${label}: attempt ${attempt}/${retries} failed (${error.message}). Retrying...`);
      await sleep(delayMs);
    }
  }
  throw lastError;
};
