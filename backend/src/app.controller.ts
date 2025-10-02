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

}