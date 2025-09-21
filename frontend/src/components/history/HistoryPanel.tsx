// frontend/src/components/history/HistoryPanel.tsx (versión funcional)
import React from 'react';
import {
  Drawer,
  Box,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  IconButton,
  Chip,
  Button,
  Stack,
  Alert
} from '@mui/material';
import {
  Close as CloseIcon,
  Undo as UndoIcon,
  Redo as RedoIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useHistory } from '../../services/historyService';
import api from '../../services/api';

interface HistoryPanelProps {
  open: boolean;
  onClose: () => void;
  onActionExecuted?: () => void;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ open, onClose, onActionExecuted }) => {
  const { canUndo, canRedo, undo, redo, getRecentActions } = useHistory();
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const recentActions = getRecentActions(20);

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'CREATE':
        return <AddIcon color="success" />;
      case 'DELETE':
        return <DeleteIcon color="error" />;
      case 'UPDATE':
        return <EditIcon color="primary" />;
      default:
        return <HistoryIcon />;
    }
  };

  const getActionName = (type: string) => {
    switch (type) {
      case 'CREATE':
        return 'Creado';
      case 'UPDATE':
        return 'Actualizado';
      case 'DELETE':
        return 'Eliminado';
      default:
        return type;
    }
  };

  const handleUndo = async () => {
    setLoading(true);
    setMessage(null);
    
    const action = await undo();
    if (action) {
      try {
        switch (action.type) {
          case 'CREATE':
            // Si se creó algo, lo eliminamos (realmente lo marcamos como inactivo)
            await api.delete(`/patients/${action.entityId}`);
            setMessage({ text: 'Creación deshecha correctamente', type: 'success' });
            break;
            
          case 'UPDATE':
            // Si se actualizó, restauramos los datos anteriores
            if (action.previousData) {
              // Limpiar campos que no deben enviarse en la actualización
              const { id, createdAt, updatedAt, _count, ...dataToRestore } = action.previousData;
              await api.patch(`/patients/${action.entityId}`, dataToRestore);
              setMessage({ text: 'Actualización deshecha correctamente', type: 'success' });
            }
            break;
            
          case 'DELETE':
            // Si se eliminó, lo restauramos
            if (action.previousData) {
              // Reactivar el paciente
              await api.patch(`/patients/${action.entityId}`, {
                isActive: true,
                deletedAt: null
              });
              setMessage({ text: 'Eliminación deshecha - Paciente restaurado', type: 'success' });
            }
            break;
        }
        
        if (onActionExecuted) {
          onActionExecuted();
        }
      } catch (error: any) {
        console.error('Error al deshacer:', error);
        setMessage({ 
          text: error.response?.data?.message || 'Error al deshacer la acción', 
          type: 'error' 
        });
        // Revertir el índice del historial si falla
        await redo();
      }
    }
    setLoading(false);
  };

  const handleRedo = async () => {
    setLoading(true);
    setMessage(null);
    
    const action = await redo();
    if (action) {
      try {
        switch (action.type) {
          case 'CREATE':
            // Rehacer la creación
            if (action.newData) {
              const { id, createdAt, updatedAt, _count, patientCode, ...dataToCreate } = action.newData;
              await api.post('/patients', dataToCreate);
              setMessage({ text: 'Creación rehecha correctamente', type: 'success' });
            }
            break;
            
          case 'UPDATE':
            // Rehacer la actualización
            if (action.newData) {
              const { id, createdAt, updatedAt, _count, ...dataToUpdate } = action.newData;
              await api.patch(`/patients/${action.entityId}`, dataToUpdate);
              setMessage({ text: 'Actualización rehecha correctamente', type: 'success' });
            }
            break;
            
          case 'DELETE':
            // Rehacer la eliminación
            await api.delete(`/patients/${action.entityId}`);
            setMessage({ text: 'Eliminación rehecha correctamente', type: 'success' });
            break;
        }
        
        if (onActionExecuted) {
          onActionExecuted();
        }
      } catch (error: any) {
        console.error('Error al rehacer:', error);
        setMessage({ 
          text: error.response?.data?.message || 'Error al rehacer la acción', 
          type: 'error' 
        });
        // Revertir el índice si falla
        await undo();
      }
    }
    setLoading(false);
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { width: 350 }
      }}
    >
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">
            Historial de Acciones
          </Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          <Button
            variant="outlined"
            startIcon={<UndoIcon />}
            onClick={handleUndo}
            disabled={!canUndo || loading}
            fullWidth
          >
            Deshacer
          </Button>
          <Button
            variant="outlined"
            startIcon={<RedoIcon />}
            onClick={handleRedo}
            disabled={!canRedo || loading}
            fullWidth
          >
            Rehacer
          </Button>
        </Stack>

        {message && (
          <Alert severity={message.type} sx={{ mb: 2 }} onClose={() => setMessage(null)}>
            {message.text}
          </Alert>
        )}

        <Divider />

        <List sx={{ mt: 2 }}>
          {recentActions.length === 0 ? (
            <ListItem>
              <ListItemText
                primary="No hay acciones recientes"
                secondary="Las acciones realizadas aparecerán aquí"
              />
            </ListItem>
          ) : (
            recentActions.map((action) => (
              <ListItem key={action.id}>
                <ListItemIcon>
                  {getActionIcon(action.type)}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2">
                        {action.description}
                      </Typography>
                      {action.undoable && (
                        <Chip 
                          label={getActionName(action.type)} 
                          size="small" 
                          variant="outlined"
                          color={
                            action.type === 'CREATE' ? 'success' :
                            action.type === 'DELETE' ? 'error' : 'primary'
                          }
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    <Typography variant="caption">
                      {formatDistanceToNow(new Date(action.timestamp), { 
                        addSuffix: true, 
                        locale: es 
                      })}
                    </Typography>
                  }
                />
              </ListItem>
            ))
          )}
        </List>
      </Box>
    </Drawer>
  );
};

export default HistoryPanel;