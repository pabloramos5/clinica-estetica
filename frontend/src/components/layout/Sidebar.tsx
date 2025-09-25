import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Drawer, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  ListItemButton,
  Divider,
  Toolbar,
  Box,
  Typography,
  Chip
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  CalendarMonth as CalendarIcon,
  MedicalServices as MedicalIcon,
  Receipt as ReceiptIcon,
  Room as RoomIcon,
  Assessment as AssessmentIcon,
  Settings as SettingsIcon,
  LocalHospital as HospitalIcon,
  Groups as GroupsIcon,
  SupervisorAccount as SupervisorAccountIcon,
  AdminPanelSettings as AdminIcon
} from '@mui/icons-material';

const drawerWidth = 240;

interface SidebarProps {
  user?: any; // Recibir el usuario como prop
  onLogout?: () => void; // Recibir función de logout como prop (opcional)
}

export default function Sidebar({ user, onLogout }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Obtener la página actual desde la URL
  const currentPage = location.pathname.replace('/', '') || 'dashboard';

  // Menú principal
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
    { id: 'appointments', label: 'Citas', icon: <CalendarIcon /> },
    { id: 'patients', label: 'Pacientes', icon: <PeopleIcon /> },
    { id: 'doctors', label: 'Médicos', icon: <GroupsIcon /> },
    { id: 'treatments', label: 'Tratamientos', icon: <MedicalIcon /> },
    { id: 'rooms', label: 'Salas', icon: <RoomIcon /> },
    { id: 'billing', label: 'Facturación', icon: <ReceiptIcon /> },
    { id: 'statistics', label: 'Estadísticas', icon: <AssessmentIcon /> },
  ];

  // Menú de administración (solo visible para ADMIN)
  const adminItems = user?.role === 'ADMIN' ? [
    { id: 'users', label: 'Usuarios', icon: <SupervisorAccountIcon /> },
  ] : [];

  const handleNavigate = (page: string) => {
    navigate(`/${page}`);
  };

  // Función para obtener el label del rol
  const getRoleLabel = (role: string) => {
    switch(role) {
      case 'ADMIN': return 'Administrador';
      case 'MEDICO': return 'Médico';
      case 'AUXILIAR': return 'Auxiliar';
      case 'RECEPCION': return 'Recepción';
      default: return role;
    }
  };

  // Función para obtener el color del rol
  const getRoleColor = (role: string): "error" | "primary" | "secondary" | "warning" => {
    switch(role) {
      case 'ADMIN': return 'error';
      case 'MEDICO': return 'primary';
      case 'AUXILIAR': return 'secondary';
      case 'RECEPCION': return 'warning';
      default: return 'primary';
    }
  };

  return (
    <Drawer
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          position: 'fixed',
          height: '100vh',
        },
      }}
      variant="permanent"
      anchor="left"
    >
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <HospitalIcon color="primary" />
          <Box>
            <Typography variant="h6" noWrap component="div">
              Clínica
            </Typography>
            <Typography variant="caption" color="textSecondary">
              Sistema de Gestión
            </Typography>
          </Box>
        </Box>
      </Toolbar>
      <Divider />
      
      {/* Información del usuario si está disponible */}
      {user && (
        <>
          <Box sx={{ p: 2 }}>
            <Typography variant="subtitle2" color="textSecondary">
              Usuario actual:
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 'bold', mt: 0.5 }}>
              {user.name}
            </Typography>
            <Chip 
              label={getRoleLabel(user.role)} 
              color={getRoleColor(user.role)}
              size="small"
              sx={{ mt: 1 }}
            />
          </Box>
          <Divider />
        </>
      )}
      
      {/* Menú principal */}
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.id} disablePadding>
            <ListItemButton
              selected={currentPage === item.id}
              onClick={() => handleNavigate(item.id)}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: 'primary.light',
                  '& .MuiListItemIcon-root': {
                    color: 'primary.main',
                  },
                },
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      
      {/* Sección de Administración - Solo visible para ADMIN */}
      {adminItems.length > 0 && (
        <>
          <Divider />
          <List>
            <ListItem>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                <AdminIcon fontSize="small" />
                <Typography variant="caption" sx={{ textTransform: 'uppercase', fontWeight: 'bold' }}>
                  Administración
                </Typography>
              </Box>
            </ListItem>
            {adminItems.map((item) => (
              <ListItem key={item.id} disablePadding>
                <ListItemButton
                  selected={currentPage === item.id}
                  onClick={() => handleNavigate(item.id)}
                  sx={{
                    '&.Mui-selected': {
                      backgroundColor: 'error.light',
                      '& .MuiListItemIcon-root': {
                        color: 'error.main',
                      },
                    },
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    },
                  }}
                >
                  <ListItemIcon sx={{ color: 'error.main' }}>{item.icon}</ListItemIcon>
                  <ListItemText 
                    primary={item.label} 
                    sx={{ 
                      '& .MuiTypography-root': { 
                        color: 'error.main',
                        fontWeight: currentPage === item.id ? 'bold' : 'normal'
                      } 
                    }} 
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </>
      )}
      
      <Divider />
      
      {/* Configuración al final */}
      <List sx={{ marginTop: 'auto' }}>
        <ListItem disablePadding>
          <ListItemButton 
            onClick={() => handleNavigate('settings')}
            selected={currentPage === 'settings'}
          >
            <ListItemIcon>
              <SettingsIcon />
            </ListItemIcon>
            <ListItemText primary="Configuración" />
          </ListItemButton>
        </ListItem>
      </List>
    </Drawer>
  );
}