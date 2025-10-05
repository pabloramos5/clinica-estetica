import { UserRole } from '@prisma/client';

export class UserResponseDto {
  id: string;
  email: string;
  username: string; 
  name: string; 
  phone?: string;
  role: UserRole;
  specialization?: string;
  licenseNumber?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}