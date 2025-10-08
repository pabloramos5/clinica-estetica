import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { 
  CreateAppointmentDto, 
  UpdateAppointmentDto, 
  SearchAppointmentsDto,
  CheckAvailabilityDto 
} from './dto';
import { Prisma } from '@prisma/client';
import { addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

@Injectable()
export class AppointmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createAppointmentDto: CreateAppointmentDto) {
    try {
      // Verificar disponibilidad antes de crear
      const isAvailable = await this.checkAvailability({
        date: createAppointmentDto.date,
        startTime: createAppointmentDto.startTime,
        endTime: createAppointmentDto.endTime,
        roomId: createAppointmentDto.roomId,
        doctorId: createAppointmentDto.doctorId
      });

      if (!isAvailable) {
        throw new BadRequestException('El horario seleccionado no está disponible');
      }

      // Verificar que el paciente existe
      const patient = await this.prisma.patient.findUnique({
        where: { id: createAppointmentDto.patientId }
      });

      if (!patient) {
        throw new NotFoundException('Paciente no encontrado');
      }

      // Crear la cita
      const appointment = await this.prisma.appointment.create({
        data: {
          patientId: createAppointmentDto.patientId,
          doctorId: createAppointmentDto.doctorId,
          roomId: createAppointmentDto.roomId,
          treatmentId: createAppointmentDto.treatmentId,
          date: new Date(createAppointmentDto.date),
          startTime: new Date(createAppointmentDto.startTime),
          endTime: new Date(createAppointmentDto.endTime),
          status: createAppointmentDto.status || 'PROGRAMADA',
          observations: createAppointmentDto.observations,
          confirmed: createAppointmentDto.confirmed || false,
          reminderSent: createAppointmentDto.reminderSent || false
        },
        include: {
          patient: true,
          doctor: true,
          room: true,
          treatment: true
        }
      });

      // TODO: Programar recordatorio WhatsApp si está habilitado

      return appointment;
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Error al crear la cita');
    }
  }

  async findAll(searchParams: SearchAppointmentsDto) {
    const where: Prisma.AppointmentWhereInput = {};

    // Filtrar por rango de fechas
    if (searchParams.startDate || searchParams.endDate) {
      where.date = {};
      if (searchParams.startDate) {
        where.date.gte = new Date(searchParams.startDate);
      }
      if (searchParams.endDate) {
        where.date.lte = new Date(searchParams.endDate);
      }
    }

    // Filtrar por vista (día, semana, mes)
    if (searchParams.view) {
      const today = new Date();
      switch (searchParams.view) {
        case 'day':
          where.date = {
            gte: new Date(today.setHours(0, 0, 0, 0)),
            lte: new Date(today.setHours(23, 59, 59, 999))
          };
          break;
        case 'week':
          where.date = {
            gte: startOfWeek(today, { locale: es }),
            lte: endOfWeek(today, { locale: es })
          };
          break;
        case 'month':
          where.date = {
            gte: startOfMonth(today),
            lte: endOfMonth(today)
          };
          break;
      }
    }

    // Filtros adicionales
    if (searchParams.patientId) where.patientId = searchParams.patientId;
    if (searchParams.doctorId) where.doctorId = searchParams.doctorId;
    if (searchParams.roomId) where.roomId = searchParams.roomId;
    if (searchParams.status) where.status = searchParams.status;

    const appointments = await this.prisma.appointment.findMany({
      where,
      orderBy: [
        { date: 'asc' },
        { startTime: 'asc' }
      ],
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true
          }
        },
        doctor: {
          select: {
            id: true,
            username: true,
            email: true,
            specialty: true
          }
        },
        room: {
          select: {
            id: true,
            name: true
          }
        },
        treatment: {
          select: {
            id: true,
            name: true,
            duration: true,
            price: true
          }
        }
      }
    });

    // Formatear para el calendario frontend
    const formattedAppointments = appointments.map(apt => ({
      ...apt,
      title: `${apt.patient.firstName} ${apt.patient.lastName} - ${apt.treatment.name}`,
      start: apt.startTime,
      end: apt.endTime,
      color: this.getColorByStatus(apt.status as string),
      resourceId: apt.roomId, // Para vista de recursos (salas)
    }));

    return formattedAppointments;
  }

  async findOne(id: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: {
          include: {
            medicalHistories: {
              take: 1,
              orderBy: { createdAt: 'desc' }
            }
          }
        },
        doctor: true,
        room: true,
        treatment: true
      }
    });

    if (!appointment) {
      throw new NotFoundException('Cita no encontrada');
    }

    return appointment;
  }

  async update(id: string, updateAppointmentDto: UpdateAppointmentDto) {
    try {
      // Verificar que la cita existe
      await this.findOne(id);

      // Si se están cambiando fecha/hora, verificar disponibilidad
      if (updateAppointmentDto.date || updateAppointmentDto.startTime || updateAppointmentDto.endTime) {
        const currentAppointment = await this.findOne(id);
        
        const isAvailable = await this.checkAvailability({
          date: updateAppointmentDto.date || currentAppointment.date.toISOString(),
          startTime: updateAppointmentDto.startTime || currentAppointment.startTime.toISOString(),
          endTime: updateAppointmentDto.endTime || currentAppointment.endTime.toISOString(),
          roomId: updateAppointmentDto.roomId || currentAppointment.roomId,
          doctorId: updateAppointmentDto.doctorId || currentAppointment.doctorId,
          excludeAppointmentId: id
        });

        if (!isAvailable) {
          throw new BadRequestException('El nuevo horario no está disponible');
        }
      }

      const dataToUpdate: any = { ...updateAppointmentDto };
      
      if (updateAppointmentDto.date) {
        dataToUpdate.date = new Date(updateAppointmentDto.date);
      }
      if (updateAppointmentDto.startTime) {
        dataToUpdate.startTime = new Date(updateAppointmentDto.startTime);
      }
      if (updateAppointmentDto.endTime) {
        dataToUpdate.endTime = new Date(updateAppointmentDto.endTime);
      }
      if (updateAppointmentDto.confirmationDate) {
        dataToUpdate.confirmationDate = new Date(updateAppointmentDto.confirmationDate);
      }

      const appointment = await this.prisma.appointment.update({
        where: { id },
        data: dataToUpdate,
        include: {
          patient: true,
          doctor: true,
          room: true,
          treatment: true
        }
      });

      return appointment;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Error al actualizar la cita');
    }
  }

  async remove(id: string) {
    try {
      const appointment = await this.findOne(id);

      // Verificar que no sea una cita pasada completada
      if (appointment.status === 'COMPLETADA') {
        throw new BadRequestException('No se pueden eliminar citas completadas');
      }

      await this.prisma.appointment.delete({
        where: { id }
      });

      return {
        message: 'Cita eliminada correctamente',
        appointment
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Error al eliminar la cita');
    }
  }

  async checkAvailability(checkDto: CheckAvailabilityDto): Promise<boolean> {
    const where: Prisma.AppointmentWhereInput = {
      date: new Date(checkDto.date),
      AND: [
        {
          OR: [
            // Conflicto de sala
            {
              roomId: checkDto.roomId,
              OR: [
                {
                  startTime: { lte: new Date(checkDto.startTime) },
                  endTime: { gt: new Date(checkDto.startTime) }
                },
                {
                  startTime: { lt: new Date(checkDto.endTime) },
                  endTime: { gte: new Date(checkDto.endTime) }
                },
                {
                  startTime: { gte: new Date(checkDto.startTime) },
                  endTime: { lte: new Date(checkDto.endTime) }
                }
              ]
            },
            // Conflicto de doctor
            {
              doctorId: checkDto.doctorId,
              OR: [
                {
                  startTime: { lte: new Date(checkDto.startTime) },
                  endTime: { gt: new Date(checkDto.startTime) }
                },
                {
                  startTime: { lt: new Date(checkDto.endTime) },
                  endTime: { gte: new Date(checkDto.endTime) }
                },
                {
                  startTime: { gte: new Date(checkDto.startTime) },
                  endTime: { lte: new Date(checkDto.endTime) }
                }
              ]
            }
          ]
        }
      ],
      status: { notIn: ['CANCELADA'] }
    };

    // Excluir cita actual si se está editando
    if (checkDto.excludeAppointmentId) {
      where.id = { not: checkDto.excludeAppointmentId };
    }

    const conflictingAppointments = await this.prisma.appointment.count({ where });

    return conflictingAppointments === 0;
  }

  async confirmAppointment(id: string) {
    return this.update(id, {
      status: 'CONFIRMADA' as any,
      confirmed: true,
      confirmationDate: new Date().toISOString()
    });
  }

  async cancelAppointment(id: string, reason?: string) {
    return this.update(id, {
      status: 'CANCELADA' as any,
      observations: reason
    });
  }

  async markAsNoShow(id: string) {
    return this.update(id, {
      status: 'NO_SHOW' as any
    });
  }

  async getTodayAppointments() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.findAll({
      startDate: today.toISOString(),
      endDate: tomorrow.toISOString()
    });
  }

  async getAppointmentsByPatient(patientId: string) {
    return this.findAll({ patientId });
  }

  async getAvailableSlots(date: string, doctorId: string, treatmentId: string) {
    // Obtener configuración de horario de la clínica
    const workingHours = {
      start: 9, // 9:00 AM
      end: 20,  // 8:00 PM
      slotDuration: 30 // minutos
    };

    // Obtener duración del tratamiento
    const treatment = await this.prisma.treatment.findUnique({
      where: { id: treatmentId }
    });

    if (!treatment) {
      throw new NotFoundException('Tratamiento no encontrado');
    }

    const treatmentDuration = treatment.duration || 60; // minutos

    // Obtener citas existentes del día
    const existingAppointments = await this.prisma.appointment.findMany({
      where: {
        date: new Date(date),
        doctorId,
        status: { notIn: ['CANCELADA'] }
      },
      orderBy: { startTime: 'asc' }
    });

    // Generar slots disponibles
    const availableSlots = [];
    const dateObj = new Date(date);
    
    for (let hour = workingHours.start; hour < workingHours.end; hour++) {
      for (let minute = 0; minute < 60; minute += workingHours.slotDuration) {
        const slotStart = new Date(dateObj);
        slotStart.setHours(hour, minute, 0, 0);
        
        const slotEnd = new Date(slotStart);
        slotEnd.setMinutes(slotEnd.getMinutes() + treatmentDuration);

        // Verificar si el slot está disponible
        const isAvailable = !existingAppointments.some(apt => {
          const aptStart = new Date(apt.startTime);
          const aptEnd = new Date(apt.endTime);
          
          return (slotStart < aptEnd && slotEnd > aptStart);
        });

        if (isAvailable && slotEnd.getHours() <= workingHours.end) {
          availableSlots.push({
            start: slotStart.toISOString(),
            end: slotEnd.toISOString(),
            display: `${format(slotStart, 'HH:mm')} - ${format(slotEnd, 'HH:mm')}`
          });
        }
      }
    }

    return availableSlots;
  }

  private getColorByStatus(status: string): string {
    const colors = {
      PROGRAMADA: '#2196F3',    // Azul
      CONFIRMADA: '#4CAF50',    // Verde
      EN_CURSO: '#FF9800',      // Naranja
      COMPLETADA: '#9E9E9E',    // Gris
      CANCELADA: '#F44336',     // Rojo
      NO_SHOW: '#795548'        // Marrón
    };
    return colors[status] || '#2196F3';
  }
}