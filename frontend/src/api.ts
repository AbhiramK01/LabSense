export type UserRole = 'faculty' | 'student' | 'admin' | 'super_admin'

export interface TokenResponse {
	access_token: string
	token_type: string
	role: UserRole
}

const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'http://127.0.0.1:8000'

async function parseOrThrow(res: Response) {
	let text: string | undefined
	try { text = await res.text() } catch {}
	try { 
		const parsed = text ? JSON.parse(text) : {}
		console.log('API Error Response:', { status: res.status, statusText: res.statusText, body: parsed })
		return parsed
	} catch {
		throw new Error(`${res.status} ${res.statusText}`)
	}
}

export async function login(username_or_email: string, password: string): Promise<TokenResponse> {
	try {
		const res = await fetch(`${API_BASE}/auth/login`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ username_or_email, password })
		})
		if (!res.ok) {
			const body = await parseOrThrow(res)
			// Handle custom error format from backend
			if (body?.error?.message) {
				throw new Error(body.error.message)
			}
			throw new Error(body?.detail || 'Login failed')
		}
		return res.json()
	} catch (e: any) {
		// Don't wrap API errors with "Could not reach API" message
		if (e.message && !e.message.includes('Could not reach API')) {
			throw e
		}
		// Only wrap network/connection errors
		throw new Error(`Could not reach API at ${API_BASE}: ${e?.message || e}`)
	}
}

export async function whoami(token: string) {
	const res = await fetch(`${API_BASE}/auth/whoami`, {
		headers: { Authorization: `Bearer ${token}` }
	})
	if (!res.ok) {
		const errorData = await parseOrThrow(res)
		if (errorData?.error?.message) {
			throw new Error(errorData.error.message)
		}
		throw new Error('Unauthorized')
	}
	return res.json()
}

// Exams
export interface TestCase { input: string; expected_output: string; is_public: boolean }
export interface Question { question_id: string; text: string; ideal_solution: string; test_cases: TestCase[] }
export interface ExamCreate { 
	exam_id: string; 
	start_code: string; 
	subject_name: string; 
	language: 'python'|'javascript'|'java'|'c'|'cpp'|'go'; 
	duration_minutes: number; 
	num_questions: number; 
	questions_per_student: number; 
	questions: Question[]; 
	is_live?: boolean; 
	layout_data?: any; 
	question_assignments?: any;
	allowed_departments?: string[];
	allowed_years?: number[];
	allowed_sections?: string[];
}

export async function createExam(token: string, payload: ExamCreate) {
	const res = await fetch(`${API_BASE}/exams/`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
		body: JSON.stringify(payload)
	})
	if (!res.ok) {
		const errorData = await parseOrThrow(res)
		if (errorData?.error?.message) {
			throw new Error(errorData.error.message)
		}
		throw new Error(errorData?.detail || 'Create exam failed')
	}
	return res.json()
}

export async function listExams(token: string) {
	const res = await fetch(`${API_BASE}/exams/`, { headers: { Authorization: `Bearer ${token}` } })
	if (!res.ok) {
		const errorData = await parseOrThrow(res)
		if (errorData?.error?.message) {
			throw new Error(errorData.error.message)
		}
		throw new Error('List exams failed')
	}
	return res.json()
}

export async function getFullExamDetails(token: string, examId: string) {
	const res = await fetch(`${API_BASE}/exams/${examId}`, { headers: { Authorization: `Bearer ${token}` } })
	if (!res.ok) {
		const errorData = await parseOrThrow(res)
		if (errorData?.error?.message) {
			throw new Error(errorData.error.message)
		}
		throw new Error('Failed to fetch exam details')
	}
	return res.json()
}

export async function getActiveSessions(token: string, examId: string) {
	const res = await fetch(`${API_BASE}/exams/${examId}/active-sessions`, { headers: { Authorization: `Bearer ${token}` } })
	if (!res.ok) {
		const errorData = await parseOrThrow(res)
		if (errorData?.error?.message) {
			throw new Error(errorData.error.message)
		}
		throw new Error('Failed to fetch active sessions')
	}
	return res.json()
}

// Exam history functions removed - exam modification feature removed

