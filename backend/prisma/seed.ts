import { PrismaClient, UserRole, DocumentType, Gender, TreatmentType, AppointmentStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');

  // Hashear contraseñas
  const adminPassword = await bcrypt.hash('admin123', 10);
  const recepcionPassword = await bcrypt.hash('recepcion123', 10);

  // 1. Crear usuarios del sistema
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@clinica.com' },
    update: {},
    create: {
      email: 'admin@clinica.com',
      username: 'admin',
      passwordHash: adminPassword, // Usar contraseña hasheada
      role: UserRole.ADMIN,
      active: true,
    },
  });
  console.log('✅ Usuario admin creado');

  const recepcionUser = await prisma.user.upsert({
    where: { email: 'recepcion@clinica.com' },
    update: {},
    create: {
      email: 'recepcion@clinica.com',
      username: 'recepcion',
      passwordHash: recepcionPassword, // Usar contraseña hasheada
      role: UserRole.RECEPCION,
      active: true,
    },
  });
  console.log('✅ Usuario recepción creado');

  // 2. Crear médicos
  const drGonzalez = await prisma.staff.upsert({
    where: { documentNumber: '12345678A' },
    update: {},
    create: {
      medicoCod: 1,
      firstName: 'María',
      lastName: 'González López',
      documentType: DocumentType.DNI,
      documentNumber: '12345678A',
      licenseNumber: 'COL46/12345',
      specialty: 'Medicina Estética',
      defaultTreatment: 'Consulta General',
      phone: '600123456',
      email: 'dra.gonzalez@clinica.com',
      active: true,
    },
  });
  console.log('✅ Dra. González creada');

  const drMartinez = await prisma.staff.upsert({
    where: { documentNumber: '87654321B' },
    update: {},
    create: {
      medicoCod: 2,
      firstName: 'Carlos',
      lastName: 'Martínez Ruiz',
      documentType: DocumentType.DNI,
      documentNumber: '87654321B',
      licenseNumber: 'COL46/54321',
      specialty: 'Dermatología Estética',
      defaultTreatment: 'Botox',
      phone: '600654321',
      email: 'dr.martinez@clinica.com',
      active: true,
    },
  });
  console.log('✅ Dr. Martínez creado');

  // 3. Crear salas
  const sala1 = await prisma.room.upsert({
    where: { name: 'Consulta 1' },
    update: {},
    create: {
      salaCod: 1,
      name: 'Consulta 1',
      capacity: 2,
      observations: 'Consulta general, láser',
      active: true,
    },
  });

  const sala2 = await prisma.room.upsert({
    where: { name: 'Consulta 2' },
    update: {},
    create: {
      salaCod: 2,
      name: 'Consulta 2',
      capacity: 2,
      observations: 'Tratamientos faciales',
      active: true,
    },
  });

  const salaQuirofano = await prisma.room.upsert({
    where: { name: 'Quirófano' },
    update: {},
    create: {
      salaCod: 3,
      name: 'Quirófano',
      capacity: 4,
      observations: 'Procedimientos menores',
      active: true,
    },
  });
  console.log('✅ Salas creadas');

  // 4. Crear tratamientos
  const consulta = await prisma.treatment.upsert({
    where: { name: 'Consulta General' },
    update: {},
    create: {
      tratCod: 1,
      name: 'Consulta General',
      duration: 30,
      price: 60,
      vatPercentage: 21,
      defaultDoctor: 'Cualquiera',
      observations: 'Primera consulta o revisión',
      active: true,
    },
  });

  const botox = await prisma.treatment.upsert({
    where: { name: 'Botox Completo' },
    update: {},
    create: {
      tratCod: 2,
      name: 'Botox Completo',
      duration: 45,
      price: 350,
      vatPercentage: 21,
      defaultDoctor: 'Dr. Martínez',
      observations: 'Tratamiento completo tercio superior',
      active: true,
    },
  });

  const laser = await prisma.treatment.upsert({
    where: { name: 'Láser Facial' },
    update: {},
    create: {
      tratCod: 3,
      name: 'Láser Facial',
      duration: 60,
      price: 200,
      vatPercentage: 21,
      observations: 'Rejuvenecimiento facial',
      active: true,
    },
  });

  const peeling = await prisma.treatment.upsert({
    where: { name: 'Peeling Químico' },
    update: {},
    create: {
      tratCod: 4,
      name: 'Peeling Químico',
      duration: 45,
      price: 150,
      vatPercentage: 21,
      observations: 'Peeling medio',
      active: true,
    },
  });
  console.log('✅ Tratamientos creados');

  // 5. Crear pacientes de ejemplo
  const paciente1 = await prisma.patient.upsert({
    where: { documentNumber: '11111111A' },
    update: {},
    create: {
      codCliente: 1001,
      firstName: 'Ana',
      lastName: 'García Pérez',
      documentType: DocumentType.DNI,
      documentNumber: '11111111A',
      birthDate: new Date('1985-03-15'),
      gender: Gender.F,
      profession: 'Abogada',
      phone: '961234567',
      mobile: '600111111',
      email: 'ana.garcia@email.com',
      address: 'Calle Colón, 25',
      city: 'Valencia',
      postalCode: '46001',
      province: 'Valencia',
      country: 'España',
      wantsSMS: true,
      wantsEmail: true,
      dataConsent: true,
      consentDate: new Date(),
    },
  });

  const paciente2 = await prisma.patient.upsert({
    where: { documentNumber: '22222222B' },
    update: {},
    create: {
      codCliente: 1002,
      firstName: 'Juan',
      lastName: 'López Martín',
      documentType: DocumentType.DNI,
      documentNumber: '22222222B',
      birthDate: new Date('1978-07-22'),
      gender: Gender.M,
      profession: 'Empresario',
      phone: '963456789',
      mobile: '600222222',
      email: 'juan.lopez@email.com',
      address: 'Avenida del Puerto, 100',
      city: 'Valencia',
      postalCode: '46021',
      province: 'Valencia',
      country: 'España',
      wantsSMS: false,
      wantsEmail: true,
      dataConsent: true,
      consentDate: new Date(),
    },
  });
  console.log('✅ Pacientes creados');

  // 6. Crear historia médica
  const historia1 = await prisma.medicalHistory.create({
    data: {
      patientId: paciente1.id,
      doctorId: drGonzalez.id,
      date: new Date(),
      diseases: 'Ninguna relevante',
      allergies: 'Polen',
      medications: 'Ninguna',
      smoker: false,
      currentTreatment: 'Botox preventivo',
      treatmentOK: true,
      creams: 'Protector solar factor 50',
      hematomas: false,
      keloid: false,
      exploration: 'Piel tipo II, arrugas finas en contorno de ojos',
      otherObservations: 'Paciente con expectativas realistas',
    },
  });
  console.log('✅ Historia médica creada');

  // 7. Crear citas de ejemplo
  const citaHoy = await prisma.appointment.create({
    data: {
      patientId: paciente1.id,
      doctorId: drGonzalez.id,
      roomId: sala1.id,
      treatmentId: consulta.id,
      date: new Date(),
      startTime: new Date('2024-01-15T10:00:00'),
      endTime: new Date('2024-01-15T10:30:00'),
      status: AppointmentStatus.PROGRAMADA,
      observations: 'Primera consulta',
      confirmed: true,
      confirmationDate: new Date(),
    },
  });

  const citaManana = await prisma.appointment.create({
    data: {
      patientId: paciente2.id,
      doctorId: drMartinez.id,
      roomId: sala2.id,
      treatmentId: botox.id,
      date: new Date(Date.now() + 24 * 60 * 60 * 1000),
      startTime: new Date('2024-01-16T11:00:00'),
      endTime: new Date('2024-01-16T11:45:00'),
      status: AppointmentStatus.CONFIRMADA,
      observations: 'Sesión de mantenimiento',
      confirmed: true,
      confirmationDate: new Date(),
    },
  });
  console.log('✅ Citas creadas');

  // 8. Crear evolución de tratamiento
  const evolucion1 = await prisma.treatmentEvolution.create({
    data: {
      patientId: paciente1.id,
      treatmentId: botox.id,
      doctorId: drMartinez.id,
      treatmentType: TreatmentType.BOTOX,
      date: new Date(),
      zone: 'Frente, entrecejo, patas de gallo',
      dose: '50 UI',
      product: 'Vistabel',
      numInjections: 15,
      observations: 'Buena respuesta al tratamiento',
      amount: 350,
      billable: true,
      billed: false,
    },
  });
  console.log('✅ Evolución de tratamiento creada');

  console.log('🎉 Seed completado con éxito!');
  console.log('\n📊 Resumen:');
  console.log('- 2 usuarios del sistema');
  console.log('- 2 médicos');
  console.log('- 3 salas');
  console.log('- 4 tratamientos');
  console.log('- 2 pacientes');
  console.log('- 1 historia médica');
  console.log('- 2 citas');
  console.log('- 1 evolución de tratamiento');
  
  console.log('\n🔐 Credenciales de acceso:');
  console.log('Admin: admin@clinica.com / admin123');
  console.log('Recepción: recepcion@clinica.com / recepcion123');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });