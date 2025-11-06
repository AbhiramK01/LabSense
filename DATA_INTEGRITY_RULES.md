# Data Integrity Rules and Conflict Prevention

This document outlines the comprehensive data integrity rules implemented in the LabSense multi-tenant system to prevent conflicts and ensure data consistency across colleges.

## 1. User Credentials (Global Uniqueness)

### Rule: **No duplicate login credentials across the entire system**
- **Username**: Must be unique across all colleges
- **Email**: Must be unique across all colleges
- **Implementation**: 
  - `UserRepository.find_by_username_or_email()` checks globally
  - Validation in `user_management.py` create/update endpoints
  - College admin creation/update also validates globally

### Code Locations:
- `app/repositories/users.py` - Global username/email lookup
- `app/api/routes/user_management.py` - User creation/update validation
- `app/api/router.py` - College admin creation/update validation

## 2. Exam IDs (College-Scoped Uniqueness)

### Rule: **Exam IDs must be unique within each college, but can be duplicated across different colleges**
- **Within College**: No two exams can have the same ID
- **Across Colleges**: Different colleges can use the same exam ID
- **Implementation**: 
  - `ExamRepository.create_exam()` checks for conflicts within the same college
  - Falls back to global uniqueness if no college_id is set

### Code Locations:
- `app/repositories/exams.py` - College-scoped exam ID validation

## 3. Student Roll Numbers (College-Scoped Uniqueness)

### Rule: **Roll numbers must be unique within each college, but can be duplicated across different colleges**
- **Within College**: No two students can have the same roll number
- **Across Colleges**: Different colleges can use the same roll numbers
- **Implementation**: 
  - `UserRepository.find_by_roll_number(roll_number, college_id)` checks within college
  - Validation in user creation/update endpoints

### Code Locations:
- `app/repositories/users.py` - College-scoped roll number lookup
- `app/api/routes/user_management.py` - Student creation/update validation

## 4. Department Names and Codes (College-Scoped Uniqueness)

### Rule: **Department names and codes must be unique within each college**
- **Within College**: No two departments can have the same name or code
- **Across Colleges**: Different colleges can use the same department names/codes
- **Implementation**: 
  - `DepartmentManagementRepository.create_department()` checks within college
  - Auto-assigns college_id based on creating admin's college

### Code Locations:
- `app/schemas/department_management.py` - Added college_id field
- `app/repositories/department_management.py` - College-scoped validation
- `app/api/routes/department_management.py` - Auto-assign college_id

## 5. Academic Years (College-Scoped Uniqueness)

### Rule: **Academic years must be unique within each college**
- **Within College**: No two years can have the same value (e.g., "Year 1")
- **Across Colleges**: Different colleges can use the same year values
- **Implementation**: 
  - `DepartmentManagementRepository.create_year()` checks within college
  - Auto-assigns college_id based on creating admin's college

### Code Locations:
- `app/schemas/department_management.py` - Added college_id field
- `app/repositories/department_management.py` - College-scoped validation
- `app/api/routes/department_management.py` - Auto-assign college_id

## 6. Section Names (College-Scoped Uniqueness)

### Rule: **Section names must be unique within each college**
- **Within College**: No two sections can have the same name (e.g., "Section A")
- **Across Colleges**: Different colleges can use the same section names
- **Implementation**: 
  - `DepartmentManagementRepository.create_section()` checks within college
  - Auto-assigns college_id based on creating admin's college

### Code Locations:
- `app/schemas/department_management.py` - Added college_id field
- `app/repositories/department_management.py` - College-scoped validation
- `app/api/routes/department_management.py` - Auto-assign college_id

## 7. Serial Numbers (Exam-Scoped Uniqueness)

### Rule: **Serial numbers must be unique within each exam**
- **Within Exam**: No two students can have the same serial number
- **Across Exams**: Different exams can use the same serial numbers
- **Implementation**: Already correctly implemented in `StudentSessionRepository.set_serial()`

### Code Locations:
- `app/repositories/student_sessions.py` - Exam-scoped serial validation

## 8. College Names and Codes (Global Uniqueness)

### Rule: **College names and codes must be globally unique**
- **Global**: No two colleges can have the same name or code
- **Implementation**: `CollegeRepository.create()` and `update()` methods

### Code Locations:
- `app/repositories/colleges.py` - Global college name/code validation

## 9. Submissions (Natural Scoping)

### Rule: **Submissions are naturally scoped by exam_id**
- **Within Exam**: Multiple submissions per student per question are allowed
- **Implementation**: Already correctly implemented in `SubmissionRepository`

### Code Locations:
- `app/repositories/submissions.py` - Natural exam-based scoping

## 10. Data Cleanup and Cascading Deletion

### Rule: **When a college is deleted, all related data must be cleaned up**
- **Users**: All users belonging to the college are deleted
- **Exams**: All exams belonging to the college are deleted
- **Sessions**: All sessions for deleted exams are deleted
- **Submissions**: All submissions for deleted exams are deleted
- **Departments/Years/Sections**: All department data for the college is deleted

### Implementation:
- `CollegeRepository.delete_college()` performs cascading deletion
- `DepartmentManagementRepository.delete_college_data()` cleans up department data

### Code Locations:
- `app/api/router.py` - College deletion with cascading cleanup
- `app/repositories/department_management.py` - Department data cleanup

## Additional Conflict Prevention Measures

### 1. **Auto-Assignment of College ID**
- All entities (users, departments, years, sections) automatically get assigned the college_id of the creating admin
- Prevents cross-college data leakage

### 2. **Role-Based Access Control**
- Normal admins can only manage data within their own college
- Super admins can manage data across all colleges
- Prevents unauthorized access to other colleges' data

### 3. **Data Isolation**
- All queries are scoped by college_id where applicable
- Prevents data leakage between colleges

### 4. **Validation at Multiple Levels**
- Schema validation (Pydantic)
- Repository-level validation
- API endpoint validation
- Frontend validation

## Testing Recommendations

To ensure these rules work correctly, test the following scenarios:

1. **User Credentials**:
   - Try creating users with duplicate usernames/emails across colleges
   - Verify global uniqueness is enforced

2. **Exam IDs**:
   - Create exams with same ID in different colleges (should succeed)
   - Create exams with same ID in same college (should fail)

3. **Roll Numbers**:
   - Create students with same roll number in different colleges (should succeed)
   - Create students with same roll number in same college (should fail)

4. **Department Data**:
   - Create departments with same name/code in different colleges (should succeed)
   - Create departments with same name/code in same college (should fail)

5. **College Deletion**:
   - Delete a college and verify all related data is cleaned up
   - Verify other colleges' data remains intact

## Summary

The system now enforces comprehensive data integrity rules that:
- ✅ Prevent global conflicts for user credentials
- ✅ Allow college-scoped duplication for exam IDs, roll numbers, and department data
- ✅ Maintain natural scoping for exam-specific data (serial numbers, submissions)
- ✅ Ensure proper data cleanup when colleges are deleted
- ✅ Provide role-based access control to prevent cross-college data access

All rules are implemented at multiple levels (schema, repository, API) to ensure robust data integrity across the multi-tenant system.
