import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Box, Button, Paper, TextField, Typography, MenuItem, Alert, Stack, Grid, Chip, useTheme, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material'
import { Editor } from '@monaco-editor/react'
import { getQuestionDetails, evaluateCode, autoSaveCode, getExamTimer, getSavedCode, getSessionData } from '../api'
import LoadingScreen from './LoadingScreen'

const languages = [
	{ id: 'python', monaco: 'python' },
	{ id: 'javascript', monaco: 'javascript' },
	{ id: 'java', monaco: 'java' },
	{ id: 'c', monaco: 'c' },
	{ id: 'cpp', monaco: 'cpp' },
	{ id: 'go', monaco: 'go' },
]

const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'http://127.0.0.1:8000'

async function api(token: string, path: string, init?: RequestInit) {
	const res = await fetch(`${API_BASE}${path}`, {
		...init,
		headers: { ...(init?.headers||{}), Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
	})
	if (!res.ok) {
		const errorText = await res.text()
		console.error('API Error:', res.status, errorText)
		
		// Try to parse JSON error response and extract user-friendly message
		let errorMessage = 'Request failed'
		try {
			const errorJson = JSON.parse(errorText)
			// Handle different error formats
			if (errorJson?.error?.message) {
				errorMessage = errorJson.error.message
			} else if (errorJson?.detail) {
				errorMessage = errorJson.detail
			} else if (errorJson?.message) {
				errorMessage = errorJson.message
			} else if (typeof errorJson === 'string') {
				errorMessage = errorJson
			}
		} catch {
			// If not JSON, use the text as-is (but clean it up if it looks like JSON)
			if (errorText.trim().startsWith('{') || errorText.trim().startsWith('"')) {
				// Try to extract message from raw JSON string
				const messageMatch = errorText.match(/"message"\s*:\s*"([^"]+)"/)
				if (messageMatch) {
					errorMessage = messageMatch[1]
				} else {
					errorMessage = errorText
				}
			} else {
				errorMessage = errorText || 'Request failed'
			}
		}
		
		throw new Error(errorMessage)
	}
	try { 
		const result = await res.json()
		console.log('API Response:', result)
		return result
	} catch (e) { 
		console.error('JSON Parse Error:', e)
		return {} 
	}
}

export default function StudentDashboard() {
	const theme = useTheme()
	const isDark = theme.palette.mode === 'dark'
	const { examId: urlExamId } = useParams<{ examId: string }>()
	const navigate = useNavigate()
	const token = localStorage.getItem('token') || ''
	const role = localStorage.getItem('role') || ''
	
	// Debug logging removed - issue fixed
	const [examId, setExamId] = useState('')
	const [startCode, setStartCode] = useState('')
	const [serial, setSerial] = useState<number>(1)
	const [deadlineEpoch, setDeadlineEpoch] = useState<number | null>(null)
	const [assigned, setAssigned] = useState<string[]>([])
const [language, setLanguage] = useState<string>('python')
// Active question must be declared before any effects that reference it
const [questionId, setQuestionId] = useState<string>('')
type QuestionState = { code: string; detailedResults: any[]; lastSubmittedCode?: string }
const [questionStates, setQuestionStates] = useState<Record<string, QuestionState>>({})
const codeRef = useRef<string>('')
	
// Keep ref in sync with active question's code
useEffect(() => {
    const current = questionStates[questionId]?.code || ''
    codeRef.current = current
}, [questionId, questionStates])
	
// Handle user typing state and immediate auto-save (declared after questionId)
let handleCodeChange = (value: string | undefined) => {}
	
	const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
	const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
	
// Handle user typing state and immediate auto-save (now safe: refs and questionId are defined)
handleCodeChange = (value: string | undefined) => {
    const newCode = value || ''
    setQuestionStates(prev => ({
        ...prev,
        [questionId]: { code: newCode, detailedResults: prev[questionId]?.detailedResults || [], lastSubmittedCode: prev[questionId]?.lastSubmittedCode }
    }))
    // Persist only after joined and serial is assigned to avoid pre-join leakage
    try {
        if (hasJoined && serial !== null && serial !== undefined) {
            localStorage.setItem(buildDraftKey(examId, questionId), newCode)
        }
    } catch {}
    setIsUserTyping(true)
    
    if (examId && hasJoined) {
        if (autoSaveTimeoutRef.current) {
            clearTimeout(autoSaveTimeoutRef.current)
        }
        autoSaveTimeoutRef.current = setTimeout(async () => {
            try {
                await autoSaveCode(token, examId, newCode, questionId)
            } catch (error) {
                console.error('💾 Silent auto-save failed:', error)
            }
        }, 500)
    }
    
    if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
    }
    typingTimeoutRef.current = setTimeout(() => {
        setIsUserTyping(false)
    }, 1000)
}

const [message, setMessage] = useState<string>('')
	const [errors, setErrors] = useState<string | null>(null)
    const [publicResults, setPublicResults] = useState<boolean[] | null>(null)
    const [detailedResults, setDetailedResults] = useState<any[]>([])
    const [hasSubmitted, setHasSubmitted] = useState<boolean>(false)
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
    const resultsAreaRef = useRef<HTMLDivElement | null>(null)
    const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
	const [finished, setFinished] = useState<boolean>(false)
	const [redirectCountdown, setRedirectCountdown] = useState<number | null>(null)
const [questionDetailsMap, setQuestionDetailsMap] = useState<Record<string, { text: string, publicTcs: {input: string, expected_output: string}[] }>>({})
	const [loading, setLoading] = useState<boolean>(false)
	const [loadingMessage, setLoadingMessage] = useState<string>('')
const [hasJoined, setHasJoined] = useState<boolean>(false)
	
	// User typing state for UI feedback
	const [isUserTyping, setIsUserTyping] = useState(false)
	
	// Timer and auto-save state
	const [remainingTime, setRemainingTime] = useState<number | null>(null)
	const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null)
	const [autoSaveInterval, setAutoSaveInterval] = useState<NodeJS.Timeout | null>(null)
	const [isAutoFinished, setIsAutoFinished] = useState<boolean>(false)
	// Auto-save happens silently - no visual state needed

// Anti-cheat: fullscreen + tab monitoring (3-strike policy)
function getStrikeKey(examIdValue?: string) {
  const id = examIdValue || urlExamId || ''
  return `exam-strikes:v1:${id}`
}
const [strikeCount, setStrikeCount] = useState<number>(() => {
  try {
    const v = localStorage.getItem(getStrikeKey(urlExamId || ''))
    return v ? Number(v) || 0 : 0
  } catch { return 0 }
})
const [strikeMessage, setStrikeMessage] = useState<string>('')
const strikeCooldownRef = useRef<number>(0)
const strikeLastTypeRef = useRef<string>('')
const strikeGuardMs = 5000
const [needsFullscreen, setNeedsFullscreen] = useState<boolean>(false)
const fullscreenRetryTimerRef = useRef<NodeJS.Timeout | null>(null)
const leaveTimerRef = useRef<NodeJS.Timeout | null>(null)
const leaveTickRef = useRef<NodeJS.Timeout | null>(null)
const [leaveSeconds, setLeaveSeconds] = useState<number | null>(null)
// Fullscreen exit dialog countdown
const fsTimerRef = useRef<NodeJS.Timeout | null>(null)
const fsTickRef = useRef<NodeJS.Timeout | null>(null)
const fsCheckIntervalRef = useRef<NodeJS.Timeout | null>(null)
const lastFullscreenStateRef = useRef<boolean>(false)
const [fsSeconds, setFsSeconds] = useState<number | null>(null)
const isRefreshingRef = useRef<boolean>(false)
const pageLoadTimeRef = useRef<number>(Date.now())
const REFRESH_GRACE_MS = 2000 // 2 seconds grace after page load (for refresh event handling)
// Track when content is copied from Monaco editor to allow paste only from editor
const monacoCopyTimestampRef = useRef<number>(0)
const MONACO_COPY_VALID_DURATION = 5000 // 5 seconds - clipboard content from Monaco is valid for this duration

// Note: allow direct access to this page to show join + serial UI

function persistStrikes(count: number) {
  try {
    const key = getStrikeKey(examId || urlExamId || '')
    if (key) localStorage.setItem(key, String(count))
  } catch {}
}

function isFullscreenActive(): boolean {
  const d: any = document
  return !!(d.fullscreenElement || d.webkitFullscreenElement || d.mozFullScreenElement || d.msFullscreenElement)
}

async function enterFullscreen() {
  try {
    const el: any = document.documentElement
    if (isFullscreenActive()) {
      setNeedsFullscreen(false)
      return
    }
    const req = el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen || el.msRequestFullscreen
    if (req) {
      await req.call(el)
      setNeedsFullscreen(false)
    } else {
      console.warn('Fullscreen API not available')
      setNeedsFullscreen(true)
    }
  } catch (e) {
    console.warn('Fullscreen request failed:', e)
    setNeedsFullscreen(true) // show dialog to require user gesture
  }
}

function startFullscreenRetry() {
  if (fullscreenRetryTimerRef.current) return
  setNeedsFullscreen(true)
  let attempts = 0
  fullscreenRetryTimerRef.current = setInterval(async () => {
    attempts += 1
    if (isFullscreenActive()) {
      setNeedsFullscreen(false)
      if (fullscreenRetryTimerRef.current) { clearInterval(fullscreenRetryTimerRef.current); fullscreenRetryTimerRef.current = null }
      return
    }
    try { await enterFullscreen() } catch {}
    if (attempts >= 15) {
      // stop after ~9s (15 * 600ms) to avoid infinite loop; strikes still apply
      if (fullscreenRetryTimerRef.current) { clearInterval(fullscreenRetryTimerRef.current); fullscreenRetryTimerRef.current = null }
    }
  }, 600)
}

