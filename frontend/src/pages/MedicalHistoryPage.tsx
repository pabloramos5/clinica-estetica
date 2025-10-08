import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  Divider,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  CalendarToday as CalendarIcon,
  Person as DoctorIcon,
  Room as RoomIcon,
  CheckCircle as CompletedIcon,
  Cancel as CancelledIcon,
  Schedule as ScheduledIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { medicalHistoryService } from '../services/medicalHistoryService';

const MedicalHistoryPage: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [expandedTreatment, setExpandedTreatment] = useState<string | null>(null);
  const [treatmentDetails, setTreatmentDetails] = useState<Record<string, any>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [patientId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [summaryData, statsData] = await Promise.all([
        medicalHistoryService.getPatientSummary(patientId!),
        medicalHistoryService.getPatientStats(patientId!),
      ]);
      setSummary(summaryData);
      setStats(statsData);
    } catch (err: any) {
      setError(err.message || 'Error al cargar el historial');
    } finally {
      setLoading(false);
    }
  };

  const handleTreatmentExpand = async (treatmentId: string) => {
    if (expandedTreatment === treatmentId) {
      setExpandedTreatment(null);
      return;
    }

    setExpandedTreatment(treatmentId);

    if (!treatmentDetails[treatmentId]) {
      try {
        const details = await medicalHistoryService.getTreatmentDetails(patientId!, treatmentId);
        setTreatmentDetails(prev => ({
          ...prev,
          [treatmentId]: details,
        }));
      } catch (err) {
        console.error('Error loading treatment details:', err);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETADA':
        return 'success';
      case 'CANCELADA':
        return 'error';
      case 'PROGRAMADA':
        return 'primary';
      case 'CONFIRMADA':
        return 'info';
      case 'NO_SHOW':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETADA':
        return <CompletedIcon fontSize="small" />;
      case 'CANCELADA':
        return <CancelledIcon fontSize="small" />;
      default:
        return <ScheduledIcon fontSize="small" />;
    }
  };

  const getTreatmentIcon = (treatmentName: string) => {
    const name = treatmentName.toLowerCase();
    if (name.includes('laser') || name.includes('láser')) return '🔬';
    if (name.includes('botox') || name.includes('vistabel')) return '💉';
    if (name.includes('infiltr')) return '💊';
    if (name.includes('peeling')) return '🌟';
    if (name.includes('varices') || name.includes('flebolog')) return '🩺';
    return '💆';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box px={4} pt={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box px={4} pt={3} pb={4}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
        📋 Historial Médico
      </Typography>

      {/* Estadísticas */}
      {stats && (
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Total Sesiones
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 600 }}>
                  {stats.totalAppointments}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Completadas
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 600, color: 'success.main' }}>
                  {stats.completedAppointments}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Tipos de Tratamiento
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 600, color: 'primary.main' }}>
                  {stats.treatmentTypes}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Próximas Citas
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 600, color: 'info.main' }}>
                  {stats.upcomingAppointments}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Resumen de Tratamientos */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
          Tratamientos Realizados
        </Typography>

        {summary?.treatments.map((treatment: any) => (
          <Accordion
            key={treatment.treatmentId}
            expanded={expandedTreatment === treatment.treatmentId}
            onChange={() => handleTreatmentExpand(treatment.treatmentId)}
            sx={{ mb: 1 }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box display="flex" alignItems="center" width="100%" gap={2}>
                <Typography variant="h6" sx={{ fontSize: '1.5rem' }}>
                  {getTreatmentIcon(treatment.treatmentName)}
                </Typography>
                <Box flex={1}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {treatment.treatmentName}
                  </Typography>
                  <Box display="flex" gap={1} mt={0.5} flexWrap="wrap">
                    <Chip
                      label={`${treatment.totalSessions} sesiones`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                    <Chip
                      label={`${treatment.completedSessions} completadas`}
                      size="small"
                      color="success"
                      variant="outlined"
                    />
                    {treatment.cancelledSessions > 0 && (
                      <Chip
                        label={`${treatment.cancelledSessions} canceladas`}
                        size="small"
                        color="error"
                        variant="outlined"
                      />
                    )}
                  </Box>
                </Box>
                <Box textAlign="right">
                  <Typography variant="caption" color="textSecondary" display="block">
                    Última sesión
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {new Date(treatment.lastSession).toLocaleDateString('es-ES')}
                  </Typography>
                </Box>
              </Box>
            </AccordionSummary>

            <AccordionDetails>
              {treatmentDetails[treatment.treatmentId] ? (
                <List>
                  {treatmentDetails[treatment.treatmentId].appointments.map(
                    (appointment: any, index: number) => (
                      <React.Fragment key={appointment.id}>
                        {index > 0 && <Divider />}
                        <ListItem
                          sx={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            py: 2,
                          }}
                        >
                          <Box flex={1}>
                            <Box display="flex" alignItems="center" gap={1} mb={1}>
                              <CalendarIcon fontSize="small" color="action" />
                              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                {new Date(appointment.date).toLocaleDateString('es-ES', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                })}
                              </Typography>
                              <Chip
                                icon={getStatusIcon(appointment.status)}
                                label={appointment.status}
                                size="small"
                                color={getStatusColor(appointment.status)}
                              />
                            </Box>

                            <Box display="flex" gap={3} mb={1} flexWrap="wrap">
                              <Box display="flex" alignItems="center" gap={0.5}>
                                <DoctorIcon fontSize="small" color="action" />
                                <Typography variant="body2" color="textSecondary">
                                  {appointment.doctor.name}
                                </Typography>
                              </Box>
                              <Box display="flex" alignItems="center" gap={0.5}>
                                <RoomIcon fontSize="small" color="action" />
                                <Typography variant="body2" color="textSecondary">
                                  {appointment.room.name}
                                </Typography>
                              </Box>
                              <Box display="flex" alignItems="center" gap={0.5}>
                                <ScheduledIcon fontSize="small" color="action" />
                                <Typography variant="body2" color="textSecondary">
                                  {new Date(appointment.startTime).toLocaleTimeString('es-ES', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                  {' - '}
                                  {new Date(appointment.endTime).toLocaleTimeString('es-ES', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </Typography>
                              </Box>
                            </Box>

                            {appointment.observations && (
                              <Box
                                sx={{
                                  mt: 1,
                                  p: 1.5,
                                  bgcolor: 'grey.50',
                                  borderRadius: 1,
                                  borderLeft: 3,
                                  borderColor: 'primary.main',
                                }}
                              >
                                <Typography variant="body2" color="textSecondary">
                                  <strong>Observaciones:</strong> {appointment.observations}
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        </ListItem>
                      </React.Fragment>
                    )
                  )}
                </List>
              ) : (
                <Box display="flex" justifyContent="center" py={3}>
                  <CircularProgress size={30} />
                </Box>
              )}
            </AccordionDetails>
          </Accordion>
        ))}

        {summary?.treatments.length === 0 && (
          <Alert severity="info">
            No hay tratamientos registrados para este paciente.
          </Alert>
        )}
      </Paper>
    </Box>
  );
};

export default MedicalHistoryPage;