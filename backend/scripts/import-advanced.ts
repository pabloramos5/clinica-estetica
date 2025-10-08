import { PrismaClient, DocumentType, UserRole, AppointmentStatus } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// ====================================
// CONFIGURACIÓN DE MAPEO PERSONALIZADO
// ====================================

interface FieldMapping {
  source?: string | string[]; // OPCIONAL - Campo(s) origen
  target: string;
  transform?: (value: any, row?: any) => any;
  required?: boolean;
  default?: any;
}

interface TableMapping {
  sourceTable: string;
  targetModel: string;
  fields: FieldMapping[];
  preProcess?: (row: any) => any;
  skipIf?: (row: any) => boolean;
  postProcess?: (createdRecord: any, originalRow: any) => Promise<void>;
}

// Cache para evitar duplicados
const caches = {
  patients: new Map<number, string>(),
  doctors: new Map<number, string>(),
  treatments: new Map<number, string>(),
  rooms: new Map<number, string>()
};

// ====================================
// MAPEOS CONFIGURADOS
// ====================================

const MAPPINGS: TableMapping[] = [
  // 1. SALAS
  {
    sourceTable: 'Salas',
    targetModel: 'room',
    fields: [
      { source: 'SalaNombre', target: 'name', required: true },
      { 
        source: 'SalaCapacidad', 
        target: 'capacity',
        transform: (val) => parseInt(val) || 2
      },
      { source: 'SalaObservaciones', target: 'observations' },
      { target: 'active', default: true }
    ],
    postProcess: async (created, original) => {
      caches.rooms.set(original.SalaCod, created.id);
    }
  },

  // 2. MÉDICOS
  {
    sourceTable: 'Medicos',
    targetModel: 'user',
    fields: [
      { 
        source: 'MedicoNombre',
        target: 'username',
        required: true,
        transform: (val) => val.trim()
      },
      { 
        source: 'MedicoNombre',
        target: 'email',
        required: true,
        transform: (val) => {
          const clean = val.toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, '.');
          return `${clean}@clinica.com`;
        }
      },
      {
        target: 'passwordHash',
        default: bcrypt.hashSync('temp123', 10)
      },
      {
        source: 'MedicoNombre',
        target: 'role',
        transform: (val) => {
          const upper = val.toUpperCase();
          if (upper.includes('MÉDICO') || upper.includes('MEDICO')) return UserRole.MEDICO;
          if (upper.includes('CIRUJANO')) return UserRole.MEDICO;
          if (upper.includes('AUXILIAR') || upper.includes('AUX')) return UserRole.RECEPCION;
          return UserRole.MEDICO;
        }
      },
      {
        source: 'MedicoNombre',
        target: 'specialty',
        transform: (val) => {
          if (val.includes('CIRUJANO')) return 'Cirugía Estética';
          if (val.includes('MÉDICO')) return 'Medicina Estética';
          if (val.includes('AUX')) return 'Auxiliar Sanitario';
          return 'Medicina Estética';
        }
      },
      { target: 'active', default: true }
    ],
    postProcess: async (created, original) => {
      caches.doctors.set(original.MedicoCod, created.id);
      console.log(`   ✓ Médico: ${created.username} (password: temp123)`);
    }
  },

  // 3. TRATAMIENTOS
  {
    sourceTable: 'Tratamientos',
    targetModel: 'treatment',
    fields: [
      { source: 'TratNombre', target: 'name', required: true },
      { 
        source: 'TratObservaciones',
        target: 'observations',
        transform: (val) => val?.trim() || 'Tratamiento de medicina estética'
      },
      { 
        source: 'TratCod',
        target: 'tratCod',
        required: true,
        transform: (val) => parseInt(val)
      },
      { target: 'price', default: 0 },
      { target: 'vatPercentage', default: 21 },
      {
        source: 'TratDuracion',
        target: 'duration',
        transform: (val) => parseInt(val) || 30
      },
      {
        source: 'TratMedico',
        target: 'defaultDoctor',
        transform: (val) => val?.trim() || null
      },
      { target: 'active', default: true }
    ],
    postProcess: async (created, original) => {
      caches.treatments.set(original.TratCod, created.id);
    }
  },

  // 4. PACIENTES
  {
    sourceTable: 'Clientes',
    targetModel: 'patient',
    fields: [
      {
        source: 'Nombre',
        target: 'firstName',
        required: true,
        transform: (val) => {
          const parts = val.trim().split(/\s+/);
          return parts.length > 2 ? parts.slice(0, 2).join(' ') : parts[0];
        }
      },
      {
        source: 'Nombre',
        target: 'lastName',
        required: true,
        transform: (val) => {
          const parts = val.trim().split(/\s+/);
          return parts.length > 2 ? parts.slice(2).join(' ') : (parts[1] || parts[0]);
        }
      },
      {
        source: 'NIF',
        target: 'documentType',
        transform: (val) => {
          if (!val) return DocumentType.DNI;
          const upper = val.toString().toUpperCase();
          if (upper.includes('NIE')) return DocumentType.NIE;
          if (upper.match(/^[XYZ]/)) return DocumentType.NIE;
          if (upper.length > 10) return DocumentType.PASAPORTE;
          return DocumentType.DNI;
        },
        default: DocumentType.DNI
      },
      {
        source: ['NIF', 'CodCliente'],
        target: 'documentNumber',
        required: true,
        transform: (val, row) => {
          if (val && val.toString().trim()) {
            return val.toString().trim().toUpperCase();
          }
          return `CLI-${row.CodCliente}`;
        }
      },
      {
        source: ['TelefonoMovil', 'Telefono1', 'Telefono2'],
        target: 'phone',
        required: true,
        transform: (val) => {
          const phone = val?.toString().trim();
          return phone || '000000000';
        }
      },
      { 
        source: 'Email',
        target: 'email',
        transform: (val) => {
          const email = val?.toString().trim();
          return email && email.includes('@') ? email : null;
        }
      },
      {
        source: 'FechaNacimiento',
        target: 'birthDate',
        transform: (val) => {
          if (!val) return null;
          const date = new Date(val);
          const year = date.getFullYear();
          if (isNaN(date.getTime()) || year < 1900 || year > new Date().getFullYear()) {
            return null;
          }
          return date;
        }
      },
      { 
        source: ['Domicilio', 'Via'],
        target: 'address',
        transform: (val, row) => {
          const via = row.Via || '';
          const dom = val || '';
          return `${via} ${dom}`.trim() || null;
        }
      },
      { source: 'Poblacion', target: 'city' },
      { source: 'CodPostal', target: 'postalCode' },
      { 
        source: ['Observaciones', 'OtrasObservaciones', 'Profesion'],
        target: 'observations',
        transform: (val, row) => {
          const parts = [
            row.Observaciones,
            row.OtrasObservaciones,
            row.Profesion ? `Profesión: ${row.Profesion}` : null
          ].filter(Boolean);
          return parts.join('. ') || null;
        }
      },
      { 
        source: 'CodCliente',
        target: 'patientCode',
        transform: (val) => val?.toString()
      },
      { target: 'isActive', default: true }
    ],
    skipIf: (row) => !row.Nombre || row.Nombre.trim() === '',
    postProcess: async (created, original) => {
      caches.patients.set(original.CodCliente, created.id);
    }
  },

  // 5. CITAS
  {
    sourceTable: 'Diario',
    targetModel: 'appointment',
    fields: [
      {
        source: 'COD_CLIENTE',
        target: 'patientId',
        required: true,
        transform: (val) => {
          const uuid = caches.patients.get(parseInt(val));
          if (!uuid) throw new Error(`Paciente no encontrado: ${val}`);
          return uuid;
        }
      },
      {
        source: 'COD_MEDICO',
        target: 'doctorId',
        required: true,
        transform: (val) => {
          const uuid = caches.doctors.get(parseInt(val));
          if (!uuid) throw new Error(`Médico no encontrado: ${val}`);
          return uuid;
        }
      },
      {
        source: 'COD_SALA',
        target: 'roomId',
        required: true,
        transform: (val) => {
          const uuid = caches.rooms.get(parseInt(val));
          if (!uuid) throw new Error(`Sala no encontrada: ${val}`);
          return uuid;
        }
      },
      {
        source: 'COD_TRATAMIENTO',
        target: 'treatmentId',
        required: true,
        transform: (val) => {
          const uuid = caches.treatments.get(parseInt(val));
          if (!uuid) throw new Error(`Tratamiento no encontrado: ${val}`);
          return uuid;
        }
      },
      {
        source: 'FECHA',
        target: 'date',
        required: true,
        transform: (val) => new Date(val)
      },
      {
        source: ['FECHA', 'HORA_INICIO'],
        target: 'startTime',
        required: true,
        transform: (val, row) => {
          const date = new Date(row.FECHA);
          const time = new Date(row.HORA_INICIO);
          date.setHours(time.getHours(), time.getMinutes(), 0, 0);
          return date;
        }
      },
      {
        source: ['FECHA', 'HORA_FIN'],
        target: 'endTime',
        required: true,
        transform: (val, row) => {
          const date = new Date(row.FECHA);
          const time = new Date(row.HORA_FIN);
          date.setHours(time.getHours(), time.getMinutes(), 0, 0);
          return date;
        }
      },
      {
        source: 'FECHA',
        target: 'status',
        transform: (val) => {
          const appointmentDate = new Date(val);
          const now = new Date();
          return appointmentDate < now ? AppointmentStatus.COMPLETADA : AppointmentStatus.PROGRAMADA;
        }
      },
      { source: 'OBSERVACIONES', target: 'observations' },
      {
        source: 'FECHA',
        target: 'confirmed',
        transform: (val) => {
          const appointmentDate = new Date(val);
          const now = new Date();
          return appointmentDate < now;
        }
      }
    ],
    skipIf: (row) => {
      return !row.COD_CLIENTE || !row.COD_MEDICO || !row.COD_TRATAMIENTO || 
             !row.COD_SALA || !row.FECHA || !row.HORA_INICIO;
    }
  }
];

