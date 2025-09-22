import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Paper,
  Button,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Grid,
  Chip,
  IconButton,
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
  Person as PersonIcon,
  MedicalServices as MedicalIcon,
  Room as RoomIcon,
  AccessTime as TimeIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Phone as PhoneIcon,
  WhatsApp as WhatsAppIcon
} from '@mui/icons-material';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import api from '../services/api';

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
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  
  // Datos para los selectores
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [treatments, setTreatments] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);

  // Estado del formulario
  const [formData, setFormData] = useState({
    patientId: '',
    doctorId: '',
    roomId: '',
    treatmentId: '',
    date: '',
    startTime: '',
    endTime: '',
    observations: ''
  });

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info'
  });

  // Cargar citas
  const loadAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/appointments');
      setAppointments(response.data);
    } catch (error) {
      console.error('Error loading appointments:', error);
      showSnackbar('Error al cargar las citas', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar datos auxiliares
  const loadAuxiliaryData = async () => {
    try {
      const [patientsRes, doctorsRes, roomsRes, treatmentsRes] = await Promise.all([
        api.get('/patients'),
        api.get('/staff'),
        api.get('/rooms'),
        api.get('/treatments')
      ]);

      setPatients(patientsRes.data.data || patientsRes.data);
      setDoctors(doctorsRes.data);
      setRooms(roomsRes.data);
      setTreatments(treatmentsRes.data);
    } catch (error) {
      console.error('Error loading auxiliary data:', error);
    }
  };

  useEffect(() => {
    loadAppointments();
    loadAuxiliaryData();
  }, [loadAppointments]);

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  // Manejadores del calendario
  const handleDateClick = (arg: any) => {
    setSelectedDate(arg.date);
    setFormData({
      ...formData,
      date: format(arg.date, 'yyyy-MM-dd'),
      patientId: '',
      doctorId: '',
      roomId: '',
      treatmentId: '',
      startTime: '',
      endTime: '',
      observations: ''
    });
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
    
    setFormData({
      patientId: appointment.extendedProps.patient?.id || '',
      doctorId: appointment.extendedProps.doctor?.id || '',
      roomId: appointment.extendedProps.room?.id || '',
      treatmentId: appointment.extendedProps.treatment?.id || '',
      date: format(new Date(appointment.start), 'yyyy-MM-dd'),
      startTime: appointment.startStr,
      endTime: appointment.endStr,
      observations: appointment.extendedProps.observations || ''
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

  // Manejadores del formulario
  const handleFormChange = (field: string) => (event: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));

    // Si cambia el tratamiento, actualizar duración
    if (field === 'treatmentId') {
      const treatment = treatments.find((t: any) => t.id === event.target.value);
      if (treatment && formData.startTime) {
        const startTime = new Date(formData.startTime);
        const endTime = new Date(startTime);
        endTime.setMinutes(endTime.getMinutes() + (treatment.duration || 60));
        setFormData(prev => ({
          ...prev,
          endTime: endTime.toISOString()
        }));
      }
    }
  };

  const loadAvailableSlots = async () => {
    if (formData.date && formData.doctorId && formData.treatmentId) {
      try {
        const response = await api.get('/appointments/available-slots', {
          params: {
            date: formData.date,
            doctorId: formData.doctorId,
            treatmentId: formData.treatmentId
          }
        });
        setAvailableSlots(response.data);
      } catch (error) {
        console.error('Error loading available slots:', error);
      }
    }
  };

  useEffect(() => {
    loadAvailableSlots();
  }, [formData.date, formData.doctorId, formData.treatmentId]);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      if (formMode === 'create') {
        await api.post('/appointments', formData);
        showSnackbar('Cita creada correctamente', 'success');
      } else if (selectedAppointment) {
        await api.patch(`/appointments/${selectedAppointment.id}`, formData);
        showSnackbar('Cita actualizada correctamente', 'success');
      }
      
      setModalOpen(false);
      loadAppointments();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Error al guardar la cita';
      showSnackbar(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedAppointment) return;
    
    try {
      setLoading(true);
      await api.delete(`/appointments/${selectedAppointment.id}`);
      showSnackbar('Cita eliminada correctamente', 'success');
      setModalOpen(false);
      loadAppointments();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Error al eliminar la cita';
      showSnackbar(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (appointmentId: string, action: 'confirm' | 'cancel' | 'no-show') => {
    try {
      await api.patch(`/appointments/${appointmentId}/${action}`);
      showSnackbar(`Cita ${action === 'confirm' ? 'confirmada' : action === 'cancel' ? 'cancelada' : 'marcada como no presentado'}`, 'success');
      loadAppointments();
      setModalOpen(false);
    } catch (error) {
      showSnackbar('Error al actualizar el estado', 'error');
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
            setFormData({
              patientId: '',
              doctorId: '',
              roomId: '',
              treatmentId: '',
              date: format(new Date(), 'yyyy-MM-dd'),
              startTime: '',
              endTime: '',
              observations: ''
            });
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
                    <ListItem key={apt.id} button onClick={() => handleEventClick({ event: apt })}>
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

      {/* Modal de formulario */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {formMode === 'create' ? 'Nueva Cita' : 'Editar Cita'}
          {selectedAppointment?.extendedProps && (
            <Box sx={{ mt: 1 }}>
              {getStatusChip(selectedAppointment.extendedProps.status)}
            </Box>
          )}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Paciente *"
                value={formData.patientId}
                onChange={handleFormChange('patientId')}
              >
                {patients.map((patient: any) => (
                  <MenuItem key={patient.id} value={patient.id}>
                    {patient.firstName} {patient.lastName}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Doctor *"
                value={formData.doctorId}
                onChange={handleFormChange('doctorId')}
              >
                {doctors.map((doctor: any) => (
                  <MenuItem key={doctor.id} value={doctor.id}>
                    Dr. {doctor.firstName} {doctor.lastName}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Sala *"
                value={formData.roomId}
                onChange={handleFormChange('roomId')}
              >
                {rooms.map((room: any) => (
                  <MenuItem key={room.id} value={room.id}>
                    {room.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Tratamiento *"
                value={formData.treatmentId}
                onChange={handleFormChange('treatmentId')}
              >
                {treatments.map((treatment: any) => (
                  <MenuItem key={treatment.id} value={treatment.id}>
                    {treatment.name} ({treatment.duration} min)
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="date"
                label="Fecha *"
                value={formData.date}
                onChange={handleFormChange('date')}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                select
                label="Hora de inicio *"
                value={formData.startTime}
                onChange={handleFormChange('startTime')}
              >
                {availableSlots.map((slot: any) => (
                  <MenuItem key={slot.start} value={slot.start}>
                    {slot.display}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="time"
                label="Hora de fin *"
                value={formData.endTime ? format(parseISO(formData.endTime), 'HH:mm') : ''}
                InputLabelProps={{ shrink: true }}
                disabled
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Observaciones"
                value={formData.observations}
                onChange={handleFormChange('observations')}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          {formMode === 'edit' && selectedAppointment && (
            <>
              <Button
                onClick={() => handleStatusChange(selectedAppointment.id, 'confirm')}
                color="success"
                startIcon={<CheckIcon />}
              >
                Confirmar
              </Button>
              <Button
                onClick={() => handleStatusChange(selectedAppointment.id, 'cancel')}
                color="warning"
                startIcon={<CancelIcon />}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleDelete}
                color="error"
                startIcon={<DeleteIcon />}
              >
                Eliminar
              </Button>
              <Box sx={{ flex: 1 }} />
            </>
          )}
          <Button onClick={() => setModalOpen(false)}>Cerrar</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

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