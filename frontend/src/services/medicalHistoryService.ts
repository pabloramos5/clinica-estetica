import api from './api';

export interface TreatmentSummary {
  treatmentId: string;
  treatmentName: string;
  treatmentCode: number;
  totalSessions: number;
  completedSessions: number;
  cancelledSessions: number;
  lastSession: string;
  firstSession: string;
  appointments: Array<{
    id: string;
    date: string;
    status: string;
    doctorName: string;
    roomName: string;
  }>;
}

export interface PatientSummary {
  patientId: string;
  totalTreatmentTypes: number;
  totalSessions: number;
  treatments: TreatmentSummary[];
}

export interface AppointmentDetail {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  confirmed: boolean;
  observations: string | null;
  doctor: {
    id: string;
    name: string;
    specialty: string;
  };
  room: {
    id: string;
    name: string;
  };
  treatment: {
    id: string;
    name: string;
    duration: number;
  };
}

export const medicalHistoryService = {
  getPatientSummary: async (patientId: string): Promise<PatientSummary> => {
    const response = await api.get(`/medical-history/patient/${patientId}/summary`);
    return response.data;
  },

  getTreatmentDetails: async (patientId: string, treatmentId: string) => {
    const response = await api.get(
      `/medical-history/patient/${patientId}/treatment/${treatmentId}`
    );
    return response.data;
  },

  getPatientStats: async (patientId: string) => {
    const response = await api.get(`/medical-history/patient/${patientId}/stats`);
    return response.data;
  },

  getPatientTimeline: async (patientId: string, limit?: number) => {
    const response = await api.get(`/medical-history/patient/${patientId}/timeline`, {
      params: { limit },
    });
    return response.data;
  },
};