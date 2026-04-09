const app = require('./app');
const env = require('./config/env');
const runMigrations = require('./config/migrate');
const releaseScanner = require('./services/releaseScanner');

async function start() {
  await runMigrations();

  app.listen(env.port, () => {
    console.log(`Server running on port ${env.port}`);
    releaseScanner.start();
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
