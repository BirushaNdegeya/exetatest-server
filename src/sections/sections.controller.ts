import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SectionsService } from './sections.service';
import { SectionResponseDto } from './dto/section-response.dto';

@ApiTags('sections')
@Controller('sections')
export class SectionsController {
  constructor(private readonly sectionsService: SectionsService) {}

  @Get()
  @ApiOperation({
    summary: 'List DRC exam sections',
    description:
      'Returns the fixed catalog of DRC exam sections (no database table). Each section groups subjects; subjects group test-year blocks; blocks group questions.',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns all DRC sections',
    type: [SectionResponseDto],
  })
  getAllSections(): SectionResponseDto[] {
    return this.sectionsService.getAllSections();
  }

  @Get('count')
  @ApiOperation({
    summary: 'Get section count',
    description: 'Returns how many sections exist in the DRC catalog.',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns total number of sections',
    schema: {
      type: 'object',
      properties: {
        count: { type: 'number', example: 30 },
      },
    },
  })
  getSectionCount() {
    return { count: this.sectionsService.getSectionCount() };
  }
}
