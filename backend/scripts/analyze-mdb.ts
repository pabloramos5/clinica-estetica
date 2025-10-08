import * as fs from 'fs';
import * as path from 'path';

// ====================================
// SCRIPT DE ANÁLISIS DE BASE DE DATOS MDB
// ====================================

interface TableInfo {
  name: string;
  rowCount: number;
  columns: ColumnInfo[];
  sampleData: any[];
}

interface ColumnInfo {
  name: string;
  type: string;
  hasNulls: boolean;
  uniqueValues?: number;
  sampleValues: any[];
}

async function analyzeMDB() {
  console.log('🔍 ANALIZADOR DE BASE DE DATOS MDB\n');
  console.log('='.repeat(80));

  try {
    // Importa mdb-reader
    const MDBReader = require('mdb-reader').default;
    
    // Ruta al archivo MDB
    const dataDir = path.join(__dirname, '../data');
    const mdbFiles = fs.readdirSync(dataDir).filter(f => f.endsWith('.mdb'));
    
    if (mdbFiles.length === 0) {
      console.error('❌ No se encontró ningún archivo .mdb en la carpeta data/');
      console.log('\n💡 Asegúrate de copiar tu archivo .mdb a:');
      console.log(`   ${dataDir}/\n`);
      return;
    }
    
    const mdbPath = path.join(dataDir, mdbFiles[0]);
    console.log(`📁 Analizando: ${mdbFiles[0]}\n`);
    
    // Lee el archivo MDB
    const buffer = fs.readFileSync(mdbPath);
    const reader = new MDBReader(buffer);
    
    // Obtiene todas las tablas
    const tableNames = reader.getTableNames();
    console.log(`📊 Total de tablas encontradas: ${tableNames.length}\n`);
    
    const allTableInfo: TableInfo[] = [];
    
    // Analiza cada tabla
    for (const tableName of tableNames) {
      try {
        const table = reader.getTable(tableName);
        const data = table.getData();
        
        const tableInfo: TableInfo = {
          name: tableName,
          rowCount: data.length,
          columns: [],
          sampleData: data.slice(0, 3) // Primeras 3 filas
        };
        
        // Analiza columnas si hay datos
        if (data.length > 0) {
          const firstRow = data[0];
          
          for (const colName of Object.keys(firstRow)) {
            const columnValues = data.map(row => row[colName]);
            
            const columnInfo: ColumnInfo = {
              name: colName,
              type: detectType(columnValues),
              hasNulls: columnValues.some(v => v === null || v === undefined),
              sampleValues: columnValues.slice(0, 5).filter(v => v !== null && v !== undefined)
            };
            
            // Cuenta valores únicos para columnas pequeñas
            if (data.length < 1000) {
              const uniqueSet = new Set(columnValues.filter(v => v !== null));
              columnInfo.uniqueValues = uniqueSet.size;
            }
            
            tableInfo.columns.push(columnInfo);
          }
        }
        
        allTableInfo.push(tableInfo);
        
        // Muestra progreso
        console.log(`✓ ${tableName.padEnd(30)} - ${data.length.toString().padStart(6)} registros`);
        
      } catch (error: any) {
        console.log(`✗ ${tableName.padEnd(30)} - Error: ${error.message}`);
      }
    }
    
    // Genera reportes
    console.log('\n' + '='.repeat(80));
    console.log('📝 GENERANDO REPORTES...\n');
    
    generateSummaryReport(allTableInfo);
    generateDetailedReport(allTableInfo);
    generateMappingTemplate(allTableInfo);
    
    console.log('\n✅ Análisis completado!\n');
    
  } catch (error: any) {
    console.error(`\n❌ Error fatal: ${error.message}`);
    if (error.code === 'MODULE_NOT_FOUND') {
      console.log('\n💡 Parece que falta instalar mdb-reader:');
      console.log('   npm install mdb-reader\n');
    }
  }
}

// ====================================
// UTILIDADES
// ====================================

function detectType(values: any[]): string {
  const nonNullValues = values.filter(v => v !== null && v !== undefined);
  
  if (nonNullValues.length === 0) return 'unknown';
  
  const sample = nonNullValues[0];
  
  if (sample instanceof Date) return 'Date';
  if (typeof sample === 'number') {
    return Number.isInteger(sample) ? 'Integer' : 'Decimal';
  }
  if (typeof sample === 'boolean') return 'Boolean';
  if (typeof sample === 'string') {
    if (sample.length > 255) return 'Text';
    return 'String';
  }
  
  return typeof sample;
}

