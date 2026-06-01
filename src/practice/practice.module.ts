import { Module } from '@nestjs/common';
import { PracticeController } from './practice.controller';
import { PracticeService } from './practice.service';
import { ProfilesModule } from '../profiles/profiles.module';
import { SectionsModule } from '../sections/sections.module';
import { StreaksModule } from '../streaks/streaks.module';
import { SubjectsModule } from '../subjects/subjects.module';
import { TestYearsModule } from '../test-years/test-years.module';

@Module({
  imports: [
    ProfilesModule,
    SectionsModule,
    StreaksModule,
    SubjectsModule,
    TestYearsModule,
  ],
  controllers: [PracticeController],
  providers: [PracticeService],
  exports: [PracticeService],
})
export class PracticeModule {}
