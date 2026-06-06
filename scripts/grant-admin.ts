import 'dotenv/config';
import { Sequelize } from 'sequelize-typescript';
import { User, UserRoleEnum } from '../src/models/user.model';

async function main() {
  const email = process.argv[2]?.trim();

  const sequelize = new Sequelize({
    dialect: 'postgres',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    models: [User],
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
    logging: false,
  });

  await sequelize.authenticate();

  const [user, created] = await User.findOrCreate({
    where: { email },
    defaults: {
      email,
      role: UserRoleEnum.ADMIN,
      current_streak: 0,
      longest_streak: 0,
    },
  });

  if (!created && user.role !== UserRoleEnum.ADMIN) {
    await user.update({ role: UserRoleEnum.ADMIN });
  }

  // eslint-disable-next-line no-console
  console.log(`OK: ${email} est maintenant admin (userId=${user.id}).`);

  await sequelize.close();
}

main().catch(async (err) => {
  // eslint-disable-next-line no-console
  console.error('Erreur:', err);
  process.exitCode = 1;
});
