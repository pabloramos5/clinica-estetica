import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Exportamos las interfaces
export interface Treatment {
  id: string;
  name: string;
  description?: string;
  type: string;
  price: number;
  iva: number;
  duration: number;
  active: boolean;
  code?: string;
  requiresConsent?: boolean;
  contraindications?: string;
  preparation?: string;
  aftercare?: string;
  totalPrice?: number;
  appointmentsCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTreatmentDto {
  name: string;
  description?: string;
  type?: string;
  price: number;
  iva: number;
  duration: number;
  active?: boolean;
  code?: string;
  requiresConsent?: boolean;
  contraindications?: string;
  preparation?: string;
  aftercare?: string;
}

export interface TreatmentType {
  value: string;
  label: string;
}

export interface TreatmentStatistics {
  total: number;
  active: number;
  inactive: number;
  byType: Array<{ type: string; _count: number }>;
  mostUsed: Array<{ id: string; name: string; appointmentsCount: number }>;
}

class TreatmentService {
  private getHeaders() {
    const token = localStorage.getItem('token');
    return {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
  }

  async getAllTreatments(params?: {
    page?: number;
    limit?: number;
    search?: string;
    type?: string;
    active?: boolean;
    orderBy?: string;
    order?: 'asc' | 'desc';
  }) {
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.type) queryParams.append('type', params.type);
    if (params?.active !== undefined) queryParams.append('active', params.active.toString());
    if (params?.orderBy) queryParams.append('orderBy', params.orderBy);
    if (params?.order) queryParams.append('order', params.order);

    const response = await axios.get(
      `${API_URL}/api/treatments?${queryParams.toString()}`,
      this.getHeaders()
    );
    return response.data;
  }

  async getTreatment(id: string): Promise<Treatment> {
    const response = await axios.get(
      `${API_URL}/api/treatments/${id}`,
      this.getHeaders()
    );
    return response.data;
  }

  async createTreatment(treatment: CreateTreatmentDto): Promise<Treatment> {
    const response = await axios.post(
      `${API_URL}/api/treatments`,
      treatment,
      this.getHeaders()
    );
    return response.data;
  }

  async updateTreatment(id: string, treatment: Partial<CreateTreatmentDto>): Promise<Treatment> {
    const response = await axios.patch(
      `${API_URL}/api/treatments/${id}`,
      treatment,
      this.getHeaders()
    );
    return response.data;
  }

  async deleteTreatment(id: string): Promise<void> {
    await axios.delete(
      `${API_URL}/api/treatments/${id}`,
      this.getHeaders()
    );
  }

  async toggleTreatmentActive(id: string): Promise<Treatment> {
    const response = await axios.patch(
      `${API_URL}/api/treatments/${id}/toggle-active`,
      {},
      this.getHeaders()
    );
    return response.data;
  }

  async getTreatmentTypes(): Promise<TreatmentType[]> {
    const response = await axios.get(
      `${API_URL}/api/treatments/types`,
      this.getHeaders()
    );
    return response.data;
  }

  async getTreatmentStatistics(): Promise<TreatmentStatistics> {
    const response = await axios.get(
      `${API_URL}/api/treatments/statistics`,
      this.getHeaders()
    );
    return response.data;
  }
}

// Exportamos la instancia del servicio como default
const treatmentService = new TreatmentService();
export default treatmentService;