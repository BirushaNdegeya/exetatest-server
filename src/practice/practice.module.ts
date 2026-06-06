import { Module } from '@nestjs/common';
import { PracticeController } from './practice.controller';
import { PracticeService } from './practice.service';
import { UsersModule } from '../users/users.module';
import { SectionsModule } from '../sections/sections.module';
import { CategoriesModule } from '../categories/categories.module';
import { ExamsModule } from '../exams/exams.module';

@Module({
  imports: [UsersModule, SectionsModule, CategoriesModule, ExamsModule],
  controllers: [PracticeController],
  providers: [PracticeService],
  exports: [PracticeService],
})
export class PracticeModule {}
