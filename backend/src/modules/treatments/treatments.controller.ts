import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  HttpCode,
  HttpStatus,
  ValidationPipe
} from '@nestjs/common';
import { TreatmentsService } from './treatments.service';
import { CreateTreatmentDto } from './dto/create-treatment.dto';
import { UpdateTreatmentDto } from './dto/update-treatment.dto';
import { TreatmentQueryDto, PaginatedResponseDto } from './dto/treatment-query.dto';
import { TreatmentResponseDto, TreatmentWithAppointmentsDto } from './dto/treatment-response.dto';
import { TreatmentStatisticsDto, TreatmentTypeDto } from './dto/treatment-statistics.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
// Si no tienes RolesGuard, comentar estas líneas:
// import { RolesGuard } from '../auth/guards/roles.guard';
// import { Roles } from '../auth/decorators/roles.decorator';

@Controller('treatments')
@UseGuards(JwtAuthGuard) // Solo usar JwtAuthGuard si no tienes RolesGuard
export class TreatmentsController {
  constructor(private readonly treatmentsService: TreatmentsService) {}

  @Post()
  // @Roles('ADMIN') // Comentar si no tienes el decorator Roles
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createTreatmentDto: CreateTreatmentDto): Promise<TreatmentResponseDto> {
    return this.treatmentsService.create(createTreatmentDto);
  }

  @Get()
  // @Roles('ADMIN', 'MEDICO')
  async findAll(
    @Query(new ValidationPipe({ transform: true })) query: TreatmentQueryDto
  ): Promise<PaginatedResponseDto<TreatmentResponseDto>> {
    return this.treatmentsService.findAll(query);
  }

  @Get('types')
  // @Roles('ADMIN', 'MEDICO')
  async getTypes(): Promise<TreatmentTypeDto[]> {
    return this.treatmentsService.getTypes();
  }

  @Get('statistics')
  // @Roles('ADMIN')
  async getStatistics(): Promise<TreatmentStatisticsDto> {
    return this.treatmentsService.getStatistics();
  }

  @Get(':id')
  // @Roles('ADMIN', 'MEDICO')
  async findOne(@Param('id') id: string): Promise<TreatmentWithAppointmentsDto> {
    return this.treatmentsService.findOne(id);
  }

  @Patch(':id')
  // @Roles('ADMIN')
  async update(
    @Param('id') id: string, 
    @Body() updateTreatmentDto: UpdateTreatmentDto
  ): Promise<TreatmentResponseDto> {
    return this.treatmentsService.update(id, updateTreatmentDto);
  }

  @Patch(':id/toggle-active')
  // @Roles('ADMIN')
  async toggleActive(@Param('id') id: string): Promise<TreatmentResponseDto> {
    return this.treatmentsService.toggleActive(id);
  }

  @Delete(':id')
  // @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    return this.treatmentsService.remove(id);
  }
}