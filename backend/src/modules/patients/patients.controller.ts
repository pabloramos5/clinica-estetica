import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete,
  Body, 
  Param, 
  Query, 
  UseGuards 
} from '@nestjs/common';
import { PatientsService } from './patients.service';
import { CreatePatientDto, UpdatePatientDto } from './dto/patient.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('patients')
@UseGuards(JwtAuthGuard)
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Post()
  create(@Body() createPatientDto: CreatePatientDto) {
    return this.patientsService.create(createPatientDto);
  }

  @Get()
  findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('search') search?: string,
  ) {
    return this.patientsService.findAll({
      skip: skip ? parseInt(skip) : 0,
      take: take ? parseInt(take) : 10,
      search,
    });
  }

  @Get('search')
  search(@Query('q') query: string) {
    return this.patientsService.search(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.patientsService.findOne(id);
  }

  @Get('document/:documentNumber')
  findByDocument(@Param('documentNumber') documentNumber: string) {
    return this.patientsService.findByDocument(documentNumber);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updatePatientDto: UpdatePatientDto) {
    return this.patientsService.update(id, updatePatientDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.patientsService.remove(id);
  }

  @Get(':id/appointments')
  getAppointments(@Param('id') id: string) {
    return this.patientsService.getPatientAppointments(id);
  }

  @Get(':id/medical-history')
  getMedicalHistory(@Param('id') id: string) {
    return this.patientsService.getPatientMedicalHistory(id);
  }
}