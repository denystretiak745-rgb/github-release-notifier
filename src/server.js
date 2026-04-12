const app = require('./app');
const env = require('./config/env');
const runMigrations = require('./config/migrate');
const releaseScanner = require('./services/releaseScanner');
const { startGrpcServer } = require('./grpc/server');

async function start() {
  await runMigrations();

  app.listen(env.port, () => {
    console.log(`Server running on port ${env.port}`);
    releaseScanner.start();
  });

  if (env.grpcEnabled) {
    try {
      await startGrpcServer(env.grpcPort);
    } catch (err) {
      console.warn('gRPC server failed to start:', err?.stack ?? err);
    }
  }
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
