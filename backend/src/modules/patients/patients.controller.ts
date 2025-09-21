import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { PatientsService } from './patients.service';
import { CreatePatientDto, UpdatePatientDto, SearchPatientsDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('patients')
@UseGuards(JwtAuthGuard)
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createPatientDto: CreatePatientDto) {
    return await this.patientsService.create(createPatientDto);
  }

  @Get()
  async findAll(@Query() searchParams: SearchPatientsDto) {
    return await this.patientsService.findAll(searchParams);
  }

  @Get('search/phone/:phone')
  async searchByPhone(@Param('phone') phone: string) {
    return await this.patientsService.searchByPhone(phone);
  }

  @Get('search/initials/:initials')
  async searchByInitials(@Param('initials') initials: string) {
    return await this.patientsService.searchByInitials(initials);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.patientsService.findOne(id);
  }

  @Get(':id/medical-history')
  async getMedicalHistory(@Param('id') id: string) {
    return await this.patientsService.getMedicalHistory(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updatePatientDto: UpdatePatientDto
  ) {
    return await this.patientsService.update(id, updatePatientDto);
  }

  @Patch(':id/medical-history')
  async updateMedicalHistory(
    @Param('id') id: string,
    @Body() data: any
  ) {
    return await this.patientsService.updateMedicalHistory(id, data);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.patientsService.remove(id);
  }
}