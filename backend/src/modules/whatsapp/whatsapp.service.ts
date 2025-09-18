import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { format, addDays } from 'date-fns';

@Injectable()
export class WhatsAppService {
  constructor(private prisma: PrismaService) {}

  // Se ejecuta todos los días a las 19:00
  @Cron('0 19 * * *')
  async sendDailyReminders() {
    console.log('⏰ Enviando recordatorios de WhatsApp - ', new Date());
    
    try {
      // Obtener citas de mañana
      const tomorrow = addDays(new Date(), 1);
      const appointments = await this.prisma.appointment.findMany({
        where: {
          date: {
            gte: new Date(tomorrow.setHours(0, 0, 0, 0)),
            lt: new Date(tomorrow.setHours(23, 59, 59, 999))
          },
          status: {
            in: ['PROGRAMADA', 'CONFIRMADA']
          }
        },
        include: {
          patient: true,
          treatment: true,
          doctor: true,
          room: true
        }
      });

      for (const appointment of appointments) {
        if (appointment.patient.mobile && appointment.patient.wantsSMS) {
          await this.sendWhatsAppMessage(
            appointment.patient.mobile,
            this.buildReminderMessage(appointment)
          );
        }
      }

      console.log(`✅ ${appointments.length} recordatorios enviados`);
    } catch (error) {
      console.error('Error enviando recordatorios:', error);
    }
  }

  private buildReminderMessage(appointment: any): string {
    const time = format(appointment.startTime, 'HH:mm');
    return `Hola ${appointment.patient.firstName}, te recordamos tu cita mañana a las ${time} para ${appointment.treatment.name} con ${appointment.doctor.firstName} ${appointment.doctor.lastName}. Clínica Estética.`;
  }

  private async sendWhatsAppMessage(phone: string, message: string) {
    // Aquí implementarás la integración con WhatsApp Business API
    // Por ahora solo simulamos
    console.log(`📱 WhatsApp a ${phone}: ${message}`);
    
    // TODO: Integrar con WhatsApp Business API o Twilio
    // const response = await twilioClient.messages.create({
    //   body: message,
    //   from: 'whatsapp:+14155238886',
    //   to: `whatsapp:${phone}`
    // });
  }
}