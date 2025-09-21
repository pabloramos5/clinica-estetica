import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  IconButton,
  Button,
  Chip,
  Menu,
  MenuItem,
  Tooltip,
  Typography,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Badge,
  ToggleButtonGroup,
  ToggleButton,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  CalendarMonth as CalendarIcon,
  MedicalServices as MedicalIcon,
  Receipt as ReceiptIcon,
  WhatsApp as WhatsAppIcon,
  Clear as ClearIcon,
  PersonSearch as PersonSearchIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { format, parseISO, differenceInYears } from 'date-fns';
import { es } from 'date-fns/locale';
import api from '../services/api';
import PatientFormModal from '../components/patients/PatientFormModal';

interface Patient {
  id: string;
  patientCode: string;
  firstName: string;
  lastName: string;
  dni: string;
  email: string;
  phone: string;
  birthDate: string;
  gender: string;
  address: string;
  city: string;
  acceptsWhatsapp: boolean;
  acceptsMarketing: boolean;
  createdAt: string;
  appointments?: any[];
  _count?: {
    appointments: number;
    invoices: number;
  };
}

const PatientsPage: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [searchMode, setSearchMode] = useState<'general' | 'phone' | 'initials'>('general');
  const [phoneSearch, setPhoneSearch] = useState('');
  const [initialsSearch, setInitialsSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalPatients, setTotalPatients] = useState(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info'
  });

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    try {
      let params: any = {
        page: page + 1,
        limit: rowsPerPage
      };

      if (searchMode === 'general' && search) {
        params.search = search;
      } else if (searchMode === 'phone' && phoneSearch) {
        params.phone = phoneSearch;
      } else if (searchMode === 'initials' && initialsSearch) {
        params.initials = initialsSearch;
      }

      const response = await api.get('/patients', { params });
      setPatients(response.data.data);
      setTotalPatients(response.data.pagination.total);
    } catch (error) {
      console.error('Error fetching patients:', error);
      showSnackbar('Error al cargar pacientes', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, searchMode, phoneSearch, initialsSearch]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    if (searchMode === 'general') {
      setSearch(value);
    } else if (searchMode === 'phone') {
      setPhoneSearch(value);
    } else if (searchMode === 'initials') {
      setInitialsSearch(value.toUpperCase());
    }
    setPage(0);
  };

  const handleSearchModeChange = (event: React.MouseEvent<HTMLElement>, newMode: string | null) => {
    if (newMode !== null) {
      setSearchMode(newMode as 'general' | 'phone' | 'initials');
      setSearch('');
      setPhoneSearch('');
      setInitialsSearch('');
      setPage(0);
    }
  };

  const clearSearch = () => {
    setSearch('');
    setPhoneSearch('');
    setInitialsSearch('');
    setPage(0);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, patient: Patient) => {
    setAnchorEl(event.currentTarget);
    setSelectedPatient(patient);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedPatient(null);
  };

  const handleCreatePatient = () => {
    setFormMode('create');
    setSelectedPatient(null);
    setFormModalOpen(true);
  };

  const handleEditPatient = (patient?: Patient) => {
    const patientToEdit = patient || selectedPatient;
    if (patientToEdit) {
      setFormMode('edit');
      setSelectedPatient(patientToEdit);
      setFormModalOpen(true);
      handleMenuClose();
    }
  };

  const handleDeleteClick = (patient?: Patient) => {
    const patientToDelete = patient || selectedPatient;
    if (patientToDelete) {
      setPatientToDelete(patientToDelete);
      setDeleteDialogOpen(true);
      handleMenuClose();
    }
  };

  const handleDeleteConfirm = async () => {
    if (!patientToDelete) return;

    try {
      await api.delete(`/patients/${patientToDelete.id}`);
      showSnackbar('Paciente eliminado correctamente', 'success');
      fetchPatients();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Error al eliminar paciente';
      showSnackbar(message, 'error');
    } finally {
      setDeleteDialogOpen(false);
      setPatientToDelete(null);
    }
  };

  const handleFormSave = () => {
    const message = formMode === 'create' 
      ? 'Paciente creado correctamente' 
      : 'Paciente actualizado correctamente';
    showSnackbar(message, 'success');
    fetchPatients();
  };

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const calculateAge = (birthDate: string) => {
    return differenceInYears(new Date(), parseISO(birthDate));
  };

  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 9) {
      return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
    }
    return phone;
  };

  const getSearchPlaceholder = () => {
    switch (searchMode) {
      case 'phone':
        return 'Buscar por teléfono...';
      case 'initials':
        return 'Buscar por iniciales (ej: JG)...';
      default:
        return 'Buscar por nombre, apellido, DNI, email...';
    }
  };

  const getCurrentSearchValue = () => {
    switch (searchMode) {
      case 'phone':
        return phoneSearch;
      case 'initials':
        return initialsSearch;
      default:
        return search;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Gestión de Pacientes
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreatePatient}
          size="large"
        >
          Nuevo Paciente
        </Button>
      </Box>

      {/* Estadísticas rápidas */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Pacientes
              </Typography>
              <Typography variant="h4">
                {totalPatients}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Barra de búsqueda */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <ToggleButtonGroup
            value={searchMode}
            exclusive
            onChange={handleSearchModeChange}
            size="small"
          >
            <ToggleButton value="general">
              <Tooltip title="Búsqueda general">
                <SearchIcon />
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="phone">
              <Tooltip title="Buscar por teléfono">
                <PhoneIcon />
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="initials">
              <Tooltip title="Buscar por iniciales">
                <PersonSearchIcon />
              </Tooltip>
            </ToggleButton>
          </ToggleButtonGroup>

          <TextField
            fullWidth
            variant="outlined"
            placeholder={getSearchPlaceholder()}
            value={getCurrentSearchValue()}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: getCurrentSearchValue() && (
                <InputAdornment position="end">
                  <IconButton onClick={clearSearch} size="small">
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
        </Box>
      </Paper>

      {/* Tabla de pacientes */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Código</TableCell>
              <TableCell>Nombre Completo</TableCell>
              <TableCell>DNI</TableCell>
              <TableCell>Teléfono</TableCell>
              <TableCell>Email</TableCell>
              <TableCell align="center">Edad</TableCell>
              <TableCell align="center">Citas</TableCell>
              <TableCell align="center">WhatsApp</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {patients.map((patient) => (
              <TableRow key={patient.id} hover>
                <TableCell>
                  <Chip 
                    label={patient.patientCode} 
                    size="small" 
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="body1">
                      {patient.firstName} {patient.lastName}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {patient.gender === 'FEMENINO' ? '♀' : patient.gender === 'MASCULINO' ? '♂' : '⚥'}
                      {' • '}
                      {patient.city || 'Sin ciudad'}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>{patient.dni}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <PhoneIcon fontSize="small" color="action" />
                    {formatPhone(patient.phone)}
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <EmailIcon fontSize="small" color="action" />
                    <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                      {patient.email}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell align="center">
                  {calculateAge(patient.birthDate)} años
                </TableCell>
                <TableCell align="center">
                  <Badge 
                    badgeContent={patient._count?.appointments || 0} 
                    color="primary"
                  >
                    <CalendarIcon />
                  </Badge>
                </TableCell>
                <TableCell align="center">
                  {patient.acceptsWhatsapp ? (
                    <WhatsAppIcon color="success" fontSize="small" />
                  ) : (
                    <WhatsAppIcon color="disabled" fontSize="small" />
                  )}
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    onClick={(e) => handleMenuClick(e, patient)}
                  >
                    <MoreVertIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {patients.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 5 }}>
                  <Typography color="textSecondary">
                    No se encontraron pacientes
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={totalPatients}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
          labelRowsPerPage="Filas por página:"
        />
      </TableContainer>

      {/* Menú contextual */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleEditPatient()}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Editar
        </MenuItem>
        <MenuItem onClick={() => console.log('Ver historia')}>
          <MedicalIcon fontSize="small" sx={{ mr: 1 }} />
          Historia Clínica
        </MenuItem>
        <MenuItem onClick={() => console.log('Ver citas')}>
          <CalendarIcon fontSize="small" sx={{ mr: 1 }} />
          Ver Citas
        </MenuItem>
        <MenuItem onClick={() => console.log('Ver facturas')}>
          <ReceiptIcon fontSize="small" sx={{ mr: 1 }} />
          Facturas
        </MenuItem>
        <MenuItem onClick={() => handleDeleteClick()} sx={{ color: 'error.main' }}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Eliminar
        </MenuItem>
      </Menu>

      {/* Modal de formulario */}
      <PatientFormModal
        open={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        onSave={handleFormSave}
        patient={selectedPatient}
        mode={formMode}
      />

      {/* Diálogo de confirmación de eliminación */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Está seguro de que desea eliminar al paciente{' '}
            <strong>
              {patientToDelete?.firstName} {patientToDelete?.lastName}
            </strong>
            ? Esta acción no se puede deshacer.
          </DialogContentText>
          {patientToDelete?._count?.appointments && patientToDelete._count.appointments > 0 && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Este paciente tiene {patientToDelete._count.appointments} cita(s) registrada(s).
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            variant="contained"
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar de notificaciones */}
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
};

export default PatientsPage;