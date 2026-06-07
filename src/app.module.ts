import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

import { AuthModule } from './auth/auth.module';
import { EmailModule } from './email/email.module';
import { SectionsModule } from './sections/sections.module';
import { CategoriesModule } from './categories/categories.module';
import { QuestionsModule } from './questions/questions.module';
import { UsersModule } from './users/users.module';
import { AdminModule } from './admin/admin.module';
import { ExamsModule } from './exams/exams.module';
import { PracticeModule } from './practice/practice.module';
import { ExamModule } from './exam/exam.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { SchemaMigrationService } from './database/schema-migration.service';
import { User } from './models/user.model';
import { Otp } from './models/otp.model';
import { RefreshToken } from './models/refresh-token.model';
import { Subject } from './models/subject.model';
import { TestYear } from './models/test-year.model';
import { Question } from './models/question.model';
import { Category } from './models/category.model';
import { Exam } from './models/exam.model';
import { LanguagePassage } from './models/language-passage.model';
import { LanguageQuestion } from './models/language-question.model';

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
    SequelizeModule.forFeature([
      User,
      Otp,
      RefreshToken,
      Subject,
      TestYear,
      Question,
      Category,
      Exam,
      LanguagePassage,
      LanguageQuestion,
    ]),
    EmailModule,
    AuthModule,
    SectionsModule,
    CategoriesModule,
    ExamsModule,
    QuestionsModule,
    UsersModule,
    AdminModule,
    PracticeModule,
    ExamModule,
    DashboardModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    SchemaMigrationService,
  ],
})
export class AppModule {}
