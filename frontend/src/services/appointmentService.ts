import api from './api';

export interface AppointmentFormData {
  patientId: string;
  doctorId: string;
  roomId: string;
  treatmentId: string;
  date: string;
  startTime: string;
  endTime: string;
  observations?: string;
}

export interface CheckAvailabilityData {
  date: string;
  startTime: string;
  endTime: string;
  roomId: string;
  doctorId: string;
  excludeAppointmentId?: string;
}

class AppointmentService {
  async getAll(params?: any) {
    const response = await api.get('/appointments', { params });
    return response.data;
  }

  async getOne(id: string) {
    const response = await api.get(`/appointments/${id}`);
    return response.data;
  }

  async create(data: AppointmentFormData) {
    const response = await api.post('/appointments', data);
    return response.data;
  }

  async update(id: string, data: Partial<AppointmentFormData>) {
    const response = await api.patch(`/appointments/${id}`, data);
    return response.data;
  }

  async delete(id: string) {
    const response = await api.delete(`/appointments/${id}`);
    return response.data;
  }

  async checkAvailability(data: CheckAvailabilityData) {
    const response = await api.post('/appointments/check-availability', data);
    return response.data;
  }

  async getAvailableSlots(date: string, doctorId: string, treatmentId: string) {
    const response = await api.get('/appointments/available-slots', {
      params: { date, doctorId, treatmentId }
    });
    return response.data;
  }

  async confirm(id: string) {
    const response = await api.patch(`/appointments/${id}/confirm`);
    return response.data;
  }

  async cancel(id: string, reason?: string) {
    const response = await api.patch(`/appointments/${id}/cancel`, { reason });
    return response.data;
  }

  async markNoShow(id: string) {
    const response = await api.patch(`/appointments/${id}/no-show`);
    return response.data;
  }
}

export const appointmentService = new AppointmentService();