// Exam modification functions removed - use duplicate exam feature instead

export async function duplicateExam(token: string, examId: string, newExamName?: string) {
	const res = await fetch(`${API_BASE}/exams/duplicate/${examId}`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
		body: JSON.stringify({ new_exam_name: newExamName })
	})
	if (!res.ok) {
		const errorData = await parseOrThrow(res)
		if (errorData?.error?.message) {
			throw new Error(errorData.error.message)
		}
		throw new Error('Failed to duplicate exam')
	}
	return res.json()
}

export async function listResults(token: string) {
	const res = await fetch(`${API_BASE}/exams/results`, { headers: { Authorization: `Bearer ${token}` } })
	if (!res.ok) {
		const errorData = await parseOrThrow(res)
		if (errorData?.error?.message) {
			throw new Error(errorData.error.message)
		}
		throw new Error('List results failed')
	}
	return res.json()
}

export async function deleteStudentAttempt(token: string, examId: string, studentId: string): Promise<{ message: string; deleted_submissions: number; session_deleted: boolean }> {
    const res = await fetch(`${API_BASE}/exams/${examId}/students/${studentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
    })
    if (!res.ok) {
        const errorData = await parseOrThrow(res)
        if (errorData?.error?.message) {
            throw new Error(errorData.error.message)
        }
        throw new Error(errorData?.detail || 'Failed to clear student attempt')
    }
    return res.json()
}

// Student
export async function getQuestionDetails(token: string, examId: string, questionId: string) {
	const res = await fetch(`${API_BASE}/student/question/${examId}/${questionId}`, { headers: { Authorization: `Bearer ${token}` } })
	if (!res.ok) {
		const errorData = await parseOrThrow(res)
		if (errorData?.error?.message) {
			throw new Error(errorData.error.message)
		}
		throw new Error('Fetch question failed')
	}
	return res.json()
}

// AI Evaluation
export async function evaluateCode(token: string, payload: any) {
	const res = await fetch(`${API_BASE}/evaluate/`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
		body: JSON.stringify(payload)
	})
	if (!res.ok) {
		const errorData = await parseOrThrow(res)
		if (errorData?.error?.message) {
			throw new Error(errorData.error.message)
		}
		throw new Error('Evaluation failed')
	}
	return res.json()
}

// Instructor Dashboard
export async function getFilterOptions(token: string) {
	const res = await fetch(`${API_BASE}/instructor/filter-options`, {
		headers: { Authorization: `Bearer ${token}` }
	})
	if (!res.ok) {
		const errorData = await parseOrThrow(res)
		if (errorData?.error?.message) {
			throw new Error(errorData.error.message)
		}
		throw new Error('Failed to fetch filter options')
	}
	return res.json()
}

export async function getAllStudents(token: string) {
	const res = await fetch(`${API_BASE}/instructor/students`, {
		headers: { Authorization: `Bearer ${token}` }
	})
	if (!res.ok) {
		const errorData = await parseOrThrow(res)
		if (errorData?.error?.message) {
			throw new Error(errorData.error.message)
		}
		throw new Error('Failed to fetch students')
	}
	return res.json()
}

export async function getSubmissions(token: string, examId?: string, studentId?: string, questionId?: string, departmentId?: string, year?: number, sectionId?: string, rollNumber?: string) {
	const params = new URLSearchParams()
	if (examId) params.append('exam_id', examId)
	if (studentId) params.append('student_id', studentId)
	if (questionId) params.append('question_id', questionId)
	if (departmentId) params.append('department_id', departmentId)
	if (year) params.append('year', year.toString())
	if (sectionId) params.append('section_id', sectionId)
	if (rollNumber) params.append('roll_number', rollNumber)
	
    const res = await fetch(`${API_BASE}/instructor/submissions?${params}`, {
		headers: { Authorization: `Bearer ${token}` }
	})
	if (!res.ok) {
		const errorData = await parseOrThrow(res)
		if (errorData?.error?.message) {
			throw new Error(errorData.error.message)
		}
		throw new Error('Failed to fetch submissions')
	}
    const json = await res.json()
    // Normalize to { submissions: [...] } for both array and object responses
    if (Array.isArray(json)) {
        return { submissions: json }
    }
    return { submissions: json?.submissions ?? [] }
}

// Super Admin College Management APIs
export interface College {
    id: string;
    name: string;
    address?: string;
    code?: string;
    logo_url?: string;
}

export async function listColleges(token: string): Promise<{ colleges: College[] }> {
	const res = await fetch(`${API_BASE}/colleges`, {
		headers: { Authorization: `Bearer ${token}` }
	});
	if (!res.ok) {
		const errorData = await parseOrThrow(res);
		throw new Error(errorData?.detail || 'Failed to list colleges');
	}
	return res.json();
}

export interface CreateCollegePayload {
    name: string;
    address: string;
    code: string;
    logo_url?: string;
    admin_username: string;
    admin_email: string;
    admin_password: string;
}

export async function createCollege(token: string, payload: CreateCollegePayload): Promise<{ id: string; name: string }> {
    const res = await fetch(`${API_BASE}/colleges`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
    });
	if (!res.ok) {
		const errorData = await parseOrThrow(res);
		
		// Try different possible error message locations
		const errorMessage = errorData?.detail || errorData?.message || errorData?.error?.message || 'Failed to create college';
		throw new Error(errorMessage);
	}
	return res.json();
}

export interface UpdateCollegePayload { 
    name?: string; 
    address?: string; 
    code?: string; 
    logo_url?: string;
    admin_username?: string;
    admin_email?: string;
    admin_password?: string;
}

export interface CollegeAdmin {
    id: string;
    username: string;
    email: string;
    role: string;
}

export async function getCollegeAdmin(token: string, collegeId: string): Promise<CollegeAdmin> {
    const res = await fetch(`${API_BASE}/colleges/${collegeId}/admin`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) {
        const errorData = await parseOrThrow(res);
        throw new Error(errorData?.detail || 'Failed to get college admin');
    }
    return res.json();
}

export async function updateCollege(token: string, collegeId: string, payload: UpdateCollegePayload): Promise<College> {
    const res = await fetch(`${API_BASE}/colleges/${collegeId}`, {
        method: 'PUT',
        headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
    });
	if (!res.ok) {
		const errorData = await parseOrThrow(res);
		
		// Try different possible error message locations
		const errorMessage = errorData?.detail || errorData?.message || errorData?.error?.message || 'Failed to update college';
		throw new Error(errorMessage);
	}
	return res.json();
}

export async function deleteCollege(token: string, collegeId: string): Promise<{ message: string }> {
	const res = await fetch(`${API_BASE}/colleges/${collegeId}`, {
		method: 'DELETE',
		headers: { Authorization: `Bearer ${token}` }
	});
	if (!res.ok) {
		const errorData = await parseOrThrow(res);
		throw new Error(errorData?.detail || 'Failed to delete college');
	}
	return res.json();
}

export async function assignAdminToCollege(token: string, collegeId: string, userId: string): Promise<{ message: string }> {
	const res = await fetch(`${API_BASE}/colleges/${collegeId}/assign-admin`, {
		method: 'POST',
		headers: { 
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}` 
		},
		body: JSON.stringify({ user_id: userId })
	});
	if (!res.ok) {
		const errorData = await parseOrThrow(res);
		throw new Error(errorData?.detail || 'Failed to assign admin');
	}
	return res.json();
}

