import { useEffect, useState, createContext, useContext } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { login as apiLogin, whoami, UserRole } from './api'
import FacultyDashboard from './components/FacultyDashboard'
import EnhancedStudentDashboard from './components/EnhancedStudentDashboard'
import AdminDashboard from './components/AdminDashboard'
import StudentDashboard from './components/StudentDashboard'
import SuperAdminDashboard from './components/SuperAdminDashboard'
import { ThemeProvider } from '@mui/material/styles'
import { lightTheme, darkTheme } from './theme'
import { CssBaseline, AppBar, Toolbar, Typography, Button, Box, TextField, Alert, IconButton, InputAdornment, Tooltip } from '@mui/material'
import { Visibility, VisibilityOff, LightMode, DarkMode } from '@mui/icons-material'

type ThemeMode = 'light' | 'dark'

interface ThemeContextType {
	mode: ThemeMode
	toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType>({
	mode: 'light',
	toggleTheme: () => {}
})

export const useThemeMode = () => useContext(ThemeContext)

function TopBar() {
	const navigate = useNavigate()
	const { mode, toggleTheme } = useThemeMode()
	const [role, setRole] = useState<UserRole | null>(null)
	const [username, setUsername] = useState<string>('')
	const [collegeName, setCollegeName] = useState<string>('')
	const [authLoading, setAuthLoading] = useState(true)
	
	useEffect(() => {
		const checkAuth = () => {
			const token = localStorage.getItem('token')
			const storedRole = localStorage.getItem('role') as UserRole | null
			
			if (!token || !storedRole) {
				setRole(null)
				setUsername('')
				setAuthLoading(false)
				return
			}
			
			// Verify authentication with server before showing logged-in state
			whoami(token).then(u => {
				setRole(storedRole)
				setUsername(u.username || '')
				setCollegeName(u.college_name || '')
				// Store username and college_id for template isolation
				if (u.username) {
					localStorage.setItem('username', u.username)
				}
				if (u.college_id) {
					localStorage.setItem('college_id', u.college_id)
				}
				setAuthLoading(false)
			}).catch((err) => {
				// Clear session on any authentication error
				setUsername('')
				setCollegeName('')
				setRole(null)
				setAuthLoading(false)
				localStorage.removeItem('token')
				localStorage.removeItem('role')
				localStorage.removeItem('username')
				localStorage.removeItem('college_id')
			})
		}
		
		// Check auth on mount
		checkAuth()
		
		// Listen for storage changes (when user logs in/out in another tab)
		const handleStorageChange = (e: StorageEvent) => {
			if (e.key === 'token' || e.key === 'role') {
				checkAuth()
			}
		}
		
		// Listen for custom auth events (when user logs in/out in same tab)
		const handleAuthChange = () => {
			checkAuth()
		}
		
		window.addEventListener('storage', handleStorageChange)
		window.addEventListener('auth-changed', handleAuthChange)
		
		// Disable periodic checks to prevent race conditions
		// const interval = setInterval(checkAuth, 10000)
		
		return () => {
			window.removeEventListener('storage', handleStorageChange)
			window.removeEventListener('auth-changed', handleAuthChange)
			// clearInterval(interval)
		}
	}, [])
	
	async function logout() {
		const role = localStorage.getItem('role')
		const token = localStorage.getItem('token') || ''
		const activeExamId = localStorage.getItem('active-exam-id')
		if (role === 'student' && activeExamId) {
			// Verify session really exists and is not finished before prompting
			let hasActive = false
			try {
				const res = await fetch(`${(import.meta as any).env?.VITE_API_BASE || 'http://127.0.0.1:8000'}/student/session/${activeExamId}`, {
					headers: { Authorization: `Bearer ${token}` }
				})
				if (res.ok) {
					const data = await res.json()
					hasActive = data && data.finished === false
				} else {
					hasActive = false
				}
			} catch { hasActive = false }
			if (hasActive) {
				const proceed = window.confirm('Logging out will end your current exam. Do you want to logout and end the exam?')
				if (!proceed) return
				try {
					await fetch(`${(import.meta as any).env?.VITE_API_BASE || 'http://127.0.0.1:8000'}/student/finish/${activeExamId}`, {
						method: 'POST',
						headers: { Authorization: `Bearer ${token}` }
					})
				} catch {}
			}
			try { localStorage.removeItem('active-exam-id') } catch {}
			try { localStorage.removeItem(`exam-strikes:v1:${activeExamId}`) } catch {}
		}
		localStorage.removeItem('token')
		localStorage.removeItem('role')
		localStorage.removeItem('username')
		localStorage.removeItem('college_id')
		setRole(null)
		setUsername('')
		setCollegeName('')
		
		// Dispatch custom event to notify TopBar of auth change
		window.dispatchEvent(new CustomEvent('auth-changed'))
		
		navigate('/')
	}
	return (
		<AppBar position="static" elevation={0}>
			<Toolbar sx={{ py: 1.5, px: 3 }}>
				<Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700, letterSpacing: '-0.025em', color: 'text.primary' }}>
					LabSense
				</Typography>
				<Tooltip title={mode === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}>
					<IconButton
						onClick={toggleTheme}
						sx={{
							color: 'text.primary',
							mr: 2,
							'&:hover': {
								backgroundColor: 'action.hover',
							}
						}}
						aria-label="toggle theme"
					>
						{mode === 'light' ? <DarkMode /> : <LightMode />}
					</IconButton>
				</Tooltip>
				{!authLoading && role && (
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mr: 3 }}>
						<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
							<Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', fontSize: '0.875rem' }}>
								{username}
							</Typography>
							<Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
								({role})
							</Typography>
							{collegeName && (
								<>
									<Box sx={{ width: 3, height: 3, borderRadius: '50%', bgcolor: 'text.secondary', opacity: 0.6 }} />
									<Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
										{collegeName}
									</Typography>
								</>
							)}
						</Box>
						{role === 'faculty' && (
							<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
								<Box sx={{ width: 3, height: 3, borderRadius: '50%', bgcolor: 'text.secondary', opacity: 0.6 }} />
								<Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.875rem', fontWeight: 500 }}>
									Faculty Panel
								</Typography>
							</Box>
						)}
						{role === 'student' && (
							<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
								<Box sx={{ width: 3, height: 3, borderRadius: '50%', bgcolor: 'text.secondary', opacity: 0.6 }} />
								<Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.875rem', fontWeight: 500 }}>
									Student Panel
								</Typography>
							</Box>
						)}
						{role === 'admin' && (
							<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
								<Box sx={{ width: 3, height: 3, borderRadius: '50%', bgcolor: 'text.secondary', opacity: 0.6 }} />
								<Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.875rem', fontWeight: 500 }}>
									Admin Panel
								</Typography>
							</Box>
						)}
						{role === 'super_admin' && (
							<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
								<Box sx={{ width: 3, height: 3, borderRadius: '50%', bgcolor: 'text.secondary', opacity: 0.6 }} />
								<Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.875rem', fontWeight: 500 }}>
									Super Admin Panel
								</Typography>
							</Box>
						)}
					</Box>
				)}
				{!authLoading && role && (
					<Button 
						onClick={logout} 
						sx={{
							color: 'text.primary',
							fontSize: '0.875rem',
							fontWeight: 500,
							textTransform: 'none',
							'&:hover': {
								backgroundColor: 'action.hover',
							}
						}}
					>
						Logout
					</Button>
				)}
			</Toolbar>
		</AppBar>
	)
}

