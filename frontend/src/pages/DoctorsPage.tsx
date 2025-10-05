import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Typography,
  Chip,
  TextField,
  InputAdornment,
  Tooltip,
  Alert,
  Snackbar,
  Grid,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  PersonAdd as PersonAddIcon,
  LocalHospital as HospitalIcon,
  CheckCircle as CheckCircleIcon,
  Block as BlockIcon,
} from '@mui/icons-material';
import DoctorFormDialog from '../components/doctors/DoctorFormDialog';
import { userService } from '../services/userService';

interface Doctor {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: 'ADMIN' | 'MEDICO';
  specialization?: string;
  licenseNumber?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const DoctorsPage: React.FC = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  
  const [openForm, setOpenForm] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  useEffect(() => {
    loadDoctors();
  }, []);

  useEffect(() => {
    filterDoctors();
  }, [searchTerm, doctors]);

  const loadDoctors = async () => {
    try {
      setLoading(true);
      const allUsers = await userService.getAll(true);
      const onlyDoctors = allUsers.filter(user => user.role === 'MEDICO');
      setDoctors(onlyDoctors);
    } catch (error) {
      showNotification('Error al cargar médicos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filterDoctors = () => {
    const filtered = doctors.filter(doctor => {
      const searchLower = searchTerm.toLowerCase();
      return (
        doctor.name.toLowerCase().includes(searchLower) ||
        doctor.email.toLowerCase().includes(searchLower) ||
        doctor.phone?.toLowerCase().includes(searchLower) ||
        doctor.specialization?.toLowerCase().includes(searchLower) ||
        doctor.licenseNumber?.toLowerCase().includes(searchLower)
      );
    });
    setFilteredDoctors(filtered);
  };

  const handleCreateDoctor = () => {
    setSelectedDoctor(null);
    setOpenForm(true);
  };

  const handleEditDoctor = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setOpenForm(true);
  };

  const handleToggleStatus = async (doctor: Doctor) => {
    try {
      if (doctor.isActive) {
        await userService.delete(doctor.id);
        showNotification('Médico desactivado correctamente', 'success');
      } else {
        await userService.reactivate(doctor.id);
        showNotification('Médico reactivado correctamente', 'success');
      }
      loadDoctors();
    } catch (error) {
      showNotification('Error al cambiar el estado del médico', 'error');
    }
  };

  const showNotification = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setNotification({
      open: true,
      message,
      severity,
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <Typography>Cargando médicos...</Typography>
      </Box>
    );
  }

  const activeDoctors = doctors.filter(d => d.isActive).length;
  const inactiveDoctors = doctors.filter(d => !d.isActive).length;

  return (
    <Box sx={{ p: 0, m: 0, width: '100%', maxWidth: '100%' }}>
      {/* Header */}
      <Box sx={{ px: 4, pt: 3, pb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <HospitalIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            Gestión de Médicos
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<PersonAddIcon />}
          onClick={handleCreateDoctor}
        >
          Nuevo Médico
        </Button>
      </Box>

      {/* Contenido con padding lateral */}
      <Box sx={{ px: 4, pb: 4 }}>
        {/* Barra de búsqueda */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Buscar por nombre, email, teléfono, especialidad o número de licencia..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            <IconButton onClick={loadDoctors} color="primary">
              <RefreshIcon />
            </IconButton>
          </Box>
        </Paper>

        {/* Estadísticas */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h4" color="primary">{doctors.length}</Typography>
              <Typography variant="body2" color="textSecondary">Total de médicos</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h4" color="success.main">{activeDoctors}</Typography>
              <Typography variant="body2" color="textSecondary">Médicos activos</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h4" color="text.secondary">{inactiveDoctors}</Typography>
              <Typography variant="body2" color="textSecondary">Médicos inactivos</Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Tabla */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'primary.light' }}>
                <TableCell width="22%"><strong>Nombre</strong></TableCell>
                <TableCell width="24%"><strong>Email</strong></TableCell>
                <TableCell width="13%"><strong>Teléfono</strong></TableCell>
                <TableCell width="17%"><strong>Especialidad</strong></TableCell>
                <TableCell width="12%"><strong>Nº Licencia</strong></TableCell>
                <TableCell align="center" width="8%"><strong>Estado</strong></TableCell>
                <TableCell align="center" width="4%"><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredDoctors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography color="textSecondary" sx={{ py: 3 }}>
                      No se encontraron médicos
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredDoctors.map((doctor) => (
                  <TableRow
                    key={doctor.id}
                    sx={{ 
                      opacity: doctor.isActive ? 1 : 0.6,
                      '&:hover': { backgroundColor: 'action.hover' }
                    }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <HospitalIcon fontSize="small" color="primary" />
                        <strong>{doctor.name}</strong>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{doctor.email}</Typography>
                    </TableCell>
                    <TableCell>{doctor.phone || '-'}</TableCell>
                    <TableCell>
                      {doctor.specialization ? (
                        <Chip 
                          label={doctor.specialization} 
                          size="small" 
                          variant="outlined" 
                          color="primary" 
                          sx={{ maxWidth: '100%' }}
                        />
                      ) : '-'}
                    </TableCell>
                    <TableCell>{doctor.licenseNumber || '-'}</TableCell>
                    <TableCell align="center">
                      <Chip
                        icon={doctor.isActive ? <CheckCircleIcon /> : <BlockIcon />}
                        label={doctor.isActive ? 'Activo' : 'Inactivo'}
                        color={doctor.isActive ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                        <Tooltip title="Editar">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleEditDoctor(doctor)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={doctor.isActive ? 'Desactivar' : 'Reactivar'}>
                          <IconButton
                            size="small"
                            color={doctor.isActive ? 'error' : 'success'}
                            onClick={() => handleToggleStatus(doctor)}
                          >
                            {doctor.isActive ? <DeleteIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />}
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Diálogo de formulario */}
      <DoctorFormDialog
        open={openForm}
        doctor={selectedDoctor}
        onClose={() => {
          setOpenForm(false);
          setSelectedDoctor(null);
        }}
        onSave={() => {
          loadDoctors();
          setOpenForm(false);
          setSelectedDoctor(null);
          showNotification(
            selectedDoctor ? 'Médico actualizado correctamente' : 'Médico creado correctamente',
            'success'
          );
        }}
      />

      {/* Notificaciones */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification({ ...notification, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setNotification({ ...notification, open: false })}
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default DoctorsPage;