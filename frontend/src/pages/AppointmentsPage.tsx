// frontend/src/pages/AppointmentsPage.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Paper,
  Button,
  Typography,
  Grid,
  Chip,
  ToggleButtonGroup,
  ToggleButton,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  Alert,
  Snackbar,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  CalendarMonth as CalendarIcon,
  ViewWeek as WeekIcon,
  ViewDay as DayIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import { format, parseISO } from 'date-fns';
import api from '../services/api';
import AppointmentFormModal from '../components/appointments/AppointmentFormModal';

interface Appointment {
  id: string;
  title: string;
  start: string;
  end: string;
  color: string;
  extendedProps?: {
    patient: any;
    doctor: any;
    room: any;
    treatment: any;
    status: string;
    observations?: string;
  };
}

export default function AppointmentsPage() {
  const calendarRef = useRef<FullCalendar>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('dayGridMonth');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info'
  });

  // Cargar citas
  const loadAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      console.log('Token en localStorage:', token);
      console.log('Headers de API:', api.defaults.headers.common);


      const response = await api.get('/appointments');
      setAppointments(response.data);
    } catch (error) {
      console.error('Error loading appointments:', error);
      showSnackbar('Error al cargar las citas', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  // Manejadores del calendario
  const handleDateClick = (arg: any) => {
    setSelectedDate(arg.date);
    setFormMode('create');
    setSelectedAppointment(null);
    setModalOpen(true);
  };

  const handleEventClick = (arg: any) => {
    const appointment = arg.event;
    setSelectedAppointment({
      id: appointment.id,
      title: appointment.title,
      start: appointment.startStr,
      end: appointment.endStr,
      color: appointment.backgroundColor,
      extendedProps: appointment.extendedProps
    });
    
    setFormMode('edit');
    setModalOpen(true);
  };

  const handleEventDrop = async (arg: any) => {
    try {
      const { event } = arg;
      
      // Verificar disponibilidad
      const checkResponse = await api.post('/appointments/check-availability', {
        date: format(event.start, 'yyyy-MM-dd'),
        startTime: event.start.toISOString(),
        endTime: event.end.toISOString(),
        roomId: event.extendedProps.room.id,
        doctorId: event.extendedProps.doctor.id,
        excludeAppointmentId: event.id
      });

      if (!checkResponse.data.available) {
        arg.revert();
        showSnackbar('El horario no está disponible', 'error');
        return;
      }

      // Actualizar la cita
      await api.patch(`/appointments/${event.id}`, {
        date: format(event.start, 'yyyy-MM-dd'),
        startTime: event.start.toISOString(),
        endTime: event.end.toISOString()
      });

      showSnackbar('Cita movida correctamente', 'success');
      loadAppointments();
    } catch (error) {
      arg.revert();
      showSnackbar('Error al mover la cita', 'error');
    }
  };

  const getStatusChip = (status: string) => {
    const statusConfig: any = {
      PROGRAMADA: { color: 'default', label: 'Programada' },
      CONFIRMADA: { color: 'success', label: 'Confirmada' },
      EN_CURSO: { color: 'warning', label: 'En curso' },
      COMPLETADA: { color: 'info', label: 'Completada' },
      CANCELADA: { color: 'error', label: 'Cancelada' },
      NO_SHOW: { color: 'error', label: 'No presentado' }
    };
    
    const config = statusConfig[status] || statusConfig.PROGRAMADA;
    return <Chip label={config.label} color={config.color} size="small" />;
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Calendario de Citas
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setFormMode('create');
            setSelectedAppointment(null);
            setSelectedDate(new Date());
            setModalOpen(true);
          }}
        >
          Nueva Cita
        </Button>
      </Box>

      {/* Vista del calendario */}
      <Grid container spacing={3}>
        <Grid item xs={12} lg={9}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between' }}>
              <ToggleButtonGroup
                value={view}
                exclusive
                onChange={(e, newView) => {
                  if (newView) {
                    setView(newView);
                    if (calendarRef.current) {
                      calendarRef.current.getApi().changeView(newView);
                    }
                  }
                }}
                size="small"
              >
                <ToggleButton value="dayGridMonth">
                  <CalendarIcon /> Mes
                </ToggleButton>
                <ToggleButton value="timeGridWeek">
                  <WeekIcon /> Semana
                </ToggleButton>
                <ToggleButton value="timeGridDay">
                  <DayIcon /> Día
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                <CircularProgress />
              </Box>
            ) : (
              <FullCalendar
                ref={calendarRef}
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView={view}
                locale={esLocale}
                headerToolbar={{
                  left: 'prev,next today',
                  center: 'title',
                  right: ''
                }}
                events={appointments}
                dateClick={handleDateClick}
                eventClick={handleEventClick}
                eventDrop={handleEventDrop}
                editable={true}
                droppable={true}
                height="auto"
                slotMinTime="09:00:00"
                slotMaxTime="20:00:00"
                slotDuration="00:30:00"
                businessHours={{
                  daysOfWeek: [1, 2, 3, 4, 5, 6],
                  startTime: '09:00',
                  endTime: '20:00'
                }}
              />
            )}
          </Paper>
        </Grid>

        {/* Panel lateral con citas del día */}
        <Grid item xs={12} lg={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Citas de Hoy
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <List>
                {appointments
                  .filter(apt => {
                    const today = format(new Date(), 'yyyy-MM-dd');
                    return apt.start.startsWith(today);
                  })
                  .map((apt) => (
                    <ListItem 
                      key={apt.id} 
                      component="div"
                      sx={{ cursor: 'pointer' }}
                      onClick={() => {
                        setSelectedAppointment(apt);
                        setFormMode('edit');
                        setModalOpen(true);
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar>
                          <PersonIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={apt.title}
                        secondary={
                          <Box>
                            <Typography variant="caption" display="block">
                              {format(parseISO(apt.start), 'HH:mm')} - {format(parseISO(apt.end), 'HH:mm')}
                            </Typography>
                            {apt.extendedProps && getStatusChip(apt.extendedProps.status)}
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                {appointments.filter(apt => {
                  const today = format(new Date(), 'yyyy-MM-dd');
                  return apt.start.startsWith(today);
                }).length === 0 && (
                  <Typography variant="body2" color="textSecondary" sx={{ p: 2, textAlign: 'center' }}>
                    No hay citas programadas para hoy
                  </Typography>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Modal de formulario mejorado */}
      <AppointmentFormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedAppointment(null);
        }}
        onSave={() => {
          loadAppointments();
          setModalOpen(false);
          showSnackbar(
            formMode === 'create' ? 'Cita creada correctamente' : 'Cita actualizada correctamente',
            'success'
          );
        }}
        appointment={selectedAppointment}
        mode={formMode}
        selectedDate={selectedDate}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}