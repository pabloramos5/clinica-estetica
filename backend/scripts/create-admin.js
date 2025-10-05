const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    // Verificar si ya existe el admin
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@clinica.com' }
    });

    if (existingAdmin) {
      console.log('❌ El usuario admin@clinica.com ya existe');
      
      // Preguntar si quiere actualizar la contraseña
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      readline.question('¿Deseas actualizar la contraseña? (s/n): ', async (answer) => {
        if (answer.toLowerCase() === 's') {
          const hashedPassword = await bcrypt.hash('admin123', 10);
          await prisma.user.update({
            where: { id: existingAdmin.id },
            data: { 
              passwordHash: hashedPassword,
              active: true,
              role: 'ADMIN'
            }
          });
          console.log('✅ Contraseña actualizada correctamente');
        }
        readline.close();
        await prisma.$disconnect();
        process.exit(0);
      });
      
      return;
    }

    // Crear el hash de la contraseña
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Crear el usuario admin
    const admin = await prisma.user.create({
      data: {
        email: 'admin@clinica.com',
        username: 'Administrador',
        passwordHash: hashedPassword,
        role: 'ADMIN',
        active: true,
        phone: '900000000',
        specialty: null,
        licenseNumber: null
      }
    });

    console.log('✅ Usuario administrador creado exitosamente:');
    console.log('📧 Email: admin@clinica.com');
    console.log('🔐 Contraseña: admin123');
    console.log('🆔 ID:', admin.id);
    console.log('👤 Nombre:', admin.username);
    console.log('🛡️ Rol:', admin.role);

  } catch (error) {
    console.error('❌ Error al crear el usuario:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la función
createAdmin();