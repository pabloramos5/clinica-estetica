import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Alert,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { userService } from '../../services/userService';

interface Doctor {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: 'ADMIN' | 'MEDICO';
  specialization?: string;
  licenseNumber?: string;
  isActive: boolean;
}

interface DoctorFormDialogProps {
  open: boolean;
  doctor: Doctor | null;
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
    email: '',
    password: '',
    name: '',
    phone: '',
    specialization: '',
    licenseNumber: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (doctor) {
      // Modo edición
      setFormData({
        email: doctor.email,
        password: '', // No mostramos la contraseña en edición
        name: doctor.name,
        phone: doctor.phone || '',
        specialization: doctor.specialization || '',
        licenseNumber: doctor.licenseNumber || '',
      });
    } else {
      // Modo creación - limpiar formulario
      setFormData({
        email: '',
        password: '',
        name: '',
        phone: '',
        specialization: '',
        licenseNumber: '',
      });
    }
    setErrors({});
    setShowPassword(false);
  }, [doctor, open]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpiar error del campo cuando se modifica
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Validar nombre
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es obligatorio';
    }

    // Validar email
    if (!formData.email.trim()) {
      newErrors.email = 'El email es obligatorio';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    // Validar contraseña (solo en creación o si se ingresó una nueva)
    if (!doctor && !formData.password) {
      newErrors.password = 'La contraseña es obligatoria';
    } else if (formData.password && formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    // Validar teléfono (opcional pero si se ingresa debe ser válido)
    if (formData.phone && !/^\+?\d{9,15}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Teléfono inválido (ej: +34 600000000)';
    }

    // Validar especialización (obligatoria para médicos)
    if (!formData.specialization.trim()) {
      newErrors.specialization = 'La especialización es obligatoria';
    }

    // Validar número de licencia (obligatorio para médicos)
    if (!formData.licenseNumber.trim()) {
      newErrors.licenseNumber = 'El número de licencia es obligatorio';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      if (doctor) {
        // Actualizar médico existente
        const updateData: any = {
          email: formData.email,
          name: formData.name,
          phone: formData.phone || undefined,
          role: 'MEDICO', // Siempre es médico
          specialization: formData.specialization,
          licenseNumber: formData.licenseNumber,
        };
        
        // Solo incluir contraseña si se ingresó una nueva
        if (formData.password) {
          updateData.password = formData.password;
        }

        await userService.update(doctor.id, updateData);
      } else {
        // Crear nuevo médico
        await userService.create({
          ...formData,
          role: 'MEDICO', // Siempre crear como médico
          phone: formData.phone || undefined,
        });
      }
      onSave();
    } catch (error: any) {
      if (error.response?.data?.message) {
        if (error.response.data.message.includes('email')) {
          setErrors({ email: 'Este email ya está registrado' });
        } else {
          setErrors({ general: error.response.data.message });
        }
      } else {
        setErrors({ general: 'Error al guardar el médico' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {doctor ? 'Editar Médico' : 'Nuevo Médico'}
      </DialogTitle>
      <DialogContent>
        {errors.general && (
          <Alert severity="error" sx={{ mb: 2, mt: 1 }}>
            {errors.general}
          </Alert>
        )}
        
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {/* Datos personales */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Nombre completo"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              error={!!errors.name}
              helperText={errors.name}
              required
              autoFocus
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              error={!!errors.email}
              helperText={errors.email}
              required
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Teléfono"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              error={!!errors.phone}
              helperText={errors.phone}
              placeholder="+34 600 000 000"
            />
          </Grid>

          {/* Contraseña */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label={doctor ? "Nueva contraseña (dejar vacío para no cambiar)" : "Contraseña"}
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
              error={!!errors.password}
              helperText={errors.password || (doctor ? "Mínimo 6 caracteres" : "")}
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

          {/* Datos profesionales */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Especialización"
              value={formData.specialization}
              onChange={(e) => handleChange('specialization', e.target.value)}
              error={!!errors.specialization}
              helperText={errors.specialization}
              required
              placeholder="Ej: Dermatología, Cirugía Estética"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Número de Licencia"
              value={formData.licenseNumber}
              onChange={(e) => handleChange('licenseNumber', e.target.value)}
              error={!!errors.licenseNumber}
              helperText={errors.licenseNumber}
              required
              placeholder="Ej: 28/12345"
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
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