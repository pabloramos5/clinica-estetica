import { IsString, IsNumber, IsOptional, IsBoolean, IsEnum, Min, Max } from 'class-validator';

export enum TreatmentType {
  BOTOX = 'BOTOX',
  LASER = 'LASER',
  PEELING = 'PEELING',
  FILLERS = 'FILLERS',
  MESOTHERAPY = 'MESOTHERAPY',
  RADIOFREQUENCY = 'RADIOFREQUENCY',
  ULTRASOUND = 'ULTRASOUND',
  CRYOLIPOLYSIS = 'CRYOLIPOLYSIS',
  OTHER = 'OTHER'
}

export class CreateTreatmentDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string; 

  @IsOptional()
  @IsEnum(TreatmentType)
  type?: TreatmentType; 

  @IsNumber()
  @Min(0)
  price: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  iva: number = 21; 

  @IsNumber()
  @Min(5)
  @Max(480)
  duration: number; 

  @IsBoolean()
  @IsOptional()
  active?: boolean = true;

  @IsString()
  @IsOptional()
  code?: string; 

  @IsBoolean()
  @IsOptional()
  requiresConsent?: boolean = false;

  @IsString()
  @IsOptional()
  contraindications?: string;

  @IsString()
  @IsOptional()
  preparation?: string;

  @IsString()
  @IsOptional()
  aftercare?: string;
}