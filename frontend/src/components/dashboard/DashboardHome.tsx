import { useState, useEffect } from 'react'
import { 
  Grid, 
  Paper, 
  Typography, 
  Box,
  Card,
  CardContent,
  Button,
  Chip,
  IconButton,
  Alert
} from '@mui/material'
import {
  CalendarMonth as CalendarIcon,
  Receipt as ReceiptIcon,
  Add as AddIcon,
  Person as PersonIcon,
  LocalHospital as DoctorIcon,
  Room as RoomIcon,
  AccessTime as TimeIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface DashboardHomeProps {
  stats: {
    todayAppointments: number
    totalPatients: number
    pendingBills: number
  }
}

// Componente para mostrar cada cita en el calendario
function AppointmentCard({ appointment }: { appointment: any }) {
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'CONFIRMADA': return '#4caf50'
      case 'EN_CURSO': return '#2196f3'
      case 'COMPLETADA': return '#9e9e9e'
      case 'CANCELADA': return '#f44336'
      default: return '#ff9800'
    }
  }

  return (
    <Card 
      sx={{ 
        mb: 1, 
        borderLeft: `4px solid ${getStatusColor(appointment.status)}`,
        '&:hover': { boxShadow: 3, cursor: 'pointer' }
      }}
    >
      <CardContent sx={{ py: 1.5, px: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
              {appointment.time} - {appointment.endTime}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
              <Chip 
                icon={<PersonIcon />} 
                label={appointment.patient} 
                size="small" 
                variant="outlined"
              />
              <Chip 
                icon={<DoctorIcon />} 
                label={appointment.doctor} 
                size="small" 
                variant="outlined"
                color="primary"
              />
              <Chip 
                icon={<RoomIcon />} 
                label={appointment.room} 
                size="small" 
                variant="outlined"
                color="secondary"
              />
            </Box>
            
            <Typography variant="body2" sx={{ mt: 1, fontWeight: 500 }}>
              {appointment.treatment}
            </Typography>
          </Box>
          
          <Chip 
            label={appointment.status} 
            size="small"
            sx={{ 
              backgroundColor: getStatusColor(appointment.status),
              color: 'white',
              fontWeight: 600
            }}
          />
        </Box>
      </CardContent>
    </Card>
  )
}

export default function DashboardHome({ stats }: DashboardHomeProps) {
  const [appointments, setAppointments] = useState<any[]>([])
  const [lastWhatsAppSent, setLastWhatsAppSent] = useState<string | null>(null)

  // Datos de ejemplo - estos vendrán del backend
  useEffect(() => {
    // Simular carga de citas
    setAppointments([
      { 
        id: 1, 
        patient: 'Ana García', 
        time: '09:00', 
        endTime: '09:30',
        treatment: 'Consulta General', 
        doctor: 'Dra. González',
        room: 'Consulta 1',
        status: 'COMPLETADA'
      },
      { 
        id: 2, 
        patient: 'Juan López', 
        time: '10:00',
        endTime: '10:45', 
        treatment: 'Botox Completo', 
        doctor: 'Dr. Martínez',
        room: 'Consulta 2',
        status: 'EN_CURSO'
      },
      { 
        id: 3, 
        patient: 'María Rodríguez', 
        time: '11:00',
        endTime: '12:00', 
        treatment: 'Láser Facial', 
        doctor: 'Dra. González',
        room: 'Consulta 1',
        status: 'CONFIRMADA'
      },
      { 
        id: 4, 
        patient: 'Carlos Fernández', 
        time: '12:00',
        endTime: '12:45', 
        treatment: 'Peeling Químico', 
        doctor: 'Dr. Martínez',
        room: 'Consulta 2',
        status: 'PROGRAMADA'
      },
      { 
        id: 5, 
        patient: 'Laura Sánchez', 
        time: '16:00',
        endTime: '16:30', 
        treatment: 'Consulta General', 
        doctor: 'Dra. González',
        room: 'Consulta 1',
        status: 'PROGRAMADA'
      },
      { 
        id: 6, 
        patient: 'Pedro Martín', 
        time: '17:00',
        endTime: '17:45', 
        treatment: 'Infiltración', 
        doctor: 'Dr. Martínez',
        room: 'Quirófano',
        status: 'PROGRAMADA'
      }
    ])

    // Verificar si se enviaron los WhatsApp automáticos
    checkWhatsAppStatus()
  }, [])

  const checkWhatsAppStatus = () => {
    // Aquí verificaremos el estado del envío automático
    const lastSent = localStorage.getItem('lastWhatsAppReminderDate')
    if (lastSent === format(new Date(), 'yyyy-MM-dd')) {
      setLastWhatsAppSent('Recordatorios enviados hoy a las 19:00')
    }
  }

  const refreshAppointments = () => {
    // Recargar citas
    console.log('Recargando citas...')
  }

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">
          {format(new Date(), "EEEE d 'de' MMMM 'de' yyyy", { locale: es })}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <IconButton onClick={refreshAppointments} title="Actualizar">
            <RefreshIcon />
          </IconButton>
          <Button variant="contained" startIcon={<AddIcon />}>
            Nueva Cita
          </Button>
        </Box>
      </Box>

      {lastWhatsAppSent && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {lastWhatsAppSent}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Calendario de citas del día - ocupa la mayor parte */}
        <Grid item xs={12} md={9}>
          <Paper sx={{ p: 2, height: 'calc(100vh - 250px)', overflowY: 'auto' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Agenda del Día - {appointments.length} citas
              </Typography>
              <Chip 
                icon={<TimeIcon />} 
                label={format(new Date(), 'HH:mm')} 
                color="primary"
              />
            </Box>
            
            <Box>
              {appointments.length === 0 ? (
                <Typography color="textSecondary" sx={{ textAlign: 'center', py: 4 }}>
                  No hay citas programadas para hoy
                </Typography>
              ) : (
                appointments.map((appointment) => (
                  <AppointmentCard key={appointment.id} appointment={appointment} />
                ))
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Panel lateral con estadísticas reducidas */}
        <Grid item xs={12} md={3}>
          <Grid container spacing={2}>
            {/* Citas de hoy */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography color="textSecondary" gutterBottom variant="body2">
                        Citas Hoy
                      </Typography>
                      <Typography variant="h4">
                        {stats.todayAppointments}
                      </Typography>
                    </Box>
                    <CalendarIcon sx={{ fontSize: 32, color: 'primary.main' }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Facturas pendientes */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography color="textSecondary" gutterBottom variant="body2">
                        Facturas Pendientes
                      </Typography>
                      <Typography variant="h4">
                        {stats.pendingBills}
                      </Typography>
                    </Box>
                    <ReceiptIcon sx={{ fontSize: 32, color: 'warning.main' }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Accesos rápidos */}
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Accesos Rápidos
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Button variant="outlined" fullWidth size="small">
                    Nuevo Paciente
                  </Button>
                  <Button variant="outlined" fullWidth size="small">
                    Buscar Paciente
                  </Button>
                  <Button variant="outlined" fullWidth size="small">
                    Ver Agenda Completa
                  </Button>
                  <Button variant="outlined" fullWidth size="small">
                    Nueva Factura
                  </Button>
                </Box>
              </Paper>
            </Grid>

            {/* Info de WhatsApp automático */}
            <Grid item xs={12}>
              <Paper sx={{ p: 2, bgcolor: 'success.light' }}>
                <Typography variant="body2" sx={{ color: 'success.dark' }}>
                  💬 Los recordatorios de WhatsApp se envían automáticamente cada día a las 19:00
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  )
}