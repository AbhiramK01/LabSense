import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Chip,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Divider,
  MenuItem
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Assignment as AssignmentIcon,
  History as HistoryIcon,
  School as SchoolIcon,
  AccessTime as TimeIcon,
  Code as CodeIcon,
  CheckCircle as CheckIcon,
  Schedule as ScheduleIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import {
  getStudentExamHistory,
  StudentExamHistory,
  StudentExamInfo,
  joinExam,
  StudentJoinRequest,
  whoami
} from '../api';
import StudentResults from './StudentResults';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const EnhancedStudentDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [examHistory, setExamHistory] = useState<StudentExamHistory | null>({
    available_exams: [],
    in_progress_exams: [],
    completed_exams: []
  } as any);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<StudentExamInfo | null>(null);
  const [startCode, setStartCode] = useState('');
  const [studentInfo, setStudentInfo] = useState<{
    rollNumber?: string;
    departmentName?: string;
    year?: number;
    sectionName?: string;
  } | null>(null);
  const [recentlyFinished, setRecentlyFinished] = useState(false);
  const [resultsRefreshKey, setResultsRefreshKey] = useState(0);
  // Simple filters/sorts for Available and In-Progress
  const [availSort, setAvailSort] = useState<'name_asc' | 'duration_asc' | 'duration_desc'>('name_asc');
  const [progressSort, setProgressSort] = useState<'name_asc' | 'joined_desc' | 'joined_asc'>('joined_desc');
  const [languageFilter, setLanguageFilter] = useState<string>('all');

  const allLanguages = useMemo(() => {
    const set = new Set<string>();
    (examHistory?.available_exams || []).forEach((e: any) => e?.language && set.add(String(e.language).toUpperCase()));
    (examHistory?.in_progress_exams || []).forEach((e: any) => e?.language && set.add(String(e.language).toUpperCase()));
    return ['ALL', ...Array.from(set.values()).sort()];
  }, [examHistory]);

  // Sorting helper to avoid closure/stale-state issues
  const getSortedExams = (list: StudentExamInfo[], which: 'available' | 'progress'): StudentExamInfo[] => {
    const normalizeDuration = (val: any): number => {
      if (typeof val === 'number') return val;
      if (typeof val === 'string') {
        const m = val.match(/\d+/);
        return m ? parseInt(m[0], 10) : 0;
      }
      return 0;
    };
    const normalizeJoined = (val: any): number => {
      if (!val && val !== 0) return 0;
      if (typeof val === 'number') {
        // treat <= 10 digits as seconds
        const ms = val < 2_000_000_000 ? val * 1000 : val;
        const t = new Date(ms).getTime();
        return isNaN(t) ? 0 : t;
      }
      if (typeof val === 'string') {
        const trimmed = val.trim();
        if (/^\d+$/.test(trimmed)) {
          const num = parseInt(trimmed, 10);
          const ms = num < 2_000_000_000 ? num * 1000 : num;
          const t = new Date(ms).getTime();
          return isNaN(t) ? 0 : t;
        }
        const t = Date.parse(trimmed);
        return isNaN(t) ? 0 : t;
      }
      return 0;
    };
    const cmpName = (a: any, b: any) => String(a || '').localeCompare(String(b || ''), undefined, { numeric: true, sensitivity: 'base' });

    const copy = list.slice();
    try {
      const dbg = copy.map(e => ({ id: e.exam_id, name: e.subject_name, dur: e.duration_minutes, joined: e.joined_at }))
      console.log(`🔍 Sorting (${which}) with`, which === 'available' ? availSort : progressSort, dbg)
    } catch {}
    if (which === 'available') {
      switch (availSort) {
        case 'duration_asc':
          return copy.sort((a, b) => normalizeDuration(a.duration_minutes) - normalizeDuration(b.duration_minutes));
        case 'duration_desc':
          return copy.sort((a, b) => normalizeDuration(b.duration_minutes) - normalizeDuration(a.duration_minutes));
        case 'name_asc':
        default:
          return copy.sort((a, b) => cmpName(a.subject_name, b.subject_name));
      }
    } else {
      switch (progressSort) {
        case 'joined_asc':
          return copy.sort((a, b) => normalizeJoined(a.joined_at) - normalizeJoined(b.joined_at));
        case 'name_asc':
          return copy.sort((a, b) => cmpName(a.subject_name, b.subject_name));
        case 'joined_desc':
        default:
          return copy.sort((a, b) => normalizeJoined(b.joined_at) - normalizeJoined(a.joined_at));
      }
    }
  }

  useEffect(() => {
    loadExamHistory();
    loadStudentInfo();
  }, []);

  const loadStudentInfo = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Get user info from whoami (now includes student details)
      const userInfo = await whoami(token);
      
      // Check if user is a student and has student info
      if (userInfo.role !== 'student') {
        return;
      }

      // Use student info from whoami response
      setStudentInfo({
        rollNumber: userInfo.roll_number,
        departmentName: userInfo.department_name,
        year: userInfo.year,
        sectionName: userInfo.section_name
      });
    } catch (err) {
      console.error('Failed to load student info:', err);
      // Silently fail - student info is not critical
    }
  };

  // Refresh exam history when component becomes visible (user navigates back)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadExamHistory();
      }
    };

    const handleFocus = () => {
      loadExamHistory();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Listen for exam auto-finish events to immediately refresh exam history
  useEffect(() => {
    // Get user-specific prefix from token (same logic as StudentDashboard)
    const token = localStorage.getItem('token') || '';
    const userPrefix = token.slice(0, 16);
    
    const handleExamFinished = (event: Event) => {
      const customEvent = event as CustomEvent;
      const eventUserPrefix = customEvent?.detail?.userPrefix;
      const finishedExamId = customEvent?.detail?.examId;
      
      // Only process events for this user (filter out events from other students on same system)
      if (eventUserPrefix !== userPrefix) {
        console.log('🔄 Ignoring exam-auto-finished event from different user (userPrefix mismatch)');
        return;
      }
      
      if (!finishedExamId) {
        console.warn('🔄 Exam-auto-finished event missing examId, skipping');
        return;
      }
      
      console.log('🔄 Exam auto-finished event received for exam:', finishedExamId, '- immediately removing from in-progress...');
      setRecentlyFinished(true);
      setResultsRefreshKey(k => k + 1);
      setActiveTab(1);
      
      // Immediately update local state to remove from in-progress (optimistic update)
      setExamHistory((prevHistory) => {
        if (prevHistory && prevHistory.in_progress_exams) {
          // Double-check: only remove if this exam is actually in our in-progress list
          const examExists = prevHistory.in_progress_exams.some((exam: StudentExamInfo) => exam.exam_id === finishedExamId);
          if (!examExists) {
            console.log(`⚠️ Exam ${finishedExamId} not found in in-progress list, skipping removal`);
            return prevHistory;
          }
          
          const updatedInProgress = prevHistory.in_progress_exams.filter((exam: StudentExamInfo) => {
            return exam.exam_id !== finishedExamId;
          });
          
          console.log(`✅ Removed exam ${finishedExamId} from in-progress list (optimistic update)`);
          return {
            ...prevHistory,
            in_progress_exams: updatedInProgress
          };
        }
        return prevHistory;
      });
      
      // Jump to Results tab to let the user see scores asap
      setActiveTab(2);
      // Then refresh from server to get accurate state (submission happens in background)
      loadExamHistory();
      
      // Clean up user-specific localStorage
      localStorage.removeItem(`exam-auto-finished-${userPrefix}`);
      localStorage.removeItem(`last-exam-id-${userPrefix}`);
    };

    // Listen for custom event when exam auto-finishes
    window.addEventListener('exam-auto-finished', handleExamFinished);
    
    // Check localStorage for auto-finish flag (set by StudentDashboard when exam expires)
    // This handles the case when user navigates back after exam auto-finishes
    const checkAutoFinish = () => {
      const autoFinished = localStorage.getItem(`exam-auto-finished-${userPrefix}`);
      const finishedExamId = localStorage.getItem(`last-exam-id-${userPrefix}`);
      
      if (autoFinished && finishedExamId) {
        console.log('🔄 Auto-finish flag found for exam:', finishedExamId, '- immediately removing from in-progress...');
        setRecentlyFinished(true);
        
        // Immediately remove from local state (optimistic update)
        setExamHistory((prevHistory) => {
          if (prevHistory && prevHistory.in_progress_exams) {
            // Double-check: only remove if this exam is actually in our in-progress list
            const examExists = prevHistory.in_progress_exams.some((exam: StudentExamInfo) => exam.exam_id === finishedExamId);
            if (!examExists) {
              console.log(`⚠️ Exam ${finishedExamId} not found in in-progress list, skipping removal`);
              return prevHistory;
            }
            
            const updatedInProgress = prevHistory.in_progress_exams.filter((exam: StudentExamInfo) => {
              return exam.exam_id !== finishedExamId;
            });
            
            console.log(`✅ Removed exam ${finishedExamId} from in-progress list (optimistic update)`);
            return {
              ...prevHistory,
              in_progress_exams: updatedInProgress
            };
          }
          return prevHistory;
        });
        
        setActiveTab(1);
        loadExamHistory();
        localStorage.removeItem(`exam-auto-finished-${userPrefix}`);
        localStorage.removeItem(`last-exam-id-${userPrefix}`);
      }
    };
    
    // Check on mount (when user navigates back to dashboard)
    checkAutoFinish();

    return () => {
      window.removeEventListener('exam-auto-finished', handleExamFinished);
    };
  }, []);

  const loadExamHistory = async () => {
    // Keep existing data visible, fetch new in background
    setLoading(true);
    setError(null);
    try {
      const history = await getStudentExamHistory();
      // Normalize arrays
      const normalized: any = {
        ...history,
        available_exams: Array.isArray((history as any)?.available_exams) ? (history as any).available_exams : [],
        in_progress_exams: Array.isArray((history as any)?.in_progress_exams) ? (history as any).in_progress_exams : [],
        completed_exams: Array.isArray((history as any)?.completed_exams) ? (history as any).completed_exams : []
      };
      
      // API is authoritative - use its data, but preserve existing during loading
      setExamHistory(prev => {
        // If API returned empty arrays, preserve existing data (might be temporary loading state)
        // BUT: if we have no existing data, show empty (first load with no exams)
        if (prev && normalized.available_exams.length === 0 && normalized.in_progress_exams.length === 0 && normalized.completed_exams.length === 0) {
          // API returned empty - could be temporary or real. Keep existing to avoid flicker.
          // NOTE: This means if faculty adds new exam, student needs to refresh again after API updates
          return prev;
        }
        // API returned data (even partial) - use it (it's authoritative and includes new exams from faculty)
        // This ensures new exams added by faculty are immediately visible
        return normalized;
      });
      setLoading(false); // Stop loading immediately after showing data
    } catch (err: any) {
      setError(err.message || 'Failed to load exam history');
      // On error, keep existing data - don't clear it
      setExamHistory(prev => {
        if (prev) {
          return prev; // Keep existing data
        }
        // No existing data - set empty structure
        return {
          available_exams: [],
          in_progress_exams: [],
          completed_exams: []
        } as any;
      });
      setLoading(false);
    }
  };

  // Short-lived polling after a finish to reflect server updates quickly
  useEffect(() => {
    if (!recentlyFinished) return;
    let attempts = 0;
    const maxAttempts = 6; // ~18s at 3s interval
    const interval = setInterval(async () => {
      attempts += 1;
      try {
        await loadExamHistory();
      } catch {}
      if (attempts >= maxAttempts) {
        clearInterval(interval);
        setRecentlyFinished(false);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [recentlyFinished]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleJoinExam = (exam: StudentExamInfo) => {
    setSelectedExam(exam);
    setStartCode('');
    setJoinDialogOpen(true);
  };

  const handleJoinSubmit = async () => {
    if (!selectedExam || !startCode.trim()) {
      setError('Please enter the start code');
      return;
    }

    try {
      setError(null);
      console.log('Attempting to join exam:', selectedExam.exam_id);
      
      const joinRequest: StudentJoinRequest = {
        exam_id: selectedExam.exam_id,
        start_code: startCode.trim()
      };
      
      console.log('Join request:', joinRequest);
      const result = await joinExam(joinRequest);
      console.log('Join exam result:', result);
      
      // Only redirect on success
      setJoinDialogOpen(false);
      setSelectedExam(null);
      setStartCode('');
      
      // Redirect to exam page with start code as parameter
      window.location.href = `/student/exam/${selectedExam.exam_id}?startCode=${encodeURIComponent(startCode)}`;
    } catch (err: any) {
      console.error('Join exam error:', err);
      console.error('Error details:', err.message, err.stack);
      setError(err.message || 'Failed to join exam');
      // Don't redirect on error - stay on the same page
    }
  };

  const handleJoinDialogClose = () => {
    setJoinDialogOpen(false);
    setSelectedExam(null);
    setStartCode('');
    setError(null);
  };

  const getStatusChip = (exam: StudentExamInfo) => {
    if (exam.finished) {
      return <Chip icon={<CheckIcon />} label="Completed" color="success" size="small" />;
    } else if (exam.serial_number) {
      return <Chip icon={<ScheduleIcon />} label="In Progress" color="warning" size="small" />;
    } else {
      return <Chip icon={<PlayIcon />} label="Available" color="primary" size="small" />;
    }
  };

  const getLanguageIcon = (language: string) => {
    return <CodeIcon />;
  };

  const renderExamCard = (exam: StudentExamInfo, showJoinButton: boolean = true) => (
    <Card key={exam.exam_id} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Typography variant="h6" component="h2">
            {exam.subject_name}
          </Typography>
          {getStatusChip(exam)}
        </Box>
        
        <Box display="flex" alignItems="center" gap={1} mb={1}>
          {getLanguageIcon(exam.language)}
          <Typography variant="body2" color="text.secondary">
            {exam.language.toUpperCase()}
          </Typography>
        </Box>
        
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <TimeIcon fontSize="small" />
          <Typography variant="body2" color="text.secondary">
            {exam.duration_minutes} minutes
          </Typography>
        </Box>
        
        {exam.num_questions && (
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <AssignmentIcon fontSize="small" />
            <Typography variant="body2" color="text.secondary">
              {exam.questions_per_student} of {exam.num_questions} questions
            </Typography>
          </Box>
        )}
        
        {exam.serial_number && (
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <SchoolIcon fontSize="small" />
            <Typography variant="body2" color="text.secondary">
              System Number: {exam.serial_number}
            </Typography>
          </Box>
        )}
        
        {exam.joined_at && (
          <Typography variant="caption" color="text.secondary">
            Joined: {new Date(exam.joined_at).toLocaleString()}
          </Typography>
        )}
      </CardContent>
      
      {showJoinButton && !exam.finished && !exam.serial_number && (
        <Box sx={{ p: 2, pt: 0 }}>
          <Button
            variant="contained"
            fullWidth
            startIcon={<PlayIcon />}
            onClick={() => handleJoinExam(exam)}
          >
            Join Exam
          </Button>
        </Box>
      )}
      
      {/* Rejoin/Continue disabled by policy */}
    </Card>
  );

  const renderExamTable = (exams: StudentExamInfo[], title: string) => (
    <Box>
      <Typography variant="h6" gutterBottom>
        {title} ({exams.length})
      </Typography>
      {/* Controls */}
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2, flexWrap: 'wrap' }}>
        <TextField
          select
          size="small"
          label="Language"
          value={languageFilter.toUpperCase()}
          onChange={(e) => setLanguageFilter(String(e.target.value).toLowerCase())}
          sx={{ width: 160 }}
        >
          {allLanguages.map(l => (
            <MenuItem key={l} value={l}>{l}</MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          label="Sort"
          value={title.includes('Available') ? availSort : progressSort}
          onChange={(e) => title.includes('Available') ? setAvailSort(e.target.value as any) : setProgressSort(e.target.value as any)}
          sx={{ width: 200 }}
        >
          {title.includes('Available')
            ? [
                <MenuItem key="name_asc" value="name_asc">Name: A → Z</MenuItem>,
                <MenuItem key="duration_asc" value="duration_asc">Duration: Low → High</MenuItem>,
                <MenuItem key="duration_desc" value="duration_desc">Duration: High → Low</MenuItem>,
              ]
            : [
                <MenuItem key="joined_desc" value="joined_desc">Joined: Newest</MenuItem>,
                <MenuItem key="joined_asc" value="joined_asc">Joined: Oldest</MenuItem>,
                <MenuItem key="name_asc" value="name_asc">Name: A → Z</MenuItem>,
              ]}
        </TextField>
        {(languageFilter !== 'all') && (
          <Button size="small" onClick={() => setLanguageFilter('all')}>Clear</Button>
        )}
      </Box>
      {exams.length === 0 ? (
        <Card>
          <CardContent>
            <Typography variant="body2" color="text.secondary" align="center">
              No {title.toLowerCase()} found
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {getSortedExams(
              exams.filter((e) => languageFilter === 'all' || String(e.language).toLowerCase() === languageFilter),
              title.includes('Available') ? 'available' : 'progress'
            )
            .map((exam) => (
            <Grid item xs={12} sm={6} md={4} key={exam.exam_id}>
              {renderExamCard(exam)}
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );

  return (
    <Box sx={{ width: '100%', p: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Student Dashboard
          </Typography>
          {studentInfo && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1, flexWrap: 'wrap' }}>
              {studentInfo.rollNumber && (
                <Chip 
                  label={`Roll No: ${studentInfo.rollNumber}`} 
                  size="small" 
                  sx={{ fontSize: '0.75rem' }}
                />
              )}
              {studentInfo.departmentName && (
                <Chip 
                  label={`Dept: ${studentInfo.departmentName}`} 
                  size="small" 
                  sx={{ fontSize: '0.75rem' }}
                />
              )}
              {studentInfo.year && (
                <Chip 
                  label={`Year: ${studentInfo.year}`} 
                  size="small" 
                  sx={{ fontSize: '0.75rem' }}
                />
              )}
              {studentInfo.sectionName && (
                <Chip 
                  label={`Section: ${studentInfo.sectionName}`} 
                  size="small" 
                  sx={{ fontSize: '0.75rem' }}
                />
              )}
            </Box>
          )}
        </Box>
        <Box display="flex" alignItems="center" gap={2}>
          {loading && (
            <Box display="flex" alignItems="center" gap={1}>
              <CircularProgress size={18} />
              <Typography variant="body2" color="text.secondary">Updating…</Typography>
            </Box>
          )}
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => { loadExamHistory(); setResultsRefreshKey(k => k + 1); }}
          >
            Refresh
          </Button>
        </Box>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab 
              icon={<PlayIcon />} 
              label={`Available Exams (${examHistory?.available_exams.length || 0})`} 
              iconPosition="start"
            />
            <Tab 
              icon={<HistoryIcon />} 
              label="Results" 
              iconPosition="start"
            />
          </Tabs>
        </Box>
        
        <TabPanel value={activeTab} index={0}>
          {renderExamTable(examHistory?.available_exams || [], 'Available Exams')}
        </TabPanel>
        
        <TabPanel value={activeTab} index={1}>
          <StudentResults onBack={() => setActiveTab(0)} refreshKey={resultsRefreshKey} />
        </TabPanel>
      </Card>
      
      {/* Join Exam Dialog */}
      <Dialog open={joinDialogOpen} onClose={handleJoinDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          Join Exam: {selectedExam?.subject_name}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Please enter the start code provided by your instructor to join this exam.
          </Typography>
          
          <TextField
            autoFocus
            margin="dense"
            label="Start Code"
            fullWidth
            variant="outlined"
            value={startCode}
            onChange={(e) => setStartCode(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleJoinDialogClose}>Cancel</Button>
          <Button onClick={handleJoinSubmit} variant="contained">
            Join Exam
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EnhancedStudentDashboard;
