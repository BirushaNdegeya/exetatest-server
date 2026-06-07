import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

import { AuthModule } from './auth/auth.module';
import { EmailModule } from './email/email.module';
import { SectionsModule } from './sections/sections.module';
import { UsersModule } from './users/users.module';
import { ItemModule } from './item/item.module';
import { ItemCourseModule } from './item-course/item-course.module';
import { ItemQuestionModule } from './item-question/item-question.module';
import { User } from './models/user.model';
import { Otp } from './models/otp.model';
import { Item } from './models/item.model';
import { ItemCourse } from './models/item-course.model';
import { ItemQuestion } from './models/item-question.model';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => [
        {
          ttl: configService.get<number>('THROTTLE_TTL', 60000),
          limit: configService.get<number>('THROTTLE_LIMIT', 100),
        },
      ],
      inject: [ConfigService],
    }),
    SequelizeModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const isProduction =
          configService.get<string>('NODE_ENV') === 'production';
        const synchronize = configService.get<string>('DB_SYNCHRONIZE');
        const shouldSynchronize = synchronize
          ? synchronize === 'true'
          : !isProduction;

        return {
          dialect: 'postgres',
          host: configService.get<string>('DB_HOST'),
          port: configService.get<number>('DB_PORT'),
          username: configService.get<string>('DB_USER'),
          password: configService.get<string>('DB_PASS'),
          database: configService.get<string>('DB_NAME'),
          dialectOptions: {
            ssl: {
              require: true,
              rejectUnauthorized: false,
            },
          },
          autoLoadModels: true,
          synchronize: shouldSynchronize,
          logging:
            configService.get<string>('NODE_ENV') === 'development'
              ? console.log
              : false,
        };
      },
      inject: [ConfigService],
    }),
    SequelizeModule.forFeature([User, Otp, Item, ItemCourse, ItemQuestion]),
    EmailModule,
    AuthModule,
    SectionsModule,
    UsersModule,
    ItemModule,
    ItemCourseModule,
    ItemQuestionModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