// ====================================
// SISTEMA DE LOGGING
// ====================================

interface ImportStats {
  table: string;
  total: number;
  success: number;
  errors: number;
  skipped: number;
  errorDetails: Array<{ row: number; error: string; data?: any }>;
  duration: number;
}

class ImportLogger {
  private stats: ImportStats[] = [];
  private logFile: string;
  private startTime: number;

  constructor() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const logsDir = path.join(__dirname, '../logs');
    fs.mkdirSync(logsDir, { recursive: true });
    this.logFile = path.join(logsDir, `import-${timestamp}.log`);
    this.startTime = Date.now();
  }

  log(message: string) {
    const line = `[${new Date().toISOString()}] ${message}\n`;
    console.log(message);
    fs.appendFileSync(this.logFile, line);
  }

  addStats(stats: ImportStats) {
    this.stats.push(stats);
  }

  generateReport() {
    const totalDuration = Date.now() - this.startTime;
    
    const report = {
      timestamp: new Date().toISOString(),
      duration: `${(totalDuration / 1000).toFixed(2)}s`,
      summary: {
        totalTables: this.stats.length,
        totalRecords: this.stats.reduce((sum, s) => sum + s.total, 0),
        successRecords: this.stats.reduce((sum, s) => sum + s.success, 0),
        errorRecords: this.stats.reduce((sum, s) => sum + s.errors, 0),
        skippedRecords: this.stats.reduce((sum, s) => sum + s.skipped, 0)
      },
      details: this.stats
    };

    const reportPath = this.logFile.replace('.log', '-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    this.log('\n' + '='.repeat(80));
    this.log('📊 RESUMEN FINAL DE IMPORTACIÓN');
    this.log('='.repeat(80));
    this.log(`⏱️  Tiempo total: ${report.duration}`);
    this.log(`📁 Tablas procesadas: ${report.summary.totalTables}`);
    this.log(`📝 Total registros: ${report.summary.totalRecords.toLocaleString()}`);
    this.log(`✅ Exitosos: ${report.summary.successRecords.toLocaleString()}`);
    this.log(`❌ Errores: ${report.summary.errorRecords.toLocaleString()}`);
    this.log(`⏭️  Omitidos: ${report.summary.skippedRecords.toLocaleString()}`);
    this.log(`\n📄 Reporte completo: ${reportPath}\n`);
    
    this.log('\n🔐 CONTRASEÑAS TEMPORALES:');
    this.log('='.repeat(80));
    this.log('Todos los médicos: temp123');
    this.log('⚠️  Cambiar después de importar\n');
    
    return report;
  }
}