const remainingStrikes = Math.max(0, 3 - strikeCount)

function registerStrike(reason: string, type: 'hidden'|'fullscreen'|'blur'='hidden') {
  // De-duplicate rapid consecutive events (blur + visibilitychange)
  const now = Date.now()
  const last = strikeCooldownRef.current || 0
    if (now - last < strikeGuardMs && strikeLastTypeRef.current === type) {
    return
  }
  strikeCooldownRef.current = now
  strikeLastTypeRef.current = type
  setStrikeCount(prev => {
    const next = prev + 1
    persistStrikes(next)
    if (next >= 4) {
      // 4th strike → soft-delay to avoid accidental clusters, then end if still not compliant
      setStrikeMessage('Cheating policy violated repeatedly. Your exam will be auto-submitted now.')
      setTimeout(() => {
        try { endExam() } catch {}
      }, 1000)
    } else {
      setStrikeMessage(`Warning (${next}/3): ${reason}. Stay on the exam screen. ${3-next} strike(s) left before auto-submit.`)
    }
    return next
  })
}

// Monitor visibility/tab switching while exam is active
useEffect(() => {
  if (!(hasJoined && !finished && assigned.length > 0)) return

  // Skip all auto-end logic during refresh grace period (only for visibility, not fullscreen)
  const isInGracePeriod = () => {
    const timeSinceLoad = Date.now() - pageLoadTimeRef.current
    return timeSinceLoad < REFRESH_GRACE_MS || isRefreshingRef.current
  }

  const onVisibility = () => {
    if (isInGracePeriod()) {
      console.log('🚫 Ignoring visibility change during refresh grace period')
      return
    }
    if (document.hidden) {
      registerStrike('You left the exam tab or minimized the window','hidden')
      // Start 5s grace timer to auto-end if not returned
      if (leaveTimerRef.current) { clearTimeout(leaveTimerRef.current); leaveTimerRef.current = null }
      if (leaveTickRef.current) { clearInterval(leaveTickRef.current); leaveTickRef.current = null }
      setLeaveSeconds(5)
      leaveTickRef.current = setInterval(() => {
        setLeaveSeconds(prev => {
          const next = prev !== null ? prev - 1 : null
          return next !== null && next >= 0 ? next : 0
        })
      }, 1000)
      leaveTimerRef.current = setTimeout(() => {
        // End exam if still hidden
        if (document.hidden && hasJoined && !finished) {
          try { endExam() } catch {}
        }
      }, 5000)
    }
    // Attempt to restore fullscreen when returning
    if (!document.hidden) {
      if (leaveTimerRef.current) { clearTimeout(leaveTimerRef.current); leaveTimerRef.current = null }
      if (leaveTickRef.current) { clearInterval(leaveTickRef.current); leaveTickRef.current = null }
      setLeaveSeconds(null)
      enterFullscreen()
    }
  }
  const onBlur = () => {
    // Window lost focus (e.g., switched apps)
    // Do not count blur as a strike to avoid aggressive auto-ending; only warn via message.
    if (!document.hidden) setStrikeMessage('Warning: Window lost focus. Please stay on the exam screen.')
  }
  const onFullscreenChange = () => {
    if (!(hasJoined && !finished && assigned.length > 0)) return
    // Don't block fullscreen detection - we need to detect exits immediately
    const currentlyFullscreen = isFullscreenActive()
    console.log('🔍 Fullscreen change detected, active:', currentlyFullscreen)
    // Update state ref to prevent double-triggering from periodic check
    lastFullscreenStateRef.current = currentlyFullscreen
    if (!currentlyFullscreen) {
      // Only skip strikes during very short grace period (first 1 second), but still show dialog
      const timeSinceLoad = Date.now() - pageLoadTimeRef.current
      if (timeSinceLoad > 1000) {
        registerStrike('Exited fullscreen','fullscreen')
      }
      // Immediately attempt and then keep retrying without user input
      startFullscreenRetry()
      // Start 5s countdown dialog requiring explicit re-enter
      if (fsTimerRef.current) { clearTimeout(fsTimerRef.current); fsTimerRef.current = null }
      if (fsTickRef.current) { clearInterval(fsTickRef.current); fsTickRef.current = null }
      setFsSeconds(5)
      setNeedsFullscreen(true)
      // Start countdown interval - force re-render each second
      fsTickRef.current = setInterval(() => {
        setFsSeconds(prev => {
          if (prev === null || prev === undefined || prev <= 0) {
            if (fsTickRef.current) { clearInterval(fsTickRef.current); fsTickRef.current = null }
            return 0
          }
          return prev - 1
        })
      }, 1000)
      // Start auto-end timer
      fsTimerRef.current = setTimeout(() => {
        // Clear the countdown interval
        if (fsTickRef.current) { clearInterval(fsTickRef.current); fsTickRef.current = null }
        setFsSeconds(0)
        if (!isFullscreenActive() && hasJoined && !finished) {
          try { endExam() } catch {}
        }
      }, 5000)
    }
    else {
      // Cleared by returning to fullscreen
      if (fsTimerRef.current) { clearTimeout(fsTimerRef.current); fsTimerRef.current = null }
      if (fsTickRef.current) { clearInterval(fsTickRef.current); fsTickRef.current = null }
      setFsSeconds(null)
      setNeedsFullscreen(false)
    }
  }
  const onKeyDown = (e: KeyboardEvent) => {
    if (!(hasJoined && !finished && assigned.length > 0)) return
    if (e.key === 'Escape') {
      // Esc often exits fullscreen; count and try to restore
      registerStrike('Attempted to exit fullscreen')
      setTimeout(() => enterFullscreen(), 0)
      // Prevent default if possible (best-effort)
      try { e.preventDefault() } catch {}
    }
    // Note: Clipboard operations are allowed within the Monaco editor
    // We only block document-level paste events to prevent pasting from outside
  }
  // Allow paste only if content was copied from the exam page
  const onPaste = (e: ClipboardEvent) => {
    if (!(hasJoined && !finished && assigned.length > 0)) {
      // Not in exam, allow paste
      return
    }
    
    // Check if content was recently copied from the exam page
    const now = Date.now()
    const timeSinceCopy = now - monacoCopyTimestampRef.current
    const isValidCopy = monacoCopyTimestampRef.current > 0 && timeSinceCopy < MONACO_COPY_VALID_DURATION
    
    if (!isValidCopy) {
      // Content was not copied from the exam page (or too old) - block paste
      e.preventDefault()
      e.stopPropagation()
      e.stopImmediatePropagation()
      console.log('❌ Paste blocked - content not from exam page')
      return false
    }
    
    // Content was copied from the exam page, allow paste anywhere on the page
    console.log('✅ Paste allowed - content from exam page')
    // Keep timestamp valid - students can paste multiple times within the duration
  }
  // Track copy operations from the exam page (Monaco editor or anywhere on the page)
  const onCopy = (e: ClipboardEvent) => {
    // Always allow copy - track if it's from the exam page
    // During exam, track any copy operation on this page
    if (hasJoined && !finished && assigned.length > 0) {
      // Any copy on the exam page is allowed and tracked
      monacoCopyTimestampRef.current = Date.now()
      console.log('✅ Copy from exam page tracked (document event) - paste will be allowed')
    }
    // Always allow copy - don't prevent default
  }
  // Note: Clipboard API is allowed for copy operations
  // Paste operations are handled by the paste event handler above
  // Block context menu only outside the editor
  const onContextMenu = (e: MouseEvent) => {
    if (!(hasJoined && !finished && assigned.length > 0)) return
    // Allow context menu within Monaco editor
    const target = e.target as HTMLElement
    if (target) {
      const checkElement = (el: HTMLElement | null): boolean => {
        if (!el) return false
        return !!(
          el.closest('.monaco-editor') ||
          el.closest('[class*="monaco"]') ||
          el.classList.contains('monaco-editor') ||
          el.closest('div[class*="monaco"]')
        )
      }
      if (checkElement(target)) {
        // Allow context menu in editor - don't prevent default
        return
      }
    }
    // Block context menu outside editor
    e.preventDefault()
    e.stopPropagation()
    return false
  }
  document.addEventListener('visibilitychange', onVisibility)
  window.addEventListener('blur', onBlur)
  // Listen to all fullscreen change events (standard + vendor prefixes)
  document.addEventListener('fullscreenchange', onFullscreenChange)
  document.addEventListener('webkitfullscreenchange', onFullscreenChange)
  document.addEventListener('mozfullscreenchange', onFullscreenChange)
  document.addEventListener('MSFullscreenChange', onFullscreenChange)
  window.addEventListener('keydown', onKeyDown as any)
  // Handle clipboard operations
  document.addEventListener('paste', onPaste, true) // Use capture phase to catch all
  document.addEventListener('copy', onCopy, true)
  document.addEventListener('contextmenu', onContextMenu, true) // Allow context menu in editor, block outside
  // On pagehide/beforeunload, persist latest code via sendBeacon; do not add a strike (reload-friendly)
  const onPageHide = () => {
    isRefreshingRef.current = true
    // Clear all timers immediately on page unload to prevent auto-end
    if (leaveTimerRef.current) { clearTimeout(leaveTimerRef.current); leaveTimerRef.current = null }
    if (leaveTickRef.current) { clearInterval(leaveTickRef.current); leaveTickRef.current = null }
    if (fsTimerRef.current) { clearTimeout(fsTimerRef.current); fsTimerRef.current = null }
    if (fsTickRef.current) { clearInterval(fsTickRef.current); fsTickRef.current = null }
    setLeaveSeconds(null)
    setFsSeconds(null)
    try {
      if (hasJoined && !finished && examId) {
        const payload = JSON.stringify({ question_id: questionId, code: codeRef.current || '' })
        const blob = new Blob([payload], { type: 'application/json' })
        navigator.sendBeacon(`${API_BASE}/student/auto-save/${examId}`, blob)
      }
    } catch {}
  }
  window.addEventListener('pagehide', onPageHide)
  window.addEventListener('beforeunload', onPageHide)
  // Reset refresh flag and load time when exam actually starts
  pageLoadTimeRef.current = Date.now()
  isRefreshingRef.current = false
  // Initialize fullscreen state tracking
  lastFullscreenStateRef.current = isFullscreenActive()
  // try fullscreen at start
  enterFullscreen()
  // Keep trying to re-enter a few times if browser blocked the first attempt
  const retry1 = setTimeout(() => enterFullscreen(), 400)
  const retry2 = setTimeout(() => enterFullscreen(), 1200)
  const retry3 = setTimeout(() => enterFullscreen(), 2400)
  // Check if fullscreen is active after a short delay (catches cases where it exited during refresh)
  const checkFullscreen = setTimeout(() => {
    if (!isFullscreenActive() && hasJoined && !finished && assigned.length > 0) {
      console.log('🔍 Fullscreen not active after load, triggering dialog')
      onFullscreenChange()
    }
  }, 3000)
  // Periodic check for fullscreen state (catches window bar minimize/exit that might not fire events)
  fsCheckIntervalRef.current = setInterval(() => {
    if (!(hasJoined && !finished && assigned.length > 0)) {
      lastFullscreenStateRef.current = isFullscreenActive()
      return
    }
    const currentlyFullscreen = isFullscreenActive()
    // If state changed from fullscreen to not fullscreen, trigger handler
    // Only trigger if we're not already showing the dialog (needsFullscreen check)
    if (lastFullscreenStateRef.current && !currentlyFullscreen && !needsFullscreen) {
      console.log('🔍 Periodic check detected fullscreen exit via window controls')
      // Update ref first to prevent double-triggering
      lastFullscreenStateRef.current = false
      onFullscreenChange()
    } else {
      // Update ref even if we don't trigger, to track state changes
      lastFullscreenStateRef.current = currentlyFullscreen
    }
  }, 500) // Check every 500ms
  return () => {
    document.removeEventListener('visibilitychange', onVisibility)
    window.removeEventListener('blur', onBlur)
    document.removeEventListener('fullscreenchange', onFullscreenChange)
    document.removeEventListener('webkitfullscreenchange', onFullscreenChange)
    document.removeEventListener('mozfullscreenchange', onFullscreenChange)
    document.removeEventListener('MSFullscreenChange', onFullscreenChange)
    window.removeEventListener('keydown', onKeyDown as any)
    document.removeEventListener('paste', onPaste, true)
    document.removeEventListener('copy', onCopy, true)
    document.removeEventListener('contextmenu', onContextMenu, true)
    window.removeEventListener('pagehide', onPageHide)
    window.removeEventListener('beforeunload', onPageHide)
    clearTimeout(retry1); clearTimeout(retry2); clearTimeout(retry3); clearTimeout(checkFullscreen)
    if (fullscreenRetryTimerRef.current) { clearInterval(fullscreenRetryTimerRef.current); fullscreenRetryTimerRef.current = null }
    if (fsTimerRef.current) { clearTimeout(fsTimerRef.current); fsTimerRef.current = null }
    if (fsTickRef.current) { clearInterval(fsTickRef.current); fsTickRef.current = null }
    if (fsCheckIntervalRef.current) { clearInterval(fsCheckIntervalRef.current); fsCheckIntervalRef.current = null }
  }
}, [hasJoined, finished, assigned.length])

