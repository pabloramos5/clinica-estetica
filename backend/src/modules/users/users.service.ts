import { Injectable, ConflictException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UserResponseDto } from './dto/user-response.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    // Verificar si el email ya existe
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('El email ya está registrado');
    }

    // Verificar si el username ya existe (si se proporciona)
    const username = createUserDto.username || createUserDto.email.split('@')[0];
    const existingUsername = await this.prisma.user.findUnique({
      where: { username },
    });

    if (existingUsername) {
      throw new ConflictException('El nombre de usuario ya está registrado');
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // Crear el usuario
    const user = await this.prisma.user.create({
      data: {
        email: createUserDto.email,
        username: username,
        passwordHash: hashedPassword,
        role: createUserDto.role,
        phone: createUserDto.phone || null,
        specialty: createUserDto.specialization || null,
        licenseNumber: createUserDto.licenseNumber || null,
        active: true,
      },
    });

    console.log('Usuario creado en BD:', user); // Debug
    return this.formatUserResponse(user);
  }

  async findAll(includeInactive = false): Promise<UserResponseDto[]> {
    const users = await this.prisma.user.findMany({
      where: includeInactive ? {} : { active: true },
      orderBy: { username: 'asc' },
    });

    console.log('Usuarios encontrados:', users.length); // Debug
    console.log('Primer usuario:', users[0]); // Debug
    
    return users.map(user => this.formatUserResponse(user));
  }

  async findOne(id: string): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    return this.formatUserResponse(user);
  }

  async findByEmail(email: string) {
    return await this.prisma.user.findUnique({
      where: { email },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    // Verificar que el usuario existe
    await this.findOne(id);

    // Si se está actualizando el email, verificar que no exista
    if (updateUserDto.email) {
      const existingUser = await this.prisma.user.findFirst({
        where: {
          email: updateUserDto.email,
          NOT: { id },
        },
      });

      if (existingUser) {
        throw new ConflictException('El email ya está registrado');
      }
    }

    // Si se está actualizando el username, verificar que no exista
    if (updateUserDto.username) {
      const existingUsername = await this.prisma.user.findFirst({
        where: {
          username: updateUserDto.username,
          NOT: { id },
        },
      });

      if (existingUsername) {
        throw new ConflictException('El nombre de usuario ya está registrado');
      }
    }

    // Preparar datos para actualizar
    const dataToUpdate: any = {};
    
    if (updateUserDto.email !== undefined) dataToUpdate.email = updateUserDto.email;
    if (updateUserDto.name !== undefined) dataToUpdate.username = updateUserDto.name;
    if (updateUserDto.username !== undefined) dataToUpdate.username = updateUserDto.username;
    if (updateUserDto.role !== undefined) dataToUpdate.role = updateUserDto.role;
    if (updateUserDto.phone !== undefined) dataToUpdate.phone = updateUserDto.phone || null;
    if (updateUserDto.specialization !== undefined) dataToUpdate.specialty = updateUserDto.specialization || null;
    if (updateUserDto.licenseNumber !== undefined) dataToUpdate.licenseNumber = updateUserDto.licenseNumber || null;
    
    // Si se incluye nueva contraseña, hashearla
    if (updateUserDto.password) {
      dataToUpdate.passwordHash = await bcrypt.hash(updateUserDto.password, 10);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: dataToUpdate,
    });

    console.log('Usuario actualizado:', updatedUser); // Debug
    return this.formatUserResponse(updatedUser);
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Verificar contraseña actual
    const isPasswordValid = await bcrypt.compare(changePasswordDto.currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('La contraseña actual es incorrecta');
    }

    // Actualizar con nueva contraseña
    const hashedPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hashedPassword },
    });
  }

  async remove(id: string): Promise<void> {
    // Verificar que el usuario existe
    await this.findOne(id);

    // Verificar que no es el último admin
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (user.role === 'ADMIN') {
      const adminCount = await this.prisma.user.count({
        where: { role: 'ADMIN', active: true },
      });

      if (adminCount <= 1) {
        throw new ConflictException('No se puede eliminar el último usuario administrador');
      }
    }

    // Soft delete (desactivar en lugar de eliminar)
    await this.prisma.user.update({
      where: { id },
      data: { active: false },
    });
  }

  async reactivate(id: string): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { active: true },
    });

    return this.formatUserResponse(updatedUser);
  }

  async getUserStats() {
    const [totalUsers, activeUsers, usersByRole] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { active: true } }),
      this.prisma.user.groupBy({
        by: ['role'],
        _count: true,
        where: { active: true },
      }),
    ]);

    return {
      total: totalUsers,
      active: activeUsers,
      byRole: usersByRole.reduce((acc, curr) => {
        acc[curr.role] = curr._count;
        return acc;
      }, {}),
    };
  }

  private formatUserResponse(user: any): UserResponseDto {
    // IMPORTANTE: Verificar que estamos mapeando correctamente
    console.log('Formateando usuario:', {
      id: user.id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      specialty: user.specialty,
      licenseNumber: user.licenseNumber,
    });

    return {
      id: user.id,
      email: user.email,
      username: user.username, // Agregar username
      name: user.username, // Mantener compatibilidad
      phone: user.phone || undefined,
      role: user.role,
      specialization: user.specialty || undefined, // IMPORTANTE: specialty -> specialization
      licenseNumber: user.licenseNumber || undefined,
      isActive: user.active,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}