import { IsOptional, IsString, Length } from "class-validator";

export class SearchRoomDto {
  @IsOptional()
  @IsString()
  @Length(2, 100)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(0, 255)
  description?: string;

  @IsOptional()
  capacity?: number;

  @IsOptional()
  available?: boolean;
}