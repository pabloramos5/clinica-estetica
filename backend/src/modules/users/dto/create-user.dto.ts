import { IsEmail, IsString, MinLength, IsEnum, IsOptional } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEnum(['ADMIN', 'MEDICO'])
  role: 'ADMIN' | 'MEDICO'; 

  @IsOptional()
  @IsString()
  specialization?: string;

  @IsOptional()
  @IsString()
  licenseNumber?: string;
}