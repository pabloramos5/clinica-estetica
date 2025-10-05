import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Box,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
  Snackbar,
  ToggleButton,
  ToggleButtonGroup,
  Skeleton,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PowerSettingsNew as PowerIcon,
  LocalHospital as HospitalIcon,
  Euro as EuroIcon,
  Schedule as ScheduleIcon,
  ViewList,
  ViewModule,
  Info as InfoIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import treatmentService from '../services/treatmentService';
import type { Treatment, TreatmentType, TreatmentStatistics } from '../services/treatmentService';
import TreatmentFormDialog from '../components/treatments/TreatmentFormDialog';

const TreatmentsPage: React.FC = () => {
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [treatmentTypes, setTreatmentTypes] = useState<TreatmentType[]>([]);
  const [statistics, setStatistics] = useState<TreatmentStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [orderBy, setOrderBy] = useState('name');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTreatment, setSelectedTreatment] = useState<Treatment | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [treatmentToDelete, setTreatmentToDelete] = useState<Treatment | null>(null);
  
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  useEffect(() => {
    loadTreatmentTypes();
    loadStatistics();
  }, []);

  useEffect(() => {
    loadTreatments();
  }, [page, rowsPerPage, searchTerm, selectedType, orderBy, order]);

  const loadTreatments = async () => {
    setLoading(true);
    try {
      const response = await treatmentService.getAllTreatments({
        page: page + 1,
        limit: rowsPerPage,
        search: searchTerm,
        type: selectedType,
        orderBy,
        order
      });
      
      console.log('Treatments response:', response);
      
      if (response && response.data) {
        setTreatments(response.data);
        setTotalCount(response.total || 0);
      } else if (Array.isArray(response)) {
        setTreatments(response);
        setTotalCount(response.length);
      } else {
        setTreatments([]);
        setTotalCount(0);
      }
    } catch (error: any) {
      console.error('Error loading treatments:', error);
      if (error.response?.status === 401) {
        window.location.href = '/login';
      } else {
        showSnackbar('Error al cargar los tratamientos', 'error');
        setTreatments([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadTreatmentTypes = async () => {
    try {
      const types = await treatmentService.getTreatmentTypes();
      setTreatmentTypes(types);
    } catch (error) {
      console.error('Error loading treatment types:', error);
    }
  };

  const loadStatistics = async () => {
    try {
      const stats = await treatmentService.getTreatmentStatistics();
      setStatistics(stats);
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  const handleAddTreatment = () => {
    setSelectedTreatment(null);
    setDialogOpen(true);
  };

  const handleEditTreatment = (treatment: Treatment) => {
    setSelectedTreatment(treatment);
    setDialogOpen(true);
  };

  const handleDeleteTreatment = (treatment: Treatment) => {
    setTreatmentToDelete(treatment);
    setDeleteDialogOpen(true);
  };

  const handleToggleActive = async (treatment: Treatment) => {
    try {
      await treatmentService.toggleTreatmentActive(treatment.id);
      await loadTreatments();
      await loadStatistics();
      showSnackbar(
        `Tratamiento ${treatment.active ? 'desactivado' : 'activado'} correctamente`,
        'success'
      );
    } catch (error) {
      console.error('Error toggling treatment status:', error);
      showSnackbar('Error al cambiar el estado del tratamiento', 'error');
    }
  };

  const confirmDelete = async () => {
    if (!treatmentToDelete) return;

    try {
      await treatmentService.deleteTreatment(treatmentToDelete.id);
      setDeleteDialogOpen(false);
      setTreatmentToDelete(null);
      await loadTreatments();
      await loadStatistics();
      showSnackbar('Tratamiento eliminado correctamente', 'success');
    } catch (error: any) {
      console.error('Error deleting treatment:', error);
      showSnackbar(
        error.response?.data?.message || 'Error al eliminar el tratamiento',
        'error'
      );
    }
  };

  const handleSaveTreatment = async (treatmentData: any) => {
    try {
      if (selectedTreatment) {
        await treatmentService.updateTreatment(selectedTreatment.id, treatmentData);
        showSnackbar('Tratamiento actualizado correctamente', 'success');
      } else {
        await treatmentService.createTreatment(treatmentData);
        showSnackbar('Tratamiento creado correctamente', 'success');
      }
      
      setDialogOpen(false);
      await loadTreatments();
      await loadStatistics();
    } catch (error: any) {
      throw error;
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const getTypeLabel = (type: string) => {
    const typeObj = treatmentTypes.find(t => t.value === type);
    return typeObj ? typeObj.label : type;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}min` : `${mins}min`;
  };

  const renderStatisticsCards = () => (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Total Tratamientos
            </Typography>
            <Typography variant="h4">
              {statistics?.total || 0}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Activos
            </Typography>
            <Typography variant="h4" color="success.main">
              {statistics?.active || 0}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Inactivos
            </Typography>
            <Typography variant="h4" color="text.secondary">
              {statistics?.inactive || 0}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Más Utilizado
            </Typography>
            <Typography variant="body1">
              {statistics?.mostUsed?.[0]?.name || 'N/A'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {statistics?.mostUsed?.[0]?.appointmentsCount || 0} citas
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderGridView = () => {
    if (!treatments || treatments.length === 0) {
      return (
        <Typography variant="h6" align="center" color="textSecondary" sx={{ py: 4 }}>
          No hay tratamientos disponibles
        </Typography>
      );
    }

    return (
      <Grid container spacing={3}>
        {treatments.map((treatment) => (
        <Grid item xs={12} sm={6} md={4} key={treatment.id}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                <Typography variant="h6" component="div">
                  {treatment.name}
                </Typography>
                <Chip
                  label={treatment.active ? 'Activo' : 'Inactivo'}
                  color={treatment.active ? 'success' : 'default'}
                  size="small"
                />
              </Box>
              
              <Typography variant="body2" color="text.secondary" mb={1}>
                {treatment.description || 'Sin descripción'}
              </Typography>
              
              <Box display="flex" alignItems="center" gap={2} mb={1}>
                <Chip label={getTypeLabel(treatment.type)} size="small" variant="outlined" />
                {treatment.code && <Typography variant="caption">Código: {treatment.code}</Typography>}
              </Box>
              
              <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
                <Box>
                  <Typography variant="h6" color="primary">
                    {formatPrice(treatment.totalPrice || treatment.price)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    IVA incluido ({treatment.iva}%)
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <ScheduleIcon fontSize="small" color="action" />
                  <Typography variant="body2">{formatDuration(treatment.duration)}</Typography>
                </Box>
              </Box>
              
              {treatment.requiresConsent && (
                <Alert severity="info" sx={{ mt: 2, py: 0 }}>
                  <Typography variant="caption">Requiere consentimiento</Typography>
                </Alert>
              )}
              
              <Box display="flex" justifyContent="end" gap={1} mt={2}>
                <Tooltip title={treatment.active ? 'Desactivar' : 'Activar'}>
                  <IconButton size="small" onClick={() => handleToggleActive(treatment)}>
                    <PowerIcon color={treatment.active ? 'success' : 'disabled'} />
                  </IconButton>
                </Tooltip>
                <IconButton size="small" onClick={() => handleEditTreatment(treatment)}>
                  <EditIcon />
                </IconButton>
                <IconButton size="small" onClick={() => handleDeleteTreatment(treatment)}>
                  <DeleteIcon />
                </IconButton>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}

  const renderListView = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Nombre</TableCell>
            <TableCell>Tipo</TableCell>
            <TableCell>Código</TableCell>
            <TableCell align="right">Precio (sin IVA)</TableCell>
            <TableCell align="right">IVA</TableCell>
            <TableCell align="right">Precio Total</TableCell>
            <TableCell>Duración</TableCell>
            <TableCell align="center">Estado</TableCell>
            <TableCell align="center">Citas</TableCell>
            <TableCell align="center">Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            Array.from(new Array(5)).map((_, index) => (
              <TableRow key={index}>
                <TableCell colSpan={10}>
                  <Skeleton variant="rectangular" height={40} />
                </TableCell>
              </TableRow>
            ))
          ) : treatments && treatments.length > 0 ? (
            treatments.map((treatment) => (
              <TableRow key={treatment.id}>
                <TableCell>
                  <Box>
                    <Typography variant="body2">{treatment.name}</Typography>
                    {treatment.requiresConsent && (
                      <Chip label="Requiere consentimiento" size="small" variant="outlined" sx={{ mt: 0.5 }} />
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip label={getTypeLabel(treatment.type)} size="small" />
                </TableCell>
                <TableCell>{treatment.code || '-'}</TableCell>
                <TableCell align="right">{formatPrice(treatment.price)}</TableCell>
                <TableCell align="right">{treatment.iva}%</TableCell>
                <TableCell align="right">
                  <Typography variant="body2" fontWeight="bold">
                    {formatPrice(treatment.totalPrice || treatment.price)}
                  </Typography>
                </TableCell>
                <TableCell>{formatDuration(treatment.duration)}</TableCell>
                <TableCell align="center">
                  <Chip
                    label={treatment.active ? 'Activo' : 'Inactivo'}
                    color={treatment.active ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell align="center">
                  {treatment.appointmentsCount || 0}
                </TableCell>
                <TableCell align="center">
                  <Box display="flex" justifyContent="center" gap={0.5}>
                    <Tooltip title={treatment.active ? 'Desactivar' : 'Activar'}>
                      <IconButton size="small" onClick={() => handleToggleActive(treatment)}>
                        <PowerIcon fontSize="small" color={treatment.active ? 'success' : 'disabled'} />
                      </IconButton>
                    </Tooltip>
                    <IconButton size="small" onClick={() => handleEditTreatment(treatment)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDeleteTreatment(treatment)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={10} align="center">
                <Typography variant="h6" color="textSecondary" sx={{ py: 2 }}>
                  No hay tratamientos disponibles
                </Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={totalCount}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage="Filas por página"
      />
    </TableContainer>
  );

  return (
    <Container maxWidth={false} sx={{ mt: 2, mb: 4, px: 2 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Box 
            display="flex" 
            alignItems="center" 
            mb={2}
            sx={{ width: '100%' }}
          >
            <Box display="flex" alignItems="center" gap={2} sx={{ width: 'auto' }}>
              <HospitalIcon color="primary" sx={{ fontSize: 40 }} />
              <Typography variant="h4" component="h1" sx={{ whiteSpace: 'nowrap' }}>
                Gestión de Tratamientos
              </Typography>
            </Box>
            <Box sx={{ flexGrow: 1, minWidth: '100px' }} />
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddTreatment}
              size="large"
              sx={{ 
                px: 4,
                py: 1.5,
                fontSize: '1.2rem',
                flexShrink: 0,
                whiteSpace: 'nowrap'
              }}
            >
              Nuevo Tratamiento
            </Button>
          </Box>
        </Grid>

        {renderStatisticsCards()}

        <Grid item xs={12}>
          <Paper sx={{ p: 3, width: '100%' }}>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Buscar tratamientos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      height: '56px'
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
                        <IconButton size="small" onClick={() => setSearchTerm('')}>
                          <ClearIcon />
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>

              <Grid item xs={12} md={7}>
                <FormControl fullWidth>
                  <InputLabel 
                    shrink
                    sx={{ 
                      fontSize: '0.95rem',
                      fontWeight: 500,
                      backgroundColor: 'white',
                      px: 1,
                      transform: 'translate(14px, -9px) scale(0.75) !important'
                    }}
                  >
                    Filtrar por Tipo de Tratamiento
                  </InputLabel>
                  <Select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    displayEmpty
                    sx={{
                      height: '56px',
                      width: '100%',
                      '& .MuiSelect-select': {
                        fontSize: '1rem',
                        fontWeight: 400,
                        padding: '16px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        minWidth: '450px'  // AÑADIDO: ancho mínimo fijo
                      },
                      backgroundColor: selectedType ? '#e3f2fd' : 'white',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: selectedType ? 'primary.main' : 'rgba(0, 0, 0, 0.23)'
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'primary.main'
                      }
                    }}
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          maxHeight: 400,
                          '& .MuiMenuItem-root': {
                            fontSize: '1rem',
                            py: 1.5,
                            '&:hover': {
                              backgroundColor: '#f5f5f5'
                            },
                            '&.Mui-selected': {
                              backgroundColor: '#e3f2fd',
                              fontWeight: 500,
                              '&:hover': {
                                backgroundColor: '#bbdefb'
                              }
                            }
                          }
                        }
                      }
                    }}
                  >
                    <MenuItem value="">
                      <Typography variant="body1" fontWeight="500" fontSize="1rem">
                        Todos los Tratamientos
                      </Typography>
                    </MenuItem>
                    <Divider sx={{ my: 0.5 }} />
                    {treatmentTypes.map(type => (
                      <MenuItem key={type.value} value={type.value}>
                        <Typography variant="body1" fontSize="1rem">
                          {type.label}
                        </Typography>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={2}>
                <Box display="flex" justifyContent="flex-end">
                  <ToggleButtonGroup
                    value={viewMode}
                    exclusive
                    onChange={(e, value) => value && setViewMode(value)}
                    sx={{
                      '& .MuiToggleButton-root': {
                        padding: '14px 18px'
                      }
                    }}
                  >
                    <ToggleButton value="list">
                      <Tooltip title="Vista de lista">
                        <ViewList />
                      </Tooltip>
                    </ToggleButton>
                    <ToggleButton value="grid">
                      <Tooltip title="Vista de cuadrícula">
                        <ViewModule />
                      </Tooltip>
                    </ToggleButton>
                  </ToggleButtonGroup>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          {viewMode === 'list' ? renderListView() : renderGridView()}
        </Grid>
      </Grid>

      <TreatmentFormDialog
        open={dialogOpen}
        treatment={selectedTreatment}
        treatmentTypes={treatmentTypes}
        onClose={() => setDialogOpen(false)}
        onSave={handleSaveTreatment}
      />

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Está seguro de que desea eliminar el tratamiento "{treatmentToDelete?.name}"?
            {treatmentToDelete?.appointmentsCount && treatmentToDelete.appointmentsCount > 0 && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                Este tratamiento tiene {treatmentToDelete.appointmentsCount} citas asociadas.
                Las citas quedarán sin tratamiento asignado.
              </Alert>
            )}
          </DialogContentText>
          <Alert severity="info" sx={{ mt: 2 }}>
            Esta acción no se puede deshacer. Si desea mantener el registro pero no usarlo, 
            considere desactivarlo en su lugar.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Eliminar Definitivamente
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default TreatmentsPage;