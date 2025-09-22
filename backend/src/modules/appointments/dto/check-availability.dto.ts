import { IsDateString, IsUUID, IsOptional } from 'class-validator';

export class CheckAvailabilityDto {
  @IsDateString()
  date: string;

  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;

  @IsUUID()
  roomId: string;

  @IsUUID()
  doctorId: string;

  @IsOptional()
  @IsUUID()
  excludeAppointmentId?: string; 
}