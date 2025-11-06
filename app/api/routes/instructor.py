from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from typing import Optional, List
import csv
import io

from ...models.user import UserRole
from ..deps import require_role
from ...repositories.registry import submission_repo, session_repo

router = APIRouter()


@router.get("/filter-options")
async def get_filter_options(claims = Depends(require_role(UserRole.faculty))):
    """Get available filter options for submissions"""
    try:
        from ...repositories.registry import exam_repo, user_repo, dept_mgmt_repo, session_repo
        from ...repositories.shared_user_repo import shared_user_repo
        
        # Get faculty's college_id
        faculty_user = shared_user_repo.find_by_id(claims.get('sub'))
        college_id = getattr(faculty_user, 'college_id', None) if faculty_user else None
        
        # Get exams owned by this faculty only (implicitly college-scoped)
        exams = exam_repo.list_exams(faculty_user_id=claims.get('sub'))
        
        # Simple exam options (no demographic info needed - reports use submission snapshots)
        exam_options = [{"id": exam.exam_id, "name": f"{exam.exam_id} - {exam.subject_name}"} for exam in exams]
        
        # Get departments (college-scoped)
        departments = dept_mgmt_repo.get_departments(college_id)
        dept_options = [{"id": dept.id, "name": dept.name} for dept in departments]
        
        # Get sections (college-scoped)
        sections = dept_mgmt_repo.get_sections(college_id)
        section_options = [{"id": section.id, "name": section.name} for section in sections]
        
        # Get years (college-scoped)
        years = dept_mgmt_repo.get_years(college_id)
        year_options = [{"id": year.id, "name": str(year.year)} for year in years]
        
        # Get students (from sessions to get only those who have submitted)
        student_options = []
        seen_students = set()
        
        for (user_id, exam_id), session in session_repo._sessions.items():
            if user_id not in seen_students:
                user = user_repo.find_by_id(user_id)
                if user and user.role.value == 'student':
                    student_options.append({
                        "id": user.id,
                        "name": f"{user.username} ({user.roll_number or 'No roll number'})"
                    })
                    seen_students.add(user_id)
        
        # Get question IDs from sessions
        question_options = []
        seen_questions = set()
        
        for (user_id, exam_id), session in session_repo._sessions.items():
            session_submissions = getattr(session, 'submissions', [])
            for sub in session_submissions:
                question_id = sub.get('question_id')
                if question_id and question_id not in seen_questions:
                    question_options.append({"id": question_id, "name": question_id})
                    seen_questions.add(question_id)
        
        return {
            "exams": exam_options,
            "departments": dept_options,
            "sections": section_options,
            "years": year_options,
            "students": student_options,
            "questions": question_options
        }
        
    except Exception as e:
        print(f"Error getting filter options: {e}")
        import traceback
        traceback.print_exc()
        return {
            "exams": [],
            "departments": [],
            "sections": [],
            "years": [],
            "students": [],
            "questions": []
        }


@router.get("/students")
async def get_all_students(claims = Depends(require_role(UserRole.faculty))):
    """Get all students in the faculty's college"""
    try:
        from ...repositories.shared_user_repo import shared_user_repo
        from ...repositories.registry import dept_mgmt_repo
        
        # Get faculty's college_id
        faculty_user = shared_user_repo.find_by_id(claims.get('sub'))
        college_id = getattr(faculty_user, 'college_id', None) if faculty_user else None
        
        print(f"[GET /students] Faculty user: {faculty_user.username if faculty_user else 'None'}")
        print(f"[GET /students] Faculty college_id: {college_id}")
        
        if not college_id:
            print("[GET /students] No college_id found for faculty, returning empty list")
            return {"students": []}
        
        # Get all users and filter for students in this college
        all_users = shared_user_repo.list_all()
        print(f"[GET /students] Total users in system: {len(all_users)}")
        
        students = []
        student_count = 0
        
        for user in all_users:
            if user.role.value == 'student':
                student_count += 1
                user_college_id = getattr(user, 'college_id', None)
            
            if (user.role.value == 'student' and 
                getattr(user, 'college_id', None) == college_id):
                
                # Get department, year, section names
                dept_name = 'N/A'
                section_name = 'N/A'
                year_value = 'N/A'
                
                if hasattr(user, 'department_id') and user.department_id:
                    dept = dept_mgmt_repo.get_department_by_id(user.department_id)
                    dept_name = dept.name if dept else user.department_id
                
                if hasattr(user, 'section_id') and user.section_id:
                    section = dept_mgmt_repo.get_section_by_id(user.section_id)
                    section_name = section.name if section else user.section_id
                
                if hasattr(user, 'year'):
                    year_value = str(user.year)
                
                students.append({
                    "id": user.id,
                    "name": user.username,
                    "roll_number": getattr(user, 'roll_number', 'N/A'),
                    "department_id": getattr(user, 'department_id', None),
                    "department_name": dept_name,
                    "section_id": getattr(user, 'section_id', None),
                    "section_name": section_name,
                    "year": year_value
                })
        
        print(f"[GET /students] Total students in system: {student_count}")
        print(f"[GET /students] Students in faculty's college: {len(students)}")
        
        return {"students": sorted(students, key=lambda x: x['roll_number'])}
        
    except Exception as e:
        print(f"Error getting students: {e}")
        import traceback
        traceback.print_exc()
        return {"students": []}