export async function downloadCSV(token: string, examId?: string, studentId?: string, questionId?: string) {
	const params = new URLSearchParams()
	if (examId) params.append('exam_id', examId)
	if (studentId) params.append('student_id', studentId)
	if (questionId) params.append('question_id', questionId)
	
	const res = await fetch(`${API_BASE}/instructor/submissions/csv?${params}`, {
		headers: { Authorization: `Bearer ${token}` }
	})
	if (!res.ok) {
		const errorData = await parseOrThrow(res)
		if (errorData?.error?.message) {
			throw new Error(errorData.error.message)
		}
		throw new Error('Failed to download CSV')
	}
	return res.blob()
}

// Exam Control
export async function toggleExamStatus(token: string, examId: string) {
	const res = await fetch(`${API_BASE}/exams/toggle/${examId}`, {
		method: 'POST',
		headers: { Authorization: `Bearer ${token}` }
	})
	if (!res.ok) {
		const errorData = await parseOrThrow(res)
		if (errorData?.error?.message) {
			throw new Error(errorData.error.message)
		}
		throw new Error('Failed to toggle exam status')
	}
	return res.json()
}

export async function calculateQuestionAssignment(token: string, examId: string, questionsPerStudent: number) {
    const res = await fetch(`${API_BASE}/exams/question-assignment/${examId}?questions_per_student=${questionsPerStudent}`, {
        headers: { Authorization: `Bearer ${token}` }
    })
    if (!res.ok) {
        const errorData = await parseOrThrow(res)
        if (errorData?.error?.message) {
            throw new Error(errorData.error.message)
        }
        throw new Error('Failed to calculate question assignment')
    }
    return res.json()
}

