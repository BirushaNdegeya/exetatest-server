import { Module } from '@nestjs/common';
import { PracticeController } from './practice.controller';
import { PracticeService } from './practice.service';
import { ProfilesModule } from '../profiles/profiles.module';
import { SectionsModule } from '../sections/sections.module';
import { StreaksModule } from '../streaks/streaks.module';
import { CategoriesModule } from '../categories/categories.module';
import { ExamsModule } from '../exams/exams.module';

@Module({
  imports: [
    ProfilesModule,
    SectionsModule,
    StreaksModule,
    CategoriesModule,
    ExamsModule,
  ],
  controllers: [PracticeController],
  providers: [PracticeService],
  exports: [PracticeService],
})
export class PracticeModule {}
