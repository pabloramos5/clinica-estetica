import { TreatmentType } from './create-treatment.dto';

export class TreatmentResponseDto {
  id: string;
  name: string;
  description?: string;
  type: TreatmentType;
  price: number;
  iva: number;
  totalPrice: number;
  duration: number;
  active: boolean;
  code?: string;
  requiresConsent: boolean;
  contraindications?: string;
  preparation?: string;
  aftercare?: string;
  appointmentsCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export class TreatmentWithAppointmentsDto extends TreatmentResponseDto {
  appointments?: {
    id: string;
    date: Date;
    patient: {
      firstName: string;
      lastName: string;
    };
    staff: {
      username: string;
      email: string;
    };
  }[];
}