// If strikes already reached limit, end immediately on mount/reactivation
useEffect(() => {
  if (hasJoined && !finished && strikeCount >= 4 && examId) {
    try { endExam() } catch {}
  }
}, [hasJoined, finished, strikeCount, examId])

// Auto-attempt when flag indicates we need fullscreen
useEffect(() => {
  if (needsFullscreen && hasJoined && !finished && assigned.length > 0) {
    enterFullscreen()
  }
}, [needsFullscreen, hasJoined, finished, assigned.length])

// Utility: build per-user, per-exam, per-session (serial), per-question key
function buildDraftKey(examIdParam: string, qid: string): string {
    const userKeyPrefix = (token || '').slice(0, 16)
    const serialPart = (serial !== undefined && serial !== null) ? String(serial) : 'noserial'
    return `code:v3:${userKeyPrefix}:${examIdParam}:${serialPart}:${qid}`
}

// Utility: clear any local draft keys for this user and exam
function clearLocalDraftsForExam(targetExamId?: string) {
		try {
			const userKeyPrefix = (token || '').slice(0, 16)
			const toDelete: string[] = []
			for (let i = 0; i < localStorage.length; i++) {
				const k = localStorage.key(i)
				if (!k) continue
            if (k.startsWith(`code:v2:${userKeyPrefix}:`) || k.startsWith(`code:v3:${userKeyPrefix}:`)) {
                if (!targetExamId || k.startsWith(`code:v2:${userKeyPrefix}:${targetExamId}:`) || k.startsWith(`code:v3:${userKeyPrefix}:${targetExamId}:`)) {
						toDelete.push(k)
					}
				}
			}
			toDelete.forEach(k => localStorage.removeItem(k))
		} catch {}
	}

	useEffect(() => {
		if (role !== 'student') setMessage('Login as student to use this page')
    // Proactively clear any legacy localStorage exam code to prevent leakage between users
    try {
        // Clear only legacy keys from very old versions (do not remove current v2 keys)
        const legacyKeys: string[] = []
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i)
            if (k && k.startsWith('exam:') && k.includes(':q:') && k.includes(':code')) legacyKeys.push(k)
        }
        legacyKeys.forEach(k => localStorage.removeItem(k))
    } catch {}
	}, [role])

	// Timer and auto-save functions (defined early to avoid hoisting issues)
	const startTimer = async (currentExamId?: string) => {
		console.log('🕐 Timer starting with examId:', currentExamId)
		if (timerInterval) clearInterval(timerInterval)
		
		// Use the passed examId or current state
		const examIdToUse = currentExamId || examId
		console.log('🕐 Timer using examId:', examIdToUse)
		
		if (!examIdToUse) {
			console.error('🕐 No examId available for timer!')
			return
		}
		
		// Only start timer if user is actually a student and on the exam page
		if (role !== 'student') {
			console.log('❌ Timer not started - user is not a student')
			return
		}
		
		// Get initial timer data
		let initialTimerData = null
		try {
			initialTimerData = await getExamTimer(token, examIdToUse)
			if (initialTimerData.remaining_time !== null) {
				setRemainingTime(initialTimerData.remaining_time)
			}
		} catch (error) {
			console.error('Failed to get initial timer:', error)
		}
		
		// Use server timer as source of truth, but update display every second
		let serverStartTime = Date.now()
		let serverRemainingTime = initialTimerData?.remaining_time || 0
		
		const interval = setInterval(async () => {
			try {
				// Calculate elapsed time since last server sync
				const elapsedSeconds = Math.floor((Date.now() - serverStartTime) / 1000)
				const currentRemainingTime = Math.max(0, serverRemainingTime - elapsedSeconds)
				
				// Update display with calculated time
				setRemainingTime(currentRemainingTime)
				
				// Check if time has expired locally (immediate removal from in-progress)
				if (currentRemainingTime <= 0 && !isAutoFinished) {
					console.log('🕐 Timer expired locally, immediately signaling dashboard refresh...')
					setIsAutoFinished(true)
					setFinished(true) // Set finished immediately to show completion screen
					setRemainingTime(0) // Ensure timer shows 0:00
					// Clear persistent strike counter on auto-finish
					try { localStorage.removeItem(getStrikeKey(examIdToUse || examId || '')) } catch {}
					
					const finishedExamId = examIdToUse || examId
					const userPrefix = (token || '').slice(0, 16) // User-specific prefix
					
					// Immediately signal dashboard to remove from in-progress (submission happens in background)
					// Use user-specific localStorage keys to avoid conflicts with multiple students on same system
					localStorage.setItem(`exam-auto-finished-${userPrefix}`, 'true')
					localStorage.setItem(`last-exam-id-${userPrefix}`, finishedExamId)
					window.dispatchEvent(new CustomEvent('exam-auto-finished', { 
						detail: { examId: finishedExamId, userPrefix } 
					}))
					
					// Set message and start redirect countdown immediately
					setMessage('Exam time has ended. Your solutions are being submitted and finalized...')
					setRedirectCountdown(5)
					
					// Submit in background (don't await, let it happen async)
					submitAllAndFinish().then(() => {
						setMessage('Exam time has ended. Your solutions for all questions were submitted and finalized.')
					}).catch((error) => {
						console.error('Auto-finish submit failed:', error)
						setMessage('Exam time has ended. Your solutions are being submitted in the background.')
					})
					
					clearInterval(interval)
					return
				}
				
				// Check with server every 5 seconds to prevent drift
				if (elapsedSeconds % 5 === 0) {
					const timerData = await getExamTimer(token, examIdToUse)
					console.log('🕐 Timer sync - server time:', timerData.remaining_time, 'calculated:', currentRemainingTime)
					
                    if (timerData.auto_finished && !isAutoFinished) {
                        console.log('Exam auto-finished! Submitting all questions...')
                        setIsAutoFinished(true)
                        setFinished(true) // Set finished immediately to show completion screen
                        setRemainingTime(0) // Ensure timer shows 0:00
						// Clear persistent strike counter when backend marks auto-finished
						try { localStorage.removeItem(getStrikeKey(examId || '')) } catch {}
                        
						const finishedExamId = examIdToUse || examId
						const userPrefix = (token || '').slice(0, 16) // User-specific prefix
						
						// Immediately signal dashboard to remove from in-progress
						// Use user-specific localStorage keys to avoid conflicts with multiple students on same system
						localStorage.setItem(`exam-auto-finished-${userPrefix}`, 'true')
						localStorage.setItem(`last-exam-id-${userPrefix}`, finishedExamId)
						window.dispatchEvent(new CustomEvent('exam-auto-finished', { 
							detail: { examId: finishedExamId, userPrefix } 
						}))
						
						// Set message and start redirect countdown immediately
						setMessage('Exam time has ended. Your solutions are being submitted and finalized...')
						setRedirectCountdown(5)
						
                        // Submit in background (don't await, let it happen async)
						submitAllAndFinish().then(() => {
							setMessage('Exam time has ended. Your solutions for all questions were submitted and finalized.')
						}).catch((error) => {
							console.error('Auto-finish submit failed:', error)
							setMessage('Exam time has ended. Your solutions are being submitted in the background.')
						})
						
                        clearInterval(interval)
                        return
                    }
					
					// Update server time and reset start time
					serverRemainingTime = timerData.remaining_time
					serverStartTime = Date.now()
				}
			} catch (error) {
				console.error('Failed to sync timer:', error)
			}
		}, 1000) // Update display every second
		
		setTimerInterval(interval)
		console.log('Timer interval set')
	}
	
	const startAutoSave = (currentExamId?: string) => {
		console.log('💾 Auto-save starting with examId:', currentExamId)
		if (autoSaveInterval) clearInterval(autoSaveInterval)
		
		// Use the passed examId or current state
		const examIdToUse = currentExamId || examId
		console.log('💾 Auto-save using examId:', examIdToUse)
		
		if (!examIdToUse) {
			console.error('💾 No examId available for auto-save!')
			return
		}
		
		// Only start auto-save if user is actually a student and on the exam page
		if (role !== 'student') {
			console.log('❌ Auto-save not started - user is not a student')
			return
		}
		
		const interval = setInterval(async () => {
			const currentCode = codeRef.current
			console.log('💾 Silent backup auto-save - checking code:', currentCode.length, 'characters')
			// Save whatever is in the editor, even if it's empty
			try {
				if (!examIdToUse) {
					console.error('💾 No examId available for auto-save')
					return
				}
				await autoSaveCode(token, examIdToUse, currentCode)
				console.log('💾 Silent backup auto-save completed')
			} catch (error) {
				console.error('💾 Silent backup auto-save failed:', error)
			}
		}, 30000) // Auto-save every 30 seconds as backup (since we have immediate auto-save on keystroke)
		
		setAutoSaveInterval(interval)
		console.log('Auto-save interval set')
	}
	
	const stopTimerAndAutoSave = () => {
		if (timerInterval) {
			clearInterval(timerInterval)
			setTimerInterval(null)
		}
		if (autoSaveInterval) {
			clearInterval(autoSaveInterval)
			setAutoSaveInterval(null)
		}
		if (typingTimeoutRef.current) {
			clearTimeout(typingTimeoutRef.current)
			typingTimeoutRef.current = null
		}
		if (autoSaveTimeoutRef.current) {
			clearTimeout(autoSaveTimeoutRef.current)
			autoSaveTimeoutRef.current = null
		}
	}
	
	// Format time display
	const formatTime = (seconds: number) => {
		const hours = Math.floor(seconds / 3600)
		const minutes = Math.floor((seconds % 3600) / 60)
		const secs = seconds % 60
		
		if (hours > 0) {
			return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
		}
		return `${minutes}:${secs.toString().padStart(2, '0')}`
	}
	
	// Cleanup on unmount
	useEffect(() => {
		return () => {
			stopTimerAndAutoSave()
		}
	}, [])

	// Set examId from URL parameter whenever it changes
	useEffect(() => {
		if (urlExamId && role === 'student') {
			setExamId(urlExamId)
		}
	}, [urlExamId, role])

	// Auto-join exam if examId is provided in URL
	useEffect(() => {
		if (urlExamId && role === 'student' && !hasJoined) {
			// Check if this is a continue scenario
			const urlParams = new URLSearchParams(window.location.search)
			const isContinue = urlParams.get('continue') === 'true'
			
			if (isContinue) {
				// This is a continue scenario - load existing exam session
				continueExam(urlExamId)
			} else {
				// Auto-attempt to join the exam
				autoJoinExam(urlExamId)
			}
		}
	}, [urlExamId, role, hasJoined])

	// Check if exam is finished and redirect immediately - prevent access to this page
	// Only check if we have an examId from URL (not from manual entry)
	useEffect(() => {
		const checkAndRedirect = async () => {
			// Only check if examId comes from URL (urlExamId), not manual entry
			if (!urlExamId || role !== 'student') return
			
			try {
				const sessionData = await getSessionData(token, urlExamId)
				if (sessionData.finished === true) {
					console.log('🚫 Exam is finished - redirecting to prevent access to exam page')
					// Clear any active exam markers
					try { localStorage.removeItem('active-exam-id') } catch {}
					try { localStorage.removeItem(getStrikeKey(urlExamId)) } catch {}
					// Redirect immediately to student dashboard
					window.location.replace('/student')
					return
				}
			} catch (error) {
				// Don't redirect on error - allow manual join attempt
				console.log('ℹ️ No session found or error checking exam status - allowing join attempt')
			}
		}
		
		checkAndRedirect()
	}, [urlExamId, role, token])

	// Check for existing session on page load - only for URL-based examIds
	useEffect(() => {
		if (urlExamId && role === 'student' && !hasJoined) {
			// Check if student already has an active session (only for exams accessed via URL)
			checkExistingSession(urlExamId)
		}
	}, [urlExamId, role, hasJoined])

	// Cleanup timers when component unmounts or user navigates away
	useEffect(() => {
		return () => {
			console.log('🧹 Cleaning up timers on component unmount')
			if (pollingIntervalRef.current) {
				clearInterval(pollingIntervalRef.current)
				pollingIntervalRef.current = null
			}
			stopTimerAndAutoSave()
		}
	}, [])

	// Timer restoration effect - check for existing timer when component mounts
	useEffect(() => {
		if (examId && hasJoined && role === 'student') {
			// Check if there's an existing timer that needs to be restored
			restoreTimer()
		}
	}, [examId, hasJoined, role])

	// Periodic timer synchronization with backend
	useEffect(() => {
		if (examId && hasJoined && role === 'student' && remainingTime !== null && remainingTime > 0) {
			// Sync timer with backend every 30 seconds to prevent drift
			const syncInterval = setInterval(async () => {
				try {
					const timerData = await getExamTimer(token, examId)
					if (timerData.remaining_time !== null) {
						if (timerData.remaining_time <= 0 || timerData.auto_finished) {
                            // Timer expired, immediately remove from in-progress and submit in background
                            console.log('🕐 Backend timer expired, immediately removing from in-progress and auto-submitting all questions')
                            if (timerInterval) clearInterval(timerInterval)
                            setRemainingTime(0)
                            setIsAutoFinished(true)
                            setFinished(true) // Set finished immediately to show completion screen
                            
                            const userPrefix = (token || '').slice(0, 16) // User-specific prefix
                            
                            // Immediately signal dashboard to remove from in-progress (submission happens in background)
                            // Use user-specific localStorage keys to avoid conflicts with multiple students on same system
                            localStorage.setItem(`exam-auto-finished-${userPrefix}`, 'true')
                            localStorage.setItem(`last-exam-id-${userPrefix}`, examId)
                            window.dispatchEvent(new CustomEvent('exam-auto-finished', { 
								detail: { examId, userPrefix } 
							}))
                            
                            // Set message and start redirect countdown immediately
                            setMessage('Exam time has ended. Your solutions are being submitted and finalized...')
                            setRedirectCountdown(5)
                            
                            // Submit in background (don't await, let it happen async)
                            submitAllAndFinish().then(() => {
                                setMessage('Exam time has ended. All questions were submitted and finalized.')
                            }).catch((error) => {
                                console.error('Auto-expire submit failed:', error)
                                setMessage('Exam time has ended. Your solutions are being submitted in the background.')
                            })
						} else {
							// Sync with backend time to prevent drift
							setRemainingTime(timerData.remaining_time)
						}
					}
				} catch (error) {
					console.error('🕐 Timer sync failed:', error)
				}
			}, 30000) // Sync every 30 seconds

			return () => clearInterval(syncInterval)
		}
	}, [examId, hasJoined, role, remainingTime])

	async function join() {
		console.log('🔵 Join button clicked - examId:', examId, 'startCode:', startCode)
		if (!examId || !startCode) {
			setErrors('Please enter both Exam ID and Start Code')
			return
		}
		setErrors(null); setMessage('')
		setLoading(true)
		setLoadingMessage('Joining exam...')
		
		try {
			// If this is a brand-new session (no prior serial), clear any stale drafts for this exam
			// First, try to join the exam
			const response = await api(token, '/student/join', { method: 'POST', body: JSON.stringify({ exam_id: examId, start_code: startCode }) })
			
			// Handle different response scenarios
			if (response.has_serial) {
				// Student already has a system number, skip to exam
				setMessage('Welcome back! Continuing with your existing session.')
				setSerial(response.serial_number)
				setAssigned(response.assigned_question || [])
				setHasJoined(true)
				// Automatically proceed to exam
				await loadExam(examId)
			} else {
				// Student needs to enter system number
				setMessage('Exam joined successfully! Enter your system number within 2 minutes.')
				setHasJoined(true) // Show the system number input form
				// New session pathway → clear any leftover local drafts for this exam id
				clearLocalDraftsForExam(examId)
			}
		} catch (e: any) {
			// Handle specific error messages
			let errorMessage = 'Failed to join exam'
			if (e?.message) {
				if (e.message.includes('exam not found')) {
					errorMessage = 'Exam not found. Please check the Exam ID.'
				} else if (e.message.includes('invalid start code')) {
					errorMessage = 'Invalid start code. Please check the start code.'
				} else if (e.message.includes('exam is not live')) {
					errorMessage = 'This exam is not currently live. Please contact your instructor.'
				} else if (e.message.includes('exam already finished') || e.message.includes('exam already completed')) {
					// Exam is finished - redirect immediately
					console.log('🚫 Exam is finished - redirecting to prevent access')
					try { localStorage.removeItem('active-exam-id') } catch {}
					try { localStorage.removeItem(getStrikeKey(examId)) } catch {}
					window.location.replace('/student')
					return
				} else if (e.message.includes('you do not have access')) {
					errorMessage = 'You do not have access to this exam. Please contact your instructor.'
				} else {
					errorMessage = e.message
				}
			}
			setErrors(errorMessage)
			setLoading(false)
			setLoadingMessage('')
			return
		} finally {
			setLoading(false)
			setLoadingMessage('')
		}
	}

	// Auto-join exam when accessed via URL (from EnhancedStudentDashboard)
	async function autoJoinExam(examId: string) {
		setErrors(null)
		setMessage('')
		setLoading(true)
		setLoadingMessage('Joining exam...')
		
		// Get start code from URL parameters
		const urlParams = new URLSearchParams(window.location.search)
		const startCodeFromUrl = urlParams.get('startCode')
		
		if (startCodeFromUrl) {
			setStartCode(startCodeFromUrl)
		}
		
		// First, check if there's an existing active session
		try {
			const sessionData = await getSessionData(token, examId)
			// If exam is finished, redirect immediately
			if (sessionData.finished === true) {
				console.log('🚫 Exam is finished - redirecting to prevent access')
				try { localStorage.removeItem('active-exam-id') } catch {}
				try { localStorage.removeItem(getStrikeKey(examId)) } catch {}
				window.location.replace('/student')
				return
			}
			if (sessionData.serial_number && sessionData.finished === false) {
				// Active session exists - restore it
				console.log('✅ Found active session, restoring...')
				setSerial(sessionData.serial_number)
				setAssigned(sessionData.assigned_question || [])
				setHasJoined(true)
				try { localStorage.setItem('active-exam-id', examId) } catch {}
				await loadExam(examId)
				setLoading(false)
				setLoadingMessage('')
				return
			}
		} catch (e) {
			// No session or error - will try to join below
			console.log('ℹ️ No active session found, will join new')
		}
		
		try {
			// Try to join the exam with the start code from URL
			const response = await api(token, '/student/join', { method: 'POST', body: JSON.stringify({ exam_id: examId, start_code: startCodeFromUrl || '' }) })
			
			// Handle different response scenarios
			if (response.has_serial) {
                // Student already has a system number, skip to exam
                setMessage('Welcome back! Continuing with your existing session.')
				setSerial(response.serial_number)
				setAssigned(response.assigned_question || [])
                setHasJoined(true)
                // Keep existing drafts for this user+exam
				// Automatically proceed to exam
				await loadExam(examId)
                try { localStorage.setItem('active-exam-id', examId) } catch {}
			} else {
                // Student needs to enter system number
                setMessage('Validated. Enter your system number to start the exam.')
				setHasJoined(true) // Show the system number input form
				// New session via auto-join → clear any leftover local drafts for this exam id
				clearLocalDraftsForExam(examId)
			}
		} catch (e: any) {
			// If join fails due to rejoin disabled, check if session is finished
			if (e?.message?.includes('Rejoin disabled')) {
				try {
					const sessionData = await getSessionData(token, examId)
					if (sessionData.finished) {
						// Exam is finished - redirect immediately
						console.log('🚫 Exam is finished - redirecting to prevent access')
						try { localStorage.removeItem('active-exam-id') } catch {}
						try { localStorage.removeItem(getStrikeKey(examId)) } catch {}
						window.location.replace('/student')
						return
					} else {
						// Session exists but was ended - treat as new join
						setMessage('Please enter the exam details to join.')
						setErrors(null)
					}
				} catch {
					setMessage('Please enter the exam details to join.')
					setErrors(null)
				}
			} else if (e?.message?.includes('exam already finished') || e?.message?.includes('exam already completed')) {
				// Exam is finished - redirect immediately
				console.log('🚫 Exam is finished - redirecting to prevent access')
				try { localStorage.removeItem('active-exam-id') } catch {}
				try { localStorage.removeItem(getStrikeKey(examId)) } catch {}
				window.location.replace('/student')
				return
			} else {
				// Other errors - show manual join form
				setMessage('Please enter the exam details to join.')
				setErrors(null)
			}
		} finally {
			setLoading(false)
			setLoadingMessage('')
		}
	}

	// Restore timer from backend
	async function restoreTimer() {
		if (!examId) return
		
		try {
			console.log('🕐 Restoring timer for exam:', examId)
			const timerData = await getExamTimer(token, examId)
			console.log('🕐 Timer data received:', timerData)
			
			if (timerData.remaining_time !== null && timerData.remaining_time > 0) {
				// Timer is still running, restore it
				setRemainingTime(timerData.remaining_time)
				startTimer(examId)
				console.log('🕐 Timer restored with', timerData.remaining_time, 'seconds remaining')
			} else if (timerData.auto_finished) {
				// Timer has expired, exam was auto-finished
				console.log('🕐 Exam time has ended, auto-finished')
				setIsAutoFinished(true)
				setFinished(true)
				setRemainingTime(0)
				setMessage('Exam time has ended. Your exam has been automatically submitted.')
				setRedirectCountdown(5)
				// Don't start timer, exam is finished
			} else {
				// No active timer - exam not started or already finished
				console.log('🕐 No active timer found - exam may not be started yet')
				// If exam_start_time is null, the exam hasn't actually started (serial not entered)
				// Don't auto-finish in this case
				if (timerData.message && timerData.message.includes('not started')) {
					console.log('🕐 Exam not started - waiting for serial number entry')
					return
				}
			}
		} catch (error) {
			console.error('🕐 Failed to restore timer:', error)
		}
	}

	// Check if student already has an active session
	async function checkExistingSession(examIdToCheck?: string) {
		const examIdToUse = examIdToCheck || examId
		if (!examIdToUse) return
		
		try {
			console.log('🔍 Checking for existing session...')
			const sessionData = await getSessionData(token, examIdToUse)
			
			// If exam is finished, don't restore - but don't redirect here (let join functions handle it)
			if (sessionData.finished === true) {
				console.log('ℹ️ Exam is finished - not restoring session')
				return
			}
			
			// Only restore if session is actually active: has serial, not finished, and has exam_start_time
			if (sessionData.serial_number && sessionData.finished === false && sessionData.exam_start_time) {
				// Student has an active session, restore it
				console.log('✅ Found existing active session, restoring...')
				setSerial(sessionData.serial_number)
				setAssigned(sessionData.assigned_question || [])
				setHasJoined(true)
				
				// Start timer and auto-save for existing session
				startTimer(examIdToUse)
				startAutoSave(examIdToUse)
				
				// Restore timer from backend
				await restoreTimer()
				
				// Load any previously saved code
                try {
                    const savedCodeData = await getSavedCode(token, examIdToUse)
                    if (savedCodeData.code && questionId) {
                        setQuestionStates(prev => ({ ...prev, [questionId]: { code: savedCodeData.code, detailedResults: prev[questionId]?.detailedResults || [] } }))
                    }
                } catch (error) {
					console.log('No saved code found or failed to load:', error)
				}
				
				// Get initial timer data
				try {
					const initialTimerData = await getExamTimer(token, examIdToUse)
					setRemainingTime(initialTimerData.remaining_time)
				} catch (error) {
					console.error('Failed to get initial timer:', error)
				}
				
				// Load exam details
				await loadExam(examIdToUse)
			} else {
				console.log('ℹ️ No active session found (serial:', sessionData.serial_number, 'finished:', sessionData.finished, 'start_time:', sessionData.exam_start_time, ')')
			}
		} catch (error) {
			console.error('❌ Failed to check existing session:', error)
		}
	}

	// Continue existing exam session
	async function continueExam(examId: string) {
		setErrors(null)
		setMessage('')
		setLoading(true)
		setLoadingMessage('Loading your exam session...')
		
		// Set the exam ID first
		setExamId(examId)
		console.log('Continue exam - examId set to:', examId)
		
		try {
			// Get the current session data
			console.log('Getting session data for examId:', examId)
			const sessionData = await getSessionData(token, examId)
			console.log('Session data received:', sessionData)
			
			if (sessionData.serial_number) {
				// Student has a serial number, load the exam directly
				setSerial(sessionData.serial_number)
				setAssigned(sessionData.assigned_question || [])
                setHasJoined(true)
                // Keep drafts
				
				// Start timer and auto-save for existing session
				console.log('Continuing exam - starting timer and auto-save...')
				startTimer(examId)
				startAutoSave(examId)
				enterFullscreen()
				
				// Restore timer from backend
				await restoreTimer()
				
				// Load any previously saved code
                try {
                    const savedCodeData = await getSavedCode(token, examId)
                    if (savedCodeData.code && questionId) {
                        setQuestionStates(prev => ({ ...prev, [questionId]: { code: savedCodeData.code, detailedResults: prev[questionId]?.detailedResults || [] } }))
                    }
                } catch (error) {
					console.log('No saved code found or failed to load:', error)
				}
				
				// Get initial timer data
				try {
					const initialTimerData = await getExamTimer(token, examId)
					console.log('Initial timer data:', initialTimerData)
					setRemainingTime(initialTimerData.remaining_time)
				} catch (error) {
					console.error('Failed to get initial timer:', error)
				}
				
				// Load exam details
				console.log('Loading exam with examId:', examId)
                await loadExam(examId)
                try { localStorage.setItem('active-exam-id', examId) } catch {}
				setMessage('Welcome back! Your exam session has been restored.')
			} else {
				// No existing session, fall back to normal join
				setMessage('No existing session found. Please join the exam.')
			}
		} catch (e: any) {
			console.error('Failed to continue exam:', e)
			setErrors('Failed to load your exam session. Please try joining again.')
		} finally {
			setLoading(false)
			setLoadingMessage('')
		}
	}

	async function submitSerial() {
		setErrors(null)
		setLoading(true)
		setLoadingMessage('Submitting serial number...')
		
		try {
			const { deadline_epoch, assigned_question_ids } = await api(token, `/student/serial/${examId}`, { method: 'POST', body: JSON.stringify({ serial_number: serial }) })
			setDeadlineEpoch(deadline_epoch)
			setDeadlineEpoch(null)
			setAssigned(assigned_question_ids)
			setQuestionId(assigned_question_ids[0]) // Start with first question
            await fetchQuestionDetails(assigned_question_ids[0])
            // Keep drafts so refresh or logout retains code for this exam
            try { localStorage.setItem('active-exam-id', examId) } catch {}
			
			// Start timer and auto-save after successful serial submission
			console.log('Starting timer and auto-save with examId:', examId)
			if (!examId) {
				console.error('No examId available for timer/auto-save!')
				return
			}
			startTimer(examId)
			startAutoSave(examId)
			enterFullscreen()
			
			// Get initial timer data immediately
			try {
				const initialTimerData = await getExamTimer(token, examId)
				console.log('Initial timer data:', initialTimerData)
				setRemainingTime(initialTimerData.remaining_time)
			} catch (error) {
				console.error('Failed to get initial timer:', error)
			}
			
			// Load any previously saved code
            try {
                const savedCodeData = await getSavedCode(token, examId)
                if (savedCodeData.code && assigned_question_ids[0]) {
                    const firstQ = assigned_question_ids[0]
                    setQuestionStates(prev => ({ ...prev, [firstQ]: { code: savedCodeData.code, detailedResults: prev[firstQ]?.detailedResults || [] } }))
                }
            } catch (error) {
				console.log('No saved code found or failed to load:', error)
			}
			
			setMessage(`System number accepted. You have ${assigned_question_ids.length} question(s) assigned.`)
		} catch (e: any) {
			let errorMessage = 'Failed to submit system number'
			if (e?.message) {
				if (e.message.includes('serial already taken') || e.message.includes('already submitted a serial number')) {
					errorMessage = 'This system number is already taken. Please choose a different system number.'
				} else if (e.message.includes('serial window closed') || e.message.includes('deadline')) {
					errorMessage = 'The system number submission window has expired. Please contact your instructor.'
				} else if (e.message.includes('serial number must be between')) {
					errorMessage = e.message.replace('serial number', 'System number')
				} else if (e.message.includes('no session')) {
					errorMessage = 'No active exam session found. Please join the exam first.'
				} else if (e.message.includes('exam already finished')) {
					errorMessage = 'You have already completed this exam.'
				} else {
					errorMessage = e.message
				}
			}
			setErrors(errorMessage)
		} finally {
			setLoading(false)
			setLoadingMessage('')
		}
	}

	async function loadExam(examIdParam?: string) {
		setErrors(null)
		setLoading(true)
		setLoadingMessage('Loading exam...')
		
		// Use the passed examId or the state examId
		const currentExamId = examIdParam || examId
		
		if (!currentExamId) {
			setErrors('No exam ID provided')
			setLoading(false)
			return
		}
		
		try {
			// Get assignment details
			const assignment = await api(token, `/student/assignment/${currentExamId}`)
			setAssigned(assignment.question_ids || [])
			
			// Load first question if available
			if (assignment.question_ids && assignment.question_ids.length > 0) {
				setQuestionId(assignment.question_ids[0])
            await fetchQuestionDetails(assignment.question_ids[0], currentExamId)
            try { localStorage.setItem('active-exam-id', currentExamId) } catch {}
			}
			
			setMessage('Exam loaded successfully!')
			enterFullscreen()
		} catch (e: any) {
			setErrors(e?.message || 'Failed to load exam')
		} finally {
			setLoading(false)
			setLoadingMessage('')
		}
	}

	async function fetchQuestionDetails(qid: string, examIdParam?: string) {
		if (!qid) return
		const currentExamId = examIdParam || examId
		console.log('Fetching question details for examId:', currentExamId, 'questionId:', qid)
    const q = await getQuestionDetails(token, currentExamId, qid)
    setQuestionDetailsMap(prev => ({
        ...prev,
        [qid]: { text: q.text, publicTcs: q.public_test_cases || [] }
    }))
	}

