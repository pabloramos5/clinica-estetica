import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePatientDto, UpdatePatientDto, SearchPatientsDto } from './dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class PatientsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createPatientDto: CreatePatientDto) {
    try {
      // Verificar si ya existe un paciente con el mismo documento
      const existingDocument = await this.prisma.patient.findUnique({
        where: { documentNumber: createPatientDto.documentNumber }
      });

      if (existingDocument) {
        throw new BadRequestException('Ya existe un paciente con este documento');
      }

      // Verificar si ya existe un paciente con el mismo email
      if (createPatientDto.email) {
        const existingEmail = await this.prisma.patient.findFirst({
          where: { email: createPatientDto.email }
        });

        if (existingEmail) {
          throw new BadRequestException('Ya existe un paciente con este email');
        }
      }

      // Generar código de paciente único
      const patientCode = await this.generatePatientCode();

      const patient = await this.prisma.patient.create({
        data: {
          ...createPatientDto,
          patientCode,
          birthDate: createPatientDto.birthDate ? new Date(createPatientDto.birthDate) : null,
          documentType: createPatientDto.documentType || 'DNI',
          country: createPatientDto.country || 'España',
          wantsSMS: createPatientDto.wantsSMS ?? false,
          wantsEmail: createPatientDto.wantsEmail ?? true,
          acceptsMarketing: createPatientDto.acceptsMarketing ?? true,
          acceptsWhatsapp: createPatientDto.acceptsWhatsapp ?? true,
        },
        include: {
          appointments: {
            take: 5,
            orderBy: { date: 'desc' }
          },
          medicalHistories: {
            take: 1,
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      // Crear historia médica inicial si no existe
      if (patient.medicalHistories.length === 0 && 
          (createPatientDto.allergies || createPatientDto.medications)) {
        await this.prisma.medicalHistory.create({
          data: {
            patientId: patient.id,
            doctorId: 'system', // Necesitarás un doctor por defecto o obtenerlo del contexto
            allergies: createPatientDto.allergies || '',
            medications: createPatientDto.medications || '',
            otherObservations: createPatientDto.observations || ''
          }
        });
      }

      return patient;
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      console.error('Error creating patient:', error);
      throw new BadRequestException('Error al crear el paciente');
    }
  }

  async findAll(searchParams: SearchPatientsDto) {
  const { search, phone, initials, page = '1', limit = '10' } = searchParams;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  const where: Prisma.PatientWhereInput = {};

  // Búsqueda universal mejorada
  if (search) {
    const searchTerm = search.trim();
    
    // Si parece un teléfono (solo números)
    if (/^\d+$/.test(searchTerm)) {
      where.OR = [
        { phone: { contains: searchTerm } },
        { alternativePhone: { contains: searchTerm } },
        { mobile: { contains: searchTerm } },
        { documentNumber: { contains: searchTerm } }
      ];
    }
    // Si son 2 letras mayúsculas (iniciales)
    else if (/^[A-Z]{2}$/i.test(searchTerm)) {
      const [firstInitial, lastInitial] = searchTerm.toUpperCase().split('');
      where.AND = [
        { firstName: { startsWith: firstInitial, mode: 'insensitive' } },
        { lastName: { startsWith: lastInitial, mode: 'insensitive' } }
      ];
    }
    // Búsqueda general en todos los campos
    else {
      where.OR = [
        { firstName: { contains: searchTerm, mode: 'insensitive' } },
        { lastName: { contains: searchTerm, mode: 'insensitive' } },
        { documentNumber: { contains: searchTerm, mode: 'insensitive' } },
        { email: { contains: searchTerm, mode: 'insensitive' } },
        { patientCode: { contains: searchTerm, mode: 'insensitive' } },
        { phone: { contains: searchTerm } },
        { alternativePhone: { contains: searchTerm } },
        { mobile: { contains: searchTerm } },
        // Búsqueda por nombre completo
        {
          AND: searchTerm.split(' ').filter(t => t.length > 0).map(term => ({
            OR: [
              { firstName: { contains: term, mode: 'insensitive' as const } },
              { lastName: { contains: term, mode: 'insensitive' as const } }
            ]
          }))
        }
      ];
    }
  }

  // Mantener búsquedas específicas si se proporcionan
  if (phone && !search) {
    where.OR = [
      { phone: { contains: phone } },
      { alternativePhone: { contains: phone } },
      { mobile: { contains: phone } }
    ];
  }

  if (initials && !search) {
    const [firstInitial, lastInitial] = initials.toUpperCase().split('');
    if (firstInitial && lastInitial) {
      where.AND = [
        { firstName: { startsWith: firstInitial, mode: 'insensitive' } },
        { lastName: { startsWith: lastInitial, mode: 'insensitive' } }
      ];
    }
  }

  // Solo buscar pacientes activos
  where.isActive = true;

  const [patients, total] = await Promise.all([
    this.prisma.patient.findMany({
      where,
      skip,
      take,
      orderBy: [
        { lastName: 'asc' },
        { firstName: 'asc' }
      ],
      include: {
        appointments: {
          take: 1,
          orderBy: { date: 'desc' }
        },
        _count: {
          select: {
            appointments: true,
            invoices: true
          }
        }
      }
    }),
    this.prisma.patient.count({ where })
  ]);

  return {
    data: patients,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / take)
    }
  };
}

  async findOne(id: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id },
      include: {
        appointments: {
          orderBy: { date: 'desc' },
          include: {
            treatment: true,
            room: true,
            doctor: true
          }
        },
        medicalHistories: {
          orderBy: { createdAt: 'desc' }
        },
        invoices: {
          orderBy: { issueDate: 'desc' },
          include: {
            invoiceLines: true
          }
        },
        treatments: {
          orderBy: { date: 'desc' },
          include: {
            treatment: true
          }
        }
      }
    });

    if (!patient) {
      throw new NotFoundException('Paciente no encontrado');
    }

    return patient;
  }

  async update(id: string, updatePatientDto: UpdatePatientDto) {
    try {
      // Verificar que el paciente existe
      await this.findOne(id);

      // Si se está actualizando el documento, verificar que no esté en uso
      if (updatePatientDto.documentNumber) {
        const existingDocument = await this.prisma.patient.findFirst({
          where: {
            documentNumber: updatePatientDto.documentNumber,
            id: { not: id }
          }
        });

        if (existingDocument) {
          throw new BadRequestException('Ya existe otro paciente con este documento');
        }
      }

      // Si se está actualizando el email, verificar que no esté en uso
      if (updatePatientDto.email) {
        const existingEmail = await this.prisma.patient.findFirst({
          where: {
            email: updatePatientDto.email,
            id: { not: id }
          }
        });

        if (existingEmail) {
          throw new BadRequestException('Ya existe otro paciente con este email');
        }
      }

      const dataToUpdate: any = { ...updatePatientDto };
      if (updatePatientDto.birthDate) {
        dataToUpdate.birthDate = new Date(updatePatientDto.birthDate);
      }

      const patient = await this.prisma.patient.update({
        where: { id },
        data: dataToUpdate,
        include: {
          appointments: {
            take: 5,
            orderBy: { date: 'desc' }
          },
          medicalHistories: {
            take: 1,
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      return patient;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error updating patient:', error);
      throw new BadRequestException('Error al actualizar el paciente');
    }
  }

  async remove(id: string) {
    try {
      // Verificar que el paciente existe
      const patient = await this.findOne(id);

      // Verificar si tiene citas futuras
      const futureAppointments = await this.prisma.appointment.count({
        where: {
          patientId: id,
          date: { gte: new Date() }
        }
      });

      if (futureAppointments > 0) {
        throw new BadRequestException(
          `No se puede eliminar el paciente porque tiene ${futureAppointments} cita(s) futura(s)`
        );
      }

      // Verificar si tiene facturas pendientes
      const pendingInvoices = await this.prisma.invoice.count({
        where: {
          patientId: id,
          status: { in: ['BORRADOR', 'EMITIDA'] }
        }
      });

      if (pendingInvoices > 0) {
        throw new BadRequestException(
          `No se puede eliminar el paciente porque tiene ${pendingInvoices} factura(s) pendiente(s)`
        );
      }

      // Soft delete - marcar como inactivo
      await this.prisma.patient.update({
        where: { id },
        data: {
          isActive: false,
          deletedAt: new Date()
        }
      });

      return {
        message: 'Paciente eliminado correctamente',
        patient: patient
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Error al eliminar el paciente');
    }
  }

  async searchByPhone(phone: string) {
    const cleanPhone = phone.replace(/\D/g, '');
    
    const patients = await this.prisma.patient.findMany({
      where: {
        OR: [
          { phone: { contains: cleanPhone } },
          { alternativePhone: { contains: cleanPhone } },
          { mobile: { contains: cleanPhone } }
        ],
        isActive: true
      },
      take: 10
    });

    return patients;
  }

  async searchByInitials(initials: string) {
    const [firstName, lastName] = initials.toUpperCase().split('');
    
    if (!firstName || !lastName) {
      throw new BadRequestException('Las iniciales deben tener al menos 2 caracteres');
    }

    const patients = await this.prisma.patient.findMany({
      where: {
        firstName: { startsWith: firstName, mode: 'insensitive' },
        lastName: { startsWith: lastName, mode: 'insensitive' },
        isActive: true
      },
      take: 10
    });

    return patients;
  }

  async getMedicalHistory(patientId: string) {
    const history = await this.prisma.medicalHistory.findFirst({
      where: { patientId },
      orderBy: { createdAt: 'desc' }
    });

    if (!history) {
      // Necesitas un doctorId válido para crear la historia
      // Por ahora retornamos null
      return null;
    }

    return history;
  }

  async updateMedicalHistory(patientId: string, data: any) {
    const history = await this.getMedicalHistory(patientId);
    
    if (!history) {
      // Crear nueva historia médica
      return await this.prisma.medicalHistory.create({
        data: {
          patientId,
          doctorId: data.doctorId || 'system', // Necesitas proporcionar un doctorId válido
          ...data
        }
      });
    }
    
    return await this.prisma.medicalHistory.update({
      where: { id: history.id },
      data
    });
  }

  private async generatePatientCode(): Promise<string> {
    const year = new Date().getFullYear().toString().slice(-2);
    const lastPatient = await this.prisma.patient.findFirst({
      where: {
        patientCode: { startsWith: `PAC${year}` }
      },
      orderBy: { patientCode: 'desc' }
    });

    if (lastPatient && lastPatient.patientCode) {
      const lastNumber = parseInt(lastPatient.patientCode.slice(-4));
      const newNumber = (lastNumber + 1).toString().padStart(4, '0');
      return `PAC${year}${newNumber}`;
    }

    return `PAC${year}0001`;
  }
}