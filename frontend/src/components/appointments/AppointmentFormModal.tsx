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
  Divider,
  Paper,
  MenuItem,
  FormControl,
  InputLabel,
  Select
} from '@mui/material';
import {
  Close as CloseIcon,
  Person as PersonIcon,
  MedicalServices as MedicalIcon,
  AccessTime as TimeIcon,
  Room as RoomIcon,
  CalendarMonth as CalendarIcon,
  Phone as PhoneIcon,
  Email as EmailIcon
} from '@mui/icons-material';
import { LocalizationProvider, DatePicker, TimePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import { format, addMinutes } from 'date-fns';
import api from '../../services/api';

// Interfaces de tipos
interface Doctor {
  id: string;
  firstName: string;
  lastName: string;
  specialty?: string;
}

interface Room {
  id: string;
  name: string;
  capacity?: number;
}

interface Treatment {
  id: string;
  name: string;
  duration: number;
  price: number;
}

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  documentNumber?: string;
  dni?: string;
  phone: string;
  email?: string;
}

interface TimeSlot {
  start: string;
  end: string;
  display: string;
}

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
  
  // Estados con tipos específicos
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  
  // Estado del formulario
  const [formData, setFormData] = useState({
    patient: null as Patient | null,
    doctorId: '',
    roomId: '',
    treatmentId: '',
    date: selectedDate || new Date(),
    startTime: null as Date | null,
    endTime: null as Date | null,
    observations: ''
  });

  // Búsqueda de pacientes
  const [searchingPatients, setSearchingPatients] = useState(false);
  const [patientSearchTerm, setPatientSearchTerm] = useState('');

  useEffect(() => {
    if (open) {
      loadAuxiliaryData();
      if (appointment && mode === 'edit') {
        // Cargar datos de la cita existente
        setFormData({
          patient: appointment.patient,
          doctorId: appointment.doctorId,
          roomId: appointment.roomId,
          treatmentId: appointment.treatmentId,
          date: new Date(appointment.date),
          startTime: new Date(appointment.startTime),
          endTime: new Date(appointment.endTime),
          observations: appointment.observations || ''
        });
      } else {
        // Resetear para nueva cita
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
      }
    }
  }, [open, appointment, mode, selectedDate]);

  const loadAuxiliaryData = async () => {
    // Datos de prueba con tipos correctos
    const mockDoctors: Doctor[] = [
      { id: '1', firstName: 'Juan', lastName: 'García', specialty: 'Dermatología' },
      { id: '2', firstName: 'María', lastName: 'López', specialty: 'Medicina Estética' },
      { id: '3', firstName: 'Carlos', lastName: 'Martínez', specialty: 'Cirugía Plástica' }
    ];
    
    const mockRooms: Room[] = [
      { id: '1', name: 'Sala 1', capacity: 1 },
      { id: '2', name: 'Sala 2', capacity: 1 },
      { id: '3', name: 'Sala Láser', capacity: 2 },
      { id: '4', name: 'Quirófano', capacity: 3 }
    ];
    
    const mockTreatments: Treatment[] = [
      { id: '1', name: 'Botox', duration: 30, price: 300 },
      { id: '2', name: 'Ácido Hialurónico', duration: 45, price: 400 },
      { id: '3', name: 'Peeling Químico', duration: 60, price: 150 },
      { id: '4', name: 'Láser CO2', duration: 90, price: 600 },
      { id: '5', name: 'Mesoterapia Facial', duration: 45, price: 200 },
      { id: '6', name: 'Hilos Tensores', duration: 60, price: 500 }
    ];

    setDoctors(mockDoctors);
    setRooms(mockRooms);
    setTreatments(mockTreatments);
  };

  // Buscar pacientes con debounce
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
      
      // Si cambia el tratamiento, calcular hora de fin
      if (field === 'treatmentId' && newData.startTime) {
        const treatment = treatments.find((t) => t.id === value);
        if (treatment) {
          const endTime = addMinutes(newData.startTime, treatment.duration || 60);
          newData.endTime = endTime;
        }
      }
      
      // Si cambia la hora de inicio y hay tratamiento seleccionado
      if (field === 'startTime' && newData.treatmentId) {
        const treatment = treatments.find((t) => t.id === newData.treatmentId);
        if (treatment) {
          const endTime = addMinutes(value, treatment.duration || 60);
          newData.endTime = endTime;
        }
      }
      
      return newData;
    });
    
    // Limpiar error del campo
    if (errors[field]) {
      setErrors((prev: any) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

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
        await api.post('/appointments', dataToSend);
      } else if (appointment) {
        await api.patch(`/appointments/${appointment.id}`, dataToSend);
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
      onClose();
    }
  };

  const loadAvailableSlots = async () => {
    if (formData.date && formData.doctorId && formData.treatmentId) {
      try {
        const response = await api.get('/appointments/available-slots', {
          params: {
            date: format(formData.date, 'yyyy-MM-dd'),
            doctorId: formData.doctorId,
            treatmentId: formData.treatmentId
          }
        });
        setAvailableSlots(response.data);
      } catch (error) {
        console.error('Error loading slots:', error);
        // Si falla, no mostrar slots disponibles
        setAvailableSlots([]);
      }
    }
  };

  useEffect(() => {
    loadAvailableSlots();
  }, [formData.date, formData.doctorId, formData.treatmentId]);

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

          <Stack spacing={3}>
            {/* Sección: Paciente */}
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
                getOptionLabel={(option: Patient) => 
                  option ? `${option.firstName} ${option.lastName} - ${option.documentNumber || option.dni || ''}` : ''
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
                renderOption={(props, option: Patient) => (
                  <Box component="li" {...props}>
                    <Box>
                      <Typography variant="body1">
                        {option.firstName} {option.lastName}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        DNI: {option.documentNumber || option.dni || 'N/A'} • Tel: {option.phone}
                      </Typography>
                    </Box>
                  </Box>
                )}
              />
              
              {formData.patient && (
                <Box mt={2} p={2} bgcolor="white" borderRadius={1}>
                  <Stack direction="row" spacing={2}>
                    <Chip 
                      icon={<PhoneIcon />} 
                      label={formData.patient.phone} 
                      size="small" 
                      variant="outlined"
                    />
                    {formData.patient.email && (
                      <Chip 
                        icon={<EmailIcon />} 
                        label={formData.patient.email} 
                        size="small" 
                        variant="outlined"
                      />
                    )}
                  </Stack>
                </Box>
              )}
            </Paper>

            {/* Sección: Tratamiento y Personal - CAMPOS MÁS ANCHOS */}
            <Paper elevation={0} sx={{ p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
              <Box display="flex" alignItems="center" gap={1} mb={3}>
                <MedicalIcon color="primary" />
                <Typography variant="h6">Tratamiento y Personal</Typography>
              </Box>
              
              <Stack spacing={3}>
                {/* Tratamiento - Ancho completo */}
                <FormControl fullWidth>
                  <InputLabel id="treatment-label">Tratamiento *</InputLabel>
                  <Select
                    labelId="treatment-label"
                    value={formData.treatmentId}
                    onChange={(e) => handleChange('treatmentId', e.target.value)}
                    label="Tratamiento *"
                    error={!!errors.treatmentId}
                    sx={{ 
                      minHeight: 56,
                      width: '100%'
                    }}
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

                {/* Doctor y Sala en fila, cada uno ocupando su espacio completo */}
                <Box sx={{ display: 'flex', gap: 3, width: '100%' }}>
                  <FormControl sx={{ flex: 1, minWidth: 200 }}>
                    <InputLabel id="doctor-label">Doctor *</InputLabel>
                    <Select
                      labelId="doctor-label"
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
                              Dr. {doctor.firstName} {doctor.lastName}
                            </Typography>
                            {doctor.specialty && (
                              <Typography variant="body2" color="textSecondary">
                                {doctor.specialty}
                              </Typography>
                            )}
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.doctorId && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                        {errors.doctorId}
                      </Typography>
                    )}
                  </FormControl>

                  <FormControl sx={{ flex: 1, minWidth: 200 }}>
                    <InputLabel id="room-label">Sala *</InputLabel>
                    <Select
                      labelId="room-label"
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
                                Capacidad: {room.capacity} persona{room.capacity > 1 ? 's' : ''}
                              </Typography>
                            )}
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.roomId && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                        {errors.roomId}
                      </Typography>
                    )}
                  </FormControl>
                </Box>
              </Stack>

              {/* Información adicional cuando hay tratamiento seleccionado */}
              {formData.treatmentId && (
                <Box mt={2} p={2} bgcolor="white" borderRadius={1} border="1px solid" borderColor="grey.300">
                  {(() => {
                    const selectedTreatment = treatments.find(t => t.id === formData.treatmentId);
                    const selectedDoctor = doctors.find(d => d.id === formData.doctorId);
                    const selectedRoom = rooms.find(r => r.id === formData.roomId);
                    
                    return (
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={4}>
                          <Typography variant="caption" color="textSecondary">TRATAMIENTO</Typography>
                          <Typography variant="body2" fontWeight="medium">
                            {selectedTreatment?.name || 'No seleccionado'}
                          </Typography>
                          {selectedTreatment && (
                            <Typography variant="caption" color="textSecondary">
                              {selectedTreatment.duration} min • €{selectedTreatment.price}
                            </Typography>
                          )}
                        </Grid>
                        
                        <Grid item xs={12} sm={4}>
                          <Typography variant="caption" color="textSecondary">DOCTOR</Typography>
                          <Typography variant="body2" fontWeight="medium">
                            {selectedDoctor ? `Dr. ${selectedDoctor.firstName} ${selectedDoctor.lastName}` : 'No seleccionado'}
                          </Typography>
                          {selectedDoctor?.specialty && (
                            <Typography variant="caption" color="textSecondary">
                              {selectedDoctor.specialty}
                            </Typography>
                          )}
                        </Grid>
                        
                        <Grid item xs={12} sm={4}>
                          <Typography variant="caption" color="textSecondary">SALA</Typography>
                          <Typography variant="body2" fontWeight="medium">
                            {selectedRoom?.name || 'No seleccionada'}
                          </Typography>
                          {selectedRoom?.capacity && (
                            <Typography variant="caption" color="textSecondary">
                              Cap. {selectedRoom.capacity}
                            </Typography>
                          )}
                        </Grid>
                      </Grid>
                    );
                  })()}
                </Box>
              )}
            </Paper>

            {/* Sección: Fecha y Hora */}
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

            {/* Sección: Observaciones */}
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
            disabled={loading}
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