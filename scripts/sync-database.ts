import 'dotenv/config';
import { Sequelize } from 'sequelize-typescript';
import { User } from '../src/models/user.model';
import { Otp } from '../src/models/otp.model';
import { Item } from '../src/models/item.model';
import { ItemCourse } from '../src/models/item-course.model';
import { ItemQuestion } from '../src/models/item-question.model';

async function main() {
  const sequelize = new Sequelize({
    dialect: 'postgres',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    models: [User, Otp, Item, ItemCourse, ItemQuestion],
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
  console.log('Connected. Running sync({ alter: true }) for all registered models...');

  await sequelize.sync({ alter: true });

  // eslint-disable-next-line no-console
  console.log('Database schema synced successfully.');
  await sequelize.close();
}

main().catch(async (err) => {
  // eslint-disable-next-line no-console
  console.error('Sync failed:', err);
  process.exitCode = 1;
});
