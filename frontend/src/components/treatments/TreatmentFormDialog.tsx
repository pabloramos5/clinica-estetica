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
  FormControlLabel,
  Switch,
  InputAdornment,
  Alert,
  Box,
  Typography,
  Tabs,
  Tab
} from '@mui/material';

import type { Treatment, CreateTreatmentDto, TreatmentType } from '../../services/treatmentService';

interface TreatmentFormDialogProps {
  open: boolean;
  treatment?: Treatment | null;
  treatmentTypes: TreatmentType[];
  onClose: () => void;
  onSave: (treatment: CreateTreatmentDto) => Promise<void>;
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
      id={`treatment-tabpanel-${index}`}
      aria-labelledby={`treatment-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const TreatmentFormDialog: React.FC<TreatmentFormDialogProps> = ({
  open,
  treatment,
  treatmentTypes,
  onClose,
  onSave
}) => {
  const [tabValue, setTabValue] = useState(0);
  const [formData, setFormData] = useState<CreateTreatmentDto>({
    name: '',
    description: '',
    type: 'OTHER',
    price: 0,
    iva: 21,
    duration: 30,
    active: true,
    code: '',
    requiresConsent: false,
    contraindications: '',
    preparation: '',
    aftercare: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (treatment) {
      setFormData({
        name: treatment.name,
        description: treatment.description || '',
        type: treatment.type,
        price: treatment.price,
        iva: treatment.iva,
        duration: treatment.duration,
        active: treatment.active,
        code: treatment.code || '',
        requiresConsent: treatment.requiresConsent || false,
        contraindications: treatment.contraindications || '',
        preparation: treatment.preparation || '',
        aftercare: treatment.aftercare || ''
      });
    } else {
      setFormData({
        name: '',
        description: '',
        type: 'OTHER',
        price: 0,
        iva: 21,
        duration: 30,
        active: true,
        code: '',
        requiresConsent: false,
        contraindications: '',
        preparation: '',
        aftercare: ''
      });
    }
    setTabValue(0);
    setErrors({});
  }, [treatment, open]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'number') {
      setFormData(prev => ({
        ...prev,
        [name]: parseFloat(value) || 0
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSelectChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSwitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    if (formData.price < 0) {
      newErrors.price = 'El precio debe ser mayor o igual a 0';
    }

    if (formData.iva < 0 || formData.iva > 100) {
      newErrors.iva = 'El IVA debe estar entre 0 y 100';
    }

    if (formData.duration < 5 || formData.duration > 480) {
      newErrors.duration = 'La duración debe estar entre 5 y 480 minutos';
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
      await onSave(formData);
      onClose();
    } catch (error: any) {
      setErrors({ submit: error.response?.data?.message || 'Error al guardar el tratamiento' });
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalPrice = () => {
    const total = formData.price + (formData.price * formData.iva / 100);
    return total.toFixed(2);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {treatment ? 'Editar Tratamiento' : 'Nuevo Tratamiento'}
      </DialogTitle>
      
      <DialogContent>
        {errors.submit && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errors.submit}
          </Alert>
        )}

        <Tabs value={tabValue} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Información General" />
          <Tab label="Precios y Duración" />
          <Tab label="Información Médica" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nombre del Tratamiento"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                error={!!errors.name}
                helperText={errors.name}
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Código"
                name="code"
                value={formData.code}
                onChange={handleInputChange}
                helperText="Se generará automáticamente si se deja vacío"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Tipo de Tratamiento</InputLabel>
                <Select
                  name="type"
                  value={formData.type}
                  onChange={handleSelectChange}
                  label="Tipo de Tratamiento"
                >
                  {treatmentTypes.map(type => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.active}
                    onChange={handleSwitchChange}
                    name="active"
                  />
                }
                label="Tratamiento Activo"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descripción"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                multiline
                rows={3}
              />
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.requiresConsent}
                    onChange={handleSwitchChange}
                    name="requiresConsent"
                  />
                }
                label="Requiere Consentimiento Informado"
              />
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Precio Base"
                name="price"
                type="number"
                value={formData.price}
                onChange={handleInputChange}
                error={!!errors.price}
                helperText={errors.price}
                InputProps={{
                  startAdornment: <InputAdornment position="start">€</InputAdornment>,
                  inputProps: { min: 0, step: 0.01 }
                }}
                required
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="IVA"
                name="iva"
                type="number"
                value={formData.iva}
                onChange={handleInputChange}
                error={!!errors.iva}
                helperText={errors.iva}
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  inputProps: { min: 0, max: 100, step: 1 }
                }}
                required
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Precio Total"
                value={calculateTotalPrice()}
                InputProps={{
                  startAdornment: <InputAdornment position="start">€</InputAdornment>,
                  readOnly: true
                }}
                disabled
                helperText="Precio base + IVA"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Duración"
                name="duration"
                type="number"
                value={formData.duration}
                onChange={handleInputChange}
                error={!!errors.duration}
                helperText={errors.duration || "Duración estimada del tratamiento"}
                InputProps={{
                  endAdornment: <InputAdornment position="end">minutos</InputAdornment>,
                  inputProps: { min: 5, max: 480, step: 5 }
                }}
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">
                Duración en horas: {Math.floor(formData.duration / 60)}h {formData.duration % 60}min
              </Typography>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Contraindicaciones"
                name="contraindications"
                value={formData.contraindications}
                onChange={handleInputChange}
                multiline
                rows={3}
                helperText="Condiciones o situaciones en las que no se debe realizar el tratamiento"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Preparación Previa"
                name="preparation"
                value={formData.preparation}
                onChange={handleInputChange}
                multiline
                rows={3}
                helperText="Instrucciones para el paciente antes del tratamiento"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Cuidados Posteriores"
                name="aftercare"
                value={formData.aftercare}
                onChange={handleInputChange}
                multiline
                rows={3}
                helperText="Recomendaciones para después del tratamiento"
              />
            </Grid>
          </Grid>
        </TabPanel>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={loading}
        >
          {loading ? 'Guardando...' : treatment ? 'Actualizar' : 'Crear'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TreatmentFormDialog;