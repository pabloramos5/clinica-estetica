import { 
  IsString, 
  IsEmail, 
  IsOptional, 
  IsEnum, 
  IsBoolean, 
  IsDateString,
  IsNumber,
  MinLength,
  MaxLength 
} from 'class-validator';
import { DocumentType, Gender } from '@prisma/client';

export class CreatePatientDto {
  @IsOptional()
  @IsNumber()
  codCliente?: number;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  lastName: string;

  @IsOptional()
  @IsString()
  alias?: string;

  @IsEnum(DocumentType)
  documentType: DocumentType;

  @IsString()
  @MinLength(5)
  @MaxLength(20)
  documentNumber: string;

  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @IsOptional()
  @IsString()
  profession?: string;

  @IsString()
  @MinLength(9)
  @MaxLength(20)
  phone: string;

  @IsOptional()
  @IsString()
  alternativePhone?: string;

  @IsOptional()
  @IsString()
  mobile?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  postalCode?: string;

  @IsOptional()
  @IsString()
  province?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  bankName?: string;

  @IsOptional()
  @IsString()
  bankAccount?: string;

  @IsOptional()
  @IsBoolean()
  wantsSMS?: boolean;

  @IsOptional()
  @IsBoolean()
  wantsEmail?: boolean;

  @IsOptional()
  @IsString()
  observations?: string;

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

export class UpdatePatientDto extends CreatePatientDto {}