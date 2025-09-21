import { Box, Grid } from '@mui/material'
import WeekCalendar from './WeekCalendar'

interface DashboardHomeProps {
  stats: {
    todayAppointments: number
    totalPatients: number
    pendingBills: number
  }
}

export default function DashboardHome({ stats }: DashboardHomeProps) {
  return (
    <Box sx={{ height: '100%' }}>
      <Grid container spacing={2} sx={{ height: '100%' }}>
        <Grid item xs={12}>
          <WeekCalendar />
        </Grid>
      </Grid>
    </Box>
  )
}