export async function deleteExam(token: string, examId: string) {
    const res = await fetch(`${API_BASE}/exams/${examId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
    })
    if (!res.ok) {
        const errorData = await parseOrThrow(res)
        if (errorData?.error?.message) {
            throw new Error(errorData.error.message)
        }
        throw new Error('Failed to delete exam')
    }
    return res.json()
}

// Admin User Management APIs
export interface UserCreate {
	username: string
	email: string
	password: string
	role: UserRole
	college_id?: string
	department_id?: string
	year?: number
	section_id?: string
	roll_number?: string
}

export interface UserUpdate {
	username?: string
	email?: string
	password?: string
	role?: UserRole
	college_id?: string
	department_id?: string
	year?: number
	section_id?: string
	roll_number?: string
}

export interface UserResponse {
	id: string
	username: string
	email: string
	role: UserRole
	college_id?: string
	department_id?: string
	year?: number
	section_id?: string
	roll_number?: string
}

export interface UserListResponse {
	users: UserResponse[]
	total: number
}

export async function createUser(token: string, userData: UserCreate): Promise<UserResponse> {
	const res = await fetch(`${API_BASE}/admin/users`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
		body: JSON.stringify(userData)
	})
	if (!res.ok) {
		const errorData = await parseOrThrow(res)
		
		// Handle validation errors with detailed messages
		if (errorData?.error?.details?.validation_errors) {
			const validationErrors = errorData.error.details.validation_errors
			const errorMessages = validationErrors.map((err: any) => {
				// Convert field names to user-friendly format
				const fieldName = err.loc[err.loc.length - 1] // Get the last part (field name)
				const friendlyName = fieldName === 'username' ? 'Username' :
									fieldName === 'email' ? 'Email' :
									fieldName === 'password' ? 'Password' :
									fieldName === 'role' ? 'Role' : fieldName
				return `${friendlyName}: ${err.msg}`
			}).join('\n')
			throw new Error(errorMessages)
		}
		
		if (errorData?.error?.message) {
			throw new Error(errorData.error.message)
		}
		throw new Error('Failed to create user')
	}
	return res.json()
}

export async function listUsers(token: string, role?: UserRole): Promise<UserListResponse> {
	const params = new URLSearchParams()
	if (role) params.append('role', role)
	
	const res = await fetch(`${API_BASE}/admin/users?${params}`, {
		headers: { Authorization: `Bearer ${token}` }
	})
	if (!res.ok) {
		const errorData = await parseOrThrow(res)
		if (errorData?.error?.message) {
			throw new Error(errorData.error.message)
		}
		throw new Error('Failed to list users')
	}
	return res.json()
}

export async function getUser(token: string, userId: string): Promise<UserResponse> {
	const res = await fetch(`${API_BASE}/admin/users/${userId}`, {
		headers: { Authorization: `Bearer ${token}` }
	})
	if (!res.ok) {
		const errorData = await parseOrThrow(res)
		if (errorData?.error?.message) {
			throw new Error(errorData.error.message)
		}
		throw new Error('Failed to get user')
	}
	return res.json()
}

export async function updateUser(token: string, userId: string, userData: UserUpdate): Promise<UserResponse> {
	const res = await fetch(`${API_BASE}/admin/users/${userId}`, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
		body: JSON.stringify(userData)
	})
	if (!res.ok) {
		const errorData = await parseOrThrow(res)
		if (errorData?.error?.message) {
			throw new Error(errorData.error.message)
		}
		throw new Error('Failed to update user')
	}
	return res.json()
}

export async function deleteUser(token: string, userId: string): Promise<void> {
	const res = await fetch(`${API_BASE}/admin/users/${userId}`, {
		method: 'DELETE',
		headers: { Authorization: `Bearer ${token}` }
	})
	if (!res.ok) {
		const errorData = await parseOrThrow(res)
		if (errorData?.error?.message) {
			throw new Error(errorData.error.message)
		}
		throw new Error('Failed to delete user')
	}
}

// Department Management API
export interface Department {
	id: string
	name: string
	code: string
	created_at: string
}

export interface Year {
	id: string
	year: number
	created_at: string
}

export interface Section {
	id: string
	name: string
	created_at: string
}

export interface DepartmentCreate {
	name: string
	code: string
}

export interface YearCreate {
	year: number
}

export interface SectionCreate {
	name: string
}

// Department Management Functions
export async function getDepartments(): Promise<Department[]> {
	const token = localStorage.getItem('token')
	const res = await fetch(`${API_BASE}/admin/departments`, {
		headers: { 'Authorization': `Bearer ${token}` }
	})
	if (!res.ok) throw new Error('Failed to fetch departments')
	const data = await res.json()
	return data.departments
}

export async function createDepartment(department: DepartmentCreate): Promise<Department> {
	const token = localStorage.getItem('token')
	const res = await fetch(`${API_BASE}/admin/departments`, {
		method: 'POST',
		headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
		body: JSON.stringify(department)
	})
	if (!res.ok) {
		const errorData = await parseOrThrow(res)
		throw new Error(errorData.detail || 'Failed to create department')
	}
	return res.json()
}

export async function deleteDepartment(id: string): Promise<void> {
	const token = localStorage.getItem('token')
	const res = await fetch(`${API_BASE}/admin/departments/${id}`, {
		method: 'DELETE',
		headers: { 'Authorization': `Bearer ${token}` }
	})
	if (!res.ok) throw new Error('Failed to delete department')
}

export async function updateDepartment(id: string, department: DepartmentCreate): Promise<Department> {
    const token = localStorage.getItem('token')
    const res = await fetch(`${API_BASE}/admin/departments/${id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(department)
    })
    if (!res.ok) {
        const errorData = await parseOrThrow(res)
        throw new Error(errorData.detail || 'Failed to update department')
    }
    return res.json()
}

