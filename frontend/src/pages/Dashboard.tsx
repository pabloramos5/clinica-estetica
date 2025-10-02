import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { 
  Box, 
  AppBar, 
  Toolbar, 
  Typography, 
  Button,
  IconButton,
  Badge,
  Avatar,
  Menu,
  MenuItem
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  AccountCircle,
  Undo as UndoIcon
} from '@mui/icons-material';
import Sidebar from '../components/layout/Sidebar';
import DashboardHome from '../components/dashboard/DashboardHome';
import PatientsPage from './PatientsPage';
import AppointmentsPage from './AppointmentsPage';
import RoomsPage from './RoomsPage';
import TreatmentsPage from './TreatmentsPage';
import api from '../services/api';
import DoctorsPage from './DoctorsPage';
interface DashboardProps {
  user: any;
  onLogout: () => void;
}

const drawerWidth = 240;

export default function Dashboard({ user, onLogout }: DashboardProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications, setNotifications] = useState(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [stats, setStats] = useState({
    todayAppointments: 0,
    totalPatients: 0,
    pendingBills: 0
  });

  // Obtener la página actual desde la URL
  const currentPage = location.pathname.replace('/', '') || 'dashboard';

  useEffect(() => {
    loadStats();
    checkNotifications();
  }, []);

  const loadStats = async () => {
    try {
      // Aquí cargaremos las estadísticas reales del backend
      setStats({
        todayAppointments: 5,
        totalPatients: 150,
        pendingBills: 8
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const checkNotifications = async () => {
    // Verificar notificaciones pendientes
    setNotifications(3);
  };

  const handleProfileMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleUndo = () => {
    // Implementar función de deshacer
    console.log('Deshacer última acción');
  };

  const handleNavigate = (page: string) => {
    navigate(`/${page}`);
  };




  const BillingPage = () => (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Facturación</Typography>
      <Typography color="textSecondary">Por implementar...</Typography>
    </Box>
  );

  const StatisticsPage = () => (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Estadísticas</Typography>
      <Typography color="textSecondary">Por implementar...</Typography>
    </Box>
  );

  const SettingsPage = () => (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Configuración</Typography>
      <Typography color="textSecondary">Por implementar...</Typography>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: `calc(100% - ${drawerWidth}px)`,
          ml: `${drawerWidth}px`,
        }}
      >
        <Toolbar>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {currentPage.charAt(0).toUpperCase() + currentPage.slice(1).replace('-', ' ')}
          </Typography>
          
          <IconButton
            color="inherit"
            onClick={handleUndo}
            sx={{ mr: 2 }}
            title="Deshacer última acción"
          >
            <UndoIcon />
          </IconButton>

          <IconButton
            color="inherit"
            sx={{ mr: 2 }}
          >
            <Badge badgeContent={notifications} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography>{user?.username}</Typography>
            <IconButton
              onClick={handleProfileMenu}
              color="inherit"
            >
              <Avatar sx={{ width: 32, height: 32 }}>
                {user?.username?.charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>
          </Box>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleCloseMenu}
          >
            <MenuItem onClick={handleCloseMenu}>Mi Perfil</MenuItem>
            <MenuItem onClick={onLogout}>Cerrar Sesión</MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      
      <Sidebar currentPage={currentPage} onNavigate={handleNavigate} />
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: 'background.default',
          p: 3,
          marginTop: '64px',
          minHeight: 'calc(100vh - 64px)',
        }}
      >
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardHome stats={stats} />} />
          <Route path="/patients" element={<PatientsPage />} />
          <Route path="/appointments" element={<AppointmentsPage />} />
          <Route path="/doctors" element={<DoctorsPage/>} />
          <Route path="/treatments" element={<TreatmentsPage />} />
          <Route path="/rooms" element={<RoomsPage />} />
          <Route path="/billing" element={<BillingPage />} />
          <Route path="/statistics" element={<StatisticsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route 
            path="*" 
            element={
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="h4" gutterBottom>
                  Página no encontrada
                </Typography>
                <Typography color="textSecondary">
                  La página que buscas no existe.
                </Typography>
              </Box>
            } 
          />
        </Routes>
      </Box>
    </Box>
  );
}