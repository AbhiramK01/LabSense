import { useEffect, useState } from 'react'
import { 
	Box, Paper, Typography, TextField, Button, Table, TableBody, TableCell, TableContainer, 
	TableHead, TableRow, Chip, IconButton, Collapse, Alert, Stack, FormControl, InputLabel, 
	Select, MenuItem, Grid, Card, CardContent
} from '@mui/material'
import { KeyboardArrowDown, KeyboardArrowUp, Download } from '@mui/icons-material'
import { getSubmissions, downloadCSV } from '../api'

interface Submission {
	id: string
	student_id: string
	exam_id?: string
	question_id?: string
	language: string
	score: number
	correctness: number
	logic_similarity: number
	effort: number
	feedback: string
	timestamp: number
}

export default function InstructorDashboard() {
	const token = localStorage.getItem('token') || ''
	const [submissions, setSubmissions] = useState<Submission[]>([])
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	
	// Filters
	const [examId, setExamId] = useState('')
	const [studentId, setStudentId] = useState('')
	const [questionId, setQuestionId] = useState('')
	
	// Expanded rows
	const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

	useEffect(() => {
		loadSubmissions()
	}, [])

	async function loadSubmissions() {
		setLoading(true)
		setError(null)
		try {
			const data = await getSubmissions(token, examId || undefined, studentId || undefined, questionId || undefined)
			setSubmissions(data.submissions || [])
		} catch (e: any) {
			setError(e?.message || 'Failed to load submissions')
		} finally {
			setLoading(false)
		}
	}

	async function handleDownloadCSV() {
		try {
			const blob = await downloadCSV(token, examId || undefined, studentId || undefined, questionId || undefined)
			const url = window.URL.createObjectURL(blob)
			const a = document.createElement('a')
			a.href = url
			a.download = 'submissions.csv'
			document.body.appendChild(a)
			a.click()
			window.URL.revokeObjectURL(url)
			document.body.removeChild(a)
		} catch (e: any) {
			setError(e?.message || 'Failed to download CSV')
		}
	}

	function toggleRow(id: string) {
		const newExpanded = new Set(expandedRows)
		if (newExpanded.has(id)) {
			newExpanded.delete(id)
		} else {
			newExpanded.add(id)
		}
		setExpandedRows(newExpanded)
	}

	function formatTimestamp(timestamp: number) {
		return new Date(timestamp * 1000).toLocaleString()
	}

	function getScoreColor(score: number) {
		if (score >= 80) return 'success'
		if (score >= 60) return 'warning'
		return 'error'
	}

	return (
		<Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
			<Typography variant="h5" sx={{ mb: 3 }}>Instructor Dashboard</Typography>
			
			{error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

			{/* Filters */}
			<Paper sx={{ p: 2, mb: 3 }}>
				<Typography variant="h6" sx={{ mb: 2 }}>Filters</Typography>
				<Grid container spacing={2}>
					<Grid item xs={12} sm={3}>
						<TextField
							label="Exam ID"
							value={examId}
							onChange={(e) => setExamId(e.target.value)}
							fullWidth
							size="small"
						/>
					</Grid>
					<Grid item xs={12} sm={3}>
						<TextField
							label="Student ID"
							value={studentId}
							onChange={(e) => setStudentId(e.target.value)}
							fullWidth
							size="small"
						/>
					</Grid>
					<Grid item xs={12} sm={3}>
						<TextField
							label="Question ID"
							value={questionId}
							onChange={(e) => setQuestionId(e.target.value)}
							fullWidth
							size="small"
						/>
					</Grid>
					<Grid item xs={12} sm={3}>
						<Stack direction="row" spacing={1}>
							<Button variant="contained" onClick={loadSubmissions} disabled={loading}>
								{loading ? 'Loading...' : 'Filter'}
							</Button>
							<Button variant="outlined" startIcon={<Download />} onClick={handleDownloadCSV}>
								CSV
							</Button>
						</Stack>
					</Grid>
				</Grid>
			</Paper>

			{/* Submissions Table */}
			<Paper>
				<TableContainer>
					<Table>
						<TableHead>
							<TableRow>
								<TableCell>Actions</TableCell>
								<TableCell>Student</TableCell>
								<TableCell>Exam</TableCell>
								<TableCell>Question</TableCell>
								<TableCell>Language</TableCell>
								<TableCell>Score</TableCell>
								<TableCell>Timestamp</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{submissions.map((sub) => (
								<>
									<TableRow key={sub.id}>
										<TableCell>
											<IconButton onClick={() => toggleRow(sub.id)}>
												{expandedRows.has(sub.id) ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
											</IconButton>
										</TableCell>
										<TableCell>{sub.student_id}</TableCell>
										<TableCell>{sub.exam_id || '-'}</TableCell>
										<TableCell>{sub.question_id || '-'}</TableCell>
										<TableCell>
											<Chip label={sub.language} size="small" />
										</TableCell>
										<TableCell>
											<Chip 
												label={`${sub.score}%`} 
												color={getScoreColor(sub.score)} 
												size="small" 
											/>
										</TableCell>
										<TableCell>{formatTimestamp(sub.timestamp)}</TableCell>
									</TableRow>
									<TableRow>
										<TableCell colSpan={7} sx={{ py: 0 }}>
											<Collapse in={expandedRows.has(sub.id)}>
												<Box sx={{ p: 2 }}>
													<Grid container spacing={2}>
														<Grid item xs={12} md={6}>
															<Card>
																<CardContent>
																	<Typography variant="h6" gutterBottom>AI Evaluation Breakdown</Typography>
																	<Stack spacing={1}>
																		<Typography>Correctness: {sub.correctness}%</Typography>
																		<Typography>Logic Similarity: {sub.logic_similarity}%</Typography>
																		<Typography>Effort: {sub.effort}%</Typography>
																	</Stack>
																</CardContent>
															</Card>
														</Grid>
														<Grid item xs={12} md={6}>
															<Card>
																<CardContent>
																	<Typography variant="h6" gutterBottom>Detailed Feedback</Typography>
																	<Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
																		{sub.feedback}
																	</Typography>
																</CardContent>
															</Card>
														</Grid>
													</Grid>
												</Box>
											</Collapse>
										</TableCell>
									</TableRow>
								</>
							))}
						</TableBody>
					</Table>
				</TableContainer>
			</Paper>

			{submissions.length === 0 && !loading && (
				<Alert severity="info" sx={{ mt: 2 }}>
					No submissions found. Try adjusting your filters or have students submit some code.
				</Alert>
			)}
		</Box>
	)
}
