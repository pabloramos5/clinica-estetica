import { useState, useEffect } from 'react';
import { HashRouter } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import api from './services/api';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar si hay un token guardado
    const token = localStorage.getItem('token');
    if (token) {
      // Verificar que el token sea válido
      verifyToken(token);
    } else {
      setLoading(false);
    }
  }, []);

  const verifyToken = async (token: string) => {
    try {
      // Configurar el token en las cabeceras por defecto
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Hacer una petición para verificar el token
      const response = await api.get('/auth/profile');
      
      setUser(response.data);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Token inválido:', error);
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

const handleLogin = (userData: any) => {
  console.log('=== DEBUG LOGIN ===');
  console.log('userData completo:', userData);
  console.log('accessToken extraído:', userData.accessToken);
  
  const token = userData.accessToken;
  
  if (!token) {
    console.error('ERROR: No hay accessToken');
    return;
  }
  
  setIsAuthenticated(true);
  setUser(userData.user);
  localStorage.setItem('token', token);
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  
  // Verificar que se guardó
  console.log('Token guardado en localStorage:', localStorage.getItem('token'));
  console.log('Headers configurados:', api.defaults.headers.common);
  console.log('=== FIN DEBUG LOGIN ===');
};

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div>Cargando...</div>
      </div>
    );
  }

  // Si NO está autenticado, mostrar LoginPage sin Router
  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // Si está autenticado, envolver Dashboard con HashRouter
  return (
    <HashRouter>
      <Dashboard user={user} onLogout={handleLogout} />
    </HashRouter>
  );
}

export default App;