export async function getYears(): Promise<Year[]> {
	const token = localStorage.getItem('token')
	const res = await fetch(`${API_BASE}/admin/years`, {
		headers: { 'Authorization': `Bearer ${token}` }
	})
	if (!res.ok) throw new Error('Failed to fetch years')
	const data = await res.json()
	return data.years
}

export async function createYear(year: YearCreate): Promise<Year> {
	const token = localStorage.getItem('token')
	const res = await fetch(`${API_BASE}/admin/years`, {
		method: 'POST',
		headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
		body: JSON.stringify(year)
	})
	if (!res.ok) {
		const errorData = await parseOrThrow(res)
		throw new Error(errorData.detail || 'Failed to create year')
	}
	return res.json()
}

export async function deleteYear(id: string): Promise<void> {
	const token = localStorage.getItem('token')
	const res = await fetch(`${API_BASE}/admin/years/${id}`, {
		method: 'DELETE',
		headers: { 'Authorization': `Bearer ${token}` }
	})
	if (!res.ok) throw new Error('Failed to delete year')
}

export async function updateYear(id: string, year: YearCreate): Promise<Year> {
    const token = localStorage.getItem('token')
    const res = await fetch(`${API_BASE}/admin/years/${id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(year)
    })
    if (!res.ok) {
        const errorData = await parseOrThrow(res)
        throw new Error(errorData.detail || 'Failed to update year')
    }
    return res.json()
}

export async function getSections(): Promise<Section[]> {
	const token = localStorage.getItem('token')
	const res = await fetch(`${API_BASE}/admin/sections`, {
		headers: { 'Authorization': `Bearer ${token}` }
	})
	if (!res.ok) throw new Error('Failed to fetch sections')
	const data = await res.json()
	return data.sections
}

export async function createSection(section: SectionCreate): Promise<Section> {
	const token = localStorage.getItem('token')
	const res = await fetch(`${API_BASE}/admin/sections`, {
		method: 'POST',
		headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
		body: JSON.stringify(section)
	})
	if (!res.ok) {
		const errorData = await parseOrThrow(res)
		throw new Error(errorData.detail || 'Failed to create section')
	}
	return res.json()
}

export async function deleteSection(id: string): Promise<void> {
	const token = localStorage.getItem('token')
	const res = await fetch(`${API_BASE}/admin/sections/${id}`, {
		method: 'DELETE',
		headers: { 'Authorization': `Bearer ${token}` }
	})
	if (!res.ok) throw new Error('Failed to delete section')
}

export async function updateSection(id: string, section: SectionCreate): Promise<Section> {
    const token = localStorage.getItem('token')
    const res = await fetch(`${API_BASE}/admin/sections/${id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(section)
    })
    if (!res.ok) {
        const errorData = await parseOrThrow(res)
        throw new Error(errorData.detail || 'Failed to update section')
    }
    return res.json()
}