useEffect(() => {
  if (questionId && examId) {
        fetchQuestionDetails(questionId, examId)
        // ensure state exists for this question
        setQuestionStates(prev => prev[questionId] ? prev : ({ ...prev, [questionId]: { code: '', detailedResults: [] } }))
        // Load per-user local draft only after joined and serial available
        try {
            if (hasJoined && serial !== null && serial !== undefined) {
                const v3key = buildDraftKey(examId, questionId)
                const savedV3 = localStorage.getItem(v3key)
                if (savedV3 !== null) {
                    setQuestionStates(prev => ({ ...prev, [questionId]: { code: savedV3, detailedResults: prev[questionId]?.detailedResults || [], lastSubmittedCode: prev[questionId]?.lastSubmittedCode } }))
                } else {
                    // Migrate old v2 key to v3 if present for same user
                    const userKeyPrefix = (token || '').slice(0, 16)
                    const v2key = `code:v2:${userKeyPrefix}:${examId}:${questionId}`
                    const savedV2 = localStorage.getItem(v2key)
                    if (savedV2 !== null) {
                        localStorage.setItem(v3key, savedV2)
                        localStorage.removeItem(v2key)
                        setQuestionStates(prev => ({ ...prev, [questionId]: { code: savedV2, detailedResults: prev[questionId]?.detailedResults || [], lastSubmittedCode: prev[questionId]?.lastSubmittedCode } }))
                    }
                }
            }
        } catch {}
    }
}, [questionId, examId, hasJoined, serial])

