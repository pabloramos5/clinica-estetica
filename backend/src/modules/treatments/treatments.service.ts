import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTreatmentDto, TreatmentType } from './dto/create-treatment.dto';
import { UpdateTreatmentDto } from './dto/update-treatment.dto';
import { TreatmentQueryDto, PaginatedResponseDto } from './dto/treatment-query.dto';
import { TreatmentResponseDto, TreatmentWithAppointmentsDto } from './dto/treatment-response.dto';
import { TreatmentStatisticsDto, TreatmentTypeDto } from './dto/treatment-statistics.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class TreatmentsService {
  constructor(private prisma: PrismaService) {}

  async create(createTreatmentDto: CreateTreatmentDto): Promise<TreatmentResponseDto> {
    // Validaciones adicionales
    if (createTreatmentDto.price < 0) {
      throw new BadRequestException('El precio no puede ser negativo');
    }

    // Verificar si ya existe un tratamiento con el mismo código
    if (createTreatmentDto.code) {
      const existingTreatment = await this.prisma.treatment.findFirst({
        where: { 
          tratCod: parseInt(createTreatmentDto.code) || 0
        }
      });
      
      if (existingTreatment) {
        throw new ConflictException('Ya existe un tratamiento con ese código');
      }
    }

    // Mapear los datos al esquema de Prisma
    const treatmentData = {
      name: createTreatmentDto.name,
      observations: createTreatmentDto.description || '',
      tratCod: createTreatmentDto.code ? parseInt(createTreatmentDto.code) : await this.generateTreatmentCode(),
      price: new Prisma.Decimal(createTreatmentDto.price),
      vatPercentage: new Prisma.Decimal(createTreatmentDto.iva),
      duration: createTreatmentDto.duration,
      active: createTreatmentDto.active !== undefined ? createTreatmentDto.active : true,
      defaultDoctor: '', // Campo requerido en el esquema
    };

    const treatment = await this.prisma.treatment.create({
      data: treatmentData
    });

    return this.mapToResponseDto(treatment);
  }

  async findAll(query: TreatmentQueryDto): Promise<PaginatedResponseDto<TreatmentResponseDto>> {
    const { page = 1, limit = 10, search, type, active, orderBy = 'name', order = 'asc' } = query;
    const skip = (page - 1) * limit;

    let treatments;
    let total;

    const baseWhere: Prisma.TreatmentWhereInput = {};

    // Filtro de búsqueda
    if (search) {
      baseWhere.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { observations: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Filtro por estado activo - solo si se especifica explícitamente
    if (active !== undefined) {
      baseWhere.active = active;
    }

    console.log('Query params:', { page, limit, skip, type, search, active }); // DEBUG

    // Si hay filtro por tipo, primero obtenemos todos los tratamientos y luego filtramos
    if (type) {
      const allTreatments = await this.prisma.treatment.findMany({
        where: baseWhere,
        orderBy: { [orderBy]: order },
        include: {
          _count: {
            select: { appointments: true }
          }
        }
      });

      // Filtrar por tipo usando la función inferTypeFromName
      const filteredByType = allTreatments.filter(treatment => 
        this.inferTypeFromName(treatment.name) === type
      );

      total = filteredByType.length;
      treatments = filteredByType.slice(skip, skip + limit);
      
      console.log(`Filtered by type '${type}': ${filteredByType.length} treatments`);
    } else {
      // Sin filtro de tipo, búsqueda normal
      [treatments, total] = await Promise.all([
        this.prisma.treatment.findMany({
          where: baseWhere,
          skip,
          take: limit,
          orderBy: { [orderBy]: order },
          include: {
            _count: {
              select: { appointments: true }
            }
          }
        }),
        this.prisma.treatment.count({ where: baseWhere })
      ]);
    }

    console.log(`Found ${treatments.length} treatments, total: ${total}`); // DEBUG

    const data = treatments.map(treatment => this.mapToResponseDto(treatment));
    const totalPages = Math.ceil(total / limit);

    return {
      data: data || [],
      total: total || 0,
      page,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1
    };
  }

  async findOne(id: string): Promise<TreatmentWithAppointmentsDto> {
    const treatment = await this.prisma.treatment.findUnique({
      where: { id },
      include: {
        appointments: {
          take: 5,
          orderBy: { date: 'desc' },
          include: {
            patient: {
              select: { firstName: true, lastName: true }
            },
            doctor: {
              select: { username: true, email: true }
            }
          }
        },
        _count: {
          select: { appointments: true }
        }
      }
    });

    if (!treatment) {
      throw new NotFoundException(`Tratamiento con ID ${id} no encontrado`);
    }

    const appointmentsFormatted = treatment.appointments?.map(apt => ({
      id: apt.id,
      date: apt.date,
      patient: apt.patient,
      staff: apt.doctor // Mapeamos doctor a staff para mantener consistencia
    })) || [];

    return {
      ...this.mapToResponseDto(treatment),
      appointments: appointmentsFormatted,
      appointmentsCount: treatment._count.appointments
    } as TreatmentWithAppointmentsDto;
  }

  async update(id: string, updateTreatmentDto: UpdateTreatmentDto): Promise<TreatmentResponseDto> {
    // Verificar que el tratamiento existe
    await this.findOne(id);

    // Si se actualiza el código, verificar que no exista otro con el mismo
    if (updateTreatmentDto.code) {
      const existingTreatment = await this.prisma.treatment.findFirst({
        where: { 
          tratCod: parseInt(updateTreatmentDto.code) || 0,
          NOT: { id }
        }
      });
      
      if (existingTreatment) {
        throw new ConflictException('Ya existe otro tratamiento con ese código');
      }
    }

    // Mapear los datos para la actualización
    const updateData: any = {};
    
    if (updateTreatmentDto.name !== undefined) updateData.name = updateTreatmentDto.name;
    if (updateTreatmentDto.description !== undefined) updateData.observations = updateTreatmentDto.description;
    if (updateTreatmentDto.code !== undefined) updateData.tratCod = parseInt(updateTreatmentDto.code) || 0;
    if (updateTreatmentDto.price !== undefined) updateData.price = new Prisma.Decimal(updateTreatmentDto.price);
    if (updateTreatmentDto.iva !== undefined) updateData.vatPercentage = new Prisma.Decimal(updateTreatmentDto.iva);
    if (updateTreatmentDto.duration !== undefined) updateData.duration = updateTreatmentDto.duration;
    if (updateTreatmentDto.active !== undefined) updateData.active = updateTreatmentDto.active;

    const updatedTreatment = await this.prisma.treatment.update({
      where: { id },
      data: updateData
    });

    return this.mapToResponseDto(updatedTreatment);
  }

  async remove(id: string): Promise<void> {
    // Verificar que el tratamiento existe
    const treatment = await this.findOne(id);

    // Verificar si tiene citas asociadas
    const appointmentsCount = await this.prisma.appointment.count({
      where: { treatmentId: id }
    });

    if (appointmentsCount > 0) {
      // En lugar de bloquear, primero desasociamos las citas
      await this.prisma.appointment.updateMany({
        where: { treatmentId: id },
        data: { treatmentId: null }
      });
    }

    // Ahora podemos eliminar el tratamiento
    await this.prisma.treatment.delete({
      where: { id }
    });
  }

  async toggleActive(id: string): Promise<TreatmentResponseDto> {
    const treatment = await this.findOne(id);
    
    const updated = await this.prisma.treatment.update({
      where: { id },
      data: { active: !treatment.active }
    });

    return this.mapToResponseDto(updated);
  }

  async getStatistics(): Promise<TreatmentStatisticsDto> {
    const [
      totalTreatments, 
      activeTreatments,
      mostUsedTreatments,
      priceStats
    ] = await Promise.all([
      this.prisma.treatment.count(),
      this.prisma.treatment.count({ where: { active: true } }),
      this.prisma.treatment.findMany({
        take: 5,
        orderBy: {
          appointments: { _count: 'desc' }
        },
        include: {
          _count: {
            select: { appointments: true }
          }
        }
      }),
      this.prisma.treatment.aggregate({
        _avg: {
          price: true,
          duration: true
        }
      })
    ]);

    // Como no tenemos tipos en el esquema, creamos categorías ficticias basadas en el nombre
    const byType = this.getCategoriesFromTreatments();

    const mostUsed = mostUsedTreatments.map(t => ({
      id: t.id,
      name: t.name,
      type: this.inferTypeFromName(t.name),
      appointmentsCount: t._count.appointments
    }));

    return {
      total: totalTreatments,
      active: activeTreatments,
      inactive: totalTreatments - activeTreatments,
      byType,
      mostUsed,
      averagePrice: Number(priceStats._avg.price) || 0,
      averageDuration: priceStats._avg.duration || 0
    };
  }

  async getTypes(): Promise<TreatmentTypeDto[]> {
    return [
      { value: 'BOTOX', label: 'Botox' },
      { value: 'LASER', label: 'Láser' },
      { value: 'PEELING', label: 'Peeling' },
      { value: 'FILLERS', label: 'Rellenos' },
      { value: 'MESOTHERAPY', label: 'Mesoterapia' },
      { value: 'RADIOFREQUENCY', label: 'Radiofrecuencia' },
      { value: 'ULTRASOUND', label: 'Ultrasonido' },
      { value: 'CRYOLIPOLYSIS', label: 'Criolipólisis' },
      { value: 'OTHER', label: 'Otros' }
    ];
  }

  private calculateTotalPrice(price: number | Prisma.Decimal, iva: number | Prisma.Decimal): number {
    const priceNum = typeof price === 'number' ? price : price.toNumber();
    const ivaNum = typeof iva === 'number' ? iva : iva.toNumber();
    return priceNum + (priceNum * ivaNum / 100);
  }

  private async generateTreatmentCode(): Promise<number> {
    const lastTreatment = await this.prisma.treatment.findFirst({
      orderBy: { tratCod: 'desc' }
    });
    
    return lastTreatment ? lastTreatment.tratCod + 1 : 1000;
  }

  private mapToResponseDto(treatment: any): TreatmentResponseDto {
    return {
      id: treatment.id,
      name: treatment.name,
      description: treatment.observations || '',
      type: this.inferTypeFromName(treatment.name),
      price: treatment.price.toNumber(),
      iva: treatment.vatPercentage.toNumber(),
      totalPrice: this.calculateTotalPrice(treatment.price, treatment.vatPercentage),
      duration: treatment.duration,
      active: treatment.active,
      code: treatment.tratCod.toString(),
      requiresConsent: false,
      contraindications: '',
      preparation: '',
      aftercare: '',
      appointmentsCount: treatment._count?.appointments || 0,
      createdAt: treatment.createdAt,
      updatedAt: treatment.updatedAt
    };
  }

  private inferTypeFromName(name: string): TreatmentType {
    const nameLower = name.toLowerCase();
    if (nameLower.includes('botox')) return TreatmentType.BOTOX;
    if (nameLower.includes('laser') || nameLower.includes('láser')) return TreatmentType.LASER;
    if (nameLower.includes('peeling')) return TreatmentType.PEELING;
    if (nameLower.includes('relleno') || nameLower.includes('filler')) return TreatmentType.FILLERS;
    if (nameLower.includes('mesoterapia')) return TreatmentType.MESOTHERAPY;
    if (nameLower.includes('radiofrecuencia')) return TreatmentType.RADIOFREQUENCY;
    if (nameLower.includes('ultrasonido')) return TreatmentType.ULTRASOUND;
    if (nameLower.includes('criolipólisis')) return TreatmentType.CRYOLIPOLYSIS;
    return TreatmentType.OTHER;
  }

  private getCategoriesFromTreatments() {
    return [
      { type: 'BOTOX', count: 0, percentage: 0 },
      { type: 'LASER', count: 0, percentage: 0 },
      { type: 'PEELING', count: 0, percentage: 0 },
      { type: 'FILLERS', count: 0, percentage: 0 },
      { type: 'OTHER', count: 0, percentage: 0 }
    ];
  }
}