function generateSummaryReport(tables: TableInfo[]) {
  const reportPath = path.join(__dirname, '../data/analysis-summary.txt');
  
  let content = '📊 RESUMEN DE TABLAS\n';
  content += '='.repeat(80) + '\n\n';
  
  // Ordena por cantidad de registros
  const sorted = [...tables].sort((a, b) => b.rowCount - a.rowCount);
  
  content += 'Tabla'.padEnd(35) + 'Registros'.padStart(12) + 'Columnas'.padStart(12) + '\n';
  content += '-'.repeat(80) + '\n';
  
  for (const table of sorted) {
    content += table.name.padEnd(35) + 
               table.rowCount.toString().padStart(12) + 
               table.columns.length.toString().padStart(12) + '\n';
  }
  
  content += '\n' + '='.repeat(80) + '\n';
  content += `Total registros: ${tables.reduce((sum, t) => sum + t.rowCount, 0).toLocaleString()}\n`;
  content += `Total tablas: ${tables.length}\n`;
  
  fs.writeFileSync(reportPath, content);
  console.log(`✓ Resumen guardado: ${reportPath}`);
}

function generateDetailedReport(tables: TableInfo[]) {
  const reportPath = path.join(__dirname, '../data/analysis-detailed.json');
  
  const report = {
    timestamp: new Date().toISOString(),
    totalTables: tables.length,
    totalRecords: tables.reduce((sum, t) => sum + t.rowCount, 0),
    tables: tables.map(table => ({
      name: table.name,
      rowCount: table.rowCount,
      columns: table.columns.map(col => ({
        name: col.name,
        type: col.type,
        hasNulls: col.hasNulls,
        uniqueValues: col.uniqueValues,
        sampleValues: col.sampleValues.slice(0, 3)
      })),
      sampleRows: table.sampleData
    }))
  };
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`✓ Detalle JSON guardado: ${reportPath}`);
}

function generateMappingTemplate(tables: TableInfo[]) {
  const reportPath = path.join(__dirname, '../data/mapping-template.txt');
  
  let content = '🗺️  PLANTILLA DE MAPEO PARA IMPORTACIÓN\n';
  content += '='.repeat(80) + '\n\n';
  content += 'Copia y ajusta estos mapeos en import-advanced.ts\n\n';
  
  // Identifica tablas potencialmente relevantes
  const keywordMappings = {
    pacientes: ['cliente', 'paciente', 'patient'],
    tratamientos: ['tratamiento', 'servicio', 'treatment'],
    medicos: ['medico', 'doctor', 'staff', 'empleado'],
    citas: ['cita', 'agenda', 'appointment', 'turno'],
    salas: ['sala', 'room', 'consultorio', 'box'],
    facturas: ['factura', 'invoice', 'cobro']
  };
  
  for (const [category, keywords] of Object.entries(keywordMappings)) {
    const matchedTables = tables.filter(t => 
      keywords.some(kw => t.name.toLowerCase().includes(kw))
    );
    
    if (matchedTables.length > 0) {
      content += `\n📋 CATEGORÍA: ${category.toUpperCase()}\n`;
      content += '-'.repeat(80) + '\n';
      
      for (const table of matchedTables) {
        content += `\nTabla: ${table.name} (${table.rowCount} registros)\n`;
        content += 'Columnas:\n';
        
        for (const col of table.columns) {
          const nullable = col.hasNulls ? '(nullable)' : '(required)';
          const unique = col.uniqueValues && col.uniqueValues === table.rowCount ? 
                        ' [UNIQUE]' : '';
          content += `  - ${col.name.padEnd(30)} ${col.type.padEnd(10)} ${nullable}${unique}\n`;
          
          if (col.sampleValues.length > 0) {
            content += `    Ejemplos: ${col.sampleValues.slice(0, 3).join(', ')}\n`;
          }
        }
      }
    }
  }
  
  // Tablas no categorizadas
  const categorizedNames = new Set(
    Object.values(keywordMappings)
      .flat()
      .flatMap(kw => tables.filter(t => t.name.toLowerCase().includes(kw)).map(t => t.name))
  );
  
  const uncategorized = tables.filter(t => !categorizedNames.has(t.name));
  
  if (uncategorized.length > 0) {
    content += `\n\n📦 OTRAS TABLAS (${uncategorized.length})\n`;
    content += '-'.repeat(80) + '\n';
    
    for (const table of uncategorized) {
      content += `\n${table.name} (${table.rowCount} registros) - ${table.columns.length} columnas\n`;
      content += `  Columnas: ${table.columns.map(c => c.name).join(', ')}\n`;
    }
  }
  
  content += '\n\n💡 SUGERENCIAS:\n';
  content += '-'.repeat(80) + '\n';
  content += '1. Revisa las columnas marcadas como [UNIQUE] - pueden ser IDs\n';
  content += '2. Campos (nullable) pueden tener valor por defecto en el mapeo\n';
  content += '3. Busca relaciones por nombres similares (ej: ClienteID, ID_Cliente)\n';
  content += '4. Tablas con pocos registros (<50) pueden ser catálogos\n';
  
  fs.writeFileSync(reportPath, content);
  console.log(`✓ Plantilla de mapeo: ${reportPath}`);
}

// ====================================
// EJECUCIÓN
// ====================================

analyzeMDB().catch(console.error);