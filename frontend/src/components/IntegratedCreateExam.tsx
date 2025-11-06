import React, { useState, useEffect } from 'react'
import { 
  Box, 
  Typography, 
  Button, 
  TextField, 
  MenuItem, 
  Paper, 
  Alert,
  Card,
  CardContent,
  Divider,
  FormControl,
  InputLabel,
  Select,
  Chip,
  OutlinedInput,
  Checkbox,
  ListItemText
} from '@mui/material'
import { createExam, ExamCreate, Question, TestCase, getPublicDepartments, getPublicYears, getPublicSections, Department, Year, Section, getFullExamDetails } from '../api'
import LabLayoutCreator from './LabLayoutCreator'

const languages = ['python','javascript','java','c','cpp','go'] as const

interface IntegratedCreateExamProps {
  token: string
  templateExamId?: string
}

export default function IntegratedCreateExam({ token, templateExamId }: IntegratedCreateExamProps) {
  const [step, setStep] = useState<'exam' | 'layout'>('exam')
  const [examId, setExamId] = useState('')
  const [startCode, setStartCode] = useState('')
  const [subjectName, setSubjectName] = useState('')
  const [language, setLanguage] = useState<typeof languages[number]>('python')
  const [duration, setDuration] = useState<number>(60)
  const [questionsPerStudent, setQuestionsPerStudent] = useState<number>(1)
  const [questions, setQuestions] = useState<Question[]>([])
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Lab Layout states
  const [labLayout, setLabLayout] = useState<any>(null)
  const [questionAssignments, setQuestionAssignments] = useState<{ [systemId: number]: string[] }>({})
  const [workingSystems, setWorkingSystems] = useState<number[]>([])
  
  // Department/Year/Section filters
  const [departments, setDepartments] = useState<Department[]>([])
  const [years, setYears] = useState<Year[]>([])
  const [sections, setSections] = useState<Section[]>([])
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([])
  const [selectedYears, setSelectedYears] = useState<number[]>([])
  const [selectedSections, setSelectedSections] = useState<string[]>([])

  // Prefill from template
  useEffect(() => {
    const prefill = async () => {
      if (!templateExamId) return
      try {
        const tpl = await getFullExamDetails(token, templateExamId)
        // Prefill core fields (clear examId)
        setSubjectName(`${tpl.subject_name} (Copy)`)
        setStartCode(tpl.start_code || '')
        setLanguage(tpl.language)
        setDuration(tpl.duration_minutes)
        setQuestionsPerStudent(tpl.questions_per_student || 1)
        setQuestions((tpl.questions || []).map((q: any, idx: number) => ({
          question_id: `q${idx + 1}`,
          text: q.text,
          ideal_solution: q.ideal_solution || '',
          test_cases: (q.test_cases || []).map((tc: any) => ({
            input: tc.input || '',
            expected_output: tc.expected_output || '',
            is_public: true
          }))
        })))
        setLabLayout(tpl.layout_data || null)
        setQuestionAssignments(tpl.question_assignments || {})
        setSelectedDepartments(tpl.allowed_departments || [])
        setSelectedYears(tpl.allowed_years || [])
        setSelectedSections(tpl.allowed_sections || [])
        if (tpl.layout_data && tpl.layout_data.systems) {
          setWorkingSystems(tpl.layout_data.systems.filter((s: any) => s.isWorking).map((s: any) => s.serialNumber))
        }
      } catch (e) {
        console.error('Failed to prefill from template:', e)
      }
    }
    prefill()
  }, [templateExamId, token])

  // Load department/year/section data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [deptData, yearData, sectionData] = await Promise.all([
          getPublicDepartments(),
          getPublicYears(),
          getPublicSections()
        ]);
        setDepartments(deptData);
        setYears(yearData);
        setSections(sectionData);
      } catch (err) {
        console.error('Failed to load department/year/section data:', err);
      }
    };
    loadData();
  }, [])

  const clearAll = () => {
    setStep('exam')
    setExamId('')
    setStartCode('')
    setSubjectName('')
    setLanguage('python')
    setDuration(60)
    setQuestionsPerStudent(1)
    setQuestions([])
    setError(null)
    setSuccess(null)
    setLabLayout(null)
    setQuestionAssignments({})
    setWorkingSystems([])
    setSelectedDepartments([])
    setSelectedYears([])
    setSelectedSections([])
  }

  // Handle layout selection
  const handleLayoutChange = (layout: any) => {
    // Only set layout if it has systems
    if (layout && layout.systems && layout.systems.length > 0) {
      setLabLayout(layout)
      setWorkingSystems(layout.systems.filter((s: any) => s.isWorking).map((s: any) => s.serialNumber))
      
      // Auto-assign questions using form data
      if (questions.length > 0) {
        autoAssignQuestions(layout, questions.length, questionsPerStudent)
      }
    } else {
      // Clear layout if no systems
      setLabLayout(null)
      setWorkingSystems([])
      setQuestionAssignments({})
    }
  }

  const handleQuestionAssignment = (assignments: { [systemId: number]: string[] }) => {
    setQuestionAssignments(assignments)
  }

  // Calculate minimum questions needed for adjacency-free assignment
  const calculateMinimumQuestionsNeeded = (totalQuestions: number, questionsPerStudent: number): number => {
    if (questionsPerStudent > totalQuestions) {
      return totalQuestions // Can't assign more than available
    }
    
    // For STRICT adjacency-free assignment (no shared questions between adjacent students):
    // We need at least 2 * questionsPerStudent questions
    // This ensures we can create non-overlapping combinations
    
    // Examples:
    // - 2 per student: need 4 questions → (1,2), (3,4) have no overlap
    // - 3 per student: need 6 questions → (1,2,3), (4,5,6) have no overlap
    // - 1 per student: need 2 questions → (1), (2) have no overlap
    
    return Math.max(2 * questionsPerStudent, questionsPerStudent + 1)
  }

  // Get assignment status for display
  const getAssignmentStatus = () => {
    if (questionsPerStudent <= 1 || questions.length === 0) {
      return null
    }
    
    const minNeeded = calculateMinimumQuestionsNeeded(questions.length, questionsPerStudent)
    const isImpossible = questionsPerStudent > questions.length
    const isInsufficient = questions.length < minNeeded
    
    return {
      minNeeded,
      isImpossible,
      isInsufficient,
      current: questions.length,
      required: questionsPerStudent
    }
  }

  // Auto-assign questions using form data
  const autoAssignQuestions = (layout: any, totalQuestions: number, questionsPerStudent: number) => {
    const workingSystems = layout.systems.filter((s: any) => s.isWorking)
    if (workingSystems.length === 0) return

    const assignments: { [systemId: number]: string[] } = {}
    
    // Create all possible question combinations
    const allQuestions = Array.from({ length: totalQuestions }, (_, j) => j + 1)
    const allCombinations = generateCombinations(allQuestions, questionsPerStudent)
    
    // Check if we have enough combinations
    if (allCombinations.length < workingSystems.length) {
      console.warn(`Not enough question combinations. Need ${workingSystems.length}, have ${allCombinations.length}`)
      return
    }
    
    // Simple assignment: assign combinations to systems
    const shuffledCombinations = [...allCombinations].sort(() => Math.random() - 0.5)
    
    for (let i = 0; i < workingSystems.length; i++) {
      const system = workingSystems[i]
      const combination = shuffledCombinations[i % shuffledCombinations.length]
      assignments[system.id] = combination.map(num => `q${num}`)
    }

    setQuestionAssignments(assignments)
  }

  // Generate all possible combinations of questions
  const generateCombinations = (questions: number[], size: number): number[][] => {
    if (size === 0) return [[]]
    if (questions.length === 0) return []
    
    const result: number[][] = []
    const first = questions[0]
    const rest = questions.slice(1)
    
    // Combinations that include the first element
    const withFirst = generateCombinations(rest, size - 1)
    withFirst.forEach(combo => result.push([first, ...combo]))
    
    // Combinations that don't include the first element
    const withoutFirst = generateCombinations(rest, size)
    withoutFirst.forEach(combo => result.push(combo))
    
    return result
  }

  // Proceed to layout creation after exam details are filled
  const proceedToLayout = () => {
    // Clear any previous errors
    setError('')
    
    // 1. Check if exam code is given
    if (!examId || examId.trim() === '') {
      alert('❌ Exam ID is required to proceed to layout creation')
      return
    }
    
    if (!subjectName || subjectName.trim() === '') {
      alert('❌ Subject name is required to proceed to layout creation')
      return
    }
    
    if (!startCode || startCode.trim() === '') {
      alert('❌ Start code is required to proceed to layout creation')
      return
    }
    
    // 2. Check if at least one question is added
    if (questions.length === 0) {
      alert('❌ Please add at least one question to proceed to layout creation')
      return
    }
    
    // 3. Validate all questions have required fields
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i]
      
      // Check question text
      if (!question.text || question.text.trim() === '') {
        alert(`❌ Question ${i + 1}: Question text is required`)
        return
      }
      
      // Check ideal solution (template code)
      if (!question.ideal_solution || question.ideal_solution.trim() === '') {
        alert(`❌ Question ${i + 1}: Template code (ideal solution) is required`)
        return
      }
      
      // 4. Check test cases have expected output
      for (let j = 0; j < question.test_cases.length; j++) {
        const testCase = question.test_cases[j]
        if (!testCase.expected_output || testCase.expected_output.trim() === '') {
          alert(`❌ Question ${i + 1}, Test Case ${j + 1}: Expected output is required`)
          return
        }
      }
    }
    
    // All validations passed
    // Clear any existing layout data before moving to layout step
    setLabLayout(null)
    setQuestionAssignments({})
    setWorkingSystems([])
    setStep('layout')
  }

  // Go back to exam step
  const goBackToExam = () => {
    setStep('exam')
    // Clear layout data when going back
    setLabLayout(null)
    setQuestionAssignments({})
    setWorkingSystems([])
  }

  // Default test cases
  const defaultTestCases = (): TestCase[] => [
    { input: '', expected_output: '', is_public: true }
  ]

  // Question management
  const addQuestion = () => {
    const idx = questions.length + 1
    setQuestions(q => [...q, { 
      question_id: `q${idx}`, 
      text: '', 
      ideal_solution: '', 
      test_cases: defaultTestCases() 
    }])
  }

  const removeQuestion = (index: number) => {
    setQuestions(q => {
      const newQuestions = q.filter((_, i) => i !== index)
      // Renumber question IDs to maintain sequential order
      return newQuestions.map((question, i) => ({
        ...question,
        question_id: `q${i + 1}`
      }))
    })
  }

  const updateQuestion = (i: number, patch: Partial<Question>) => {
    setQuestions(q => q.map((qq, idx) => idx === i ? { ...qq, ...patch } : qq))
  }

  const updateTestCase = (qi: number, ti: number, patch: Partial<TestCase>) => {
    setQuestions(q => q.map((qq, idx) => idx === qi ? { 
      ...qq, 
      test_cases: qq.test_cases.map((tc, j) => j === ti ? { ...tc, ...patch } : tc) 
    } : qq))
  }

  const addTestCase = (qi: number) => {
    setQuestions(q => q.map((qq, idx) => idx === qi ? { 
      ...qq, 
      test_cases: [...qq.test_cases, { input: '', expected_output: '', is_public: true }]
    } : qq))
  }

  const removeTestCase = (qi: number, ti: number) => {
    setQuestions(q => q.map((qq, idx) => {
      if (idx === qi) {
        // Prevent removing the last test case
        if (qq.test_cases.length <= 1) {
          alert('Cannot remove the last test case. Each question must have at least 1 test case.')
          return qq
        }
        return { 
          ...qq, 
          test_cases: qq.test_cases.filter((_, j) => j !== ti)
        }
      }
      return qq
    }))
  }

  // Create exam
  const handleCreateExam = async () => {
    if (!examId || !subjectName || questions.length === 0) {
      setError('Please fill all required fields and add at least one question')
      return
    }

    // Validate that all questions have at least 1 test case
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i]
      if (question.test_cases.length === 0) {
        setError(`Question ${i + 1} must have at least 1 test case`)
        return
      }
    }

    const payload: ExamCreate = {
      exam_id: examId,
      start_code: startCode,
      subject_name: subjectName,
      language,
      duration_minutes: duration,
      num_questions: questions.length,
      questions_per_student: questionsPerStudent,
      questions: questions.map(q => ({
        ...q,
        test_cases: q.test_cases.map(tc => ({ ...tc, is_public: true }))
      })),
      is_live: false,
      layout_data: labLayout,
      question_assignments: questionAssignments,
      allowed_departments: selectedDepartments,
      allowed_years: selectedYears,
      allowed_sections: selectedSections
    }

    try {
      await createExam(token, payload)
      alert('✅ Exam created successfully!')
      // Reset form
      clearAll()
      setStep('layout')
    } catch (e: any) {
      alert(`❌ Failed to create exam: ${e?.message || 'Unknown error'}`)
    }
  }

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>Create New Exam</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      
      {step === 'exam' && (
        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Step 1: Create Exam Details</Typography>
            <Button variant="text" color="warning" onClick={clearAll}>Clear details</Button>
          </Box>
          <Box sx={{ display: 'grid', gap: 2, mb: 3 }}>
            <TextField 
              label="Exam ID" 
              value={examId} 
              onChange={e => setExamId(e.target.value)} 
              required 
              helperText="Unique identifier for the exam"
              error={!examId || examId.trim() === ''}
            />
            <TextField 
              label="Subject Name" 
              value={subjectName} 
              onChange={e => setSubjectName(e.target.value)} 
              required 
              error={!subjectName || subjectName.trim() === ''}
            />
            <TextField 
              label="Language" 
              select 
              value={language} 
              onChange={e => setLanguage(e.target.value as any)}
            >
              {languages.map(l => <MenuItem key={l} value={l}>{l}</MenuItem>)}
            </TextField>
            <TextField 
              label="Duration (minutes)" 
              type="number" 
              value={duration} 
              onChange={e => setDuration(Number(e.target.value))} 
              required 
            />
            <TextField 
              label="Questions per student" 
              type="number" 
              value={questionsPerStudent} 
              onChange={e => setQuestionsPerStudent(Number(e.target.value))} 
              required 
              helperText="How many questions each student will be assigned"
            />
            
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" sx={{ mb: 2 }}>Student Access Filters</Typography>
            
            <FormControl fullWidth>
              <InputLabel>Allowed Departments</InputLabel>
              <Select
                multiple
                value={selectedDepartments}
                onChange={(e) => setSelectedDepartments(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                input={<OutlinedInput label="Allowed Departments" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => {
                      const dept = departments.find(d => d.id === value);
                      return <Chip key={value} label={dept?.name || value} size="small" />;
                    })}
                  </Box>
                )}
              >
                {departments.map((dept) => (
                  <MenuItem key={dept.id} value={dept.id}>
                    <Checkbox checked={selectedDepartments.indexOf(dept.id) > -1} />
                    <ListItemText primary={dept.name} secondary={dept.code} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl fullWidth>
              <InputLabel>Allowed Academic Years</InputLabel>
              <Select
                multiple
                value={selectedYears}
                onChange={(e) => setSelectedYears(typeof e.target.value === 'string' ? e.target.value.split(',').map(Number) : e.target.value)}
                input={<OutlinedInput label="Allowed Academic Years" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={`Year ${value}`} size="small" />
                    ))}
                  </Box>
                )}
              >
                {years.map((year) => (
                  <MenuItem key={year.id} value={year.year}>
                    <Checkbox checked={selectedYears.indexOf(year.year) > -1} />
                    <ListItemText primary={`Year ${year.year}`} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl fullWidth>
              <InputLabel>Allowed Sections</InputLabel>
              <Select
                multiple
                value={selectedSections}
                onChange={(e) => setSelectedSections(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                input={<OutlinedInput label="Allowed Sections" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => {
                      const section = sections.find(s => s.id === value);
                      return <Chip key={value} label={section?.name || value} size="small" />;
                    })}
                  </Box>
                )}
              >
                {sections.map((section) => (
                  <MenuItem key={section.id} value={section.id}>
                    <Checkbox checked={selectedSections.indexOf(section.id) > -1} />
                    <ListItemText primary={section.name} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            {/* Minimum Questions Checker */}
            {(() => {
              const status = getAssignmentStatus()
              if (!status) return null
              
              return (
                <Box sx={{ mt: 2, p: 2, border: '1px solid', borderColor: 'grey.300', borderRadius: 1 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>Assignment Requirements Check</Typography>
                  {status.isImpossible ? (
                    <Alert severity="error" sx={{ mb: 1 }}>
                      ❌ IMPOSSIBLE: Cannot assign {status.required} questions when only {status.current} available. 
                      You need at least {status.required} questions.
                    </Alert>
                  ) : status.isInsufficient ? (
                    <Alert severity="warning" sx={{ mb: 1 }}>
                      ⚠️ INSUFFICIENT: You need at least {status.minNeeded} questions to assign {status.required} questions per student without adjacency conflicts.
                      Current: {status.current} questions
                    </Alert>
                  ) : (
                    <Alert severity="success" sx={{ mb: 1 }}>
                      ✅ SUFFICIENT: {status.current} questions is enough to assign {status.required} questions per student without conflicts.
                    </Alert>
                  )}
                </Box>
              )
            })()}
            <TextField 
              label="Start Code" 
              multiline 
              rows={3} 
              value={startCode} 
              onChange={e => setStartCode(e.target.value)} 
              helperText="Initial code provided to students"
              required
              error={!startCode || startCode.trim() === ''}
            />
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>Questions</Typography>
            <Button variant="outlined" onClick={addQuestion} sx={{ mb: 2 }}>
              Add Question
            </Button>
            
            {questions.map((q, i) => (
              <Card key={i} sx={{ mb: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">Question {i + 1}</Typography>
                    <Button 
                      color="error" 
                      onClick={() => removeQuestion(i)}
                      size="small"
                    >
                      Remove
                    </Button>
                  </Box>
                  
                  <TextField 
                    label="Question Text" 
                    multiline 
                    rows={2} 
                    fullWidth 
                    value={q.text} 
                    onChange={e => updateQuestion(i, { text: e.target.value })} 
                    sx={{ mb: 2 }}
                    required
                    error={!q.text || q.text.trim() === ''}
                    helperText={!q.text || q.text.trim() === '' ? "Question text is required" : ""}
                  />
                  
                  <TextField 
                    label="Ideal Solution" 
                    multiline 
                    rows={2} 
                    fullWidth 
                    value={q.ideal_solution} 
                    onChange={e => updateQuestion(i, { ideal_solution: e.target.value })} 
                    sx={{ mb: 2 }}
                    required
                    error={!q.ideal_solution || q.ideal_solution.trim() === ''}
                    helperText={!q.ideal_solution || q.ideal_solution.trim() === '' ? "Template code is required" : ""}
                  />
                  
                  <Typography variant="subtitle1" sx={{ mb: 1 }}>Test Cases</Typography>
                  {q.test_cases.map((tc, ti) => (
                    <Box key={ti} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                      <TextField 
                        label="Input" 
                        value={tc.input} 
                        onChange={e => updateTestCase(i, ti, { input: e.target.value })} 
                        size="small"
                        sx={{ flex: 1 }}
                      />
                      <TextField 
                        label="Expected Output" 
                        value={tc.expected_output} 
                        onChange={e => updateTestCase(i, ti, { expected_output: e.target.value })} 
                        size="small"
                        sx={{ flex: 1 }}
                        required
                        error={!tc.expected_output || tc.expected_output.trim() === ''}
                        helperText={!tc.expected_output || tc.expected_output.trim() === '' ? "Required" : ""}
                      />
                      <Button 
                        color="error" 
                        onClick={() => removeTestCase(i, ti)}
                        size="small"
                      >
                        Remove
                      </Button>
                    </Box>
                  ))}
                  
                  <Button 
                    variant="outlined" 
                    onClick={() => addTestCase(i)}
                    size="small"
                  >
                    Add Test Case
                  </Button>
                </CardContent>
              </Card>
            ))}
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Button 
              variant="contained" 
              size="large"
              onClick={proceedToLayout}
              disabled={!examId || !subjectName || !startCode || questions.length === 0}
            >
              Proceed to Layout Creation
            </Button>
          </Box>
          
          <Box sx={{ mt: 2, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
            <Typography variant="body2" color="info.contrastText">
              <strong>Before proceeding, ensure:</strong>
            </Typography>
            <Typography variant="body2" color="info.contrastText" sx={{ mt: 1 }}>
              • Exam ID, Subject Name, and Start Code are filled
            </Typography>
            <Typography variant="body2" color="info.contrastText">
              • All questions have text and template code
            </Typography>
            <Typography variant="body2" color="info.contrastText">
              • All test cases have expected outputs
            </Typography>
          </Box>
        </Paper>
      )}
      
      {step === 'layout' && (
        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Step 2: Create Lab Layout</Typography>
            <Button variant="outlined" onClick={goBackToExam}>
              Back to Exam Details
            </Button>
          </Box>
          
          <LabLayoutCreator 
            onLayoutChange={handleLayoutChange} 
            onQuestionAssignment={handleQuestionAssignment}
            totalQuestions={questions.length}
            questionsPerStudent={questionsPerStudent}
            questionIds={questions.map(q => q.question_id)}
            onCreateExam={handleCreateExam}
            isEditMode={false}
            examButtonDisabled={!labLayout || workingSystems.length === 0}
          />
          
          {labLayout && labLayout.systems && labLayout.systems.length > 0 && Object.keys(questionAssignments).length > 0 && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 1 }}>Lab Layout Summary</Typography>
                <Typography variant="body2" color="text.secondary">
                  Layout: {labLayout?.length} × {labLayout?.breadth} = {workingSystems.length} working systems
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Serial Numbers: {workingSystems.join(', ')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Question Assignments: {Object.keys(questionAssignments).length} systems assigned
                </Typography>
              </CardContent>
            </Card>
          )}
        </Paper>
      )}
    </Box>
  )
}
