import { IsOptional, IsString, IsDateString, IsUUID, IsEnum } from 'class-validator';
import { AppointmentStatus } from './create-appointment.dto';

export class SearchAppointmentsDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsUUID()
  patientId?: string;

  @IsOptional()
  @IsUUID()
  doctorId?: string;

  @IsOptional()
  @IsUUID()
  roomId?: string;

  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @IsOptional()
  @IsString()
  view?: 'day' | 'week' | 'month';
}