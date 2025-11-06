import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Divider,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Tooltip,
  Badge,
  useTheme,
  MenuItem,
  TextField as MUITextField
} from '@mui/material';
import TableSortLabel from '@mui/material/TableSortLabel';
import {
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
  Visibility as VisibilityIcon,
  Star as StarIcon,
  Flag as FlagIcon,
  Code as CodeIcon,
  Warning as WarningIcon,
  Download as DownloadIcon,
  Print as PrintIcon
} from '@mui/icons-material';
import { getStudentExamHistory, getMySubmissions, whoami } from '../api';
import { generateStudentReport, generateSingleExamReport, downloadReport, printReport } from '../utils/reportGenerator';

// Get token from localStorage
const getToken = () => {
  return localStorage.getItem('token') || '';
};

interface StudentResult {
  exam_id: string;
  subject_name: string;
  language: string;
  duration_minutes: number;
  department_name?: string;
  section_name?: string;
  year?: number;
  score?: number;
  submitted_at?: string;
  status: 'completed' | 'in_progress' | 'available';
  exam_version?: number;
  original_subject_name?: string;
  finished?: boolean;
  best_score?: number;
  final_score?: number;
  submission_count?: number;
}

interface Submission {
  question_id: string;
  code: string;
  score: number;
  passed: boolean;
  public_case_results: boolean[];
  detailed_results?: any[];
  submitted_at: string;
  is_final: boolean;
  is_best: boolean;
  ideal_solution?: string;
  // LLM evaluation fields
  effort_score?: number;
  logic_similarity?: number;
  correctness?: number;
  llm_feedback?: {
    feedback?: string;
    critic?: string;
    improvements?: string;
    scope_for_improvement?: string;
  };
}

interface StudentResultsProps {
  onBack: () => void;
  refreshKey?: number;
}

