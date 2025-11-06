import React, { useEffect, useMemo, useState } from 'react'
import { createExam, listExams, listResults, ExamCreate, Question, TestCase, toggleExamStatus, calculateQuestionAssignment, getFullExamDetails, deleteExam, getSubmissions, downloadCSV, getFilterOptions, deleteStudentAttempt } from '../api'
import { Box, TextField, Button, MenuItem, Typography, Paper, Divider, IconButton, Chip, Switch, FormControlLabel, Alert, Dialog, DialogTitle, DialogContent, DialogActions, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Grid, Stack, FormControl, InputLabel, Select, CircularProgress, Card, CardContent, LinearProgress, Avatar, List, ListItem, ListItemButton, ListItemText, Accordion, AccordionSummary, AccordionDetails, TableSortLabel, useTheme } from '@mui/material'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import StopIcon from '@mui/icons-material/Stop'
import DeleteIcon from '@mui/icons-material/Delete'
import Download from '@mui/icons-material/Download'
import SchoolIcon from '@mui/icons-material/School'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import AssessmentIcon from '@mui/icons-material/Assessment'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import PeopleIcon from '@mui/icons-material/People'
import AssignmentIcon from '@mui/icons-material/Assignment'
import VisibilityIcon from '@mui/icons-material/Visibility'
import StarIcon from '@mui/icons-material/Star'
import FlagIcon from '@mui/icons-material/Flag'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import LabLayoutCreator from './LabLayoutCreator'
import IntegratedCreateExam from './IntegratedCreateExam'
import LayoutVisualization from './LayoutVisualization'
import ReportsView from './ReportsView'

function useToken() {
	const [token, setToken] = useState('')
	useEffect(() => {
		const t = localStorage.getItem('token') || ''
		setToken(t)
	}, [])
	return token
}

const languages = ['python','javascript','java','c','cpp','go'] as const

export default function FacultyDashboard() {
	const token = useToken()
	const theme = useTheme()
	const [tab, setTab] = useState(0)
	const [refreshTrigger, setRefreshTrigger] = useState(0)
	const [templateExamId, setTemplateExamId] = useState<string | undefined>(undefined)
	const isDark = theme.palette.mode === 'dark'

	function handleUseTemplate(examId: string) {
		setTemplateExamId(examId)
		setTab(0)
	}

	return (
		<Box sx={{ display: 'flex', minHeight: 'calc(100vh - 100px)', bgcolor: 'background.default' }}>
			{/* Sidebar Navigation */}
			<Box sx={{ 
				width: 280, 
				borderRight: '1px solid',
				borderColor: 'divider',
				py: 4,
				px: 3,
				bgcolor: 'background.paper',
				boxShadow: isDark ? 2 : 'none'
			}}>
				<Typography variant="h6" sx={{ 
					mb: 5, 
					fontWeight: 700, 
					color: 'text.primary',
					letterSpacing: '-0.025em',
					fontSize: '1.125rem'
				}}>
					Faculty Dashboard
				</Typography>
				
				<List sx={{ p: 0 }}>
					{[{ label: 'Create Exam', index: 0 }, { label: 'Manage Exams', index: 1 }, { label: 'Results', index: 2 }, { label: 'Submissions', index: 3 }, { label: 'Reports', index: 4 }].map((item) => (
						<ListItemButton 
							key={item.index}
							selected={tab === item.index}
							onClick={() => setTab(item.index)}
							sx={{ 
								borderRadius: '8px',
								mb: 1,
								px: 3,
								py: 1.75,
								transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
								'&.Mui-selected': {
									bgcolor: isDark ? '#1F1F1F' : 'primary.main',
									color: '#FFFFFF',
									'&:hover': {
										bgcolor: isDark ? '#2F2F2F' : 'primary.dark',
									},
									'& .MuiListItemText-primary': {
										color: '#FFFFFF'
									}
								},
								'&:hover': {
									bgcolor: isDark ? 'action.hover' : 'action.hover',
								}
							}}
						>
							<ListItemText 
								primary={item.label} 
								primaryTypographyProps={{ 
									fontWeight: tab === item.index ? 600 : 500, 
									fontSize: '0.9375rem',
									letterSpacing: '-0.01em',
													color: tab === item.index ? '#FFFFFF' : 'text.secondary'
								}}
							/>
						</ListItemButton>
					))}
				</List>
			</Box>
			
			{/* Main Content Area */}
			<Box sx={{ flexGrow: 1, p: 5, overflow: 'auto', maxWidth: 1200, mx: 'auto', width: '100%' }}>
		
				{tab === 0 && <IntegratedCreateExam token={token} templateExamId={templateExamId} />}
				{tab === 1 && <ManageExamsView token={token} refreshTrigger={refreshTrigger} onUseTemplateClick={(examId: string) => handleUseTemplate(examId)} />}
				{tab === 2 && <ResultsView token={token} />}
				{tab === 3 && <SubmissionsView token={token} />}
				{tab === 4 && <ReportsView token={token} />}
			</Box>
		</Box>
	)
}

