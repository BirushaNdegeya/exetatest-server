import 'dotenv/config';
import { readFileSync } from 'fs';
import { join } from 'path';
import { Sequelize } from 'sequelize';

async function main() {
  const sequelize = new Sequelize({
    dialect: 'postgres',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
    logging: console.log,
  });

  await sequelize.authenticate();
  // eslint-disable-next-line no-console
  console.log('Connected. Dropping all existing tables and types...');

  await sequelize.query('DROP SCHEMA public CASCADE;');
  await sequelize.query('CREATE SCHEMA public;');
  await sequelize.query('GRANT ALL ON SCHEMA public TO public;');

  const migrationPath = join(
    __dirname,
    'migrations',
    '001-initial-schema.sql',
  );
  const sql = readFileSync(migrationPath, 'utf8');

  // eslint-disable-next-line no-console
  console.log('Applying initial migration from scripts/migrations/001-initial-schema.sql...');
  await sequelize.query(sql);

  // eslint-disable-next-line no-console
  console.log('Database reset complete. Fresh schema is ready.');
  await sequelize.close();
}

main().catch(async (err) => {
  // eslint-disable-next-line no-console
  console.error('Database reset failed:', err);
  process.exitCode = 1;
});
