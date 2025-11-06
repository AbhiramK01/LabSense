import json
import os
from typing import Dict, Any
from pathlib import Path

class PersistentStorage:
    def __init__(self, data_dir: str = "data"):
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(exist_ok=True)
        
    def save_data(self, filename: str, data: Dict[str, Any]) -> None:
        """Save data to JSON file"""
        filepath = self.data_dir / f"{filename}.json"
        with open(filepath, 'w') as f:
            json.dump(data, f, indent=2, default=str)
    
    def load_data(self, filename: str) -> Dict[str, Any]:
        """Load data from JSON file"""
        filepath = self.data_dir / f"{filename}.json"
        if not filepath.exists():
            return {}
        try:
            with open(filepath, 'r') as f:
                return json.load(f)
        except (json.JSONDecodeError, FileNotFoundError):
            return {}
    
    def save_exams(self, exams: Dict[str, Any]) -> None:
        """Save exams data"""
        self.save_data("exams", exams)
    
    def load_exams(self) -> Dict[str, Any]:
        """Load exams data"""
        return self.load_data("exams")
    
    def save_submissions(self, submissions: Dict[str, Any]) -> None:
        """Save submissions data"""
        self.save_data("submissions", submissions)
    
    def load_submissions(self) -> Dict[str, Any]:
        """Load submissions data"""
        return self.load_data("submissions")
    
    def save_users(self, users: Dict[str, Any]) -> None:
        """Save users data"""
        self.save_data("users", users)
    
    def load_users(self) -> Dict[str, Any]:
        """Load users data"""
        return self.load_data("users")
    
    def save_exam_faculty(self, faculty_mapping: Dict[str, str]) -> None:
        """Save exam-faculty mapping"""
        self.save_data("exam_faculty", faculty_mapping)
    
    def load_exam_faculty(self) -> Dict[str, str]:
        """Load exam-faculty mapping"""
        return self.load_data("exam_faculty")
    
    def save_sessions(self, sessions: Dict[str, Any]) -> None:
        """Save student sessions data"""
        self.save_data("sessions", sessions)
    
    def load_sessions(self) -> Dict[str, Any]:
        """Load student sessions data"""
        return self.load_data("sessions")

    # Colleges storage
    def save_colleges(self, colleges: Dict[str, Any]) -> None:
        self.save_data("colleges", colleges)

    def load_colleges(self) -> Dict[str, Any]:
        return self.load_data("colleges")
