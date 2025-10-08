import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Paper,
  Button,
  Typography,
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
  CircularProgress,
  IconButton,
  Menu,
  MenuItem
} from '@mui/material';
import {
  Add as AddIcon,
  CalendarMonth as CalendarIcon,
  ViewWeek as WeekIcon,
  ViewDay as DayIcon,
  Person as PersonIcon,
  MoreVert as MoreVertIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  PersonOff as PersonOffIcon
} from '@mui/icons-material';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import { format, parseISO } from 'date-fns';
import { appointmentService } from '../services/appointmentService';
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
  const [view, setView] = useState('timeGridWeek');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');

  // Menu contextual
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuAppointment, setMenuAppointment] = useState<Appointment | null>(null);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info'
  });

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const data = await appointmentService.getAll();
      
      // Transformar datos al formato de FullCalendar
      const formattedAppointments = data.map((apt: any) => ({
        id: apt.id,
        title: apt.title || `${apt.patient?.firstName} ${apt.patient?.lastName} - ${apt.treatment?.name}`,
        start: apt.start || apt.startTime,
        end: apt.end || apt.endTime,
        color: apt.color || getColorByStatus(apt.status),
        extendedProps: {
          patient: apt.patient,
          doctor: apt.doctor,
          room: apt.room,
          treatment: apt.treatment,
          status: apt.status,
          observations: apt.observations
        }
      }));
      
      setAppointments(formattedAppointments);
    } catch (error: any) {
      console.error('Error loading appointments:', error);
      if (error.response?.status === 401) {
        showSnackbar('Sesión expirada. Por favor, inicia sesión nuevamente', 'error');
      } else {
        showSnackbar('Error al cargar las citas', 'error');
      }
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

  const handleDateClick = (arg: any) => {
    const clickedDate = new Date(arg.date);
    clickedDate.setHours(9, 0, 0, 0); // Hora por defecto 9:00 AM
    setSelectedDate(clickedDate);
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
      
      const result = await appointmentService.checkAvailability({
        date: format(event.start, 'yyyy-MM-dd'),
        startTime: event.start.toISOString(),
        endTime: event.end.toISOString(),
        roomId: event.extendedProps.room.id,
        doctorId: event.extendedProps.doctor.id,
        excludeAppointmentId: event.id
      });

      if (!result.available) {
        arg.revert();
        showSnackbar('El horario no está disponible', 'error');
        return;
      }

      await appointmentService.update(event.id, {
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

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, appointment: Appointment) => {
    setAnchorEl(event.currentTarget);
    setMenuAppointment(appointment);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuAppointment(null);
  };

  const handleConfirmAppointment = async () => {
    if (!menuAppointment) return;
    
    try {
      await appointmentService.confirm(menuAppointment.id);
      showSnackbar('Cita confirmada correctamente', 'success');
      loadAppointments();
      handleMenuClose();
    } catch (error) {
      showSnackbar('Error al confirmar la cita', 'error');
    }
  };

  const handleCancelAppointment = async () => {
    if (!menuAppointment) return;
    
    try {
      await appointmentService.cancel(menuAppointment.id);
      showSnackbar('Cita cancelada correctamente', 'success');
      loadAppointments();
      handleMenuClose();
    } catch (error) {
      showSnackbar('Error al cancelar la cita', 'error');
    }
  };

  const handleMarkNoShow = async () => {
    if (!menuAppointment) return;
    
    try {
      await appointmentService.markNoShow(menuAppointment.id);
      showSnackbar('Cita marcada como no presentado', 'success');
      loadAppointments();
      handleMenuClose();
    } catch (error) {
      showSnackbar('Error al marcar la cita', 'error');
    }
  };

  const getColorByStatus = (status: string): string => {
    const colors: Record<string, string> = {
      PROGRAMADA: '#2196F3',
      CONFIRMADA: '#4CAF50',
      EN_CURSO: '#FF9800',
      COMPLETADA: '#9E9E9E',
      CANCELADA: '#F44336',
      NO_SHOW: '#795548'
    };
    return colors[status] || '#2196F3';
  };

  const getStatusChip = (status: string) => {
    const statusConfig: Record<string, any> = {
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

  const todayAppointments = appointments.filter(apt => {
    const today = format(new Date(), 'yyyy-MM-dd');
    return apt.start.startsWith(today);
  });

  return (
    <Box sx={{ p: 0, m: 0, width: '100%', maxWidth: '100%' }}>
      {/* Header */}
      <Box sx={{ px: 4, pt: 3, pb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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

      {/* Contenido */}
      <Box sx={{ px: 4, pb: 4, display: 'flex', gap: 3 }}>
        {/* Calendario */}
        <Box sx={{ flex: 1 }}>
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
                  <CalendarIcon sx={{ mr: 1 }} /> Mes
                </ToggleButton>
                <ToggleButton value="timeGridWeek">
                  <WeekIcon sx={{ mr: 1 }} /> Semana
                </ToggleButton>
                <ToggleButton value="timeGridDay">
                  <DayIcon sx={{ mr: 1 }} /> Día
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
                slotMinTime="08:00:00"
                slotMaxTime="21:00:00"
                slotDuration="00:30:00"
                businessHours={{
                  daysOfWeek: [1, 2, 3, 4, 5, 6],
                  startTime: '09:00',
                  endTime: '20:00'
                }}
                eventContent={(arg) => (
                  <Box sx={{ 
                    p: 0.5, 
                    width: '100%',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <Typography variant="caption" sx={{ 
                      fontWeight: 500, 
                      color: 'white',
                      fontSize: '0.75rem'
                    }}>
                      {arg.timeText} - {arg.event.title}
                    </Typography>
                    <IconButton 
                      size="small" 
                      sx={{ 
                        color: 'white', 
                        p: 0,
                        minWidth: 20,
                        height: 20
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMenuOpen(e, {
                          id: arg.event.id,
                          title: arg.event.title,
                          start: arg.event.startStr,
                          end: arg.event.endStr,
                          color: arg.event.backgroundColor,
                          extendedProps: arg.event.extendedProps
                        });
                      }}
                    >
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  </Box>
                )}
              />
            )}
          </Paper>
        </Box>

        {/* Panel lateral - Citas de hoy */}
        <Box sx={{ width: 350, flexShrink: 0 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Citas de Hoy ({todayAppointments.length})
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <List sx={{ maxHeight: 600, overflow: 'auto' }}>
                {todayAppointments.length === 0 ? (
                  <Typography variant="body2" color="textSecondary" sx={{ p: 2, textAlign: 'center' }}>
                    No hay citas programadas para hoy
                  </Typography>
                ) : (
                  todayAppointments.map((apt) => (
                    <ListItem 
                      key={apt.id} 
                      component="div"
                      sx={{ 
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'action.hover' },
                        borderLeft: `4px solid ${apt.color}`,
                        mb: 1
                      }}
                      onClick={() => {
                        setSelectedAppointment(apt);
                        setFormMode('edit');
                        setModalOpen(true);
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: apt.color }}>
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
                            {apt.extendedProps && (
                              <Box sx={{ mt: 0.5 }}>
                                {getStatusChip(apt.extendedProps.status)}
                              </Box>
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                  ))
                )}
              </List>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Menu contextual */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleConfirmAppointment}>
          <CheckCircleIcon sx={{ mr: 1 }} fontSize="small" />
          Confirmar cita
        </MenuItem>
        <MenuItem onClick={handleCancelAppointment}>
          <CancelIcon sx={{ mr: 1 }} fontSize="small" />
          Cancelar cita
        </MenuItem>
        <MenuItem onClick={handleMarkNoShow}>
          <PersonOffIcon sx={{ mr: 1 }} fontSize="small" />
          Marcar no presentado
        </MenuItem>
      </Menu>

      {/* Modal de formulario */}
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