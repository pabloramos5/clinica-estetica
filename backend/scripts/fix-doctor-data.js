// backend/scripts/fix-doctor-data.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixDoctorData() {
  try {
    console.log('🔍 Buscando médico Pablo Ramos...');
    
    // Buscar el médico
    const doctor = await prisma.user.findFirst({
      where: {
        OR: [
          { email: 'pabloramosh98@gmail.com' },
          { username: { contains: 'Pablo' } }
        ]
      }
    });

    if (!doctor) {
      console.log('❌ No se encontró el médico');
      
      // Mostrar todos los usuarios tipo MEDICO
      const allDoctors = await prisma.user.findMany({
        where: { role: 'MEDICO' }
      });
      
      console.log('\n📋 Médicos en la base de datos:');
      allDoctors.forEach(d => {
        console.log(`\nID: ${d.id}`);
        console.log(`Email: ${d.email}`);
        console.log(`Username: ${d.username}`);
        console.log(`Specialty: ${d.specialty || 'NO DEFINIDA'}`);
        console.log(`License: ${d.licenseNumber || 'NO DEFINIDA'}`);
        console.log(`Phone: ${d.phone || 'NO DEFINIDO'}`);
        console.log('---');
      });
      return;
    }

    console.log('\n📌 Médico encontrado:');
    console.log(`ID: ${doctor.id}`);
    console.log(`Email: ${doctor.email}`);
    console.log(`Username: ${doctor.username}`);
    console.log(`Specialty actual: ${doctor.specialty || 'VACÍO'}`);
    console.log(`License actual: ${doctor.licenseNumber || 'VACÍO'}`);
    console.log(`Phone actual: ${doctor.phone || 'VACÍO'}`);

    // Actualizar con datos
    const updated = await prisma.user.update({
      where: { id: doctor.id },
      data: {
        specialty: 'Dermatología',
        licenseNumber: '28/2845678',
        phone: '666555444',
        username: 'Pablo Ramos Hernández' // Asegurar que tiene nombre completo
      }
    });

    console.log('\n✅ Médico actualizado exitosamente:');
    console.log(`Email: ${updated.email}`);
    console.log(`Username: ${updated.username}`);
    console.log(`Teléfono: ${updated.phone}`);
    console.log(`Especialidad: ${updated.specialty}`);
    console.log(`Nº Licencia: ${updated.licenseNumber}`);
    
    // Verificar que los datos se guardaron
    const verification = await prisma.user.findUnique({
      where: { id: doctor.id },
      select: {
        id: true,
        email: true,
        username: true,
        phone: true,
        specialty: true,
        licenseNumber: true,
        role: true,
        active: true
      }
    });
    
    console.log('\n🔍 Verificación final:');
    console.log(JSON.stringify(verification, null, 2));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixDoctorData();