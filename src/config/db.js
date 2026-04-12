const { Pool } = require('pg');
const env = require('./env');

const poolConfig = {
  connectionString: env.databaseUrl,
};

if (env.databaseUrl && env.databaseUrl.includes('render.com')) {
  poolConfig.ssl = { rejectUnauthorized: false };
}

const pool = new Pool(poolConfig);

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
