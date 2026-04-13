import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { EmailModule } from './email/email.module';
import { ProfilesModule } from './profiles/profiles.module';
import { SectionsModule } from './sections/sections.module';
import { SubjectsModule } from './subjects/subjects.module';
import { QuestionsModule } from './questions/questions.module';
import { ProgressModule } from './progress/progress.module';
import { StreaksModule } from './streaks/streaks.module';
import { LessonsModule } from './lessons/lessons.module';
import { CustomSetsModule } from './custom-sets/custom-sets.module';
import { InvitationsModule } from './invitations/invitations.module';
import { UsersModule } from './users/users.module';
import { AdminModule } from './admin/admin.module';
import { SharedQuizModule } from './shared-quiz/shared-quiz.module';
import { TestYearsModule } from './test-years/test-years.module';
import { PracticeModule } from './practice/practice.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { SchemaMigrationService } from './database/schema-migration.service';
import { User } from './models/user.model';
import { Profile } from './models/profile.model';
import { UserRole } from './models/user-role.model';
import { Otp } from './models/otp.model';
import { Section } from './models/section.model';
import { Subject } from './models/subject.model';
import { TestYear } from './models/test-year.model';
import { Question } from './models/question.model';
import { UserProgress } from './models/user-progress.model';
import { UserStreak } from './models/user-streak.model';
import { CustomQuestionSet } from './models/custom-question-set.model';
import { CustomQuestion } from './models/custom-question.model';
import { Invitation } from './models/invitation.model';

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
          ttl: configService.get<number>('THROTTLE_TTL', 60000), // 1 minute
          limit: configService.get<number>('THROTTLE_LIMIT', 100), // 100 requests per minute
        },
      ],
      inject: [ConfigService],
    }),
    SequelizeModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
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
        synchronize: true,
        logging: configService.get<string>('NODE_ENV') === 'development' ? console.log : false,
      }),
      inject: [ConfigService],
    }),
    SequelizeModule.forFeature([
      User,
      Profile,
      UserRole,
      Otp,
      Section,
      Subject,
      TestYear,
      Question,
      UserProgress,
      UserStreak,
      CustomQuestionSet,
      CustomQuestion,
      Invitation,
    ]),
    EmailModule,
    CloudinaryModule,
    AuthModule,
    ProfilesModule,
    SectionsModule,
    SubjectsModule,
    TestYearsModule,
    QuestionsModule,
    ProgressModule,
    StreaksModule,
    LessonsModule,
    CustomSetsModule,
    InvitationsModule,
    UsersModule,
    AdminModule,
    SharedQuizModule,
    PracticeModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    SchemaMigrationService,
  ],
})
export class AppModule { }