// Load persisted strikes when examId becomes known
useEffect(() => {
  try {
    if (examId || urlExamId) {
      const v = localStorage.getItem(getStrikeKey(examId || urlExamId || ''))
      if (v !== null) setStrikeCount(Number(v) || 0)
    }
  } catch {}
}, [examId, urlExamId])

	async function submit() {
    setErrors(null); setMessage('')
    setIsSubmitting(true)
    setHasSubmitted(true)
    // Scroll to results area so user sees progress inline
    setTimeout(() => {
        try { resultsAreaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }) } catch {}
    }, 0)
		
		try {
			console.log('Starting submission...')
			
			// Submit to backend for tracking and AI evaluation
			setLoadingMessage('Submitting and evaluating code...')
            const currentCode = questionStates[questionId]?.code || ''
            const submitResult = await api(token, `/student/submit/${examId}`, { 
                method: 'POST', 
                body: JSON.stringify({ question_id: questionId, code: currentCode }) 
            })
			console.log('Submit result:', submitResult)
			console.log('Submit result keys:', Object.keys(submitResult))
			console.log('Detailed results from backend:', submitResult.detailed_results)
			console.log('Detailed results type:', typeof submitResult.detailed_results)
			console.log('Detailed results length:', submitResult.detailed_results?.length)
			console.log('Public results from backend:', submitResult.public_case_results)
			
			// Use the results from the backend submission (may be empty initially due to async evaluation)
           setPublicResults(submitResult.public_case_results || null)
           const results = submitResult.detailed_results || []
           setDetailedResults(results)
           setQuestionStates(prev => ({ ...prev, [questionId]: { code: currentCode, detailedResults: results, lastSubmittedCode: currentCode } }))
            setHasSubmitted(true)
			console.log('Set detailed results to:', submitResult.detailed_results || [])
            setMessage('Submitted. Test cases are updating below. AI feedback may continue in the background.')
			
			// Poll for updated results since evaluation happens asynchronously
			if ((submitResult.detailed_results || []).length === 0) {
				// Clear any existing polling interval
				if (pollingIntervalRef.current) {
					clearInterval(pollingIntervalRef.current)
					pollingIntervalRef.current = null
				}
				
				console.log('Results empty, starting polling for updated results...')
				let pollAttempts = 0
				const maxAttempts = 20 // Poll for up to 20 attempts (60 seconds)
				pollingIntervalRef.current = setInterval(async () => {
					pollAttempts++
					try {
						const submissionsResponse = await api(token, `/student/submissions/${examId}`)
						const submissions = submissionsResponse?.submissions || []
						// Find the latest submission for this question
						const latestSub = submissions
							.filter((s: any) => s.question_id === questionId)
							.sort((a: any, b: any) => {
								const timeA = new Date(a.submitted_at || 0).getTime()
								const timeB = new Date(b.submitted_at || 0).getTime()
								return timeB - timeA
							})[0]
						
						if (latestSub && latestSub.detailed_results && latestSub.detailed_results.length > 0) {
							console.log('✅ Found updated results:', latestSub.detailed_results)
							setPublicResults(latestSub.public_case_results || null)
							setDetailedResults(latestSub.detailed_results)
							setQuestionStates(prev => ({ ...prev, [questionId]: { 
								code: currentCode, 
								detailedResults: latestSub.detailed_results, 
								lastSubmittedCode: currentCode 
							}}))
							clearInterval(pollingIntervalRef.current!)
							pollingIntervalRef.current = null
							setMessage('Test case evaluation completed!')
						} else if (pollAttempts >= maxAttempts) {
							console.log('⚠️ Polling timeout - stopping')
							clearInterval(pollingIntervalRef.current!)
							pollingIntervalRef.current = null
							setMessage('Test case evaluation is taking longer than expected. Results will appear when ready.')
						}
					} catch (pollError) {
						console.error('Polling error:', pollError)
						if (pollAttempts >= maxAttempts) {
							clearInterval(pollingIntervalRef.current!)
							pollingIntervalRef.current = null
						}
					}
				}, 3000) // Poll every 3 seconds
			}
		} catch (e: any) {
			console.error('Submission error:', e)
			setErrors(e?.message || 'Submission failed')
		} finally {
            setIsSubmitting(false)
		}
	}