function LoginPage() {
	const navigate = useNavigate()
	const [username, setUsername] = useState('')
	const [password, setPassword] = useState('')
	const [showPassword, setShowPassword] = useState(false)
	const [error, setError] = useState<string | null>(null)

	async function handleLogin() {
		try {
			const data = await apiLogin(username, password)
			localStorage.setItem('token', data.access_token)
			localStorage.setItem('role', data.role)
			localStorage.setItem('username', username) // Store username for template keys
			
			// Fetch user info to get college_id
			try {
				const userInfo = await whoami(data.access_token)
				if (userInfo.college_id) {
					localStorage.setItem('college_id', userInfo.college_id)
				}
			} catch (e) {
				console.warn('Could not fetch college_id:', e)
			}
			
			// Dispatch custom event to notify TopBar of auth change
			window.dispatchEvent(new CustomEvent('auth-changed'))
			
			if (data.role === 'faculty') {
				navigate('/faculty')
			} else if (data.role === 'student') {
				navigate('/student')
			} else if (data.role === 'admin') {
				navigate('/admin')
			} else if (data.role === 'super_admin') {
				navigate('/super-admin')
			}
		} catch (e: any) {
			// Parse error message to show specific errors
			let errorMessage = 'Login failed'
			if (e?.message) {
				if (e.message.includes('Invalid username/email or password')) {
					errorMessage = 'Invalid username/email or password'
				} else if (e.message.includes('already joined')) {
					errorMessage = 'You have already joined this exam'
				} else if (e.message.includes('exam is not live')) {
					errorMessage = 'Exam is not currently live'
				} else if (e.message.includes('invalid start code')) {
					errorMessage = 'Invalid start code'
				} else {
					errorMessage = e.message
				}
			}
			setError(errorMessage)
		}
	}

	return (
		<Box sx={{ 
			minHeight: 'calc(100vh - 100px)', 
			display: 'flex', 
			alignItems: 'center', 
			justifyContent: 'center',
			bgcolor: 'background.default'
		}}>
			<Box sx={{ 
				maxWidth: 440, 
				width: '100%',
				mx: 2,
				p: 4, 
				bgcolor: 'background.paper',
				border: '1.5px solid',
				borderColor: 'divider',
				borderRadius: 2,
				boxShadow: 2
			}}>
				<Typography variant="h4" sx={{ mb: 1, fontWeight: 700, textAlign: 'center' }}>
					Welcome Back
				</Typography>
				<Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
					Sign in to your LabSense account
				</Typography>
				{error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
				<TextField
					label="Username or Email"
					fullWidth
					margin="normal"
					value={username}
					onChange={(e) => setUsername(e.target.value)}
					sx={{ mb: 2 }}
				/>
				<TextField
					label="Password"
					type={showPassword ? "text" : "password"}
					fullWidth
					margin="normal"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					InputProps={{
						endAdornment: (
							<InputAdornment position="end">
								<IconButton
									aria-label="toggle password visibility"
									onClick={() => setShowPassword(!showPassword)}
									edge="end"
								>
									{showPassword ? <VisibilityOff /> : <Visibility />}
								</IconButton>
							</InputAdornment>
						),
					}}
				/>
				<Button 
					variant="contained" 
					color="primary" 
					fullWidth 
					onClick={handleLogin} 
					sx={{ mt: 3, py: 1.5, fontSize: '1rem', fontWeight: 600 }}
				>
					Sign In
				</Button>
			</Box>
		</Box>
	)
}

function useAuth() {
	const token = localStorage.getItem('token')
	const role = (localStorage.getItem('role') as UserRole | null)
	return { token, role }
}

function Protected({ children, allow }: { children: JSX.Element, allow: UserRole }) {
	const { token, role } = useAuth()
	const [ok, setOk] = useState<boolean | null>(null)

	useEffect(() => {
		async function check() {
			console.log('Protected component checking auth:', { token: !!token, role, allow });
			if (!token || role !== allow) {
				console.log('Auth check failed: no token or role mismatch');
				return setOk(false);
			}
			try { 
				await whoami(token); 
				console.log('Auth check passed');
				setOk(true) 
			} catch (err) { 
				console.log('Auth check failed with error:', err);
				setOk(false) 
			}
		}
		check()
	}, [token, role, allow])

	if (ok === null) return <p style={{ padding: 24 }}>Loading…</p>
	if (!ok) return <Navigate to="/" replace />
	return children
}

function Faculty() { return <FacultyDashboard /> }
function Student() { return <EnhancedStudentDashboard /> }
function Admin() { return <AdminDashboard /> }
function SuperAdmin() { return <SuperAdminDashboard /> }

export default function App() {
	const [mode, setMode] = useState<ThemeMode>(() => {
		const saved = localStorage.getItem('themeMode') as ThemeMode
		return saved || 'light'
	})

	const toggleTheme = () => {
		const newMode = mode === 'light' ? 'dark' : 'light'
		setMode(newMode)
		localStorage.setItem('themeMode', newMode)
	}

	const theme = mode === 'light' ? lightTheme : darkTheme

	return (
		<ThemeContext.Provider value={{ mode, toggleTheme }}>
			<ThemeProvider theme={theme}>
				<CssBaseline />
				<TopBar />
				<Box>
					<Routes>
						<Route path="/" element={<LoginPage />} />
						<Route path="/faculty" element={<Protected allow="faculty"><Faculty /></Protected>} />
						<Route path="/student" element={<Protected allow="student"><Student /></Protected>} />
						<Route path="/student/exam/:examId" element={<Protected allow="student"><StudentDashboard /></Protected>} />
						<Route path="/admin" element={<Protected allow="admin"><Admin /></Protected>} />
						<Route path="/super-admin" element={<Protected allow="super_admin"><SuperAdmin /></Protected>} />
						<Route path="*" element={<Navigate to="/" replace />} />
					</Routes>
				</Box>
			</ThemeProvider>
		</ThemeContext.Provider>
	)
}
