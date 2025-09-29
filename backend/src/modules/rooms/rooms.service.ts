import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { RoomResponseDto } from './dto/room-response.dto';

@Injectable()
export class RoomsService {
  constructor(private prisma: PrismaService) {}

  async create(createRoomDto: CreateRoomDto): Promise<RoomResponseDto> {
    // Verificar si ya existe una sala con el mismo nombre
    const existingRoom = await this.prisma.room.findFirst({
      where: { 
        name: createRoomDto.name,
      },
    });

    if (existingRoom) {
      throw new ConflictException('Ya existe una sala con ese nombre');
    }

    // Crear la sala con los campos correctos según tu esquema
    const room = await this.prisma.room.create({
      data: {
        name: createRoomDto.name,
        capacity: createRoomDto.capacity || 2,
        observations: createRoomDto.description || null,
        active: true,
      },
    });

    return this.formatRoomResponse(room);
  }

  async findAll(): Promise<RoomResponseDto[]> {
    const rooms = await this.prisma.room.findMany({
      where: { active: true }, // Solo mostrar salas activas
      orderBy: { name: 'asc' },
    });

    return rooms.map(room => this.formatRoomResponse(room));
  }

  async findOne(id: string): Promise<RoomResponseDto> {
    const room = await this.prisma.room.findUnique({
      where: { id },
    });

    if (!room) {
      throw new NotFoundException(`Sala con ID ${id} no encontrada`);
    }

    return this.formatRoomResponse(room);
  }

  async update(id: string, updateRoomDto: UpdateRoomDto): Promise<RoomResponseDto> {
    // Verificar que la sala existe
    await this.findOne(id);

    // Si se está actualizando el nombre, verificar que no exista
    if (updateRoomDto.name) {
      const existingRoom = await this.prisma.room.findFirst({
        where: {
          name: updateRoomDto.name,
          NOT: { id },
        },
      });

      if (existingRoom) {
        throw new ConflictException('Ya existe otra sala con ese nombre');
      }
    }

    // Preparar datos para actualizar
    const dataToUpdate: any = {};
    if (updateRoomDto.name !== undefined) {
      dataToUpdate.name = updateRoomDto.name;
    }
    if (updateRoomDto.capacity !== undefined) {
      dataToUpdate.capacity = updateRoomDto.capacity;
    }
    if (updateRoomDto.description !== undefined) {
      dataToUpdate.observations = updateRoomDto.description;
    }

    const updatedRoom = await this.prisma.room.update({
      where: { id },
      data: dataToUpdate,
    });

    return this.formatRoomResponse(updatedRoom);
  }

  async remove(id: string): Promise<void> {
    // Verificar que la sala existe
    await this.findOne(id);

    // Verificar si hay citas programadas en esta sala
    const hasAppointments = await this.prisma.appointment.count({
      where: { 
        roomId: id,
        status: {
          in: ['PROGRAMADA', 'CONFIRMADA', 'EN_CURSO']
        }
      },
    });

    if (hasAppointments > 0) {
      throw new ConflictException(`No se puede eliminar la sala porque tiene ${hasAppointments} citas programadas. Por favor, cancele o mueva las citas primero.`);
    }

    // Verificar citas históricas (opcional - puedes quitar esto si quieres permitir eliminar salas con citas pasadas)
    const historicalAppointments = await this.prisma.appointment.count({
      where: { roomId: id }
    });

    if (historicalAppointments > 0) {
      // Si hay citas históricas, hacer soft delete para mantener el registro
      await this.prisma.room.update({
        where: { id },
        data: { active: false },
      });
    } else {
      // Si no hay ninguna cita asociada, eliminar permanentemente
      await this.prisma.room.delete({
        where: { id },
      });
    }
  }

  async getRoomStats() {
    const totalRooms = await this.prisma.room.count({
      where: { active: true }
    });

    return {
      total: totalRooms,
      active: totalRooms,
      inactive: 0,
    };
  }

  private formatRoomResponse(room: any): RoomResponseDto {
    return {
      id: room.id,
      name: room.name,
      description: room.observations || undefined,
      capacity: room.capacity || 2,
      available: room.active,
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
    };
  }
}