async function submitAllAndFinish() {
    // Submit all questions' code and finish the exam
    let submittedCount = 0
    // Get session to detect already-submitted questions
    let alreadySubmitted = new Set<string>()
    try {
        const session = await getSessionData(token, examId)
        const subs: any[] = (session?.submissions || [])
        subs.forEach((s: any) => { if (s?.question_id) alreadySubmitted.add(s.question_id) })
    } catch {}
    for (const qid of assigned) {
        const stateForQ = questionStates[qid]
        let codeForQ = (stateForQ?.code || '').trim()
        if (!codeForQ) {
            // Try to load last local draft for this question
            try {
                const draft = localStorage.getItem(buildDraftKey(examId, qid))
                if (typeof draft === 'string') codeForQ = draft.trim()
            } catch {}
        }
        if (!codeForQ) continue
        // If this question already has a submission in session, skip sending again
        if (alreadySubmitted.has(qid)) {
            continue
        }
        // If unchanged vs lastSubmittedCode, still ensure it's present on server: allow resubmission
        try {
            await api(token, `/student/submit/${examId}`, {
                method: 'POST',
                body: JSON.stringify({ question_id: qid, code: codeForQ })
            })
            setQuestionStates(prev => ({ ...prev, [qid]: { code: codeForQ, detailedResults: prev[qid]?.detailedResults || [], lastSubmittedCode: codeForQ } }))
            submittedCount += 1
        } catch (error) {
            console.error(`Failed to submit code for ${qid}:`, error)
        }
    }
    await api(token, `/student/finish/${examId}`, { method: 'POST' })
    return submittedCount
}

