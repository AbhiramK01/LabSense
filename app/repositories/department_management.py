from typing import Dict, List, Optional
from datetime import datetime
import uuid

from ..schemas.department_management import DepartmentCreate, YearCreate, SectionCreate, DepartmentResponse, YearResponse, SectionResponse
from ..storage.persistent import PersistentStorage


class DepartmentManagementRepository:
    """Repository for managing departments, years, and sections"""
    
    def __init__(self):
        self._departments: Dict[str, dict] = {}
        self._years: Dict[str, dict] = {}
        self._sections: Dict[str, dict] = {}
        self.storage = PersistentStorage()
        self._load_from_storage()
    
    def _load_from_storage(self):
        """Load data from persistent storage"""
        try:
            # Load departments
            dept_data = self.storage.load_data('departments')
            for dept_id, dept in dept_data.items():
                self._departments[dept_id] = dept
            
            # Load years
            year_data = self.storage.load_data('years')
            for year_id, year in year_data.items():
                self._years[year_id] = year
            
            # Load sections
            section_data = self.storage.load_data('sections')
            for section_id, section in section_data.items():
                self._sections[section_id] = section
                
        except Exception as e:
            print(f"Error loading department management data: {e}")
            # Initialize with default data
            self._seed_default_data()
    
    def _save_to_storage(self):
        """Save data to persistent storage"""
        try:
            self.storage.save_data('departments', self._departments)
            self.storage.save_data('years', self._years)
            self.storage.save_data('sections', self._sections)
        except Exception as e:
            print(f"Error saving department management data: {e}")
    
    def _seed_default_data(self):
        """Seed with default data if none exists"""
        if not self._departments:
            # Add some default departments
            default_departments = [
                {"name": "Computer Science", "code": "CS"},
                {"name": "Information Technology", "code": "IT"},
                {"name": "Electronics and Communication", "code": "EC"},
                {"name": "Mechanical Engineering", "code": "ME"},
                {"name": "Civil Engineering", "code": "CE"}
            ]
            
            for dept in default_departments:
                dept_id = str(uuid.uuid4())
                self._departments[dept_id] = {
                    "id": dept_id,
                    "name": dept["name"],
                    "code": dept["code"],
                    "created_at": datetime.now().isoformat()
                }
        
        if not self._years:
            # Add years 1-4
            for year in range(1, 5):
                year_id = str(uuid.uuid4())
                self._years[year_id] = {
                    "id": year_id,
                    "year": year,
                    "created_at": datetime.now().isoformat()
                }
        
        if not self._sections:
            # Add sections A, B, C
            for section in ["A", "B", "C"]:
                section_id = str(uuid.uuid4())
                self._sections[section_id] = {
                    "id": section_id,
                    "name": section,
                    "created_at": datetime.now().isoformat()
                }
        
        self._save_to_storage()
    
    # Department management
    def create_department(self, department: DepartmentCreate) -> str:
        """Create a new department"""
        # Check if department with same name or code already exists in the same college
        college_id = getattr(department, 'college_id', None)
        for dept in self._departments.values():
            existing_college_id = dept.get('college_id')
            if dept["name"].lower() == department.name.lower() and existing_college_id == college_id:
                raise ValueError(f'Department name "{department.name}" already exists in this college. Please choose a different name.')
            if dept["code"].upper() == department.code.upper() and existing_college_id == college_id:
                raise ValueError(f'Department code "{department.code}" already exists in this college. Please choose a different code.')
        
        dept_id = str(uuid.uuid4())
        self._departments[dept_id] = {
            "id": dept_id,
            "name": department.name,
            "code": department.code,
            "college_id": college_id,
            "created_at": datetime.now().isoformat()
        }
        self._save_to_storage()
        return dept_id
    
    def get_departments(self, college_id: Optional[str] = None) -> List[DepartmentResponse]:
        """Get all departments, optionally filtered by college"""
        if college_id:
            return [
                DepartmentResponse(**dept) for dept in self._departments.values()
                if dept.get('college_id') == college_id
            ]
        return [
            DepartmentResponse(**dept) for dept in self._departments.values()
        ]
    
    def get_department(self, dept_id: str) -> Optional[DepartmentResponse]:
        """Get department by ID"""
        dept = self._departments.get(dept_id)
        return DepartmentResponse(**dept) if dept else None
    
    def get_department_by_id(self, dept_id: str) -> Optional[DepartmentResponse]:
        """Alias for get_department"""
        return self.get_department(dept_id)
    
    def delete_department(self, dept_id: str) -> bool:
        """Delete department by ID"""
        if dept_id in self._departments:
            del self._departments[dept_id]
            self._save_to_storage()
            return True
        return False
    
    def update_department(self, dept_id: str, *, name: Optional[str] = None, code: Optional[str] = None) -> bool:
        """Update department name/code with college-scoped uniqueness"""
        if dept_id not in self._departments:
            return False
        dept = self._departments[dept_id]
        college_id = dept.get('college_id')
        # Uniqueness within same college
        if name is not None:
            lname = name.strip().lower()
            for other_id, other in self._departments.items():
                if other_id != dept_id and other.get('college_id') == college_id and other.get('name', '').strip().lower() == lname:
                    raise ValueError(f'Department name "{name}" already exists in this college. Please choose a different name.')
        if code is not None:
            lcode = code.strip().upper()
            for other_id, other in self._departments.items():
                if other_id != dept_id and other.get('college_id') == college_id and (other.get('code', '').strip().upper() == lcode):
                    raise ValueError(f'Department code "{code}" already exists in this college. Please choose a different code.')
        if name is not None:
            dept['name'] = name.strip()
        if code is not None:
            dept['code'] = code.strip()
        self._save_to_storage()
        return True
    
    # Year management
    def create_year(self, year: YearCreate) -> str:
        """Create a new academic year"""
        # Check if year already exists in the same college
        college_id = getattr(year, 'college_id', None)
        for existing_year in self._years.values():
            existing_college_id = existing_year.get('college_id')
            if existing_year["year"] == year.year and existing_college_id == college_id:
                raise ValueError(f'Academic year "{year.year}" already exists in this college. Please choose a different year.')
        
        year_id = str(uuid.uuid4())
        self._years[year_id] = {
            "id": year_id,
            "year": year.year,
            "college_id": college_id,
            "created_at": datetime.now().isoformat()
        }
        self._save_to_storage()
        return year_id
    
    def get_years(self, college_id: Optional[str] = None) -> List[YearResponse]:
        """Get all academic years, optionally filtered by college"""
        if college_id:
            return [
                YearResponse(**year) for year in self._years.values()
                if year.get('college_id') == college_id
            ]
        return [
            YearResponse(**year) for year in self._years.values()
        ]
    
    def get_year(self, year_id: str) -> Optional[YearResponse]:
        """Get year by ID"""
        year = self._years.get(year_id)
        return YearResponse(**year) if year else None
    
    def delete_year(self, year_id: str) -> bool:
        """Delete year by ID"""
        if year_id in self._years:
            del self._years[year_id]
            self._save_to_storage()
            return True
        return False
    
    def update_year(self, year_id: str, *, year: Optional[int] = None) -> bool:
        """Update academic year with college-scoped uniqueness"""
        if year_id not in self._years:
            return False
        yr = self._years[year_id]
        college_id = yr.get('college_id')
        old_year_value = yr.get('year')
        if year is not None:
            for other_id, other in self._years.items():
                if other_id != year_id and other.get('college_id') == college_id and other.get('year') == year:
                    raise ValueError(f'Academic year "{year}" already exists in this college. Please choose a different year.')
            yr['year'] = year
        self._save_to_storage()
        # Propagate year change to existing students who store numeric year values
        try:
            if year is not None and old_year_value is not None and old_year_value != year:
                from .registry import user_repo
                # Update users within the same college that reference the old numeric year
                for user in list(user_repo._users_by_id.values()):
                    if getattr(user, 'college_id', None) == college_id and getattr(user, 'year', None) == old_year_value:
                        user.year = year
                user_repo._save_to_storage()
        except Exception as _:
            # Non-fatal: if user update fails, we still updated the year entity
            pass
        return True
    
    # Section management
    def create_section(self, section: SectionCreate) -> str:
        """Create a new section"""
        # Check if section with same name already exists in the same college
        college_id = getattr(section, 'college_id', None)
        for existing_section in self._sections.values():
            existing_college_id = existing_section.get('college_id')
            if existing_section["name"].upper() == section.name.upper() and existing_college_id == college_id:
                raise ValueError(f'Section name "{section.name}" already exists in this college. Please choose a different name.')
        
        section_id = str(uuid.uuid4())
        self._sections[section_id] = {
            "id": section_id,
            "name": section.name,
            "college_id": college_id,
            "created_at": datetime.now().isoformat()
        }
        self._save_to_storage()
        return section_id
    
    def get_sections(self, college_id: Optional[str] = None) -> List[SectionResponse]:
        """Get all sections, optionally filtered by college"""
        if college_id:
            return [
                SectionResponse(**section) for section in self._sections.values()
                if section.get('college_id') == college_id
            ]
        return [
            SectionResponse(**section) for section in self._sections.values()
        ]
    
    def get_section(self, section_id: str) -> Optional[SectionResponse]:
        """Get section by ID"""
        section = self._sections.get(section_id)
        return SectionResponse(**section) if section else None
    
    def get_section_by_id(self, section_id: str) -> Optional[SectionResponse]:
        """Alias for get_section"""
        return self.get_section(section_id)
    
    def delete_section(self, section_id: str) -> bool:
        """Delete section by ID"""
        if section_id in self._sections:
            del self._sections[section_id]
            self._save_to_storage()
            return True
        return False
    
    def update_section(self, section_id: str, *, name: Optional[str] = None) -> bool:
        """Update section name with college-scoped uniqueness"""
        if section_id not in self._sections:
            return False
        section = self._sections[section_id]
        college_id = section.get('college_id')
        if name is not None:
            uname = name.strip().upper()
            for other_id, other in self._sections.items():
                if other_id != section_id and other.get('college_id') == college_id and (other.get('name', '').strip().upper() == uname):
                    raise ValueError(f'Section name "{name}" already exists in this college. Please choose a different name.')
            section['name'] = name.strip()
        self._save_to_storage()
        return True
    
    def delete_college_data(self, college_id: str) -> None:
        """Delete all departments, years, and sections for a college"""
        # Delete departments
        depts_to_delete = [dept_id for dept_id, dept in self._departments.items() if dept.get('college_id') == college_id]
        for dept_id in depts_to_delete:
            del self._departments[dept_id]
        
        # Delete years
        years_to_delete = [year_id for year_id, year in self._years.items() if year.get('college_id') == college_id]
        for year_id in years_to_delete:
            del self._years[year_id]
        
        # Delete sections
        sections_to_delete = [section_id for section_id, section in self._sections.items() if section.get('college_id') == college_id]
        for section_id in sections_to_delete:
            del self._sections[section_id]
        
        self._save_to_storage()
