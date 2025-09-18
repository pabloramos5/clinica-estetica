import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'API de Clínica Estética - Funcionando correctamente!';
  }
}