import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Paper,
  Button,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
  Alert,
  Snackbar,
  CircularProgress,
  IconButton,
  Menu,
  MenuItem,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  CalendarMonth as CalendarIcon,
  ViewWeek as WeekIcon,
  ViewDay as DayIcon,
  MoreVert as MoreVertIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  PersonOff as PersonOffIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import { format } from 'date-fns';
import { appointmentService } from '../services/appointmentService';
import AppointmentFormModal from '../components/appointments/AppointmentFormModal';
import './AppointmentsPage.css';

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
    clickedDate.setHours(9, 0, 0, 0);
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
    event.stopPropagation();
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

  const handleDeleteAppointment = async () => {
    if (!menuAppointment) return;
    
    if (!window.confirm('¿Está seguro de eliminar esta cita?')) {
      handleMenuClose();
      return;
    }
    
    try {
      await appointmentService.delete(menuAppointment.id);
      showSnackbar('Cita eliminada correctamente', 'success');
      loadAppointments();
      handleMenuClose();
    } catch (error) {
      showSnackbar('Error al eliminar la cita', 'error');
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

  return (
    <Box sx={{ 
      p: 0, 
      m: 0, 
      width: '100%', 
      height: 'calc(100vh - 64px)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <Box sx={{ 
        px: 4, 
        pt: 2, 
        pb: 2, 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
        flexShrink: 0
      }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
            Calendario de Citas
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
            {appointments.length} citas programadas
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
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
              <Tooltip title="Vista Mensual">
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CalendarIcon sx={{ mr: 0.5 }} fontSize="small" />
                  Mes
                </Box>
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="timeGridWeek">
              <Tooltip title="Vista Semanal">
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <WeekIcon sx={{ mr: 0.5 }} fontSize="small" />
                  Semana
                </Box>
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="timeGridDay">
              <Tooltip title="Vista Diaria">
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <DayIcon sx={{ mr: 0.5 }} fontSize="small" />
                  Día
                </Box>
              </Tooltip>
            </ToggleButton>
          </ToggleButtonGroup>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setFormMode('create');
              setSelectedAppointment(null);
              setSelectedDate(new Date());
              setModalOpen(true);
            }}
            size="large"
          >
            Nueva Cita
          </Button>
        </Box>
      </Box>

      {/* Calendario - Pantalla Completa */}
      <Box sx={{ 
        flex: 1,
        px: 3, 
        py: 2, 
        overflow: 'auto',
        minHeight: 0
      }}>
        <Paper sx={{ 
          p: 2, 
          height: '100%',
          minHeight: '700px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box sx={{ 
              flex: 1, 
              minHeight: 0,
              '& .fc': { 
                height: '100% !important',
                minHeight: '650px'
              },
              '& .fc-view-harness': {
                height: '100% !important'
              },
              '& .fc-scrollgrid': {
                height: '100% !important'
              },
              '& .fc-timegrid-body': {
                height: 'auto !important'
              },
              '& .fc-scroller': {
                overflow: 'auto !important'
              }
            }}>
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
                height="100%"
                contentHeight="auto"
                slotMinTime="08:00:00"
                slotMaxTime="21:00:00"
                slotDuration="00:30:00"
                expandRows={true}
                dayMaxEvents={false}
                allDaySlot={false}
                nowIndicator={true}
                scrollTime="08:00:00"
                slotLabelInterval="01:00:00"
                businessHours={{
                  daysOfWeek: [1, 2, 3, 4, 5, 6],
                  startTime: '09:00',
                  endTime: '20:00'
                }}
                eventDisplay="block"
                slotEventOverlap={true}
                dayMaxEventRows={false}
                eventContent={(arg) => {
                  const event = arg.event;
                  const isMonthView = view === 'dayGridMonth';
                  
                  // Formato simplificado que funciona mejor con FullCalendar
                  return (
                    <div style={{ 
                      padding: '2px 4px',
                      width: '100%',
                      height: '100%',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      fontSize: '11px',
                      color: 'white'
                    }}>
                      <div style={{ fontWeight: 'bold', fontSize: '10px' }}>
                        {arg.timeText}
                      </div>
                      <div style={{ 
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        marginTop: '2px'
                      }}>
                        {event.extendedProps?.patient?.firstName} {event.extendedProps?.patient?.lastName}
                      </div>
                      {!isMonthView && (
                        <div style={{ 
                          fontSize: '10px',
                          opacity: 0.9,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {event.extendedProps?.treatment?.name}
                        </div>
                      )}
                    </div>
                  );
                }}
              />
            </Box>
          )}
        </Paper>
      </Box>

      {/* Menu contextual */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          if (menuAppointment) {
            setSelectedAppointment(menuAppointment);
            setFormMode('edit');
            setModalOpen(true);
            handleMenuClose();
          }
        }}>
          <EditIcon sx={{ mr: 1 }} fontSize="small" />
          Editar cita
        </MenuItem>
        <MenuItem onClick={handleConfirmAppointment}>
          <CheckCircleIcon sx={{ mr: 1 }} fontSize="small" color="success" />
          Confirmar cita
        </MenuItem>
        <MenuItem onClick={handleCancelAppointment}>
          <CancelIcon sx={{ mr: 1 }} fontSize="small" color="warning" />
          Cancelar cita
        </MenuItem>
        <MenuItem onClick={handleMarkNoShow}>
          <PersonOffIcon sx={{ mr: 1 }} fontSize="small" color="error" />
          No presentado
        </MenuItem>
        <MenuItem onClick={handleDeleteAppointment} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
          Eliminar cita
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