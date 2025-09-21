import { useState, useMemo } from 'react'
import {
  Box,
  Paper,
  Typography,
  Button,
  ButtonGroup,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  Chip
} from '@mui/material'
import {
  ChevronLeft,
  ChevronRight,
  Today,
  Add as AddIcon,
  Search as SearchIcon
} from '@mui/icons-material'
import { format, startOfWeek, addDays, addWeeks } from 'date-fns'
import { es } from 'date-fns/locale'

interface Appointment {
  id: number
  patientName: string
  doctorName: string
  treatmentType: string
  startTime: string
  endTime: string
  room: string
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled'
  color: string
}

const timeSlots = [
  '9:00', '9:30', '10:00', '10:30', '11:00', '11:30', 
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', 
  '18:00', '18:30', '19:00', '19:30', '20:00'
]

export default function WeekCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewType, setViewType] = useState<'day' | 'week' | 'month'>('week')
  const [selectedRoom, setSelectedRoom] = useState('TODAS')

  // Datos de ejemplo de citas
  const appointments: Appointment[] = [
    {
      id: 1,
      patientName: 'Ana García',
      doctorName: 'Dra. González',
      treatmentType: 'Botox',
      startTime: '10:00',
      endTime: '10:45',
      room: 'Consulta 1',
      status: 'confirmed',
      color: '#4caf50'
    },
    {
      id: 2,
      patientName: 'Juan López',
      doctorName: 'Dr. Martínez',
      treatmentType: 'Consulta',
      startTime: '10:30',
      endTime: '11:00',
      room: 'Consulta 2',
      status: 'pending',
      color: '#2196f3'
    },
    {
      id: 3,
      patientName: 'María Rodríguez',
      doctorName: 'Dra. González',
      treatmentType: 'Láser',
      startTime: '11:00',
      endTime: '12:00',
      room: 'Consulta 1',
      status: 'confirmed',
      color: '#9c27b0'
    },
    {
      id: 4,
      patientName: 'Carlos Fernández',
      doctorName: 'Dr. Martínez',
      treatmentType: 'Peeling',
      startTime: '16:00',
      endTime: '16:45',
      room: 'Consulta 2',
      status: 'confirmed',
      color: '#ff9800'
    }
  ]

  const getWeekDays = () => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 })
    return Array.from({ length: 5 }, (_, i) => addDays(start, i))
  }

  const handlePrevious = () => {
    if (viewType === 'week') {
      setCurrentDate(prev => addWeeks(prev, -1))
    } else if (viewType === 'day') {
      setCurrentDate(prev => addDays(prev, -1))
    }
  }

  const handleNext = () => {
    if (viewType === 'week') {
      setCurrentDate(prev => addWeeks(prev, 1))
    } else if (viewType === 'day') {
      setCurrentDate(prev => addDays(prev, 1))
    }
  }

  const handleToday = () => {
    setCurrentDate(new Date())
  }

  // Función para detectar y manejar solapamientos
  const getAppointmentsForDay = (dayDate: Date) => {
    // Aquí filtrarías las citas del día específico
    return appointments
  }

  const checkOverlap = (apt1: Appointment, apt2: Appointment) => {
    const start1 = timeSlots.indexOf(apt1.startTime)
    const end1 = timeSlots.indexOf(apt1.endTime)
    const start2 = timeSlots.indexOf(apt2.startTime)
    const end2 = timeSlots.indexOf(apt2.endTime)
    
    return start1 < end2 && start2 < end1
  }

  const getAppointmentPosition = (appointment: Appointment, dayAppointments: Appointment[]) => {
    const overlapping = dayAppointments.filter(apt => 
      apt.id !== appointment.id && checkOverlap(appointment, apt)
    )
    
    const position = overlapping.findIndex(apt => apt.id === appointment.id) + 1
    const totalOverlapping = overlapping.length + 1
    
    return { position, totalOverlapping }
  }

  const getAppointmentStyle = (appointment: Appointment, dayAppointments: Appointment[]) => {
    const startIndex = timeSlots.indexOf(appointment.startTime)
    const endIndex = timeSlots.indexOf(appointment.endTime)
    
    if (startIndex === -1 || endIndex === -1) return {}
    
    const { position, totalOverlapping } = getAppointmentPosition(appointment, dayAppointments)
    const duration = endIndex - startIndex
    const top = startIndex * 40
    const height = duration * 40 - 2
    const width = totalOverlapping > 1 ? `${90 / totalOverlapping}%` : '90%'
    const left = totalOverlapping > 1 ? `${(position - 1) * (90 / totalOverlapping) + 5}%` : '5%'

    return {
      position: 'absolute' as const,
      top: `${top}px`,
      left: left,
      width: width,
      height: `${height}px`,
      backgroundColor: appointment.color,
      borderRadius: '6px',
      padding: '6px',
      color: 'white',
      fontSize: '11px',
      cursor: 'pointer',
      zIndex: 1,
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      border: '1px solid rgba(255,255,255,0.3)',
      overflow: 'hidden'
    }
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header con controles */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 2,
        px: 2,
        pt: 2
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button 
            variant="contained" 
            color="success" 
            size="small"
            startIcon={<AddIcon />}
          >
            NUEVA CITA
          </Button>
          <Button 
            variant="outlined" 
            size="small"
            startIcon={<SearchIcon />}
          >
            BÚSQUEDA
          </Button>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FormControl size="small">
            <Select 
              value={selectedRoom} 
              onChange={(e) => setSelectedRoom(e.target.value)}
              sx={{ minWidth: 120 }}
            >
              <MenuItem value="TODAS">Todas las salas</MenuItem>
              <MenuItem value="Consulta 1">Consulta 1</MenuItem>
              <MenuItem value="Consulta 2">Consulta 2</MenuItem>
              <MenuItem value="Quirófano">Quirófano</MenuItem>
            </Select>
          </FormControl>

          <ButtonGroup size="small" variant="outlined">
            <Button 
              variant={viewType === 'day' ? 'contained' : 'outlined'}
              onClick={() => setViewType('day')}
            >
              DÍA
            </Button>
            <Button 
              variant={viewType === 'week' ? 'contained' : 'outlined'}
              onClick={() => setViewType('week')}
            >
              SEMANA
            </Button>
            <Button 
              variant={viewType === 'month' ? 'contained' : 'outlined'}
              onClick={() => setViewType('month')}
            >
              MES
            </Button>
          </ButtonGroup>

          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton size="small" onClick={handlePrevious}>
              <ChevronLeft />
            </IconButton>
            <Button onClick={handleToday} size="small">HOY</Button>
            <IconButton size="small" onClick={handleNext}>
              <ChevronRight />
            </IconButton>
          </Box>
        </Box>
      </Box>

      {/* Título con fecha */}
      <Box sx={{ textAlign: 'center', mb: 1, px: 2 }}>
        <Typography variant="h6">
          {viewType === 'week' && 
            `${format(getWeekDays()[0], 'd', { locale: es })} - ${format(getWeekDays()[4], 'd MMM yyyy', { locale: es })}`
          }
          {viewType === 'day' && format(currentDate, 'EEEE, d MMMM yyyy', { locale: es })}
        </Typography>
      </Box>

      {/* Vista de calendario - ocupa todo el espacio restante */}
      <Paper sx={{ 
        flex: 1, 
        display: 'flex', 
        overflow: 'hidden',
        mx: 2,
        mb: 2
      }}>
        <Box sx={{ display: 'flex', flex: 1, overflow: 'auto' }}>
          {/* Columna de horas */}
          <Box sx={{ width: '70px', flexShrink: 0, borderRight: '2px solid #e0e0e0' }}>
            <Box sx={{ height: '60px', borderBottom: '2px solid #e0e0e0' }} />
            {timeSlots.map((time) => (
              <Box key={time} sx={{ 
                height: '40px', 
                borderBottom: '1px solid #f0f0f0', 
                fontSize: '12px', 
                px: 1,
                display: 'flex',
                alignItems: 'center',
                color: '#666'
              }}>
                {time}
              </Box>
            ))}
          </Box>

          {/* Columnas de días */}
          {viewType === 'week' ? (
            getWeekDays().map((day, dayIndex) => (
              <Box key={dayIndex} sx={{ 
                flex: 1, 
                borderRight: dayIndex < 4 ? '1px solid #e0e0e0' : 'none',
                minWidth: '150px'
              }}>
                {/* Header del día */}
                <Box sx={{ 
                  height: '60px', 
                  borderBottom: '2px solid #e0e0e0', 
                  p: 1,
                  textAlign: 'center',
                  bgcolor: format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') ? '#e3f2fd' : '#f5f5f5'
                }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {format(day, 'EEEE', { locale: es }).toUpperCase()}
                  </Typography>
                  <Typography variant="h6">
                    {format(day, 'd')}
                  </Typography>
                </Box>

                {/* Contenedor de citas del día */}
                <Box sx={{ position: 'relative' }}>
                  {/* Time slots background */}
                  {timeSlots.map((_, index) => (
                    <Box
                      key={index}
                      sx={{
                        height: '40px',
                        borderBottom: '1px solid #f5f5f5',
                        '&:hover': { bgcolor: '#fafafa' }
                      }}
                    />
                  ))}

                  {/* Citas */}
                  {getAppointmentsForDay(day).map((appointment) => (
                    <Box
                      key={appointment.id}
                      sx={getAppointmentStyle(appointment, getAppointmentsForDay(day))}
                      title={`${appointment.startTime} - ${appointment.endTime}\n${appointment.patientName}\n${appointment.treatmentType}`}
                    >
                      <Typography sx={{ fontWeight: 'bold', fontSize: '11px' }}>
                        {appointment.startTime} - {appointment.endTime}
                      </Typography>
                      <Typography sx={{ fontSize: '10px', fontWeight: 600 }}>
                        {appointment.patientName}
                      </Typography>
                      <Typography sx={{ fontSize: '9px', opacity: 0.9 }}>
                        {appointment.treatmentType}
                      </Typography>
                      <Typography sx={{ fontSize: '9px', fontStyle: 'italic' }}>
                        {appointment.doctorName}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            ))
          ) : (
            <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Typography>Vista de {viewType} - Por implementar</Typography>
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  )
}