// Public endpoints for faculty
export async function getPublicDepartments(): Promise<Department[]> {
	const token = localStorage.getItem('token')
	const res = await fetch(`${API_BASE}/admin/public/departments`, {
		headers: { 'Authorization': `Bearer ${token}` }
	})
	if (!res.ok) throw new Error('Failed to fetch departments')
	return res.json()
}

export async function getPublicYears(): Promise<Year[]> {
	const token = localStorage.getItem('token')
	const res = await fetch(`${API_BASE}/admin/public/years`, {
		headers: { 'Authorization': `Bearer ${token}` }
	})
	if (!res.ok) throw new Error('Failed to fetch years')
	return res.json()
}

export async function getPublicSections(): Promise<Section[]> {
	const token = localStorage.getItem('token')
	const res = await fetch(`${API_BASE}/admin/public/sections`, {
		headers: { 'Authorization': `Bearer ${token}` }
	})
	if (!res.ok) throw new Error('Failed to fetch sections')
	return res.json()
}

// Enhanced Student API
export interface StudentExamInfo {
	exam_id: string
	subject_name: string
	original_subject_name?: string
	exam_version?: number
	language: string
	duration_minutes: number
	joined_at?: number
	serial_number?: number
	finished?: boolean
	num_questions?: number
	questions_per_student?: number
}

export interface StudentExamHistory {
	available_exams: StudentExamInfo[]
	in_progress_exams: StudentExamInfo[]
	completed_exams: StudentExamInfo[]
}

export async function getAvailableExams(): Promise<StudentExamInfo[]> {
	const token = localStorage.getItem('token')
	const res = await fetch(`${API_BASE}/student/available-exams`, {
		headers: { 'Authorization': `Bearer ${token}` }
	})
	if (!res.ok) {
		const errorData = await parseOrThrow(res)
		throw new Error(errorData.detail || 'Failed to fetch available exams')
	}
	return res.json()
}

export async function getStudentExamHistory(): Promise<StudentExamHistory> {
	const token = localStorage.getItem('token')
	const res = await fetch(`${API_BASE}/student/exam-history`, {
		headers: { 'Authorization': `Bearer ${token}` }
	})
	if (!res.ok) {
		const errorData = await parseOrThrow(res)
		throw new Error(errorData.detail || 'Failed to fetch exam history')
	}
	return res.json()
}

// Student exam joining
export interface StudentJoinRequest {
	exam_id: string
	start_code: string
}

export async function joinExam(request: StudentJoinRequest): Promise<any> {
	const token = localStorage.getItem('token')
	const res = await fetch(`${API_BASE}/student/join`, {
		method: 'POST',
		headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
		body: JSON.stringify(request)
	})
	if (!res.ok) {
		const errorData = await parseOrThrow(res)
		throw new Error(errorData.detail || 'Failed to join exam')
	}
	return res.json()
}

// Student exam interface functions
export interface QuestionDetails {
	question_id: string
	text: string
	ideal_solution: string
	public_test_cases: PublicTestCase[]
}