async function endExam() {
    console.log('🛑 endExam called - setting finished and redirect countdown')
    // Non-blocking finish: no full-screen overlay
    stopTimerAndAutoSave()
    setFinished(true)
    setMessage('Exam finished. Submissions are being finalized in the background.')
    setRedirectCountdown(5)
    console.log('✅ Set finished=true and redirectCountdown=5')
    // Immediately signal EnhancedStudentDashboard to refresh (same as auto-finish path)
    try {
        const userPrefix = (token || '').slice(0, 16)
        if (examId) {
            localStorage.setItem(`exam-auto-finished-${userPrefix}`, 'true')
            localStorage.setItem(`last-exam-id-${userPrefix}`, examId)
            window.dispatchEvent(new CustomEvent('exam-auto-finished', { detail: { examId, userPrefix } }))
        }
    } catch {}
    // Clear persistent strike counter for this exam on finish
    try { localStorage.removeItem(getStrikeKey(examId || urlExamId || '')) } catch {}
    try { localStorage.removeItem('active-exam-id') } catch {}
    submitAllAndFinish()
      .then((submittedCount) => {
        setMessage(`Exam finished. Submitted ${submittedCount}/${assigned.length} question(s).`)
        // Only after finalization, clear local drafts
        try { clearLocalDraftsForExam(examId) } catch {}
      })
      .catch((e: any) => {
        console.error('Background finalize failed:', e)
        setErrors(e?.message || 'Finalize in background failed')
      })
}

