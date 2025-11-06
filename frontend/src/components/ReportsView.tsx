import React, { useEffect, useState } from 'react'
import { Box, Typography, Paper, Grid, FormControl, InputLabel, Select, MenuItem, Button, Alert, CircularProgress, Card, CardContent, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip, ButtonGroup, ToggleButtonGroup, ToggleButton, LinearProgress, Checkbox, ListItemText, useTheme } from '@mui/material'
import { getFilterOptions, getSubmissions, getAllStudents } from '../api'
import Download from '@mui/icons-material/Download'
import AssessmentIcon from '@mui/icons-material/Assessment'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import RemoveIcon from '@mui/icons-material/Remove'
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import TableViewIcon from '@mui/icons-material/TableView'
import BarChartIcon from '@mui/icons-material/BarChart'
import PersonIcon from '@mui/icons-material/Person'
import PeopleIcon from '@mui/icons-material/People'
import BusinessIcon from '@mui/icons-material/Business'
import DescriptionIcon from '@mui/icons-material/Description'
import AssignmentIcon from '@mui/icons-material/Assignment'
import AnalyticsIcon from '@mui/icons-material/Analytics'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import TrophyIcon from '@mui/icons-material/EmojiEvents'
import SchoolIcon from '@mui/icons-material/School'
import WarningIcon from '@mui/icons-material/Warning'
import HorizontalRuleIcon from '@mui/icons-material/HorizontalRule'

