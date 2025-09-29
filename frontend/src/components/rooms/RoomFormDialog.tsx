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
  Box,
} from '@mui/material';
import { Room as RoomIcon } from '@mui/icons-material';
import { roomService } from '../../services/roomService';

interface Room {
  id: string;
  name: string;
  description?: string;
  capacity?: number;
  available: boolean;
}

interface RoomFormDialogProps {
  open: boolean;
  room: Room | null;
  onClose: () => void;
  onSave: () => void;
}

const RoomFormDialog: React.FC<RoomFormDialogProps> = ({
  open,
  room,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    capacity: 1,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (room) {
      // Modo edición
      setFormData({
        name: room.name,
        description: room.description || '',
        capacity: room.capacity || 1,
      });
    } else {
      // Modo creación - limpiar formulario
      setFormData({
        name: '',
        description: '',
        capacity: 1,
      });
    }
    setErrors({});
  }, [room, open]);

  const handleChange = (field: string, value: any) => {
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
      newErrors.name = 'El nombre de la sala es obligatorio';
    }

    // Validar capacidad
    if (formData.capacity < 1) {
      newErrors.capacity = 'La capacidad debe ser al menos 1';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const dataToSend = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        capacity: Number(formData.capacity),
      };

      if (room) {
        // Actualizar sala existente
        await roomService.update(room.id, dataToSend);
      } else {
        // Crear nueva sala
        await roomService.create(dataToSend);
      }
      onSave();
    } catch (error: any) {
      if (error.response?.data?.message) {
        if (error.response.data.message.includes('nombre')) {
          setErrors({ name: 'Ya existe una sala con ese nombre' });
        } else {
          setErrors({ general: error.response.data.message });
        }
      } else {
        setErrors({ general: 'Error al guardar la sala' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <RoomIcon color="primary" />
          {room ? 'Editar Sala' : 'Nueva Sala'}
        </Box>
      </DialogTitle>
      <DialogContent>
        {errors.general && (
          <Alert severity="error" sx={{ mb: 2, mt: 1 }}>
            {errors.general}
          </Alert>
        )}
        
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {/* Nombre de la sala */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Nombre de la sala"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              error={!!errors.name}
              helperText={errors.name}
              required
              autoFocus
              placeholder="Ej: Sala 1, Consulta A, Quirófano"
            />
          </Grid>
          
          {/* Capacidad */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Capacidad (personas)"
              type="number"
              value={formData.capacity}
              onChange={(e) => handleChange('capacity', parseInt(e.target.value) || 1)}
              error={!!errors.capacity}
              helperText={errors.capacity}
              InputProps={{ inputProps: { min: 1, max: 20 } }}
            />
          </Grid>

          {/* Descripción */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Descripción (opcional)"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              multiline
              rows={3}
              placeholder="Descripción de la sala, equipamiento especial, observaciones..."
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
          {loading ? 'Guardando...' : room ? 'Actualizar' : 'Crear Sala'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RoomFormDialog;