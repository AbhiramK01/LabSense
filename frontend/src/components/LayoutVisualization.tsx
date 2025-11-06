import React from 'react'
import {
  Box,
  Grid,
  Paper,
  Typography,
  Chip,
  Card,
  CardContent,
  Avatar,
  useTheme
} from '@mui/material'
import {
  Computer as ComputerIcon,
  ComputerOutlined as BrokenIcon,
  Person as StudentIcon
} from '@mui/icons-material'

interface LabSystem {
  id: number
  row: number
  col: number
  serialNumber: number | null
  isWorking: boolean
  assignedQuestions: string[]
  isSelected: boolean
}

interface StudentInfo {
  serialNumber: number
  studentName: string
  studentId: string
  score?: number
  status?: 'completed' | 'in_progress' | 'not_started'
}

interface LayoutVisualizationProps {
  layout: {
    length: number
    breadth: number
    systems: LabSystem[]
  }
  students?: StudentInfo[]
  showStudentInfo?: boolean
}

export default function LayoutVisualization({ 
  layout, 
  students = [], 
  showStudentInfo = true 
}: LayoutVisualizationProps) {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const { length, breadth, systems } = layout

  // Create a map of serial numbers to student info
  const studentMap = new Map<number, StudentInfo>()
  students.forEach(student => {
    studentMap.set(student.serialNumber, student)
  })

  const getSystemStatus = (system: LabSystem) => {
    if (!system.isWorking) return 'broken'
    if (system.assignedQuestions.length === 0) return 'no_questions'
    if (studentMap.has(system.serialNumber || 0)) return 'assigned'
    return 'available'
  }

  const getSystemColor = (system: LabSystem) => {
    const status = getSystemStatus(system)
    if (isDark) {
      switch (status) {
        case 'broken': return '#DC2626' // Vibrant red
        case 'no_questions': return '#1F1F1F' // Dark grey (no blue)
        case 'assigned': return '#10B981' // Vibrant emerald green
        case 'available': return '#F59E0B' // Vibrant orange/amber (NO BLUE)
        default: return '#1F1F1F'
      }
    } else {
      switch (status) {
        case 'broken': return '#FCA5A5' // Light red
        case 'no_questions': return '#E2E8F0' // Light grey
        case 'assigned': return '#6EE7B7' // Light green
        case 'available': return '#FCD34D' // Light amber/yellow (NO BLUE)
        default: return '#E2E8F0'
      }
    }
  }

  const getSystemTextColor = (system: LabSystem) => {
    const status = getSystemStatus(system)
    if (isDark) {
      return '#FFFFFF' // Always white in dark mode for contrast
    } else {
      switch (status) {
        case 'broken': return '#FFFFFF'
        case 'no_questions': return '#1E293B'
        case 'assigned': return '#FFFFFF'
        case 'available': return '#FFFFFF'
        default: return '#1E293B'
      }
    }
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>Lab Layout Visualization</Typography>
      
      
      <Grid container spacing={1} sx={{ maxWidth: 800, mb: 3 }}>
        {systems.map((system) => {
          const student = studentMap.get(system.serialNumber || 0)
          const status = getSystemStatus(system)
          
          return (
            <Grid item xs={12 / breadth} key={system.id}>
              <Paper
                sx={{
                  p: 1,
                  textAlign: 'center',
                  backgroundColor: getSystemColor(system),
                  color: getSystemTextColor(system),
                  border: '2px solid',
                  borderColor: isDark 
                    ? (status === 'assigned' ? '#10B981' : status === 'broken' ? '#DC2626' : status === 'available' ? '#F59E0B' : '#1F1F1F')
                    : (status === 'assigned' ? 'success.main' : 'grey.300'),
                  minHeight: 100,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  position: 'relative'
                }}
              >
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  {system.isWorking ? (
                    <ComputerIcon sx={{ 
                      color: status === 'available' || status === 'assigned' ? '#ffffff' : '#7f8c8d' 
                    }} />
                  ) : (
                    <BrokenIcon sx={{ color: '#ffffff' }} />
                  )}
                  
                  <Typography variant="caption" sx={{ 
                    fontWeight: 'bold', 
                    fontSize: '0.8rem',
                    color: status === 'available' || status === 'assigned' || status === 'broken' ? '#ffffff' : '#2c3e50'
                  }}>
                    #{system.serialNumber}
                  </Typography>
                  
                  <Typography variant="caption" sx={{ 
                    fontSize: '0.7rem',
                    color: status === 'available' || status === 'assigned' || status === 'broken' ? '#ffffff' : '#2c3e50'
                  }}>
                    R{system.row}C{system.col}
                  </Typography>
                  
                  {system.assignedQuestions.length > 0 && (
                    <Box sx={{ mt: 0.5, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 0.25 }}>
                      {system.assignedQuestions.map(q => (
                        <Chip
                          key={q}
                          label={`Q${q}`}
                          size="small"
                          color="primary"
                          sx={{ 
                            fontSize: '0.5rem', 
                            height: 16,
                            '& .MuiChip-label': { px: 0.5 }
                          }}
                        />
                      ))}
                    </Box>
                  )}
                  
                  {showStudentInfo && student && (
                    <Box sx={{ mt: 0.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Avatar sx={{ width: 16, height: 16, bgcolor: 'rgba(255, 255, 255, 0.3)' }}>
                        <StudentIcon sx={{ fontSize: '0.7rem' }} />
                      </Avatar>
                      <Typography variant="caption" sx={{ 
                        fontSize: '0.6rem',
                        color: status === 'available' || status === 'assigned' ? '#ffffff' : '#2c3e50',
                        fontWeight: 600
                      }}>
                        {student.studentName}
                      </Typography>
                    </Box>
                  )}
                  
                  {showStudentInfo && !student && system.isWorking && system.assignedQuestions.length > 0 && (
                    <Typography variant="caption" sx={{ 
                      fontSize: '0.6rem', 
                      color: status === 'available' || status === 'assigned' ? '#ffffff' : '#7f8c8d',
                      fontWeight: 500,
                      opacity: status === 'available' || status === 'assigned' ? 0.95 : 1
                    }}>
                      No student assigned
                    </Typography>
                  )}
                </Box>
              </Paper>
            </Grid>
          )
        })}
      </Grid>

      {/* Legend */}
      <Card sx={{ mt: 2 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 1 }}>Legend</Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 20, height: 20, backgroundColor: 'success.light', border: '1px solid', borderColor: 'success.main' }} />
              <Typography variant="caption">Assigned to Student</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 20, height: 20, backgroundColor: 'primary.light', border: '1px solid', borderColor: 'grey.300' }} />
              <Typography variant="caption">Available</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 20, height: 20, backgroundColor: 'grey.300', border: '1px solid', borderColor: 'grey.300' }} />
              <Typography variant="caption">No Questions</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 20, height: 20, backgroundColor: 'error.light', border: '1px solid', borderColor: 'grey.300' }} />
              <Typography variant="caption">Broken</Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}