function ManageExamsView({ token, refreshTrigger, onUseTemplateClick }: { token: string, refreshTrigger: number, onUseTemplateClick: (examId: string) => void }) {
	const theme = useTheme()
	const isDark = theme.palette.mode === 'dark'
	const [exams, setExams] = useState<any[]>([])
	const [error, setError] = useState<string | null>(null)
	const [loading, setLoading] = useState(false)
	const [questionsPerStudent, setQuestionsPerStudent] = useState(1)
	const [assignmentResult, setAssignmentResult] = useState<any>(null)
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
	const [examToDelete, setExamToDelete] = useState<string | null>(null)
	const [autoRefresh, setAutoRefresh] = useState(true)
	
	// Search and filter states
	const [searchQuery, setSearchQuery] = useState('')
	const [statusFilter, setStatusFilter] = useState<'all' | 'live' | 'disabled'>('all')
	const [deptFilter, setDeptFilter] = useState<string>('all')
	const [yearFilter, setYearFilter] = useState<string>('all')
	const [sectionFilter, setSectionFilter] = useState<string>('all')

	useEffect(() => {
		loadExams()
	}, [])

	useEffect(() => {
		if (autoRefresh) {
			const interval = setInterval(loadExams, 5000) // Refresh every 5 seconds
			return () => clearInterval(interval)
		}
	}, [autoRefresh])

	useEffect(() => {
		loadExams()
	}, [refreshTrigger])

	async function loadExams() {
		try {
			setError(null)
			const data = await listExams(token)
			setExams(data.exams || [])
		} catch (err: any) {
			setError(err.message || 'Failed to load exams')
		}
	}

	async function handleToggleStatus(exam: any) {
		try {
        // Warn if disabling and there are live takers
        if (exam.is_live) {
            try {
                const data = await listResults(token)
                const entry = (data.results || []).find((r: any) => r.exam_id === exam.exam_id)
                const live = entry?.live_takers || 0
                if (live > 0) {
                    const ok = confirm(`There are ${live} live taker(s). Disabling will immediately end their sessions. Continue?`)
                    if (!ok) return
                }
            } catch {}
        }
        setLoading(true)
        await toggleExamStatus(token, exam.exam_id)
			await loadExams()
		} catch (err: any) {
			alert(err.message || 'Failed to toggle exam status')
		} finally {
			setLoading(false)
		}
	}

	function handleDeleteClick(examId: string) {
		setExamToDelete(examId)
		setDeleteDialogOpen(true)
	}

	async function confirmDelete() {
		if (!examToDelete) return
		
		try {
			setError(null)
			await deleteExam(token, examToDelete)
			await loadExams()
			setDeleteDialogOpen(false)
			setExamToDelete(null)
		} catch (err: any) {
			setError(err.message || 'Failed to delete exam')
		}
	}
	
	// Get unique values for filters from exam data
	const availableDepts = useMemo(() => {
		const depts = new Set<string>()
		exams.forEach(exam => {
			exam.allowed_departments?.forEach((dept: string) => depts.add(dept))
		})
		return Array.from(depts).sort()
	}, [exams])
	
	const availableYears = useMemo(() => {
		const years = new Set<number>()
		exams.forEach(exam => {
			exam.allowed_years?.forEach((year: number) => years.add(year))
		})
		return Array.from(years).sort()
	}, [exams])
	
	const availableSections = useMemo(() => {
		const sections = new Set<string>()
		exams.forEach(exam => {
			exam.allowed_sections?.forEach((section: string) => sections.add(section))
		})
		return Array.from(sections).sort()
	}, [exams])
	
	// Filter and search exams
	const filteredExams = useMemo(() => {
		return exams.filter(exam => {
			// Search filter (partial match on subject name and exam ID)
			const matchesSearch = searchQuery === '' || 
				exam.subject_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				exam.exam_id.toLowerCase().includes(searchQuery.toLowerCase())
			
			// Status filter
			const matchesStatus = statusFilter === 'all' || 
				(statusFilter === 'live' && exam.is_live) ||
				(statusFilter === 'disabled' && !exam.is_live)
			
			// Department filter
			const matchesDept = deptFilter === 'all' || 
				(exam.allowed_departments && exam.allowed_departments.includes(deptFilter))
			
			// Year filter
			const matchesYear = yearFilter === 'all' || 
				(exam.allowed_years && exam.allowed_years.includes(Number(yearFilter)))
			
			// Section filter
			const matchesSection = sectionFilter === 'all' || 
				(exam.allowed_sections && exam.allowed_sections.includes(sectionFilter))
			
			return matchesSearch && matchesStatus && matchesDept && matchesYear && matchesSection
		})
	}, [exams, searchQuery, statusFilter, deptFilter, yearFilter, sectionFilter])

	return (
		<Box>
			<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 5 }}>
				<Typography variant="h5" sx={{ 
					fontWeight: 600, 
					color: 'text.primary',
					letterSpacing: '-0.025em'
				}}>
					Manage Exams
				</Typography>
				<Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
					<FormControlLabel
						control={
							<Switch
								checked={autoRefresh}
								onChange={(e) => setAutoRefresh(e.target.checked)}
								size="small"
							/>
						}
						label={<Typography variant="body2" sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>Auto Refresh</Typography>}
					/>
					<Button 
						variant="outlined" 
						onClick={loadExams} 
						disabled={loading}
						sx={{
							borderColor: 'divider',
							color: 'text.secondary',
							textTransform: 'none',
							fontWeight: 500,
							fontSize: '0.875rem',
							px: 3,
							'&:hover': {
								borderColor: 'divider',
								bgcolor: 'action.hover'
							}
						}}
					>
						Refresh
					</Button>
				</Box>
			</Box>

		{error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
		
		{/* Search and Filter Bar */}
		<Paper sx={{ 
			p: 4, 
			mb: 4, 
			borderRadius: '12px', 
			border: '1px solid',
			borderColor: 'divider',
			boxShadow: 'none'
		}}>
			<Grid container spacing={2.5} alignItems="center">
				<Grid item xs={12} md={12}>
					<TextField
						fullWidth
						placeholder="Search by exam name or ID..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						size="small"
						sx={{ 
							'& .MuiOutlinedInput-root': {
								bgcolor: isDark ? 'background.paper' : 'action.hover',
								borderRadius: '8px',
								'& fieldset': {
									borderColor: 'divider',
								},
								'&:hover fieldset': {
									borderColor: 'divider',
								},
								'&.Mui-focused fieldset': {
									borderColor: 'primary.main',
									borderWidth: '1px',
								}
							}
						}}
					/>
				</Grid>
				<Grid item xs={12} sm={6} md={2}>
					<FormControl fullWidth size="small">
						<InputLabel sx={{ fontSize: '0.875rem' }}>Status</InputLabel>
						<Select
							value={statusFilter}
							label="Status"
							onChange={(e) => setStatusFilter(e.target.value as any)}
							sx={{ 
								borderRadius: '8px',
								'& .MuiOutlinedInput-notchedOutline': {
									borderColor: 'divider',
								},
								'&:hover .MuiOutlinedInput-notchedOutline': {
									borderColor: '#CBD5E1',
								}
							}}
						>
							<MenuItem value="all">All Status</MenuItem>
							<MenuItem value="live">Live</MenuItem>
							<MenuItem value="disabled">Disabled</MenuItem>
						</Select>
					</FormControl>
				</Grid>
				<Grid item xs={12} sm={6} md={3}>
					<FormControl fullWidth size="small">
						<InputLabel sx={{ fontSize: '0.875rem' }}>Department</InputLabel>
						<Select
							value={deptFilter}
							label="Department"
							onChange={(e) => setDeptFilter(e.target.value)}
							sx={{ 
								borderRadius: '8px',
								'& .MuiOutlinedInput-notchedOutline': {
									borderColor: 'divider',
								},
								'&:hover .MuiOutlinedInput-notchedOutline': {
									borderColor: '#CBD5E1',
								}
							}}
						>
							<MenuItem value="all">All Departments</MenuItem>
							{availableDepts.map(dept => (
								<MenuItem key={dept} value={dept}>{dept}</MenuItem>
							))}
						</Select>
					</FormControl>
				</Grid>
				<Grid item xs={12} sm={6} md={2}>
					<FormControl fullWidth size="small">
						<InputLabel sx={{ fontSize: '0.875rem' }}>Year</InputLabel>
						<Select
							value={yearFilter}
							label="Year"
							onChange={(e) => setYearFilter(e.target.value)}
							sx={{ 
								borderRadius: '8px',
								'& .MuiOutlinedInput-notchedOutline': {
									borderColor: 'divider',
								},
								'&:hover .MuiOutlinedInput-notchedOutline': {
									borderColor: '#CBD5E1',
								}
							}}
						>
							<MenuItem value="all">All Years</MenuItem>
							{availableYears.map(year => (
								<MenuItem key={year} value={year.toString()}>Year {year}</MenuItem>
							))}
						</Select>
					</FormControl>
				</Grid>
				<Grid item xs={12} sm={6} md={2}>
					<FormControl fullWidth size="small">
						<InputLabel sx={{ fontSize: '0.875rem' }}>Section</InputLabel>
						<Select
							value={sectionFilter}
							label="Section"
							onChange={(e) => setSectionFilter(e.target.value)}
							sx={{ 
								borderRadius: '8px',
								'& .MuiOutlinedInput-notchedOutline': {
									borderColor: 'divider',
								},
								'&:hover .MuiOutlinedInput-notchedOutline': {
									borderColor: '#CBD5E1',
								}
							}}
						>
							<MenuItem value="all">All Sections</MenuItem>
							{availableSections.map(section => (
								<MenuItem key={section} value={section}>Section {section}</MenuItem>
							))}
						</Select>
					</FormControl>
				</Grid>
				<Grid item xs={12} sm={12} md={3}>
					<Button 
						variant="outlined" 
						fullWidth 
						onClick={() => {
							setSearchQuery('')
							setStatusFilter('all')
							setDeptFilter('all')
							setYearFilter('all')
							setSectionFilter('all')
						}}
						size="small"
						sx={{
							borderColor: 'divider',
							color: 'text.secondary',
							textTransform: 'none',
							fontWeight: 500,
							fontSize: '0.875rem',
							borderRadius: '8px',
							'&:hover': {
								borderColor: '#CBD5E1',
																		bgcolor: isDark ? 'action.hover' : 'action.hover'
							}
						}}
					>
						Clear Filters
					</Button>
				</Grid>
			</Grid>
			<Box sx={{ mt: 3, pt: 3, borderTop: '1px solid #F1F5F9' }}>
				<Typography variant="body2" sx={{ color: '#64748B', fontSize: '0.8125rem', fontWeight: 500 }}>
					Showing {filteredExams.length} of {exams.length} exams
				</Typography>
			</Box>
		</Paper>

		<Stack spacing={2.5}>
			{filteredExams.map((exam) => (
				<Paper 
					key={exam.exam_id}
					elevation={0}
					sx={{ 
						p: 4, 
						borderRadius: '12px',
						border: '1px solid',
						borderColor: 'divider',
						bgcolor: isDark ? '#0F0F0F' : 'background.paper',
						transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
						'&:hover': {
							borderColor: isDark ? '#2F2F2F' : 'divider',
							boxShadow: isDark ? 'none' : '0 4px 16px rgba(0,0,0,0.06)'
						}
					}}
				>
					<Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 4 }}>
						{/* Left: Exam Info */}
						<Box sx={{ flexGrow: 1, minWidth: 0 }}>
							<Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
								<Typography variant="h6" sx={{ 
									fontWeight: 600, 
									fontSize: '1.125rem',
									color: 'text.primary',
									letterSpacing: '-0.015em'
								}}>
									{exam.subject_name}
								</Typography>
								<Chip 
									label={exam.is_live ? 'Live' : 'Disabled'} 
									size="small"
									sx={{ 
										bgcolor: exam.is_live ? '#ECFDF5' : '#FEF2F2',
										color: exam.is_live ? '#047857' : '#DC2626',
										fontWeight: 600,
										fontSize: '0.75rem',
										height: '24px',
										'& .MuiChip-label': { px: 1.5 }
									}}
								/>
							</Box>
							
							<Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', mb: 2 }}>
								<Typography variant="body2" sx={{ color: '#64748B', fontSize: '0.875rem' }}>
									ID: <span style={{ fontWeight: 500, color: '#475569' }}>{exam.exam_id}</span>
								</Typography>
								<Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: '#CBD5E1' }} />
								<Typography variant="body2" sx={{ color: '#64748B', fontSize: '0.875rem' }}>
									{exam.language}
								</Typography>
								<Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: '#CBD5E1' }} />
								<Typography variant="body2" sx={{ color: '#64748B', fontSize: '0.875rem' }}>
									{exam.duration_minutes} min
								</Typography>
								<Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: '#CBD5E1' }} />
								<Typography variant="body2" sx={{ color: '#64748B', fontSize: '0.875rem' }}>
									{exam.num_questions} questions
								</Typography>
								<Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: '#CBD5E1' }} />
								<Typography variant="body2" sx={{ color: '#64748B', fontSize: '0.875rem' }}>
									{exam.questions_per_student} per student
								</Typography>
							</Box>
							
							{(exam.allowed_departments?.length > 0 || exam.allowed_years?.length > 0 || exam.allowed_sections?.length > 0) && (
								<Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
									{exam.allowed_departments?.length > 0 && (
										<Chip 
											size="small" 
											label={exam.allowed_departments.join(', ')}
											sx={{ 
												bgcolor: isDark ? '#3B1F5C' : '#F3E8FF',
												color: isDark ? '#C084FC' : '#9333EA',
												fontSize: '0.75rem',
												fontWeight: 500,
												height: '24px'
											}}
										/>
									)}
									{exam.allowed_years?.length > 0 && (
										<Chip 
											size="small" 
											label={`Year ${exam.allowed_years.join(', ')}`}
											sx={{ 
												bgcolor: '#F0FDF4',
												color: '#15803D',
												fontSize: '0.75rem',
												fontWeight: 500,
												height: '24px'
											}}
										/>
									)}
									{exam.allowed_sections?.length > 0 && (
										<Chip 
											size="small" 
											label={`Sec ${exam.allowed_sections.join(', ')}`}
											sx={{ 
												bgcolor: '#FEF3C7',
												color: '#92400E',
												fontSize: '0.75rem',
												fontWeight: 500,
												height: '24px'
											}}
										/>
									)}
								</Box>
							)}
						</Box>
						
						{/* Right: Actions */}
						<Box sx={{ display: 'flex', gap: 1.5, flexShrink: 0 }}>
							<Button
								variant={exam.is_live ? 'outlined' : 'contained'}
								size="small"
								onClick={() => handleToggleStatus(exam)}
								disabled={loading}
								startIcon={exam.is_live ? <StopIcon sx={{ fontSize: 18 }} /> : <PlayArrowIcon sx={{ fontSize: 18 }} />}
								sx={{ 
									textTransform: 'none',
									fontWeight: 500,
									fontSize: '0.875rem',
									px: 2.5,
									py: 1,
									borderRadius: '8px',
									...(exam.is_live ? {
										borderColor: 'divider',
										color: '#DC2626',
										'&:hover': {
											borderColor: '#DC2626',
											bgcolor: '#FEF2F2'
										}
									} : {
										bgcolor: isDark ? '#1F1F1F' : 'primary.main',
										'&:hover': {
											bgcolor: isDark ? '#2F2F2F' : 'primary.dark'
										}
									})
								}}
							>
								{exam.is_live ? 'Disable' : 'Enable'}
							</Button>
							<Button 
								variant="outlined" 
								size="small"
								onClick={() => onUseTemplateClick(exam.exam_id)}
								sx={{ 
									textTransform: 'none',
									fontWeight: 500,
									fontSize: '0.875rem',
									px: 2.5,
									py: 1,
									borderRadius: '8px',
									borderColor: 'divider',
									color: 'text.secondary',
									'&:hover': {
										borderColor: '#CBD5E1',
																		bgcolor: isDark ? 'action.hover' : 'action.hover'
									}
								}}
							>
								Template
							</Button>
							<IconButton
								size="small"
								onClick={() => handleDeleteClick(exam.exam_id)}
								sx={{ 
									color: '#DC2626',
									border: '1px solid',
									borderColor: '#FEE2E2',
									borderRadius: '8px',
									width: 36,
									height: 36,
									'&:hover': {
										borderColor: '#FECACA',
										bgcolor: '#FEF2F2'
									}
								}}
							>
								<DeleteIcon sx={{ fontSize: 18 }} />
							</IconButton>
						</Box>
					</Box>
				</Paper>
			))}
		</Stack>

			{exams.length === 0 && !loading && (
				<Box sx={{ textAlign: 'center', py: 4 }}>
					<Typography variant="h6" color="text.secondary">
						No exams found
					</Typography>
					<Typography variant="body2" color="text.secondary">
						Create your first exam using the "Create Exam" tab
					</Typography>
				</Box>
			)}

			{/* Delete Confirmation Dialog */}
			<Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
				<DialogTitle>Delete Exam</DialogTitle>
				<DialogContent>
					<Typography>
						Are you sure you want to delete this exam? This action cannot be undone.
					</Typography>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
					<Button onClick={confirmDelete} color="error" variant="contained">
						Delete
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	)
}