// ====================================
// FUNCIONES DE IMPORTACIÓN
// ====================================

function findSourceValue(row: any, sourceField?: string | string[]): any {
  if (!sourceField) return undefined;
  
  const fields = Array.isArray(sourceField) ? sourceField : [sourceField];
  
  for (const field of fields) {
    if (row[field] !== undefined && row[field] !== null && row[field] !== '') {
      return row[field];
    }
  }
  
  return undefined;
}

function mapRowToModel(row: any, mapping: TableMapping): any {
  const mapped: any = {};
  
  for (const field of mapping.fields) {
    let value = findSourceValue(row, field.source);
    
    if (field.transform) {
      value = field.transform(value, row);
    }
    
    if (value === undefined || value === null) {
      if (field.default !== undefined) {
        value = field.default;
      } else if (field.required) {
        throw new Error(`Campo requerido: ${field.target}`);
      }
    }
    
    if (value !== undefined) {
      mapped[field.target] = value;
    }
  }
  
  return mapped;
}

async function importTable(
  rows: any[],
  mapping: TableMapping,
  logger: ImportLogger
): Promise<ImportStats> {
  const startTime = Date.now();
  const stats: ImportStats = {
    table: mapping.sourceTable,
    total: rows.length,
    success: 0,
    errors: 0,
    skipped: 0,
    errorDetails: [],
    duration: 0
  };

  logger.log(`\n${'='.repeat(80)}`);
  logger.log(`📋 ${mapping.sourceTable} → ${mapping.targetModel}`);
  logger.log(`   Registros: ${rows.length.toLocaleString()}`);

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    
    try {
      const processedRow = mapping.preProcess ? mapping.preProcess(row) : row;
      
      if (mapping.skipIf && mapping.skipIf(processedRow)) {
        stats.skipped++;
        continue;
      }
      
      const data = mapRowToModel(processedRow, mapping);
      
      const created = await (prisma as any)[mapping.targetModel].create({ data });
      
      if (mapping.postProcess) {
        await mapping.postProcess(created, processedRow);
      }
      
      stats.success++;
      
      if ((i + 1) % 100 === 0 || (i + 1) === rows.length) {
        const percent = ((i + 1) / rows.length * 100).toFixed(1);
        logger.log(`   ⏳ ${i + 1}/${rows.length} (${percent}%)`);
      }
      
    } catch (error: any) {
      stats.errors++;
      
      if (stats.errorDetails.length < 10) {
        stats.errorDetails.push({
          row: i + 1,
          error: error.message,
          data: row
        });
      }
      
      if (stats.errors <= 3) {
        logger.log(`   ❌ Fila ${i + 1}: ${error.message}`);
      }
    }
  }

  stats.duration = Date.now() - startTime;
  const durationStr = (stats.duration / 1000).toFixed(2);
  
  logger.log(`   ✅ ${durationStr}s: ${stats.success.toLocaleString()} ok, ${stats.errors.toLocaleString()} error`);
  
  return stats;
}