def _calculate_metrics_from_results(detailed_results, public_case_results):
    """Calculate correctness, logic similarity, and effort from detailed results"""
    if not detailed_results:
        return 0, 0, 0
    
    # Calculate correctness based on passed test cases
    total_tests = len(detailed_results)
    passed_tests = sum(1 for result in detailed_results if result.get('passed', False))
    correctness = (passed_tests / total_tests * 100) if total_tests > 0 else 0
    
    # Calculate logic similarity (simplified - based on test case performance)
    # This is a basic implementation - you might want to enhance this
    logic_similarity = correctness  # For now, use correctness as proxy
    
    # Calculate effort (simplified - based on execution time and attempts)
    # This is a basic implementation - you might want to enhance this
    avg_execution_time = sum(result.get('execution_time', 0) for result in detailed_results) / total_tests if total_tests > 0 else 0
    effort = min(100, avg_execution_time * 10)  # Simple effort calculation
    
    return round(correctness, 2), round(logic_similarity, 2), round(effort, 2)


@router.get("/submissions")
async def list_submissions(
    _claims = Depends(require_role(UserRole.faculty)),
    exam_id: Optional[str] = Query(None),
    student_id: Optional[str] = Query(None),
    question_id: Optional[str] = Query(None),
    department_id: Optional[str] = Query(None),
    year: Optional[int] = Query(None),
    section_id: Optional[str] = Query(None),
    roll_number: Optional[str] = Query(None)
):
    """Get detailed submissions for faculty with all submission data including code and test results"""
    try:
        # Handle Query objects - if they're Query objects, set to None
        if hasattr(exam_id, 'alias'):
            exam_id = None
        if hasattr(student_id, 'alias'):
            student_id = None
        if hasattr(question_id, 'alias'):
            question_id = None
        if hasattr(department_id, 'alias'):
            department_id = None
        if hasattr(year, 'alias'):
            year = None
        if hasattr(section_id, 'alias'):
            section_id = None
        if hasattr(roll_number, 'alias'):
            roll_number = None
            
        # Faculty- and college-scoping: restrict to exams owned by this faculty
        faculty_user_id = _claims.get('sub')
        from ...repositories.registry import exam_repo, shared_user_repo
        allowed_exams = set(e.exam_id for e in exam_repo.list_exams(faculty_user_id=faculty_user_id))
        
        # Get faculty's college_id for additional isolation
        faculty_user = shared_user_repo.find_by_id(faculty_user_id)
        faculty_college_id = getattr(faculty_user, 'college_id', None) if faculty_user else None
        
        # If a specific exam_id was requested but is not owned by this faculty, return empty
        if exam_id is not None and exam_id not in allowed_exams:
            return []

        # First try to get submissions from submission repo
        basic_submissions = submission_repo.list(exam_id=exam_id, student_id=student_id, question_id=question_id)
        # Enforce faculty ownership and college isolation when no explicit exam_id filter provided
        if exam_id is None and basic_submissions:
            filtered_subs = []
            for s in basic_submissions:
                if getattr(s, 'exam_id', None) not in allowed_exams:
                    continue
                # Additional college check: ensure student belongs to same college as faculty
                if faculty_college_id:
                    student_user = shared_user_repo.find_by_id(s.student_id)
                    student_college_id = getattr(student_user, 'college_id', None) if student_user else None
                    if student_college_id != faculty_college_id:
                        continue
                filtered_subs.append(s)
            basic_submissions = filtered_subs
        
        # If no submissions found in submission repo, check session repo
        if not basic_submissions:
            print(f"No submissions in submission repo, checking session repo...")
            detailed_submissions = []
            seen_submissions = set()  # Track seen submissions to avoid duplicates
            
            # Get all sessions
            for (user_id, session_exam_id), session in session_repo._sessions.items():
                # Enforce faculty exam ownership when exam_id not specified
                if exam_id is None and str(session_exam_id) not in allowed_exams:
                    continue
                # Apply filters (convert to string for comparison)
                if exam_id and str(session_exam_id) != str(exam_id):
                    continue
                if student_id and user_id != student_id:
                    continue
                
                # College isolation: Only include sessions from students in the same college as faculty
                if faculty_college_id:
                    student_user = shared_user_repo.find_by_id(user_id)
                    student_college_id = getattr(student_user, 'college_id', None) if student_user else None
                    if student_college_id != faculty_college_id:
                        continue  # Skip students from different colleges
                
                # Get submissions from this session
                session_submissions = getattr(session, 'submissions', [])
                
                # Process each submission (don't check versioned_submissions to avoid duplicates)
                for i, session_sub in enumerate(session_submissions):
                    # Apply question filter
                    if question_id and session_sub.get('question_id') != question_id:
                        continue
                    
                    # Create unique key for deduplication
                    sub_key = f"{user_id}_{session_exam_id}_{session_sub.get('question_id', 'unknown')}_{session_sub.get('submitted_at', '')}_{session_sub.get('score', 0)}"
                    
                    if sub_key in seen_submissions:
                        print(f"Skipping duplicate submission: {sub_key}")
                        continue
                    
                    seen_submissions.add(sub_key)
                    
                    # Calculate metrics from detailed results
                    detailed_results = session_sub.get('detailed_results', [])
                    public_case_results = session_sub.get('public_case_results', [])
                    correctness, logic_similarity, effort = _calculate_metrics_from_results(detailed_results, public_case_results)
                    
                    # Normalize timestamp fields
                    submitted_at = session_sub.get('submitted_at')
                    # If numeric epoch seconds provided under another key, normalize
                    if isinstance(submitted_at, (int, float)):
                        from datetime import datetime, timezone
                        submitted_at_iso = datetime.fromtimestamp(submitted_at, tz=timezone.utc).isoformat()
                    else:
                        submitted_at_iso = submitted_at or ''

                    # Enrich with exam name (if available)
                    exam_name = None
                    try:
                        from ...repositories.registry import exam_repo
                        exam = exam_repo.get_exam(str(session_exam_id))
                        if exam:
                            exam_name = getattr(exam, 'subject_name', None) or f"Exam {session_exam_id}"
                        else:
                            exam_name = f"Exam {session_exam_id}"
                    except Exception as e:
                        print(f"⚠️ Failed to get exam name for {session_exam_id}: {e}")
                        exam_name = f"Exam {session_exam_id}"

                    # Convert session submission to detailed format
                    detailed_sub = {
                        'id': f"{user_id}_{session_exam_id}_{session_sub.get('question_id', 'unknown')}_{i}",
                        'student_id': user_id,
                        'student_name': '',  # Will be populated below
                        'exam_id': session_exam_id,
                        'exam_name': exam_name,
                        'question_id': session_sub.get('question_id', ''),
                        'language': 'python',  # Default language
                        'score': session_sub.get('score', 0),
                        'feedback': session_sub.get('feedback', ''),
                        'correctness': correctness,
                        'logic_similarity': logic_similarity,
                        'effort': effort,
                        'submitted_at': submitted_at_iso,
                        # keep legacy numeric timestamp if present for frontend fallback
                        'timestamp': session_sub.get('timestamp', None),
                        # expose serial/system number if session provides one
                        'serial_number': getattr(session, 'serial_number', None),
                        'code': session_sub.get('code', ''),
                        'detailed_results': detailed_results,
                        'public_case_results': public_case_results,
                        'is_final': session_sub.get('is_final', False),
                        'is_best': session_sub.get('is_best', False)
                    }
                    
                    # Ensure snapshot fields exist: if missing on submission, fall back to session-level snapshots
                    try:
                        for key in ['department_id_snapshot','department_name_snapshot','section_id_snapshot','section_name_snapshot','year_snapshot']:
                            if key not in detailed_sub or detailed_sub.get(key) in (None, ''):
                                val = getattr(session, key, None)
                                if val is not None:
                                    detailed_sub[key] = val
                    except Exception:
                        pass

                    detailed_submissions.append(detailed_sub)
            
            # Get student names and details for all submissions
            from ...repositories.registry import shared_user_repo, dept_mgmt_repo
            filtered_submissions = []
            
            for sub in detailed_submissions:
                # Enforce faculty ownership once again for safety
                if sub.get('exam_id') not in allowed_exams:
                    continue
                
                # Recalculate passed field based on score (50% threshold)
                if 'score' in sub and sub['score'] is not None:
                    sub['passed'] = sub['score'] >= 50.0
                
                # Use shared_user_repo (same as used elsewhere in this file)
                user = shared_user_repo.find_by_id(sub['student_id'])
                if user:
                    sub['student_name'] = user.username or f"Student_{sub['student_id'][:8]}"
                    sub['student_email'] = getattr(user, 'email', '') or ''
                    # Prefer stored snapshots for historical accuracy
                    if 'department_id_snapshot' in sub and sub['department_id_snapshot'] is not None:
                        sub['department_id'] = sub['department_id_snapshot']
                    else:
                        sub['department_id'] = getattr(user, 'department_id', None)
                    if 'year_snapshot' in sub and sub['year_snapshot'] is not None:
                        sub['year'] = sub['year_snapshot']
                    else:
                        sub['year'] = getattr(user, 'year', None)
                    if 'section_id_snapshot' in sub and sub['section_id_snapshot'] is not None:
                        sub['section_id'] = sub['section_id_snapshot']
                    else:
                        sub['section_id'] = getattr(user, 'section_id', None)
                    sub['roll_number'] = getattr(user, 'roll_number', None) or sub.get('roll_number_snapshot')
                    # Also populate roll_number_snapshot if missing
                    if 'roll_number_snapshot' not in sub or not sub.get('roll_number_snapshot'):
                        sub['roll_number_snapshot'] = sub['roll_number']
                    
                    # Get department and section names
                    if sub.get('department_name_snapshot'):
                        sub['department_name'] = sub['department_name_snapshot']
                    else:
                        dept_id_eff = sub.get('department_id')
                        if dept_id_eff:
                            dept = dept_mgmt_repo.get_department(dept_id_eff)
                            sub['department_name'] = dept.name if dept else dept_id_eff
                        else:
                            sub['department_name'] = 'Not specified'
                    
                    if sub.get('section_name_snapshot'):
                        sub['section_name'] = sub['section_name_snapshot']
                    else:
                        sec_id_eff = sub.get('section_id')
                        if sec_id_eff:
                            section = dept_mgmt_repo.get_section(sec_id_eff)
                            sub['section_name'] = section.name if section else sec_id_eff
                        else:
                            sub['section_name'] = 'Not specified'
                else:
                    sub['student_name'] = f"Student_{sub['student_id'][:8]}"
                    sub['student_email'] = ''
                    sub['department_id'] = None
                    sub['year'] = None
                    sub['section_id'] = None
                    sub['roll_number'] = sub.get('roll_number_snapshot')  # Use snapshot if available
                    if 'roll_number_snapshot' not in sub or not sub.get('roll_number_snapshot'):
                        sub['roll_number_snapshot'] = None
                    sub['department_name'] = 'Not specified'
                    sub['section_name'] = 'Not specified'
                
                # Apply additional filters
                # Prefer snapshot values when present and also set displayed fields to effective values
                snapshot_dept = sub.get('department_id_snapshot')
                snapshot_year = sub.get('year_snapshot')
                snapshot_section = sub.get('section_id_snapshot')
                effective_department = snapshot_dept if snapshot_dept is not None else sub['department_id']
                effective_year = snapshot_year if snapshot_year is not None else sub['year']
                effective_section = snapshot_section if snapshot_section is not None else sub['section_id']

                # Force displayed values to effective (snapshot-preferred) ones
                sub['department_id'] = effective_department
                sub['year'] = effective_year
                sub['section_id'] = effective_section

                if department_id and effective_department != department_id:
                    continue
                if year and effective_year != year:
                    continue
                if section_id and effective_section != section_id:
                    continue
                if roll_number and sub['roll_number'] != roll_number:
                    continue
                
                filtered_submissions.append(sub)
            
            print(f"Found {len(filtered_submissions)} filtered submissions from session repo")
            return filtered_submissions
        
        # If we have basic submissions, enrich them with session data
        detailed_submissions = []
        
        for submission in basic_submissions:
            # Calculate metrics from detailed results if available
            detailed_results = getattr(submission, 'detailed_results', [])
            public_case_results = getattr(submission, 'public_case_results', [])
            correctness, logic_similarity, effort = _calculate_metrics_from_results(detailed_results, public_case_results)
            
            # Enrich with exam name
            exam_name = None
            try:
                from ...repositories.registry import exam_repo
                if submission.exam_id:
                    exam = exam_repo.get_exam(str(submission.exam_id))
                    if exam:
                        exam_name = getattr(exam, 'subject_name', None) or f"Exam {submission.exam_id}"
                    else:
                        exam_name = f"Exam {submission.exam_id}"
            except Exception as e:
                print(f"⚠️ Failed to get exam name for {submission.exam_id}: {e}")
                exam_name = f"Exam {submission.exam_id}" if submission.exam_id else "Unknown Exam"
            
            # Start with basic submission data
            detailed_sub = {
                'id': submission.id,
                'student_id': submission.student_id,
                'exam_id': submission.exam_id,
                'exam_name': exam_name,
                'question_id': submission.question_id,
                'language': submission.language,
                'score': submission.score,
                'passed': submission.score >= 50.0 if submission.score is not None else False,
                'feedback': submission.feedback,
                'correctness': correctness,
                'logic_similarity': logic_similarity,
                'effort': effort,
                'timestamp': submission.timestamp,
                # Initialize detailed fields
                'code': getattr(submission, 'code', ''),
                'detailed_results': detailed_results,
                'public_case_results': public_case_results,
                'is_final': getattr(submission, 'is_final', False),
                'is_best': getattr(submission, 'is_best', False),
                'serial_number': None,  # Will be populated from session if available
                'roll_number': None  # Will be populated from user if available
            }
            
            # Try to get detailed data from session repository
            if submission.exam_id and submission.student_id:
                try:
                    # Get session for this student and exam
                    session_key = (submission.student_id, submission.exam_id)
                    session = session_repo._sessions.get(session_key)
                    
                    if session and hasattr(session, 'submissions'):
                        # Find matching submission in session data
                        session_submissions = session.submissions
                        
                        # Also check versioned submissions
                        if hasattr(session, 'versioned_submissions'):
                            for version_subs in session.versioned_submissions.values():
                                session_submissions.extend(version_subs)
                        
                        # Find the submission that matches this one (by timestamp and score)
                        matching_session_sub = None
                        for session_sub in session_submissions:
                            if (session_sub.get('question_id') == submission.question_id and 
                                abs(session_sub.get('score', 0) - submission.score) < 0.1):
                                matching_session_sub = session_sub
                                break
                        
                        if matching_session_sub:
                            # Enrich with detailed data
                            detailed_sub.update({
                                'code': matching_session_sub.get('code', ''),
                                'detailed_results': matching_session_sub.get('detailed_results', []),
                                'public_case_results': matching_session_sub.get('public_case_results', []),
                                'is_final': matching_session_sub.get('is_final', False),
                                'is_best': matching_session_sub.get('is_best', False)
                            })
                            # Get serial number from session
                            if hasattr(session, 'serial_number') and session.serial_number is not None:
                                detailed_sub['serial_number'] = session.serial_number
                            
                except Exception as e:
                    print(f"Warning: Could not get detailed data for submission {submission.id}: {e}")
                    # Continue with basic data
            
            # Carry forward snapshot information if available in session
            try:
                session = session_repo._sessions.get((submission.student_id, submission.exam_id))
                if session and hasattr(session, 'submissions'):
                    for s in session.submissions:
                        if s.get('question_id') == submission.question_id:
                            for key in ['department_id_snapshot','department_name_snapshot','section_id_snapshot','section_name_snapshot','year_snapshot']:
                                if key in s:
                                    detailed_sub[key] = s[key]
                            break
            except Exception:
                pass

            # Enrich with user info and resolve effective org fields (snapshot preferred)
            try:
                from ...repositories.registry import shared_user_repo, dept_mgmt_repo
                user = shared_user_repo.find_by_id(submission.student_id)
                eff_dept = detailed_sub.get('department_id_snapshot')
                eff_year = detailed_sub.get('year_snapshot')
                eff_sec = detailed_sub.get('section_id_snapshot')
                if user:
                    if eff_dept is None:
                        eff_dept = getattr(user, 'department_id', None)
                    if eff_year is None:
                        eff_year = getattr(user, 'year', None)
                    if eff_sec is None:
                        eff_sec = getattr(user, 'section_id', None)
                    detailed_sub['student_name'] = user.username or f"Student_{submission.student_id[:8]}"
                    detailed_sub['student_email'] = getattr(user, 'email', '') or ''
                    detailed_sub['roll_number'] = getattr(user, 'roll_number', None) or detailed_sub.get('roll_number_snapshot')
                    # Also populate roll_number_snapshot if missing
                    if 'roll_number_snapshot' not in detailed_sub or not detailed_sub.get('roll_number_snapshot'):
                        detailed_sub['roll_number_snapshot'] = detailed_sub['roll_number']
                else:
                    # User not found - provide fallback values
                    detailed_sub['student_name'] = f"Student_{submission.student_id[:8]}"
                    detailed_sub['student_email'] = ''
                    detailed_sub['roll_number'] = detailed_sub.get('roll_number_snapshot')
                    if 'roll_number_snapshot' not in detailed_sub or not detailed_sub.get('roll_number_snapshot'):
                        detailed_sub['roll_number_snapshot'] = None
                # Set ids/values used by frontend filters/columns
                detailed_sub['department_id'] = eff_dept
                detailed_sub['year'] = eff_year
                detailed_sub['section_id'] = eff_sec
                # Resolve display names, preferring snapshot names
                if detailed_sub.get('department_name_snapshot') is not None:
                    detailed_sub['department_name'] = detailed_sub['department_name_snapshot']
                else:
                    if eff_dept:
                        d = dept_mgmt_repo.get_department(eff_dept)
                        detailed_sub['department_name'] = d.name if d else eff_dept
                    else:
                        detailed_sub['department_name'] = 'Not specified'
                if detailed_sub.get('section_name_snapshot') is not None:
                    detailed_sub['section_name'] = detailed_sub['section_name_snapshot']
                else:
                    if eff_sec:
                        s = dept_mgmt_repo.get_section(eff_sec)
                        detailed_sub['section_name'] = s.name if s else eff_sec
                    else:
                        detailed_sub['section_name'] = 'Not specified'
            except Exception:
                pass

            detailed_submissions.append(detailed_sub)
        
        return detailed_submissions
        
    except Exception as e:
        print(f"Error getting detailed submissions: {e}")
        import traceback
        traceback.print_exc()
        # Fallback to basic submissions
        items = submission_repo.list(exam_id=exam_id, student_id=student_id, question_id=question_id)
        return submission_repo.to_dicts(items)


@router.get("/submissions/csv")
async def export_csv(
    _claims = Depends(require_role(UserRole.faculty)),
    exam_id: Optional[str] = Query(None),
    student_id: Optional[str] = Query(None),
    question_id: Optional[str] = Query(None)
):
    items = submission_repo.list(exam_id=exam_id, student_id=student_id, question_id=question_id)
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header
    writer.writerow(['ID', 'Student ID', 'Exam ID', 'Question ID', 'Language', 'Score', 'Correctness', 'Logic Similarity', 'Effort', 'Timestamp'])
    
    # Data
    for item in items:
        writer.writerow([
            item.id,
            item.student_id,
            item.exam_id or '',
            item.question_id or '',
            item.language,
            item.score,
            item.correctness,
            item.logic_similarity,
            item.effort,
            item.timestamp
        ])
    
    output.seek(0)
    
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode('utf-8')),
        media_type='text/csv',
        headers={'Content-Disposition': 'attachment; filename=submissions.csv'}
    )
