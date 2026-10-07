import 'dotenv/config';
import app from './app.js';
import { connectDB, disconnectDB } from './config/db.js';

/** Fails fast when required environment variables are missing or placeholder. */
const validateEnvironment = () => {
  const problems = [];

  if (!process.env.MONGODB_URI || process.env.MONGODB_URI === 'your_mongodb_atlas_connection_string') {
    problems.push('MONGODB_URI - copy server/.env.example to server/.env and add your Atlas connection string');
  }
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'your_secure_jwt_secret') {
    problems.push('JWT_SECRET - replace the placeholder with a long random secret');
  }

  if (problems.length) {
    console.error('\n[server] Cannot start - environment is incomplete:');
    problems.forEach((problem) => console.error(`  - ${problem}`));
    console.error('');
    process.exit(1);
  }
};

const start = async () => {
  validateEnvironment();

  const port = Number(process.env.PORT) || 5000;

  try {
    await connectDB();
  } catch (error) {
    console.error(`\n[server] MongoDB connection failed: ${error.message}\n`);
    process.exit(1);
  }

  const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log(`API base URL: http://localhost:${port}/api`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });

  const shutdown = async (signal) => {
    console.log(`\n[server] Received ${signal}, shutting down...`);
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
    setTimeout(() => process.exit(0), 5000).unref();
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  process.on('unhandledRejection', (reason) => {
    console.error('[server] Unhandled promise rejection:', reason);
  });

  process.on('uncaughtException', (error) => {
    console.error('[server] Uncaught exception:', error);
    process.exit(1);
  });
};

start();
