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

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // Crear el usuario con los campos correctos de tu esquema
    const user = await this.prisma.user.create({
      data: {
        email: createUserDto.email,
        username: createUserDto.name, // Usando username en lugar de name
        passwordHash: hashedPassword, // Usando passwordHash en lugar de password
        role: createUserDto.role,
        active: true, // Usando active en lugar de isActive
      },
    });

    return this.formatUserResponse(user);
  }

  async findAll(includeInactive = false): Promise<UserResponseDto[]> {
    const users = await this.prisma.user.findMany({
      where: includeInactive ? {} : { active: true }, // Usando active
      orderBy: { username: 'asc' }, // Usando username
    });

    return users.map(user => this.formatUserResponse(user));
  }

  async findOne(id: string): Promise<UserResponseDto> { // id es string
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

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserResponseDto> { // id es string
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

    // Preparar datos para actualizar
    const dataToUpdate: any = {};
    
    if (updateUserDto.email) dataToUpdate.email = updateUserDto.email;
    if (updateUserDto.name) dataToUpdate.username = updateUserDto.name; // username en lugar de name
    if (updateUserDto.role) dataToUpdate.role = updateUserDto.role;
    
    // Si se incluye nueva contraseña, hashearla
    if (updateUserDto.password) {
      dataToUpdate.passwordHash = await bcrypt.hash(updateUserDto.password, 10);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: dataToUpdate,
    });

    return this.formatUserResponse(updatedUser);
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<void> { // userId es string
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Verificar contraseña actual
    const isPasswordValid = await bcrypt.compare(changePasswordDto.currentPassword, user.passwordHash); // passwordHash
    if (!isPasswordValid) {
      throw new UnauthorizedException('La contraseña actual es incorrecta');
    }

    // Actualizar con nueva contraseña
    const hashedPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hashedPassword }, // passwordHash
    });
  }

  async remove(id: string): Promise<void> { // id es string
    // Verificar que el usuario existe
    await this.findOne(id);

    // Verificar que no es el último admin
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (user.role === 'ADMIN') {
      const adminCount = await this.prisma.user.count({
        where: { role: 'ADMIN', active: true }, // active
      });

      if (adminCount <= 1) {
        throw new ConflictException('No se puede eliminar el último usuario administrador');
      }
    }

    // Soft delete (desactivar en lugar de eliminar)
    await this.prisma.user.update({
      where: { id },
      data: { active: false }, // active
    });
  }

  async reactivate(id: string): Promise<UserResponseDto> { // id es string
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { active: true }, // active
    });

    return this.formatUserResponse(updatedUser);
  }

  async getUserStats() {
    const [totalUsers, activeUsers, usersByRole] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { active: true } }), // active
      this.prisma.user.groupBy({
        by: ['role'],
        _count: true,
        where: { active: true }, // active
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
    // Mapear campos del esquema real a la respuesta esperada
    return {
      id: user.id,
      email: user.email,
      name: user.username, // username -> name
      phone: user.phone || undefined,
      role: user.role,
      specialization: user.specialization || undefined,
      licenseNumber: user.licenseNumber || undefined,
      isActive: user.active, // active -> isActive
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}