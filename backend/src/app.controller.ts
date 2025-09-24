// backend/src/app.controller.ts
// Añade estos endpoints temporales para pruebas

import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';

@Controller()
@UseGuards(JwtAuthGuard)
export class AppController {
  
  @Get('staff')
  getStaff() {
    return [
      { id: '1', firstName: 'Juan', lastName: 'García', specialty: 'Dermatología' },
      { id: '2', firstName: 'María', lastName: 'López', specialty: 'Medicina Estética' },
      { id: '3', firstName: 'Carlos', lastName: 'Martínez', specialty: 'Cirugía Plástica' }
    ];
  }

  @Get('rooms')
  getRooms() {
    return [
      { id: '1', name: 'Sala 1', capacity: 1 },
      { id: '2', name: 'Sala 2', capacity: 1 },
      { id: '3', name: 'Sala Láser', capacity: 2 },
      { id: '4', name: 'Quirófano', capacity: 3 }
    ];
  }

  @Get('treatments')
  getTreatments() {
    return [
      { id: '1', name: 'Botox', duration: 30, price: 300 },
      { id: '2', name: 'Ácido Hialurónico', duration: 45, price: 400 },
      { id: '3', name: 'Peeling Químico', duration: 60, price: 150 },
      { id: '4', name: 'Láser CO2', duration: 90, price: 600 },
      { id: '5', name: 'Mesoterapia Facial', duration: 45, price: 200 },
      { id: '6', name: 'Hilos Tensores', duration: 60, price: 500 }
    ];
  }
}