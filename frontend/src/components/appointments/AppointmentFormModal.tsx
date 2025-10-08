import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Typography,
  Box,
  Chip,
  IconButton,
  Autocomplete,
  Alert,
  Stack,
  Paper,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  CircularProgress
} from '@mui/material';
import {
  Close as CloseIcon,
  Person as PersonIcon,
  MedicalServices as MedicalIcon,
  CalendarMonth as CalendarIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { LocalizationProvider, DatePicker, TimePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import { format, addMinutes } from 'date-fns';
import api from '../../services/api';
import { appointmentService } from '../../services/appointmentService';

interface AppointmentFormModalProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  appointment?: any;
  mode: 'create' | 'edit';
  selectedDate?: Date;
}

const AppointmentFormModal: React.FC<AppointmentFormModalProps> = ({
  open,
  onClose,
  onSave,
  appointment,
  mode,
  selectedDate
}) => {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const [conflictWarning, setConflictWarning] = useState<string>('');
  
  // Datos auxiliares
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [treatments, setTreatments] = useState<any[]>([]);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  
  // Estado del formulario
  const [formData, setFormData] = useState({
    patient: null as any,
    doctorId: '',
    roomId: '',
    treatmentId: '',
    date: selectedDate || new Date(),
    startTime: null as Date | null,
    endTime: null as Date | null,
    observations: ''
  });

  const [searchingPatients, setSearchingPatients] = useState(false);
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [loadingAuxData, setLoadingAuxData] = useState(false);

  useEffect(() => {
    if (open) {
      loadAuxiliaryData();
      if (appointment && mode === 'edit') {
        setFormData({
          patient: appointment.extendedProps?.patient || null,
          doctorId: appointment.extendedProps?.doctor?.id || '',
          roomId: appointment.extendedProps?.room?.id || '',
          treatmentId: appointment.extendedProps?.treatment?.id || '',
          date: new Date(appointment.start),
          startTime: new Date(appointment.start),
          endTime: new Date(appointment.end),
          observations: appointment.extendedProps?.observations || ''
        });
      } else {
        resetForm();
      }
    }
  }, [open, appointment, mode, selectedDate]);

  const resetForm = () => {
    setFormData({
      patient: null,
      doctorId: '',
      roomId: '',
      treatmentId: '',
      date: selectedDate || new Date(),
      startTime: null,
      endTime: null,
      observations: ''
    });
    setErrors({});
    setConflictWarning('');
  };

  const loadAuxiliaryData = async () => {
    setLoadingAuxData(true);
    try {
      const [doctorsRes, roomsRes, treatmentsRes] = await Promise.all([
        api.get('/users', { params: { role: 'MEDICO' } }),
        api.get('/rooms'),
        api.get('/treatments', { params: { active: true } })
      ]);

      const doctorsData = doctorsRes.data.data || doctorsRes.data;
      const roomsData = roomsRes.data.data || roomsRes.data;
      const treatmentsData = treatmentsRes.data.data || treatmentsRes.data;

      setDoctors(doctorsData.filter((d: any) => d.role === 'MEDICO'));
      setRooms(roomsData);
      setTreatments(treatmentsData);
    } catch (error) {
      console.error('Error loading auxiliary data:', error);
      setErrors({ general: 'Error al cargar los datos del formulario' });
    } finally {
      setLoadingAuxData(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (patientSearchTerm && patientSearchTerm.length >= 2) {
        searchPatients(patientSearchTerm);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [patientSearchTerm]);

  const searchPatients = async (searchTerm: string) => {
    setSearchingPatients(true);
    try {
      const response = await api.get('/patients', {
        params: { search: searchTerm, limit: 10 }
      });
      const patientsData = response.data.data || response.data;
      setPatients(patientsData);
    } catch (error) {
      console.error('Error searching patients:', error);
    } finally {
      setSearchingPatients(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      if (field === 'treatmentId' && newData.startTime) {
        const treatment = treatments.find(t => t.id === value);
        if (treatment) {
          newData.endTime = addMinutes(newData.startTime, treatment.duration || 60);
        }
      }
      
      if (field === 'startTime' && newData.treatmentId) {
        const treatment = treatments.find(t => t.id === newData.treatmentId);
        if (treatment && value) {
          newData.endTime = addMinutes(value, treatment.duration || 60);
        }
      }
      
      return newData;
    });
    
    if (errors[field]) {
      setErrors((prev: any) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    
    setConflictWarning('');
  };

  // Verificar disponibilidad en tiempo real
  useEffect(() => {
    const checkAvailability = async () => {
      if (formData.date && formData.startTime && formData.endTime && 
          formData.doctorId && formData.roomId) {
        try {
          const result = await appointmentService.checkAvailability({
            date: format(formData.date, 'yyyy-MM-dd'),
            startTime: formData.startTime.toISOString(),
            endTime: formData.endTime.toISOString(),
            roomId: formData.roomId,
            doctorId: formData.doctorId,
            excludeAppointmentId: appointment?.id
          });

          if (!result.available) {
            setConflictWarning('⚠️ El horario seleccionado tiene conflictos con otra cita');
          } else {
            setConflictWarning('');
          }
        } catch (error) {
          console.error('Error checking availability:', error);
        }
      }
    };

    const debounce = setTimeout(checkAvailability, 500);
    return () => clearTimeout(debounce);
  }, [formData.date, formData.startTime, formData.endTime, formData.doctorId, formData.roomId]);

  const validateForm = () => {
    const newErrors: any = {};
    
    if (!formData.patient) newErrors.patient = 'Selecciona un paciente';
    if (!formData.doctorId) newErrors.doctorId = 'Selecciona un doctor';
    if (!formData.roomId) newErrors.roomId = 'Selecciona una sala';
    if (!formData.treatmentId) newErrors.treatmentId = 'Selecciona un tratamiento';
    if (!formData.date) newErrors.date = 'Selecciona una fecha';
    if (!formData.startTime) newErrors.startTime = 'Selecciona hora de inicio';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    if (conflictWarning && mode === 'create') {
      setErrors({ submit: 'Hay conflictos de horario. Por favor, elige otro horario.' });
      return;
    }

    setLoading(true);
    try {
      const dataToSend = {
        patientId: formData.patient!.id,
        doctorId: formData.doctorId,
        roomId: formData.roomId,
        treatmentId: formData.treatmentId,
        date: format(formData.date, 'yyyy-MM-dd'),
        startTime: formData.startTime?.toISOString(),
        endTime: formData.endTime?.toISOString(),
        observations: formData.observations
      };

      if (mode === 'create') {
        await appointmentService.create(dataToSend as any);
      } else if (appointment) {
        await appointmentService.update(appointment.id, dataToSend);
      }
      
      onSave();
      handleClose();
    } catch (error: any) {
      console.error('Error saving appointment:', error);
      setErrors({ submit: error.response?.data?.message || 'Error al guardar la cita' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      resetForm();
      onClose();
    }
  };

  // Cargar slots disponibles
  useEffect(() => {
    const loadSlots = async () => {
      if (formData.date && formData.doctorId && formData.treatmentId) {
        try {
          const slots = await appointmentService.getAvailableSlots(
            format(formData.date, 'yyyy-MM-dd'),
            formData.doctorId,
            formData.treatmentId
          );
          setAvailableSlots(slots);
        } catch (error) {
          console.error('Error loading slots:', error);
          setAvailableSlots([]);
        }
      }
    };

    loadSlots();
  }, [formData.date, formData.doctorId, formData.treatmentId]);

  if (loadingAuxData) {
    return (
      <Dialog open={open} maxWidth="md" fullWidth>
        <DialogContent sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <Dialog 
        open={open} 
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { height: '90vh', maxHeight: '900px' }
        }}
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h5">
              {mode === 'create' ? 'Nueva Cita' : 'Editar Cita'}
            </Typography>
            <IconButton onClick={handleClose} disabled={loading}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 3 }}>
          {errors.submit && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {errors.submit}
            </Alert>
          )}

          {conflictWarning && (
            <Alert severity="warning" sx={{ mb: 3 }} icon={<WarningIcon />}>
              {conflictWarning}
            </Alert>
          )}

          <Stack spacing={3}>
            {/* Paciente */}
            <Paper elevation={0} sx={{ p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <PersonIcon color="primary" />
                <Typography variant="h6">Paciente</Typography>
              </Box>
              
              <Autocomplete
                value={formData.patient}
                onChange={(event, newValue) => handleChange('patient', newValue)}
                onInputChange={(event, newInputValue) => setPatientSearchTerm(newInputValue)}
                options={patients}
                getOptionLabel={(option) => 
                  option ? `${option.firstName} ${option.lastName} - ${option.documentNumber || ''}` : ''
                }
                loading={searchingPatients}
                loadingText="Buscando pacientes..."
                noOptionsText="No se encontraron pacientes"
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Buscar paciente *"
                    placeholder="Escribe nombre, apellido o DNI..."
                    error={!!errors.patient}
                    helperText={errors.patient || 'Mínimo 2 caracteres para buscar'}
                    fullWidth
                  />
                )}
                renderOption={(props, option) => (
                  <Box component="li" {...props}>
                    <Box>
                      <Typography variant="body1">
                        {option.firstName} {option.lastName}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        DNI: {option.documentNumber} • Tel: {option.phone}
                      </Typography>
                    </Box>
                  </Box>
                )}
              />
              
              {formData.patient && (
                <Box mt={2} p={2} bgcolor="white" borderRadius={1}>
                  <Stack direction="row" spacing={2}>
                    <Chip icon={<PhoneIcon />} label={formData.patient.phone} size="small" variant="outlined" />
                    {formData.patient.email && (
                      <Chip icon={<EmailIcon />} label={formData.patient.email} size="small" variant="outlined" />
                    )}
                  </Stack>
                </Box>
              )}
            </Paper>

            {/* Tratamiento y Personal */}
            <Paper elevation={0} sx={{ p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
              <Box display="flex" alignItems="center" gap={1} mb={3}>
                <MedicalIcon color="primary" />
                <Typography variant="h6">Tratamiento y Personal</Typography>
              </Box>
              
              <Stack spacing={3}>
                <FormControl fullWidth>
                  <InputLabel>Tratamiento *</InputLabel>
                  <Select
                    value={formData.treatmentId}
                    onChange={(e) => handleChange('treatmentId', e.target.value)}
                    label="Tratamiento *"
                    error={!!errors.treatmentId}
                    sx={{ minHeight: 56 }}
                  >
                    {treatments.map((treatment) => (
                      <MenuItem key={treatment.id} value={treatment.id}>
                        <Box sx={{ py: 1, width: '100%' }}>
                          <Typography variant="body1" fontWeight="medium">
                            {treatment.name}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            Duración: {treatment.duration} min • Precio: €{treatment.price}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.treatmentId && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                      {errors.treatmentId}
                    </Typography>
                  )}
                </FormControl>

                <Box sx={{ display: 'flex', gap: 3 }}>
                  <FormControl sx={{ flex: 1 }}>
                    <InputLabel>Doctor *</InputLabel>
                    <Select
                      value={formData.doctorId}
                      onChange={(e) => handleChange('doctorId', e.target.value)}
                      label="Doctor *"
                      error={!!errors.doctorId}
                      sx={{ minHeight: 56 }}
                    >
                      {doctors.map((doctor) => (
                        <MenuItem key={doctor.id} value={doctor.id}>
                          <Box sx={{ py: 1 }}>
                            <Typography variant="body1" fontWeight="medium">
                              Dr. {doctor.name || doctor.username}
                            </Typography>
                            {doctor.specialization && (
                              <Typography variant="body2" color="textSecondary">
                                {doctor.specialization}
                              </Typography>
                            )}
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl sx={{ flex: 1 }}>
                    <InputLabel>Sala *</InputLabel>
                    <Select
                      value={formData.roomId}
                      onChange={(e) => handleChange('roomId', e.target.value)}
                      label="Sala *"
                      error={!!errors.roomId}
                      sx={{ minHeight: 56 }}
                    >
                      {rooms.map((room) => (
                        <MenuItem key={room.id} value={room.id}>
                          <Box sx={{ py: 1 }}>
                            <Typography variant="body1" fontWeight="medium">
                              {room.name}
                            </Typography>
                            {room.capacity && (
                              <Typography variant="body2" color="textSecondary">
                                Capacidad: {room.capacity}
                              </Typography>
                            )}
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              </Stack>
            </Paper>

            {/* Fecha y Hora */}
            <Paper elevation={0} sx={{ p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <CalendarIcon color="primary" />
                <Typography variant="h6">Fecha y Hora</Typography>
              </Box>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <DatePicker
                    label="Fecha *"
                    value={formData.date}
                    onChange={(newValue) => newValue && handleChange('date', newValue)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: !!errors.date
                      }
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  {availableSlots.length > 0 ? (
                    <FormControl fullWidth>
                      <InputLabel>Hora disponible *</InputLabel>
                      <Select
                        value={formData.startTime?.toISOString() || ''}
                        onChange={(e) => handleChange('startTime', new Date(e.target.value))}
                        label="Hora disponible *"
                        error={!!errors.startTime}
                      >
                        {availableSlots.map((slot) => (
                          <MenuItem key={slot.start} value={slot.start}>
                            {slot.display}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  ) : (
                    <TimePicker
                      label="Hora inicio *"
                      value={formData.startTime}
                      onChange={(newValue) => newValue && handleChange('startTime', newValue)}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          error: !!errors.startTime
                        }
                      }}
                    />
                  )}
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Hora fin"
                    value={formData.endTime ? format(formData.endTime, 'HH:mm') : ''}
                    InputProps={{ readOnly: true }}
                    helperText="Se calcula automáticamente"
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* Observaciones */}
            <Paper elevation={0} sx={{ p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
              <Typography variant="h6" mb={2}>Observaciones</Typography>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Notas adicionales"
                value={formData.observations}
                onChange={(e) => handleChange('observations', e.target.value)}
                placeholder="Añade cualquier información relevante para esta cita..."
              />
            </Paper>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading || (conflictWarning && mode === 'create')}
            size="large"
          >
            {loading ? 'Guardando...' : mode === 'create' ? 'Crear Cita' : 'Guardar Cambios'}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default AppointmentFormModal;