export class RoomResponseDto {
  id: string;
  name: string;
  description?: string;
  capacity?: number;
  available: boolean; // cambiado de active a available
  createdAt: Date;
  updatedAt: Date;
}