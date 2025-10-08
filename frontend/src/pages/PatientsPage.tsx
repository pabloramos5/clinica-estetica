import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
  History as HistoryIcon
} from '@mui/icons-material';
import { format, parseISO, differenceInYears } from 'date-fns';
import { es } from 'date-fns/locale';
import api from '../services/api';
import PatientFormModal from '../components/patients/PatientFormModal';
import HistoryPanel from '../components/history/HistoryPanel';
import HistoryService from '../services/historyService';

interface Patient {
  id: string;
  patientCode?: string;
  firstName: string;
  lastName: string;
  documentNumber?: string;
  dni?: string;
  email: string;
  phone: string;
  birthDate?: string;
  gender?: string;
  address?: string;
  city?: string;
  acceptsWhatsapp?: boolean;
  acceptsMarketing?: boolean;
  createdAt?: string;
  appointments?: any[];
  _count?: {
    appointments: number;
    invoices: number;
  };
}

export default function PatientsPage() {
  const navigate = useNavigate();
  
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchMode, setSearchMode] = useState<'general' | 'phone' | 'initials'>('general');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalPatients, setTotalPatients] = useState(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);
  const [historyPanelOpen, setHistoryPanelOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info'
  });

  const historyService = HistoryService.getInstance();

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const loadPatients = useCallback(async () => {
    setLoading(true);
    try {
      let params: any = {
        page: page + 1,
        limit: rowsPerPage
      };

      if (searchTerm) {
        params.search = searchTerm;
      }

      const response = await api.get('/patients', { params });
      
      if (response.data.data) {
        setPatients(response.data.data);
        setTotalPatients(response.data.pagination?.total || response.data.data.length);
      } else {
        setPatients(response.data);
        setTotalPatients(response.data.length);
      }
    } catch (error) {
      console.error('Error loading patients:', error);
      showSnackbar('Error al cargar pacientes', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, searchTerm]);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  const handleSearch = () => {
    setPage(0);
    loadPatients();
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const handleSearchModeChange = (event: React.MouseEvent<HTMLElement>, newMode: string | null) => {
    if (newMode !== null) {
      setSearchMode(newMode as 'general' | 'phone' | 'initials');
      setSearchTerm('');
      setPage(0);
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    setPage(0);
    loadPatients();
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

  const handleEditPatient = async (patient?: Patient) => {
    const patientToEdit = patient || selectedPatient;
    if (patientToEdit) {
      try {
        setLoading(true);
        const response = await api.get(`/patients/${patientToEdit.id}`);
        setSelectedPatient(response.data);
        setFormMode('edit');
        setFormModalOpen(true);
        
        if (anchorEl) {
          handleMenuClose();
        }
      } catch (error) {
        console.error('Error loading patient details:', error);
        showSnackbar('Error al cargar los datos del paciente', 'error');
      } finally {
        setLoading(false);
      }
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
      const fullPatientData = await api.get(`/patients/${patientToDelete.id}`);
      
      await api.delete(`/patients/${patientToDelete.id}`);
      
      historyService.addAction({
        type: 'DELETE',
        entity: 'PATIENT',
        entityId: patientToDelete.id,
        description: `Eliminado: ${patientToDelete.firstName} ${patientToDelete.lastName}`,
        previousData: fullPatientData.data,
        userId: 'current-user',
        undoable: true
      });
      
      showSnackbar('Paciente eliminado correctamente (puede deshacer esta acción)', 'success');
      loadPatients();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Error al eliminar paciente';
      showSnackbar(message, 'error');
    } finally {
      setDeleteDialogOpen(false);
      setPatientToDelete(null);
    }
  };

  const handleFormSave = async (savedPatient?: any) => {
    const message = formMode === 'create' 
      ? 'Paciente creado correctamente' 
      : 'Paciente actualizado correctamente';
    
    if (formMode === 'create' && savedPatient) {
      historyService.addAction({
        type: 'CREATE',
        entity: 'PATIENT',
        entityId: savedPatient.id,
        description: `Nuevo paciente: ${savedPatient.firstName} ${savedPatient.lastName}`,
        newData: savedPatient,
        userId: 'current-user',
        undoable: true
      });
    } else if (formMode === 'edit' && selectedPatient && savedPatient) {
      historyService.addAction({
        type: 'UPDATE',
        entity: 'PATIENT',
        entityId: selectedPatient.id,
        description: `Actualizado: ${savedPatient.firstName} ${savedPatient.lastName}`,
        previousData: selectedPatient,
        newData: savedPatient,
        userId: 'current-user',
        undoable: true
      });
    }
    
    showSnackbar(message + ' (puede deshacer esta acción)', 'success');
    
    setSelectedPatient(null);
    setFormModalOpen(false);
    loadPatients();
  };

  const calculateAge = (birthDate?: string) => {
    if (!birthDate) return '-';
    return differenceInYears(new Date(), parseISO(birthDate));
  };

  const formatPhone = (phone: string) => {
    if (!phone) return '-';
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
        return 'Buscar por nombre, DNI o teléfono...';
    }
  };

  return (
    <Box sx={{ px: 4, pt: 3, pb: 4 }}>
      {/* Encabezado */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
          Gestión de Pacientes
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<HistoryIcon />}
            onClick={() => setHistoryPanelOpen(true)}
          >
            Historial de Acciones
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreatePatient}
          >
            Nuevo Paciente
          </Button>
        </Box>
      </Box>

      {/* Estadísticas */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Total Pacientes
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                {totalPatients}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Barra de búsqueda */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Buscar por nombre, apellidos, DNI, teléfono o email..."
            value={searchTerm}
            onChange={handleSearchChange}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                loadPatients();
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton 
                    onClick={() => {
                      setSearchTerm('');
                      setPage(0);
                    }} 
                    size="small"
                  >
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
          
          <Button
            variant="contained"
            onClick={loadPatients}
            startIcon={<SearchIcon />}
          >
            Buscar
          </Button>
        </Box>
      </Paper>

      {/* Tabla de pacientes */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Código</TableCell>
              <TableCell>Nombre</TableCell>
              <TableCell>DNI</TableCell>
              <TableCell>Teléfono</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Ciudad</TableCell>
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
                  {patient.patientCode && (
                    <Chip 
                      label={patient.patientCode} 
                      size="small" 
                      variant="outlined"
                    />
                  )}
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="body1">
                      {patient.firstName} {patient.lastName}
                    </Typography>
                    {patient.gender && (
                      <Typography variant="caption" color="textSecondary">
                        {patient.gender === 'FEMENINO' ? '♀' : patient.gender === 'MASCULINO' ? '♂' : '⚥'}
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell>{patient.dni || patient.documentNumber || '-'}</TableCell>
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
                      {patient.email || '-'}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>{patient.city || '-'}</TableCell>
                <TableCell align="center">
                  {patient.birthDate ? `${calculateAge(patient.birthDate)} años` : '-'}
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
                  {patient.acceptsWhatsapp !== undefined ? (
                    patient.acceptsWhatsapp ? (
                      <WhatsAppIcon color="success" fontSize="small" />
                    ) : (
                      <WhatsAppIcon color="disabled" fontSize="small" />
                    )
                  ) : '-'}
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="Ver Historial Médico">
                    <IconButton
                      size="small"
                      color="info"
                      onClick={() => navigate(`/patients/${patient.id}/history`)}
                    >
                      <MedicalIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Editar">
                    <IconButton
                      size="small"
                      onClick={() => handleEditPatient(patient)}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Eliminar">
                    <IconButton 
                      size="small" 
                      color="error"
                      onClick={() => handleDeleteClick(patient)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
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
                <TableCell colSpan={10} align="center" sx={{ py: 5 }}>
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
        <MenuItem onClick={() => {
          navigate(`/patients/${selectedPatient?.id}/history`);
          handleMenuClose();
        }}>
          <MedicalIcon fontSize="small" sx={{ mr: 1 }} />
          Historia Clínica
        </MenuItem>
        <MenuItem onClick={() => {
          console.log('Ver citas');
          handleMenuClose();
        }}>
          <CalendarIcon fontSize="small" sx={{ mr: 1 }} />
          Ver Citas
        </MenuItem>
        <MenuItem onClick={() => {
          console.log('Ver facturas');
          handleMenuClose();
        }}>
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
        onClose={() => {
          setFormModalOpen(false);
          setSelectedPatient(null);
        }}
        onSave={handleFormSave}
        patient={selectedPatient}
        mode={formMode}
      />

      {/* Panel de historial */}
      <HistoryPanel
        open={historyPanelOpen}
        onClose={() => setHistoryPanelOpen(false)}
        onActionExecuted={loadPatients}
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
}