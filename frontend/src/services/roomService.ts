import api from './api';

export interface CreateRoomDto {
  name: string;
  description?: string;
  capacity?: number;
  available?: boolean;
}

export interface UpdateRoomDto {
  name?: string;
  description?: string;
  capacity?: number;
  available?: boolean;
}

export interface Room {
  id: string;
  name: string;
  description?: string;
  capacity?: number;
  available: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RoomStats {
  total: number;
  active: number;
  inactive: number;
}

class RoomService {
  async create(roomData: CreateRoomDto): Promise<Room> {
    const response = await api.post('/rooms', roomData);
    return response.data;
  }

  async getAll(): Promise<Room[]> {
    const response = await api.get('/rooms');
    return response.data;
  }

  async getById(id: string): Promise<Room> {
    const response = await api.get(`/rooms/${id}`);
    return response.data;
  }

  async update(id: string, roomData: UpdateRoomDto): Promise<Room> {
    const response = await api.patch(`/rooms/${id}`, roomData);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await api.delete(`/rooms/${id}`);
  }

  async getStats(): Promise<RoomStats> {
    const response = await api.get('/rooms/stats');
    return response.data;
  }

  async getAvailableRooms(date: string, startTime: string, endTime: string): Promise<Room[]> {
    const response = await api.get('/rooms/available', {
      params: { date, startTime, endTime },
    });
    return response.data;
  }
}

export const roomService = new RoomService();