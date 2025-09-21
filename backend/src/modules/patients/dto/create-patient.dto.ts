import { IsString, IsEmail, IsOptional, IsDateString, IsEnum, IsBoolean, Length, Matches } from 'class-validator';

export enum DocumentType {
  DNI = 'DNI',
  NIE = 'NIE',
  PASAPORTE = 'PASAPORTE',
  OTRO = 'OTRO'
}

export enum Gender {
  M = 'M',
  F = 'F',
  O = 'O'
}

export class CreatePatientDto {
  @IsString()
  @Length(2, 100)
  firstName: string;

  @IsString()
  @Length(2, 100)
  lastName: string;

  @IsOptional()
  @IsString()
  alias?: string;

  @IsEnum(DocumentType)
  @IsOptional()
  documentType?: DocumentType;

  @IsString()
  @Matches(/^[0-9]{8,9}[A-Z]?$/, { message: 'DNI debe tener 8-9 dígitos y puede terminar en letra' })
  documentNumber: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @Matches(/^(\+34)?[6-7][0-9]{8}$/, { message: 'Teléfono debe ser válido español' })
  phone: string;

  @IsOptional()
  @IsString()
  alternativePhone?: string;

  @IsOptional()
  @IsString()
  mobile?: string;

  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @IsOptional()
  @IsString()
  profession?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  @Length(2, 50)
  city?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[0-9]{5}$/, { message: 'Código postal debe tener 5 dígitos' })
  postalCode?: string;

  @IsOptional()
  @IsString()
  province?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  occupation?: string;

  @IsOptional()
  @IsString()
  allergies?: string;

  @IsOptional()
  @IsString()
  medications?: string;

  @IsOptional()
  @IsString()
  medicalConditions?: string;

  @IsOptional()
  @IsString()
  observations?: string;

  @IsOptional()
  @IsString()
  referredBy?: string;

  @IsOptional()
  @IsBoolean()
  wantsSMS?: boolean;

  @IsOptional()
  @IsBoolean()
  wantsEmail?: boolean;

  @IsOptional()
  @IsBoolean()
  acceptsMarketing?: boolean;

  @IsOptional()
  @IsBoolean()
  acceptsWhatsapp?: boolean;

  @IsOptional()
  @IsBoolean()
  dataConsent?: boolean;

  @IsOptional()
  @IsBoolean()
  imageConsent?: boolean;

  @IsOptional()
  @IsBoolean()
  marketingConsent?: boolean;
}