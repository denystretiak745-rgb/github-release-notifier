const dotenv = require('dotenv');

dotenv.config();

module.exports = {
  port: process.env.PORT || 3000,
  databaseUrl: process.env.DATABASE_URL,
  githubToken: process.env.GITHUB_TOKEN || '',
  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  apiKeys: process.env.API_KEYS ? process.env.API_KEYS.split(',').map((k) => k.trim()).filter(Boolean) : [],
  redisUrl: process.env.REDIS_URL || '',
  appBaseUrl: process.env.APP_BASE_URL || 'http://localhost:3000',
  scanIntervalMs: parseInt(process.env.SCAN_INTERVAL_MS, 10) || 300000,
  grpcEnabled: process.env.GRPC_ENABLED !== undefined
    ? process.env.GRPC_ENABLED === 'true'
    : process.env.NODE_ENV !== 'production',
  grpcPort: parseInt(process.env.GRPC_PORT, 10) || 50051,
};
