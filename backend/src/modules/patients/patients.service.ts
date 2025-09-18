import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePatientDto, UpdatePatientDto } from './dto/patient.dto';

@Injectable()
export class PatientsService {
  constructor(private prisma: PrismaService) {}

  async create(createPatientDto: CreatePatientDto) {
    // Verificar si el paciente ya existe
    const existing = await this.prisma.patient.findUnique({
      where: { documentNumber: createPatientDto.documentNumber },
    });

    if (existing) {
      throw new ConflictException('Ya existe un paciente con ese número de documento');
    }

    return this.prisma.patient.create({
      data: {
        ...createPatientDto,
        birthDate: createPatientDto.birthDate ? new Date(createPatientDto.birthDate) : null,
        consentDate: createPatientDto.dataConsent ? new Date() : null,
        country: createPatientDto.country || 'España',
      },
    });
  }

  async findAll(params: { skip?: number; take?: number; search?: string }) {
    const { skip = 0, take = 10, search } = params;

    const where = search ? {
      OR: [
        { firstName: { contains: search, mode: 'insensitive' as any } },
        { lastName: { contains: search, mode: 'insensitive' as any } },
        { documentNumber: { contains: search, mode: 'insensitive' as any } },
        { phone: { contains: search } },
        { email: { contains: search, mode: 'insensitive' as any } },
      ],
    } : {};

    const [patients, total] = await Promise.all([
      this.prisma.patient.findMany({
        skip,
        take,
        where,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.patient.count({ where }),
    ]);

    return {
      data: patients,
      total,
      skip,
      take,
    };
  }

  async findOne(id: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id },
      include: {
        appointments: {
          take: 5,
          orderBy: { date: 'desc' },
          include: {
            treatment: true,
            doctor: true,
            room: true,
          },
        },
        medicalHistories: {
          take: 1,
          orderBy: { date: 'desc' },
        },
      },
    });

    if (!patient) {
      throw new NotFoundException('Paciente no encontrado');
    }

    return patient;
  }

  async findByDocument(documentNumber: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { documentNumber },
    });

    if (!patient) {
      throw new NotFoundException('Paciente no encontrado');
    }

    return patient;
  }

  async update(id: string, updatePatientDto: UpdatePatientDto) {
    const patient = await this.prisma.patient.findUnique({
      where: { id },
    });

    if (!patient) {
      throw new NotFoundException('Paciente no encontrado');
    }

    // Si se cambia el documento, verificar que no exista
    if (updatePatientDto.documentNumber && updatePatientDto.documentNumber !== patient.documentNumber) {
      const existing = await this.prisma.patient.findUnique({
        where: { documentNumber: updatePatientDto.documentNumber },
      });

      if (existing) {
        throw new ConflictException('Ya existe un paciente con ese número de documento');
      }
    }

    return this.prisma.patient.update({
      where: { id },
      data: {
        ...updatePatientDto,
        birthDate: updatePatientDto.birthDate ? new Date(updatePatientDto.birthDate) : undefined,
      },
    });
  }

  async remove(id: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id },
    });

    if (!patient) {
      throw new NotFoundException('Paciente no encontrado');
    }

    // Verificar si tiene citas futuras
    const futureAppointments = await this.prisma.appointment.count({
      where: {
        patientId: id,
        date: { gte: new Date() },
      },
    });

    if (futureAppointments > 0) {
      throw new ConflictException('No se puede eliminar un paciente con citas futuras');
    }

    return this.prisma.patient.delete({
      where: { id },
    });
  }

  async search(query: string) {
    if (!query || query.length < 2) {
      return [];
    }

    return this.prisma.patient.findMany({
      where: {
        OR: [
          { firstName: { contains: query, mode: 'insensitive' as any } },
          { lastName: { contains: query, mode: 'insensitive' as any } },
          { documentNumber: { contains: query, mode: 'insensitive' as any } },
          { phone: { contains: query } },
        ],
      },
      take: 10,
    });
  }

  async getPatientAppointments(patientId: string) {
    return this.prisma.appointment.findMany({
      where: { patientId },
      include: {
        treatment: true,
        doctor: true,
        room: true,
      },
      orderBy: { date: 'desc' },
    });
  }

  async getPatientMedicalHistory(patientId: string) {
    return this.prisma.medicalHistory.findMany({
      where: { patientId },
      include: {
        doctor: true,
      },
      orderBy: { date: 'desc' },
    });
  }
}