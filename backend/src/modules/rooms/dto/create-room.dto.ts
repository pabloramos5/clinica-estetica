import { IsOptional, IsString, Length, IsBoolean } from 'class-validator';

export class CreateRoomDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  capacity?: number;

  @IsOptional()
  @IsBoolean()
  available?: boolean;
}