export interface PublicTestCase {
	input: string
	expected_output: string
}

export interface SubmissionRequest {
	question_id: string
	code: string
}

export interface SubmissionResult {
	score: number
	correctness: number
	logic_similarity: number
	effort: number
	feedback: string
	test_results?: Array<{
		passed: boolean
		expected_output: string
		actual_output: string
	}>
}

export async function getQuestion(examId: string, questionId: string): Promise<QuestionDetails> {
	const token = localStorage.getItem('token')
	const res = await fetch(`${API_BASE}/student/question/${examId}/${questionId}`, {
		headers: { 'Authorization': `Bearer ${token}` }
	})
	if (!res.ok) {
		const errorData = await parseOrThrow(res)
		throw new Error(errorData.detail || 'Failed to get question')
	}
	return res.json()
}

export async function submitCode(examId: string, questionId: string, code: string): Promise<SubmissionResult> {
	const token = localStorage.getItem('token')
	const res = await fetch(`${API_BASE}/student/submit/${examId}`, {
		method: 'POST',
		headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
		body: JSON.stringify({ question_id: questionId, code })
	})
	if (!res.ok) {
		const errorData = await parseOrThrow(res)
		throw new Error(errorData.detail || 'Failed to submit code')
	}
	return res.json()
}

export async function finish(examId: string): Promise<any> {
	const token = localStorage.getItem('token')
	const res = await fetch(`${API_BASE}/student/finish/${examId}`, {
		method: 'POST',
		headers: { 'Authorization': `Bearer ${token}` }
	})
	if (!res.ok) {
		const errorData = await parseOrThrow(res)
		throw new Error(errorData.detail || 'Failed to finish exam')
	}
	return res.json()
}

// Auto-save and timer functions
export async function autoSaveCode(token: string, examId: string, code: string, questionId?: string) {
    const res = await fetch(`${API_BASE}/student/auto-save/${examId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ code, question_id: questionId })
    })
	if (!res.ok) {
		const errorData = await parseOrThrow(res)
		throw new Error(errorData.detail || 'Failed to auto-save code')
	}
	return res.json()
}

export async function getExamTimer(token: string, examId: string) {
	const res = await fetch(`${API_BASE}/student/timer/${examId}`, {
		headers: { Authorization: `Bearer ${token}` }
	})
	if (!res.ok) {
		const errorData = await parseOrThrow(res)
		throw new Error(errorData.detail || 'Failed to get exam timer')
	}
	return res.json()
}

export async function getSavedCode(token: string, examId: string) {
	const res = await fetch(`${API_BASE}/student/code/${examId}`, {
		headers: { Authorization: `Bearer ${token}` }
	})
	if (!res.ok) {
		const errorData = await parseOrThrow(res)
		throw new Error(errorData.detail || 'Failed to get saved code')
	}
	return res.json()
}

export async function getSessionData(token: string, examId: string) {
	const res = await fetch(`${API_BASE}/student/session/${examId}`, {
		headers: { Authorization: `Bearer ${token}` }
	})
	if (!res.ok) {
		const errorData = await parseOrThrow(res)
		throw new Error(errorData.detail || 'Failed to get session data')
	}
	return res.json()
}

export async function getMySubmissions(token: string, examId: string, version?: number) {
	const url = version !== undefined 
		? `${API_BASE}/student/submissions/${examId}?version=${version}`
		: `${API_BASE}/student/submissions/${examId}`;
	
	console.log(`🔍 API: Calling ${url} with version ${version}`);
	
	const res = await fetch(url, {
		headers: { Authorization: `Bearer ${token}` }
	})
	if (!res.ok) {
		const errorData = await parseOrThrow(res)
		throw new Error(errorData.detail || 'Failed to get submissions')
	}
	return res.json()
}

// Admin System Management
export async function clearAllData(token: string) {
	const res = await fetch(`${API_BASE}/admin/clear-data`, {
		method: 'POST',
		headers: { Authorization: `Bearer ${token}` }
	})
	if (!res.ok) {
		const errorData = await parseOrThrow(res)
		throw new Error(errorData.detail || 'Failed to clear data')
	}
	return res.json()
}
