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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Alert,
  Snackbar,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Room as RoomIcon,
  Group as GroupIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import RoomFormDialog from '../components/rooms/RoomFormDialog';
import { roomService } from '../services/roomService';

interface Room {
  id: string;
  name: string;
  description?: string;
  capacity?: number;
  available: boolean;
  createdAt: string;
  updatedAt: string;
}

const RoomsPage: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
  });
  
  // Diálogos
  const [openForm, setOpenForm] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  
  // Notificaciones
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
    loadRooms();
    loadStats();
  }, []);

  useEffect(() => {
    filterRooms();
  }, [searchTerm, rooms]);

  const loadRooms = async () => {
    try {
      setLoading(true);
      const data = await roomService.getAll();
      setRooms(data);
      setFilteredRooms(data);
    } catch (error) {
      showNotification('Error al cargar salas', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await roomService.getStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    }
  };

  const filterRooms = () => {
    if (!rooms || rooms.length === 0) {
      setFilteredRooms([]);
      return;
    }

    const filtered = rooms.filter(room => {
      const searchLower = searchTerm.toLowerCase();
      return (
        room.name.toLowerCase().includes(searchLower) ||
        room.description?.toLowerCase().includes(searchLower)
      );
    });
    setFilteredRooms(filtered);
  };

  const handleCreateRoom = () => {
    setSelectedRoom(null);
    setOpenForm(true);
  };

  const handleEditRoom = (room: Room) => {
    setSelectedRoom(room);
    setOpenForm(true);
  };

  const handleDeleteRoom = (room: Room) => {
    setSelectedRoom(room);
    setOpenDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!selectedRoom) return;

    try {
      await roomService.delete(selectedRoom.id);
      showNotification('Sala eliminada correctamente', 'success');
      loadRooms();
      loadStats();
    } catch (error: any) {
      if (error.response?.data?.message) {
        showNotification(error.response.data.message, 'error');
      } else {
        showNotification('Error al eliminar la sala', 'error');
      }
    } finally {
      setOpenDeleteDialog(false);
      setSelectedRoom(null);
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
        <Typography>Cargando salas...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <RoomIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            Gestión de Salas
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleCreateRoom}
        >
          Nueva Sala
        </Button>
      </Box>

      {/* Barra de búsqueda */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Buscar por nombre o descripción..."
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
          <IconButton onClick={() => { loadRooms(); loadStats(); }} color="primary">
            <RefreshIcon />
          </IconButton>
        </Box>
      </Paper>

      {/* Estadísticas */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <RoomIcon sx={{ fontSize: 40, color: 'primary.light', mr: 2 }} />
                <Box>
                  <Typography variant="h4" color="primary">
                    {stats.total}
                  </Typography>
                  <Typography color="textSecondary">
                    Salas Totales
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabla de salas */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'primary.light' }}>
              <TableCell><strong>Nombre</strong></TableCell>
              <TableCell><strong>Descripción</strong></TableCell>
              <TableCell align="center"><strong>Capacidad</strong></TableCell>
              <TableCell align="center"><strong>Acciones</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredRooms.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  <Typography color="textSecondary">
                    No se encontraron salas
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredRooms.map((room) => (
                <TableRow
                  key={room.id}
                  sx={{ 
                    '&:hover': { backgroundColor: 'action.hover' }
                  }}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <RoomIcon fontSize="small" color="primary" />
                      <strong>{room.name}</strong>
                    </Box>
                  </TableCell>
                  <TableCell>{room.description || '-'}</TableCell>
                  <TableCell align="center">
                    {room.capacity ? (
                      <Chip 
                        icon={<GroupIcon />} 
                        label={`${room.capacity} personas`} 
                        size="small" 
                        variant="outlined" 
                      />
                    ) : '-'}
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                      <Tooltip title="Editar">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleEditRoom(room)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteRoom(room)}
                        >
                          <DeleteIcon />
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

      {/* Diálogo de formulario */}
      <RoomFormDialog
        open={openForm}
        room={selectedRoom}
        onClose={() => {
          setOpenForm(false);
          setSelectedRoom(null);
        }}
        onSave={() => {
          setOpenForm(false);
          setSelectedRoom(null);
          showNotification(
            selectedRoom ? 'Sala actualizada correctamente' : 'Sala creada correctamente',
            'success'
          );
          setTimeout(() => {
            loadRooms();
            loadStats();
          }, 100);
        }}
      />

      {/* Diálogo de confirmación de eliminación */}
      <Dialog 
        open={openDeleteDialog} 
        onClose={() => setOpenDeleteDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'error.main' }}>
          <WarningIcon />
          Confirmar Eliminación
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <strong>¡Atención!</strong> Esta acción no se puede deshacer.
          </Alert>
          <Typography>
            ¿Está seguro de que desea eliminar permanentemente la sala <strong>{selectedRoom?.name}</strong>?
          </Typography>
          {selectedRoom?.description && (
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              Descripción: {selectedRoom.description}
            </Typography>
          )}
          <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
            Nota: No podrá eliminar la sala si tiene citas programadas.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={confirmDelete} 
            color="error" 
            variant="contained"
            startIcon={<DeleteIcon />}
          >
            Eliminar Permanentemente
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notificaciones */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification({ ...notification, open: false })}
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

export default RoomsPage;