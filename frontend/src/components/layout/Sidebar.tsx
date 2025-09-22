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
  Typography
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
  Groups as GroupsIcon
} from '@mui/icons-material';

const drawerWidth = 240;

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Obtener la página actual desde la URL
  const currentPage = location.pathname.replace('/', '') || 'dashboard';

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

  const handleNavigate = (page: string) => {
    navigate(`/${page}`);
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
      <Divider />
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