function ResultsView({ token }: { token: string }) {
	const theme = useTheme()
	const isDark = theme.palette.mode === 'dark'
	const [results, setResults] = useState<any[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [selectedExam, setSelectedExam] = useState<any>(null)
	const [layoutDialogOpen, setLayoutDialogOpen] = useState(false)
	const [studentsDialogOpen, setStudentsDialogOpen] = useState(false)
    const [submissionsDialogOpen, setSubmissionsDialogOpen] = useState(false)
    const [studentViewModes, setStudentViewModes] = useState<Record<string, 'all' | 'best' | 'final'>>({})
    const [submissionsViewMode, setSubmissionsViewMode] = useState<'all' | 'best' | 'final'>('all')
	const [sortColumn, setSortColumn] = useState<'rollNumber' | 'serialNumber' | 'score' | null>(null)
	const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
	const [selectedMetric, setSelectedMetric] = useState<string>('')
	const [examSubmissions, setExamSubmissions] = useState<any[]>([])
	const [submissionsLoading, setSubmissionsLoading] = useState(false)
	const [submissionDetailsOpen, setSubmissionDetailsOpen] = useState(false)
	const [selectedSubmission, setSelectedSubmission] = useState<any>(null)
	
	// Collapse states for questions and submissions
	const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({})
	const [expandedSubmissions, setExpandedSubmissions] = useState<Record<string, boolean>>({})
	
	// Search and filter states
	const [searchQuery, setSearchQuery] = useState('')
	const [deptFilter, setDeptFilter] = useState<string>('all')
	const [yearFilter, setYearFilter] = useState<string>('all')
	const [sectionFilter, setSectionFilter] = useState<string>('all')

	useEffect(() => {
		loadResults()
	}, [])

	async function loadResults() {
		try {
			console.log('🔍 DEBUG: loadResults called with token:', token ? 'present' : 'missing')
			setError(null)
			const data = await listResults(token)
			console.log('🔍 DEBUG: listResults returned:', data)
			setResults(data.results || [])
		} catch (err: any) {
			console.log('🔍 DEBUG: loadResults error:', err)
			setError(err.message || 'Failed to load results')
		} finally {
			setLoading(false)
		}
	}

	function handleViewLayout(exam: any) {
		setSelectedExam(exam)
		setLayoutDialogOpen(true)
	}

	// Sorting logic for students table
	const sortedStudents = useMemo(() => {
		if (!selectedExam || !selectedExam.students || !sortColumn) {
			return selectedExam?.students || []
		}

		const students = [...selectedExam.students]
		students.sort((a: any, b: any) => {
			let aValue = a[sortColumn] || (sortColumn === 'rollNumber' ? a.roll_number : sortColumn === 'serialNumber' ? a.serial_number : a.score)
			let bValue = b[sortColumn] || (sortColumn === 'rollNumber' ? b.roll_number : sortColumn === 'serialNumber' ? b.serial_number : b.score)

			// Handle N/A values - push to end
			if (aValue === 'N/A' || aValue === null || aValue === undefined) return 1
			if (bValue === 'N/A' || bValue === null || bValue === undefined) return -1

			// For roll numbers (strings), use string comparison
			if (sortColumn === 'rollNumber') {
				const comparison = String(aValue).localeCompare(String(bValue), undefined, { numeric: true, sensitivity: 'base' })
				return sortDirection === 'asc' ? comparison : -comparison
			}

			// For serial numbers and scores (numbers), use numeric comparison
			const aNum = Number(aValue)
			const bNum = Number(bValue)
			if (sortDirection === 'asc') {
				return aNum - bNum
			} else {
				return bNum - aNum
			}
		})

		return students
	}, [selectedExam, sortColumn, sortDirection])

	const handleSort = (column: 'rollNumber' | 'serialNumber' | 'score') => {
		if (sortColumn === column) {
			// Toggle direction if clicking the same column
			setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
		} else {
			// Set new column and default to ascending
			setSortColumn(column)
			setSortDirection('asc')
		}
	}

	function handleViewStudents(exam: any) {
		setSelectedExam(exam)
		setSelectedMetric('students')
		setStudentsDialogOpen(true)
		// Reset sorting when opening dialog
		setSortColumn(null)
		setSortDirection('asc')
	}

	function handleViewSubmissions(exam: any) {
		setSelectedExam(exam)
		setSelectedMetric('submissions')
		setSubmissionsDialogOpen(true)
		loadExamSubmissions(exam.exam_id)
	}

	async function loadExamSubmissions(examId: string) {
		try {
			setSubmissionsLoading(true)
			const data = await getSubmissions(token, examId)
			setExamSubmissions(data.submissions || [])
		} catch (err: any) {
			console.error('Failed to load exam submissions:', err)
			setExamSubmissions([])
		} finally {
			setSubmissionsLoading(false)
		}
	}

	function handleViewSubmissionDetails(submission: any) {
		setSelectedSubmission(submission)
		setSubmissionDetailsOpen(true)
	}
	
	// Get unique values for filters from results data
	const availableDepts = useMemo(() => {
		const depts = new Set<string>()
		results.forEach(result => {
			result.allowed_departments?.forEach((dept: string) => depts.add(dept))
		})
		return Array.from(depts).sort()
	}, [results])
	
	const availableYears = useMemo(() => {
		const years = new Set<number>()
		results.forEach(result => {
			result.allowed_years?.forEach((year: number) => years.add(year))
		})
		return Array.from(years).sort()
	}, [results])
	
	const availableSections = useMemo(() => {
		const sections = new Set<string>()
		results.forEach(result => {
			result.allowed_sections?.forEach((section: string) => sections.add(section))
		})
		return Array.from(sections).sort()
	}, [results])
	
	// Filter and search results
	const filteredResults = useMemo(() => {
		return results.filter(result => {
			// Search filter (partial match on subject name and exam ID)
			const matchesSearch = searchQuery === '' || 
				result.subject_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				result.exam_id.toLowerCase().includes(searchQuery.toLowerCase())
			
			// Department filter
			const matchesDept = deptFilter === 'all' || 
				(result.allowed_departments && result.allowed_departments.includes(deptFilter))
			
			// Year filter
			const matchesYear = yearFilter === 'all' || 
				(result.allowed_years && result.allowed_years.includes(Number(yearFilter)))
			
			// Section filter
			const matchesSection = sectionFilter === 'all' || 
				(result.allowed_sections && result.allowed_sections.includes(sectionFilter))
			
			return matchesSearch && matchesDept && matchesYear && matchesSection
		})
	}, [results, searchQuery, deptFilter, yearFilter, sectionFilter])

	if (loading) {
		return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
			<CircularProgress />
		</Box>
	}

	return (
		<Box>
			<Typography variant="h5" sx={{ 
				mb: 5, 
				fontWeight: 600, 
				color: 'text.primary',
				letterSpacing: '-0.025em'
			}}>
				Exam Results
			</Typography>
			
			{error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

			{results.length === 0 ? (
				<Box sx={{ textAlign: 'center', py: 8 }}>
					<SchoolIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 3 }} />
					<Typography variant="h5" color="text.secondary" gutterBottom>
						No Exam Results Yet
					</Typography>
					<Typography variant="body1" color="text.secondary">
						Results will appear here once students complete exams
					</Typography>
				</Box>
			) : (
				<>
					{/* Search and Filter Bar */}
					<Paper sx={{ 
						p: 4, 
						mb: 4, 
						borderRadius: '12px', 
						border: '1px solid',
						borderColor: '#E2E8F0',
						boxShadow: 'none'
					}}>
						<Grid container spacing={2.5} alignItems="center">
							<Grid item xs={12} md={12}>
								<TextField
									fullWidth
									placeholder="Search by exam name or ID..."
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									size="small"
									sx={{ 
										'& .MuiOutlinedInput-root': {
											bgcolor: isDark ? 'background.paper' : 'action.hover',
											borderRadius: '8px',
											'& fieldset': {
												borderColor: 'divider',
											},
											'&:hover fieldset': {
												borderColor: '#CBD5E1',
											},
											'&.Mui-focused fieldset': {
												borderColor: 'divider',
												borderWidth: '1px',
											}
										}
									}}
								/>
							</Grid>
							<Grid item xs={12} sm={6} md={4}>
								<FormControl fullWidth size="small">
									<InputLabel sx={{ fontSize: '0.875rem' }}>Department</InputLabel>
									<Select
										value={deptFilter}
										label="Department"
										onChange={(e) => setDeptFilter(e.target.value)}
										sx={{ 
											borderRadius: '8px',
											'& .MuiOutlinedInput-notchedOutline': {
												borderColor: 'divider',
											},
											'&:hover .MuiOutlinedInput-notchedOutline': {
												borderColor: '#CBD5E1',
											}
										}}
									>
										<MenuItem value="all">All Departments</MenuItem>
										{availableDepts.map(dept => (
											<MenuItem key={dept} value={dept}>{dept}</MenuItem>
										))}
									</Select>
								</FormControl>
							</Grid>
							<Grid item xs={12} sm={6} md={3}>
								<FormControl fullWidth size="small">
									<InputLabel sx={{ fontSize: '0.875rem' }}>Year</InputLabel>
									<Select
										value={yearFilter}
										label="Year"
										onChange={(e) => setYearFilter(e.target.value)}
										sx={{ 
											borderRadius: '8px',
											'& .MuiOutlinedInput-notchedOutline': {
												borderColor: 'divider',
											},
											'&:hover .MuiOutlinedInput-notchedOutline': {
												borderColor: '#CBD5E1',
											}
										}}
									>
										<MenuItem value="all">All Years</MenuItem>
										{availableYears.map(year => (
											<MenuItem key={year} value={year.toString()}>Year {year}</MenuItem>
										))}
									</Select>
								</FormControl>
							</Grid>
							<Grid item xs={12} sm={6} md={3}>
								<FormControl fullWidth size="small">
									<InputLabel sx={{ fontSize: '0.875rem' }}>Section</InputLabel>
									<Select
										value={sectionFilter}
										label="Section"
										onChange={(e) => setSectionFilter(e.target.value)}
										sx={{ 
											borderRadius: '8px',
											'& .MuiOutlinedInput-notchedOutline': {
												borderColor: 'divider',
											},
											'&:hover .MuiOutlinedInput-notchedOutline': {
												borderColor: '#CBD5E1',
											}
										}}
									>
										<MenuItem value="all">All Sections</MenuItem>
										{availableSections.map(section => (
											<MenuItem key={section} value={section}>Section {section}</MenuItem>
										))}
									</Select>
								</FormControl>
							</Grid>
							<Grid item xs={12} sm={6} md={2}>
								<Button 
									variant="outlined" 
									fullWidth 
									onClick={() => {
										setSearchQuery('')
										setDeptFilter('all')
										setYearFilter('all')
										setSectionFilter('all')
									}}
									size="small"
									sx={{
										borderColor: 'divider',
										color: 'text.secondary',
										textTransform: 'none',
										fontWeight: 500,
										fontSize: '0.875rem',
										borderRadius: '8px',
										'&:hover': {
											borderColor: '#CBD5E1',
																		bgcolor: isDark ? 'action.hover' : 'action.hover'
										}
									}}
								>
									Clear Filters
								</Button>
							</Grid>
						</Grid>
						<Box sx={{ mt: 3, pt: 3, borderTop: '1px solid #F1F5F9' }}>
							<Typography variant="body2" sx={{ color: '#64748B', fontSize: '0.8125rem', fontWeight: 500 }}>
								Showing {filteredResults.length} of {results.length} exams
							</Typography>
						</Box>
					</Paper>
					
					<Stack spacing={3}>
						{filteredResults.map((result) => {
						const totalStudents = result.live_takers + result.already_taken
						const completionRate = totalStudents > 0 ? (result.already_taken / totalStudents) * 100 : 0
						const avgScore = result.avg_score || 0
						
						return (
							<Paper 
								key={result.exam_id}
								elevation={0}
								sx={{ 
									p: 4, 
									borderRadius: '12px',
									border: '1px solid',
									borderColor: 'divider',
									bgcolor: 'background.paper',
									transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
									'&:hover': {
										borderColor: '#CBD5E1',
										boxShadow: '0 4px 16px rgba(0,0,0,0.06)'
									}
								}}
							>
								<Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 4 }}>
									{/* Left: Exam Info */}
									<Box sx={{ flexGrow: 1, minWidth: 0 }}>
										<Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
											<Typography variant="h6" sx={{ 
												fontWeight: 600, 
												fontSize: '1.125rem',
												color: 'text.primary',
												letterSpacing: '-0.015em'
											}}>
												{result.subject_name}
											</Typography>
											<Chip 
												label={result.is_live ? 'Live' : 'Disabled'} 
												size="small"
												sx={{ 
													bgcolor: result.is_live ? '#ECFDF5' : '#FEF2F2',
													color: result.is_live ? '#047857' : '#DC2626',
													fontWeight: 600,
													fontSize: '0.75rem',
													height: '24px',
													'& .MuiChip-label': { px: 1.5 }
												}}
											/>
										</Box>
										
										<Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', mb: 2 }}>
											<Typography variant="body2" sx={{ color: '#64748B', fontSize: '0.875rem' }}>
												ID: <span style={{ fontWeight: 500, color: '#475569' }}>{result.exam_id}</span>
											</Typography>
											<Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: '#CBD5E1' }} />
											<Typography variant="body2" sx={{ color: '#64748B', fontSize: '0.875rem' }}>
												Total: <span style={{ fontWeight: 500, color: '#475569' }}>{totalStudents}</span>
											</Typography>
											<Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: '#CBD5E1' }} />
											<Typography variant="body2" sx={{ color: '#64748B', fontSize: '0.875rem' }}>
												Completed: <span style={{ fontWeight: 500, color: '#15803D' }}>{result.already_taken}</span>
											</Typography>
											<Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: '#CBD5E1' }} />
											<Typography variant="body2" sx={{ color: '#64748B', fontSize: '0.875rem' }}>
												Submissions: <span style={{ fontWeight: 500, color: isDark ? '#F59E0B' : '#F59E0B' }}>{result.num_submissions}</span>
											</Typography>
											<Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: '#CBD5E1' }} />
											<Typography variant="body2" sx={{ color: '#64748B', fontSize: '0.875rem' }}>
												Average: <span style={{ fontWeight: 600, color: avgScore >= 70 ? '#15803D' : avgScore >= 50 ? '#D97706' : '#DC2626' }}>{avgScore.toFixed(1)}%</span>
											</Typography>
										</Box>
										
										{(result.allowed_departments?.length > 0 || result.allowed_years?.length > 0 || result.allowed_sections?.length > 0) && (
											<Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
												{result.allowed_departments?.length > 0 && (
													<Chip 
														size="small" 
														label={result.allowed_departments.join(', ')}
														sx={{ 
															bgcolor: isDark ? '#3B1F5C' : '#F3E8FF',
															color: isDark ? '#C084FC' : '#9333EA',
															fontSize: '0.75rem',
															fontWeight: 500,
															height: '24px'
														}}
													/>
												)}
												{result.allowed_years?.length > 0 && (
													<Chip 
														size="small" 
														label={`Year ${result.allowed_years.join(', ')}`}
														sx={{ 
															bgcolor: '#F0FDF4',
															color: '#15803D',
															fontSize: '0.75rem',
															fontWeight: 500,
															height: '24px'
														}}
													/>
												)}
												{result.allowed_sections?.length > 0 && (
													<Chip 
														size="small" 
														label={`Sec ${result.allowed_sections.join(', ')}`}
														sx={{ 
															bgcolor: '#FEF3C7',
															color: '#92400E',
															fontSize: '0.75rem',
															fontWeight: 500,
															height: '24px'
														}}
													/>
												)}
											</Box>
										)}
									</Box>
									
									{/* Right: Actions */}
									<Box sx={{ display: 'flex', gap: 1.5, flexShrink: 0, alignItems: 'center' }}>
										<Button
											variant="outlined"
											size="small"
											onClick={() => handleViewStudents(result)}
											startIcon={<PeopleIcon sx={{ fontSize: 16 }} />}
											sx={{ 
												textTransform: 'none',
												fontWeight: 500,
												fontSize: '0.875rem',
												px: 2.5,
												py: 1,
												borderRadius: '8px',
												borderColor: 'divider',
												color: 'text.secondary',
												'&:hover': {
													borderColor: isDark ? '#2F2F2F' : 'divider',
													bgcolor: isDark ? 'action.hover' : 'action.hover'
												}
											}}
										>
											View Students
										</Button>
										<Button
											variant="outlined"
											size="small"
											onClick={() => handleViewSubmissions(result)}
											startIcon={<AssignmentIcon sx={{ fontSize: 16 }} />}
											sx={{ 
												textTransform: 'none',
												fontWeight: 500,
												fontSize: '0.875rem',
												px: 2.5,
												py: 1,
												borderRadius: '8px',
												borderColor: 'divider',
												color: 'text.secondary',
												'&:hover': {
													borderColor: isDark ? '#2F2F2F' : 'divider',
													bgcolor: isDark ? 'action.hover' : 'action.hover'
												}
											}}
										>
											View Submissions
										</Button>
										<IconButton
											size="small"
											onClick={() => handleViewLayout(result)}
											sx={{ 
												color: 'text.secondary',
												border: '1px solid',
												borderColor: 'divider',
												borderRadius: '8px',
												width: 36,
												height: 36,
												'&:hover': {
													borderColor: isDark ? '#2F2F2F' : 'divider',
													bgcolor: isDark ? 'action.hover' : 'action.hover'
												}
											}}
										>
											<VisibilityIcon sx={{ fontSize: 18 }} />
										</IconButton>
									</Box>
								</Box>
							</Paper>
						)
					})}
				</Stack>
				</>
			)}

			{/* Layout Visualization Dialog */}
			<Dialog 
				open={layoutDialogOpen} 
				onClose={() => setLayoutDialogOpen(false)} 
				maxWidth="lg" 
				fullWidth
				PaperProps={{
					sx: {
						bgcolor: 'background.paper'
					}
				}}
			>
				<DialogTitle sx={{ color: 'text.primary' }}>
					Layout Visualization - {selectedExam?.subject_name}
				</DialogTitle>
				<DialogContent>
					{selectedExam && (
						<LayoutVisualization 
							layout={selectedExam.layout} 
							students={selectedExam.students || []}
						/>
					)}
				</DialogContent>
				<DialogActions>
					<Button 
						onClick={() => setLayoutDialogOpen(false)}
						sx={{ color: 'text.secondary' }}
					>
						Close
					</Button>
				</DialogActions>
			</Dialog>

			{/* Students List Dialog */}
			<Dialog 
				open={studentsDialogOpen} 
				onClose={() => setStudentsDialogOpen(false)} 
				maxWidth="md" 
				fullWidth
				PaperProps={{
					sx: {
						bgcolor: 'background.paper'
					}
				}}
			>
				<DialogTitle sx={{ color: 'text.primary' }}>
					Students - {selectedExam?.subject_name}
				</DialogTitle>
				<DialogContent>
					{selectedExam && (
						<Box>
							<Typography variant="h6" gutterBottom>
								Total Students: {selectedExam.live_takers + selectedExam.already_taken}
							</Typography>
							<Typography variant="body2" color="text.secondary" gutterBottom>
								Completed: {selectedExam.already_taken} | In Progress: {selectedExam.live_takers}
							</Typography>
							
							{selectedExam.students && selectedExam.students.length > 0 ? (
								<TableContainer component={Paper} sx={{ mt: 2 }}>
									<Table>
									<TableHead>
										<TableRow>
											<TableCell>Student Name</TableCell>
											<TableCell 
												sortDirection={sortColumn === 'rollNumber' ? sortDirection : false}
											>
												<TableSortLabel
													active={sortColumn === 'rollNumber'}
													direction={sortColumn === 'rollNumber' ? sortDirection : 'asc'}
													onClick={() => handleSort('rollNumber')}
												>
													Roll Number
												</TableSortLabel>
											</TableCell>
											<TableCell 
												sortDirection={sortColumn === 'serialNumber' ? sortDirection : false}
											>
												<TableSortLabel
													active={sortColumn === 'serialNumber'}
													direction={sortColumn === 'serialNumber' ? sortDirection : 'asc'}
													onClick={() => handleSort('serialNumber')}
												>
													System Number
												</TableSortLabel>
											</TableCell>
									<TableCell>Status</TableCell>
											<TableCell 
												sortDirection={sortColumn === 'score' ? sortDirection : false}
											>
												<TableSortLabel
													active={sortColumn === 'score'}
													direction={sortColumn === 'score' ? sortDirection : 'asc'}
													onClick={() => handleSort('score')}
												>
													Score
												</TableSortLabel>
											</TableCell>
									<TableCell>Actions</TableCell>
										</TableRow>
									</TableHead>
									<TableBody>
								{sortedStudents.map((student: any, index: number) => (
											<TableRow key={index}>
												<TableCell>{student.studentName || student.name}</TableCell>
												<TableCell>{student.rollNumber || student.roll_number || 'N/A'}</TableCell>
												<TableCell>{student.serialNumber || student.serial_number}</TableCell>
												<TableCell>
													<Chip 
														label={student.status === 'completed' ? 'Completed' : 'In Progress'} 
														color={student.status === 'completed' ? 'success' : 'warning'}
														size="small"
													/>
												</TableCell>
												<TableCell>{student.score ? `${student.score.toFixed(1)}%` : 'N/A'}</TableCell>
										<TableCell>
											<Button 
												variant="outlined" 
												color="error" 
												size="small"
											onClick={async () => {
													if (!selectedExam) return;
													const confirmMsg = `Remove all data for ${student.studentName || student.name || student.roll_number}? They will be able to retake the exam.`
													if (!window.confirm(confirmMsg)) return;
													try {
														const studentId = student.studentId || student.student_id || student.id
														await deleteStudentAttempt(token, selectedExam.exam_id, studentId)
														// Optimistically remove from local list
														selectedExam.students = (selectedExam.students || []).filter((s: any) => (s.studentId || s.student_id || s.id) !== studentId)
														// Adjust counts
														if (selectedExam.already_taken && selectedExam.already_taken > 0) {
															selectedExam.already_taken -= 1
														}
														setSelectedExam({ ...selectedExam })
														// Also refresh top-level results summary so it persists after dialog close
														await loadResults()
													} catch (e: any) {
														alert(e?.message || 'Failed to remove student attempt')
													}
											}}
											>
												Delete
											</Button>
										</TableCell>
											</TableRow>
										))}
									</TableBody>
									</Table>
								</TableContainer>
							) : (
								<Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
									No student data available
								</Typography>
							)}
						</Box>
					)}
				</DialogContent>
				<DialogActions>
					<Button 
						onClick={() => setStudentsDialogOpen(false)}
						sx={{ color: 'text.secondary' }}
					>
						Close
					</Button>
				</DialogActions>
			</Dialog>

			{/* Submissions List Dialog - Student-wise hierarchy */}
			<Dialog 
				open={submissionsDialogOpen} 
				onClose={() => setSubmissionsDialogOpen(false)} 
				maxWidth="xl" 
				fullWidth
				PaperProps={{
					sx: {
						borderRadius: '12px',
						maxHeight: '90vh',
						bgcolor: 'background.paper'
					}
				}}
			>
				<DialogTitle sx={{ pb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
					<Box>
						<Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary', fontSize: '1.125rem', mb: 1 }}>
							Submissions - {selectedExam?.subject_name}
						</Typography>
						<Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
							Total Submissions: {selectedExam?.num_submissions || 0}
						</Typography>
					</Box>
				</DialogTitle>
				<DialogContent sx={{ p: 3 }}>
					{selectedExam && (
						<Box>
							{submissionsLoading ? (
								<Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
									<CircularProgress />
								</Box>
							) : examSubmissions.length > 0 ? (
								(() => {
									// Calculate average score from student aggregate scores
									const studentGroups = examSubmissions.reduce((acc: Record<string, any[]>, s: any) => {
										const studentId = s.student_id || 'unknown'
										if (!acc[studentId]) acc[studentId] = []
										acc[studentId].push(s)
										return acc
									}, {} as Record<string, any[]>)

									const studentAggregateScores = Object.values(studentGroups).map((studentSubs: any) => {
										const submissionsByQuestion = studentSubs.reduce((qAcc: Record<string, any[]>, s: any) => {
											const qid = s.question_id || 'unknown'
											if (!qAcc[qid]) qAcc[qid] = []
											qAcc[qid].push(s)
											return qAcc
										}, {} as Record<string, any[]>)

										const perQuestionBestScores = Object.values(submissionsByQuestion).map((subs: any) => {
											const sorted = subs.slice().sort((a: any, b: any) => (Number(b.score) || 0) - (Number(a.score) || 0))
											return Number(sorted[0]?.score) || 0
										})

										return perQuestionBestScores.length > 0 
											? perQuestionBestScores.reduce((sum, score) => sum + score, 0) / perQuestionBestScores.length
											: 0
									})

									const averageOfAggregateScores = studentAggregateScores.length > 0
										? studentAggregateScores.reduce((sum, score) => sum + score, 0) / studentAggregateScores.length
										: 0

									return (
										<>
											{/* Stats and Filter Bar */}
											<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, pb: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
												<Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
													Average Score: <Box component="span" sx={{ fontWeight: 600, color: 'text.primary' }}>{averageOfAggregateScores.toFixed(1)}%</Box>
												</Typography>
												
												{/* Global View mode toggle */}
												<Box sx={{ display: 'flex', gap: 1 }}>
													<Button 
														size="small" 
														variant={submissionsViewMode==='all' ? 'contained' : 'outlined'}
														onClick={() => setSubmissionsViewMode('all')}
														sx={{ 
															textTransform: 'none',
															fontSize: '0.8125rem',
															minWidth: 100,
															bgcolor: submissionsViewMode==='all' ? (isDark ? '#1F1F1F' : 'primary.main') : 'transparent',
															color: submissionsViewMode==='all' ? '#FFFFFF' : 'text.secondary',
															borderColor: 'divider',
															fontWeight: 500,
															'&:hover': {
																bgcolor: submissionsViewMode==='all' ? (isDark ? '#2F2F2F' : 'primary.dark') : 'action.hover',
																borderColor: 'divider'
															}
														}}
													>
														All Submissions
													</Button>
													<Button 
														size="small"
														variant={submissionsViewMode==='best' ? 'contained' : 'outlined'}
														onClick={() => setSubmissionsViewMode('best')}
														sx={{ 
															textTransform: 'none',
															fontSize: '0.8125rem',
															minWidth: 85,
															bgcolor: submissionsViewMode==='best' ? (isDark ? '#1F1F1F' : 'primary.main') : 'transparent',
															color: submissionsViewMode==='best' ? '#FFFFFF' : 'text.secondary',
															borderColor: 'divider',
															fontWeight: 500,
															'&:hover': {
																bgcolor: submissionsViewMode==='best' ? (isDark ? '#2F2F2F' : 'primary.dark') : 'action.hover',
																borderColor: 'divider'
															}
														}}
													>
														Best Only
													</Button>
													<Button 
														size="small"
														variant={submissionsViewMode==='final' ? 'contained' : 'outlined'}
														onClick={() => setSubmissionsViewMode('final')}
														sx={{ 
															textTransform: 'none',
															fontSize: '0.8125rem',
															minWidth: 85,
															bgcolor: submissionsViewMode==='final' ? (isDark ? '#1F1F1F' : 'primary.main') : 'transparent',
															color: submissionsViewMode==='final' ? '#FFFFFF' : 'text.secondary',
															borderColor: 'divider',
															fontWeight: 500,
															'&:hover': {
																bgcolor: submissionsViewMode==='final' ? (isDark ? '#2F2F2F' : 'primary.dark') : 'action.hover',
																borderColor: 'divider'
															}
														}}
													>
														Final Only
													</Button>
												</Box>
											</Box>

											<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 3 }}>
												{/* Group by student first */}
												{Object.entries(studentGroups).map(([studentId, studentSubs]) => {
													const studentName = studentSubs[0]?.student_name || studentId
													const studentRollNumber = studentSubs[0]?.roll_number || 'N/A'
													const studentSerialNumber = studentSubs[0]?.serial_number ?? 'N/A'

													// Group this student's submissions by question
													const submissionsByQuestion = studentSubs.reduce((qAcc: Record<string, any[]>, s: any) => {
														const qid = s.question_id || 'unknown'
														if (!qAcc[qid]) qAcc[qid] = []
														qAcc[qid].push(s)
														return qAcc
													}, {} as Record<string, any[]>)

													// Calculate aggregate score: average of best scores per question
													const perQuestionBestScores = Object.values(submissionsByQuestion).map((subs: any) => {
														const sorted = subs.slice().sort((a: any, b: any) => (Number(b.score) || 0) - (Number(a.score) || 0))
														return Number(sorted[0]?.score) || 0
													})
													const aggregateScore = perQuestionBestScores.length > 0 
														? perQuestionBestScores.reduce((sum, score) => sum + score, 0) / perQuestionBestScores.length
														: 0

													return (
														<Accordion 
															key={studentId} 
															elevation={0}
															sx={{ 
																border: '1px solid',
					borderColor: 'divider', 
																borderRadius: '8px !important',
																'&:before': { display: 'none' },
																overflow: 'hidden'
															}}
														>
															<AccordionSummary 
																expandIcon={<ExpandMoreIcon sx={{ color: 'text.secondary' }} />} 
																sx={{ 
																	bgcolor: isDark ? '#0F0F0F' : 'action.hover',
																	borderBottom: '1px solid',
																	borderColor: 'divider',
																	py: 2,
																	'&:hover': {
																		bgcolor: isDark ? 'action.hover' : 'action.hover'
																	}
																}}
															>
																<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexGrow: 1, flexWrap: 'wrap' }}>
																	<Avatar sx={{ bgcolor: isDark ? '#1F1F1F' : 'primary.main', width: 36, height: 36 }}>
																		<PeopleIcon fontSize="small" />
																	</Avatar>
																	<Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary', fontSize: '0.9375rem' }}>
										{studentName}
									</Typography>
																	<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, color: 'text.secondary', fontSize: '0.8125rem' }}>
																		<Typography variant="caption" sx={{ fontSize: '0.8125rem', color: 'text.secondary' }}>
																			Roll: {studentRollNumber}
																		</Typography>
																		<Box sx={{ width: 3, height: 3, borderRadius: '50%', bgcolor: 'divider' }} />
																		<Typography variant="caption" sx={{ fontSize: '0.8125rem', color: 'text.secondary' }}>
																			System: {studentSerialNumber}
																		</Typography>
																		<Box sx={{ width: 3, height: 3, borderRadius: '50%', bgcolor: 'divider' }} />
																		<Box component="span" sx={{ 
																			fontWeight: 600,
																			color: aggregateScore >= 70 ? '#047857' : aggregateScore >= 50 ? '#92400E' : '#DC2626'
																		}}>
																			Final Score: {aggregateScore.toFixed(1)}%
																		</Box>
																		<Box sx={{ width: 3, height: 3, borderRadius: '50%', bgcolor: 'divider' }} />
																		<Typography variant="caption" sx={{ fontSize: '0.8125rem', color: 'text.secondary' }}>
																			{studentSubs.length} submission{studentSubs.length !== 1 ? 's' : ''}
																		</Typography>
																	</Box>
																</Box>
															</AccordionSummary>
															<AccordionDetails sx={{ p: 3, bgcolor: isDark ? '#0A0A0A' : 'background.paper' }}>
													{/* For each question this student has submitted */}
													<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
													{Object.entries(submissionsByQuestion).map(([qid, subs]) => {
														// Sort submissions latest first
														const sorted = (subs as any[]).slice().sort((a,b) => {
															const timeA = new Date(a.submitted_at || a.timestamp*1000).getTime()
															const timeB = new Date(b.submitted_at || b.timestamp*1000).getTime()
															return timeB - timeA // Latest first
														})
														const finalSub = sorted[0] // Latest is final
														const bestSub = sorted.reduce((best, cur) => (Number(cur.score)||0) > (Number(best.score)||0) ? cur : best, sorted[0])
														
														// Apply global filter
														const filtered = submissionsViewMode==='all' ? sorted : submissionsViewMode==='best' ? [bestSub] : [finalSub]

														const questionKey = `${studentId}-${qid}`
														const isQuestionExpanded = expandedQuestions[questionKey] === true // Default collapsed

														return (
															<Paper 
																key={qid} 
																elevation={0}
																sx={{ 
																	border: '1px solid',
					borderColor: 'divider', 
																	borderRadius: '8px',
																	overflow: 'hidden'
																}}
															>
																{/* Question Header - Clickable */}
																<Box 
																	sx={{ 
																	px: 2.5, 
																	py: 2, 
																	bgcolor: isDark ? '#0F0F0F' : 'action.hover',
																	borderBottom: isQuestionExpanded ? '1px solid' : 'none',
																	borderColor: 'divider',
																	cursor: 'pointer',
																	'&:hover': {
																		bgcolor: isDark ? 'action.hover' : 'action.hover'
																	}
																	}}
																	onClick={() => setExpandedQuestions(prev => ({ ...prev, [questionKey]: !isQuestionExpanded }))}
																>
																	<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
																		<IconButton size="small" sx={{ p: 0, mr: 0.5 }}>
																			{isQuestionExpanded ? <ExpandMoreIcon sx={{ fontSize: '1.25rem', color: 'text.secondary' }} /> : <ChevronRightIcon sx={{ fontSize: '1.25rem', color: 'text.secondary' }} />}
																		</IconButton>
																		<Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary', fontSize: '0.875rem' }}>
																			Question {qid}
																		</Typography>
																		<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, fontSize: '0.75rem' }}>
																			<StarIcon sx={{ fontSize: '0.875rem', color: '#047857' }} />
																			<Typography variant="caption" sx={{ fontSize: '0.75rem', color: '#047857', fontWeight: 600 }}>
																				Best: {Number(bestSub.score).toFixed(1)}%
																			</Typography>
																			<Box sx={{ width: 3, height: 3, borderRadius: '50%', bgcolor: 'divider' }} />
																			<FlagIcon sx={{ fontSize: '0.875rem', color: '#F59E0B' }} />
																			<Typography variant="caption" sx={{ fontSize: '0.75rem', color: '#92400E', fontWeight: 600 }}>
																				Final: {Number(finalSub.score).toFixed(1)}%
																			</Typography>
																			<Box sx={{ width: 3, height: 3, borderRadius: '50%', bgcolor: 'divider' }} />
																			<Typography variant="caption" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
																				{subs.length} attempt{subs.length !== 1 ? 's' : ''}
																			</Typography>
																		</Box>
																	</Box>
																</Box>
																
																{/* Submissions List - Collapsible */}
																{isQuestionExpanded && (
																	<Box sx={{ p: 2.5 }}>
																	<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
																		{filtered.map((submission: any, index: number) => {
																			const submissionKey = `${qid}-${sorted.indexOf(submission)}`
																			const isCodeExpanded = expandedSubmissions[`${submissionKey}-code`]
																			const isTestsExpanded = expandedSubmissions[`${submissionKey}-tests`]
																			
																			return (
																			<Box key={`${qid}-${index}`}>
																				{index > 0 && <Divider sx={{ mb: 2.5 }} />}
																				<Box>
																					{/* Submission Header */}
																					<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5, flexWrap: 'wrap' }}>
																						<Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary', fontSize: '0.875rem' }}>
																							Submission #{sorted.indexOf(submission) + 1}
																						</Typography>
																						<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
																							<Box component="span" sx={{ 
																								fontWeight: 600,
																								fontSize: '0.75rem',
																								color: Number(submission.score) >= 70 ? '#047857' : Number(submission.score) >= 50 ? '#92400E' : '#DC2626'
																							}}>
																								{submission.score?.toFixed(1)}%
																							</Box>
																							{submission === finalSub && (
																								<>
																									<Box sx={{ width: 3, height: 3, borderRadius: '50%', bgcolor: '#CBD5E1' }} />
																									<FlagIcon sx={{ fontSize: '0.875rem', color: '#F59E0B' }} />
																									<Typography variant="caption" sx={{ fontSize: '0.75rem', color: '#92400E' }}>Final</Typography>
																								</>
																							)}
																							{submission === bestSub && (
																								<>
																									<Box sx={{ width: 3, height: 3, borderRadius: '50%', bgcolor: '#CBD5E1' }} />
																									<StarIcon sx={{ fontSize: '0.875rem', color: '#047857' }} />
																									<Typography variant="caption" sx={{ fontSize: '0.75rem', color: '#047857' }}>Best</Typography>
																								</>
																							)}
																						</Box>
																					</Box>
																					<Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.75rem', display: 'block', mb: 2 }}>
																						{submission.submitted_at ? new Date(submission.submitted_at).toLocaleString() : submission.timestamp ? new Date(submission.timestamp*1000).toLocaleString() : 'Invalid Date'}
																					</Typography>

																					{/* Code Display - Collapsible */}
																					<Box sx={{ mb: 2.5 }}>
																						<Box 
																							sx={{ 
																								display: 'flex', 
																								alignItems: 'center', 
																								gap: 1, 
																								mb: 1, 
																								cursor: 'pointer',
																								'&:hover': { opacity: 0.7 }
																							}}
																							onClick={() => setExpandedSubmissions(prev => ({ ...prev, [`${submissionKey}-code`]: !isCodeExpanded }))}
																						>
																							<IconButton size="small" sx={{ p: 0 }}>
																								{isCodeExpanded ? <ExpandMoreIcon sx={{ fontSize: '1rem', color: '#64748B' }} /> : <ChevronRightIcon sx={{ fontSize: '1rem', color: '#64748B' }} />}
																							</IconButton>
																							<Typography variant="caption" sx={{ fontWeight: 600, color: 'text.primary', fontSize: '0.8125rem' }}>
																								Submitted Code
																							</Typography>
																						</Box>
																						{isCodeExpanded && (
																							<Paper elevation={0} sx={{ p: 2.5, bgcolor: isDark ? '#0A0A0A' : 'action.hover', maxHeight: 300, overflow: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: '6px' }}>
																								<pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '0.8125rem', color: isDark ? '#FFFFFF' : 'text.primary', lineHeight: 1.6 }}>
																									{submission.code || 'No code available'}
																								</pre>
																							</Paper>
																						)}
																					</Box>

																					{/* Detailed Test Case Results - Collapsible */}
																					{Array.isArray(submission.detailed_results) && submission.detailed_results.length > 0 && (
																						<Box>
																							<Box 
																								sx={{ 
																									display: 'flex', 
																									alignItems: 'center', 
																									gap: 1, 
																									mb: 1.5, 
																									cursor: 'pointer',
																									'&:hover': { opacity: 0.7 }
																								}}
																								onClick={() => setExpandedSubmissions(prev => ({ ...prev, [`${submissionKey}-tests`]: !isTestsExpanded }))}
																							>
																								<IconButton size="small" sx={{ p: 0 }}>
																									{isTestsExpanded ? <ExpandMoreIcon sx={{ fontSize: '1rem', color: '#64748B' }} /> : <ChevronRightIcon sx={{ fontSize: '1rem', color: '#64748B' }} />}
																								</IconButton>
																								<Typography variant="caption" sx={{ fontWeight: 600, color: 'text.primary', fontSize: '0.8125rem' }}>
																									Test Cases ({submission.detailed_results.length})
																								</Typography>
																							</Box>
																							{isTestsExpanded && (
																							<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
																								{submission.detailed_results.map((testCase: any, tcIndex: number) => (
																									<Paper 
																										key={tcIndex}
																										elevation={0}
																										sx={{ 
																											p: 2,
																											border: '1px solid',
																											borderColor: testCase.passed ? '#D1FAE5' : '#FECACA',
																											borderRadius: '8px',
																											bgcolor: isDark ? '#0F0F0F' : 'background.paper'
																										}}
																									>
																										<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
																											<Box 
																												sx={{ 
																													width: 28,
																													height: 28,
																													display: 'flex',
																													alignItems: 'center',
																													justifyContent: 'center',
																													borderRadius: '6px',
																													bgcolor: testCase.passed ? '#ECFDF5' : '#FEF2F2',
																													fontSize: '0.75rem',
																													fontWeight: 600,
																													color: testCase.passed ? '#047857' : '#DC2626'
																												}}
																											>
																												{tcIndex + 1}
																											</Box>
																											<Typography variant="body2" sx={{ 
																												fontWeight: 600, 
																												color: testCase.passed ? '#047857' : '#DC2626',
																												fontSize: '0.8125rem'
																											}}>
																												{testCase.passed ? 'Passed' : 'Failed'}
																											</Typography>
																											{(testCase.time || testCase.execution_time) && (
																												<>
																													<Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: '#CBD5E1' }} />
																													<Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.75rem' }}>
																														{testCase.time ? `${testCase.time}ms` : `${(testCase.execution_time * 1000).toFixed(2)}ms`}
																													</Typography>
																												</>
																											)}
																										</Box>
																										
																										<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
																											{testCase.input !== undefined && (
																												<Box>
																													<Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.75rem', fontWeight: 600, display: 'block', mb: 0.5 }}>
																														Input:
																													</Typography>
																													<Paper elevation={0} sx={{ p: 1.5, bgcolor: isDark ? '#0A0A0A' : 'action.hover', border: '1px solid', borderColor: 'divider', borderRadius: '4px' }}>
																														<Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem', color: isDark ? '#FFFFFF' : 'text.secondary', whiteSpace: 'pre-wrap' }}>
																															{testCase.input || '(empty)'}
																														</Typography>
																													</Paper>
																												</Box>
																											)}
																											
																											{testCase.expected_output !== undefined && (
																												<Box>
																													<Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.75rem', fontWeight: 600, display: 'block', mb: 0.5 }}>
																														Expected Output:
																													</Typography>
																													<Paper elevation={0} sx={{ p: 1.5, bgcolor: isDark ? '#0A0A0A' : 'action.hover', border: '1px solid', borderColor: 'divider', borderRadius: '4px' }}>
																														<Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#475569', whiteSpace: 'pre-wrap' }}>
																															{testCase.expected_output || '(empty)'}
																														</Typography>
																													</Paper>
																												</Box>
																											)}
																											
																											{testCase.actual_output !== undefined && (
																												<Box>
																													<Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.75rem', fontWeight: 600, display: 'block', mb: 0.5 }}>
																														Actual Output:
																													</Typography>
																													<Paper elevation={0} sx={{ 
																														p: 1.5, 
																														bgcolor: testCase.passed ? '#F0FDF4' : '#FEF2F2', 
																														border: '1px solid',
																														borderColor: testCase.passed ? '#D1FAE5' : '#FECACA',
																														borderRadius: '4px' 
																													}}>
																														<Typography variant="body2" sx={{ 
																															fontFamily: 'monospace', 
																															fontSize: '0.75rem', 
																															color: testCase.passed ? '#15803D' : '#DC2626',
																															whiteSpace: 'pre-wrap'
																														}}>
																															{testCase.actual_output || '(empty)'}
																														</Typography>
																													</Paper>
																												</Box>
																											)}
																											
																											{testCase.error && (
																												<Box>
																													<Typography variant="caption" sx={{ color: '#DC2626', fontSize: '0.75rem', fontWeight: 600, display: 'block', mb: 0.5 }}>
																														Error:
																													</Typography>
																													<Paper elevation={0} sx={{ p: 1.5, bgcolor: isDark ? '#7F1D1D' : '#FEF2F2', border: '1px solid', borderColor: isDark ? '#DC2626' : '#FECACA', borderRadius: '4px' }}>
																														<Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem', color: isDark ? '#FCA5A5' : '#DC2626', whiteSpace: 'pre-wrap' }}>
																															{testCase.error}
																														</Typography>
																													</Paper>
																												</Box>
																											)}
																										</Box>
																									</Paper>
																								))}
																							</Box>
																							)}
																						</Box>
																					)}
																				</Box>
																			</Box>
																			)
																		})}
																	</Box>
																	</Box>
																)}
															</Paper>
														)
													})}
													</Box>
															</AccordionDetails>
														</Accordion>
													)
												})}
											</Box>
										</>
									)
								})()
							) : (
								<Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
									No submissions found for this exam
								</Typography>
							)}
						</Box>
					)}
				</DialogContent>
				<DialogActions sx={{ px: 3, py: 2.5, borderTop: '1px solid', borderColor: 'divider' }}>
					<Button 
						onClick={() => setSubmissionsDialogOpen(false)}
						sx={{
							textTransform: 'none',
							fontWeight: 500,
							fontSize: '0.875rem',
							color: 'text.secondary',
							'&:hover': {
																		bgcolor: isDark ? 'action.hover' : 'action.hover'
							}
						}}
					>
						Close
					</Button>
				</DialogActions>
			</Dialog>

			{/* Submission Details Dialog */}
			<Dialog 
				open={submissionDetailsOpen} 
				onClose={() => setSubmissionDetailsOpen(false)} 
				maxWidth="md" 
				fullWidth
				PaperProps={{
					sx: {
						borderRadius: '12px'
					}
				}}
			>
				<DialogTitle sx={{ pb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
					<Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary', fontSize: '1.125rem' }}>
						Submission Details
					</Typography>
				</DialogTitle>
				<DialogContent sx={{ p: 3 }}>
					{selectedSubmission && (
						<Box>
							{/* Student Info */}
							<Paper elevation={0} sx={{ p: 3, mb: 3, bgcolor: isDark ? 'action.hover' : 'action.hover', border: '1px solid', borderColor: 'divider', borderRadius: '8px' }}>
								<Grid container spacing={2}>
									<Grid item xs={6}>
										<Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.75rem', fontWeight: 600, display: 'block', mb: 0.5 }}>
											Student
										</Typography>
										<Typography variant="body2" sx={{ color: 'text.primary', fontSize: '0.875rem', fontWeight: 500 }}>
											{selectedSubmission.student_name || selectedSubmission.student_id}
										</Typography>
									</Grid>
									<Grid item xs={6}>
										<Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.75rem', fontWeight: 600, display: 'block', mb: 0.5 }}>
											Question
										</Typography>
										<Typography variant="body2" sx={{ color: 'text.primary', fontSize: '0.875rem', fontWeight: 500 }}>
											{selectedSubmission.question_id}
										</Typography>
									</Grid>
									<Grid item xs={3}>
										<Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.75rem', fontWeight: 600, display: 'block', mb: 0.5 }}>
											Score
										</Typography>
										<Typography variant="body2" sx={{ 
											color: selectedSubmission.score >= 70 ? '#047857' : selectedSubmission.score >= 50 ? '#92400E' : '#DC2626',
											fontSize: '0.875rem', 
											fontWeight: 600 
										}}>
											{selectedSubmission.score?.toFixed(1)}%
										</Typography>
									</Grid>
									<Grid item xs={3}>
										<Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.75rem', fontWeight: 600, display: 'block', mb: 0.5 }}>
											Correctness
										</Typography>
										<Typography variant="body2" sx={{ color: 'text.primary', fontSize: '0.875rem' }}>
											{selectedSubmission.correctness?.toFixed(1)}%
										</Typography>
									</Grid>
									<Grid item xs={3}>
										<Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.75rem', fontWeight: 600, display: 'block', mb: 0.5 }}>
											Logic
										</Typography>
										<Typography variant="body2" sx={{ color: 'text.primary', fontSize: '0.875rem' }}>
											{selectedSubmission.logic_similarity?.toFixed(1)}%
										</Typography>
									</Grid>
									<Grid item xs={3}>
										<Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.75rem', fontWeight: 600, display: 'block', mb: 0.5 }}>
											Effort
										</Typography>
										<Typography variant="body2" sx={{ color: 'text.primary', fontSize: '0.875rem' }}>
											{selectedSubmission.effort?.toFixed(1)}%
										</Typography>
									</Grid>
								</Grid>
							</Paper>

							{/* Test Case Results */}
							{selectedSubmission.detailed_results && selectedSubmission.detailed_results.length > 0 && (
								<Box sx={{ mb: 2.5 }}>
									<Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600, color: 'text.primary', fontSize: '0.8125rem' }}>
										Test Cases
									</Typography>
									<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
										{selectedSubmission.detailed_results.map((testCase: any, tcIndex: number) => {
											const passed = testCase.status?.id === 3 || testCase.passed;
											return (
												<Paper 
													key={tcIndex}
													elevation={0}
													sx={{ 
														p: 2,
														border: '1px solid',
														borderColor: passed ? '#D1FAE5' : '#FECACA',
														borderRadius: '8px',
														bgcolor: '#FFFFFF'
													}}
												>
													<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
														<Box 
															sx={{ 
																width: 28,
																height: 28,
																display: 'flex',
																alignItems: 'center',
																justifyContent: 'center',
																borderRadius: '6px',
																bgcolor: passed ? '#ECFDF5' : '#FEF2F2',
																fontSize: '0.75rem',
																fontWeight: 600,
																color: passed ? '#047857' : '#DC2626'
															}}
														>
															{tcIndex + 1}
														</Box>
														<Typography variant="body2" sx={{ 
															fontWeight: 600, 
															color: passed ? '#047857' : '#DC2626',
															fontSize: '0.8125rem'
														}}>
															{testCase.status?.description || (passed ? 'Passed' : 'Failed')}
														</Typography>
														{(testCase.time || testCase.execution_time) && (
															<>
																<Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: '#CBD5E1' }} />
																<Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.75rem' }}>
																	{testCase.time ? `${testCase.time}ms` : `${(testCase.execution_time * 1000).toFixed(2)}ms`}
																</Typography>
															</>
														)}
													</Box>
													
													<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
														{testCase.input !== undefined && (
															<Box>
																<Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.75rem', fontWeight: 600, display: 'block', mb: 0.5 }}>
																	Input:
																</Typography>
																<Paper elevation={0} sx={{ p: 1.5, bgcolor: isDark ? '#0A0A0A' : 'action.hover', border: '1px solid', borderColor: 'divider', borderRadius: '4px' }}>
																	<Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem', color: isDark ? '#FFFFFF' : 'text.secondary', whiteSpace: 'pre-wrap' }}>
																		{testCase.input || '(empty)'}
																	</Typography>
																</Paper>
															</Box>
														)}
														
														{testCase.expected_output !== undefined && (
															<Box>
																<Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.75rem', fontWeight: 600, display: 'block', mb: 0.5 }}>
																	Expected Output:
																</Typography>
																<Paper elevation={0} sx={{ p: 1.5, bgcolor: isDark ? '#0A0A0A' : 'action.hover', border: '1px solid', borderColor: 'divider', borderRadius: '4px' }}>
																	<Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem', color: isDark ? '#FFFFFF' : 'text.secondary', whiteSpace: 'pre-wrap' }}>
																		{testCase.expected_output || '(empty)'}
																	</Typography>
																</Paper>
															</Box>
														)}
														
														{testCase.actual_output !== undefined && (
															<Box>
																<Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.75rem', fontWeight: 600, display: 'block', mb: 0.5 }}>
																	Actual Output:
																</Typography>
																<Paper elevation={0} sx={{ 
																	p: 1.5, 
																	bgcolor: passed ? (isDark ? '#064E3B' : '#F0FDF4') : (isDark ? '#7F1D1D' : '#FEF2F2'), 
																	border: '1px solid',
																	borderColor: passed ? (isDark ? '#10B981' : '#D1FAE5') : (isDark ? '#F87171' : '#FECACA'),
																	borderRadius: '4px' 
																}}>
																	<Typography variant="body2" sx={{ 
																		fontFamily: 'monospace', 
																		fontSize: '0.75rem', 
																		color: passed ? (isDark ? '#34D399' : '#15803D') : (isDark ? '#FCA5A5' : '#DC2626'),
																		whiteSpace: 'pre-wrap'
																	}}>
																		{testCase.actual_output || '(empty)'}
																	</Typography>
																</Paper>
															</Box>
														)}
														
														{testCase.error && (
															<Box>
																<Typography variant="caption" sx={{ color: '#DC2626', fontSize: '0.75rem', fontWeight: 600, display: 'block', mb: 0.5 }}>
																	Error:
																</Typography>
																<Paper elevation={0} sx={{ p: 1.5, bgcolor: isDark ? '#7F1D1D' : '#FEF2F2', border: '1px solid', borderColor: isDark ? '#DC2626' : '#FECACA', borderRadius: '4px' }}>
																	<Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#DC2626', whiteSpace: 'pre-wrap' }}>
																		{typeof testCase.error === 'string' ? testCase.error : (typeof testCase.error === 'object' ? JSON.stringify(testCase.error, null, 2) : String(testCase.error || 'Unknown error'))}
																	</Typography>
																</Paper>
															</Box>
														)}
													</Box>
												</Paper>
											);
										})}
									</Box>
								</Box>
							)}

							{/* Submitted Code */}
							<Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600, color: '#0F172A', fontSize: '0.8125rem' }}>
								Submitted Code
							</Typography>
							<Paper elevation={0} sx={{ p: 2.5, bgcolor: isDark ? '#0A0A0A' : 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: '6px', mb: 2.5 }}>
								<pre style={{ 
									margin: 0, 
									whiteSpace: 'pre-wrap', 
									fontFamily: 'monospace',
									fontSize: '0.8125rem',
									color: isDark ? '#FFFFFF' : 'text.primary',
									lineHeight: 1.6
								}}>
									{selectedSubmission.code || 'No code available'}
								</pre>
							</Paper>

							{/* Feedback */}
							{selectedSubmission.feedback && (
								<Box>
									<Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600, color: 'text.primary', fontSize: '0.8125rem' }}>
										Feedback
									</Typography>
									<Paper elevation={0} sx={{ p: 2.5, bgcolor: isDark ? '#3B1F5C' : '#F3E8FF', border: '1px solid', borderColor: isDark ? '#9333EA' : '#C084FC', borderRadius: '6px' }}>
										<Typography variant="body2" sx={{ fontSize: '0.875rem', color: isDark ? '#C084FC' : '#9333EA' }}>
											{selectedSubmission.feedback}
										</Typography>
									</Paper>
								</Box>
							)}
						</Box>
					)}
				</DialogContent>
				<DialogActions sx={{ px: 3, py: 2.5, borderTop: '1px solid', borderColor: 'divider' }}>
					<Button 
						onClick={() => setSubmissionDetailsOpen(false)}
						sx={{
							textTransform: 'none',
							fontWeight: 500,
							fontSize: '0.875rem',
							color: 'text.secondary',
							'&:hover': {
								bgcolor: 'action.hover'
							}
						}}
					>
						Close
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	)
}