const StudentResults: React.FC<StudentResultsProps> = ({ onBack, refreshKey }) => {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'

  // Helper to format feedback text as bullet points and extract code snippets
  const formatFeedbackAsBullets = (text: string): string[] => {
    if (!text || typeof text !== 'string') return []
    
    let cleanedText = text.trim()
    
    // Clean up JSON-like structures: {fix_needed: ..., why: ..., code_change: ...}
    // Replace with readable format
    cleanedText = cleanedText.replace(/\{fix_needed:\s*([^,}]+),?\s*why:\s*([^,}]+),?\s*code_change:\s*([^}]+)\}/gi, 
      (match, fix, why, code) => {
        return `${fix.trim()}. ${why.trim()} Change: ${code.trim()}`;
      });
    
    // Clean up other common JSON-like patterns
    cleanedText = cleanedText.replace(/\{([^}]+)\}/g, (match, content) => {
      // Try to extract meaningful parts
      const parts = content.split(',').map((p: string) => {
        const colonIndex = p.indexOf(':');
        if (colonIndex > 0) {
          return p.substring(colonIndex + 1).trim();
        }
        return p.trim();
      }).filter(Boolean);
      return parts.join('. ');
    });
    
    // Handle Python list format: ['item1', 'item2'] or ["item1", "item2"]
    
    // Check if it looks like a Python/JSON list
    if ((cleanedText.startsWith('[') && cleanedText.endsWith(']')) || 
        (cleanedText.startsWith('(') && cleanedText.endsWith(')'))) {
      try {
        // Try to parse as JSON array
        const parsed = JSON.parse(cleanedText)
        if (Array.isArray(parsed)) {
          return parsed.map(item => String(item).trim()).filter(item => item.length > 0)
        }
      } catch {
        // If JSON parsing fails, manually extract items
        // Remove outer brackets
        cleanedText = cleanedText.replace(/^[\[\]\(\)]/, '').replace(/[\[\]\(\)]$/, '')
        // Split by comma but preserve quoted strings
        const items: string[] = []
        let current = ''
        let inQuotes = false
        let quoteChar = ''
        
        for (let i = 0; i < cleanedText.length; i++) {
          const char = cleanedText[i]
          if ((char === '"' || char === "'") && (i === 0 || cleanedText[i-1] !== '\\')) {
            if (!inQuotes) {
              inQuotes = true
              quoteChar = char
            } else if (char === quoteChar) {
              inQuotes = false
              quoteChar = ''
            } else {
              current += char
            }
          } else if (char === ',' && !inQuotes) {
            const trimmed = current.trim().replace(/^['"]|['"]$/g, '').trim()
            if (trimmed) items.push(trimmed)
            current = ''
          } else {
            current += char
          }
        }
        // Add last item
        const trimmed = current.trim().replace(/^['"]|['"]$/g, '').trim()
        if (trimmed) items.push(trimmed)
        
        if (items.length > 0) {
          return items
        }
      }
    }
    
    // Default: Split by newlines or bullet markers
    const lines = cleanedText
      .split(/\n+/)
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => {
        // Remove existing bullet markers and clean up
        return line.replace(/^[•\-\*→]\s*/, '').trim()
      })
    
    return lines.length > 0 ? lines : [cleanedText]
  }

  // Helper to render feedback text with code snippet highlighting
  const renderFeedbackText = (text: string, isError: boolean = false) => {
    if (!text || typeof text !== 'string') return null
    
    // Split text and highlight code snippets (backtick-wrapped)
    const parts: (string | JSX.Element)[] = []
    const codeRegex = /`([^`]+)`/g
    let lastIndex = 0
    let match
    let key = 0

    while ((match = codeRegex.exec(text)) !== null) {
      // Add text before code
      if (match.index > lastIndex) {
        const beforeText = text.substring(lastIndex, match.index)
        if (beforeText) {
          parts.push(beforeText)
        }
      }
      // Add code snippet with highlighting
      parts.push(
        <Box
          key={key++}
          component="code"
          sx={{
            display: 'inline',
            bgcolor: isError ? (isDark ? 'rgba(244, 67, 54, 0.2)' : 'rgba(244, 67, 54, 0.1)') : (isDark ? 'rgba(76, 175, 80, 0.2)' : 'rgba(76, 175, 80, 0.1)'),
            color: isError ? 'error.main' : 'success.main',
            px: 0.75,
            py: 0.25,
            borderRadius: '4px',
            fontFamily: 'monospace',
            fontSize: '0.8125rem',
            fontWeight: 500,
            border: `1px solid ${isError ? 'rgba(244, 67, 54, 0.3)' : 'rgba(76, 175, 80, 0.3)'}`
          }}
        >
          {match[1]}
        </Box>
      )
      lastIndex = match.index + match[0].length
    }
    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex))
    }

    return parts.length > 0 ? <>{parts}</> : <>{text}</>
  }
  const [results, setResults] = useState<StudentResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submissionsDialog, setSubmissionsDialog] = useState<{
    open: boolean;
    examId: string;
    examName: string;
    submissions: Submission[];
  }>({
    open: false,
    examId: '',
    examName: '',
    submissions: []
  });
  const [viewMode, setViewMode] = useState<'all' | 'best' | 'final'>('all');
  const [expandedCodeIndex, setExpandedCodeIndex] = useState<string | null>(null);
  const [studentInfo, setStudentInfo] = useState<{
    rollNumber?: string;
    departmentName?: string;
    year?: number;
    sectionName?: string;
    name?: string;
  } | null>(null);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [processingMap, setProcessingMap] = useState<Record<string, boolean>>({});
  const retryAttemptsRef = React.useRef<Record<string, number>>({});
  const pollingRef = React.useRef<NodeJS.Timeout | null>(null);
  // Filters & sorting state
  const [searchText, setSearchText] = useState('');
  const [languageFilter, setLanguageFilter] = useState<string>('all');
  const [minScore, setMinScore] = useState<string>('');
  const [maxScore, setMaxScore] = useState<string>('');
  const [sortBy, setSortBy] = useState<'submitted_desc' | 'submitted_asc' | 'score_desc' | 'score_asc' | 'name_asc' | 'name_desc' | 'duration_asc' | 'duration_desc' | 'language_asc' | 'language_desc'>('submitted_desc');

  const sortState = useMemo(() => {
    const map: Record<string, { key: string; dir: 'asc'|'desc' }> = {
      name_asc: { key: 'name', dir: 'asc' },
      name_desc: { key: 'name', dir: 'desc' },
      language_asc: { key: 'language', dir: 'asc' },
      language_desc: { key: 'language', dir: 'desc' },
      duration_asc: { key: 'duration', dir: 'asc' },
      duration_desc: { key: 'duration', dir: 'desc' },
      score_asc: { key: 'score', dir: 'asc' },
      score_desc: { key: 'score', dir: 'desc' },
      submitted_asc: { key: 'submitted', dir: 'asc' },
      submitted_desc: { key: 'submitted', dir: 'desc' }
    };
    return map[sortBy];
  }, [sortBy]);

  const toggleSort = (key: 'name'|'language'|'duration'|'score'|'submitted') => {
    setSortBy(prev => {
      const current = sortState;
      if (current.key === key) {
        // toggle direction
        const nextDir = current.dir === 'asc' ? 'desc' : 'asc';
        return `${key}_${nextDir}` as any;
      }
      // set ascending by default
      return `${key}_asc` as any;
    });
  };

  // Unique languages present
  const availableLanguages = useMemo(() => {
    const set = new Set<string>();
    results.forEach(r => { if (r?.language) set.add(r.language.toUpperCase()); });
    return ['ALL', ...Array.from(set.values()).sort()];
  }, [results]);

  // Apply filters and sorting without mutating original results
  const visibleResults = useMemo(() => {
    const min = minScore.trim() === '' ? -Infinity : Number(minScore);
    const max = maxScore.trim() === '' ? Infinity : Number(maxScore);

    let list = results.filter(r => {
      const name = (r.original_subject_name || r.subject_name || '').toLowerCase();
      const matchesSearch = searchText.trim() === '' || name.includes(searchText.toLowerCase());
      const langOk = languageFilter === 'all' || (r.language || '').toUpperCase() === languageFilter.toUpperCase();
      const s = typeof r.score === 'number' ? r.score : NaN;
      const scoreOk = (isNaN(s) && (min === -Infinity && max === Infinity)) || (!isNaN(s) && s >= min && s <= max);
      return matchesSearch && langOk && scoreOk;
    });

    const by = sortBy;
    list = list.slice().sort((a, b) => {
      const an = (a.original_subject_name || a.subject_name || '').toLowerCase();
      const bn = (b.original_subject_name || b.subject_name || '').toLowerCase();
      const ad = a.submitted_at ? new Date(a.submitted_at).getTime() : 0;
      const bd = b.submitted_at ? new Date(b.submitted_at).getTime() : 0;
      const as = typeof a.score === 'number' ? a.score : -Infinity;
      const bs = typeof b.score === 'number' ? b.score : -Infinity;
      const al = (a.language || '').toLowerCase();
      const bl = (b.language || '').toLowerCase();
      const aur = typeof a.duration_minutes === 'number' ? a.duration_minutes : 0;
      const bur = typeof b.duration_minutes === 'number' ? b.duration_minutes : 0;
      switch (by) {
        case 'submitted_asc': return ad - bd;
        case 'submitted_desc': return bd - ad;
        case 'score_asc': return as - bs;
        case 'score_desc': return bs - as;
        case 'duration_asc': return aur - bur;
        case 'duration_desc': return bur - aur;
        case 'language_asc': return al.localeCompare(bl);
        case 'language_desc': return bl.localeCompare(al);
        case 'name_desc': return bn.localeCompare(an);
        case 'name_asc':
        default: return an.localeCompare(bn);
      }
    });
    return list;
  }, [results, searchText, languageFilter, minScore, maxScore, sortBy]);

  useEffect(() => {
    loadResults();
    loadStudentInfo();
  }, [refreshKey]);

  const loadStudentInfo = async () => {
    try {
      const token = getToken();
      if (!token) return;

      const userInfo = await whoami(token);
      if (userInfo.role !== 'student') {
        return;
      }

      setStudentInfo({
        rollNumber: userInfo.roll_number,
        departmentName: userInfo.department_name,
        year: userInfo.year,
        sectionName: userInfo.section_name,
        name: userInfo.name || userInfo.username
      });
    } catch (err) {
      console.error('Failed to load student info:', err);
    }
  };

  const loadResults = async () => {
    // Keep existing data visible, fetch new in background
    setError(null);
    setLoading(true);
    try {
      const history = await getStudentExamHistory();
      // Use completed_exams directly from API
      const completedExams = [
        ...(history.completed_exams || []),
        ...(history.in_progress_exams || []).filter((exam: any) => exam.finished === true)
      ];
      
      // Create new results with placeholders
      const immediateResults = completedExams.map((exam: any) => ({
        ...exam,
        status: 'completed' as const,
        score: undefined,
        best_score: undefined,
        final_score: undefined,
        submission_count: undefined,
        submitted_at: exam.joined_at
      }));
      
      // Merge with existing - ALWAYS preserve existing data
      setResults(prev => {
        // If we have existing data, always preserve it
        if (prev.length > 0) {
          if (immediateResults.length === 0) {
            // API returned nothing - keep existing data
            return prev;
          }
          // Merge new with existing, preserving scores from existing
          const existingMap = new Map(prev.map(r => [`${r.exam_id}-${r.exam_version || 1}`, r]));
          const merged = immediateResults.map(newExam => {
            const key = `${newExam.exam_id}-${newExam.exam_version || 1}`;
            const existing = existingMap.get(key);
            // Keep existing if it has scores, otherwise use new placeholder
            return existing && (existing.score !== undefined || existing.best_score !== undefined)
              ? existing
              : newExam;
          });
          // Keep any existing exams not in new list (preserve old exams)
          const newKeys = new Set(merged.map(r => `${r.exam_id}-${r.exam_version || 1}`));
          const preserved = prev.filter(r => !newKeys.has(`${r.exam_id}-${r.exam_version || 1}`));
          return [...merged, ...preserved];
        }
        // No existing data - use new data (even if empty, will show "No completed exams")
        return immediateResults;
      });
      
      setLoading(false); // Stop loading immediately
      
      // Helper to fetch and update one exam; schedules retries if processing is detected
      const fetchAndUpdateExam = async (exam: any) => {
        try {
          const submissionsData = await getMySubmissions(getToken(), exam.exam_id, exam.exam_version);
          const submissions = submissionsData.submissions || [];
          const examKey = `${exam.exam_id}-${exam.exam_version || 1}`;

          // Calculate per-question best/final and aggregate best as final score for display
          const byQuestion: Record<string, any[]> = {};
          for (const s of submissions) {
            const qid = s?.question_id || 'unknown';
            if (!byQuestion[qid]) byQuestion[qid] = [];
            byQuestion[qid].push(s);
          }

          let perQuestionBestScores: number[] = [];
          let perQuestionFinalScores: number[] = [];
          let hasAnyValidScore = false;
          for (const qid of Object.keys(byQuestion)) {
            const subsForQ = byQuestion[qid];
            // Filter out submissions that are still processing (0 is a valid score!)
            const validSubs = subsForQ.filter((s: any) => {
              // Score must be a number (including 0, which is valid)
              const hasScore = typeof s?.score === 'number' && !isNaN(s.score);
              // Status must be 'done' or not 'processing' (undefined/null status is considered done)
              const isDone = s?.status === 'done' || (!s?.status || s?.status !== 'processing');
              return hasScore && isDone;
            });
            
            if (validSubs.length > 0) {
              hasAnyValidScore = true;
              const bestForQ = Math.max(...validSubs.map((s: any) => Number(s.score) || 0));
              perQuestionBestScores.push(bestForQ);
              const lastForQSorted = validSubs
                .slice()
                .sort((a: any, b: any) => new Date(a.submitted_at || 0).getTime() - new Date(b.submitted_at || 0).getTime());
              const lastForQ = lastForQSorted[lastForQSorted.length - 1];
              perQuestionFinalScores.push(Number(lastForQ?.score) || 0);
            }
          }

          const avg = (arr: number[]) => arr.length ? (arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
          const bestAvg = hasAnyValidScore ? avg(perQuestionBestScores) : undefined;
          const finalAvg = hasAnyValidScore ? avg(perQuestionFinalScores) : undefined;
          
          console.log(`🔍 Score calculation for exam ${exam.exam_id}:`, {
            totalSubmissions: submissions.length,
            hasAnyValidScore,
            bestAvg,
            finalAvg,
            perQuestionBestScores,
            perQuestionFinalScores,
            submissions: submissions.map((s: any) => ({ qid: s.question_id, score: s.score, status: s.status }))
          });
          
          // Check if any submissions are still processing (only if no valid scores exist yet)
          const hasProcessing = !hasAnyValidScore && submissions.some((s: any) => s?.status === 'processing');
          setProcessingMap(prev => ({ ...prev, [examKey]: hasProcessing }));

          setResults(prev => prev.map(r => (r.exam_id === exam.exam_id && r.exam_version === exam.exam_version) ? ({
            ...r,
            score: bestAvg,
            best_score: bestAvg,
            final_score: finalAvg,
            submission_count: submissions.length,
            submitted_at: (() => {
              const sorted = submissions
                .slice()
                .sort((a: any, b: any) => new Date(a.submitted_at || 0).getTime() - new Date(b.submitted_at || 0).getTime());
              const last = sorted[sorted.length - 1];
              return (last?.submitted_at) || exam.joined_at;
            })()
          }) : r));

          // If still processing, retry a few times
          if (hasProcessing) {
            const attempts = (retryAttemptsRef.current[examKey] || 0) + 1;
            retryAttemptsRef.current[examKey] = attempts;
            if (attempts <= 10) {
              setTimeout(() => fetchAndUpdateExam(exam), 3000);
            } else {
              // After max retries, clear processing flag to stop showing "Calculating..."
              console.log(`⚠️ Max retries reached for exam ${exam.exam_id}, clearing processing flag`);
              setProcessingMap(prev => ({ ...prev, [examKey]: false }));
            }
          }
        } catch (err) {
          console.error(`Failed to load submissions for ${exam.exam_id}:`, err);
        }
      };

      // Fetch scores in background - don't block
      completedExams.forEach(fetchAndUpdateExam);
    } catch (err: any) {
      setError(err.message || 'Failed to load results');
      // Don't clear existing data on error - keep what we have
      setResults(prev => prev.length > 0 ? prev : []);
      setLoading(false);
    }
  };

  // Global polling to refresh any rows still calculating
  useEffect(() => {
    if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
    pollingRef.current = setInterval(() => {
      const pending = results.filter(r => r.score === undefined);
      if (pending.length === 0) return;
      pending.forEach(async (r) => {
        try {
          const submissionsData = await getMySubmissions(getToken(), r.exam_id, r.exam_version);
          const submissions = submissionsData.submissions || [];
          const byQuestion: Record<string, any[]> = {};
          for (const s of submissions) {
            const qid = s?.question_id || 'unknown';
            if (!byQuestion[qid]) byQuestion[qid] = [];
            byQuestion[qid].push(s);
          }
          // Filter out processing submissions and calculate from valid ones only
          let perQuestionBestScores: number[] = [];
          let perQuestionFinalScores: number[] = [];
          let hasAnyValidScore = false;
          for (const qid of Object.keys(byQuestion)) {
            const subsForQ = byQuestion[qid];
            const validSubs = subsForQ.filter((s: any) => {
              // Score must be a number (including 0, which is valid)
              const hasScore = typeof s?.score === 'number' && !isNaN(s.score);
              // Status must be 'done' or not 'processing' (undefined/null status is considered done)
              const isDone = s?.status === 'done' || (!s?.status || s?.status !== 'processing');
              return hasScore && isDone;
            });
            
            if (validSubs.length > 0) {
              hasAnyValidScore = true;
              const bestForQ = Math.max(...validSubs.map((s: any) => Number(s.score) || 0));
              perQuestionBestScores.push(bestForQ);
              const lastForQSorted = validSubs
                .slice()
                .sort((a: any, b: any) => new Date(a.submitted_at || 0).getTime() - new Date(b.submitted_at || 0).getTime());
              const lastForQ = lastForQSorted[lastForQSorted.length - 1];
              perQuestionFinalScores.push(Number(lastForQ?.score) || 0);
            }
          }
          
          if (hasAnyValidScore) {
            const avg = (arr: number[]) => arr.length ? (arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
            const bestAvg = avg(perQuestionBestScores);
            const finalAvg = avg(perQuestionFinalScores);
            setResults(prev => prev.map(x => (x.exam_id === r.exam_id && x.exam_version === r.exam_version) ? ({
              ...x,
              score: bestAvg,
              best_score: bestAvg,
              final_score: finalAvg,
              submission_count: submissions.length
            }) : x));
            // Update processing map
            setProcessingMap(prev => ({ ...prev, [`${r.exam_id}-${r.exam_version || 1}`]: false }));
          }
        } catch {}
      });
    }, 4000);
    return () => { if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; } };
  }, [results]);

  const handleDownloadReport = async () => {
    if (results.length === 0) {
      alert('No exam results available to generate report');
      return;
    }

    setGeneratingReport(true);
    try {
      const token = getToken();
      
      // Create function to get submissions for each exam
      const getSubmissionsForExam = async (examId: string, version?: number) => {
        try {
          const submissionsData = await getMySubmissions(token, examId, version);
          return submissionsData.submissions || [];
        } catch (err) {
          console.error(`Failed to load submissions for exam ${examId}:`, err);
          return [];
        }
      };

      // Generate report
      const htmlReport = await generateStudentReport(
        results,
        studentInfo || {},
        getSubmissionsForExam
      );

      // Download as HTML file
      downloadReport(htmlReport, `student-report-${studentInfo?.rollNumber || 'student'}`);
    } catch (err: any) {
      console.error('Failed to generate report:', err);
      alert(`Failed to generate report: ${err.message || 'Unknown error'}`);
    } finally {
      setGeneratingReport(false);
    }
  };

  const handlePrintReport = async () => {
    if (results.length === 0) {
      alert('No exam results available to print');
      return;
    }

    setGeneratingReport(true);
    try {
      const token = getToken();
      
      const getSubmissionsForExam = async (examId: string, version?: number) => {
        try {
          const submissionsData = await getMySubmissions(token, examId, version);
          return submissionsData.submissions || [];
        } catch (err) {
          console.error(`Failed to load submissions for exam ${examId}:`, err);
          return [];
        }
      };

      const htmlReport = await generateStudentReport(
        results,
        studentInfo || {},
        getSubmissionsForExam
      );

      printReport(htmlReport);
    } catch (err: any) {
      console.error('Failed to generate report:', err);
      alert(`Failed to generate report: ${err.message || 'Unknown error'}`);
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleDownloadExamReport = async (result: StudentResult) => {
    setGeneratingReport(true);
    try {
      const token = getToken();
      
      const getSubmissionsForExam = async (examId: string, version?: number) => {
        try {
          const submissionsData = await getMySubmissions(token, examId, version);
          return submissionsData.submissions || [];
        } catch (err) {
          console.error(`Failed to load submissions for exam ${examId}:`, err);
          return [];
        }
      };

      const htmlReport = await generateSingleExamReport(
        result,
        studentInfo || {},
        getSubmissionsForExam
      );

      const examName = (result.original_subject_name || result.subject_name)
        .replace(/[^a-z0-9]/gi, '-')
        .toLowerCase();
      downloadReport(htmlReport, `exam-report-${examName}-${result.exam_id}`);
    } catch (err: any) {
      console.error('Failed to generate exam report:', err);
      alert(`Failed to generate report: ${err.message || 'Unknown error'}`);
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleViewSubmissions = async (examId: string, examName: string, examVersion?: number) => {
    try {
      // Open dialog immediately and load in background
      setSubmissionsDialog(prev => ({ ...prev, open: true, examId, examName, submissions: [] }));
      setSubmissionsLoading(true);
      console.log(`🔍 Frontend: Getting submissions for exam ${examId}, version ${examVersion}`);
      const submissionsData = await getMySubmissions(getToken(), examId, examVersion);
      const subs: any[] = submissionsData.submissions || [];
      // Annotate per-question best and final
      const byQ: Record<string, any[]> = {};
      for (const s of subs) {
        const qid = s?.question_id || 'unknown';
        if (!byQ[qid]) byQ[qid] = [];
        byQ[qid].push(s);
      }
      for (const qid of Object.keys(byQ)) {
        const list = byQ[qid];
        const bestScore = Math.max(...list.map((s: any) => Number(s.score) || 0));
        const finalSorted = list
          .slice()
          .sort((a: any, b: any) => new Date(a.submitted_at || 0).getTime() - new Date(b.submitted_at || 0).getTime());
        const finalOne = finalSorted[finalSorted.length - 1];
        for (const s of list) {
          s.is_best_q = ((Number(s.score) || 0) === bestScore);
          s.is_final_q = (s === finalOne);
        }
      }
      console.log(`🔍 Frontend: Received ${subs.length} submissions`);
      setSubmissionsDialog(prev => ({
        ...prev,
        open: true,
        examId,
        examName,
        submissions: subs
      }));
      setSubmissionsLoading(false);
    } catch (err: any) {
      setError(err.message || 'Failed to load submissions');
      setSubmissionsLoading(false);
    }
  };

  const getStatusChip = (result: StudentResult) => {
    if (result.status === 'completed') {
      return (
        <Chip
          icon={<CheckCircleIcon />}
          label="Completed"
          color="success"
          size="small"
        />
      );
    } else if (result.status === 'in_progress') {
      return (
        <Chip
          icon={<ScheduleIcon />}
          label="In Progress"
          color="warning"
          size="small"
        />
      );
    }
    return (
      <Chip
        label="Available"
        color="default"
        size="small"
      />
    );
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const formatDate = (dateString: string | number) => {
    try {
      // Accept seconds, milliseconds, ISO strings, or numeric-like strings
      if (typeof dateString === 'number') {
        const ms = dateString < 2_000_000_000 ? dateString * 1000 : dateString;
        const d = new Date(ms);
        return isNaN(d.getTime()) ? 'N/A' : d.toLocaleString();
      }
      if (typeof dateString === 'string') {
        const trimmed = dateString.trim();
        if (/^\d+$/.test(trimmed)) {
          const num = parseInt(trimmed, 10);
          const ms = num < 2_000_000_000 ? num * 1000 : num;
          const d = new Date(ms);
          return isNaN(d.getTime()) ? 'N/A' : d.toLocaleString();
        }
        const d = new Date(trimmed);
        return isNaN(d.getTime()) ? 'N/A' : d.toLocaleString();
      }
      return 'N/A';
    } catch {
      return 'N/A';
    }
  };

  // Don't block UI with a full-screen spinner while loading

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h5" sx={{ 
          fontWeight: 600, 
          color: 'text.primary',
          letterSpacing: '-0.025em'
        }}>
          My Results
        </Typography>
        <Box display="flex" alignItems="center" gap={2}>
          <Typography variant="body2" sx={{ color: '#64748B', fontSize: '0.8125rem', fontWeight: 500 }}>
            Total Completed: {results.length}
          </Typography>
          {results.length > 0 && (
            <>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={handleDownloadReport}
                disabled={generatingReport}
                sx={{
                  borderColor: isDark ? '#9333EA' : 'primary.main',
                  color: isDark ? '#9333EA' : 'primary.main',
                  '&:hover': {
                    borderColor: isDark ? '#A855F7' : 'primary.dark',
                    bgcolor: isDark ? 'rgba(147, 51, 234, 0.1)' : 'rgba(25, 118, 210, 0.08)'
                  }
                }}
              >
                {generatingReport ? 'Generating...' : 'Download Report'}
              </Button>
              <Button
                variant="outlined"
                startIcon={<PrintIcon />}
                onClick={handlePrintReport}
                disabled={generatingReport}
                sx={{
                  borderColor: isDark ? '#9333EA' : 'primary.main',
                  color: isDark ? '#9333EA' : 'primary.main',
                  '&:hover': {
                    borderColor: isDark ? '#A855F7' : 'primary.dark',
                    bgcolor: isDark ? 'rgba(147, 51, 234, 0.1)' : 'rgba(25, 118, 210, 0.08)'
                  }
                }}
              >
                Print Report
              </Button>
            </>
          )}
        </Box>
      </Box>

      {results.length === 0 ? (
        <Paper sx={{ 
          p: 6, 
          textAlign: 'center',
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
          boxShadow: 'none'
        }}>
          <Typography variant="h6" sx={{ color: '#64748B', mb: 1, fontWeight: 500 }}>
            No completed exams yet
          </Typography>
          <Typography variant="body2" sx={{ color: '#94A3B8' }}>
            Your exam results will appear here once you complete an exam.
          </Typography>
        </Paper>
      ) : (
        <>
        {/* Filters row */}
        <Box sx={{ mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <MUITextField
            size="small"
            placeholder="Search exam"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            sx={{ minWidth: 220 }}
          />
          <MUITextField
            size="small"
            select
            label="Language"
            value={languageFilter.toUpperCase()}
            onChange={(e) => setLanguageFilter(String(e.target.value).toLowerCase())}
            sx={{ minWidth: 160 }}
          >
            {availableLanguages.map(l => (
              <MenuItem key={l} value={l}>{l}</MenuItem>
            ))}
          </MUITextField>
          <MUITextField
            size="small"
            type="number"
            label="Min %"
            value={minScore}
            onChange={(e) => setMinScore(e.target.value)}
            sx={{ width: 100 }}
            inputProps={{ min: 0, max: 100 }}
          />
          <MUITextField
            size="small"
            type="number"
            label="Max %"
            value={maxScore}
            onChange={(e) => setMaxScore(e.target.value)}
            sx={{ width: 100 }}
            inputProps={{ min: 0, max: 100 }}
          />
          <MUITextField
            size="small"
            select
            label="Sort by"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            sx={{ minWidth: 190 }}
          >
            <MenuItem value="submitted_desc">Submitted: Newest</MenuItem>
            <MenuItem value="submitted_asc">Submitted: Oldest</MenuItem>
            <MenuItem value="score_desc">Score: High → Low</MenuItem>
            <MenuItem value="score_asc">Score: Low → High</MenuItem>
            <MenuItem value="duration_asc">Duration: Low → High</MenuItem>
            <MenuItem value="duration_desc">Duration: High → Low</MenuItem>
            <MenuItem value="language_asc">Language: A → Z</MenuItem>
            <MenuItem value="language_desc">Language: Z → A</MenuItem>
            <MenuItem value="name_asc">Name: A → Z</MenuItem>
            <MenuItem value="name_desc">Name: Z → A</MenuItem>
          </MUITextField>
          {(searchText || languageFilter !== 'all' || minScore || maxScore) && (
            <Button size="small" onClick={() => { setSearchText(''); setLanguageFilter('all'); setMinScore(''); setMaxScore(''); }}>
              Clear
            </Button>
          )}
        </Box>
        <TableContainer component={Paper} sx={{ 
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
          boxShadow: 'none'
        }}>
          <Table>
            <TableHead sx={{ bgcolor: isDark ? '#0F0F0F' : 'action.hover' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.8125rem', color: 'text.primary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <TableSortLabel
                    active={sortState.key==='name'}
                    direction={sortState.key==='name'?sortState.dir: 'asc'}
                    onClick={() => toggleSort('name')}
                  >
                    Exam
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.8125rem', color: 'text.primary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <TableSortLabel
                    active={sortState.key==='language'}
                    direction={sortState.key==='language'?sortState.dir: 'asc'}
                    onClick={() => toggleSort('language')}
                  >
                    Language
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.8125rem', color: 'text.primary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <TableSortLabel
                    active={sortState.key==='duration'}
                    direction={sortState.key==='duration'?sortState.dir: 'asc'}
                    onClick={() => toggleSort('duration')}
                  >
                    Duration
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.8125rem', color: 'text.primary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <TableSortLabel
                    active={sortState.key==='score'}
                    direction={sortState.key==='score'?sortState.dir: 'asc'}
                    onClick={() => toggleSort('score')}
                  >
                    Score
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.8125rem', color: 'text.primary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.8125rem', color: 'text.primary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <TableSortLabel
                    active={sortState.key==='submitted'}
                    direction={sortState.key==='submitted'?sortState.dir: 'asc'}
                    onClick={() => toggleSort('submitted')}
                  >
                    Submitted
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.8125rem', color: 'text.primary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Snapshot</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.8125rem', color: 'text.primary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Details</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {visibleResults.map((result, index) => (
                <React.Fragment key={`${result.exam_id}-${result.exam_version || 1}`}>
                  <TableRow sx={{ 
                    '&:hover': { bgcolor: isDark ? 'action.hover' : 'action.hover' },
                    borderBottom: '1px solid',
                    borderColor: 'divider'
                  }}>
                    <TableCell sx={{ py: 2.5 }}>
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.primary', mb: 0.5 }}>
                          {result.original_subject_name || result.subject_name}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                            ID: {result.exam_id}
                          </Typography>
                          {result.exam_version && result.exam_version > 1 && (
                            <>
                              <Box sx={{ width: 3, height: 3, borderRadius: '50%', bgcolor: 'divider' }} />
                              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                                Version {result.exam_version}
                              </Typography>
                            </>
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ py: 2.5 }}>
                      <Chip 
                        label={result.language.toUpperCase()} 
                        size="small" 
                        sx={{ 
                          bgcolor: '#F1F5F9',
                          color: '#475569',
                          fontWeight: 500,
                          fontSize: '0.75rem',
                          height: '24px'
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ py: 2.5 }}>
                      <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.875rem' }}>
                        {result.duration_minutes} min
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 2.5 }}>
                      <Box display="flex" flexDirection="column" gap={0.75}>
                        {result.score !== undefined ? (
                          <Chip
                            label={`Final: ${result.score.toFixed(2)}%`}
                            size="small"
                            sx={{ 
                              bgcolor: result.score >= 70 ? '#ECFDF5' : result.score >= 50 ? '#FEF3C7' : '#FEF2F2',
                              color: result.score >= 70 ? '#047857' : result.score >= 50 ? '#92400E' : '#DC2626',
                              fontWeight: 600,
                              fontSize: '0.75rem',
                              height: '24px'
                            }}
                          />
                        ) : (
                          <Chip
                            label={loading ? 'Loading…' : 'Calculating…'}
                            size="small"
                            sx={{ bgcolor: '#F1F5F9', color: '#475569', fontWeight: 500, fontSize: '0.75rem', height: '24px' }}
                          />
                        )}
                        {result.submission_count !== undefined && result.submission_count > 0 && (
                          <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.75rem' }}>
                            {result.submission_count} submission{result.submission_count !== 1 ? 's' : ''}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ py: 2.5 }}>
                      <Chip
                        icon={<CheckCircleIcon sx={{ fontSize: 16 }} />}
                        label="Completed"
                        size="small"
                        sx={{ 
                          bgcolor: '#ECFDF5',
                          color: '#047857',
                          fontWeight: 500,
                          fontSize: '0.75rem',
                          height: '24px'
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ py: 2.5 }}>
                      {result.submitted_at ? (
                        <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.875rem' }}>
                          {formatDate(result.submitted_at)}
                        </Typography>
                      ) : (
                        <Typography variant="body2" sx={{ color: '#94A3B8', fontSize: '0.875rem' }}>
                          N/A
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ py: 2.5 }}>
                      <Box display="flex" gap={0.75} flexWrap="wrap">
                        {result.department_name && (
                          <Chip 
                            label={result.department_name} 
                            size="small"
                            sx={{ 
                              bgcolor: '#F3E8FF',
                              color: '#9333EA',
                              fontSize: '0.75rem',
                              fontWeight: 500,
                              height: '24px'
                            }}
                          />
                        )}
                        {typeof result.year === 'number' && (
                          <Chip 
                            label={`Year ${result.year}`} 
                            size="small"
                            sx={{ 
                              bgcolor: '#F0FDF4',
                              color: '#15803D',
                              fontSize: '0.75rem',
                              fontWeight: 500,
                              height: '24px'
                            }}
                          />
                        )}
                        {result.section_name && (
                          <Chip 
                            label={`Section ${result.section_name}`} 
                            size="small"
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
                    </TableCell>
                    <TableCell sx={{ py: 2.5 }}>
                      <Box display="flex" gap={1} alignItems="center">
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<VisibilityIcon sx={{ fontSize: 16 }} />}
                          onClick={() => handleViewSubmissions(result.exam_id, result.original_subject_name || result.subject_name, result.exam_version)}
                          disabled={processingMap[`${result.exam_id}-${result.exam_version || 1}`] || result.score === undefined}
                          sx={{
                            textTransform: 'none',
                            fontWeight: 500,
                            fontSize: '0.875rem',
                            borderRadius: '8px',
                            borderColor: 'divider',
                            color: 'text.secondary',
                            px: 2,
                            '&:hover': {
                              borderColor: 'divider',
                              bgcolor: 'action.hover'
                            }
                          }}
                        >
                          View
                        </Button>
                        <Tooltip title="Download Report">
                          <IconButton
                            size="small"
                            onClick={() => handleDownloadExamReport(result)}
                            disabled={generatingReport}
                            sx={{
                              color: isDark ? '#9333EA' : 'primary.main',
                              '&:hover': {
                                bgcolor: isDark ? 'rgba(147, 51, 234, 0.1)' : 'rgba(25, 118, 210, 0.08)'
                              },
                              '&:disabled': {
                                color: 'text.disabled'
                              }
                            }}
                          >
                            <DownloadIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        </>
      )}

      {/* Submissions Dialog */}
      <Dialog
        open={submissionsDialog.open}
        onClose={() => setSubmissionsDialog(prev => ({ ...prev, open: false }))}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '12px',
            bgcolor: 'background.paper'
          }
        }}
      >
        <DialogTitle sx={{ pb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary', fontSize: '1.125rem' }}>
              {submissionsDialog.examName}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button 
                size="small" 
                variant={viewMode==='all' ? 'contained' : 'outlined'}
                onClick={() => setViewMode('all')}
                sx={{ 
                  textTransform: 'none',
                  fontSize: '0.8125rem',
                  minWidth: 60,
                  bgcolor: viewMode==='all' ? '#1F1F1F' : 'transparent',
                  color: viewMode==='all' ? '#FFFFFF' : 'text.secondary',
                  borderColor: 'divider',
                  '&:hover': {
                    bgcolor: viewMode==='all' ? '#2F2F2F' : 'action.hover',
                    borderColor: 'divider'
                  }
                }}
              >
                All
              </Button>
              <Button 
                size="small" 
                variant={viewMode==='best' ? 'contained' : 'outlined'}
                onClick={() => setViewMode('best')}
                sx={{ 
                  textTransform: 'none',
                  fontSize: '0.8125rem',
                  minWidth: 60,
                  bgcolor: viewMode==='best' ? (isDark ? '#1F1F1F' : '#1F1F1F') : 'transparent',
                  color: viewMode==='best' ? '#FFFFFF' : 'text.secondary',
                  borderColor: 'divider',
                  '&:hover': {
                  bgcolor: viewMode==='best' ? (isDark ? 'action.hover' : '#2F2F2F') : 'action.hover',
                  borderColor: 'divider'
                  }
                }}
              >
                Best
              </Button>
              <Button 
                size="small" 
                variant={viewMode==='final' ? 'contained' : 'outlined'}
                onClick={() => setViewMode('final')}
                sx={{ 
                  textTransform: 'none',
                  fontSize: '0.8125rem',
                  minWidth: 60,
                  bgcolor: viewMode==='final' ? (isDark ? '#1F1F1F' : '#1F1F1F') : 'transparent',
                  color: viewMode==='final' ? '#FFFFFF' : 'text.secondary',
                  borderColor: 'divider',
                  '&:hover': {
                  bgcolor: viewMode==='final' ? (isDark ? 'action.hover' : '#2F2F2F') : 'action.hover',
                  borderColor: 'divider'
                  }
                }}
              >
                Final
              </Button>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {submissionsLoading && (
            <Box textAlign="center" py={4}>
              <Typography variant="body2" sx={{ color: '#64748B' }}>
                Loading submissions… Test case results will appear first. AI feedback may still be calculating.
              </Typography>
            </Box>
          )}
          {!submissionsLoading && submissionsDialog.submissions.length === 0 ? (
            <Box textAlign="center" py={6}>
              <Typography variant="body1" sx={{ color: '#64748B' }}>
                No submissions found for this exam.
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Group submissions by question */}
              {Object.entries(submissionsDialog.submissions.reduce((acc: Record<string, Submission[]>, s: Submission) => {
                const q = s.question_id || 'unknown';
                if (!acc[q]) acc[q] = [];
                acc[q].push(s);
                return acc;
              }, {} as Record<string, Submission[]>)).map(([qid, subs]) => {
                // Compute per-question best and final
                const sorted: Submission[] = subs
                  .slice()
                  .sort((a: Submission, b: Submission) => new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime());
                const finalSub: Submission = sorted[sorted.length - 1];
                const bestSub: Submission = sorted.reduce((best: Submission, cur: Submission) => (Number(cur.score)||0) > (Number(best.score)||0) ? cur : best, sorted[0]);
                const filtered: Submission[] = viewMode==='all' ? sorted : viewMode==='best' ? [bestSub] : [finalSub];
                return (
                  <Paper key={qid} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '8px', overflow: 'hidden' }}>
                    <Box sx={{ px: 3, py: 2, bgcolor: isDark ? '#0F0F0F' : 'action.hover', borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary', fontSize: '0.9375rem' }}>
                        Question {qid}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8125rem' }}>
                          Best: <span style={{ fontWeight: 600, color: (Number(bestSub?.score) || 0) >= 70 ? '#047857' : (Number(bestSub?.score) || 0) >= 50 ? '#92400E' : '#DC2626' }}>{(Number(bestSub?.score) || 0).toFixed(1)}%</span>
                        </Typography>
                        <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: 'divider' }} />
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8125rem' }}>
                          Final: <span style={{ fontWeight: 600, color: (Number(finalSub?.score) || 0) >= 70 ? '#047857' : (Number(finalSub?.score) || 0) >= 50 ? '#92400E' : '#DC2626' }}>{(Number(finalSub?.score) || 0).toFixed(1)}%</span>
                        </Typography>
                        <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: 'divider' }} />
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8125rem' }}>
                          {subs.length} attempt{subs.length !== 1 ? 's' : ''}
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ p: 0 }}>
                      {filtered.map((submission: Submission, index: number) => {
                        if (!submission) return null;
                        return (
                        <Box key={`${qid}-${index}`}>
                          <Box sx={{ 
                            px: 3, 
                            py: 2.5, 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'space-between',
                            '&:hover': { bgcolor: isDark ? 'action.hover' : 'action.hover' },
                            cursor: 'pointer',
                            borderBottom: index < filtered.length - 1 ? '1px solid' : 'none',
                            borderColor: 'divider'
                          }}
                          onClick={() => {
                            const key = `code-${qid}-${index}`;
                            setExpandedCodeIndex(expandedCodeIndex === key ? null : key);
                          }}
                          >
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, flexGrow: 1 }}>
                              <Typography variant="body2" sx={{ color: 'text.primary', fontSize: '0.875rem', fontWeight: 500 }}>
                                {submission?.submitted_at ? new Date(submission.submitted_at).toLocaleString() : 'N/A'}
                              </Typography>
                              <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                                  Score: <span style={{ fontWeight: 600, color: (Number(submission?.score) || 0) >= 70 ? '#047857' : (Number(submission?.score) || 0) >= 50 ? '#92400E' : '#DC2626' }}>{(Number(submission?.score) || 0).toFixed(1)}%</span>
                                </Typography>
                                {submission?.public_case_results && Array.isArray(submission.public_case_results) && (
                                  <>
                                    <Box sx={{ width: 3, height: 3, borderRadius: '50%', bgcolor: 'divider' }} />
                                    <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                                      {submission.public_case_results.filter(Boolean).length}/{submission.public_case_results.length} test cases passed
                                    </Typography>
                                  </>
                                )}
                              </Box>
                            </Box>
                            <IconButton size="small" sx={{ color: 'text.secondary' }}>
                              <VisibilityIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Box>
                          {expandedCodeIndex === `code-${qid}-${index}` && submission && (
                            <Box sx={{ px: 3, py: 2.5, bgcolor: isDark ? '#0A0A0A' : 'action.hover', borderTop: '1px solid', borderColor: 'divider' }}>
                              {/* Test Case Results - Detailed */}
                              {submission.detailed_results && Array.isArray(submission.detailed_results) && submission.detailed_results.length > 0 && (
                                <Box sx={{ mb: 2.5 }}>
                                  <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600, color: 'text.primary', fontSize: '0.8125rem' }}>
                                    Test Cases
                                  </Typography>
                                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                    {submission.detailed_results.map((testCase: any, tcIndex: number) => {
                                      if (!testCase) return null;
                                      const passed = testCase?.passed === true || testCase?.passed === 'true';
                                      return (
                                        <Paper 
                                          key={tcIndex}
                                          elevation={0}
                                          sx={{ 
                                            p: 2,
                                            border: '1px solid',
                                            borderColor: passed ? (isDark ? '#10B981' : '#D1FAE5') : (isDark ? '#DC2626' : '#FECACA'),
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
                                                bgcolor: passed ? (isDark ? '#064E3B' : '#ECFDF5') : (isDark ? '#7F1D1D' : '#FEF2F2'),
                                                fontSize: '0.75rem',
                                                fontWeight: 600,
                                                color: passed ? (isDark ? '#34D399' : '#047857') : (isDark ? '#FCA5A5' : '#DC2626')
                                              }}
                                            >
                                              {tcIndex + 1}
                                            </Box>
                                            <Typography variant="body2" sx={{ 
                                              fontWeight: 600, 
                                              color: passed ? (isDark ? '#34D399' : '#047857') : (isDark ? '#FCA5A5' : '#DC2626'),
                                              fontSize: '0.8125rem'
                                            }}>
                                              {passed ? 'Passed' : 'Failed'}
                                            </Typography>
                                          {testCase.execution_time !== undefined && (
                                            <>
                                              <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: 'divider' }} />
                                              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                                                {(testCase.execution_time * 1000).toFixed(2)}ms
                                              </Typography>
                                            </>
                                          )}
                                        </Box>
                                        
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                          {testCase.input !== undefined && (
                                            <Box>
                                              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem', fontWeight: 600, display: 'block', mb: 0.5 }}>
                                                Input:
                                              </Typography>
                                              <Paper elevation={0} sx={{ p: 1.5, bgcolor: isDark ? '#0A0A0A' : 'action.hover', border: '1px solid', borderColor: 'divider', borderRadius: '4px' }}>
                                                <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem', color: isDark ? '#FFFFFF' : 'text.secondary', whiteSpace: 'pre-wrap' }}>
                                                  {testCase?.input || '(empty)'}
                                                </Typography>
                                              </Paper>
                                            </Box>
                                          )}
                                          
                                          {testCase?.expected_output !== undefined && (
                                            <Box>
                                              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem', fontWeight: 600, display: 'block', mb: 0.5 }}>
                                                Expected Output:
                                              </Typography>
                                              <Paper elevation={0} sx={{ p: 1.5, bgcolor: isDark ? '#0A0A0A' : 'action.hover', border: '1px solid', borderColor: 'divider', borderRadius: '4px' }}>
                                                <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem', color: isDark ? '#FFFFFF' : 'text.secondary', whiteSpace: 'pre-wrap' }}>
                                                  {testCase?.expected_output || '(empty)'}
                                                </Typography>
                                              </Paper>
                                            </Box>
                                          )}
                                          
                                          {testCase?.actual_output !== undefined && (
                                            <Box>
                                              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem', fontWeight: 600, display: 'block', mb: 0.5 }}>
                                                Your Output:
                                              </Typography>
                                              <Paper elevation={0} sx={{ 
                                                p: 1.5, 
                                                bgcolor: passed ? (isDark ? '#064E3B' : '#F0FDF4') : (isDark ? '#7F1D1D' : '#FEF2F2'), 
                                                border: '1px solid',
                                                borderColor: passed ? (isDark ? '#10B981' : '#D1FAE5') : (isDark ? '#DC2626' : '#FECACA'),
                                                borderRadius: '4px' 
                                              }}>
                                                <Typography variant="body2" sx={{ 
                                                  fontFamily: 'monospace', 
                                                  fontSize: '0.75rem', 
                                                  color: passed ? (isDark ? '#34D399' : '#15803D') : (isDark ? '#FCA5A5' : '#DC2626'),
                                                  whiteSpace: 'pre-wrap'
                                                }}>
                                                  {testCase?.actual_output || '(empty)'}
                                                </Typography>
                                              </Paper>
                                            </Box>
                                          )}
                                          
                                          {testCase?.error && (
                                            <Box>
                                              <Typography variant="caption" sx={{ color: isDark ? '#FCA5A5' : '#DC2626', fontSize: '0.75rem', fontWeight: 600, display: 'block', mb: 0.5 }}>
                                                Error:
                                              </Typography>
                                              <Paper elevation={0} sx={{ p: 1.5, bgcolor: isDark ? '#7F1D1D' : '#FEF2F2', border: '1px solid', borderColor: isDark ? '#DC2626' : '#FECACA', borderRadius: '4px' }}>
                                                <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem', color: isDark ? '#FCA5A5' : '#DC2626', whiteSpace: 'pre-wrap' }}>
                                                  {String(testCase.error)}
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
                              <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600, color: 'text.primary', fontSize: '0.8125rem' }}>
                                Submitted Code
                              </Typography>
                              <Paper elevation={0} sx={{ p: 2.5, bgcolor: isDark ? '#0A0A0A' : 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: '6px' }}>
                                <pre style={{ 
                                  margin: 0, 
                                  whiteSpace: 'pre-wrap', 
                                  fontFamily: 'monospace',
                                  fontSize: '0.8125rem',
                                  color: isDark ? '#FFFFFF' : 'text.primary',
                                  lineHeight: 1.6
                                }}>
                                  {(submission?.code && typeof submission.code === 'string') ? submission.code : 'No code available'}
                                </pre>
                              </Paper>

                              {/* Ideal Solution */}
                              {submission?.ideal_solution && typeof submission.ideal_solution === 'string' && submission.ideal_solution.trim() && (
                                <Box sx={{ mt: 2 }}>
                                  <Typography variant="caption" sx={{ fontWeight: 600, color: 'success.main', fontSize: '0.75rem', mb: 0.5, display: 'block' }}>
                                    Ideal Solution (Faculty's Code)
                                  </Typography>
                                  <Paper elevation={0} sx={{ p: 2.5, bgcolor: isDark ? '#0A0A0A' : 'background.paper', border: '1px solid', borderColor: 'success.main', borderRadius: '6px' }}>
                                    <pre style={{ 
                                      margin: 0, 
                                      whiteSpace: 'pre-wrap', 
                                      fontFamily: 'monospace',
                                      fontSize: '0.8125rem',
                                      color: isDark ? '#FFFFFF' : 'text.primary',
                                      lineHeight: 1.6
                                    }}>
                                      {submission.ideal_solution}
                                    </pre>
                                  </Paper>
                                </Box>
                              )}
                              
                              {/* LLM Feedback and Insights */}
                              {submission.llm_feedback && typeof submission.llm_feedback === 'object' && Object.keys(submission.llm_feedback).length > 0 ? (
                                <Box sx={{ mt: 2.5, pt: 2.5, borderTop: '1px solid', borderColor: 'divider' }}>
                                  <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: 'text.primary', fontSize: '0.8125rem' }}>
                                    AI Feedback & Insights
                                  </Typography>
                                  
                                  {/* Overall Feedback */}
                                  {submission.llm_feedback?.feedback && typeof submission.llm_feedback.feedback === 'string' && (
                                    <Box sx={{ mb: 2 }}>
                                      <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.75rem', mb: 0.5, display: 'block' }}>
                                        Overall Feedback
                                      </Typography>
                                      <Box component="ul" sx={{ m: 0, pl: 2.5, listStyle: 'none' }}>
                                        {formatFeedbackAsBullets(submission.llm_feedback.feedback).map((point, idx) => (
                                          <Box key={idx} component="li" sx={{ mb: 0.75, position: 'relative', '&::before': { content: '"•"', position: 'absolute', left: -20, color: 'text.secondary' } }}>
                                            <Typography variant="body2" sx={{ color: 'text.primary', fontSize: '0.8125rem', lineHeight: 1.6 }}>
                                              {renderFeedbackText(point)}
                                            </Typography>
                                          </Box>
                                        ))}
                                      </Box>
                                    </Box>
                                  )}
                                  
                                  {/* Critical Analysis */}
                                  {submission.llm_feedback?.critic && typeof submission.llm_feedback.critic === 'string' && (
                                    <Box sx={{ mb: 2 }}>
                                      <Typography variant="caption" sx={{ fontWeight: 600, color: 'warning.main', fontSize: '0.75rem', mb: 0.5, display: 'block' }}>
                                        Critical Analysis
                                      </Typography>
                                      <Paper elevation={0} sx={{ p: 1.5, bgcolor: isDark ? '#1A1000' : '#FFFBF0', border: '1px solid', borderColor: 'warning.main', borderRadius: '6px' }}>
                                        <Box component="ul" sx={{ m: 0, pl: 2.5, listStyle: 'none' }}>
                                          {formatFeedbackAsBullets(submission.llm_feedback.critic).map((point, idx) => (
                                            <Box key={idx} component="li" sx={{ mb: 0.75, position: 'relative', '&::before': { content: '"⚠"', position: 'absolute', left: -22, top: 2, color: 'warning.main', fontSize: '0.875rem' } }}>
                                              <Typography variant="body2" sx={{ color: 'text.primary', fontSize: '0.8125rem', lineHeight: 1.6 }}>
                                                {renderFeedbackText(point, false)}
                                              </Typography>
                                            </Box>
                                          ))}
                                        </Box>
                                      </Paper>
                                    </Box>
                                  )}
                                  
                                  {/* Areas for Improvement */}
                                  {submission.llm_feedback?.improvements && typeof submission.llm_feedback.improvements === 'string' && (
                                    <Box sx={{ mb: 2 }}>
                                      <Typography variant="caption" sx={{ fontWeight: 600, color: 'error.main', fontSize: '0.75rem', mb: 0.5, display: 'block' }}>
                                        Mistakes & Issues Found
                                      </Typography>
                                      <Paper elevation={0} sx={{ p: 1.5, bgcolor: isDark ? '#1A0A0A' : '#FFF5F5', border: '1px solid', borderColor: 'error.main', borderRadius: '6px' }}>
                                        <Box component="ul" sx={{ m: 0, pl: 2.5, listStyle: 'none' }}>
                                          {formatFeedbackAsBullets(submission.llm_feedback.improvements).map((point, idx) => {
                                            const isMistake = point.toUpperCase().includes('MISTAKE') || point.toUpperCase().includes('BUG') || point.toUpperCase().includes('ERROR')
                                            return (
                                              <Box key={idx} component="li" sx={{ mb: 1.25, position: 'relative', '&::before': { content: '"⚠"', position: 'absolute', left: -22, top: 2, color: 'error.main', fontSize: '0.875rem' } }}>
                                                <Typography 
                                                  variant="body2" 
                                                  sx={{ 
                                                    color: 'text.primary', 
                                                    fontSize: '0.8125rem', 
                                                    lineHeight: 1.7,
                                                    fontWeight: isMistake ? 500 : 400
                                                  }}
                                                >
                                                  {renderFeedbackText(point, true)}
                                                </Typography>
                                              </Box>
                                            )
                                          })}
                                        </Box>
                                      </Paper>
                                    </Box>
                                  )}
                                  
                                  {/* Scope for Improvement */}
                                  {submission.llm_feedback?.scope_for_improvement && (
                                    <Box sx={{ mb: 2 }}>
                                      <Typography variant="caption" sx={{ fontWeight: 600, color: 'info.main', fontSize: '0.75rem', mb: 0.5, display: 'block' }}>
                                        Scope for Improvement
                                      </Typography>
                                      <Paper elevation={0} sx={{ p: 1.5, bgcolor: isDark ? '#0F0F0F' : 'background.paper', border: '1px solid', borderColor: 'info.main', borderRadius: '6px' }}>
                                        {(() => {
                                          const scope = submission.llm_feedback.scope_for_improvement;
                                          if (typeof scope === 'string') {
                                            const bullets = formatFeedbackAsBullets(scope)
                                            return (
                                              <Box component="ul" sx={{ m: 0, pl: 2.5, listStyle: 'none' }}>
                                                {bullets.map((point, idx) => (
                                                  <Box key={idx} component="li" sx={{ mb: 0.75, position: 'relative', '&::before': { content: '"→"', position: 'absolute', left: -22, top: 2, color: 'info.main', fontSize: '0.875rem' } }}>
                                                    <Typography variant="body2" sx={{ color: 'text.primary', fontSize: '0.8125rem', lineHeight: 1.6 }}>
                                                      {renderFeedbackText(point, false)}
                                                    </Typography>
                                                  </Box>
                                                ))}
                                              </Box>
                                            );
                                          } else if (typeof scope === 'object' && scope !== null && !Array.isArray(scope)) {
                                            return (
                                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                                {Object.entries(scope).map(([key, value]: [string, any]) => {
                                                  const displayValue = typeof value === 'string' 
                                                    ? value 
                                                    : typeof value === 'number' || typeof value === 'boolean'
                                                    ? String(value)
                                                    : JSON.stringify(value, null, 2);
                                                  return (
                                                    <Box key={String(key)}>
                                                      <Typography variant="caption" sx={{ fontWeight: 600, color: 'info.main', fontSize: '0.75rem', mb: 0.5, display: 'block', textTransform: 'capitalize' }}>
                                                        {String(key).replace(/_/g, ' ')}:
                                                      </Typography>
                                                      <Typography variant="body2" sx={{ color: 'text.primary', fontSize: '0.8125rem', lineHeight: 1.6, whiteSpace: 'pre-wrap', pl: 1 }}>
                                                        {displayValue}
                                                      </Typography>
                                                    </Box>
                                                  );
                                                })}
                                              </Box>
                                            );
                                          } else {
                                            return (
                                              <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8125rem' }}>
                                                No improvement scope available
                                              </Typography>
                                            );
                                          }
                                        })()}
                                      </Paper>
                                    </Box>
                                  )}
                                  
                                  {/* Evaluation Breakdown */}
                                  {(typeof submission.effort_score === 'number' || typeof submission.logic_similarity === 'number' || typeof submission.correctness === 'number') && (
                                    <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                                      <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.75rem', mb: 1, display: 'block' }}>
                                        Evaluation Breakdown
                                      </Typography>
                                      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                      {typeof submission.effort_score === 'number' && (
                                        <Chip 
                                          label={`Effort: ${(submission.effort_score * 100).toFixed(1)}%`}
                                          size="small"
                                          sx={{ fontSize: '0.75rem', bgcolor: isDark ? '#1F1F1F' : 'action.hover', color: 'text.primary' }}
                                        />
                                      )}
                                      {typeof submission.logic_similarity === 'number' && (
                                        <Chip 
                                          label={`Logic: ${(submission.logic_similarity * 100).toFixed(1)}%`}
                                          size="small"
                                          sx={{ fontSize: '0.75rem', bgcolor: isDark ? '#1F1F1F' : 'action.hover', color: 'text.primary' }}
                                        />
                                      )}
                                      {typeof submission.correctness === 'number' && (
                                        <Chip 
                                          label={`Test Cases: ${(submission.correctness * 100).toFixed(1)}%`}
                                          size="small"
                                          sx={{ fontSize: '0.75rem', bgcolor: isDark ? '#1F1F1F' : 'action.hover', color: 'text.primary' }}
                                        />
                                      )}
                                      </Box>
                                    </Box>
                                  )}
                                </Box>
                              ) : (
                                <Box sx={{ mt: 2.5, pt: 2.5, borderTop: '1px solid', borderColor: 'divider' }}>
                                  <Chip
                                    label="AI feedback: calculating…"
                                    size="small"
                                    sx={{ bgcolor: '#F1F5F9', color: '#475569', fontWeight: 500, fontSize: '0.75rem' }}
                                  />
                                </Box>
                              )}
                            </Box>
                          )}
                        </Box>
                        );
                      })}
                    </Box>
                  </Paper>
                );
              })}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2.5, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button 
            onClick={() => setSubmissionsDialog(prev => ({ ...prev, open: false }))}
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
  );
};

export default StudentResults;
