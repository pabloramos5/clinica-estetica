import { useState, useEffect } from 'react'
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
} from '@mui/material'
import {
  Notifications as NotificationsIcon,
  AccountCircle,
  Undo as UndoIcon
} from '@mui/icons-material'
import Sidebar from '../components/layout/Sidebar'
import DashboardHome from '../components/dashboard/DashboardHome'
import PatientsPage from '../pages/PatientsPage'
import AppointmentsPage from '../pages/AppointmentsPage'
import api from '../services/api'

interface DashboardProps {
  user: any
  onLogout: () => void
}

const drawerWidth = 240

export default function Dashboard({ user, onLogout }: DashboardProps) {
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [notifications, setNotifications] = useState(0)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [stats, setStats] = useState({
    todayAppointments: 0,
    totalPatients: 0,
    pendingBills: 0
  })

  useEffect(() => {
    loadStats()
    checkNotifications()
  }, [])

  const loadStats = async () => {
    try {
      // Aquí cargaremos las estadísticas reales del backend
      setStats({
        todayAppointments: 5,
        totalPatients: 150,
        pendingBills: 8
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const checkNotifications = async () => {
    // Verificar notificaciones pendientes
    setNotifications(3)
  }

  const handleProfileMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleCloseMenu = () => {
    setAnchorEl(null)
  }

  const handleUndo = () => {
    // Implementar función de deshacer
    console.log('Deshacer última acción')
  }

  const renderPage = () => {
    switch(currentPage) {
      case 'dashboard':
        return <DashboardHome stats={stats} />
      case 'patients':
        return <PatientsPage />
      case 'appointments':
        return <AppointmentsPage />
      case 'doctors':
        return <div>Gestión de Médicos - Por implementar</div>
      case 'treatments':
        return <div>Gestión de Tratamientos - Por implementar</div>
      case 'rooms':
        return <div>Gestión de Salas - Por implementar</div>
      case 'billing':
        return <div>Facturación - Por implementar</div>
      case 'statistics':
        return <div>Estadísticas - Por implementar</div>
      case 'settings':
        return <div>Configuración - Por implementar</div>
      default:
        return <DashboardHome stats={stats} />
    }
  }

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
            {currentPage.charAt(0).toUpperCase() + currentPage.slice(1)}
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
      
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />
      
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
        {renderPage()}
      </Box>
    </Box>
  )
}