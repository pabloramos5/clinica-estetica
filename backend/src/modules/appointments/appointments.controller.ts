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
import { AppointmentsService } from './appointments.service';
import {
  CreateAppointmentDto,
  UpdateAppointmentDto,
  SearchAppointmentsDto,
  CheckAvailabilityDto
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('appointments')
@UseGuards(JwtAuthGuard)
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createAppointmentDto: CreateAppointmentDto) {
    return await this.appointmentsService.create(createAppointmentDto);
  }

  @Get()
  async findAll(@Query() searchParams: SearchAppointmentsDto) {
    return await this.appointmentsService.findAll(searchParams);
  }

  @Get('today')
  async getTodayAppointments() {
    return await this.appointmentsService.getTodayAppointments();
  }

  @Get('patient/:patientId')
  async getByPatient(@Param('patientId') patientId: string) {
    return await this.appointmentsService.getAppointmentsByPatient(patientId);
  }

  @Post('check-availability')
  async checkAvailability(@Body() checkDto: CheckAvailabilityDto) {
    const isAvailable = await this.appointmentsService.checkAvailability(checkDto);
    return { available: isAvailable };
  }

  @Get('available-slots')
  async getAvailableSlots(
    @Query('date') date: string,
    @Query('doctorId') doctorId: string,
    @Query('treatmentId') treatmentId: string
  ) {
    return await this.appointmentsService.getAvailableSlots(date, doctorId, treatmentId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.appointmentsService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateAppointmentDto: UpdateAppointmentDto
  ) {
    return await this.appointmentsService.update(id, updateAppointmentDto);
  }

  @Patch(':id/confirm')
  async confirm(@Param('id') id: string) {
    return await this.appointmentsService.confirmAppointment(id);
  }

  @Patch(':id/cancel')
  async cancel(
    @Param('id') id: string,
    @Body('reason') reason?: string
  ) {
    return await this.appointmentsService.cancelAppointment(id, reason);
  }

  @Patch(':id/no-show')
  async markNoShow(@Param('id') id: string) {
    return await this.appointmentsService.markAsNoShow(id);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.appointmentsService.remove(id);
  }
}