async function readMDBFile(mdbPath: string): Promise<Map<string, any[]>> {
  const MDBReader = require('mdb-reader').default;
  const tables = new Map<string, any[]>();
  
  console.log(`\n📁 Leyendo MDB...`);
  
  const buffer = fs.readFileSync(mdbPath);
  const reader = new MDBReader(buffer);
  
  for (const tableName of reader.getTableNames()) {
    const table = reader.getTable(tableName);
    const rows = table.getData();
    tables.set(tableName, rows);
  }
  
  console.log(`✓ ${tables.size} tablas leídas\n`);
  return tables;
}

// ====================================
// FUNCIÓN PRINCIPAL
// ====================================

async function main() {
  const logger = new ImportLogger();
  logger.log('🚀 IMPORTACIÓN - CLÍNICA ESTÉTICA');
  logger.log('='.repeat(80));
  
  try {
    const dataDir = path.join(__dirname, '../data');
    const mdbFiles = fs.readdirSync(dataDir).filter(f => f.endsWith('.mdb'));
    
    if (mdbFiles.length === 0) {
      throw new Error('No se encontró archivo .mdb');
    }
    
    const mdbPath = path.join(dataDir, mdbFiles[0]);
    logger.log(`📂 ${mdbFiles[0]}\n`);
    
    const allTables = await readMDBFile(mdbPath);
    
    logger.log('📋 Orden: Salas → Médicos → Tratamientos → Pacientes → Citas');
    
    for (const mapping of MAPPINGS) {
      const rows = allTables.get(mapping.sourceTable);
      
      if (!rows) {
        logger.log(`\n⚠️  Tabla no encontrada: ${mapping.sourceTable}`);
        continue;
      }
      
      const stats = await importTable(rows, mapping, logger);
      logger.addStats(stats);
    }
    
    logger.generateReport();
    logger.log('✅ COMPLETADO\n');
    
  } catch (error: any) {
    logger.log(`\n💥 ERROR: ${error.message}`);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);