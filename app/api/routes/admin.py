from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any
import json
import os
from pathlib import Path

from ...models.user import UserRole
from ..deps import require_role
from ...repositories.shared_user_repo import shared_user_repo
from ...repositories.registry import exam_repo, submission_repo, session_repo, user_repo, dept_mgmt_repo

router = APIRouter()

@router.post("/clear-data")
async def clear_all_data(claims = Depends(require_role([UserRole.admin, UserRole.super_admin]))):
    """Clear all system data for the admin's college (or all data if super admin)"""
    try:
        from ...repositories.registry import college_repo
        
        # Get the admin's college_id
        admin_user = shared_user_repo.find_by_id(claims.get('sub'))
        admin_college_id = getattr(admin_user, 'college_id', None) if admin_user else None
        is_super_admin = claims.get('role') == UserRole.super_admin
        
        print(f"🧹 Clear data request from {'super admin' if is_super_admin else 'college admin'} (college_id: {admin_college_id})")
        
        if is_super_admin:
            # Super admin clears ALL data except super admin users
            print("🗑️ Super admin clearing ALL college data")
            
            # Clear all colleges
            college_repo._colleges.clear()
            college_repo._save_to_storage()
            
            # Clear all users except super admins
            super_admin_users = {}
            for user_id, user in shared_user_repo._users_by_id.items():
                if user.role == UserRole.super_admin:
                    super_admin_users[user_id] = user
            
            shared_user_repo._users_by_username.clear()
            shared_user_repo._users_by_email.clear()
            shared_user_repo._users_by_id.clear()
            shared_user_repo._users_by_roll_number.clear()
            
            # Restore only super admin users
            for user in super_admin_users.values():
                shared_user_repo._index_user(user)
            
            shared_user_repo._save_to_storage()
            
            # Clear all other data
            exam_repo._exams.clear()
            exam_repo._exam_faculty.clear()
            exam_repo._save_to_storage()
            
            submission_repo._items.clear()
            submission_repo._save_to_storage()
            
            session_repo._sessions.clear()
            session_repo._exam_runtime.clear()
            session_repo._save_to_storage()
            session_repo._save_exam_runtime_data()
            
            dept_mgmt_repo._departments.clear()
            dept_mgmt_repo._sections.clear()
            dept_mgmt_repo._years.clear()
            dept_mgmt_repo._save_to_storage()
            
            return {
                "message": "All college data cleared successfully",
                "details": "All colleges, users (except super admins), exams, submissions, sessions, departments, sections, and years have been removed.",
                "cleared_files": ["colleges.json", "users.json", "exams.json", "submissions.json", "sessions.json", "departments.json", "sections.json", "years.json"],
                "preserved_admin_users": len(super_admin_users)
            }
        
        else:
            # College admin clears only their college's data
            if not admin_college_id:
                raise HTTPException(status_code=400, detail="Admin user has no college assigned")
            
            print(f"🏫 College admin clearing data for college: {admin_college_id}")
            
            # Clear users from this college (except the admin doing the clearing)
            users_to_remove = []
            for user_id, user in shared_user_repo._users_by_id.items():
                if user.college_id == admin_college_id and user.id != admin_user.id:
                    users_to_remove.append(user_id)
            
            for user_id in users_to_remove:
                user = shared_user_repo._users_by_id[user_id]
                # Remove from all indexes
                if user.username.lower() in shared_user_repo._users_by_username:
                    del shared_user_repo._users_by_username[user.username.lower()]
                if user.email.lower() in shared_user_repo._users_by_email:
                    del shared_user_repo._users_by_email[user.email.lower()]
                if user.roll_number and user.roll_number.lower() in shared_user_repo._users_by_roll_number:
                    del shared_user_repo._users_by_roll_number[user.roll_number.lower()]
                del shared_user_repo._users_by_id[user_id]
            
            shared_user_repo._save_to_storage()
            
            # Clear exams from this college
            exams_to_remove = []
            for exam_id, exam in exam_repo._exams.items():
                if getattr(exam, 'college_id', None) == admin_college_id:
                    exams_to_remove.append(exam_id)
            
            for exam_id in exams_to_remove:
                if exam_id in exam_repo._exams:
                    del exam_repo._exams[exam_id]
                if exam_id in exam_repo._exam_faculty:
                    del exam_repo._exam_faculty[exam_id]
            
            exam_repo._save_to_storage()
            
            # Clear submissions for exams from this college
            submissions_to_remove = []
            for submission in submission_repo._items.values():
                # Check if the exam belongs to this college
                exam = exam_repo._exams.get(submission.exam_id)
                if exam and getattr(exam, 'college_id', None) == admin_college_id:
                    submissions_to_remove.append(submission.id)
            
            for submission_id in submissions_to_remove:
                if submission_id in submission_repo._items:
                    del submission_repo._items[submission_id]
            
            submission_repo._save_to_storage()
            
            # Clear sessions for exams from this college
            sessions_to_remove = []
            for (user_id, exam_id), session in session_repo._sessions.items():
                exam = exam_repo._exams.get(exam_id)
                if exam and getattr(exam, 'college_id', None) == admin_college_id:
                    sessions_to_remove.append((user_id, exam_id))
            
            for session_key in sessions_to_remove:
                if session_key in session_repo._sessions:
                    del session_repo._sessions[session_key]
            
            session_repo._save_to_storage()
            
            # Clear departments, sections, years from this college
            depts_to_remove = []
            for dept_id, dept in dept_mgmt_repo._departments.items():
                if dept.get('college_id') == admin_college_id:
                    depts_to_remove.append(dept_id)
            
            for dept_id in depts_to_remove:
                del dept_mgmt_repo._departments[dept_id]
            
            sections_to_remove = []
            for section_id, section in dept_mgmt_repo._sections.items():
                if section.get('college_id') == admin_college_id:
                    sections_to_remove.append(section_id)
            
            for section_id in sections_to_remove:
                del dept_mgmt_repo._sections[section_id]
            
            years_to_remove = []
            for year_id, year in dept_mgmt_repo._years.items():
                if year.get('college_id') == admin_college_id:
                    years_to_remove.append(year_id)
            
            for year_id in years_to_remove:
                del dept_mgmt_repo._years[year_id]
            
            dept_mgmt_repo._save_to_storage()
            
            return {
                "message": f"College data cleared successfully",
                "details": f"All users (except admin), exams, submissions, sessions, departments, sections, and years for college {admin_college_id} have been removed.",
                "cleared_files": ["users.json", "exams.json", "submissions.json", "sessions.json", "departments.json", "sections.json", "years.json"],
                "preserved_admin_users": 1,
                "cleared_users": len(users_to_remove),
                "cleared_exams": len(exams_to_remove),
                "cleared_submissions": len(submissions_to_remove),
                "cleared_sessions": len(sessions_to_remove),
                "cleared_departments": len(depts_to_remove),
                "cleared_sections": len(sections_to_remove),
                "cleared_years": len(years_to_remove)
            }
        
    except Exception as e:
        print(f"Error clearing data: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to clear data: {str(e)}")