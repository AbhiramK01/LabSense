"""
Custom exceptions for LabSense application.
"""
from typing import Optional, Dict, Any

class LabSenseException(Exception):
    """Base exception for LabSense application."""
    def __init__(self, message: str, error_code: str = None, details: Dict[str, Any] = None):
        self.message = message
        self.error_code = error_code
        self.details = details or {}
        super().__init__(self.message)

class AuthenticationError(LabSenseException):
    """Authentication related errors."""
    def __init__(self, message: str = "Authentication failed", details: Dict[str, Any] = None):
        super().__init__(message, "AUTH_ERROR", details)

class AuthorizationError(LabSenseException):
    """Authorization related errors."""
    def __init__(self, message: str = "Access denied", details: Dict[str, Any] = None):
        super().__init__(message, "AUTHZ_ERROR", details)

class ValidationError(LabSenseException):
    """Data validation errors."""
    def __init__(self, message: str = "Validation failed", field: str = None, details: Dict[str, Any] = None):
        self.field = field
        super().__init__(message, "VALIDATION_ERROR", details)

class ExamError(LabSenseException):
    """Exam related errors."""
    def __init__(self, message: str = "Exam error", exam_id: str = None, details: Dict[str, Any] = None):
        self.exam_id = exam_id
        super().__init__(message, "EXAM_ERROR", details)

class StudentSessionError(LabSenseException):
    """Student session related errors."""
    def __init__(self, message: str = "Session error", session_id: str = None, details: Dict[str, Any] = None):
        self.session_id = session_id
        super().__init__(message, "SESSION_ERROR", details)

class CodeExecutionError(LabSenseException):
    """Code execution related errors."""
    def __init__(self, message: str = "Code execution failed", language: str = None, details: Dict[str, Any] = None):
        self.language = language
        super().__init__(message, "EXECUTION_ERROR", details)

class Judge0Error(LabSenseException):
    """Judge0 service related errors."""
    def __init__(self, message: str = "Judge0 service error", status_code: int = None, details: Dict[str, Any] = None):
        self.status_code = status_code
        super().__init__(message, "JUDGE0_ERROR", details)

class DatabaseError(LabSenseException):
    """Database related errors."""
    def __init__(self, message: str = "Database error", operation: str = None, details: Dict[str, Any] = None):
        self.operation = operation
        super().__init__(message, "DATABASE_ERROR", details)

class ConfigurationError(LabSenseException):
    """Configuration related errors."""
    def __init__(self, message: str = "Configuration error", setting: str = None, details: Dict[str, Any] = None):
        self.setting = setting
        super().__init__(message, "CONFIG_ERROR", details)