function SubmissionsView({ token }: { token: string }) {
	const theme = useTheme()
	const isDark = theme.palette.mode === 'dark'
	const [submissions, setSubmissions] = useState<any[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [filters, setFilters] = useState({
		examId: '',
		studentId: '',
		departmentId: '',
		sectionId: '',
		year: '',
		studentName: '',
		rollNumber: '',
		questionId: '',
		minScore: ''
	})
	const [filterOptions, setFilterOptions] = useState<any>({})
	const [studentDetailsOpen, setStudentDetailsOpen] = useState(false)
	const [submissionDetailsOpen, setSubmissionDetailsOpen] = useState(false)
	const [selectedStudent, setSelectedStudent] = useState<any>(null)
	const [selectedSubmission, setSelectedSubmission] = useState<any>(null)
	const [sortColumn, setSortColumn] = useState<'rollNumber' | 'systemNumber' | 'questionId' | 'score' | 'submittedAt' | 'department' | 'section' | 'year' | null>(null)
	const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

	useEffect(() => {
		loadSubmissions()
		loadFilterOptions()
	}, [])

	useEffect(() => {
		loadSubmissions()
	}, [filters])

	async function loadSubmissions() {
		try {
			setError(null)
			const data = await getSubmissions(
				token, 
				filters.examId || undefined, 
				filters.studentId || undefined, 
				filters.questionId || undefined, 
				filters.departmentId || undefined, 
				filters.year ? parseInt(filters.year) : undefined, 
				filters.sectionId || undefined,
				filters.rollNumber || undefined
			)
			
			// Apply client-side filtering for fields not supported by backend
			let filteredSubmissions = data.submissions || []
			
			if (filters.studentName) {
				filteredSubmissions = filteredSubmissions.filter((sub: any) => 
					(sub.student_name || '').toLowerCase().includes(filters.studentName.toLowerCase())
				)
			}
			
			if (filters.minScore) {
				const minScore = parseFloat(filters.minScore)
				filteredSubmissions = filteredSubmissions.filter((sub: any) => 
					(sub.score || 0) >= minScore
				)
			}
			
			setSubmissions(filteredSubmissions)
		} catch (err: any) {
			setError(err.message || 'Failed to load submissions')
		} finally {
			setLoading(false)
		}
	}

	async function loadFilterOptions() {
		try {
			const data = await getFilterOptions(token)
			setFilterOptions(data)
		} catch (err: any) {
			console.error('Failed to load filter options:', err)
		}
	}

	function handleFilterChange(field: string, value: string) {
		setFilters(prev => ({ ...prev, [field]: value }))
	}

	function handleStudentClick(submission: any) {
		setSelectedStudent(submission)
		setStudentDetailsOpen(true)
	}

	function handleSubmissionClick(submission: any) {
		setSelectedSubmission(submission)
		setSubmissionDetailsOpen(true)
	}

	function clearFilters() {
		setFilters({
			examId: '',
			studentId: '',
			departmentId: '',
			sectionId: '',
			year: '',
			studentName: '',
			rollNumber: '',
			questionId: '',
			minScore: ''
		})
		setSortColumn(null)
		setSortDirection('asc')
	}

	// Sorting logic for submissions table
	const sortedSubmissions = useMemo(() => {
		if (!submissions || !sortColumn) {
			return submissions || []
		}

		const sorted = [...submissions]
		sorted.sort((a: any, b: any) => {
			let aValue: any
			let bValue: any

			switch (sortColumn) {
				case 'rollNumber':
					aValue = a.roll_number_snapshot || a.roll_number || ''
					bValue = b.roll_number_snapshot || b.roll_number || ''
					// Handle N/A values - push to end
					if (!aValue || aValue === 'N/A') return 1
					if (!bValue || bValue === 'N/A') return -1
					const rollComparison = String(aValue).localeCompare(String(bValue), undefined, { numeric: true, sensitivity: 'base' })
					return sortDirection === 'asc' ? rollComparison : -rollComparison

				case 'systemNumber':
					aValue = Number(a.serial_number || a.system_number || 0)
					bValue = Number(b.serial_number || b.system_number || 0)
					return sortDirection === 'asc' ? aValue - bValue : bValue - aValue

				case 'questionId':
					aValue = a.question_id || ''
					bValue = b.question_id || ''
					const questionComparison = String(aValue).localeCompare(String(bValue))
					return sortDirection === 'asc' ? questionComparison : -questionComparison

				case 'score':
					aValue = Number(a.score || 0)
					bValue = Number(b.score || 0)
					return sortDirection === 'asc' ? aValue - bValue : bValue - aValue

				case 'submittedAt':
					aValue = a.submitted_at ? new Date(a.submitted_at).getTime() : (a.timestamp ? a.timestamp * 1000 : 0)
					bValue = b.submitted_at ? new Date(b.submitted_at).getTime() : (b.timestamp ? b.timestamp * 1000 : 0)
					return sortDirection === 'asc' ? aValue - bValue : bValue - aValue

				case 'department':
					aValue = a.department_name_snapshot || a.department_name || ''
					bValue = b.department_name_snapshot || b.department_name || ''
					// Handle N/A values - push to end
					if (!aValue || aValue === 'N/A') return 1
					if (!bValue || bValue === 'N/A') return -1
					const deptComparison = String(aValue).localeCompare(String(bValue))
					return sortDirection === 'asc' ? deptComparison : -deptComparison

				case 'section':
					aValue = a.section_name_snapshot || a.section_name || ''
					bValue = b.section_name_snapshot || b.section_name || ''
					// Handle N/A values - push to end
					if (!aValue || aValue === 'N/A') return 1
					if (!bValue || bValue === 'N/A') return -1
					const sectionComparison = String(aValue).localeCompare(String(bValue))
					return sortDirection === 'asc' ? sectionComparison : -sectionComparison

				case 'year':
					aValue = Number(a.year_snapshot || a.year || 0)
					bValue = Number(b.year_snapshot || b.year || 0)
					return sortDirection === 'asc' ? aValue - bValue : bValue - aValue

				default:
					return 0
			}
		})

		return sorted
	}, [submissions, sortColumn, sortDirection])

	const handleSort = (column: 'rollNumber' | 'systemNumber' | 'questionId' | 'score' | 'submittedAt' | 'department' | 'section' | 'year') => {
		if (sortColumn === column) {
			// Toggle direction if clicking the same column
			setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
		} else {
			// Set new column and default to ascending
			setSortColumn(column)
			setSortDirection('asc')
		}
	}

	function handleDownloadCSV() {
		try {
			// Generate CSV from currently filtered submissions (matches what's displayed)
			let csv = 'STUDENT SUBMISSIONS REPORT\n\n'
			
			// Add filter information
			csv += 'Applied Filters:\n'
			if (filters.examId) csv += `Exam: ${filters.examId}\n`
			if (filters.studentId) csv += `Student ID: ${filters.studentId}\n`
			if (filters.departmentId) {
				const dept = filterOptions.departments?.find((d: any) => d.id === filters.departmentId)
				csv += `Department: ${dept?.name || filters.departmentId}\n`
			}
			if (filters.sectionId) {
				const sec = filterOptions.sections?.find((s: any) => s.id === filters.sectionId)
				csv += `Section: ${sec?.name || filters.sectionId}\n`
			}
			if (filters.year) csv += `Year: ${filters.year}\n`
			if (filters.studentName) csv += `Student Name: ${filters.studentName}\n`
			if (filters.rollNumber) csv += `Roll Number: ${filters.rollNumber}\n`
			if (filters.questionId) csv += `Question ID: ${filters.questionId}\n`
			if (filters.minScore) csv += `Min Score: ${filters.minScore}\n`
			csv += `Total Submissions: ${sortedSubmissions.length}\n`
			csv += '\n'
			
			// CSV Header
			csv += 'Student Name,Roll Number,System Number,Exam,Question ID,Score (%),Correctness (%),Logic Similarity (%),Effort (%),Submitted At,Department,Section,Year\n'
			
			// CSV Data - use sortedSubmissions to match displayed data
			sortedSubmissions.forEach((sub: any) => {
				const submittedAt = sub.submitted_at 
					? new Date(sub.submitted_at).toLocaleString()
					: (sub.timestamp ? new Date(sub.timestamp * 1000).toLocaleString() : 'N/A')
				
				csv += [
					`"${sub.student_name || sub.student_id || 'N/A'}"`,
					`"${sub.roll_number_snapshot || sub.roll_number || 'N/A'}"`,
					`"${sub.serial_number || sub.system_number || 'N/A'}"`,
					`"${sub.exam_name || sub.exam_id || 'N/A'}"`,
					`"${sub.question_id || 'N/A'}"`,
					sub.score?.toFixed(1) || '0.0',
					sub.correctness?.toFixed(1) || '0.0',
					sub.logic_similarity?.toFixed(1) || '0.0',
					sub.effort?.toFixed(1) || '0.0',
					`"${submittedAt}"`,
					`"${sub.department_name || sub.department_name_snapshot || 'N/A'}"`,
					`"${sub.section_name || sub.section_name_snapshot || 'N/A'}"`,
					sub.year || sub.year_snapshot || 'N/A'
				].join(',') + '\n'
			})
			
			// Download CSV
			const date = new Date().toISOString().split('T')[0]
			const facultyName = localStorage.getItem('username')?.replace(/[^a-zA-Z0-9]/g, '_') || 'Faculty'
			const examName = filters.examId ? `_${filters.examId}` : ''
			const filename = `${facultyName}_Submissions${examName}_${date}.csv`
			
			const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
			const url = window.URL.createObjectURL(blob)
			const a = document.createElement('a')
			a.href = url
			a.download = filename
			document.body.appendChild(a)
			a.click()
			window.URL.revokeObjectURL(url)
			document.body.removeChild(a)
		} catch (err: any) {
			alert(`Failed to download CSV: ${err.message || 'Unknown error'}`)
		}
	}

	if (loading) {
		return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
			<CircularProgress />
		</Box>
	}

	return (
		<Box>
			<Typography variant="h6" sx={{ mb: 2 }}>Student Submissions</Typography>
			
			{error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

			{/* Filters */}
			<Paper sx={{ p: 2, mb: 2 }}>
				<Typography variant="subtitle1" sx={{ mb: 2 }}>Filters</Typography>
				<Grid container spacing={2}>
					<Grid item xs={12} sm={6} md={3}>
						<FormControl fullWidth size="small">
							<InputLabel>Exam</InputLabel>
							<Select
								value={filters.examId}
								onChange={(e) => handleFilterChange('examId', e.target.value)}
								label="Exam"
							>
								<MenuItem value="">All Exams</MenuItem>
                                {filterOptions.exams?.map((exam: any) => (
                                    <MenuItem key={exam.id || exam.exam_id} value={exam.id || exam.exam_id}>
                                        {exam.name || exam.subject_name}
                                    </MenuItem>
                                ))}
							</Select>
						</FormControl>
					</Grid>
					<Grid item xs={12} sm={6} md={3}>
						<FormControl fullWidth size="small">
							<InputLabel>Department</InputLabel>
							<Select
								value={filters.departmentId}
								onChange={(e) => handleFilterChange('departmentId', e.target.value)}
								label="Department"
							>
								<MenuItem value="">All Departments</MenuItem>
								{filterOptions.departments?.map((dept: any) => (
									<MenuItem key={dept.id} value={dept.id}>
										{dept.name}
									</MenuItem>
								))}
							</Select>
						</FormControl>
					</Grid>
					<Grid item xs={12} sm={6} md={3}>
						<FormControl fullWidth size="small">
							<InputLabel>Section</InputLabel>
							<Select
								value={filters.sectionId}
								onChange={(e) => handleFilterChange('sectionId', e.target.value)}
								label="Section"
							>
								<MenuItem value="">All Sections</MenuItem>
								{filterOptions.sections?.map((section: any) => (
									<MenuItem key={section.id} value={section.id}>
										{section.name}
									</MenuItem>
								))}
							</Select>
						</FormControl>
					</Grid>
					<Grid item xs={12} sm={6} md={3}>
						<FormControl fullWidth size="small">
							<InputLabel>Year</InputLabel>
							<Select
								value={filters.year}
								onChange={(e) => handleFilterChange('year', e.target.value)}
								label="Year"
							>
								<MenuItem value="">All Years</MenuItem>
                                {filterOptions.years?.map((year: any) => (
                                    <MenuItem key={year.id ?? year.name} value={year.value ?? parseInt(year.name, 10)}>
                                        {year.name}
                                    </MenuItem>
                                ))}
							</Select>
						</FormControl>
					</Grid>
					<Grid item xs={12} sm={6} md={3}>
						<TextField
							fullWidth
							size="small"
							label="Student Name"
							value={filters.studentName || ''}
							onChange={(e) => handleFilterChange('studentName', e.target.value)}
							placeholder="Search by student name..."
						/>
					</Grid>
					<Grid item xs={12} sm={6} md={3}>
						<TextField
							fullWidth
							size="small"
							label="Roll Number"
							value={filters.rollNumber || ''}
							onChange={(e) => handleFilterChange('rollNumber', e.target.value)}
							placeholder="Search by roll number..."
						/>
					</Grid>
					<Grid item xs={12} sm={6} md={3}>
						<TextField
							fullWidth
							size="small"
							label="Question ID"
							value={filters.questionId || ''}
							onChange={(e) => handleFilterChange('questionId', e.target.value)}
							placeholder="Search by question..."
						/>
					</Grid>
					<Grid item xs={12} sm={6} md={3}>
						<TextField
							fullWidth
							size="small"
							label="Min Score"
							type="number"
							value={filters.minScore || ''}
							onChange={(e) => handleFilterChange('minScore', e.target.value)}
							placeholder="Minimum score %"
							inputProps={{ min: 0, max: 100 }}
						/>
					</Grid>
				</Grid>
				<Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
					<Button variant="outlined" onClick={clearFilters} size="small">
						Clear Filters
					</Button>
					<Button variant="contained" onClick={handleDownloadCSV} size="small" startIcon={<Download />}>
						Download CSV
					</Button>
				</Box>
			</Paper>

			{/* Submissions Table */}
			{submissions.length === 0 ? (
				<Box sx={{ textAlign: 'center', py: 4 }}>
					<Typography variant="h6" color="text.secondary">
						No submissions found
					</Typography>
					<Typography variant="body2" color="text.secondary">
						{submissions.length === 0 && (filters.examId || filters.studentName || filters.rollNumber || filters.questionId || filters.minScore) 
							? 'No submissions match your current filters. Try adjusting your search criteria.'
							: 'Submissions will appear here once students submit their solutions'
						}
					</Typography>
				</Box>
			) : (
				<TableContainer component={Paper}>
					<Table>
						<TableHead>
							<TableRow>
								<TableCell>Student</TableCell>
								<TableCell 
									sortDirection={sortColumn === 'rollNumber' ? sortDirection : false}
								>
									<TableSortLabel
										active={sortColumn === 'rollNumber'}
										direction={sortColumn === 'rollNumber' ? sortDirection : 'asc'}
										onClick={() => handleSort('rollNumber')}
									>
										Roll Number
									</TableSortLabel>
								</TableCell>
								<TableCell 
									sortDirection={sortColumn === 'systemNumber' ? sortDirection : false}
								>
									<TableSortLabel
										active={sortColumn === 'systemNumber'}
										direction={sortColumn === 'systemNumber' ? sortDirection : 'asc'}
										onClick={() => handleSort('systemNumber')}
									>
										System Number
									</TableSortLabel>
								</TableCell>
								<TableCell>Exam</TableCell>
								<TableCell 
									sortDirection={sortColumn === 'questionId' ? sortDirection : false}
								>
									<TableSortLabel
										active={sortColumn === 'questionId'}
										direction={sortColumn === 'questionId' ? sortDirection : 'asc'}
										onClick={() => handleSort('questionId')}
									>
										Question
									</TableSortLabel>
								</TableCell>
								<TableCell 
									sortDirection={sortColumn === 'score' ? sortDirection : false}
								>
									<TableSortLabel
										active={sortColumn === 'score'}
										direction={sortColumn === 'score' ? sortDirection : 'asc'}
										onClick={() => handleSort('score')}
									>
										Score
									</TableSortLabel>
								</TableCell>
								<TableCell>Correctness</TableCell>
								<TableCell>Logic Similarity</TableCell>
								<TableCell>Effort</TableCell>
								<TableCell 
									sortDirection={sortColumn === 'submittedAt' ? sortDirection : false}
								>
									<TableSortLabel
										active={sortColumn === 'submittedAt'}
										direction={sortColumn === 'submittedAt' ? sortDirection : 'asc'}
										onClick={() => handleSort('submittedAt')}
									>
										Submitted At
									</TableSortLabel>
								</TableCell>
								<TableCell 
									sortDirection={sortColumn === 'department' ? sortDirection : false}
								>
									<TableSortLabel
										active={sortColumn === 'department'}
										direction={sortColumn === 'department' ? sortDirection : 'asc'}
										onClick={() => handleSort('department')}
									>
										Department
									</TableSortLabel>
								</TableCell>
								<TableCell 
									sortDirection={sortColumn === 'section' ? sortDirection : false}
								>
									<TableSortLabel
										active={sortColumn === 'section'}
										direction={sortColumn === 'section' ? sortDirection : 'asc'}
										onClick={() => handleSort('section')}
									>
										Section
									</TableSortLabel>
								</TableCell>
								<TableCell 
									sortDirection={sortColumn === 'year' ? sortDirection : false}
								>
									<TableSortLabel
										active={sortColumn === 'year'}
										direction={sortColumn === 'year' ? sortDirection : 'asc'}
										onClick={() => handleSort('year')}
									>
										Year
									</TableSortLabel>
								</TableCell>
								<TableCell>Actions</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{sortedSubmissions.map((submission, index) => (
								<TableRow key={index}>
									<TableCell>
										<Button 
											variant="text" 
											color="primary"
											onClick={() => handleStudentClick(submission)}
										>
											{submission.student_name || submission.student_id}
										</Button>
									</TableCell>
									<TableCell>{submission.roll_number_snapshot || submission.roll_number || 'N/A'}</TableCell>
									<TableCell>{submission.serial_number || submission.system_number || 'N/A'}</TableCell>
									<TableCell>{submission.exam_name || 'Unknown Exam'}</TableCell>
									<TableCell>{submission.question_id}</TableCell>
									<TableCell>{submission.score?.toFixed(1)}%</TableCell>
									<TableCell>{submission.correctness?.toFixed(1)}%</TableCell>
									<TableCell>{submission.logic_similarity?.toFixed(1)}%</TableCell>
									<TableCell>{submission.effort?.toFixed(1)}%</TableCell>
									<TableCell>
										{submission.submitted_at ? 
											new Date(submission.submitted_at).toLocaleString() : 
											submission.timestamp ? 
												new Date(submission.timestamp * 1000).toLocaleString() : 
												'Invalid Date'
										}
									</TableCell>
									<TableCell>{submission.department_name_snapshot || submission.department_name || 'N/A'}</TableCell>
									<TableCell>{submission.section_name_snapshot || submission.section_name || 'N/A'}</TableCell>
									<TableCell>{submission.year_snapshot || submission.year || 'N/A'}</TableCell>
									<TableCell>
										<Button 
											variant="outlined" 
											size="small"
											onClick={() => handleSubmissionClick(submission)}
										>
											View Details
										</Button>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</TableContainer>
			)}

			{/* Student Details Dialog */}
			<Dialog 
				open={studentDetailsOpen} 
				onClose={() => setStudentDetailsOpen(false)} 
				maxWidth="md" 
				fullWidth
				PaperProps={{
					sx: {
						bgcolor: 'background.paper'
					}
				}}
			>
				<DialogTitle sx={{ color: 'text.primary' }}>Student Details</DialogTitle>
				<DialogContent>
					{selectedStudent && (
						<Box>
							<Typography variant="h6" gutterBottom>
								{selectedStudent.student_name || selectedStudent.student_id}
							</Typography>
							<Grid container spacing={2}>
								<Grid item xs={6}>
									<Typography variant="body2"><strong>Email:</strong> {selectedStudent.student_email || 'N/A'}</Typography>
								</Grid>
								<Grid item xs={6}>
									<Typography variant="body2"><strong>Roll Number:</strong> {selectedStudent.roll_number || 'N/A'}</Typography>
								</Grid>
								<Grid item xs={6}>
									<Typography variant="body2"><strong>Department:</strong> {selectedStudent.department_name || 'N/A'}</Typography>
								</Grid>
								<Grid item xs={6}>
									<Typography variant="body2"><strong>Section:</strong> {selectedStudent.section_name || 'N/A'}</Typography>
								</Grid>
								<Grid item xs={6}>
									<Typography variant="body2"><strong>Year:</strong> {selectedStudent.year || 'N/A'}</Typography>
								</Grid>
								<Grid item xs={6}>
									<Typography variant="body2"><strong>Student ID:</strong> {selectedStudent.student_id}</Typography>
								</Grid>
							</Grid>
						</Box>
					)}
				</DialogContent>
				<DialogActions>
					<Button 
						onClick={() => setStudentDetailsOpen(false)}
						sx={{ color: 'text.secondary' }}
					>
						Close
					</Button>
				</DialogActions>
			</Dialog>

			{/* Submission Details Dialog */}
			<Dialog 
				open={submissionDetailsOpen} 
				onClose={() => setSubmissionDetailsOpen(false)} 
				maxWidth="md" 
				fullWidth
				PaperProps={{
					sx: {
						borderRadius: '12px'
					}
				}}
			>
				<DialogTitle sx={{ pb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
					<Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary', fontSize: '1.125rem' }}>
						Submission Details
					</Typography>
				</DialogTitle>
				<DialogContent sx={{ p: 3 }}>
					{selectedSubmission && (
						<Box>
							{/* Student Info */}
							<Paper elevation={0} sx={{ p: 3, mb: 3, bgcolor: isDark ? 'action.hover' : 'action.hover', border: '1px solid', borderColor: 'divider', borderRadius: '8px' }}>
								<Grid container spacing={2}>
									<Grid item xs={6}>
										<Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.75rem', fontWeight: 600, display: 'block', mb: 0.5 }}>
											Student
										</Typography>
										<Typography variant="body2" sx={{ color: 'text.primary', fontSize: '0.875rem', fontWeight: 500 }}>
											{selectedSubmission.student_name || selectedSubmission.student_id}
										</Typography>
									</Grid>
									<Grid item xs={6}>
										<Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.75rem', fontWeight: 600, display: 'block', mb: 0.5 }}>
											Question
										</Typography>
										<Typography variant="body2" sx={{ color: 'text.primary', fontSize: '0.875rem', fontWeight: 500 }}>
											{selectedSubmission.question_id}
										</Typography>
									</Grid>
									<Grid item xs={3}>
										<Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.75rem', fontWeight: 600, display: 'block', mb: 0.5 }}>
											Score
										</Typography>
										<Typography variant="body2" sx={{ 
											color: selectedSubmission.score >= 70 ? '#047857' : selectedSubmission.score >= 50 ? '#92400E' : '#DC2626',
											fontSize: '0.875rem', 
											fontWeight: 600 
										}}>
											{selectedSubmission.score?.toFixed(1)}%
										</Typography>
									</Grid>
									<Grid item xs={3}>
										<Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.75rem', fontWeight: 600, display: 'block', mb: 0.5 }}>
											Correctness
										</Typography>
										<Typography variant="body2" sx={{ color: 'text.primary', fontSize: '0.875rem' }}>
											{selectedSubmission.correctness?.toFixed(1)}%
										</Typography>
									</Grid>
									<Grid item xs={3}>
										<Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.75rem', fontWeight: 600, display: 'block', mb: 0.5 }}>
											Logic
										</Typography>
										<Typography variant="body2" sx={{ color: 'text.primary', fontSize: '0.875rem' }}>
											{selectedSubmission.logic_similarity?.toFixed(1)}%
										</Typography>
									</Grid>
									<Grid item xs={3}>
										<Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.75rem', fontWeight: 600, display: 'block', mb: 0.5 }}>
											Effort
										</Typography>
										<Typography variant="body2" sx={{ color: 'text.primary', fontSize: '0.875rem' }}>
											{selectedSubmission.effort?.toFixed(1)}%
										</Typography>
									</Grid>
								</Grid>
							</Paper>

							{/* Test Case Results */}
							{selectedSubmission.detailed_results && selectedSubmission.detailed_results.length > 0 && (
								<Box sx={{ mb: 2.5 }}>
									<Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600, color: 'text.primary', fontSize: '0.8125rem' }}>
										Test Cases
									</Typography>
									<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
										{selectedSubmission.detailed_results.map((testCase: any, tcIndex: number) => {
											const passed = testCase.status?.id === 3 || testCase.passed;
											return (
												<Paper 
													key={tcIndex}
													elevation={0}
													sx={{ 
														p: 2,
														border: '1px solid',
														borderColor: passed ? '#D1FAE5' : '#FECACA',
														borderRadius: '8px',
														bgcolor: '#FFFFFF'
													}}
												>
													<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
														<Box 
															sx={{ 
																width: 28,
																height: 28,
																display: 'flex',
																alignItems: 'center',
																justifyContent: 'center',
																borderRadius: '6px',
																bgcolor: passed ? '#ECFDF5' : '#FEF2F2',
																fontSize: '0.75rem',
																fontWeight: 600,
																color: passed ? '#047857' : '#DC2626'
															}}
														>
															{tcIndex + 1}
														</Box>
														<Typography variant="body2" sx={{ 
															fontWeight: 600, 
															color: passed ? '#047857' : '#DC2626',
															fontSize: '0.8125rem'
														}}>
															{testCase.status?.description || (passed ? 'Passed' : 'Failed')}
														</Typography>
														{(testCase.time || testCase.execution_time) && (
															<>
																<Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: '#CBD5E1' }} />
																<Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.75rem' }}>
																	{testCase.time ? `${testCase.time}ms` : `${(testCase.execution_time * 1000).toFixed(2)}ms`}
																</Typography>
															</>
														)}
													</Box>
													
													<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
														{testCase.input !== undefined && (
															<Box>
																<Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.75rem', fontWeight: 600, display: 'block', mb: 0.5 }}>
																	Input:
																</Typography>
																<Paper elevation={0} sx={{ p: 1.5, bgcolor: isDark ? '#0A0A0A' : 'action.hover', border: '1px solid', borderColor: 'divider', borderRadius: '4px' }}>
																	<Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem', color: isDark ? '#FFFFFF' : 'text.secondary', whiteSpace: 'pre-wrap' }}>
																		{testCase.input || '(empty)'}
																	</Typography>
																</Paper>
															</Box>
														)}
														
														{testCase.expected_output !== undefined && (
															<Box>
																<Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.75rem', fontWeight: 600, display: 'block', mb: 0.5 }}>
																	Expected Output:
																</Typography>
																<Paper elevation={0} sx={{ p: 1.5, bgcolor: isDark ? '#0A0A0A' : 'action.hover', border: '1px solid', borderColor: 'divider', borderRadius: '4px' }}>
																	<Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem', color: isDark ? '#FFFFFF' : 'text.secondary', whiteSpace: 'pre-wrap' }}>
																		{testCase.expected_output || '(empty)'}
																	</Typography>
																</Paper>
															</Box>
														)}
														
														{testCase.actual_output !== undefined && (
															<Box>
																<Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.75rem', fontWeight: 600, display: 'block', mb: 0.5 }}>
																	Actual Output:
																</Typography>
																<Paper elevation={0} sx={{ 
																	p: 1.5, 
																	bgcolor: passed ? (isDark ? '#064E3B' : '#F0FDF4') : (isDark ? '#7F1D1D' : '#FEF2F2'), 
																	border: '1px solid',
																	borderColor: passed ? (isDark ? '#10B981' : '#D1FAE5') : (isDark ? '#F87171' : '#FECACA'),
																	borderRadius: '4px' 
																}}>
																	<Typography variant="body2" sx={{ 
																		fontFamily: 'monospace', 
																		fontSize: '0.75rem', 
																		color: passed ? (isDark ? '#34D399' : '#15803D') : (isDark ? '#FCA5A5' : '#DC2626'),
																		whiteSpace: 'pre-wrap'
																	}}>
																		{testCase.actual_output || '(empty)'}
																	</Typography>
																</Paper>
															</Box>
														)}
														
														{testCase.error && (
															<Box>
																<Typography variant="caption" sx={{ color: '#DC2626', fontSize: '0.75rem', fontWeight: 600, display: 'block', mb: 0.5 }}>
																	Error:
																</Typography>
																<Paper elevation={0} sx={{ p: 1.5, bgcolor: isDark ? '#7F1D1D' : '#FEF2F2', border: '1px solid', borderColor: isDark ? '#DC2626' : '#FECACA', borderRadius: '4px' }}>
																	<Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#DC2626', whiteSpace: 'pre-wrap' }}>
																		{typeof testCase.error === 'string' ? testCase.error : (typeof testCase.error === 'object' ? JSON.stringify(testCase.error, null, 2) : String(testCase.error || 'Unknown error'))}
																	</Typography>
																</Paper>
															</Box>
														)}
													</Box>
												</Paper>
											);
										})}
									</Box>
								</Box>
							)}

							{/* Submitted Code */}
							<Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600, color: '#0F172A', fontSize: '0.8125rem' }}>
								Submitted Code
							</Typography>
							<Paper elevation={0} sx={{ p: 2.5, bgcolor: isDark ? '#0A0A0A' : 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: '6px', mb: 2.5 }}>
								<pre style={{ 
									margin: 0, 
									whiteSpace: 'pre-wrap', 
									fontFamily: 'monospace',
									fontSize: '0.8125rem',
									color: isDark ? '#FFFFFF' : 'text.primary',
									lineHeight: 1.6
								}}>
									{selectedSubmission.code || 'No code available'}
								</pre>
							</Paper>

							{/* Feedback */}
							{selectedSubmission.feedback && (
								<Box>
									<Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600, color: 'text.primary', fontSize: '0.8125rem' }}>
										Feedback
									</Typography>
									<Paper elevation={0} sx={{ p: 2.5, bgcolor: isDark ? '#3B1F5C' : '#F3E8FF', border: '1px solid', borderColor: isDark ? '#9333EA' : '#C084FC', borderRadius: '6px' }}>
										<Typography variant="body2" sx={{ fontSize: '0.875rem', color: isDark ? '#C084FC' : '#9333EA' }}>
											{selectedSubmission.feedback}
										</Typography>
									</Paper>
								</Box>
							)}
						</Box>
					)}
				</DialogContent>
				<DialogActions sx={{ px: 3, py: 2.5, borderTop: '1px solid', borderColor: 'divider' }}>
					<Button 
						onClick={() => setSubmissionDetailsOpen(false)}
						sx={{
							textTransform: 'none',
							fontWeight: 500,
							fontSize: '0.875rem',
							color: 'text.secondary',
							'&:hover': {
								bgcolor: 'action.hover'
							}
						}}
					>
						Close
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	)
}