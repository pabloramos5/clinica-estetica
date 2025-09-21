import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Tab,
  Tabs,
  Box,
  Alert,
  IconButton,
  Chip
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import api from '../../services/api';

interface PatientFormModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (savedPatient?: any) => void; // Modificado para recibir los datos guardados
  patient?: any;
  mode: 'create' | 'edit';
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`patient-tabpanel-${index}`}
      aria-labelledby={`patient-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const PatientFormModal: React.FC<PatientFormModalProps> = ({
  open,
  onClose,
  onSave,
  patient,
  mode
}) => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    documentNumber: '',
    documentType: 'DNI',
    email: '',
    phone: '',
    alternativePhone: '',
    birthDate: null as Date | null,
    gender: 'F',
    address: '',
    city: 'Valencia',
    postalCode: '',
    profession: '',
    allergies: '',
    medications: '',
    medicalConditions: '',
    observations: '',
    referredBy: '',
    acceptsMarketing: true,
    acceptsWhatsapp: true,
    wantsSMS: false,
    wantsEmail: true
  });

  useEffect(() => {
  if (open && patient && mode === 'edit') {
    // Llenar el formulario con los datos del paciente
    setFormData({
      firstName: patient.firstName || '',
      lastName: patient.lastName || '',
      documentNumber: patient.documentNumber || '',
      documentType: patient.documentType || 'DNI',
      email: patient.email || '',
      phone: patient.phone || '',
      alternativePhone: patient.alternativePhone || patient.alternative_phone || '',
      birthDate: patient.birthDate ? new Date(patient.birthDate) : null,
      gender: patient.gender || 'F',
      address: patient.address || '',
      city: patient.city || 'Valencia',
      postalCode: patient.postalCode || patient.postal_code || '',
      profession: patient.profession || patient.ocupation || '',
      allergies: patient.allergies || '',
      medications: patient.medications || '',
      medicalConditions: patient.medicalConditions || patient.medical_conditions || '',
      observations: patient.observations || '',
      referredBy: patient.referredBy || patient.referred_by || '',
      acceptsMarketing: patient.acceptsMarketing !== undefined ? patient.acceptsMarketing : (patient.accepts_marketing ?? true),
      acceptsWhatsapp: patient.acceptsWhatsapp !== undefined ? patient.acceptsWhatsapp : (patient.accepts_whatsapp ?? true),
      wantsSMS: patient.wantsSMS !== undefined ? patient.wantsSMS : (patient.wants_sms ?? false),
      wantsEmail: patient.wantsEmail !== undefined ? patient.wantsEmail : (patient.wants_email ?? true)
    });
    
    // Log para debugging
    console.log('Datos del paciente cargados:', patient);
    console.log('Formulario llenado con:', {
      firstName: patient.firstName,
      lastName: patient.lastName,
      documentNumber: patient.documentNumber,
      email: patient.email,
      phone: patient.phone
    });
  } else if (open && mode === 'create') {
    // Resetear el formulario para nuevo paciente
    setFormData({
      firstName: '',
      lastName: '',
      documentNumber: '',
      documentType: 'DNI',
      email: '',
      phone: '',
      alternativePhone: '',
      birthDate: null,
      gender: 'F',
      address: '',
      city: 'Valencia',
      postalCode: '',
      profession: '',
      allergies: '',
      medications: '',
      medicalConditions: '',
      observations: '',
      referredBy: '',
      acceptsMarketing: true,
      acceptsWhatsapp: true,
      wantsSMS: false,
      wantsEmail: true
    });
  }
  
  // Resetear errores y volver a la primera pestaña
  setTabValue(0);
  setErrors({});
}, [patient, mode, open]); 

  const handleChange = (field: string) => (event: any) => {
    const value = event.target.type === 'checkbox' 
      ? event.target.checked 
      : event.target.value;
    
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev: any) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleDateChange = (date: Date | null) => {
    setFormData(prev => ({
      ...prev,
      birthDate: date
    }));
  };

  const validateForm = () => {
    const newErrors: any = {};

    // Datos básicos
    if (!formData.firstName.trim()) newErrors.firstName = 'El nombre es obligatorio';
    if (!formData.lastName.trim()) newErrors.lastName = 'Los apellidos son obligatorios';
    if (!formData.documentNumber.trim()) {
      newErrors.documentNumber = 'El documento es obligatorio';
    } else if (formData.documentType === 'DNI' && !/^[0-9]{8,9}[A-Z]?$/.test(formData.documentNumber)) {
      newErrors.documentNumber = 'DNI inválido (8-9 dígitos + letra opcional)';
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'El teléfono es obligatorio';
    } else if (!/^(\+34)?[6-7][0-9]{8}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Teléfono inválido (móvil español)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
  if (!validateForm()) {
    if (errors.firstName || errors.lastName || errors.documentNumber || errors.email || errors.phone || errors.birthDate) {
      setTabValue(0);
    } else if (errors.address) {
      setTabValue(1);
    }
    return;
  }

  setLoading(true);
  try {
    const dataToSend = {
      ...formData,
      birthDate: formData.birthDate?.toISOString(),
      phone: formData.phone.replace(/\s/g, '')
    };

    let response;
    if (mode === 'create') {
      response = await api.post('/patients', dataToSend);
      console.log('Paciente creado:', response.data);
    } else {
      response = await api.patch(`/patients/${patient.id}`, dataToSend);
      console.log('Paciente actualizado:', response.data);
    }
    
    // Pasar los datos guardados al callback
    if (onSave) {
      onSave(response.data);
    }
    
    // Cerrar el modal
    handleClose();
  } catch (error: any) {
    console.error('Error saving patient:', error);
    if (error.response?.data?.message) {
      setErrors({ submit: error.response.data.message });
    } else {
      setErrors({ submit: 'Error al guardar el paciente' });
    }
  } finally {
    setLoading(false);
  }
};

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <Dialog 
        open={open} 
        onClose={handleClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            {mode === 'create' ? 'Nuevo Paciente' : 'Editar Paciente'}
            {patient?.patientCode && (
              <Chip label={patient.patientCode} color="primary" size="small" />
            )}
            <IconButton onClick={handleClose} disabled={loading}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent>
          {errors.submit && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errors.submit}
            </Alert>
          )}

          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
            <Tab label="Datos Personales" />
            <Tab label="Datos de Contacto" />
            <Tab label="Historia Médica" />
            <Tab label="Preferencias" />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Nombre *"
                  value={formData.firstName}
                  onChange={handleChange('firstName')}
                  error={!!errors.firstName}
                  helperText={errors.firstName}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Apellidos *"
                  value={formData.lastName}
                  onChange={handleChange('lastName')}
                  error={!!errors.lastName}
                  helperText={errors.lastName}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  select
                  label="Tipo Doc."
                  value={formData.documentType}
                  onChange={handleChange('documentType')}
                >
                  <MenuItem value="DNI">DNI</MenuItem>
                  <MenuItem value="NIE">NIE</MenuItem>
                  <MenuItem value="PASAPORTE">Pasaporte</MenuItem>
                  <MenuItem value="OTRO">Otro</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="Nº Documento *"
                  value={formData.documentNumber}
                  onChange={handleChange('documentNumber')}
                  error={!!errors.documentNumber}
                  helperText={errors.documentNumber}
                  placeholder="12345678A"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Fecha de Nacimiento"
                  value={formData.birthDate}
                  onChange={handleDateChange}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: !!errors.birthDate,
                      helperText: errors.birthDate
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Género"
                  value={formData.gender}
                  onChange={handleChange('gender')}
                >
                  <MenuItem value="F">Femenino</MenuItem>
                  <MenuItem value="M">Masculino</MenuItem>
                  <MenuItem value="O">Otro</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Profesión"
                  value={formData.profession}
                  onChange={handleChange('profession')}
                />
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange('email')}
                  error={!!errors.email}
                  helperText={errors.email}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Teléfono Móvil *"
                  value={formData.phone}
                  onChange={handleChange('phone')}
                  error={!!errors.phone}
                  helperText={errors.phone}
                  placeholder="666123456"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Teléfono Alternativo"
                  value={formData.alternativePhone}
                  onChange={handleChange('alternativePhone')}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Dirección"
                  value={formData.address}
                  onChange={handleChange('address')}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Ciudad"
                  value={formData.city}
                  onChange={handleChange('city')}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Código Postal"
                  value={formData.postalCode}
                  onChange={handleChange('postalCode')}
                  placeholder="46001"
                />
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Alergias"
                  multiline
                  rows={3}
                  value={formData.allergies}
                  onChange={handleChange('allergies')}
                  helperText="Indique alergias conocidas"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Medicación Actual"
                  multiline
                  rows={3}
                  value={formData.medications}
                  onChange={handleChange('medications')}
                  helperText="Medicamentos que toma actualmente"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Condiciones Médicas"
                  multiline
                  rows={3}
                  value={formData.medicalConditions}
                  onChange={handleChange('medicalConditions')}
                  helperText="Enfermedades o condiciones relevantes"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Observaciones"
                  multiline
                  rows={3}
                  value={formData.observations}
                  onChange={handleChange('observations')}
                  helperText="Notas adicionales"
                />
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Referido por"
                  value={formData.referredBy}
                  onChange={handleChange('referredBy')}
                  helperText="¿Cómo conoció nuestra clínica?"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.acceptsMarketing}
                      onChange={handleChange('acceptsMarketing')}
                      color="primary"
                    />
                  }
                  label="Acepta recibir comunicaciones comerciales y promociones"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.acceptsWhatsapp}
                      onChange={handleChange('acceptsWhatsapp')}
                      color="primary"
                    />
                  }
                  label="Acepta recibir recordatorios de citas por WhatsApp"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.wantsSMS}
                      onChange={handleChange('wantsSMS')}
                      color="primary"
                    />
                  }
                  label="Acepta recibir SMS"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.wantsEmail}
                      onChange={handleChange('wantsEmail')}
                      color="primary"
                    />
                  }
                  label="Acepta recibir emails informativos"
                />
              </Grid>
            </Grid>
          </TabPanel>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading}
          >
            {loading ? 'Guardando...' : mode === 'create' ? 'Crear Paciente' : 'Guardar Cambios'}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default PatientFormModal;