export default function ReportsView({ token }: { token: string }) {
	const theme = useTheme()
	const isDark = theme.palette.mode === 'dark'
	const [error, setError] = useState<string | null>(null)
	const [reportType, setReportType] = useState<'exam' | 'student' | 'section' | 'department-year'>('exam')
	const [selectedExam, setSelectedExam] = useState('')
	const [selectedExams, setSelectedExams] = useState<string[]>([]) // For multi-exam selection in student/section/dept-year reports
	const [selectedStudent, setSelectedStudent] = useState('')
	const [selectedDepartment, setSelectedDepartment] = useState('')
	const [selectedYear, setSelectedYear] = useState('')
	const [selectedSection, setSelectedSection] = useState('')
	const [filterOptions, setFilterOptions] = useState<any>({})
	const [reportData, setReportData] = useState<any>(null)
	const [generatingReport, setGeneratingReport] = useState(false)
	const [filteredStudentsForReport, setFilteredStudentsForReport] = useState<any[]>([])

	useEffect(() => {
		loadFilterOptions()
	}, [])

	// Compute filtered students based on snapshot data when student report filters change
	useEffect(() => {
		if (reportType === 'student') {
			filterStudentsBySnapshot()
		}
	}, [reportType, selectedDepartment, selectedYear, selectedSection, filterOptions.allStudents])

	// State to hold available exams based on actual submission data
	const [availableExamsForDemographic, setAvailableExamsForDemographic] = useState<any[]>([])

	// Clear selected exams when demographics change (for non-exam reports)
	useEffect(() => {
		if (reportType !== 'exam') {
			setSelectedExams([])
		}
	}, [selectedDepartment, selectedYear, selectedSection, reportType])

	// Load available exams based on submission snapshot data when demographics change
	useEffect(() => {
		if (reportType !== 'exam' && (selectedDepartment || selectedYear || selectedSection)) {
			loadAvailableExamsForDemographic()
		} else if (reportType === 'exam') {
			setAvailableExamsForDemographic(filterOptions.exams || [])
		}
	}, [selectedDepartment, selectedYear, selectedSection, reportType, filterOptions.exams])

	async function loadAvailableExamsForDemographic() {
		try {
			// Fetch all submissions
			const data = await getSubmissions(token)
			const submissions = data.submissions || []

			// Get selected filter names
			const selectedDeptName = selectedDepartment 
				? filterOptions.departments?.find((d: any) => d.id === selectedDepartment)?.name 
				: null
			const selectedSectionName = selectedSection
				? filterOptions.sections?.find((s: any) => s.id === selectedSection)?.name
				: null
			const selectedYearStr = selectedYear ? String(selectedYear) : null

			console.log('[loadAvailableExams] Filtering for:', { selectedDeptName, selectedSectionName, selectedYearStr })

			// Find unique exam IDs that have submissions matching the selected demographics (snapshot data)
			const examIds = new Set<string>()
			
			submissions.forEach((sub: any) => {
				const snapDept = sub.department_name_snapshot || sub.department_name
				const snapSection = sub.section_name_snapshot || sub.section_name
				const snapYear = String(sub.year_snapshot || sub.year)

				const deptMatch = !selectedDeptName || snapDept === selectedDeptName
				const yearMatch = !selectedYearStr || snapYear === selectedYearStr
				const sectionMatch = !selectedSectionName || snapSection === selectedSectionName

				if (deptMatch && yearMatch && sectionMatch) {
					examIds.add(sub.exam_id)
				}
			})

			console.log('[loadAvailableExams] Found exam IDs with matching submissions:', Array.from(examIds))

			// Filter the exam list to only include exams with matching submissions
			const filtered = (filterOptions.exams || []).filter((exam: any) => 
				examIds.has(exam.id)
			)

			console.log('[loadAvailableExams] Available exams:', filtered.length)
			setAvailableExamsForDemographic(filtered)
		} catch (err) {
			console.error('[loadAvailableExams] Error:', err)
			setAvailableExamsForDemographic([])
		}
	}

	// Get filtered exams - use pre-loaded available exams
	const getFilteredExams = () => {
		if (reportType === 'exam') {
			return filterOptions.exams || []
		}
		return availableExamsForDemographic
	}

	async function filterStudentsBySnapshot() {
		try {
			// If no filters selected, show all students
			if (!selectedDepartment && !selectedYear && !selectedSection) {
				setFilteredStudentsForReport(filterOptions.allStudents || [])
				return
			}

			// Fetch all submissions to find students with matching snapshot data
			const data = await getSubmissions(token)
			const submissions = data.submissions || []

			// Get selected filter names
			const selectedDeptName = selectedDepartment 
				? filterOptions.departments?.find((d: any) => d.id === selectedDepartment)?.name 
				: null
			const selectedSectionName = selectedSection
				? filterOptions.sections?.find((s: any) => s.id === selectedSection)?.name
				: null

		// Find students with unique dept/year/section combinations
		const studentCombinations = new Map<string, any>()

		submissions.forEach((sub: any) => {
			const snapDept = sub.department_name_snapshot || sub.department_name
			const snapSection = sub.section_name_snapshot || sub.section_name
			const snapYear = String(sub.year_snapshot || sub.year)
			const selectedYearStr = selectedYear ? String(selectedYear) : null

			const deptMatch = !selectedDeptName || snapDept === selectedDeptName
			const yearMatch = !selectedYearStr || snapYear === selectedYearStr
			const sectionMatch = !selectedSectionName || snapSection === selectedSectionName

			if (deptMatch && yearMatch && sectionMatch) {
				// Create a unique key for this student + dept/year/section combo
				const comboKey = `${sub.student_id}|${snapDept}|${snapYear}|${snapSection}`
				
				if (!studentCombinations.has(comboKey)) {
					studentCombinations.set(comboKey, {
						id: sub.student_id,
						name: sub.student_name,
						roll_number: sub.roll_number,
						department_name: snapDept,
						year: snapYear,
						section_name: snapSection,
						comboKey // Keep for unique identification
					})
				}
			}
		})

		// Convert to array and sort by roll number, then by year
		const filtered = Array.from(studentCombinations.values()).sort((a, b) => {
			const rollCompare = (a.roll_number || '').localeCompare(b.roll_number || '')
			if (rollCompare !== 0) return rollCompare
			// If same roll number, sort by year
			return (a.year || '').localeCompare(b.year || '')
		})

			setFilteredStudentsForReport(filtered)
		} catch (err: any) {
			console.error('Failed to filter students:', err)
			setFilteredStudentsForReport([])
		}
	}

	async function loadFilterOptions() {
		try {
			const [filterData, studentsData] = await Promise.all([
				getFilterOptions(token),
				getAllStudents(token)
			])
			
			setFilterOptions({
				...filterData,
				allStudents: studentsData.students || []
			})
		} catch (err: any) {
			console.error('Failed to load filter options:', err)
		}
	}

	async function generateReport() {
		try {
			setError(null)
			setReportData(null) // Clear old report data before generating new one
			setGeneratingReport(true)

			// Route to appropriate report generator based on type
			switch (reportType) {
				case 'exam':
					await generateExamReport()
					break
				case 'student':
					await generateStudentReport()
					break
				case 'section':
					await generateSectionReport()
					break
				case 'department-year':
					await generateDepartmentYearReport()
					break
			}

		} catch (err: any) {
			setError(err.message || 'Failed to generate report')
			setReportData(null) // Clear report data on error as well
		} finally {
			setGeneratingReport(false)
		}
	}

	async function generateExamReport() {
		if (!selectedExam) {
			throw new Error('Please select an exam')
		}

		// Fetch all submissions for the selected exam
		const data = await getSubmissions(
			token,
			selectedExam,
			undefined, // studentId
			undefined, // questionId
			undefined, // departmentId
			undefined, // year
			undefined  // sectionId
		)

			// Process the data to generate report
			const submissions = data.submissions || []
			
			// Group by student
			const studentGroups = submissions.reduce((acc: Record<string, any[]>, s: any) => {
				const studentId = s.student_id || 'unknown'
				if (!acc[studentId]) acc[studentId] = []
				acc[studentId].push(s)
				return acc
			}, {} as Record<string, any[]>)

			// Calculate student-level statistics
			const studentStats = Object.entries(studentGroups).map(([studentId, studentSubs]: [string, any]) => {
				const submissionsByQuestion = (studentSubs as any[]).reduce((qAcc: Record<string, any[]>, s: any) => {
					const qid = s.question_id || 'unknown'
					if (!qAcc[qid]) qAcc[qid] = []
					qAcc[qid].push(s)
					return qAcc
				}, {} as Record<string, any[]>)

				const perQuestionBestScores = Object.values(submissionsByQuestion).map((subs: any) => {
					const sorted = subs.slice().sort((a: any, b: any) => (Number(b.score) || 0) - (Number(a.score) || 0))
					return Number(sorted[0]?.score) || 0
				})

				const aggregateScore = perQuestionBestScores.length > 0 
					? perQuestionBestScores.reduce((sum, score) => sum + score, 0) / perQuestionBestScores.length
					: 0

				// Use SNAPSHOT data from submissions for historical accuracy
				const firstSub = (studentSubs as any[])[0]
				
				return {
					student_id: studentId,
					student_name: firstSub?.student_name || studentId,
					roll_number: firstSub?.roll_number || 'N/A',
					department: firstSub?.department_name_snapshot || firstSub?.department_name || 'N/A',
					section: firstSub?.section_name_snapshot || firstSub?.section_name || 'N/A',
					year: firstSub?.year_snapshot || firstSub?.year || 'N/A',
					aggregate_score: aggregateScore,
					passed: aggregateScore >= 50,
					num_submissions: (studentSubs as any[]).length,
					questions_attempted: Object.keys(submissionsByQuestion).length
				}
			})

			// Calculate overall statistics
			const totalStudents = studentStats.length
			const passedStudents = studentStats.filter(s => s.passed).length
			const failedStudents = totalStudents - passedStudents
			const passRate = totalStudents > 0 ? (passedStudents / totalStudents) * 100 : 0
			const averageScore = totalStudents > 0 
				? studentStats.reduce((sum, s) => sum + s.aggregate_score, 0) / totalStudents
				: 0

			// Calculate score distribution
			const scoreRanges = {
				'90-100%': studentStats.filter(s => s.aggregate_score >= 90).length,
				'80-89%': studentStats.filter(s => s.aggregate_score >= 80 && s.aggregate_score < 90).length,
				'70-79%': studentStats.filter(s => s.aggregate_score >= 70 && s.aggregate_score < 80).length,
				'60-69%': studentStats.filter(s => s.aggregate_score >= 60 && s.aggregate_score < 70).length,
				'50-59%': studentStats.filter(s => s.aggregate_score >= 50 && s.aggregate_score < 60).length,
				'<50%': studentStats.filter(s => s.aggregate_score < 50).length
			}

			// Calculate grade distribution
			const gradeDistribution = {
				'A (90-100%)': studentStats.filter(s => s.aggregate_score >= 90).length,
				'B (80-89%)': studentStats.filter(s => s.aggregate_score >= 80 && s.aggregate_score < 90).length,
				'C (70-79%)': studentStats.filter(s => s.aggregate_score >= 70 && s.aggregate_score < 80).length,
				'D (60-69%)': studentStats.filter(s => s.aggregate_score >= 60 && s.aggregate_score < 70).length,
				'E (50-59%)': studentStats.filter(s => s.aggregate_score >= 50 && s.aggregate_score < 60).length,
				'F (<50%)': studentStats.filter(s => s.aggregate_score < 50).length
			}

			// Add percentile to each student (with proper tie handling)
			const sortedScores = [...studentStats].sort((a, b) => b.aggregate_score - a.aggregate_score)
			
			// Calculate ranks with tie handling (students with same score get same rank)
			const ranksMap = new Map<string, number>()
			let currentRank = 1
			for (let i = 0; i < sortedScores.length; i++) {
				if (i > 0 && sortedScores[i].aggregate_score < sortedScores[i-1].aggregate_score) {
					currentRank = i + 1
				}
				ranksMap.set(sortedScores[i].student_id, currentRank)
			}
			
			studentStats.forEach(student => {
				const rank = ranksMap.get(student.student_id) || 1
				
				// Percentile: percentage of students with LOWER scores
				let percentile = 0
				if (totalStudents === 1) {
					percentile = 100 // Only student gets 100th percentile
				} else {
					// Count students with strictly lower scores
					const studentsBelowCount = studentStats.filter(s => s.aggregate_score < student.aggregate_score).length
					percentile = (studentsBelowCount / totalStudents) * 100
				}
				
				;(student as any).percentile = Math.round(percentile)
				;(student as any).rank = rank
				
				// Add grade
				const score = student.aggregate_score
				;(student as any).grade = 
					score >= 90 ? 'A' :
					score >= 80 ? 'B' :
					score >= 70 ? 'C' :
					score >= 60 ? 'D' :
					score >= 50 ? 'E' : 'F'
				
				// Add comparison to average
				;(student as any).vs_average = student.aggregate_score - averageScore
			})

			// Get top 5 and bottom 5 performers
			const sortedByScore = [...studentStats].sort((a, b) => b.aggregate_score - a.aggregate_score)
			const topPerformers = sortedByScore.slice(0, Math.min(5, sortedByScore.length))
			const bottomPerformers = sortedByScore.slice(Math.max(0, sortedByScore.length - 5))

			// Calculate statistical measures
			const scores = studentStats.map(s => s.aggregate_score).sort((a, b) => a - b)
			const median = scores.length > 0 
				? scores.length % 2 === 0 
					? (scores[scores.length / 2 - 1] + scores[scores.length / 2]) / 2
					: scores[Math.floor(scores.length / 2)]
				: 0
			
			const variance = scores.length > 0
				? scores.reduce((sum, score) => sum + Math.pow(score - averageScore, 2), 0) / scores.length
				: 0
			const stdDeviation = Math.sqrt(variance)

			// Question-wise analysis
			const questionStats: Record<string, any> = {}
			submissions.forEach((sub: any) => {
				const qid = sub.question_id || 'unknown'
				if (!questionStats[qid]) {
					questionStats[qid] = {
						question_id: qid,
						total_attempts: 0,
						total_score: 0,
						students_attempted: new Set(),
						best_scores: [] as number[]
					}
				}
				questionStats[qid].total_attempts++
				questionStats[qid].total_score += sub.score || 0
				questionStats[qid].students_attempted.add(sub.student_id)
				questionStats[qid].best_scores.push(sub.score || 0)
			})

			const questionAnalysis = Object.values(questionStats).map((q: any) => {
				const avgScore = q.total_attempts > 0 ? q.total_score / q.total_attempts : 0
				const bestScores = q.best_scores.sort((a: number, b: number) => b - a)
				const studentBestScores: Record<string, number> = {}
				
				// Get best score per student for this question
				submissions.forEach((sub: any) => {
					if (sub.question_id === q.question_id) {
						const studentId = sub.student_id
						if (!studentBestScores[studentId] || sub.score > studentBestScores[studentId]) {
							studentBestScores[studentId] = sub.score || 0
						}
					}
				})
				
				const avgBestScore = Object.values(studentBestScores).length > 0
					? Object.values(studentBestScores).reduce((sum, score) => sum + score, 0) / Object.values(studentBestScores).length
					: 0

				return {
					question_id: q.question_id,
					avg_score: avgScore,
					avg_best_score: avgBestScore,
					total_attempts: q.total_attempts,
					unique_students: q.students_attempted.size,
					difficulty_rating: avgBestScore >= 70 ? 'Easy' : avgBestScore >= 50 ? 'Medium' : 'Hard'
				}
			}).sort((a, b) => b.avg_best_score - a.avg_best_score)

			setReportData({
				reportType: 'exam',
				examId: selectedExam,
				examName: filterOptions.exams?.find((e: any) => e.id === selectedExam)?.name || selectedExam,
				totalStudents,
				passedStudents,
				failedStudents,
				passRate,
				averageScore,
				median,
				stdDeviation,
				scoreDistribution: scoreRanges,
				gradeDistribution,
				studentStats,
				topPerformers,
				bottomPerformers,
				questionAnalysis
			})
	}

	async function generateStudentReport() {
		if (!selectedStudent) {
			throw new Error('Please select a student')
		}

		// Extract student ID from comboKey (format: studentId|dept|year|section)
		const studentId = selectedStudent.split('|')[0]
		
		// Extract the selected snapshot combination
		const selectedCombo = filteredStudentsForReport.find(s => s.comboKey === selectedStudent)
		const selectedDeptSnapshot = selectedCombo?.department_name
		const selectedYearSnapshot = selectedCombo?.year
		const selectedSectionSnapshot = selectedCombo?.section_name

		// Fetch all submissions for the selected student
		const data = await getSubmissions(
			token,
			undefined, // examId
			studentId,
			undefined, // questionId
			undefined, // departmentId
			undefined, // year
			undefined  // sectionId
		)

		// Filter submissions to only include those with matching snapshot data
		const allSubmissions = data.submissions || []
		let submissions = allSubmissions.filter((sub: any) => {
			const snapDept = sub.department_name_snapshot || sub.department_name
			const snapYear = String(sub.year_snapshot || sub.year)
			const snapSection = sub.section_name_snapshot || sub.section_name
			
			return snapDept === selectedDeptSnapshot && 
				   snapYear === selectedYearSnapshot && 
				   snapSection === selectedSectionSnapshot
		})

		// Filter by selected exams (if any specific exams are selected)
		if (selectedExams.length > 0) {
			submissions = submissions.filter((sub: any) => selectedExams.includes(sub.exam_id))
		}
		
		// Get student info from submissions (snapshot)
		const firstSubmission = submissions[0]
		const student = filterOptions.allStudents?.find((s: any) => s.id === studentId)

		// Group submissions by exam
		const examGroups = submissions.reduce((acc: Record<string, any[]>, sub: any) => {
			const examId = sub.exam_id || 'unknown'
			if (!acc[examId]) acc[examId] = []
			acc[examId].push(sub)
			return acc
		}, {})

		// Calculate stats for each exam
		const examStats = Object.entries(examGroups).map(([examId, subs]: [string, any]) => {
			// Group by question
			const questionGroups = (subs as any[]).reduce((acc: Record<string, any[]>, sub: any) => {
				const qid = sub.question_id || 'unknown'
				if (!acc[qid]) acc[qid] = []
				acc[qid].push(sub)
				return acc
			}, {})

			// Get best score per question
			const perQuestionBestScores = Object.values(questionGroups).map((qSubs: any) => {
				const sorted = qSubs.slice().sort((a: any, b: any) => (Number(b.score) || 0) - (Number(a.score) || 0))
				return Number(sorted[0]?.score) || 0
			})

			const aggregateScore = perQuestionBestScores.length > 0
				? perQuestionBestScores.reduce((sum, score) => sum + score, 0) / perQuestionBestScores.length
				: 0

			const examName = filterOptions.exams?.find((e: any) => e.id === examId)?.name || examId
			
			// Get latest submission date
			const latestSubmission = (subs as any[]).reduce((latest: any, sub: any) => {
				if (!latest || new Date(sub.submitted_at) > new Date(latest.submitted_at)) {
					return sub
				}
				return latest
			}, null)

			// Calculate grade
			let grade = 'F'
			if (aggregateScore >= 90) grade = 'A'
			else if (aggregateScore >= 80) grade = 'B'
			else if (aggregateScore >= 70) grade = 'C'
			else if (aggregateScore >= 50) grade = 'D'
			else grade = 'F'

			return {
				exam_id: examId,
				exam_name: examName,
				aggregate_score: aggregateScore,
				score: aggregateScore, // alias for PDF
				passed: aggregateScore >= 50,
				grade,
				submitted_at: latestSubmission?.submitted_at || new Date().toISOString(),
				questions_attempted: Object.keys(questionGroups).length,
				total_submissions: (subs as any[]).length,
				best_per_question: perQuestionBestScores
			}
		}).sort((a, b) => b.aggregate_score - a.aggregate_score)

		const totalExams = examStats.length
		const passedExams = examStats.filter(e => e.passed).length
		const averageScore = totalExams > 0
			? examStats.reduce((sum, e) => sum + e.aggregate_score, 0) / totalExams
			: 0

		// Calculate additional insights
		const scores = examStats.map(e => e.aggregate_score)
		const highestScore = scores.length > 0 ? Math.max(...scores) : 0
		const lowestScore = scores.length > 0 ? Math.min(...scores) : 0
		
		// Performance trend (improving/declining)
		let trend = 'Stable'
		if (examStats.length >= 2) {
			const recentAvg = examStats.slice(0, Math.ceil(examStats.length / 2))
				.reduce((sum, e) => sum + e.aggregate_score, 0) / Math.ceil(examStats.length / 2)
			const olderAvg = examStats.slice(Math.ceil(examStats.length / 2))
				.reduce((sum, e) => sum + e.aggregate_score, 0) / Math.floor(examStats.length / 2)
			
			if (recentAvg > olderAvg + 5) trend = 'Improving'
			else if (recentAvg < olderAvg - 5) trend = 'Declining'
		}

		// Total questions attempted and submissions
		const totalQuestionsAttempted = examStats.reduce((sum, e) => sum + e.questions_attempted, 0)
		const totalSubmissions = examStats.reduce((sum, e) => sum + e.total_submissions, 0)

		// Consistency score (lower std dev = more consistent)
		const mean = averageScore
		const variance = scores.length > 0
			? scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length
			: 0
		const stdDev = Math.sqrt(variance)
		const consistencyRating = stdDev < 10 ? 'Very Consistent' : stdDev < 15 ? 'Consistent' : stdDev < 20 ? 'Moderate' : 'Inconsistent'

		// Generate exam selection info
		let selectedExamsInfo = 'All Exams'
		if (selectedExams.length > 0) {
			if (selectedExams.length === 1) {
				const examName = filterOptions.exams?.find((e: any) => e.id === selectedExams[0])?.name || selectedExams[0]
				selectedExamsInfo = `Exam: ${examName}`
			} else {
				selectedExamsInfo = `${selectedExams.length} Exams Selected: ${selectedExams.map((eid: string) => filterOptions.exams?.find((e: any) => e.id === eid)?.name || eid).join(', ')}`
			}
		}

		// Use snapshot data from submissions (already filtered to match the selected combo)
		setReportData({
			reportType: 'student',
			student_id: studentId,
			student_name: firstSubmission?.student_name || student?.name || 'Unknown',
			roll_number: firstSubmission?.roll_number || student?.roll_number || 'N/A',
			department: selectedDeptSnapshot || 'N/A',
			section: selectedSectionSnapshot || 'N/A',
			year: selectedYearSnapshot || 'N/A',
			totalExams,
			passedExams,
			failedExams: totalExams - passedExams,
			averageScore,
			passRate: totalExams > 0 ? (passedExams / totalExams) * 100 : 0,
			highestScore,
			lowestScore,
			trend,
			totalQuestionsAttempted,
			totalSubmissions,
			consistencyRating,
			stdDeviation: stdDev,
			examStats,
			selectedExamsInfo
		})
	}

	async function generateSectionReport() {
		if (!selectedDepartment || !selectedYear || !selectedSection) {
			throw new Error('Please select department, year, and section')
		}

		// Get department and section names for comparison
		const selectedDeptName = filterOptions.departments?.find((d: any) => d.id === selectedDepartment)?.name
		const selectedSectionName = filterOptions.sections?.find((s: any) => s.id === selectedSection)?.name

		// Fetch ALL submissions (no demographic filters) - we'll filter by snapshot data
		const data = await getSubmissions(
			token,
			undefined, // examId
			undefined, // studentId
			undefined, // questionId
			undefined, // departmentId - don't filter
			undefined, // year - don't filter
			undefined  // sectionId - don't filter
		)

		// Filter submissions by SNAPSHOT data matching selected department/year/section
		let submissions = (data.submissions || []).filter((sub: any) => {
			const snapDept = sub.department_name_snapshot || sub.department_name
			const snapSection = sub.section_name_snapshot || sub.section_name
			const snapYear = String(sub.year_snapshot || sub.year)
			const selectedYearStr = String(selectedYear)
			
			return snapDept === selectedDeptName &&
				snapSection === selectedSectionName &&
				snapYear === selectedYearStr
		})

		// Filter by selected exams (if any specific exams are selected)
		if (selectedExams.length > 0) {
			submissions = submissions.filter((sub: any) => selectedExams.includes(sub.exam_id))
		}

		if (submissions.length === 0) {
			const examMsg = selectedExams.length > 0 ? ' for the selected exam(s)' : ''
			throw new Error(`No submission data found for this section${examMsg}. Students may not have attempted any exams yet.`)
		}

		// Group by student
		const studentGroups = submissions.reduce((acc: Record<string, any[]>, s: any) => {
			const studentId = s.student_id || 'unknown'
			if (!acc[studentId]) acc[studentId] = []
			acc[studentId].push(s)
			return acc
		}, {})

		// Calculate stats per student (same logic as exam report)
		const studentStats = Object.entries(studentGroups).map(([studentId, studentSubs]: [string, any]) => {
			const submissionsByQuestion = (studentSubs as any[]).reduce((qAcc: Record<string, any[]>, s: any) => {
				const qid = s.question_id || 'unknown'
				if (!qAcc[qid]) qAcc[qid] = []
				qAcc[qid].push(s)
				return qAcc
			}, {})

			const perQuestionBestScores = Object.values(submissionsByQuestion).map((subs: any) => {
				const sorted = subs.slice().sort((a: any, b: any) => (Number(b.score) || 0) - (Number(a.score) || 0))
				return Number(sorted[0]?.score) || 0
			})

			const aggregateScore = perQuestionBestScores.length > 0
				? perQuestionBestScores.reduce((sum, score) => sum + score, 0) / perQuestionBestScores.length
				: 0

			// Use SNAPSHOT data from submissions for historical accuracy
			const firstSub = (studentSubs as any[])[0]

			// Calculate grade
			let grade = 'F'
			if (aggregateScore >= 90) grade = 'A'
			else if (aggregateScore >= 80) grade = 'B'
			else if (aggregateScore >= 70) grade = 'C'
			else if (aggregateScore >= 50) grade = 'D'
			else grade = 'F'

			return {
				student_id: studentId,
				student_name: firstSub?.student_name || studentId,
				roll_number: firstSub?.roll_number || 'N/A',
				aggregate_score: aggregateScore,
				grade,
				passed: aggregateScore >= 50,
				num_submissions: (studentSubs as any[]).length,
				questions_attempted: Object.keys(submissionsByQuestion).length
			}
		})

		const totalStudents = studentStats.length
		const passedStudents = studentStats.filter(s => s.passed).length
		const averageScore = totalStudents > 0
			? studentStats.reduce((sum, s) => sum + s.aggregate_score, 0) / totalStudents
			: 0

		// Calculate median
		const sortedScores = studentStats.map(s => s.aggregate_score).sort((a, b) => a - b)
		const median = sortedScores.length > 0
			? sortedScores.length % 2 === 0
				? (sortedScores[sortedScores.length / 2 - 1] + sortedScores[sortedScores.length / 2]) / 2
				: sortedScores[Math.floor(sortedScores.length / 2)]
			: 0

		// Calculate additional insights
		const highestScore = sortedScores.length > 0 ? sortedScores[sortedScores.length - 1] : 0
		const lowestScore = sortedScores.length > 0 ? sortedScores[0] : 0
		
		// Standard deviation
		const variance = sortedScores.length > 0
			? sortedScores.reduce((sum, score) => sum + Math.pow(score - averageScore, 2), 0) / sortedScores.length
			: 0
		const stdDeviation = Math.sqrt(variance)

		// Score distribution
		const scoreRanges = {
			'90-100%': studentStats.filter(s => s.aggregate_score >= 90).length,
			'80-89%': studentStats.filter(s => s.aggregate_score >= 80 && s.aggregate_score < 90).length,
			'70-79%': studentStats.filter(s => s.aggregate_score >= 70 && s.aggregate_score < 80).length,
			'50-69%': studentStats.filter(s => s.aggregate_score >= 50 && s.aggregate_score < 70).length,
			'<50%': studentStats.filter(s => s.aggregate_score < 50).length
		}

		// Grade distribution
		const gradeDistribution = {
			'A': studentStats.filter(s => s.grade === 'A').length,
			'B': studentStats.filter(s => s.grade === 'B').length,
			'C': studentStats.filter(s => s.grade === 'C').length,
			'D': studentStats.filter(s => s.grade === 'D').length,
			'F': studentStats.filter(s => s.grade === 'F').length
		}

		// Top and bottom performers
		const sortedByScore = [...studentStats].sort((a, b) => b.aggregate_score - a.aggregate_score)
		const topPerformers = sortedByScore.slice(0, 5)
		const bottomPerformers = sortedByScore.slice(-5).reverse()

		// Total activity metrics
		const totalSubmissions = studentStats.reduce((sum, s) => sum + s.num_submissions, 0)
		const totalQuestionsAttempted = studentStats.reduce((sum, s) => sum + s.questions_attempted, 0)
		const avgSubmissionsPerStudent = totalStudents > 0 ? totalSubmissions / totalStudents : 0
		const avgQuestionsPerStudent = totalStudents > 0 ? totalQuestionsAttempted / totalStudents : 0

		// Use snapshot data for department/section names (from first submission if available)
		const firstSubmission = submissions[0]
		const deptName = firstSubmission?.department_name_snapshot || filterOptions.departments?.find((d: any) => d.id === selectedDepartment)?.name || selectedDepartment
		const sectionName = firstSubmission?.section_name_snapshot || filterOptions.sections?.find((s: any) => s.id === selectedSection)?.name || selectedSection

		// Generate exam selection info
		let selectedExamsInfo = 'All Exams'
		if (selectedExams.length > 0) {
			if (selectedExams.length === 1) {
				const examName = filterOptions.exams?.find((e: any) => e.id === selectedExams[0])?.name || selectedExams[0]
				selectedExamsInfo = `Exam: ${examName}`
			} else {
				selectedExamsInfo = `${selectedExams.length} Exams Selected: ${selectedExams.map((eid: string) => filterOptions.exams?.find((e: any) => e.id === eid)?.name || eid).join(', ')}`
			}
		}

		setReportData({
			reportType: 'section',
			department_name: deptName,
			section_name: sectionName,
			year: firstSubmission?.year_snapshot || selectedYear,
			totalStudents,
			passedStudents,
			failedStudents: totalStudents - passedStudents,
			averageScore,
			median,
			highestScore,
			lowestScore,
			stdDeviation,
			passRate: totalStudents > 0 ? (passedStudents / totalStudents) * 100 : 0,
			scoreDistribution: scoreRanges,
			gradeDistribution,
			topPerformers,
			bottomPerformers,
			totalSubmissions,
			totalQuestionsAttempted,
			avgSubmissionsPerStudent,
			avgQuestionsPerStudent,
			studentStats: studentStats.sort((a, b) => b.aggregate_score - a.aggregate_score),
			selectedExamsInfo
		})
	}

	async function generateDepartmentYearReport() {
		if (!selectedDepartment || !selectedYear) {
			throw new Error('Please select department and year')
		}

		// Get department name for comparison
		const selectedDeptName = filterOptions.departments?.find((d: any) => d.id === selectedDepartment)?.name

		// Fetch ALL submissions (no demographic filters) - we'll filter by snapshot data
		const data = await getSubmissions(
			token,
			undefined, // examId
			undefined, // studentId
			undefined, // questionId
			undefined, // departmentId - don't filter
			undefined, // year - don't filter
			undefined  // sectionId - don't filter
		)

		// Filter submissions by SNAPSHOT data matching selected department/year
		let submissions = (data.submissions || []).filter((sub: any) => {
			const snapDept = sub.department_name_snapshot || sub.department_name
			const snapYear = String(sub.year_snapshot || sub.year)
			const selectedYearStr = String(selectedYear)
			
			return snapDept === selectedDeptName && snapYear === selectedYearStr
		})

		// Filter by selected exams (if any specific exams are selected)
		if (selectedExams.length > 0) {
			submissions = submissions.filter((sub: any) => selectedExams.includes(sub.exam_id))
		}

		if (submissions.length === 0) {
			const examMsg = selectedExams.length > 0 ? ' for the selected exam(s)' : ''
			throw new Error(`No submission data found for this department and year${examMsg}. Students may not have attempted any exams yet.`)
		}

		// Group by section first (using snapshot section name), then by student
		const sectionGroups = submissions.reduce((acc: Record<string, any[]>, s: any) => {
			const sectionName = s.section_name_snapshot || s.section_name || 'unknown'
			if (!acc[sectionName]) acc[sectionName] = []
			acc[sectionName].push(s)
			return acc
		}, {})

		// Calculate stats per section
		const sectionStats = Object.entries(sectionGroups).map(([sectionName, sectionSubs]: [string, any]) => {
			const studentGroups = (sectionSubs as any[]).reduce((acc: Record<string, any[]>, s: any) => {
				const studentId = s.student_id || 'unknown'
				if (!acc[studentId]) acc[studentId] = []
				acc[studentId].push(s)
				return acc
			}, {})

			const studentScores = Object.entries(studentGroups).map(([studentId, studentSubs]: [string, any]) => {
				const submissionsByQuestion = (studentSubs as any[]).reduce((qAcc: Record<string, any[]>, s: any) => {
					const qid = s.question_id || 'unknown'
					if (!qAcc[qid]) qAcc[qid] = []
					qAcc[qid].push(s)
					return qAcc
				}, {})

				const perQuestionBestScores = Object.values(submissionsByQuestion).map((subs: any) => {
					const sorted = subs.slice().sort((a: any, b: any) => (Number(b.score) || 0) - (Number(a.score) || 0))
					return Number(sorted[0]?.score) || 0
				})

				const aggregateScore = perQuestionBestScores.length > 0
					? perQuestionBestScores.reduce((sum, score) => sum + score, 0) / perQuestionBestScores.length
					: 0

				return {
					student_id: studentId,
					aggregate_score: aggregateScore,
					passed: aggregateScore >= 50
				}
			})
			
			const totalStudents = studentScores.length
			const passedStudents = studentScores.filter(s => s.passed).length
			const averageScore = totalStudents > 0
				? studentScores.reduce((sum, s) => sum + s.aggregate_score, 0) / totalStudents
				: 0

			return {
				section_name: sectionName,
				totalStudents,
				passedStudents,
				failedStudents: totalStudents - passedStudents,
				averageScore,
				passRate: totalStudents > 0 ? (passedStudents / totalStudents) * 100 : 0
			}
		}).sort((a, b) => b.averageScore - a.averageScore)

		// Use snapshot data for department name
		const firstSubmission = submissions[0]
		const deptName = firstSubmission?.department_name_snapshot || filterOptions.departments?.find((d: any) => d.id === selectedDepartment)?.name || selectedDepartment
		
		const overallTotal = sectionStats.reduce((sum, s) => sum + s.totalStudents, 0)
		const overallPassed = sectionStats.reduce((sum, s) => sum + s.passedStudents, 0)
		const overallAverage = sectionStats.length > 0
			? sectionStats.reduce((sum, s) => sum + (s.averageScore * s.totalStudents), 0) / overallTotal
			: 0

		// Calculate additional insights for department-year
		const bestSection = sectionStats.length > 0 ? sectionStats[0] : null
		const worstSection = sectionStats.length > 0 ? sectionStats[sectionStats.length - 1] : null
		
		// Section performance variance
		const sectionAvgScores = sectionStats.map(s => s.averageScore)
		const sectionVariance = sectionAvgScores.length > 0
			? sectionAvgScores.reduce((sum, score) => sum + Math.pow(score - overallAverage, 2), 0) / sectionAvgScores.length
			: 0
		const sectionStdDev = Math.sqrt(sectionVariance)
		const consistencyRating = sectionStdDev < 5 ? 'Very Uniform' : sectionStdDev < 10 ? 'Uniform' : sectionStdDev < 15 ? 'Moderate Variation' : 'High Variation'

		// Average metrics across sections
		const avgPassRateAcrossSections = sectionStats.length > 0
			? sectionStats.reduce((sum, s) => sum + s.passRate, 0) / sectionStats.length
			: 0
		
		// Section with highest and lowest pass rate
		const sectionsByPassRate = [...sectionStats].sort((a, b) => b.passRate - a.passRate)
		const highestPassRateSection = sectionsByPassRate[0]
		const lowestPassRateSection = sectionsByPassRate[sectionsByPassRate.length - 1]

		// Generate exam selection info
		let selectedExamsInfo = 'All Exams'
		if (selectedExams.length > 0) {
			if (selectedExams.length === 1) {
				const examName = filterOptions.exams?.find((e: any) => e.id === selectedExams[0])?.name || selectedExams[0]
				selectedExamsInfo = `Exam: ${examName}`
			} else {
				selectedExamsInfo = `${selectedExams.length} Exams Selected: ${selectedExams.map((eid: string) => filterOptions.exams?.find((e: any) => e.id === eid)?.name || eid).join(', ')}`
			}
		}

		setReportData({
			reportType: 'department-year',
			department_name: deptName,
			year: firstSubmission?.year_snapshot || selectedYear,
			totalSections: sectionStats.length,
			totalStudents: overallTotal,
			passedStudents: overallPassed,
			failedStudents: overallTotal - overallPassed,
			averageScore: overallAverage,
			passRate: overallTotal > 0 ? (overallPassed / overallTotal) * 100 : 0,
			bestSection,
			worstSection,
			sectionStdDev,
			consistencyRating,
			avgPassRateAcrossSections,
			highestPassRateSection,
			lowestPassRateSection,
			sectionStats,
			selectedExamsInfo
		})
	}

	function downloadCSV() {
		if (!reportData) return

		let csv = ''
		let filename = ''

		// Generate clean, minimal filename with date
		const date = new Date().toISOString().split('T')[0] // Format: 2025-11-01
		const facultyName = localStorage.getItem('username')?.replace(/[^a-zA-Z0-9]/g, '_') || 'Faculty'
		
		// Route to appropriate CSV generator based on report type
		switch (reportData.reportType) {
			case 'exam':
				csv = generateExamCSV()
				const examName = reportData.examName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 40)
				filename = `${facultyName}_${examName}_${date}.csv`
				break
			case 'student':
				csv = generateStudentCSV()
				const studentName = reportData.student_name.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 25)
				const dept = reportData.department.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 15)
				filename = `${facultyName}_${studentName}_${dept}_Y${reportData.year}_S${reportData.section}_${date}.csv`
				break
			case 'section':
				csv = generateSectionCSV()
				const secDept = reportData.department_name.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 15)
				const secName = reportData.section_name.replace(/[^a-zA-Z0-9]/g, '_')
				filename = `${facultyName}_${secDept}_Y${reportData.year}_S${secName}_${date}.csv`
				break
			case 'department-year':
				csv = generateDepartmentYearCSV()
				const deptName = reportData.department_name.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20)
				filename = `${facultyName}_${deptName}_Y${reportData.year}_${date}.csv`
				break
		}

		// Download CSV
		const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
		const url = window.URL.createObjectURL(blob)
		const a = document.createElement('a')
		a.href = url
		a.download = filename
		a.click()
		window.URL.revokeObjectURL(url)
	}

	function generateExamCSV() {
		let csv = 'EXAM PERFORMANCE REPORT - STATISTICAL DATA\n\n'
		csv += `Exam ID,${reportData.examId}\n`
		csv += `Exam Name,${reportData.examName}\n`
		csv += `Generated Date,${new Date().toLocaleString()}\n\n`
		
		csv += 'Overall Statistics\n'
		csv += `Total Students,${reportData.totalStudents}\n`
		csv += `Passed,${reportData.passedStudents}\n`
		csv += `Failed,${reportData.failedStudents}\n`
		csv += `Pass Rate,${reportData.passRate.toFixed(1)}%\n`
		csv += `Mean Score,${reportData.averageScore.toFixed(1)}%\n`
		csv += `Median Score,${reportData.median.toFixed(1)}%\n`
		csv += `Standard Deviation,${reportData.stdDeviation.toFixed(2)}%\n\n`

		csv += 'Score Distribution\n'
		csv += 'Range,Count\n'
		Object.entries(reportData.scoreDistribution).forEach(([range, count]) => {
			csv += `${range},${count}\n`
		})
		csv += '\n'

		csv += 'Top 5 Performers\n'
		csv += 'Rank,Roll Number,Name,Score\n'
		reportData.topPerformers.forEach((student: any, index: number) => {
			csv += `${index + 1},${student.roll_number},${student.student_name},${student.aggregate_score.toFixed(1)}%\n`
		})
		csv += '\n'

		csv += 'Bottom 5 Performers\n'
		csv += 'Rank,Roll Number,Name,Score\n'
		reportData.bottomPerformers.forEach((student: any, index: number) => {
			csv += `${index + 1},${student.roll_number},${student.student_name},${student.aggregate_score.toFixed(1)}%\n`
		})
		csv += '\n'

		if (reportData.questionAnalysis && reportData.questionAnalysis.length > 0) {
			csv += 'Question-wise Analysis\n'
			csv += 'Question ID,Avg Best Score,Students Attempted,Total Attempts,Difficulty Rating\n'
			reportData.questionAnalysis.forEach((q: any) => {
				csv += `${q.question_id},${q.avg_best_score.toFixed(1)}%,${q.unique_students},${q.total_attempts},${q.difficulty_rating}\n`
			})
			csv += '\n'
		}

		csv += '=== COMPLETE STUDENT-WISE DETAILS ===\n'
		csv += 'Rank,Roll Number,Name,Department,Section,Year,Grade,Final Score,vs Class Avg,Percentile,Status,Questions Attempted,Total Submissions\n'
		reportData.studentStats
			.sort((a: any, b: any) => b.aggregate_score - a.aggregate_score)
			.forEach((student: any) => {
				csv += `${student.rank},${student.roll_number},${student.student_name},${student.department},${student.section},${student.year},${student.grade},${student.aggregate_score.toFixed(2)}%,${student.vs_average > 0 ? '+' : ''}${student.vs_average.toFixed(2)}%,${student.percentile}th,${student.passed ? 'Pass' : 'Fail'},${student.questions_attempted},${student.num_submissions}\n`
			})

		return csv
	}

	function generateStudentCSV() {
		let csv = 'STUDENT PERFORMANCE REPORT\n\n'
		csv += `Student Name,${reportData.student_name}\n`
		csv += `Roll Number,${reportData.roll_number}\n`
		csv += `Department,${reportData.department}\n`
		csv += `Section,${reportData.section}\n`
		csv += `Year,${reportData.year}\n`
		csv += `Generated Date,${new Date().toLocaleString()}\n\n`

		csv += '=== OVERALL STATISTICS ===\n'
		csv += `Total Exams Taken,${reportData.totalExams}\n`
		csv += `Exams Passed,${reportData.passedExams}\n`
		csv += `Exams Failed,${reportData.failedExams}\n`
		csv += `Overall Average Score,${reportData.averageScore.toFixed(2)}%\n\n`

		csv += '=== EXAM-WISE PERFORMANCE ===\n'
		csv += 'Exam Name,Score,Status,Questions Attempted,Total Submissions\n'
		reportData.examStats?.forEach((exam: any) => {
			csv += `${exam.exam_name},${exam.aggregate_score.toFixed(2)}%,${exam.passed ? 'Pass' : 'Fail'},${exam.questions_attempted},${exam.total_submissions}\n`
		})

		return csv
	}

	function generateSectionCSV() {
		let csv = 'SECTION PERFORMANCE REPORT\n\n'
		csv += `Department,${reportData.department_name}\n`
		csv += `Section,${reportData.section_name}\n`
		csv += `Year,${reportData.year}\n`
		csv += `Generated Date,${new Date().toLocaleString()}\n\n`

		csv += '=== OVERALL STATISTICS ===\n'
		csv += `Total Students,${reportData.totalStudents}\n`
		csv += `Passed,${reportData.passedStudents}\n`
		csv += `Failed,${reportData.failedStudents}\n`
		csv += `Pass Rate,${reportData.passRate.toFixed(2)}%\n`
		csv += `Average Score,${reportData.averageScore.toFixed(2)}%\n\n`

		csv += '=== STUDENT-WISE PERFORMANCE ===\n'
		csv += 'Rank,Roll Number,Name,Score,Status,Questions Attempted,Total Submissions\n'
		reportData.studentStats?.forEach((student: any, index: number) => {
			csv += `${index + 1},${student.roll_number},${student.student_name},${student.aggregate_score.toFixed(2)}%,${student.passed ? 'Pass' : 'Fail'},${student.questions_attempted},${student.num_submissions}\n`
		})

		return csv
	}

	function generateDepartmentYearCSV() {
		let csv = 'DEPARTMENT-YEAR PERFORMANCE REPORT\n\n'
		csv += `Department,${reportData.department_name}\n`
		csv += `Year,${reportData.year}\n`
		csv += `Generated Date,${new Date().toLocaleString()}\n\n`

		csv += '=== OVERALL STATISTICS ===\n'
		csv += `Total Sections,${reportData.totalSections}\n`
		csv += `Total Students,${reportData.totalStudents}\n`
		csv += `Passed,${reportData.passedStudents}\n`
		csv += `Failed,${reportData.failedStudents}\n`
		csv += `Pass Rate,${reportData.passRate.toFixed(2)}%\n`
		csv += `Overall Average Score,${reportData.averageScore.toFixed(2)}%\n\n`

		csv += '=== SECTION-WISE COMPARISON ===\n'
		csv += 'Rank,Section,Total Students,Average Score,Pass Rate,Passed,Failed\n'
		reportData.sectionStats?.forEach((section: any, index: number) => {
			csv += `${index + 1},${section.section_name},${section.totalStudents},${section.averageScore.toFixed(2)}%,${section.passRate.toFixed(2)}%,${section.passedStudents},${section.failedStudents}\n`
		})

		return csv
	}

	function downloadPDF() {
		if (!reportData) return

		// Create HTML for PDF print
		const printWindow = window.open('', '_blank')
		if (!printWindow) {
			alert('Please allow popups to download PDF')
			return
		}

		// Determine report title based on type
		let reportTitle = ''
		let reportInfo = ''
		
		if (reportData.reportType === 'exam') {
			reportTitle = 'Exam Performance Report'
			reportInfo = reportData.examName || 'Exam Report'
		} else if (reportData.reportType === 'student') {
			reportTitle = 'Student Performance Report'
			reportInfo = `${reportData.roll_number} - ${reportData.student_name || 'Student'}`
		} else if (reportData.reportType === 'section') {
			reportTitle = 'Section Performance Report'
			reportInfo = `${reportData.department_name || ''} - Year ${reportData.year || ''} - Section ${reportData.section_name || ''}`
		} else if (reportData.reportType === 'department-year') {
			reportTitle = 'Department-Year Performance Report'
			reportInfo = `${reportData.department_name || ''} - Year ${reportData.year || ''}`
		}

		const commonStyles = `*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Inter','Segoe UI','Helvetica Neue',Arial,sans-serif;padding:20px;background:#fff;color:#2c3e50;line-height:1.6}@page{margin:15mm}.container{max-width:100%;margin:0 auto;background:#fff}.header{border-bottom:3px solid #2c3e50;padding-bottom:24px;margin-bottom:32px}.header h1{color:#2c3e50;font-size:28px;margin-bottom:8px;font-weight:700;letter-spacing:-0.5px}.header .exam-info{background:#34495e;color:#fff;padding:12px 20px;border-radius:4px;margin-top:12px;font-size:15px;font-weight:500;display:inline-block}.header .subtitle{color:#7f8c8d;font-size:13px;margin-top:6px}.exam-badge{background:#e67e22;color:#fff;padding:6px 14px;border-radius:4px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;white-space:nowrap}.stats-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin:24px 0}.stat-card{background:#fff;padding:18px;border-radius:6px;text-align:center;border:1.5px solid #dfe6e9;box-shadow:0 1px 3px rgba(0,0,0,0.06)}.stat-card.pass{background:#f8fffe;border-color:#27ae60}.stat-card.fail{background:#fffafa;border-color:#e74c3c}.stat-card.mean{background:#f8fbff;border-color:#3498db}.stat-card.median{background:#f9fbff;border-color:#3498db}.stat-label{font-size:10px;color:#7f8c8d;text-transform:uppercase;margin-bottom:6px;font-weight:600;letter-spacing:0.8px}.stat-value{font-size:26px;font-weight:700;color:#2c3e50}.stat-card.pass .stat-value{color:#27ae60}.stat-card.fail .stat-value{color:#e74c3c}.stat-card.mean .stat-value{color:#3498db}.stat-card.median .stat-value{color:#3498db}.stat-extra{font-size:11px;color:#95a5a6;margin-top:4px;font-weight:500}.section{margin:28px 0;page-break-inside:avoid;border:1.5px solid #ecf0f1;border-radius:6px;padding:20px;background:#fff}.section-title{font-size:17px;color:#2c3e50;padding:0 0 12px 0;margin-bottom:16px;font-weight:700;border-bottom:2px solid #ecf0f1;display:flex;justify-content:space-between;align-items:center}.charts-row{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:16px 0}.chart-card{background:#fafbfc;padding:18px;border-radius:6px;border:1.5px solid #ecf0f1}.chart-title{font-size:14px;font-weight:600;margin-bottom:12px;color:#2c3e50;padding-bottom:10px;border-bottom:1px solid #ecf0f1;display:flex;justify-content:space-between;align-items:center}.pie-container{text-align:center;padding:12px 0}.pie-svg{width:160px;height:160px;margin:0 auto}.pie-legend{display:flex;justify-content:center;gap:20px;margin-top:14px}.legend-item{display:flex;align-items:center;gap:6px}.legend-color{width:14px;height:14px;border-radius:2px}.legend-color.pass{background:#27ae60}.legend-color.fail{background:#e74c3c}.legend-text{font-size:12px;font-weight:500;color:#2c3e50}.grade-row{margin:8px 0}.grade-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:4px}.grade-label{display:flex;align-items:center;gap:8px}.grade-badge{display:inline-block;width:26px;height:26px;border-radius:3px;color:#fff;font-weight:700;text-align:center;line-height:26px;font-size:12px}.grade-badge.A{background:#27ae60}.grade-badge.B{background:#3498db}.grade-badge.C{background:#f39c12}.grade-badge.D{background:#e67e22}.grade-badge.E,.grade-badge.F{background:#e74c3c}.grade-bar-bg{height:16px;background:#ecf0f1;border-radius:3px;overflow:hidden}.grade-bar-fill{height:100%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:10px;font-weight:600}.grade-bar-fill.A{background:#27ae60}.grade-bar-fill.B{background:#3498db}.grade-bar-fill.C{background:#f39c12}.grade-bar-fill.D{background:#e67e22}.grade-bar-fill.E,.grade-bar-fill.F{background:#e74c3c}table{width:100%;border-collapse:collapse;margin:12px 0;font-size:11px;background:#fff}th{background:#34495e;color:#fff;padding:10px 12px;text-align:left;font-weight:600;font-size:10px;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #2c3e50}td{padding:9px 12px;border-bottom:1px solid #ecf0f1;color:#2c3e50}tr:nth-child(even){background:#fafbfc}tr:hover{background:#f8f9fa}.rank-badge{display:inline-block;background:#95a5a6;color:#fff;padding:4px 9px;border-radius:3px;font-weight:600;font-size:10px}.rank-badge.gold{background:#f39c12;color:#fff}.rank-badge.silver{background:#95a5a6;color:#fff}.rank-badge.bronze{background:#cd7f32;color:#fff}.grade-chip{display:inline-block;padding:4px 10px;border-radius:3px;color:#fff;font-weight:600;font-size:10px}.grade-chip.A{background:#27ae60}.grade-chip.B{background:#3498db}.grade-chip.C{background:#f39c12}.grade-chip.D{background:#e67e22}.grade-chip.E,.grade-chip.F{background:#e74c3c}.score-chip{display:inline-block;padding:4px 10px;border-radius:3px;font-weight:600;font-size:10px;color:#fff}.score-chip.high{background:#27ae60}.score-chip.medium{background:#f39c12}.score-chip.low{background:#e74c3c}.status-chip{display:inline-block;padding:4px 10px;border-radius:3px;font-weight:600;font-size:10px}.status-chip.pass{background:#d5f4e6;color:#27ae60;border:1px solid #27ae60}.status-chip.fail{background:#fadbd8;color:#e74c3c;border:1px solid #e74c3c}.footer{margin-top:32px;padding-top:16px;border-top:2px solid #ecf0f1;text-align:center;color:#95a5a6;font-size:10px}.insight-box{background:#fef5e7;border-left:3px solid #f39c12;padding:12px 16px;margin:12px 0;border-radius:3px;font-size:11px;color:#7f8c8d}.insight-box strong{color:#e67e22;font-weight:600}@media print{body{background:#fff;padding:0;margin:0}@page{margin:15mm}.container{box-shadow:none;padding:0}.section{page-break-inside:avoid}table{page-break-inside:auto}tr{page-break-inside:avoid;page-break-after:auto}}`

		// Build content based on report type
		let htmlContent = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>${reportTitle}</title>
<style>${commonStyles}</style></head><body><div class="container">
<div class="header"><h1>${reportTitle}</h1><div class="exam-info">${reportInfo}</div><div class="subtitle">Generated: ${new Date().toLocaleString()}</div></div>`

		// === EXAM REPORT ===
		if (reportData.reportType === 'exam') {
			htmlContent += `
<div class="section"><div class="section-title"><span>Overall Statistics</span><span class="exam-badge">${reportData.examName}</span></div><div class="stats-grid">
<div class="stat-card"><div class="stat-label">Total Students</div><div class="stat-value">${reportData.totalStudents}</div></div>
<div class="stat-card pass"><div class="stat-label">Passed</div><div class="stat-value">${reportData.passedStudents}</div><div class="stat-extra">${reportData.passRate.toFixed(1)}%</div></div>
<div class="stat-card fail"><div class="stat-label">Failed</div><div class="stat-value">${reportData.failedStudents}</div><div class="stat-extra">${(100-reportData.passRate).toFixed(1)}%</div></div>
<div class="stat-card mean"><div class="stat-label">Mean Score</div><div class="stat-value">${reportData.averageScore.toFixed(1)}%</div></div>
<div class="stat-card median"><div class="stat-label">Median Score</div><div class="stat-value">${reportData.median.toFixed(1)}%</div></div>
</div><div class="insight-box"><strong>Insight:</strong> Std Dev: ${reportData.stdDeviation.toFixed(2)}% ${reportData.stdDeviation<10?'(Very consistent)':reportData.stdDeviation<15?'(Consistent)':reportData.stdDeviation<20?'(Moderate variation)':'(High variation)'}</div></div>
<div class="section"><div class="charts-row"><div class="chart-card"><div class="chart-title"><span>Pass/Fail Ratio</span><span class="exam-badge">${reportData.examName}</span></div><div class="pie-container"><svg class="pie-svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="none" stroke="#f5f5f5" stroke-width="20"/><circle cx="50" cy="50" r="40" fill="none" stroke="#4caf50" stroke-width="20" stroke-dasharray="${(reportData.passRate/100)*251.2} 251.2" transform="rotate(-90 50 50)" stroke-linecap="round"/><circle cx="50" cy="50" r="40" fill="none" stroke="#f44336" stroke-width="20" stroke-dasharray="${((100-reportData.passRate)/100)*251.2} 251.2" stroke-dashoffset="${-((reportData.passRate/100)*251.2)}" transform="rotate(-90 50 50)" stroke-linecap="round"/><text x="50" y="47" text-anchor="middle" font-size="16" font-weight="bold">${reportData.passRate.toFixed(0)}%</text><text x="50" y="58" text-anchor="middle" font-size="6" fill="#666">Pass Rate</text></svg><div class="pie-legend"><div class="legend-item"><div class="legend-color pass"></div><span class="legend-text">Pass: ${reportData.passedStudents}</span></div><div class="legend-item"><div class="legend-color fail"></div><span class="legend-text">Fail: ${reportData.failedStudents}</span></div></div></div></div>
<div class="chart-card"><div class="chart-title"><span>Grade Distribution</span><span class="exam-badge">${reportData.examName}</span></div>${Object.entries(reportData.gradeDistribution).map(([grade,count]:any)=>{const pct=reportData.totalStudents>0?(count/reportData.totalStudents)*100:0;const g=grade.charAt(0);return`<div class="grade-row"><div class="grade-header"><div class="grade-label"><span class="grade-badge ${g}">${g}</span><span>${grade.split('(')[1]?.replace(')','')}</span></div><span style="font-weight:600;font-size:12px">${count} (${pct.toFixed(1)}%)</span></div><div class="grade-bar-bg"><div class="grade-bar-fill ${g}" style="width:${pct}%">${count>0?count:''}</div></div></div>`}).join('')}</div></div></div>
<div class="section"><div class="section-title"><span>Top 5 Performers</span><span class="exam-badge">${reportData.examName}</span></div><table><thead><tr><th>Rank</th><th>Roll No</th><th>Name</th><th>Grade</th><th>Score</th><th>Percentile</th></tr></thead><tbody>${reportData.topPerformers.map((s:any,i:number)=>`<tr><td><span class="rank-badge ${i===0?'gold':i===1?'silver':i===2?'bronze':''}">#${s.rank||i+1}</span></td><td>${s.roll_number}</td><td style="font-weight:600">${s.student_name}</td><td><span class="grade-chip ${s.grade}">${s.grade}</span></td><td><span class="score-chip high">${s.aggregate_score.toFixed(1)}%</span></td><td>${s.percentile}th</td></tr>`).join('')}</tbody></table></div>
${reportData.questionAnalysis&&reportData.questionAnalysis.length>0?`<div class="section"><div class="section-title"><span>Question-wise Analysis</span><span class="exam-badge">${reportData.examName}</span></div><table><thead><tr><th>Question</th><th>Avg Score</th><th>Students</th><th>Attempts</th><th>Difficulty</th></tr></thead><tbody>${reportData.questionAnalysis.map((q:any)=>`<tr><td style="font-weight:600">Q${q.question_id}</td><td><span class="score-chip ${q.avg_best_score>=70?'high':q.avg_best_score>=50?'medium':'low'}">${q.avg_best_score.toFixed(1)}%</span></td><td>${q.unique_students}</td><td>${q.total_attempts}</td><td><span class="grade-chip ${q.difficulty_rating==='Easy'?'A':q.difficulty_rating==='Medium'?'C':'F'}">${q.difficulty_rating}</span></td></tr>`).join('')}</tbody></table></div>`:''}
<div class="section"><div class="section-title"><span>Student Performance</span><span class="exam-badge">${reportData.examName}</span></div><table><thead><tr><th>Rank</th><th>Roll No</th><th>Name</th><th>Dept</th><th>Year</th><th>Grade</th><th>Score</th><th>Status</th></tr></thead><tbody>${reportData.studentStats.sort((a:any,b:any)=>b.aggregate_score-a.aggregate_score).map((s:any,i:number)=>`<tr><td><span class="rank-badge ${i===0?'gold':i===1?'silver':i===2?'bronze':''}">#${s.rank}</span></td><td>${s.roll_number}</td><td style="font-weight:${i<3?600:400}">${s.student_name}</td><td>${s.department}</td><td>${s.year}</td><td><span class="grade-chip ${s.grade}">${s.grade}</span></td><td><span class="score-chip ${s.aggregate_score>=70?'high':s.aggregate_score>=50?'medium':'low'}">${s.aggregate_score.toFixed(1)}%</span></td><td><span class="status-chip ${s.passed?'pass':'fail'}">${s.passed?'Pass':'Fail'}</span></td></tr>`).join('')}</tbody></table></div>
`
		}
		
		// === STUDENT REPORT ===
		else if (reportData.reportType === 'student') {
			htmlContent += `
<div class="section"><div class="section-title"><span>Overall Statistics</span>${reportData.selectedExamsInfo ? `<span class="exam-badge">${reportData.selectedExamsInfo}</span>` : ''}</div><div class="stats-grid">
<div class="stat-card"><div class="stat-label">Total Exams</div><div class="stat-value">${reportData.totalExams}</div></div>
<div class="stat-card pass"><div class="stat-label">Passed</div><div class="stat-value">${reportData.passedExams}</div></div>
<div class="stat-card fail"><div class="stat-label">Failed</div><div class="stat-value">${reportData.failedExams}</div></div>
<div class="stat-card mean"><div class="stat-label">Avg Score</div><div class="stat-value">${reportData.averageScore.toFixed(1)}%</div></div>
<div class="stat-card"><div class="stat-label">Pass Rate</div><div class="stat-value">${reportData.passRate.toFixed(1)}%</div></div>
</div></div>
<div class="section"><div class="section-title"><span>Exam-wise Performance</span>${reportData.selectedExamsInfo ? `<span class="exam-badge">${reportData.selectedExamsInfo}</span>` : ''}</div><table><thead><tr><th>Exam</th><th>Date</th><th>Score</th><th>Grade</th><th>Status</th></tr></thead><tbody>${(reportData.examStats || []).map((exam:any)=>`<tr><td style="font-weight:600">${exam.exam_name}</td><td>${new Date(exam.submitted_at).toLocaleDateString()}</td><td><span class="score-chip ${exam.score>=70?'high':exam.score>=50?'medium':'low'}">${exam.score.toFixed(1)}%</span></td><td><span class="grade-chip ${exam.grade}">${exam.grade}</span></td><td><span class="status-chip ${exam.passed?'pass':'fail'}">${exam.passed?'Pass':'Fail'}</span></td></tr>`).join('')}</tbody></table></div>
`
		}
		
		// === SECTION REPORT ===
		else if (reportData.reportType === 'section') {
			htmlContent += `
<div class="section"><div class="section-title"><span>Overall Statistics</span>${reportData.selectedExamsInfo ? `<span class="exam-badge">${reportData.selectedExamsInfo}</span>` : ''}</div><div class="stats-grid">
<div class="stat-card"><div class="stat-label">Total Students</div><div class="stat-value">${reportData.totalStudents}</div></div>
<div class="stat-card pass"><div class="stat-label">Passed</div><div class="stat-value">${reportData.passedStudents}</div><div class="stat-extra">${reportData.passRate.toFixed(1)}%</div></div>
<div class="stat-card fail"><div class="stat-label">Failed</div><div class="stat-value">${reportData.failedStudents}</div><div class="stat-extra">${(100-reportData.passRate).toFixed(1)}%</div></div>
<div class="stat-card mean"><div class="stat-label">Avg Score</div><div class="stat-value">${reportData.averageScore.toFixed(1)}%</div></div>
<div class="stat-card median"><div class="stat-label">Median</div><div class="stat-value">${reportData.median.toFixed(1)}%</div></div>
</div></div>
<div class="section"><div class="section-title"><span>Student Performance</span>${reportData.selectedExamsInfo ? `<span class="exam-badge">${reportData.selectedExamsInfo}</span>` : ''}</div><table><thead><tr><th>Rank</th><th>Roll No</th><th>Name</th><th>Grade</th><th>Score</th><th>Status</th></tr></thead><tbody>${(reportData.studentStats || []).sort((a:any,b:any)=>b.aggregate_score-a.aggregate_score).map((s:any,i:number)=>`<tr><td><span class="rank-badge ${i===0?'gold':i===1?'silver':i===2?'bronze':''}">#${i+1}</span></td><td>${s.roll_number}</td><td style="font-weight:${i<3?600:400}">${s.student_name}</td><td><span class="grade-chip ${s.grade}">${s.grade}</span></td><td><span class="score-chip ${s.aggregate_score>=70?'high':s.aggregate_score>=50?'medium':'low'}">${s.aggregate_score.toFixed(1)}%</span></td><td><span class="status-chip ${s.passed?'pass':'fail'}">${s.passed?'Pass':'Fail'}</span></td></tr>`).join('')}</tbody></table></div>
`
		}
		
		// === DEPARTMENT-YEAR REPORT ===
		else if (reportData.reportType === 'department-year') {
			htmlContent += `
<div class="section"><div class="section-title"><span>Overall Statistics</span>${reportData.selectedExamsInfo ? `<span class="exam-badge">${reportData.selectedExamsInfo}</span>` : ''}</div><div class="stats-grid">
<div class="stat-card"><div class="stat-label">Total Sections</div><div class="stat-value">${reportData.totalSections}</div></div>
<div class="stat-card"><div class="stat-label">Total Students</div><div class="stat-value">${reportData.totalStudents}</div></div>
<div class="stat-card pass"><div class="stat-label">Passed</div><div class="stat-value">${reportData.passedStudents}</div><div class="stat-extra">${reportData.passRate.toFixed(1)}%</div></div>
<div class="stat-card fail"><div class="stat-label">Failed</div><div class="stat-value">${reportData.failedStudents}</div><div class="stat-extra">${(100-reportData.passRate).toFixed(1)}%</div></div>
<div class="stat-card mean"><div class="stat-label">Avg Score</div><div class="stat-value">${reportData.averageScore.toFixed(1)}%</div></div>
</div></div>
<div class="section"><div class="section-title"><span>Section-wise Comparison</span>${reportData.selectedExamsInfo ? `<span class="exam-badge">${reportData.selectedExamsInfo}</span>` : ''}</div><table><thead><tr><th>Rank</th><th>Section</th><th>Students</th><th>Avg Score</th><th>Pass Rate</th><th>Passed</th><th>Failed</th></tr></thead><tbody>${(reportData.sectionStats || []).sort((a:any,b:any)=>b.averageScore-a.averageScore).map((sec:any,i:number)=>`<tr><td><span class="rank-badge ${i===0?'gold':i===1?'silver':i===2?'bronze':''}">#${i+1}</span></td><td style="font-weight:600">${sec.section_name}</td><td>${sec.totalStudents}</td><td><span class="score-chip ${sec.averageScore>=70?'high':sec.averageScore>=50?'medium':'low'}">${sec.averageScore.toFixed(1)}%</span></td><td>${sec.passRate.toFixed(1)}%</td><td><span class="status-chip pass">${sec.passedStudents}</span></td><td><span class="status-chip fail">${sec.failedStudents}</span></td></tr>`).join('')}</tbody></table></div>
`
		}

		htmlContent += `
<div class="footer"><p><strong>LabSense - Performance Analytics</strong></p><p>Generated: ${new Date().toISOString()}</p></div>
</div><script>window.onload=()=>setTimeout(()=>window.print(),500);window.onafterprint=()=>window.close();</script></body></html>`

		printWindow.document.write(htmlContent)
		printWindow.document.close()
	}

	return (
		<Box>
			<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
				<BarChartIcon sx={{ fontSize: '1.5rem', color: 'text.primary' }} />
				<Typography variant="h6">Performance Reports & Analytics</Typography>
			</Box>
			
			{error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

			{/* Report Type Selector */}
			<Paper sx={{ p: 3, mb: 3 }}>
				<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
					<AssignmentIcon sx={{ fontSize: '1.25rem', color: 'text.primary' }} />
					<Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Select Report Type</Typography>
				</Box>
				<ToggleButtonGroup
					value={reportType}
					exclusive
					onChange={(e, newType) => {
						if (newType) {
							setReportType(newType)
							setReportData(null)
							setSelectedExam('')
							setSelectedExams([])
							setSelectedStudent('')
							setSelectedDepartment('')
							setSelectedYear('')
							setSelectedSection('')
						}
					}}
					sx={{ mb: 3 }}
				>
					<ToggleButton value="exam" sx={{ px: 3 }}>
						<DescriptionIcon sx={{ fontSize: '1rem', mr: 1 }} />
						Exam-wise Report
					</ToggleButton>
					<ToggleButton value="student" sx={{ px: 3 }}>
						<PersonIcon sx={{ fontSize: '1rem', mr: 1 }} />
						Student Report
					</ToggleButton>
					<ToggleButton value="section" sx={{ px: 3 }}>
						<PeopleIcon sx={{ fontSize: '1rem', mr: 1 }} />
						Section Report
					</ToggleButton>
					<ToggleButton value="department-year" sx={{ px: 3 }}>
						<BusinessIcon sx={{ fontSize: '1rem', mr: 1 }} />
						Department-Year Report
					</ToggleButton>
				</ToggleButtonGroup>

				<Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 3 }}>
					{reportType === 'exam' && <DescriptionIcon sx={{ fontSize: '1rem', color: 'text.secondary', mt: 0.25 }} />}
					{reportType === 'student' && <PersonIcon sx={{ fontSize: '1rem', color: 'text.secondary', mt: 0.25 }} />}
					{reportType === 'section' && <PeopleIcon sx={{ fontSize: '1rem', color: 'text.secondary', mt: 0.25 }} />}
					{reportType === 'department-year' && <BusinessIcon sx={{ fontSize: '1rem', color: 'text.secondary', mt: 0.25 }} />}
					<Typography variant="body2" color="text.secondary">
						{reportType === 'exam' && 'Analyze performance for a specific exam with detailed student-wise breakdown'}
						{reportType === 'student' && 'View a student\'s performance across all exams. Filter by specific exams using the dropdown below the report.'}
						{reportType === 'section' && 'Analyze section performance across all exams. Filter by specific exams using the dropdown below the report.'}
						{reportType === 'department-year' && 'Compare all sections across all exams. Filter by specific exams using the dropdown below the report.'}
					</Typography>
				</Box>

				{/* Dynamic Filters based on Report Type */}
				<Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flexWrap: 'wrap' }}>
					{/* Exam-wise Report */}
					{reportType === 'exam' && (
						<FormControl sx={{ minWidth: 300 }}>
							<InputLabel>Exam</InputLabel>
							<Select
								value={selectedExam}
								onChange={(e) => setSelectedExam(e.target.value)}
								label="Exam"
								sx={{
									bgcolor: isDark ? '#0A0A0A' : 'background.paper'
								}}
							>
								<MenuItem value="">Select an exam</MenuItem>
								{filterOptions.exams?.map((exam: any) => (
									<MenuItem key={exam.id} value={exam.id}>
										{exam.name}
									</MenuItem>
								))}
							</Select>
						</FormControl>
					)}

					{/* Student Report */}
					{reportType === 'student' && (
						<>
							<FormControl sx={{ minWidth: 200 }}>
								<InputLabel>Department</InputLabel>
								<Select
									value={selectedDepartment}
									onChange={(e) => {
										setSelectedDepartment(e.target.value)
										setSelectedStudent('') // Clear student selection when department changes
									}}
									label="Department"
									sx={{
										bgcolor: isDark ? '#0A0A0A' : 'background.paper'
									}}
								>
									<MenuItem value="">All Departments</MenuItem>
									{filterOptions.departments?.map((dept: any) => (
										<MenuItem key={dept.id} value={dept.id}>
											{dept.name}
										</MenuItem>
									))}
								</Select>
							</FormControl>
							<FormControl sx={{ minWidth: 150 }}>
								<InputLabel>Year</InputLabel>
								<Select
									value={selectedYear}
									onChange={(e) => {
										setSelectedYear(e.target.value)
										setSelectedStudent('') // Clear student selection when year changes
									}}
									label="Year"
									sx={{
										bgcolor: isDark ? '#0A0A0A' : 'background.paper'
									}}
								>
									<MenuItem value="">All Years</MenuItem>
									{filterOptions.years?.map((year: any) => (
										<MenuItem key={year.id} value={year.name}>
											Year {year.name}
										</MenuItem>
									))}
								</Select>
							</FormControl>
							<FormControl sx={{ minWidth: 200 }}>
								<InputLabel>Section</InputLabel>
								<Select
									value={selectedSection}
									onChange={(e) => {
										setSelectedSection(e.target.value)
										setSelectedStudent('') // Clear student selection when section changes
									}}
									label="Section"
									sx={{
										bgcolor: isDark ? '#0A0A0A' : 'background.paper'
									}}
								>
									<MenuItem value="">All Sections</MenuItem>
									{filterOptions.sections?.map((section: any) => (
										<MenuItem key={section.id} value={section.id}>
											{section.name}
										</MenuItem>
									))}
								</Select>
							</FormControl>
							<FormControl sx={{ minWidth: 400 }}>
								<InputLabel>Student</InputLabel>
								<Select
									value={selectedStudent}
									onChange={(e) => setSelectedStudent(e.target.value)}
									label="Student"
									sx={{
										bgcolor: isDark ? '#0A0A0A' : 'background.paper'
									}}
								>
									<MenuItem value="">Select a student</MenuItem>
									{filteredStudentsForReport.map((student: any) => (
										<MenuItem key={student.comboKey} value={student.comboKey}>
											{student.roll_number} - {student.name} | {student.department_name}, Year {student.year}, Section {student.section_name}
										</MenuItem>
									))}
								</Select>
							</FormControl>
						</>
					)}

					{/* Section Report */}
					{reportType === 'section' && (
						<>
							<FormControl sx={{ minWidth: 200 }}>
								<InputLabel>Department</InputLabel>
								<Select
									value={selectedDepartment}
									onChange={(e) => setSelectedDepartment(e.target.value)}
									label="Department"
									sx={{
										bgcolor: isDark ? '#0A0A0A' : 'background.paper'
									}}
								>
									<MenuItem value="">Select department</MenuItem>
									{filterOptions.departments?.map((dept: any) => (
										<MenuItem key={dept.id} value={dept.id}>
											{dept.name}
										</MenuItem>
									))}
								</Select>
							</FormControl>
							<FormControl sx={{ minWidth: 150 }}>
								<InputLabel>Year</InputLabel>
								<Select
									value={selectedYear}
									onChange={(e) => setSelectedYear(e.target.value)}
									label="Year"
									sx={{
										bgcolor: isDark ? '#0A0A0A' : 'background.paper'
									}}
								>
									<MenuItem value="">Select year</MenuItem>
									{filterOptions.years?.map((year: any) => (
										<MenuItem key={year.id} value={year.name}>
											Year {year.name}
										</MenuItem>
									))}
								</Select>
							</FormControl>
							<FormControl sx={{ minWidth: 200 }}>
								<InputLabel>Section</InputLabel>
								<Select
									value={selectedSection}
									onChange={(e) => setSelectedSection(e.target.value)}
									label="Section"
									sx={{
										bgcolor: isDark ? '#0A0A0A' : 'background.paper'
									}}
								>
									<MenuItem value="">Select section</MenuItem>
									{filterOptions.sections?.map((section: any) => (
										<MenuItem key={section.id} value={section.id}>
											{section.name}
										</MenuItem>
									))}
								</Select>
							</FormControl>
						</>
					)}

					{/* Department-Year Report */}
					{reportType === 'department-year' && (
						<>
							<FormControl sx={{ minWidth: 250 }}>
								<InputLabel>Department</InputLabel>
								<Select
									value={selectedDepartment}
									onChange={(e) => setSelectedDepartment(e.target.value)}
									label="Department"
									sx={{
										bgcolor: isDark ? '#0A0A0A' : 'background.paper'
									}}
								>
									<MenuItem value="">Select department</MenuItem>
									{filterOptions.departments?.map((dept: any) => (
										<MenuItem key={dept.id} value={dept.id}>
											{dept.name}
										</MenuItem>
									))}
								</Select>
							</FormControl>
							<FormControl sx={{ minWidth: 200 }}>
								<InputLabel>Year</InputLabel>
								<Select
									value={selectedYear}
									onChange={(e) => setSelectedYear(e.target.value)}
									label="Year"
									sx={{
										bgcolor: isDark ? '#0A0A0A' : 'background.paper'
									}}
								>
									<MenuItem value="">Select year</MenuItem>
									{filterOptions.years?.map((year: any) => (
										<MenuItem key={year.id} value={year.name}>
											Year {year.name}
										</MenuItem>
									))}
								</Select>
							</FormControl>
						</>
					)}
					<Button 
						variant="contained" 
						onClick={generateReport}
						disabled={
							generatingReport || 
							(reportType === 'exam' && !selectedExam) ||
							(reportType === 'student' && !selectedStudent) ||
							(reportType === 'section' && (!selectedDepartment || !selectedYear || !selectedSection)) ||
							(reportType === 'department-year' && (!selectedDepartment || !selectedYear))
						}
						startIcon={generatingReport ? <CircularProgress size={20} /> : <AssessmentIcon />}
						sx={{ height: 56 }}
					>
						{generatingReport ? 'Generating...' : 'Generate Report'}
					</Button>
					{reportData && (
						<ButtonGroup variant="outlined" sx={{ height: 56 }}>
							<Button 
								onClick={downloadPDF}
								startIcon={<PictureAsPdfIcon />}
								sx={{ 
									px: 3,
									background: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
									color: 'white',
									'&:hover': {
										background: 'linear-gradient(135deg, #d32f2f 0%, #c62828 100%)',
										color: 'white'
									}
								}}
							>
								Visual PDF
							</Button>
							<Button 
								onClick={downloadCSV}
								startIcon={<TableViewIcon />}
								sx={{ 
									px: 3,
									background: 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)',
									color: 'white',
									'&:hover': {
										background: 'linear-gradient(135deg, #388e3c 0%, #2e7d32 100%)',
										color: 'white'
									}
								}}
							>
								Statistical CSV
							</Button>
						</ButtonGroup>
					)}
				</Box>
			</Paper>

			{/* Report Display */}
			{reportData && (
				<Box>
					{/* Report Header with Type Badge */}
					<Paper sx={{ p: 3, mb: 3, bgcolor: isDark ? '#0F0F0F' : '#F5F3FF', borderLeft: '6px solid', borderColor: isDark ? '#A855F7' : '#9333EA', boxShadow: 2 }}>
						<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
							{reportData.reportType === 'exam' && <DescriptionIcon sx={{ fontSize: '1.5rem', color: isDark ? '#A855F7' : '#9333EA' }} />}
							{reportData.reportType === 'student' && <PersonIcon sx={{ fontSize: '1.5rem', color: isDark ? '#A855F7' : '#9333EA' }} />}
							{reportData.reportType === 'section' && <PeopleIcon sx={{ fontSize: '1.5rem', color: isDark ? '#A855F7' : '#9333EA' }} />}
							{reportData.reportType === 'department-year' && <BusinessIcon sx={{ fontSize: '1.5rem', color: isDark ? '#A855F7' : '#9333EA' }} />}
							<Typography variant="h5" sx={{ fontWeight: 700, color: isDark ? '#A855F7' : '#9333EA' }}>
								{reportData.reportType === 'exam' && `Exam Report`}
								{reportData.reportType === 'student' && `Student Performance Report`}
								{reportData.reportType === 'section' && `Section Performance Report`}
								{reportData.reportType === 'department-year' && `Department-Year Performance Report`}
							</Typography>
						</Box>
						
						{/* Exam Name - Prominently displayed for ALL report types */}
						{reportData.reportType === 'exam' && (
							<Box sx={{ mt: 2, p: 2, bgcolor: isDark ? '#1F1F1F' : '#FFFBEB', borderRadius: 2, border: '2px solid', borderColor: isDark ? '#F59E0B' : '#FBBF24' }}>
								<Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
									Exam Name
								</Typography>
								<Typography variant="h4" sx={{ fontWeight: 700, color: isDark ? '#F59E0B' : '#D97706', mt: 0.5 }}>
									{reportData.examName}
								</Typography>
							</Box>
						)}
						
						{reportData.reportType === 'student' && (
							<Box>
								<Typography variant="subtitle1" color="text.secondary" sx={{ mt: 1 }}>
									{reportData.student_name} ({reportData.roll_number})
								</Typography>
								<Typography variant="body2" color="text.secondary">
									{reportData.department} • Year {reportData.year} • Section {reportData.section}
								</Typography>
								{reportData.selectedExamsInfo && (
									<Box sx={{ mt: 2, p: 2, bgcolor: isDark ? '#1F1F1F' : '#FFFBEB', borderRadius: 2, border: '2px solid', borderColor: isDark ? '#F59E0B' : '#FBBF24' }}>
										<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
											<AssignmentIcon sx={{ fontSize: '0.875rem', color: 'text.secondary' }} />
											<Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
												Exams Analyzed
											</Typography>
										</Box>
										<Typography variant="h6" sx={{ fontWeight: 700, color: 'warning.dark', mt: 0.5 }}>
											{reportData.selectedExamsInfo}
										</Typography>
									</Box>
								)}
							</Box>
						)}
						
						{reportData.reportType === 'section' && (
							<Box>
								<Typography variant="subtitle1" color="text.secondary" sx={{ mt: 1 }}>
									{reportData.department_name} - Year {reportData.year} - Section {reportData.section_name}
								</Typography>
								{reportData.selectedExamsInfo && (
									<Box sx={{ mt: 2, p: 2, bgcolor: isDark ? '#1F1F1F' : '#FFFBEB', borderRadius: 2, border: '2px solid', borderColor: isDark ? '#F59E0B' : '#FBBF24' }}>
										<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
											<AssignmentIcon sx={{ fontSize: '0.875rem', color: 'text.secondary' }} />
											<Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
												Exams Analyzed
											</Typography>
										</Box>
										<Typography variant="h6" sx={{ fontWeight: 700, color: 'warning.dark', mt: 0.5 }}>
											{reportData.selectedExamsInfo}
										</Typography>
									</Box>
								)}
							</Box>
						)}
						
						{reportData.reportType === 'department-year' && (
							<Box>
								<Typography variant="subtitle1" color="text.secondary" sx={{ mt: 1 }}>
									{reportData.department_name} - Year {reportData.year}
								</Typography>
								{reportData.selectedExamsInfo && (
									<Box sx={{ mt: 2, p: 2, bgcolor: isDark ? '#1F1F1F' : '#FFFBEB', borderRadius: 2, border: '2px solid', borderColor: isDark ? '#F59E0B' : '#FBBF24' }}>
										<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
											<AssignmentIcon sx={{ fontSize: '0.875rem', color: 'text.secondary' }} />
											<Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
												Exams Analyzed
											</Typography>
										</Box>
										<Typography variant="h6" sx={{ fontWeight: 700, color: 'warning.dark', mt: 0.5 }}>
											{reportData.selectedExamsInfo}
										</Typography>
									</Box>
								)}
							</Box>
						)}
					</Paper>

					{/* Exam Filter - Only for non-exam reports */}
					{reportData.reportType !== 'exam' && (
						<Paper sx={{ p: 2, mb: 3, bgcolor: isDark ? '#0F0F0F' : '#F8FAFC', border: '1px solid', borderColor: isDark ? '#F59E0B' : '#FBBF24' }}>
							<Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
								<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
									<AnalyticsIcon sx={{ fontSize: '1.125rem', color: isDark ? '#F59E0B' : '#F59E0B' }} />
									<Typography variant="subtitle2" sx={{ fontWeight: 600, color: isDark ? '#F59E0B' : '#F59E0B' }}>
										Refine Report:
									</Typography>
								</Box>
								<FormControl sx={{ minWidth: 300, bgcolor: isDark ? '#0A0A0A' : 'background.paper', borderRadius: 1 }}>
									<Select
										multiple
										value={selectedExams}
										onChange={(e) => setSelectedExams(e.target.value as string[])}
										size="small"
										renderValue={(selected) => {
											if (selected.length === 0) {
												return <span style={{ color: '#999', fontStyle: 'italic' }}>All Exams (Showing All Data)</span>
											}
											if (selected.length === 1) {
												const filteredExams = getFilteredExams()
												const exam = filteredExams?.find((ex: any) => ex.id === selected[0])
												return exam?.name || 'Selected'
											}
											return `${selected.length} exam${selected.length > 1 ? 's' : ''} selected`
										}}
										displayEmpty
									>
										{(() => {
											const filteredExams = getFilteredExams()
											return filteredExams && filteredExams.length > 0 ? (
												filteredExams.map((exam: any) => (
													<MenuItem key={exam.id} value={exam.id}>
														<Checkbox checked={selectedExams.includes(exam.id)} size="small" />
														<ListItemText primary={exam.name} />
													</MenuItem>
												))
											) : (
												<MenuItem disabled>
													<em>No exams with submissions for selected demographics</em>
												</MenuItem>
											)
										})()}
									</Select>
								</FormControl>
								<Button
									variant="contained"
									color="primary"
									onClick={generateReport}
									disabled={generatingReport}
									size="medium"
									sx={{ 
										px: 3,
										fontWeight: 600,
										boxShadow: 2,
										'&:hover': { boxShadow: 4 }
									}}
								>
									{generatingReport ? <CircularProgress size={20} sx={{ mr: 1 }} /> : <BarChartIcon sx={{ fontSize: '1rem', mr: 1 }} />}
									{generatingReport ? 'Updating...' : 'Update Report'}
								</Button>
								<Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', flexBasis: '100%' }}>
									Select one or more exams to focus the analysis, or leave empty to see all exam data. Click "Update Report" to apply changes.
								</Typography>
							</Box>
						</Paper>
					)}

					{/* Exam-wise Report Display */}
					{reportData.reportType === 'exam' && (
						<Box>
							{/* Overall Statistics */}
							<Paper sx={{ p: 3, mb: 3 }}>
								<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
									<Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
										<AssessmentIcon color="primary" />
										Overall Statistics
									</Typography>
									<Chip 
										label={reportData.examName} 
										color="warning" 
										sx={{ fontWeight: 600, fontSize: '0.875rem' }}
									/>
								</Box>
						<Grid container spacing={2} sx={{ mt: 1 }}>
							<Grid item xs={6} md={2.4}>
								<Card variant="outlined">
									<CardContent sx={{ textAlign: 'center' }}>
										<Typography color="text.secondary" gutterBottom variant="caption">Total Students</Typography>
										<Typography variant="h4">{reportData.totalStudents}</Typography>
									</CardContent>
								</Card>
							</Grid>
							<Grid item xs={6} md={2.4}>
								<Card variant="outlined" sx={{ bgcolor: isDark ? '#064E3B' : '#F0FDF4' }}>
									<CardContent sx={{ textAlign: 'center' }}>
										<Typography color="text.secondary" gutterBottom variant="caption">Passed</Typography>
										<Typography variant="h4" sx={{ color: isDark ? '#34D399' : '#047857' }}>{reportData.passedStudents}</Typography>
										<Typography variant="caption" color="success.main">{reportData.passRate.toFixed(1)}%</Typography>
									</CardContent>
								</Card>
							</Grid>
							<Grid item xs={6} md={2.4}>
								<Card variant="outlined" sx={{ bgcolor: isDark ? '#7F1D1D' : '#FEF2F2' }}>
									<CardContent sx={{ textAlign: 'center' }}>
										<Typography color="text.secondary" gutterBottom variant="caption">Failed</Typography>
										<Typography variant="h4" sx={{ color: isDark ? '#FCA5A5' : '#DC2626' }}>{reportData.failedStudents}</Typography>
										<Typography variant="caption" color="error.main">{(100 - reportData.passRate).toFixed(1)}%</Typography>
									</CardContent>
								</Card>
							</Grid>
							<Grid item xs={6} md={2.4}>
								<Card variant="outlined" sx={{ bgcolor: isDark ? '#1F1F1F' : '#F5F3FF' }}>
									<CardContent sx={{ textAlign: 'center' }}>
										<Typography color="text.secondary" gutterBottom variant="caption">Mean Score</Typography>
										<Typography variant="h4" sx={{ color: isDark ? '#A855F7' : '#9333EA' }}>{reportData.averageScore.toFixed(1)}%</Typography>
									</CardContent>
								</Card>
							</Grid>
							<Grid item xs={6} md={2.4}>
								<Card variant="outlined" sx={{ bgcolor: isDark ? '#1F1F1F' : '#F0F9FF' }}>
									<CardContent sx={{ textAlign: 'center' }}>
										<Typography color="text.secondary" gutterBottom variant="caption">Median Score</Typography>
										<Typography variant="h4" sx={{ color: isDark ? '#F59E0B' : '#F59E0B' }}>{reportData.median.toFixed(1)}%</Typography>
									</CardContent>
								</Card>
							</Grid>
						</Grid>
						<Box sx={{ mt: 2 }}>
							<Typography variant="body2" color="text.secondary">
								Standard Deviation: <strong>{reportData.stdDeviation.toFixed(2)}%</strong> 
								{reportData.stdDeviation < 10 ? ' (Very consistent performance)' : 
								 reportData.stdDeviation < 15 ? ' (Consistent performance)' : 
								 reportData.stdDeviation < 20 ? ' (Moderate variation)' : 
								 ' (High variation in performance)'}
							</Typography>
						</Box>
					</Paper>

					{/* Pass/Fail Pie Chart Visual */}
					<Grid container spacing={3} sx={{ mb: 3 }}>
						<Grid item xs={12} md={6}>
							<Paper sx={{ p: 3 }}>
								<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
									<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
										<TrendingUpIcon sx={{ fontSize: '1.25rem', color: 'text.primary' }} />
										<Typography variant="h6">Pass/Fail Ratio</Typography>
									</Box>
									<Chip label={reportData.examName} size="small" color="warning" sx={{ fontWeight: 600 }} />
								</Box>
								<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 3 }}>
									<Box sx={{ position: 'relative', width: 200, height: 200 }}>
										{/* Simple SVG Pie Chart */}
										<svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
											{/* Background circle */}
											<circle cx="50" cy="50" r="40" fill="none" stroke="#f5f5f5" strokeWidth="20" />
											{/* Pass segment */}
											<circle 
												cx="50" 
												cy="50" 
												r="40" 
												fill="none" 
												stroke="#4caf50" 
												strokeWidth="20"
												strokeDasharray={`${(reportData.passRate / 100) * 251.2} 251.2`}
												strokeLinecap="round"
											/>
											{/* Fail segment */}
											<circle 
												cx="50" 
												cy="50" 
												r="40" 
												fill="none" 
												stroke="#f44336" 
												strokeWidth="20"
												strokeDasharray={`${((100 - reportData.passRate) / 100) * 251.2} 251.2`}
												strokeDashoffset={`-${(reportData.passRate / 100) * 251.2}`}
												strokeLinecap="round"
											/>
										</svg>
										<Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
											<Typography variant="h4" sx={{ fontWeight: 700 }}>{reportData.passRate.toFixed(0)}%</Typography>
											<Typography variant="caption" color="text.secondary">Pass Rate</Typography>
										</Box>
									</Box>
								</Box>
								<Grid container spacing={2} sx={{ mt: 1 }}>
									<Grid item xs={6}>
										<Box sx={{ textAlign: 'center', p: 2, bgcolor: isDark ? '#064E3B' : '#F0FDF4', borderRadius: 2, border: '1px solid', borderColor: isDark ? '#10B981' : '#D1FAE5' }}>
											<Typography variant="h5" sx={{ fontWeight: 700, color: isDark ? '#34D399' : '#047857' }}>{reportData.passedStudents}</Typography>
											<Typography variant="body2" sx={{ color: isDark ? '#34D399' : '#047857' }}>Passed</Typography>
										</Box>
									</Grid>
									<Grid item xs={6}>
										<Box sx={{ textAlign: 'center', p: 2, bgcolor: isDark ? '#7F1D1D' : '#FEF2F2', borderRadius: 2, border: '1px solid', borderColor: isDark ? '#DC2626' : '#FECACA' }}>
											<Typography variant="h5" sx={{ fontWeight: 700, color: isDark ? '#FCA5A5' : '#DC2626' }}>{reportData.failedStudents}</Typography>
											<Typography variant="body2" sx={{ color: isDark ? '#FCA5A5' : '#DC2626' }}>Failed</Typography>
										</Box>
									</Grid>
								</Grid>
							</Paper>
						</Grid>

						{/* Grade Distribution */}
						<Grid item xs={12} md={6}>
							<Paper sx={{ p: 3 }}>
								<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
									<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
										<WorkspacePremiumIcon sx={{ fontSize: '1.25rem', color: 'text.primary' }} />
										<Typography variant="h6">Grade Distribution</Typography>
									</Box>
									<Chip label={reportData.examName} size="small" color="warning" sx={{ fontWeight: 600 }} />
								</Box>
								<Box sx={{ mt: 2 }}>
									{Object.entries(reportData.gradeDistribution).map(([grade, count]: [string, any]) => {
										const percentage = reportData.totalStudents > 0 ? (count / reportData.totalStudents) * 100 : 0
										const gradeLetter = grade.charAt(0)
										const gradeColor = 
											gradeLetter === 'A' ? '#4caf50' :
											gradeLetter === 'B' ? '#2196f3' :
											gradeLetter === 'C' ? '#ff9800' :
											gradeLetter === 'D' ? '#ff5722' :
											gradeLetter === 'E' ? '#ff5722' : '#f44336'
										
										return (
											<Box key={grade} sx={{ mb: 1.5 }}>
												<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
													<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
														<Chip 
															label={gradeLetter} 
															size="small" 
															sx={{ 
																bgcolor: gradeColor, 
																color: 'white', 
																fontWeight: 700,
																minWidth: 32 
															}} 
														/>
														<Typography variant="body2">{grade.split('(')[1]?.replace(')', '')}</Typography>
													</Box>
													<Typography variant="body2" sx={{ fontWeight: 600 }}>{count} ({percentage.toFixed(1)}%)</Typography>
												</Box>
												<Box sx={{ height: 8, bgcolor: isDark ? '#1F1F1F' : 'action.hover', borderRadius: 1, overflow: 'hidden' }}>
													<Box 
														sx={{ 
															height: '100%', 
															width: `${percentage}%`, 
															bgcolor: gradeColor,
															transition: 'width 0.5s ease'
														}} 
													/>
												</Box>
											</Box>
										)
									})}
								</Box>
							</Paper>
						</Grid>
					</Grid>

					{/* Score Distribution with Visual Bars */}
					<Paper sx={{ p: 3, mb: 3 }}>
						<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
							<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
								<BarChartIcon sx={{ fontSize: '1.25rem', color: 'text.primary' }} />
								<Typography variant="h6">Score Distribution</Typography>
							</Box>
							<Chip label={reportData.examName} size="small" color="warning" sx={{ fontWeight: 600 }} />
						</Box>
						<Box sx={{ mt: 2 }}>
							{Object.entries(reportData.scoreDistribution).map(([range, count]: [string, any]) => {
								const percentage = reportData.totalStudents > 0 ? (count / reportData.totalStudents) * 100 : 0
								const color = 
									range === '90-100%' ? 'success' :
									range === '80-89%' ? 'info' :
									range === '70-79%' ? 'primary' :
									range === '60-69%' ? 'warning' :
									range === '50-59%' ? 'warning' : 'error'
								
								return (
									<Box key={range} sx={{ mb: 2 }}>
										<Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
											<Typography variant="body2" sx={{ fontWeight: 600 }}>{range}</Typography>
											<Typography variant="body2" color="text.secondary">{count} students ({percentage.toFixed(1)}%)</Typography>
										</Box>
										<Box sx={{ position: 'relative', height: 24, bgcolor: isDark ? '#1F1F1F' : 'action.hover', borderRadius: 1, overflow: 'hidden' }}>
											<Box 
												sx={{ 
													position: 'absolute', 
													height: '100%', 
													bgcolor: `${color}.main`,
													width: `${percentage}%`,
													transition: 'width 0.5s ease',
													display: 'flex',
													alignItems: 'center',
													justifyContent: 'center'
												}}
											>
												{count > 0 && (
													<Typography variant="caption" sx={{ color: 'white', fontWeight: 600 }}>
														{count}
													</Typography>
												)}
											</Box>
										</Box>
									</Box>
								)
							})}
						</Box>
					</Paper>

					{/* Top and Bottom Performers */}
					<Grid container spacing={3} sx={{ mb: 3 }}>
						<Grid item xs={12} md={6}>
							<Paper sx={{ p: 3 }}>
								<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
									<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
										<TrophyIcon sx={{ fontSize: '1.25rem', color: 'text.primary' }} />
										<Typography variant="h6">Top 5 Performers</Typography>
									</Box>
									<Chip label={reportData.examName} size="small" color="warning" sx={{ fontWeight: 600 }} />
								</Box>
								<TableContainer sx={{ mt: 2 }}>
									<Table size="small">
										<TableHead>
											<TableRow>
												<TableCell><strong>Rank</strong></TableCell>
												<TableCell><strong>Roll No</strong></TableCell>
												<TableCell><strong>Name</strong></TableCell>
												<TableCell align="right"><strong>Score</strong></TableCell>
											</TableRow>
										</TableHead>
										<TableBody>
											{reportData.topPerformers.map((student: any, index: number) => (
												<TableRow key={index} sx={{ bgcolor: index === 0 ? (isDark ? '#064E3B' : '#F0FDF4') : 'inherit' }}>
													<TableCell>
														<Chip 
															label={index + 1} 
															size="small" 
															color={index === 0 ? 'success' : 'default'}
															sx={{ fontWeight: 600 }}
														/>
													</TableCell>
													<TableCell>{student.roll_number}</TableCell>
													<TableCell>{student.student_name}</TableCell>
													<TableCell align="right">
														<Chip 
															label={`${student.aggregate_score.toFixed(1)}%`}
															size="small"
															color="success"
															sx={{ fontWeight: 600 }}
														/>
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</TableContainer>
							</Paper>
						</Grid>
						<Grid item xs={12} md={6}>
							<Paper sx={{ p: 3 }}>
								<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
									<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
										<TrendingDownIcon sx={{ fontSize: '1.25rem', color: 'text.primary' }} />
										<Typography variant="h6">Bottom 5 Performers</Typography>
									</Box>
									<Chip label={reportData.examName} size="small" color="warning" sx={{ fontWeight: 600 }} />
								</Box>
								<TableContainer sx={{ mt: 2 }}>
									<Table size="small">
										<TableHead>
											<TableRow>
												<TableCell><strong>Rank</strong></TableCell>
												<TableCell><strong>Roll No</strong></TableCell>
												<TableCell><strong>Name</strong></TableCell>
												<TableCell align="right"><strong>Score</strong></TableCell>
											</TableRow>
										</TableHead>
										<TableBody>
											{reportData.bottomPerformers.map((student: any, index: number) => (
												<TableRow key={index}>
													<TableCell>{index + 1}</TableCell>
													<TableCell>{student.roll_number}</TableCell>
													<TableCell>{student.student_name}</TableCell>
													<TableCell align="right">
														<Chip 
															label={`${student.aggregate_score.toFixed(1)}%`}
															size="small"
															color={student.aggregate_score >= 50 ? 'warning' : 'error'}
														/>
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</TableContainer>
							</Paper>
						</Grid>
					</Grid>

					{/* Question-wise Analysis */}
					{reportData.questionAnalysis && reportData.questionAnalysis.length > 0 && (
						<Paper sx={{ p: 3, mb: 3 }}>
							<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
								<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
									<AnalyticsIcon sx={{ fontSize: '1.25rem', color: 'text.primary' }} />
									<Typography variant="h6">Question-wise Performance Analysis</Typography>
								</Box>
								<Chip label={reportData.examName} size="small" color="warning" sx={{ fontWeight: 600 }} />
							</Box>
							<TableContainer sx={{ mt: 2 }}>
								<Table size="small">
									<TableHead>
										<TableRow>
											<TableCell><strong>Question ID</strong></TableCell>
											<TableCell align="right"><strong>Avg Best Score</strong></TableCell>
											<TableCell align="right"><strong>Students Attempted</strong></TableCell>
											<TableCell align="right"><strong>Total Attempts</strong></TableCell>
											<TableCell align="center"><strong>Difficulty</strong></TableCell>
											<TableCell align="right"><strong>Performance</strong></TableCell>
										</TableRow>
									</TableHead>
									<TableBody>
										{reportData.questionAnalysis.map((q: any, index: number) => (
											<TableRow key={index}>
												<TableCell>
													<Chip 
														label={`Q${q.question_id}`} 
														size="small" 
														variant="outlined"
														sx={{ fontWeight: 600 }}
													/>
												</TableCell>
												<TableCell align="right">
													<Chip 
														label={`${q.avg_best_score.toFixed(1)}%`}
														size="small"
														color={q.avg_best_score >= 70 ? 'success' : q.avg_best_score >= 50 ? 'warning' : 'error'}
													/>
												</TableCell>
												<TableCell align="right">{q.unique_students}</TableCell>
												<TableCell align="right">{q.total_attempts}</TableCell>
												<TableCell align="center">
													<Chip 
														label={q.difficulty_rating}
														size="small"
														color={
															q.difficulty_rating === 'Easy' ? 'success' :
															q.difficulty_rating === 'Medium' ? 'warning' : 'error'
														}
														variant="outlined"
													/>
												</TableCell>
												<TableCell align="right">
													<Box sx={{ width: 100 }}>
														<Box sx={{ position: 'relative', height: 8, bgcolor: isDark ? '#2F2F2F' : 'action.hover', borderRadius: 1 }}>
															<Box 
																sx={{ 
																	position: 'absolute',
																	height: '100%',
																	width: `${q.avg_best_score}%`,
																	bgcolor: q.avg_best_score >= 70 ? 'success.main' : q.avg_best_score >= 50 ? 'warning.main' : 'error.main',
																	borderRadius: 1
																}}
															/>
														</Box>
													</Box>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</TableContainer>
							<Box sx={{ mt: 2, p: 2, bgcolor: isDark ? '#1F1F1F' : '#F0F9FF', borderRadius: 1, border: '1px solid', borderColor: isDark ? '#F59E0B' : '#FBBF24' }}>
								<Typography variant="body2" sx={{ color: isDark ? '#F59E0B' : '#F59E0B' }}>
									<strong>💡 Insight:</strong> Questions are ranked by average best score. 
									{reportData.questionAnalysis[reportData.questionAnalysis.length - 1] && 
										` The most challenging question was Q${reportData.questionAnalysis[reportData.questionAnalysis.length - 1].question_id} 
										with an average score of ${reportData.questionAnalysis[reportData.questionAnalysis.length - 1].avg_best_score.toFixed(1)}%.`
									}
								</Typography>
							</Box>
						</Paper>
					)}

					{/* Student-wise Details with Enhanced Visuals */}
					<Paper sx={{ p: 3 }}>
						<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
							<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
								<PeopleIcon sx={{ fontSize: '1.25rem', color: 'text.primary' }} />
								<Typography variant="h6">Complete Student Performance Analysis</Typography>
							</Box>
							<Chip label={reportData.examName} size="small" color="warning" sx={{ fontWeight: 600 }} />
						</Box>
						<TableContainer sx={{ mt: 2, maxHeight: 600 }}>
							<Table size="small" stickyHeader>
								<TableHead>
									<TableRow sx={{ '& th': { bgcolor: isDark ? '#1F1F1F' : '#A855F7', color: '#FFFFFF', fontWeight: 700 } }}>
										<TableCell><strong>Rank</strong></TableCell>
										<TableCell><strong>Roll No</strong></TableCell>
										<TableCell><strong>Name</strong></TableCell>
										<TableCell><strong>Department</strong></TableCell>
										<TableCell><strong>Section</strong></TableCell>
										<TableCell><strong>Year</strong></TableCell>
										<TableCell align="center"><strong>Grade</strong></TableCell>
										<TableCell align="right"><strong>Score</strong></TableCell>
										<TableCell align="center"><strong>vs Avg</strong></TableCell>
										<TableCell align="right"><strong>Percentile</strong></TableCell>
										<TableCell align="center"><strong>Status</strong></TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{reportData.studentStats
										.sort((a: any, b: any) => b.aggregate_score - a.aggregate_score)
										.map((student: any, index: number) => {
											const isTop3 = index < 3
											const rowBgColor = 
												index === 0 ? 'rgba(255, 215, 0, 0.1)' : // Gold for 1st
												index === 1 ? 'rgba(192, 192, 192, 0.1)' : // Silver for 2nd
												index === 2 ? 'rgba(205, 127, 50, 0.1)' : // Bronze for 3rd
												student.aggregate_score >= 90 ? 'rgba(76, 175, 80, 0.05)' :
												student.aggregate_score >= 70 ? 'rgba(33, 150, 243, 0.05)' :
												student.aggregate_score >= 50 ? 'rgba(255, 152, 0, 0.05)' :
												'rgba(244, 67, 54, 0.05)'
											
											return (
												<TableRow 
													key={index}
													sx={{ 
														bgcolor: rowBgColor,
														'&:hover': { bgcolor: 'action.hover' }
													}}
												>
													<TableCell>
														<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
															{isTop3 && (
																index === 0 ? <EmojiEventsIcon sx={{ color: '#FFD700', fontSize: 20 }} /> :
																index === 1 ? <EmojiEventsIcon sx={{ color: '#C0C0C0', fontSize: 20 }} /> :
																<EmojiEventsIcon sx={{ color: '#CD7F32', fontSize: 20 }} />
															)}
															<Typography variant="body2" sx={{ fontWeight: isTop3 ? 700 : 400 }}>
																#{student.rank}
															</Typography>
														</Box>
													</TableCell>
													<TableCell>{student.roll_number}</TableCell>
													<TableCell>
														<Typography variant="body2" sx={{ fontWeight: isTop3 ? 600 : 400 }}>
															{student.student_name}
														</Typography>
													</TableCell>
													<TableCell><Typography variant="caption">{student.department}</Typography></TableCell>
													<TableCell><Typography variant="caption">{student.section}</Typography></TableCell>
													<TableCell><Typography variant="caption">{student.year}</Typography></TableCell>
													<TableCell align="center">
														<Chip 
															label={student.grade}
															size="small"
															sx={{
																bgcolor: 
																	student.grade === 'A' ? '#4caf50' :
																	student.grade === 'B' ? '#2196f3' :
																	student.grade === 'C' ? '#ff9800' :
																	student.grade === 'D' ? '#ff5722' : '#f44336',
																color: 'white',
																fontWeight: 700,
																minWidth: 36
															}}
														/>
													</TableCell>
													<TableCell align="right">
														<Tooltip title={`${student.aggregate_score.toFixed(2)}%`}>
															<Chip 
																label={`${student.aggregate_score.toFixed(1)}%`}
																size="small"
																color={student.aggregate_score >= 70 ? 'success' : student.aggregate_score >= 50 ? 'warning' : 'error'}
																sx={{ fontWeight: 600 }}
															/>
														</Tooltip>
													</TableCell>
													<TableCell align="center">
														<Tooltip title={`${Math.abs(student.vs_average).toFixed(1)}% ${student.vs_average >= 0 ? 'above' : 'below'} class average`}>
															<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
																{student.vs_average > 5 ? (
																	<TrendingUpIcon sx={{ fontSize: 16, color: 'success.main' }} />
																) : student.vs_average < -5 ? (
																	<TrendingDownIcon sx={{ fontSize: 16, color: 'error.main' }} />
																) : (
																	<RemoveIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
																)}
																<Typography 
																	variant="caption" 
																	sx={{ 
																		color: student.vs_average > 0 ? 'success.main' : student.vs_average < 0 ? 'error.main' : 'text.secondary',
																		fontWeight: 600
																	}}
																>
																	{student.vs_average > 0 ? '+' : ''}{student.vs_average.toFixed(1)}%
																</Typography>
															</Box>
														</Tooltip>
													</TableCell>
													<TableCell align="right">
														<Tooltip title={`Better than ${student.percentile.toFixed(0)}% of students`}>
															<Chip 
																label={`${student.percentile.toFixed(0)}th`}
																size="small"
																variant="outlined"
																icon={<WorkspacePremiumIcon />}
																sx={{ fontWeight: 600 }}
															/>
														</Tooltip>
													</TableCell>
													<TableCell align="center">
														<Chip 
															label={student.passed ? 'Pass' : 'Fail'}
															size="small"
															color={student.passed ? 'success' : 'error'}
															variant="filled"
														/>
													</TableCell>
												</TableRow>
											)
										})}
								</TableBody>
							</Table>
						</TableContainer>
						<Box sx={{ mt: 2, p: 2, bgcolor: isDark ? '#0F0F0F' : 'action.hover', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
							<Typography variant="body2" color="text.secondary">
								<strong>Legend:</strong> Gold/Silver/Bronze for Top 3 • vs Avg shows performance relative to class average • 
								Percentile indicates student's position in class • Heat-map background shows performance tier
							</Typography>
						</Box>
					</Paper>
						</Box>
					)}

					{/* Student Report Display */}
					{reportData.reportType === 'student' && (
						<Box>
							{/* Student Info Card */}
							<Paper sx={{ p: 3, mb: 3 }}>
								<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
									<PersonIcon sx={{ fontSize: '1.5rem', color: 'text.primary' }} />
									<Typography variant="h6">Student Information</Typography>
								</Box>
								<Grid container spacing={2} sx={{ mt: 1 }}>
									<Grid item xs={6} md={2}>
										<Typography variant="caption" color="text.secondary">Roll Number</Typography>
										<Typography variant="body1" sx={{ fontWeight: 600 }}>{reportData.roll_number}</Typography>
									</Grid>
									<Grid item xs={6} md={2}>
										<Typography variant="caption" color="text.secondary">Department</Typography>
										<Typography variant="body1" sx={{ fontWeight: 600 }}>{reportData.department}</Typography>
									</Grid>
									<Grid item xs={6} md={2}>
										<Typography variant="caption" color="text.secondary">Section</Typography>
										<Typography variant="body1" sx={{ fontWeight: 600 }}>{reportData.section}</Typography>
									</Grid>
									<Grid item xs={6} md={2}>
										<Typography variant="caption" color="text.secondary">Year</Typography>
										<Typography variant="body1" sx={{ fontWeight: 600 }}>{reportData.year}</Typography>
									</Grid>
									<Grid item xs={12} md={4}>
										<Typography variant="caption" color="text.secondary">Overall Average</Typography>
										<Typography variant="h4" sx={{ color: isDark ? '#A855F7' : '#9333EA' }}>{reportData.averageScore.toFixed(1)}%</Typography>
									</Grid>
								</Grid>
							</Paper>

							{/* Overall Stats */}
							<Grid container spacing={2} sx={{ mb: 3 }}>
								<Grid item xs={12} md={4}>
									<Card variant="outlined">
										<CardContent sx={{ textAlign: 'center' }}>
											<Typography color="text.secondary" gutterBottom variant="caption">Total Exams</Typography>
											<Typography variant="h3">{reportData.totalExams}</Typography>
										</CardContent>
									</Card>
								</Grid>
								<Grid item xs={12} md={4}>
									<Card variant="outlined" sx={{ bgcolor: isDark ? '#064E3B' : '#F0FDF4' }}>
										<CardContent sx={{ textAlign: 'center' }}>
											<Typography color="text.secondary" gutterBottom variant="caption">Passed</Typography>
											<Typography variant="h3" sx={{ color: isDark ? '#34D399' : '#047857' }}>{reportData.passedExams}</Typography>
										</CardContent>
									</Card>
								</Grid>
								<Grid item xs={12} md={4}>
									<Card variant="outlined" sx={{ bgcolor: isDark ? '#7F1D1D' : '#FEF2F2' }}>
										<CardContent sx={{ textAlign: 'center' }}>
											<Typography color="text.secondary" gutterBottom variant="caption">Failed</Typography>
											<Typography variant="h3" sx={{ color: isDark ? '#FCA5A5' : '#DC2626' }}>{reportData.failedExams}</Typography>
										</CardContent>
									</Card>
								</Grid>
							</Grid>

							{/* Performance Insights */}
							<Grid container spacing={2} sx={{ mb: 3 }}>
								<Grid item xs={12} md={3}>
									<Card variant="outlined" sx={{ bgcolor: isDark ? '#1F1F1F' : '#FFFBEB', border: '2px solid', borderColor: isDark ? '#F59E0B' : '#FBBF24' }}>
										<CardContent sx={{ textAlign: 'center' }}>
											<Typography color="text.secondary" gutterBottom variant="caption">Highest Score</Typography>
											<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
												<TrophyIcon sx={{ fontSize: '1.5rem', color: isDark ? '#F59E0B' : '#D97706' }} />
												<Typography variant="h4" sx={{ color: isDark ? '#F59E0B' : '#D97706' }}>{reportData.highestScore?.toFixed(1)}%</Typography>
											</Box>
										</CardContent>
									</Card>
								</Grid>
								<Grid item xs={12} md={3}>
									<Card variant="outlined">
										<CardContent sx={{ textAlign: 'center' }}>
											<Typography color="text.secondary" gutterBottom variant="caption">Lowest Score</Typography>
											<Typography variant="h4">{reportData.lowestScore?.toFixed(1)}%</Typography>
										</CardContent>
									</Card>
								</Grid>
								<Grid item xs={12} md={3}>
									<Card variant="outlined" sx={{ 
										bgcolor: reportData.trend === 'Improving' ? (isDark ? '#064E3B' : '#F0FDF4') : reportData.trend === 'Declining' ? (isDark ? '#7F1D1D' : '#FEF2F2') : (isDark ? '#0F0F0F' : 'action.hover'),
										border: '2px solid',
										borderColor: reportData.trend === 'Improving' ? (isDark ? '#10B981' : '#047857') : reportData.trend === 'Declining' ? (isDark ? '#DC2626' : '#F44336') : 'divider'
									}}>
										<CardContent sx={{ textAlign: 'center' }}>
											<Typography color="text.secondary" gutterBottom variant="caption">Performance Trend</Typography>
											<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
												{reportData.trend === 'Improving' && <TrendingUpIcon sx={{ fontSize: '1.25rem', color: 'success.main' }} />}
												{reportData.trend === 'Declining' && <TrendingDownIcon sx={{ fontSize: '1.25rem', color: 'error.main' }} />}
												{reportData.trend === 'Stable' && <HorizontalRuleIcon sx={{ fontSize: '1.25rem', color: 'text.secondary' }} />}
												<Typography variant="h6" sx={{ fontWeight: 700 }}>
													{reportData.trend === 'Improving' ? 'Improving' : reportData.trend === 'Declining' ? 'Declining' : 'Stable'}
												</Typography>
											</Box>
										</CardContent>
									</Card>
								</Grid>
								<Grid item xs={12} md={3}>
									<Card variant="outlined" sx={{ bgcolor: isDark ? '#1F1F1F' : '#F0F9FF' }}>
										<CardContent sx={{ textAlign: 'center' }}>
											<Typography color="text.secondary" gutterBottom variant="caption">Consistency</Typography>
											<Typography variant="body1" sx={{ fontWeight: 700 }}>{reportData.consistencyRating}</Typography>
											<Typography variant="caption" color="text.secondary">σ = {reportData.stdDeviation?.toFixed(2)}</Typography>
										</CardContent>
									</Card>
								</Grid>
							</Grid>

							{/* Activity Metrics */}
							<Paper sx={{ p: 2, mb: 3, bgcolor: isDark ? '#0F0F0F' : 'action.hover' }}>
								<Grid container spacing={2}>
									<Grid item xs={12} md={3}>
										<Box sx={{ textAlign: 'center' }}>
											<Typography variant="caption" color="text.secondary">Total Questions</Typography>
											<Typography variant="h6" sx={{ fontWeight: 700 }}>{reportData.totalQuestionsAttempted}</Typography>
										</Box>
									</Grid>
									<Grid item xs={12} md={3}>
										<Box sx={{ textAlign: 'center' }}>
											<Typography variant="caption" color="text.secondary">Total Submissions</Typography>
											<Typography variant="h6" sx={{ fontWeight: 700 }}>{reportData.totalSubmissions}</Typography>
										</Box>
									</Grid>
									<Grid item xs={12} md={3}>
										<Box sx={{ textAlign: 'center' }}>
											<Typography variant="caption" color="text.secondary">Pass Rate</Typography>
											<Typography variant="h6" sx={{ fontWeight: 700, color: reportData.passRate >= 70 ? (isDark ? '#34D399' : '#047857') : reportData.passRate >= 50 ? (isDark ? '#F59E0B' : '#D97706') : (isDark ? '#FCA5A5' : '#DC2626') }}>
												{reportData.passRate.toFixed(1)}%
											</Typography>
										</Box>
									</Grid>
									<Grid item xs={12} md={3}>
										<Box sx={{ textAlign: 'center' }}>
											<Typography variant="caption" color="text.secondary">Avg Score</Typography>
											<Typography variant="h6" sx={{ fontWeight: 700, color: isDark ? '#A855F7' : '#9333EA' }}>
												{reportData.averageScore.toFixed(1)}%
											</Typography>
										</Box>
									</Grid>
								</Grid>
							</Paper>

							{/* Exam-wise Performance */}
							<Paper sx={{ p: 3 }}>
								<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
									<MenuBookIcon sx={{ fontSize: '1.5rem', color: 'text.primary' }} />
									<Typography variant="h6">
										{selectedExams.length > 0 ? `Performance in ${selectedExams.length} Selected Exam${selectedExams.length > 1 ? 's' : ''}` : 'Performance Across All Exams'}
									</Typography>
								</Box>
								<TableContainer sx={{ mt: 2 }}>
									<Table size="small">
										<TableHead>
											<TableRow sx={{ '& th': { bgcolor: isDark ? '#1F1F1F' : '#A855F7', color: '#FFFFFF', fontWeight: 700 } }}>
												<TableCell>Exam Name</TableCell>
												<TableCell align="center">Date</TableCell>
												<TableCell align="center">Score</TableCell>
												<TableCell align="center">Grade</TableCell>
												<TableCell align="center">Status</TableCell>
												<TableCell align="right">Questions</TableCell>
												<TableCell align="right">Attempts</TableCell>
											</TableRow>
										</TableHead>
										<TableBody>
											{reportData.examStats?.map((exam: any, index: number) => (
												<TableRow key={index} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
													<TableCell sx={{ fontWeight: 600 }}>
														<Typography variant="body2" sx={{ fontWeight: 600 }}>
															{exam.exam_name}
														</Typography>
													</TableCell>
													<TableCell align="center">
														<Typography variant="caption" color="text.secondary">
															{exam.submitted_at ? new Date(exam.submitted_at).toLocaleDateString() : 'N/A'}
														</Typography>
													</TableCell>
													<TableCell align="center">
														<Chip 
															label={`${exam.aggregate_score.toFixed(1)}%`}
															size="small"
															color={exam.aggregate_score >= 70 ? 'success' : exam.aggregate_score >= 50 ? 'warning' : 'error'}
															sx={{ fontWeight: 600 }}
														/>
													</TableCell>
													<TableCell align="center">
														<Chip 
															label={exam.grade}
															size="small"
															sx={{
																bgcolor: 
																	exam.grade === 'A' ? '#4caf50' :
																	exam.grade === 'B' ? '#2196f3' :
																	exam.grade === 'C' ? '#ff9800' :
																	exam.grade === 'D' ? '#ff5722' : '#f44336',
																color: 'white',
																fontWeight: 700
															}}
														/>
													</TableCell>
													<TableCell align="center">
														<Chip 
															label={exam.passed ? 'Pass' : 'Fail'}
															size="small"
															color={exam.passed ? 'success' : 'error'}
															variant="filled"
														/>
													</TableCell>
													<TableCell align="right">{exam.questions_attempted}</TableCell>
													<TableCell align="right">{exam.total_submissions}</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</TableContainer>
							</Paper>
						</Box>
					)}

					{/* Section Report Display */}
					{reportData.reportType === 'section' && (
						<Box>
							{/* Section Stats */}
							<Grid container spacing={2} sx={{ mb: 3 }}>
								<Grid item xs={12} md={3}>
									<Card variant="outlined">
										<CardContent sx={{ textAlign: 'center' }}>
											<Typography color="text.secondary" gutterBottom variant="caption">Total Students</Typography>
											<Typography variant="h3">{reportData.totalStudents}</Typography>
										</CardContent>
									</Card>
								</Grid>
								<Grid item xs={12} md={3}>
									<Card variant="outlined" sx={{ bgcolor: 'success.50' }}>
										<CardContent sx={{ textAlign: 'center' }}>
											<Typography color="text.secondary" gutterBottom variant="caption">Passed</Typography>
											<Typography variant="h3" color="success.main">{reportData.passedStudents}</Typography>
											<Typography variant="caption" color="success.main">{reportData.passRate.toFixed(1)}%</Typography>
										</CardContent>
									</Card>
								</Grid>
								<Grid item xs={12} md={3}>
									<Card variant="outlined" sx={{ bgcolor: 'error.50' }}>
										<CardContent sx={{ textAlign: 'center' }}>
											<Typography color="text.secondary" gutterBottom variant="caption">Failed</Typography>
											<Typography variant="h3" color="error.main">{reportData.failedStudents}</Typography>
											<Typography variant="caption" color="error.main">{(100 - reportData.passRate).toFixed(1)}%</Typography>
										</CardContent>
									</Card>
								</Grid>
								<Grid item xs={12} md={3}>
									<Card variant="outlined" sx={{ bgcolor: isDark ? '#1F1F1F' : '#F5F3FF' }}>
										<CardContent sx={{ textAlign: 'center' }}>
											<Typography color="text.secondary" gutterBottom variant="caption">Average Score</Typography>
											<Typography variant="h3" sx={{ color: isDark ? '#A855F7' : '#9333EA' }}>{reportData.averageScore.toFixed(1)}%</Typography>
										</CardContent>
									</Card>
								</Grid>
							</Grid>

							{/* Additional Insights */}
							<Grid container spacing={2} sx={{ mb: 3 }}>
								<Grid item xs={12} md={2.4}>
									<Card variant="outlined" sx={{ bgcolor: isDark ? '#1F1F1F' : '#FFFBEB', border: '2px solid', borderColor: isDark ? '#F59E0B' : '#FBBF24' }}>
										<CardContent sx={{ textAlign: 'center' }}>
											<Typography color="text.secondary" gutterBottom variant="caption">Highest Score</Typography>
											<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
												<TrophyIcon sx={{ fontSize: '1.25rem', color: isDark ? '#F59E0B' : '#D97706' }} />
												<Typography variant="h5" sx={{ color: isDark ? '#F59E0B' : '#D97706' }}>{reportData.highestScore?.toFixed(1)}%</Typography>
											</Box>
										</CardContent>
									</Card>
								</Grid>
								<Grid item xs={12} md={2.4}>
									<Card variant="outlined">
										<CardContent sx={{ textAlign: 'center' }}>
											<Typography color="text.secondary" gutterBottom variant="caption">Lowest Score</Typography>
											<Typography variant="h5">{reportData.lowestScore?.toFixed(1)}%</Typography>
										</CardContent>
									</Card>
								</Grid>
								<Grid item xs={12} md={2.4}>
									<Card variant="outlined" sx={{ bgcolor: isDark ? '#1F1F1F' : '#F0F9FF' }}>
										<CardContent sx={{ textAlign: 'center' }}>
											<Typography color="text.secondary" gutterBottom variant="caption">Median Score</Typography>
											<Typography variant="h5" sx={{ color: isDark ? '#F59E0B' : '#F59E0B' }}>{reportData.median?.toFixed(1)}%</Typography>
										</CardContent>
									</Card>
								</Grid>
								<Grid item xs={12} md={2.4}>
									<Card variant="outlined">
										<CardContent sx={{ textAlign: 'center' }}>
											<Typography color="text.secondary" gutterBottom variant="caption">Std Deviation</Typography>
											<Typography variant="h6">{reportData.stdDeviation?.toFixed(2)}</Typography>
										</CardContent>
									</Card>
								</Grid>
								<Grid item xs={12} md={2.4}>
									<Card variant="outlined" sx={{ bgcolor: isDark ? '#0F0F0F' : 'action.hover' }}>
										<CardContent sx={{ textAlign: 'center' }}>
											<Typography color="text.secondary" gutterBottom variant="caption">Total Activity</Typography>
											<Typography variant="body2">{reportData.totalSubmissions} Submissions</Typography>
											<Typography variant="caption" color="text.secondary">{reportData.avgSubmissionsPerStudent?.toFixed(1)} avg/student</Typography>
										</CardContent>
									</Card>
								</Grid>
							</Grid>

							{/* Score Distribution and Grade Distribution */}
							<Grid container spacing={2} sx={{ mb: 3 }}>
								<Grid item xs={12} md={6}>
									<Paper sx={{ p: 2 }}>
										<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
											<BarChartIcon sx={{ fontSize: '1rem', color: 'text.primary' }} />
											<Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Score Distribution</Typography>
										</Box>
										{Object.entries(reportData.scoreDistribution || {}).map(([range, count]: [string, any]) => (
											<Box key={range} sx={{ mb: 1 }}>
												<Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
													<Typography variant="caption">{range}</Typography>
													<Typography variant="caption" sx={{ fontWeight: 600 }}>{count} students</Typography>
												</Box>
												<LinearProgress 
													variant="determinate" 
													value={reportData.totalStudents > 0 ? (count / reportData.totalStudents) * 100 : 0}
													sx={{ height: 8, borderRadius: 1 }}
												/>
											</Box>
										))}
									</Paper>
								</Grid>
								<Grid item xs={12} md={6}>
									<Paper sx={{ p: 2 }}>
										<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
											<SchoolIcon sx={{ fontSize: '1rem', color: 'text.primary' }} />
											<Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Grade Distribution</Typography>
										</Box>
										{Object.entries(reportData.gradeDistribution || {}).map(([grade, count]: [string, any]) => (
											<Box key={grade} sx={{ mb: 1 }}>
												<Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
													<Typography variant="caption">Grade {grade}</Typography>
													<Typography variant="caption" sx={{ fontWeight: 600 }}>{count} students</Typography>
												</Box>
												<LinearProgress 
													variant="determinate" 
													value={reportData.totalStudents > 0 ? (count / reportData.totalStudents) * 100 : 0}
													sx={{ 
														height: 8, 
														borderRadius: 1,
														'& .MuiLinearProgress-bar': {
															bgcolor: grade === 'A' ? '#4caf50' : grade === 'B' ? '#2196f3' : grade === 'C' ? '#ff9800' : grade === 'D' ? '#ff5722' : '#f44336'
														}
													}}
												/>
											</Box>
										))}
									</Paper>
								</Grid>
							</Grid>

							{/* Top Performers */}
							{reportData.topPerformers && reportData.topPerformers.length > 0 && (
								<Paper sx={{ p: 2, mb: 3, bgcolor: isDark ? '#064E3B' : '#F0FDF4', border: '2px solid', borderColor: isDark ? '#10B981' : '#047857' }}>
									<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
										<TrophyIcon sx={{ fontSize: '1rem', color: 'text.primary' }} />
										<Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Top 5 Performers</Typography>
									</Box>
									<Grid container spacing={1}>
										{reportData.topPerformers.slice(0, 5).map((student: any, index: number) => (
											<Grid item xs={12} sm={6} md={2.4} key={index}>
												<Card variant="outlined" sx={{ bgcolor: isDark ? '#0A0A0A' : 'background.paper' }}>
													<CardContent sx={{ textAlign: 'center', py: 1 }}>
														<Typography variant="caption" color="text.secondary">#{index + 1}</Typography>
														<Typography variant="body2" sx={{ fontWeight: 600 }}>{student.roll_number}</Typography>
														<Typography variant="caption" display="block">{student.student_name}</Typography>
														<Chip label={`${student.aggregate_score.toFixed(1)}%`} size="small" color="success" sx={{ mt: 0.5 }} />
													</CardContent>
												</Card>
											</Grid>
										))}
									</Grid>
								</Paper>
							)}

							{/* Student List */}
							<Paper sx={{ p: 3 }}>
								<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
									<PeopleIcon sx={{ fontSize: '1.5rem', color: 'text.primary' }} />
									<Typography variant="h6">Student Performance</Typography>
								</Box>
								<TableContainer sx={{ mt: 2, maxHeight: 600 }}>
									<Table size="small" stickyHeader>
										<TableHead>
											<TableRow sx={{ '& th': { bgcolor: isDark ? '#1F1F1F' : '#A855F7', color: '#FFFFFF', fontWeight: 700 } }}>
												<TableCell>Rank</TableCell>
												<TableCell>Roll No</TableCell>
												<TableCell>Name</TableCell>
												<TableCell align="center">Score</TableCell>
												<TableCell align="center">Status</TableCell>
												<TableCell align="right">Questions</TableCell>
												<TableCell align="right">Submissions</TableCell>
											</TableRow>
										</TableHead>
										<TableBody>
											{reportData.studentStats?.map((student: any, index: number) => (
												<TableRow 
													key={index}
													sx={{ 
														bgcolor: index < 3 ? (index === 0 ? 'rgba(255,215,0,0.1)' : index === 1 ? 'rgba(192,192,192,0.1)' : 'rgba(205,127,50,0.1)') : 'inherit',
														'&:hover': { bgcolor: 'action.hover' }
													}}
												>
													<TableCell>
														<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
															{index < 3 && (
																index === 0 ? <EmojiEventsIcon sx={{ color: '#FFD700', fontSize: 20 }} /> :
																index === 1 ? <EmojiEventsIcon sx={{ color: '#C0C0C0', fontSize: 20 }} /> :
																<EmojiEventsIcon sx={{ color: '#CD7F32', fontSize: 20 }} />
															)}
															<Typography variant="body2" sx={{ fontWeight: index < 3 ? 700 : 400 }}>
																#{index + 1}
															</Typography>
														</Box>
													</TableCell>
													<TableCell>{student.roll_number}</TableCell>
													<TableCell sx={{ fontWeight: index < 3 ? 600 : 400 }}>{student.student_name}</TableCell>
													<TableCell align="center">
														<Chip 
															label={`${student.aggregate_score.toFixed(1)}%`}
															size="small"
															color={student.aggregate_score >= 70 ? 'success' : student.aggregate_score >= 50 ? 'warning' : 'error'}
															sx={{ fontWeight: 600 }}
														/>
													</TableCell>
													<TableCell align="center">
														<Chip 
															label={student.passed ? 'Pass' : 'Fail'}
															size="small"
															color={student.passed ? 'success' : 'error'}
															variant="filled"
														/>
													</TableCell>
													<TableCell align="right">{student.questions_attempted}</TableCell>
													<TableCell align="right">{student.num_submissions}</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</TableContainer>
							</Paper>
						</Box>
					)}

					{/* Department-Year Report Display */}
					{reportData.reportType === 'department-year' && (
						<Box>
							{/* Overall Stats */}
							<Grid container spacing={2} sx={{ mb: 3 }}>
								<Grid item xs={12} md={2.4}>
									<Card variant="outlined">
										<CardContent sx={{ textAlign: 'center' }}>
											<Typography color="text.secondary" gutterBottom variant="caption">Total Sections</Typography>
											<Typography variant="h3">{reportData.totalSections}</Typography>
										</CardContent>
									</Card>
								</Grid>
								<Grid item xs={12} md={2.4}>
									<Card variant="outlined">
										<CardContent sx={{ textAlign: 'center' }}>
											<Typography color="text.secondary" gutterBottom variant="caption">Total Students</Typography>
											<Typography variant="h3">{reportData.totalStudents}</Typography>
										</CardContent>
									</Card>
								</Grid>
								<Grid item xs={12} md={2.4}>
									<Card variant="outlined" sx={{ bgcolor: 'success.50' }}>
										<CardContent sx={{ textAlign: 'center' }}>
											<Typography color="text.secondary" gutterBottom variant="caption">Passed</Typography>
											<Typography variant="h3" color="success.main">{reportData.passedStudents}</Typography>
											<Typography variant="caption" color="success.main">{reportData.passRate.toFixed(1)}%</Typography>
										</CardContent>
									</Card>
								</Grid>
								<Grid item xs={12} md={2.4}>
									<Card variant="outlined" sx={{ bgcolor: 'error.50' }}>
										<CardContent sx={{ textAlign: 'center' }}>
											<Typography color="text.secondary" gutterBottom variant="caption">Failed</Typography>
											<Typography variant="h3" color="error.main">{reportData.failedStudents}</Typography>
											<Typography variant="caption" color="error.main">{(100 - reportData.passRate).toFixed(1)}%</Typography>
										</CardContent>
									</Card>
								</Grid>
								<Grid item xs={12} md={2.4}>
									<Card variant="outlined" sx={{ bgcolor: isDark ? '#1F1F1F' : '#F5F3FF' }}>
										<CardContent sx={{ textAlign: 'center' }}>
											<Typography color="text.secondary" gutterBottom variant="caption">Average Score</Typography>
											<Typography variant="h3" sx={{ color: isDark ? '#A855F7' : '#9333EA' }}>{reportData.averageScore.toFixed(1)}%</Typography>
										</CardContent>
									</Card>
								</Grid>
							</Grid>

							{/* Section Performance Insights */}
							{reportData.bestSection && reportData.worstSection && (
								<Grid container spacing={2} sx={{ mb: 3 }}>
									<Grid item xs={12} md={6}>
										<Paper sx={{ p: 2, bgcolor: isDark ? '#064E3B' : '#F0FDF4', border: '2px solid', borderColor: isDark ? '#10B981' : '#047857' }}>
											<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
												<TrophyIcon sx={{ fontSize: '1rem', color: 'text.primary' }} />
												<Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Best Performing Section</Typography>
											</Box>
											<Grid container spacing={2}>
												<Grid item xs={6}>
													<Typography variant="h4" sx={{ color: isDark ? '#34D399' : '#047857' }}>{reportData.bestSection.section_name}</Typography>
													<Typography variant="caption" color="text.secondary">Section Name</Typography>
												</Grid>
												<Grid item xs={3}>
													<Typography variant="h5" sx={{ color: isDark ? '#34D399' : '#047857' }}>{reportData.bestSection.averageScore.toFixed(1)}%</Typography>
													<Typography variant="caption" color="text.secondary">Avg Score</Typography>
												</Grid>
												<Grid item xs={3}>
													<Typography variant="h5" sx={{ color: isDark ? '#34D399' : '#047857' }}>{reportData.bestSection.passRate.toFixed(1)}%</Typography>
													<Typography variant="caption" color="text.secondary">Pass Rate</Typography>
												</Grid>
											</Grid>
										</Paper>
									</Grid>
									<Grid item xs={12} md={6}>
										<Paper sx={{ p: 2, bgcolor: isDark ? '#7F1D1D' : '#FEF2F2', border: '2px solid', borderColor: isDark ? '#DC2626' : '#F44336' }}>
											<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
												<WarningIcon sx={{ fontSize: '1rem', color: isDark ? '#FCA5A5' : '#DC2626' }} />
												<Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Needs Improvement</Typography>
											</Box>
											<Grid container spacing={2}>
												<Grid item xs={6}>
													<Typography variant="h4" sx={{ color: isDark ? '#FCA5A5' : '#DC2626' }}>{reportData.worstSection.section_name}</Typography>
													<Typography variant="caption" color="text.secondary">Section Name</Typography>
												</Grid>
												<Grid item xs={3}>
													<Typography variant="h5" sx={{ color: isDark ? '#FCA5A5' : '#DC2626' }}>{reportData.worstSection.averageScore.toFixed(1)}%</Typography>
													<Typography variant="caption" color="text.secondary">Avg Score</Typography>
												</Grid>
												<Grid item xs={3}>
													<Typography variant="h5" sx={{ color: isDark ? '#FCA5A5' : '#DC2626' }}>{reportData.worstSection.passRate.toFixed(1)}%</Typography>
													<Typography variant="caption" color="text.secondary">Pass Rate</Typography>
												</Grid>
											</Grid>
										</Paper>
									</Grid>
								</Grid>
							)}

							{/* Consistency Analysis */}
							<Paper sx={{ p: 2, mb: 3, bgcolor: isDark ? '#0F0F0F' : '#F0F9FF', border: '1px solid', borderColor: isDark ? '#F59E0B' : '#FBBF24' }}>
								<Grid container spacing={2} alignItems="center">
									<Grid item xs={12} md={4}>
										<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
											<TrendingUpIcon sx={{ fontSize: '1rem', color: 'text.primary' }} />
											<Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Section Consistency</Typography>
										</Box>
										<Typography variant="h5" sx={{ color: isDark ? '#F59E0B' : '#F59E0B' }}>{reportData.consistencyRating}</Typography>
										<Typography variant="caption" color="text.secondary">Standard Deviation: {reportData.sectionStdDev?.toFixed(2)}</Typography>
									</Grid>
									<Grid item xs={12} md={4}>
										<Typography variant="caption" color="text.secondary">Average Pass Rate Across Sections</Typography>
										<Typography variant="h5" color="primary.main">{reportData.avgPassRateAcrossSections?.toFixed(1)}%</Typography>
									</Grid>
									<Grid item xs={12} md={4}>
										<Typography variant="caption" color="text.secondary">Section Performance Range</Typography>
										<Typography variant="body1" sx={{ fontWeight: 600 }}>
											{reportData.worstSection?.averageScore?.toFixed(1)}% - {reportData.bestSection?.averageScore?.toFixed(1)}%
										</Typography>
									</Grid>
								</Grid>
							</Paper>

							{/* Section-wise Comparison */}
							<Paper sx={{ p: 3 }}>
								<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
									<BarChartIcon sx={{ fontSize: '1.5rem', color: 'text.primary' }} />
									<Typography variant="h6">Section-wise Performance Comparison</Typography>
								</Box>
								<TableContainer sx={{ mt: 2 }}>
									<Table size="small">
										<TableHead>
											<TableRow sx={{ '& th': { bgcolor: isDark ? '#1F1F1F' : '#A855F7', color: '#FFFFFF', fontWeight: 700 } }}>
												<TableCell>Rank</TableCell>
												<TableCell>Section</TableCell>
												<TableCell align="right">Students</TableCell>
												<TableCell align="center">Avg Score</TableCell>
												<TableCell align="center">Pass Rate</TableCell>
												<TableCell align="right">Passed</TableCell>
												<TableCell align="right">Failed</TableCell>
											</TableRow>
										</TableHead>
										<TableBody>
											{reportData.sectionStats?.map((section: any, index: number) => (
												<TableRow 
													key={index}
													sx={{ 
														bgcolor: index === 0 ? 'rgba(76,175,80,0.1)' : 'inherit',
														'&:hover': { bgcolor: 'action.hover' }
													}}
												>
													<TableCell>
														<Chip 
															label={`#${index + 1}`}
															size="small"
															color={index === 0 ? 'success' : 'default'}
															sx={{ fontWeight: 600 }}
														/>
													</TableCell>
													<TableCell sx={{ fontWeight: index === 0 ? 600 : 400 }}>{section.section_name}</TableCell>
													<TableCell align="right">{section.totalStudents}</TableCell>
													<TableCell align="center">
														<Chip 
															label={`${section.averageScore.toFixed(1)}%`}
															size="small"
															color={section.averageScore >= 70 ? 'success' : section.averageScore >= 50 ? 'warning' : 'error'}
															sx={{ fontWeight: 600 }}
														/>
													</TableCell>
													<TableCell align="center">
														<Chip 
															label={`${section.passRate.toFixed(1)}%`}
															size="small"
															color={section.passRate >= 70 ? 'success' : section.passRate >= 50 ? 'warning' : 'error'}
															variant="outlined"
														/>
													</TableCell>
													<TableCell align="right">
														<Typography color="success.main" sx={{ fontWeight: 600 }}>
															{section.passedStudents}
														</Typography>
													</TableCell>
													<TableCell align="right">
														<Typography color="error.main" sx={{ fontWeight: 600 }}>
															{section.failedStudents}
														</Typography>
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</TableContainer>
								<Box sx={{ mt: 2, p: 2, bgcolor: isDark ? '#1F1F1F' : '#F0F9FF', borderRadius: 1, border: '1px solid', borderColor: isDark ? '#F59E0B' : '#FBBF24' }}>
								<Typography variant="body2" sx={{ color: isDark ? '#F59E0B' : '#F59E0B' }}>
										<strong>💡 Insight:</strong> 
										{reportData.sectionStats && reportData.sectionStats.length > 0 && (
											` Best performing section: ${reportData.sectionStats[0].section_name} with ${reportData.sectionStats[0].averageScore.toFixed(1)}% average score.`
										)}
									</Typography>
								</Box>
							</Paper>
						</Box>
					)}
				</Box>
			)}

			{!reportData && !generatingReport && (
				<Box sx={{ textAlign: 'center', py: 8 }}>
					<AssessmentIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
					<Typography variant="h6" color="text.secondary">
						Select an exam and click "Generate Report" to view analytics
					</Typography>
				</Box>
			)}
		</Box>
	)
}

