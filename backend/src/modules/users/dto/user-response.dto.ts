import { UserRole } from '@prisma/client';

export class UserResponseDto {
  id: number;
  email: string;
  name: string;
  phone?: string;
  role: UserRole;
  specialization?: string;
  licenseNumber?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}