// Countdown effect for auto-redirect - use interval for reliability
useEffect(() => {
    console.log('⏱️ Redirect countdown effect - finished:', finished, 'countdown:', redirectCountdown)
    
    // Safety: if finished but countdown is null, set it to 5
    if (finished && redirectCountdown === null) {
        console.log('⚠️ Finished but countdown is null - setting to 5')
        setRedirectCountdown(5)
        return
    }
    
    if (finished && redirectCountdown !== null && redirectCountdown > 0) {
        console.log(`⏱️ Starting countdown interval from ${redirectCountdown}`)
        // Use interval instead of recursive setTimeout for better reliability
        const interval = setInterval(() => {
            setRedirectCountdown(prev => {
                if (prev === null || prev <= 0) {
                    return 0
                }
                const newVal = prev - 1
                console.log(`⏱️ Countdown decremented: ${prev} → ${newVal}`)
                return newVal
            })
        }, 1000)
        return () => {
            console.log('⏱️ Clearing countdown interval')
            clearInterval(interval)
        }
    } else if (finished && redirectCountdown === 0) {
        console.log('🔄 Redirect countdown reached 0 - redirecting now')
        try { 
            window.location.replace('/student') 
        } catch (error) { 
            console.error('Redirect failed:', error)
            navigate('/student') 
        }
    }
}, [finished, redirectCountdown, navigate])

	// Removed countdown - no time limit for serial number entry
	const monacoLang = languages.find(l => l.id === language)?.monaco || 'plaintext'

	const gated = !hasJoined && assigned.length === 0 && !finished

	return (
		<Box sx={{ maxWidth: 1000, mx: 'auto', p: 3 }}>
			<LoadingScreen open={loading} message={loadingMessage} />
			<Typography variant="h5" sx={{ mb: 2 }}>Student Dashboard</Typography>
			{errors && <Alert severity="error" sx={{ mb: 2 }}>{errors}</Alert>}
			{message && !finished && (
				<Alert 
					severity="info" 
					sx={{ mb: 2 }}
				>
					{message}
				</Alert>
			)}

			{/* Strike warnings */}
			{!finished && hasJoined && assigned.length > 0 && strikeMessage && (
				<Alert severity={strikeCount >= 3 ? 'error' : 'warning'} sx={{ mb: 2 }}>
					{strikeMessage}
				</Alert>
			)}

			{finished && (
				<Paper sx={{ p: 4, textAlign: 'center', mb: 2 }}>
					<Typography variant="h4" sx={{ mb: 2, color: 'success.main' }}>
						✓ Exam Completed
					</Typography>
					<Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
						Your exam has been submitted. Processing continues in the background.
					</Typography>
					<Stack direction="row" spacing={1} justifyContent="center" sx={{ mb: 2 }}>
						<Chip label="Redirecting…" size="small" />
					</Stack>
					{redirectCountdown !== null && redirectCountdown > 0 && (
						<Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
							You will be redirected to your dashboard in {redirectCountdown} second{redirectCountdown !== 1 ? 's' : ''}...
						</Typography>
					)}
					<Button 
						variant="contained" 
						color="primary"
						size="large"
						onClick={() => navigate('/student')}
						sx={{ mt: 2 }}
					>
						Go to Dashboard
					</Button>
				</Paper>
			)}

			{/* Non-blocking warning with OK */}
{/* Fullscreen dialog with 5s countdown */}
<Dialog open={needsFullscreen && !finished && hasJoined && assigned.length > 0} disableEscapeKeyDown>
    <DialogTitle>Fullscreen Required</DialogTitle>
    <DialogContent>
        <Typography sx={{ mb: 1 }}>
            You exited fullscreen. Click Re-enter to continue the exam.
        </Typography>
        <Typography variant="body2" color="text.secondary">
            Auto-ending in {fsSeconds !== null ? fsSeconds : 5}s if not in fullscreen.
        </Typography>
    </DialogContent>
    <DialogActions>
        <Button variant="contained" onClick={async () => {
            try { await enterFullscreen() } catch {}
            // if successful, handlers will close dialog via fullscreenchange
        }}>Re-enter</Button>
    </DialogActions>
</Dialog>

            {leaveSeconds !== null && !finished && hasJoined && assigned.length > 0 && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                    You left the exam tab. Return within {leaveSeconds}s or the exam will be ended.
                </Alert>
            )}

			{gated && (
				<Paper sx={{ p: 2, mb: 2 }}>
					<Typography variant="subtitle1" sx={{ mb: 1 }}>Join Exam</Typography>
					<Box sx={{ display: 'grid', gap: 1, gridTemplateColumns: '1fr 1fr 1fr' }}>
						<TextField label="Exam ID" value={examId} onChange={e => setExamId(e.target.value)} />
						<TextField label="Start Code" value={startCode} onChange={e => setStartCode(e.target.value)} />
						<Button variant="contained" onClick={join}>Join</Button>
					</Box>
				</Paper>
			)}

			{hasJoined && !finished && !assigned.length && (
				<Paper sx={{ p: 2, mb: 2 }}>
					<Typography variant="subtitle1" sx={{ mb: 1 }}>Enter System Number</Typography>
					<Box sx={{ display: 'grid', gap: 1, gridTemplateColumns: '1fr 1fr' }}>
						<TextField label="System # (1..n)" type="number" value={serial} onChange={e => setSerial(Number(e.target.value))} />
						<Button variant="contained" onClick={submitSerial}>Submit System Number</Button>
					</Box>
				</Paper>
			)}

			{hasJoined && !finished && assigned.length > 0 && (
				<>
					{/* Timer Display */}
					{remainingTime !== null && (
						<Paper sx={{ p: 2, mb: 2, backgroundColor: remainingTime < 300 ? '#ffebee' : '#e8f5e8' }}>
							<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
								<Typography variant="h6" color={remainingTime < 300 ? 'error' : 'primary'}>
									Time Remaining: {formatTime(remainingTime)}
								</Typography>
								{remainingTime < 60 && (
									<Typography variant="body2" color="error">
										⚠️ Less than 1 minute remaining!
									</Typography>
								)}
							</Box>
						</Paper>
					)}
					
					{/* Auto-save happens silently in background - no visual indicator */}
					
					<Paper sx={{ p: 2, mb: 2 }}>
						<Typography variant="subtitle1" sx={{ mb: 1 }}>Assigned Questions ({assigned.length})</Typography>
                        {assigned.map((qid, index) => (
							<Box key={qid} sx={{ mb: 2, p: 2, border: '1px solid #ccc', borderRadius: 1 }}>
								<Typography variant="h6" sx={{ mb: 1 }}>Question {index + 1}: {qid}</Typography>
                                <Typography sx={{ whiteSpace: 'pre-wrap', mb: 2 }}>{questionDetailsMap[qid]?.text || ''}</Typography>
								<Typography variant="subtitle2">Public Test Cases</Typography>
                                {(questionDetailsMap[qid]?.publicTcs?.length || 0) === 0 && <Typography>No public test cases.</Typography>}
                                {(questionDetailsMap[qid]?.publicTcs || []).map((tc, i) => (
									<Box key={i} sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, py: 0.5 }}>
										<TextField label={`Input ${i+1}`} value={tc.input} InputProps={{ readOnly: true }} />
										<TextField label={`Expected ${i+1}`} value={tc.expected_output} InputProps={{ readOnly: true }} />
									</Box>
								))}
							</Box>
						))}
					</Paper>

					<Paper sx={{ p: 2, mb: 2 }}>
						<Typography variant="subtitle1" sx={{ mb: 1 }}>Coding</Typography>
						<Box sx={{ display: 'grid', gap: 1, gridTemplateColumns: '1fr 1fr 1fr' }}>
							<TextField label="Question" select value={questionId} onChange={e => setQuestionId(e.target.value)}>
								{assigned.map(qid => <MenuItem key={qid} value={qid}>{qid}</MenuItem>)}
							</TextField>
							<TextField label="Language" select value={language} onChange={e => setLanguage(e.target.value)}>
								{languages.map(l => <MenuItem key={l.id} value={l.id}>{l.id}</MenuItem>)}
							</TextField>
							<Button variant="contained" onClick={submit}>Submit</Button>
						</Box>
                        <Box sx={{ height: 420, mt: 1 }}>
                            <Editor 
								height="100%" 
								defaultLanguage={monacoLang} 
								value={questionStates[questionId]?.code || ''} 
								onChange={handleCodeChange} 
								theme={isDark ? 'vs-dark' : 'light'}
								options={{ 
									fontSize: 14,
									automaticLayout: true,
									minimap: { enabled: false },
									scrollBeyondLastLine: false,
									readOnly: false // Allow typing and copy/cut, paste allowed only for content copied from exam page
								}} 
								onMount={(editor, monaco) => {
									// Track copy and conditionally allow paste in Monaco editor
									// Copy/paste is allowed within the exam page (tracked by document-level handlers)
									if (hasJoined && !finished && assigned.length > 0) {
										// Track copy via keydown - don't prevent default, just track after copy happens
										editor.onKeyDown((e) => {
											if ((e.ctrlKey || e.metaKey) && e.keyCode === monaco.KeyCode.KeyC && !e.shiftKey) {
												// Don't prevent default - let Monaco's copy execute
												// Track after a delay to ensure copy completes
												setTimeout(() => {
													monacoCopyTimestampRef.current = Date.now()
													console.log('✅ Copy from Monaco tracked (keydown)')
												}, 100)
											}
											// Conditionally block paste based on tracking (backup to document-level handler)
											if ((e.ctrlKey || e.metaKey) && e.keyCode === monaco.KeyCode.KeyV) {
												const now = Date.now()
												const timeSinceCopy = now - monacoCopyTimestampRef.current
												const isValidCopy = monacoCopyTimestampRef.current > 0 && timeSinceCopy < MONACO_COPY_VALID_DURATION
												if (!isValidCopy) {
													e.preventDefault()
													e.stopPropagation()
													console.log('❌ Paste blocked in Monaco - content not from exam page')
													return
												}
												console.log('✅ Paste allowed in Monaco - content from exam page')
											}
										})
									}
								}}
							/>
                        </Box>
					</Paper>

					{console.log('Rendering detailed results:', questionStates[questionId]?.detailedResults)}
					{hasSubmitted ? (
						<Paper sx={{ p: 2, mb: 2 }} ref={resultsAreaRef}>
							<Typography variant="subtitle1">Detailed Test Case Results</Typography>
							{(isSubmitting || ((questionStates[questionId]?.detailedResults || []).length === 0)) && (
								<Stack direction="row" spacing={1} alignItems="center" sx={{ my: 1 }}>
									<Chip label={isSubmitting ? "Submitting and evaluating…" : "Evaluating test cases…"} size="small" color="primary" />
									<Typography variant="body2" color="text.secondary">
										{isSubmitting ? "This may take a few seconds." : "Results will appear here when evaluation completes."}
									</Typography>
								</Stack>
							)}
							{(questionStates[questionId]?.detailedResults || []).map((result, i) => {
								if (!result) return null;
								return (
									<Paper key={i} sx={{ p: 2, mb: 2, border: '1px solid', borderColor: result.passed ? 'success.main' : 'error.main' }}>
										<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
											<Chip 
												label={`Test ${i+1}: ${result.passed ? 'PASS' : 'FAIL'}`} 
												color={result.passed ? 'success' : 'error'} 
												size="small" 
											/>
											{result.execution_time && (
												<Typography variant="caption" color="text.secondary">
													Execution time: {result.execution_time.toFixed(3)}s
												</Typography>
											)}
										</Stack>
										
										<Grid container spacing={2}>
											<Grid item xs={12} sm={6}>
												<Typography variant="subtitle2" color="primary">Input:</Typography>
												<Paper sx={{ p: 1, bgcolor: 'grey.50', fontFamily: 'monospace', fontSize: '0.875rem' }}>
													{result.input || '(no input)'}
												</Paper>
											</Grid>
											
											<Grid item xs={12} sm={6}>
												<Typography variant="subtitle2" color="success.main">Expected Output:</Typography>
												<Paper sx={{ p: 1, bgcolor: 'success.light', fontFamily: 'monospace', fontSize: '0.875rem' }}>
													{result.expected_output || '(no expected output)'}
												</Paper>
											</Grid>
											
											<Grid item xs={12} sm={6}>
												<Typography variant="subtitle2" color={result.passed ? 'success.main' : 'error.main'}>Your Output:</Typography>
												<Paper sx={{ p: 1, bgcolor: result.passed ? 'success.light' : 'error.light', fontFamily: 'monospace', fontSize: '0.875rem' }}>
													{result.actual_output || '(no output)'}
												</Paper>
											</Grid>
											
											{result.error && (
												<Grid item xs={12} sm={6}>
													<Typography variant="subtitle2" color="error.main">Error:</Typography>
													<Paper sx={{ p: 1, bgcolor: 'error.light', fontFamily: 'monospace', fontSize: '0.875rem' }}>
														{result.error}
													</Paper>
												</Grid>
											)}
										</Grid>
									</Paper>
								);
							})}
						</Paper>
					) : null}

					<Button variant="outlined" color="error" onClick={endExam}>End Exam</Button>
				</>
			)}
		</Box>
	)
}

// Removed useCountdown function - no time limit for serial number entry
