import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';


@Injectable()
export class MedicalHistoryService {
  constructor(private prisma: PrismaService) {}

  async getPatientTreatmentSummary(patientId: string) {
    const appointments = await this.prisma.appointment.findMany({
      where: { patientId },
      include: {
        treatment: true,
        doctor: {
          select: {
            id: true,
            username: true,
            specialty: true,
          },
        },
        room: true,
      },
      orderBy: { date: 'desc' },
    });

    const grouped = appointments.reduce((acc, appointment) => {
      const treatmentId = appointment.treatment.id;
      
      if (!acc[treatmentId]) {
        acc[treatmentId] = {
          treatmentId: appointment.treatment.id,
          treatmentName: appointment.treatment.name,
          treatmentCode: appointment.treatment.tratCod,
          totalSessions: 0,
          completedSessions: 0,
          cancelledSessions: 0,
          lastSession: null,
          firstSession: null,
          appointments: [],
        };
      }

      acc[treatmentId].totalSessions++;
      
      if (appointment.status === 'COMPLETADA') {
        acc[treatmentId].completedSessions++;
      } else if (appointment.status === 'CANCELADA') {
        acc[treatmentId].cancelledSessions++;
      }

      const appointmentDate = new Date(appointment.date);
      if (!acc[treatmentId].lastSession || appointmentDate > new Date(acc[treatmentId].lastSession)) {
        acc[treatmentId].lastSession = appointment.date;
      }
      if (!acc[treatmentId].firstSession || appointmentDate < new Date(acc[treatmentId].firstSession)) {
        acc[treatmentId].firstSession = appointment.date;
      }

      acc[treatmentId].appointments.push({
        id: appointment.id,
        date: appointment.date,
        status: appointment.status,
        doctorName: appointment.doctor.username,
        roomName: appointment.room.name,
      });

      return acc;
    }, {} as Record<string, any>);

    const summary = Object.values(grouped).sort((a: any, b: any) => {
      return new Date(b.lastSession).getTime() - new Date(a.lastSession).getTime();
    });

    return {
      patientId,
      totalTreatmentTypes: summary.length,
      totalSessions: appointments.length,
      treatments: summary,
    };
  }

  async getTreatmentAppointments(patientId: string, treatmentId: string) {
    const appointments = await this.prisma.appointment.findMany({
      where: {
        patientId,
        treatmentId,
      },
      include: {
        treatment: true,
        doctor: {
          select: {
            id: true,
            username: true,
            specialty: true,
          },
        },
        room: true,
      },
      orderBy: { date: 'desc' },
    });

    return {
      treatmentId,
      treatmentName: appointments[0]?.treatment.name || 'Desconocido',
      totalSessions: appointments.length,
      appointments: appointments.map(apt => ({
        id: apt.id,
        date: apt.date,
        startTime: apt.startTime,
        endTime: apt.endTime,
        status: apt.status,
        confirmed: apt.confirmed,
        observations: apt.observations,
        doctor: {
          id: apt.doctor.id,
          name: apt.doctor.username,
          specialty: apt.doctor.specialty,
        },
        room: {
          id: apt.room.id,
          name: apt.room.name,
        },
        treatment: {
          id: apt.treatment.id,
          name: apt.treatment.name,
          duration: apt.treatment.duration,
        },
      })),
    };
  }

  async getPatientTimeline(patientId: string, limit: number = 50) {
    const appointments = await this.prisma.appointment.findMany({
      where: { patientId },
      include: {
        treatment: true,
        doctor: {
          select: {
            username: true,
            specialty: true,
          },
        },
        room: true,
      },
      orderBy: { date: 'desc' },
      take: limit,
    });

    return appointments.map(apt => ({
      id: apt.id,
      date: apt.date,
      startTime: apt.startTime,
      status: apt.status,
      treatmentName: apt.treatment.name,
      doctorName: apt.doctor.username,
      roomName: apt.room.name,
      observations: apt.observations,
    }));
  }

  async getPatientStatistics(patientId: string) {
    const appointments = await this.prisma.appointment.findMany({
      where: { patientId },
      include: {
        treatment: true,
      },
    });

    const stats = {
      totalAppointments: appointments.length,
      completedAppointments: appointments.filter(a => a.status === 'COMPLETADA').length,
      cancelledAppointments: appointments.filter(a => a.status === 'CANCELADA').length,
      noShowAppointments: appointments.filter(a => a.status === 'NO_SHOW').length,
      upcomingAppointments: appointments.filter(a => 
        a.status === 'PROGRAMADA' && new Date(a.date) > new Date()
      ).length,
      firstAppointment: appointments.length > 0 
        ? appointments.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0].date
        : null,
      lastAppointment: appointments.length > 0
        ? appointments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date
        : null,
      mostFrequentTreatment: this.getMostFrequent(appointments.map(a => a.treatment.name)),
      treatmentTypes: [...new Set(appointments.map(a => a.treatment.name))].length,
    };

    return stats;
  }

  private getMostFrequent(arr: string[]): string | null {
    if (arr.length === 0) return null;
    
    const frequency = arr.reduce((acc, item) => {
      acc[item] = (acc[item] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.keys(frequency).reduce((a, b) => 
      frequency[a] > frequency[b] ? a : b
    );
  }
}