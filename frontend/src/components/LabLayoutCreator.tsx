import React, { useState, useEffect } from 'react'
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Alert,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Divider
} from '@mui/material'
import {
  Computer as ComputerIcon,
  ComputerOutlined as BrokenIcon,
  Save as SaveIcon,
  FolderOpen as LoadIcon,
  Shuffle as RandomizeIcon,
  Assignment as AssignmentIcon,
  CheckCircle as WorkingIcon,
  Cancel as BrokenSystemIcon
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

interface LabLayout {
  id: string
  name: string
  length: number
  breadth: number
  systems: LabSystem[]
  createdAt: string
}

interface LabLayoutCreatorProps {
  onLayoutChange: (layout: LabLayout) => void
  onQuestionAssignment: (assignments: { [systemId: number]: string[] }) => void
  totalQuestions?: number
  questionsPerStudent?: number
  questionIds?: string[]
  initialLayout?: any
  initialAssignments?: { [systemId: number]: string[] }
  onCreateExam?: () => void
  onUpdateExam?: () => void
  isEditMode?: boolean
  examButtonDisabled?: boolean
}

export default function LabLayoutCreator({ onLayoutChange, onQuestionAssignment, totalQuestions = 10, questionsPerStudent = 2, questionIds = [], initialLayout, initialAssignments, onCreateExam, onUpdateExam, isEditMode = false, examButtonDisabled = false }: LabLayoutCreatorProps) {
  const [length, setLength] = useState<number>(4)
  const [breadth, setBreadth] = useState<number>(6)
  const [systems, setSystems] = useState<LabSystem[]>([])
  const [selectedSystems, setSelectedSystems] = useState<Set<number>>(new Set())
  const [isCreating, setIsCreating] = useState(false)
  const [showTemplateDialog, setShowTemplateDialog] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [savedTemplates, setSavedTemplates] = useState<LabLayout[]>([])
  const [showLoadDialog, setShowLoadDialog] = useState(false)
  const [questionsPerStudentState, setQuestionsPerStudentState] = useState<number>(questionsPerStudent)
  const [totalQuestionsState, setTotalQuestionsState] = useState<number>(totalQuestions)
  const [assignmentResults, setAssignmentResults] = useState<{ [systemId: number]: string[] }>({})
  const [assignmentStats, setAssignmentStats] = useState<any>(null)
  const [showStats, setShowStats] = useState(false)
  const [randomizationMode, setRandomizationMode] = useState<'random'>('random')
  const [conflicts, setConflicts] = useState<{ [systemId: number]: string[] }>({})
  const [showInsufficientQuestionsDialog, setShowInsufficientQuestionsDialog] = useState(false)
  const [insufficientQuestionsInfo, setInsufficientQuestionsInfo] = useState<{
    current: number
    required: number
    questionsPerStudent: number
  } | null>(null)
  const [editingTemplate, setEditingTemplate] = useState<LabLayout | null>(null)
  const [editingTemplateName, setEditingTemplateName] = useState('')
  const [showRenameDialog, setShowRenameDialog] = useState(false)

  // Helper function to get storage key for current faculty/college
  const getTemplateStorageKey = () => {
    const username = localStorage.getItem('username') || 'unknown'
    const collegeId = localStorage.getItem('college_id') || 'unknown'
    return `labTemplates_${collegeId}_${username}`
  }

  // Load saved templates on component mount - college/faculty specific
  useEffect(() => {
    // Clear old non-specific templates on first load
    const oldKey = 'labTemplates'
    if (localStorage.getItem(oldKey)) {
      localStorage.removeItem(oldKey)
      console.log('Cleared old lab templates format')
    }

    const key = getTemplateStorageKey()
    const saved = localStorage.getItem(key)
    if (saved) {
      try {
        setSavedTemplates(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to parse saved templates:', e)
        setSavedTemplates([])
      }
    } else {
      setSavedTemplates([])
    }
  }, [])

  // Load initial layout data if provided (for edit mode)
  useEffect(() => {
    if (initialLayout) {
      setLength(initialLayout.length || 4)
      setBreadth(initialLayout.breadth || 6)
      setSystems(initialLayout.systems || [])
      setIsCreating(true)
      
      if (initialAssignments) {
        setAssignmentResults(initialAssignments)
      }
    }
  }, [initialLayout, initialAssignments])

  // Create lab layout
  const createLayout = () => {
    const newSystems: LabSystem[] = []

    for (let row = 0; row < length; row++) {
      for (let col = 0; col < breadth; col++) {
        const id = row * breadth + col + 1
        newSystems.push({
          id,
          row: row + 1,
          col: col + 1,
          serialNumber: null, // Will be assigned after marking non-working systems
          isWorking: true,
          assignedQuestions: [],
          isSelected: false
        })
      }
    }

    setSystems(newSystems)
    setIsCreating(true)
  }

  // Reassign serial numbers continuously for working systems
  const reassignSerialNumbers = (systems: LabSystem[]) => {
    let serialNumber = 1
    return systems.map(system => {
      if (system.isWorking) {
        return { ...system, serialNumber: serialNumber++ }
      }
      return { ...system, serialNumber: null }
    })
  }

  // Toggle system working status
  const toggleSystemStatus = (systemId: number) => {
    // Check if there are any assignments
    const hasAssignments = systems.some(system => system.assignedQuestions.length > 0)
    
    if (hasAssignments) {
      alert('⚠️ Cannot modify system status after assigning questions.\n\nPlease click "Clear Assignments" first, then modify systems, and reassign questions.')
      return
    }
    
    setSystems(prev => {
      const updated = prev.map(system => 
        system.id === systemId 
          ? { ...system, isWorking: !system.isWorking, isSelected: !system.isSelected }
          : system
      )
      
      // Reassign serial numbers continuously
      return reassignSerialNumbers(updated)
    })
  }

  // Save layout as template
  const saveTemplate = () => {
    if (!templateName.trim()) return

    // Check for duplicate names
    const existingTemplate = savedTemplates.find(t => t.name.toLowerCase() === templateName.toLowerCase())
    if (existingTemplate) {
      alert('Template with this name already exists. Please choose a different name.')
      return
    }

    // Strip question assignments from systems - only save physical layout
    const systemsWithoutQuestions = systems.map(system => ({
      ...system,
      assignedQuestions: [] // Remove question assignments
    }))

    const template: LabLayout = {
      id: Date.now().toString(),
      name: templateName,
      length,
      breadth,
      systems: systemsWithoutQuestions, // Save only physical layout (no questions)
      createdAt: new Date().toISOString()
    }

    const updatedTemplates = [...savedTemplates, template]
    setSavedTemplates(updatedTemplates)
    const key = getTemplateStorageKey()
    localStorage.setItem(key, JSON.stringify(updatedTemplates))
    setShowTemplateDialog(false)
    setTemplateName('')
  }

  // Load template
  const loadTemplate = (template: LabLayout) => {
    setLength(template.length)
    setBreadth(template.breadth)
    setSystems(template.systems) // Load ALL systems (working and non-working)
    setIsCreating(true)
    setShowLoadDialog(false)
  }

  // Rename template
  const renameTemplate = (template: LabLayout) => {
    setEditingTemplate(template)
    setEditingTemplateName(template.name)
    setShowRenameDialog(true)
  }

  // Save renamed template
  const saveRenamedTemplate = () => {
    if (!editingTemplate || !editingTemplateName.trim()) return

    // Check for duplicate names (excluding current template)
    const existingTemplate = savedTemplates.find(t => 
      t.id !== editingTemplate.id && 
      t.name.toLowerCase() === editingTemplateName.toLowerCase()
    )
    if (existingTemplate) {
      alert('Template with this name already exists. Please choose a different name.')
      return
    }

    const updatedTemplates = savedTemplates.map(t => 
      t.id === editingTemplate.id 
        ? { ...t, name: editingTemplateName.trim() }
        : t
    )
    setSavedTemplates(updatedTemplates)
    const key = getTemplateStorageKey()
    localStorage.setItem(key, JSON.stringify(updatedTemplates))
    setShowRenameDialog(false)
    setEditingTemplate(null)
    setEditingTemplateName('')
  }

  // Delete template
  const deleteTemplate = (template: LabLayout) => {
    if (window.confirm(`Are you sure you want to delete the template "${template.name}"?`)) {
      const updatedTemplates = savedTemplates.filter(t => t.id !== template.id)
      setSavedTemplates(updatedTemplates)
      const key = getTemplateStorageKey()
      localStorage.setItem(key, JSON.stringify(updatedTemplates))
    }
  }

  // Function to proceed with assignment despite insufficient questions
  const proceedWithInsufficientQuestions = () => {
    setShowInsufficientQuestionsDialog(false)
    assignQuestionsWithConflicts()
  }

  // Function to assign questions even with conflicts
  const assignQuestionsWithConflicts = () => {
    const workingSystems = systems.filter(s => s.isWorking)
    if (workingSystems.length === 0) {
      alert('No working systems to assign questions to')
      return
    }

    const assignments: { [systemId: number]: string[] } = {}
    
    // Use actual question IDs from the exam form
    const allQuestions = questionIds.length > 0 ? questionIds : Array.from({ length: totalQuestions }, (_, j) => `q${j + 1}`)
    const allCombinations = generateCombinations(allQuestions, questionsPerStudent)
    
    // Check if we have any combinations at all
    if (allCombinations.length === 0) {
      alert(`❌ IMPOSSIBLE: No question combinations possible.\n\nTry increasing total questions or decreasing questions per student.`)
      return
    }
    
    // Simple assignment with conflicts - just assign randomly
    const shuffledCombinations = [...allCombinations].sort(() => Math.random() - 0.5)
    
    for (let i = 0; i < workingSystems.length; i++) {
      const system = workingSystems[i]
      const combination = shuffledCombinations[i % shuffledCombinations.length]
      assignments[system.id] = combination.map(num => `q${num}`)
    }
    
    // Update systems with assignments
    const updatedSystems = systems.map(system => {
      if (system.isWorking && assignments[system.id]) {
        return {
          ...system,
          assignedQuestions: assignments[system.id].map(num => `q${num}`)
        }
      }
      return system
    })
    
    setSystems(updatedSystems)
    setAssignmentResults(assignments)
    
    // Detect conflicts between adjacent systems
    const detectedConflicts = detectConflicts(assignments, workingSystems)
    setConflicts(detectedConflicts)
    
    // Notify parent components of the updated layout and assignments
    const updatedLayout = {
      id: `layout_${Date.now()}`,
      name: `Layout ${length}x${breadth}`,
      length,
      breadth,
      systems: updatedSystems,
      createdAt: new Date().toISOString()
    }
    onLayoutChange(updatedLayout)
    onQuestionAssignment(assignments)
    
    // Show warning about conflicts
    alert(`⚠️ ASSIGNMENT COMPLETED WITH CONFLICTS\n\nSome adjacent students may have overlapping questions.\n\nThis is not recommended for strict exam conditions.`)
  }

  // SIMPLE assignment algorithm - assign questions to ALL working systems
  const assignQuestions = () => {
    const workingSystems = systems.filter(s => s.isWorking)
    if (workingSystems.length === 0) {
      alert('No working systems to assign questions to')
      return
    }

    const assignments: { [systemId: number]: string[] } = {}
    
    // Track assignment statistics
    const assignmentStats = {
      totalSystems: workingSystems.length,
      totalQuestions: totalQuestions,
      questionsPerStudent: questionsPerStudent,
      successfulAssignments: 0,
      conflictsResolved: 0,
      fallbackAssignments: 0
    }
    
    // Check if we have enough questions for strict adjacency-free assignment
    const minNeeded = Math.max(2 * questionsPerStudent, questionsPerStudent + 1)
    if (totalQuestions < minNeeded) {
      setInsufficientQuestionsInfo({
        current: totalQuestions,
        required: minNeeded,
        questionsPerStudent: questionsPerStudent
      })
      setShowInsufficientQuestionsDialog(true)
      return
    }
    
    // Use actual question IDs from the exam form
    const allQuestions = questionIds.length > 0 ? questionIds : Array.from({ length: totalQuestions }, (_, j) => `q${j + 1}`)
    const allCombinations = generateCombinations(allQuestions, questionsPerStudent)
    
    // Check if we have any combinations at all
    if (allCombinations.length === 0) {
      alert(`❌ IMPOSSIBLE: No question combinations possible.\n\nTry increasing total questions or decreasing questions per student.`)
      return
    }
    
    // Efficient assignment: Use all available questions optimally
    const shuffledCombinations = [...allCombinations].sort(() => Math.random() - 0.5)
    
    // Create a smart assignment that uses all questions efficiently
    for (let i = 0; i < workingSystems.length; i++) {
      const system = workingSystems[i]
      
      // Find the best combination that:
      // 1. Doesn't conflict with adjacent systems
      // 2. Uses questions that haven't been overused
      // 3. Maximizes question diversity
      let bestCombination = null
      let bestScore = -Infinity
      
      for (const combination of shuffledCombinations) {
        let score = 0
        
        // Check adjacency conflicts (heavily penalize) - only horizontal adjacency
        let hasAdjacencyConflict = false
        if (i > 0) {
          const prevSystem = workingSystems[i - 1]
          const prevAssignment = assignments[prevSystem.id]
          if (prevAssignment && hasQuestionOverlap(combination, prevAssignment)) {
            hasAdjacencyConflict = true
          }
        }
        
        if (i < workingSystems.length - 1) {
          const nextSystem = workingSystems[i + 1]
          const nextAssignment = assignments[nextSystem.id]
          if (nextAssignment && hasQuestionOverlap(combination, nextAssignment)) {
            hasAdjacencyConflict = true
          }
        }
        
        if (hasAdjacencyConflict) {
          score -= 1000 // Heavy penalty for adjacency conflicts
        } else {
          score += 100 // Bonus for no adjacency conflicts
        }
        
        // Bonus for using less frequently used questions
        const questionUsage = new Map()
        Object.values(assignments).forEach(assigned => {
          assigned.forEach(q => questionUsage.set(q, (questionUsage.get(q) || 0) + 1))
        })
        
        combination.forEach(q => {
          const usage = questionUsage.get(q) || 0
          score += (10 - usage) // Higher score for less used questions
        })
        
        // Bonus for question diversity
        const uniqueQuestions = new Set()
        Object.values(assignments).forEach(assigned => {
          assigned.forEach(q => uniqueQuestions.add(q))
        })
        combination.forEach(q => {
          if (!uniqueQuestions.has(q)) {
            score += 5 // Bonus for new questions
          }
        })
        
        if (score > bestScore) {
          bestScore = score
          bestCombination = combination
        }
      }
      
      // Assign the best combination found
      if (bestCombination) {
        assignments[system.id] = bestCombination
        assignmentStats.successfulAssignments++
        if (bestScore < 100) {
          assignmentStats.conflictsResolved++
        }
      } else {
        // Fallback: use cycling with smart selection
        const combination = shuffledCombinations[i % shuffledCombinations.length]
        assignments[system.id] = combination
        assignmentStats.successfulAssignments++
        assignmentStats.fallbackAssignments++
      }
    }

    // Update systems with assignments
    const updatedSystems = systems.map(system => ({
      ...system,
      assignedQuestions: assignments[system.id] || []
    }))
    setSystems(updatedSystems)

    setAssignmentResults(assignments)
    setAssignmentStats(assignmentStats)
    setShowStats(true)
    
    // Detect conflicts between adjacent systems using updated systems
    const updatedWorkingSystems = updatedSystems.filter(s => s.isWorking)
    const detectedConflicts = detectConflicts(assignments, updatedWorkingSystems)
    setConflicts(detectedConflicts)
    
    // Notify parent components of the updated layout and assignments
    const updatedLayout = {
      id: `layout_${Date.now()}`,
      name: `Layout ${length}x${breadth}`,
      length,
      breadth,
      systems: updatedSystems,
      createdAt: new Date().toISOString()
    }
    onLayoutChange(updatedLayout)
    onQuestionAssignment(assignments)
  }


  // Generate all possible combinations of questions
  const generateCombinations = (questions: string[], size: number): string[][] => {
    if (size === 0) return [[]]
    if (questions.length === 0) return []
    
    const result: string[][] = []
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

  // Check if two question combinations have any overlap
  const hasQuestionOverlap = (combo1: string[], combo2: string[]): boolean => {
    const set1 = new Set(combo1)
    const set2 = new Set(combo2)
    for (const question of set1) {
      if (set2.has(question)) {
        return true
      }
    }
    return false
  }

  // Finalize layout and create/update exam
  const finalizeLayout = () => {
    const workingSystems = systems.filter(s => s.isWorking)
    
    // Validate that we have working systems
    if (workingSystems.length === 0) {
      alert('❌ Cannot create exam: No working systems found!\n\nPlease mark at least one system as working before creating the exam.')
      return
    }
    
    // Validate that we have question assignments
    const assignments: { [systemId: number]: string[] } = {}
    let hasAssignments = false
    
    workingSystems.forEach(system => {
      if (system.assignedQuestions.length > 0) {
        assignments[system.id] = system.assignedQuestions
        hasAssignments = true
      }
    })
    
    if (!hasAssignments) {
      alert('❌ Cannot create exam: No question assignments found!\n\nPlease assign questions to working systems before creating the exam.')
      return
    }
    
    // Create layout object with ALL systems (working and non-working)
    const layout: LabLayout = {
      id: `layout_${Date.now()}`,
      name: `Layout ${length}x${breadth}`,
      length,
      breadth,
      systems: systems, // Include all systems, not just working ones
      createdAt: new Date().toISOString()
    }
    
    // Notify parent components
    onLayoutChange(layout)
    onQuestionAssignment(assignments)
    
    // Trigger exam creation/update
    if (isEditMode && onUpdateExam) {
      onUpdateExam()
    } else if (!isEditMode && onCreateExam) {
      onCreateExam()
    }
  }


  // Detect conflicts between adjacent systems (horizontal only)
  const detectConflicts = (assignments: { [systemId: number]: string[] }, workingSystems: LabSystem[]) => {
    const conflicts: { [systemId: number]: string[] } = {}
    
    console.log('=== CONFLICT DETECTION (HORIZONTAL ONLY) ===')
    console.log('Assignments:', assignments)
    console.log('Working systems count:', workingSystems.length)
    
    workingSystems.forEach((system, index) => {
      const systemQuestions = assignments[system.id] || []
      if (systemQuestions.length === 0) {
        console.log(`System ${system.id}: No questions assigned`)
        return
      }
      
      console.log(`\nSystem ${system.id} (R${system.row}C${system.col}) has questions: [${systemQuestions.join(',')}]`)
      
      const conflictingQuestions: string[] = []
      
      // Check horizontal adjacency only (previous and next in array)
      const horizontalAdjacents = []
      if (index > 0) horizontalAdjacents.push(workingSystems[index - 1])
      if (index < workingSystems.length - 1) horizontalAdjacents.push(workingSystems[index + 1])
      
      console.log(`  Horizontal adjacent systems: ${horizontalAdjacents.map(s => `${s.id}(R${s.row}C${s.col})`).join(', ')}`)
      
      horizontalAdjacents.forEach(adjSystem => {
        const adjQuestions = assignments[adjSystem.id] || []
        console.log(`    Comparing with system ${adjSystem.id}: [${adjQuestions.join(',')}]`)
        
        if (adjQuestions.length === 0) {
          console.log(`    System ${adjSystem.id} has no questions - no conflict`)
          return
        }
        
        const sharedQuestions = systemQuestions.filter(q => adjQuestions.includes(q))
        console.log(`    Shared questions: [${sharedQuestions.join(',')}]`)
        
        if (sharedQuestions.length > 0) {
          console.log(`    ⚠️ CONFLICT DETECTED: ${sharedQuestions.join(',')}`)
          conflictingQuestions.push(...sharedQuestions)
        } else {
          console.log(`    ✅ No conflict`)
        }
      })
      
      if (conflictingQuestions.length > 0) {
        conflicts[system.id] = [...new Set(conflictingQuestions)]
        console.log(`  🟠 System ${system.id} marked as CONFLICTED`)
      } else {
        console.log(`  🟢 System ${system.id} has no conflicts`)
      }
    })
    
    console.log('\n=== FINAL CONFLICTS ===', conflicts)
    return conflicts
  }

  // Get adjacent systems
  const getAdjacentSystems = (system: LabSystem, allSystems: LabSystem[]) => {
    const adjacent: LabSystem[] = []
    const { row, col } = system

    // Check left, right, up, down
    const directions = [
      { dr: 0, dc: -1 }, // left
      { dr: 0, dc: 1 },  // right
      { dr: -1, dc: 0 }, // up
      { dr: 1, dc: 0 }   // down
    ]

    directions.forEach(({ dr, dc }) => {
      const adjRow = row + dr
      const adjCol = col + dc
      const adjSystem = allSystems.find(s => s.row === adjRow && s.col === adjCol)
      if (adjSystem) {
        adjacent.push(adjSystem)
      }
    })

    console.log(`getAdjacentSystems for R${row}C${col}:`, adjacent.map(s => `R${s.row}C${s.col}`))
    return adjacent
  }

  // Clear assignments
  const clearAssignments = () => {
    const updatedSystems = systems.map(system => ({ ...system, assignedQuestions: [] }))
    setSystems(updatedSystems)
    setAssignmentResults({})
    setAssignmentStats(null)
    setShowStats(false)
    setConflicts({})
    
    // Notify parent with updated layout (no assignments)
    onQuestionAssignment({})
    
    // Update layout in parent
    const updatedLayout = {
      id: Date.now().toString(),
      name: 'Current Layout',
      length,
      breadth,
      systems: updatedSystems,
      createdAt: new Date().toISOString()
    }
    onLayoutChange(updatedLayout)
  }

  // Reset layout
  const resetLayout = () => {
    setSystems([])
    setIsCreating(false)
    setAssignmentResults({})
    setAssignmentStats(null)
    setShowStats(false)
    setConflicts({})
    
    // Notify parent that layout is cleared
    onLayoutChange(null as any)
    onQuestionAssignment({})
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>Lab Layout Creator</Typography>
      
      {/* Layout Configuration */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Lab Configuration</Typography>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              label="Length (rows)"
              type="number"
              value={length}
              onChange={(e) => setLength(Number(e.target.value))}
              inputProps={{ min: 1, max: 20 }}
              sx={{ width: 150 }}
              disabled={isCreating}
              helperText={isCreating ? "Reset layout to change" : ""}
            />
            <TextField
              label="Breadth (columns)"
              type="number"
              value={breadth}
              onChange={(e) => setBreadth(Number(e.target.value))}
              inputProps={{ min: 1, max: 20 }}
              sx={{ width: 150 }}
              disabled={isCreating}
              helperText={isCreating ? "Reset layout to change" : ""}
            />
            <Button
              variant="contained"
              onClick={createLayout}
              disabled={isCreating}
            >
              Create Layout
            </Button>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<SaveIcon />}
              onClick={() => setShowTemplateDialog(true)}
              disabled={!isCreating || systems.length === 0}
            >
              Save Template
            </Button>
            <Button
              variant="outlined"
              startIcon={<LoadIcon />}
              onClick={() => setShowLoadDialog(true)}
              disabled={savedTemplates.length === 0 || isCreating}
            >
              Load Template
            </Button>
            <Button
              variant="outlined"
              color="error"
              onClick={resetLayout}
              disabled={!isCreating}
            >
              Reset Layout
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Lab Grid */}
      {isCreating && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Lab Layout ({length} × {breadth} = {systems.length} systems)
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Click on systems to mark them as non-working (red). Working systems will be assigned serial numbers.
            </Typography>
            
            <Grid container spacing={1} sx={{ maxWidth: 800 }}>
              {systems.map((system) => (
                <Grid item xs={12 / breadth} key={system.id}>
                  <Paper
                    sx={{
                      p: 1,
                      textAlign: 'center',
                      cursor: 'pointer',
                      backgroundColor: system.isWorking 
                        ? (conflicts[system.id] ? 'warning.light' : system.assignedQuestions.length > 0 ? 'primary.light' : 'success.light')
                        : 'error.light',
                      color: system.isWorking 
                        ? (conflicts[system.id] ? 'warning.contrastText' : system.assignedQuestions.length > 0 ? 'primary.contrastText' : 'success.contrastText')
                        : 'error.contrastText',
                      border: system.isSelected ? '2px solid' : '1px solid',
                      borderColor: system.isSelected 
                        ? 'primary.main' 
                        : conflicts[system.id]
                          ? 'warning.main'
                          : system.assignedQuestions.length > 0 
                            ? 'primary.main' 
                            : 'grey.300',
                      '&:hover': {
                        backgroundColor: system.isWorking 
                          ? (system.assignedQuestions.length > 0 ? 'primary.main' : 'success.main')
                          : 'error.main',
                      },
                      minHeight: 80,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      position: 'relative'
                    }}
                    onClick={() => toggleSystemStatus(system.id)}
                  >
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      {system.isWorking ? <WorkingIcon sx={{ color: '#ffffff' }} /> : <BrokenSystemIcon sx={{ color: '#ffffff' }} />}
                      <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#ffffff' }}>
                        {system.serialNumber}
                      </Typography>
                      <Typography variant="caption" sx={{ fontSize: '0.7rem', color: '#ffffff' }}>
                        R{system.row}C{system.col}
                      </Typography>
                      {system.assignedQuestions.length > 0 && (
                        <Box sx={{ mt: 0.5, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 0.25 }}>
                          {system.assignedQuestions.map(q => {
                            const isConflicting = conflicts[system.id]?.includes(q)
                            return (
                              <Chip
                                key={q}
                                label={`Q${q}`}
                                size="small"
                                color={isConflicting ? "error" : "primary"}
                                sx={{ 
                                  fontSize: '0.5rem', 
                                  height: 16,
                                  '& .MuiChip-label': { px: 0.5 },
                                  border: isConflicting ? '1px solid red' : 'none'
                                }}
                              />
                            )
                          })}
                        </Box>
                      )}
                      {system.isWorking && system.assignedQuestions.length === 0 && (
                        <Typography variant="caption" sx={{ fontSize: '0.6rem', color: '#ffffff', fontWeight: 500 }}>
                          No questions
                        </Typography>
                      )}
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Question Assignment */}
      {isCreating && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>Question Assignment</Typography>
            <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
              <TextField
                label="Questions per student"
                type="number"
                value={questionsPerStudent}
                disabled
                sx={{ width: 200 }}
                helperText="From exam form"
              />
              <TextField
                label="Total questions available"
                type="number"
                value={totalQuestions}
                disabled
                sx={{ width: 200 }}
                helperText="From exam form"
              />
              <TextField
                label="Assignment Strategy"
                value="Smart Assignment"
                disabled
                sx={{ width: 200 }}
                helperText="Uses all questions efficiently with adjacency prevention"
              />
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                startIcon={<AssignmentIcon />}
                onClick={assignQuestions}
                disabled={systems.filter(s => s.isWorking).length === 0}
              >
                Assign Questions to All Systems
              </Button>
              <Button
                variant="outlined"
                color="error"
                onClick={clearAssignments}
                disabled={Object.keys(assignmentResults).length === 0}
              >
                Clear Assignments
              </Button>
              {assignmentStats && (
                <Button
                  variant="outlined"
                  onClick={() => setShowStats(!showStats)}
                  color="info"
                >
                  {showStats ? 'Hide' : 'Show'} Statistics
                </Button>
              )}
            </Box>
            
            {/* Assignment Statistics */}
            {showStats && assignmentStats && (
              <Box sx={{ mt: 2, p: 2, backgroundColor: (theme) => theme.palette.mode === 'dark' ? '#0F0F0F' : 'grey.50', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="h6" sx={{ mb: 1, color: 'text.primary' }}>Assignment Statistics</Typography>
                <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                  <Chip 
                    label={`Total Systems: ${assignmentStats.totalSystems}`} 
                    color="primary" 
                    variant="outlined" 
                  />
                  <Chip 
                    label={`Perfect Assignments: ${assignmentStats.successfulAssignments}`} 
                    color="success" 
                    variant="outlined" 
                  />
                  <Chip 
                    label={`Conflicts Resolved: ${assignmentStats.conflictsResolved}`} 
                    color="warning" 
                    variant="outlined" 
                  />
                  <Chip 
                    label={`Fallback Assignments: ${assignmentStats.fallbackAssignments}`} 
                    color="error" 
                    variant="outlined" 
                  />
                  <Chip 
                    label={`Adjacency Conflicts: ${Object.keys(conflicts).length}`} 
                    color={Object.keys(conflicts).length > 0 ? "error" : "success"} 
                    variant="outlined" 
                  />
                </Box>
                <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                  Strategy: Random Assignment with Adjacency Prevention
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create/Update Exam Button */}
      {isCreating && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
              <Button
                variant="contained"
                size="large"
                onClick={finalizeLayout}
                disabled={systems.filter(s => s.isWorking).length === 0 || examButtonDisabled}
                sx={{ minWidth: 200 }}
              >
                {isEditMode ? 'Update Exam with Layout' : 'Create Exam with Layout'}
              </Button>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 1 }}>
              {isEditMode 
                ? 'This will update the exam with the current lab layout and question assignments'
                : 'This will create the exam with the current lab layout and question assignments'
              }
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Save Template Dialog */}
      <Dialog open={showTemplateDialog} onClose={() => setShowTemplateDialog(false)}>
        <DialogTitle>Save Lab Layout Template</DialogTitle>
        <DialogContent>
          <TextField
            label="Template Name"
            fullWidth
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowTemplateDialog(false)}>Cancel</Button>
          <Button onClick={saveTemplate} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Load Template Dialog */}
      <Dialog open={showLoadDialog} onClose={() => setShowLoadDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Load Lab Layout Template</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            {savedTemplates.map((template) => (
              <Grid item xs={12} sm={6} md={4} key={template.id}>
                <Card 
                  sx={{ 
                    cursor: 'pointer',
                    '&:hover': { backgroundColor: 'primary.light', color: 'primary.contrastText' }
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Typography variant="h6" sx={{ flexGrow: 1, cursor: 'pointer' }} onClick={() => loadTemplate(template)}>
                        {template.name}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="Rename">
                          <IconButton 
                            size="small" 
                            onClick={(e) => {
                              e.stopPropagation()
                              renameTemplate(template)
                            }}
                            sx={{ color: 'primary.main' }}
                          >
                            <AssignmentIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton 
                            size="small" 
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteTemplate(template)
                            }}
                            sx={{ color: 'error.main' }}
                          >
                            <BrokenSystemIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                    <Typography variant="body2" sx={{ cursor: 'pointer' }} onClick={() => loadTemplate(template)}>
                      {template.length} × {template.breadth} = {template.systems.length} systems
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ cursor: 'pointer' }} onClick={() => loadTemplate(template)}>
                      Created: {new Date(template.createdAt).toLocaleDateString()}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowLoadDialog(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Rename Template Dialog */}
      <Dialog open={showRenameDialog} onClose={() => setShowRenameDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Rename Template</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Template Name"
            fullWidth
            variant="outlined"
            value={editingTemplateName}
            onChange={(e) => setEditingTemplateName(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                saveRenamedTemplate()
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowRenameDialog(false)}>Cancel</Button>
          <Button 
            onClick={saveRenamedTemplate} 
            variant="contained"
            disabled={!editingTemplateName.trim()}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Insufficient Questions Confirmation Dialog */}
      <Dialog 
        open={showInsufficientQuestionsDialog} 
        onClose={() => setShowInsufficientQuestionsDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>⚠️ Insufficient Questions Warning</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            You are trying to assign <strong>{insufficientQuestionsInfo?.questionsPerStudent} questions per student</strong> 
            but only have <strong>{insufficientQuestionsInfo?.current} questions</strong> available.
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            For adjacency-free assignment, you need at least <strong>{insufficientQuestionsInfo?.required} questions</strong>.
          </Typography>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Warning:</strong> Proceeding with insufficient questions will result in:
            </Typography>
            <Typography variant="body2" component="ul" sx={{ mt: 1, pl: 2 }}>
              <li>Adjacent students getting the same questions</li>
              <li>Some students not getting the required number of questions</li>
              <li>Suboptimal question distribution</li>
            </Typography>
          </Alert>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to proceed with this configuration?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setShowInsufficientQuestionsDialog(false)}
            color="primary"
          >
            Cancel
          </Button>
          <Button 
            onClick={proceedWithInsufficientQuestions}
            color="warning"
            variant="contained"
          >
            Proceed Anyway
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
