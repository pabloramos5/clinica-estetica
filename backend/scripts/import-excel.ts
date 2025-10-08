import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as path from 'path';

const prisma = new PrismaClient();

async function importExcel() {
  try {
    // Leer el Excel
    const workbook = XLSX.readFile('/Users/pablo/Documents/Programacion/ClinicaApp/clinica-estetica/backend/data/Clientes.xlsx');
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    console.log(`Encontrados ${data.length} registros`);

    for (const row of data as any[]) {
      try {
        await prisma.patient.create({
          data: {
            firstName: row['Nombre'] || row['nombre'] || '',
            lastName: row['Apellidos'] || row['apellidos'] || '',
            documentType: 'DNI',
            documentNumber: row['DNI'] || row['dni'] || `TEMP-${Date.now()}`,
            phone: row['Teléfono'] || row['telefono'] || row['Movil'] || '',
            email: row['Email'] || row['email'] || null,
            birthDate: row['Fecha Nacimiento'] ? new Date(row['Fecha Nacimiento']) : null,
            address: row['Dirección'] || row['direccion'] || null,
            city: row['Ciudad'] || row['ciudad'] || null,
            postalCode: row['CP'] || row['codigo_postal'] || null,
            observations: row['Observaciones'] || row['observaciones'] || null,
            // Mapea los demás campos según tu Excel
          }
        });
        console.log(`✓ Importado: ${row['Nombre']} ${row['Apellidos']}`);
      } catch (error) {
        console.error(`✗ Error en fila:`, row, error.message);
      }
    }

    console.log('Importación completada');
  } catch (error) {
    console.error('Error en importación:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importExcel();