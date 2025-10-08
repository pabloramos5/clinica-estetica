import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MedicalHistoryService } from './medical-history.service';

@Controller('medical-history')
@UseGuards(JwtAuthGuard)
export class MedicalHistoryController {
  constructor(private readonly medicalHistoryService: MedicalHistoryService) {}

  @Get('patient/:patientId/summary')
  async getPatientSummary(@Param('patientId') patientId: string) {
    return this.medicalHistoryService.getPatientTreatmentSummary(patientId);
  }

  @Get('patient/:patientId/treatment/:treatmentId')
  async getTreatmentDetails(
    @Param('patientId') patientId: string,
    @Param('treatmentId') treatmentId: string,
  ) {
    return this.medicalHistoryService.getTreatmentAppointments(patientId, treatmentId);
  }

  @Get('patient/:patientId/timeline')
  async getTimeline(
    @Param('patientId') patientId: string,
    @Query('limit') limit?: string,
  ) {
    return this.medicalHistoryService.getPatientTimeline(
      patientId,
      limit ? parseInt(limit) : 50
    );
  }

  @Get('patient/:patientId/stats')
  async getPatientStats(@Param('patientId') patientId: string) {
    return this.medicalHistoryService.getPatientStatistics(patientId);
  }
}