import { IsString, IsDateString, IsEnum, IsOptional, IsUUID } from 'class-validator';

export enum AppointmentStatus {
  PROGRAMADA = 'PROGRAMADA',
  CONFIRMADA = 'CONFIRMADA',
  EN_CURSO = 'EN_CURSO',
  COMPLETADA = 'COMPLETADA',
  CANCELADA = 'CANCELADA',
  NO_SHOW = 'NO_SHOW'
}

export class CreateAppointmentDto {
  @IsUUID()
  patientId: string;

  @IsUUID()
  doctorId: string;

  @IsUUID()
  roomId: string;

  @IsUUID()
  treatmentId: string;

  @IsDateString()
  date: string;

  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;

  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @IsOptional()
  @IsString()
  observations?: string;

  @IsOptional()
  confirmed?: boolean;

  @IsOptional()
  reminderSent?: boolean;
}