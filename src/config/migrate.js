const fs = require('fs');
const path = require('path');
const db = require('./db');

async function runMigrations() {
  const migrationsDir = path.join(__dirname, '../../migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  await db.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  for (const file of files) {
    const { rows } = await db.query(
      'SELECT 1 FROM migrations WHERE name = $1',
      [file]
    );

    if (rows.length === 0) {
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
      await db.query(sql);
      await db.query('INSERT INTO migrations (name) VALUES ($1)', [file]);
      console.log(`Migration applied: ${file}`);
    }
  }
}

if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('All migrations applied');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}

module.exports = runMigrations;
