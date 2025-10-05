import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Alert,
  Box,
  Divider,
  IconButton,
  InputAdornment,
} from '@mui/material';
import {
  Close as CloseIcon,
  Visibility,
  VisibilityOff,
  LocalHospital as HospitalIcon
} from '@mui/icons-material';
import { userService } from '../../services/userService';

interface DoctorFormDialogProps {
  open: boolean;
  doctor?: any;
  onClose: () => void;
  onSave: () => void;
}

const DoctorFormDialog: React.FC<DoctorFormDialogProps> = ({
  open,
  doctor,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    username: '', // NUEVO: campo de usuario
    email: '',
    password: '',
    phone: '',
    specialization: '',
    licenseNumber: '',
    role: 'MEDICO' as const,
    createUser: true,
  });

  const [errors, setErrors] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (doctor) {
      setFormData({
        name: doctor.name || '',
        username: doctor.username || '',
        email: doctor.email || '',
        password: '',
        phone: doctor.phone || '',
        specialization: doctor.specialization || '',
        licenseNumber: doctor.licenseNumber || '',
        role: 'MEDICO',
        createUser: false,
      });
    } else {
      setFormData({
        name: '',
        username: '',
        email: '',
        password: '',
        phone: '',
        specialization: '',
        licenseNumber: '',
        role: 'MEDICO',
        createUser: true,
      });
    }
    setErrors({});
  }, [doctor, open]);

  const validateForm = () => {
    const newErrors: any = {};

    if (!formData.name) {
      newErrors.name = 'El nombre es requerido';
    }

    if (!formData.username) {
      newErrors.username = 'El nombre de usuario es requerido';
    } else if (formData.username.length < 3) {
      newErrors.username = 'El usuario debe tener al menos 3 caracteres';
    }

    if (!formData.email) {
      newErrors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!doctor && formData.createUser && !formData.password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (formData.password && formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    if (!formData.specialization) {
      newErrors.specialization = 'La especialidad es requerida';
    }

    if (!formData.licenseNumber) {
      newErrors.licenseNumber = 'El número de licencia es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      if (doctor) {
        const updateData: any = {
          name: formData.name,
          username: formData.username,
          email: formData.email,
          phone: formData.phone,
          specialization: formData.specialization,
          licenseNumber: formData.licenseNumber,
        };

        if (formData.password) {
          updateData.password = formData.password;
        }

        await userService.update(doctor.id, updateData);
      } else {
        if (formData.createUser) {
          await userService.create({
            name: formData.name,
            username: formData.username,
            email: formData.email,
            password: formData.password,
            phone: formData.phone,
            role: 'MEDICO',
            specialization: formData.specialization,
            licenseNumber: formData.licenseNumber,
          });
        } else {
          throw new Error('Debe crear un usuario para el médico');
        }
      }

      onSave();
      handleClose();
    } catch (error: any) {
      console.error('Error al guardar médico:', error);
      if (error.response?.data?.message) {
        const message = error.response.data.message;
        if (message.includes('email')) {
          setErrors({ email: 'Este email ya está registrado' });
        } else if (message.includes('username')) {
          setErrors({ username: 'Este nombre de usuario ya existe' });
        } else {
          setErrors({ general: message });
        }
      } else {
        setErrors({ general: 'Error al guardar el médico' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      username: '',
      email: '',
      password: '',
      phone: '',
      specialization: '',
      licenseNumber: '',
      role: 'MEDICO',
      createUser: true,
    });
    setErrors({});
    onClose();
  };

  const handleChange = (field: string) => (event: any) => {
    setFormData({ ...formData, [field]: event.target.value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: undefined });
    }
  };

  const specializations = [
    'Medicina General',
    'Dermatología',
    'Cirugía Plástica',
    'Medicina Estética',
    'Endocrinología',
    'Nutrición',
    'Psicología',
    'Fisioterapia',
    'Oftalmología',
    'Odontología',
    'Otra'
  ];

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1}>
            <HospitalIcon color="primary" />
            <Typography variant="h6">
              {doctor ? 'Editar Médico' : 'Nuevo Médico'}
            </Typography>
          </Box>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {errors.general && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errors.general}
          </Alert>
        )}

        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <Typography variant="subtitle1" fontWeight="bold" color="primary">
              Información Personal
            </Typography>
            <Divider sx={{ mt: 1, mb: 2 }} />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Nombre Completo"
              value={formData.name}
              onChange={handleChange('name')}
              error={!!errors.name}
              helperText={errors.name}
              required
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Teléfono"
              value={formData.phone}
              onChange={handleChange('phone')}
              error={!!errors.phone}
              helperText={errors.phone}
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle1" fontWeight="bold" color="primary" sx={{ mt: 2 }}>
              Información Profesional
            </Typography>
            <Divider sx={{ mt: 1, mb: 2 }} />
          </Grid>

          <Grid item xs={12}>
            <FormControl fullWidth required error={!!errors.specialization}>
              <InputLabel>Especialidad</InputLabel>
              <Select
                value={formData.specialization}
                onChange={handleChange('specialization')}
                label="Especialidad"
                sx={{ minWidth: 300 }}
              >
                {specializations.map((spec) => (
                  <MenuItem key={spec} value={spec}>
                    {spec}
                  </MenuItem>
                ))}
              </Select>
              {errors.specialization && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 2 }}>
                  {errors.specialization}
                </Typography>
              )}
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Número de Licencia Médica"
              value={formData.licenseNumber}
              onChange={handleChange('licenseNumber')}
              error={!!errors.licenseNumber}
              helperText={errors.licenseNumber}
              required
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle1" fontWeight="bold" color="primary" sx={{ mt: 2 }}>
              Información de Usuario (para iniciar sesión)
            </Typography>
            <Divider sx={{ mt: 1, mb: 2 }} />
          </Grid>

          {!doctor && (
            <Grid item xs={12}>
              <Alert severity="info">
                Se creará un usuario para que el médico pueda iniciar sesión en el sistema
              </Alert>
            </Grid>
          )}

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Nombre de Usuario"
              value={formData.username}
              onChange={handleChange('username')}
              error={!!errors.username}
              helperText={errors.username || 'Este será el usuario para iniciar sesión'}
              required
              disabled={!!doctor}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={formData.email}
              onChange={handleChange('email')}
              error={!!errors.email}
              helperText={errors.email || 'Email de contacto'}
              required
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label={doctor ? "Nueva Contraseña (dejar vacío para no cambiar)" : "Contraseña"}
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange('password')}
              error={!!errors.password}
              helperText={errors.password || (doctor ? 'Dejar vacío para mantener la actual' : 'Mínimo 6 caracteres')}
              required={!doctor}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={loading}
        >
          {loading ? 'Guardando...' : doctor ? 'Actualizar' : 'Crear Médico'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DoctorFormDialog;