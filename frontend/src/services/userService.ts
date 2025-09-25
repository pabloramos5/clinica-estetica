import api from './api';

export interface CreateUserDto {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role: 'ADMIN' | 'MEDICO' | 'AUXILIAR' | 'RECEPCION';
  specialization?: string;
  licenseNumber?: string;
}

export interface UpdateUserDto {
  email?: string;
  password?: string;
  name?: string;
  phone?: string;
  role?: 'ADMIN' | 'MEDICO' | 'AUXILIAR' | 'RECEPCION';
  specialization?: string;
  licenseNumber?: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export interface User {
  id: string; // Cambiado a string
  email: string;
  name: string;
  phone?: string;
  role: 'ADMIN' | 'MEDICO' | 'AUXILIAR' | 'RECEPCION';
  specialization?: string;
  licenseNumber?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserStats {
  total: number;
  active: number;
  byRole: {
    ADMIN?: number;
    MEDICO?: number;
    AUXILIAR?: number;
    RECEPCION?: number;
  };
}

class UserService {
  async create(userData: CreateUserDto): Promise<User> {
    const response = await api.post('/users', userData);
    return response.data;
  }

  async getAll(includeInactive = false): Promise<User[]> {
    const response = await api.get('/users', {
      params: { includeInactive },
    });
    return response.data;
  }

  async getById(id: string): Promise<User> { // id es string
    const response = await api.get(`/users/${id}`);
    return response.data;
  }

  async getProfile(): Promise<User> {
    const response = await api.get('/users/profile');
    return response.data;
  }

  async update(id: string, userData: UpdateUserDto): Promise<User> { // id es string
    const response = await api.patch(`/users/${id}`, userData);
    return response.data;
  }

  async changePassword(userId: string, passwordData: ChangePasswordDto): Promise<void> { // userId es string
    await api.patch('/users/change-password', passwordData);
  }

  async delete(id: string): Promise<void> { // id es string
    await api.delete(`/users/${id}`);
  }

  async reactivate(id: string): Promise<User> { // id es string
    const response = await api.patch(`/users/${id}/reactivate`);
    return response.data;
  }

  async getStats(): Promise<UserStats> {
    const response = await api.get('/users/stats');
    return response.data;
  }

  // Métodos auxiliares para el frontend
  getRoleLabel(role: string): string {
    const labels: Record<string, string> = {
      ADMIN: 'Administrador',
      MEDICO: 'Médico',
      AUXILIAR: 'Auxiliar',
      RECEPCION: 'Recepción',
    };
    return labels[role] || role;
  }

  getRoleColor(role: string): 'error' | 'primary' | 'secondary' | 'warning' | 'default' {
    const colors: Record<string, 'error' | 'primary' | 'secondary' | 'warning'> = {
      ADMIN: 'error',
      MEDICO: 'primary',
      AUXILIAR: 'secondary',
      RECEPCION: 'warning',
    };
    return colors[role] || 'default';
  }
}

export const userService = new UserService();