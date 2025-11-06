"""
Comprehensive error handling for LabSense application.
"""
import logging
from typing import Union
from fastapi import HTTPException, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from pydantic import ValidationError

from .exceptions import (
    LabSenseException, AuthenticationError, AuthorizationError, 
    ValidationError as LabSenseValidationError, ExamError, 
    StudentSessionError, CodeExecutionError, Judge0Error, 
    DatabaseError, ConfigurationError
)

logger = logging.getLogger(__name__)

def create_error_response(
    status_code: int,
    error_code: str,
    message: str,
    details: dict = None
) -> JSONResponse:
    """Create a standardized error response."""
    error_data = {
        "error": {
            "code": error_code,
            "message": message,
            "details": details or {}
        }
    }
    return JSONResponse(
        status_code=status_code,
        content=error_data
    )

async def labsense_exception_handler(request: Request, exc: LabSenseException) -> JSONResponse:
    """Handle custom LabSense exceptions."""
    logger.error(f"LabSense error: {exc.message}", extra={
        "error_code": exc.error_code,
        "details": exc.details,
        "path": request.url.path
    })
    
    # Map error codes to HTTP status codes
    status_code_map = {
        "AUTH_ERROR": status.HTTP_401_UNAUTHORIZED,
        "AUTHZ_ERROR": status.HTTP_403_FORBIDDEN,
        "VALIDATION_ERROR": status.HTTP_400_BAD_REQUEST,
        "EXAM_ERROR": status.HTTP_404_NOT_FOUND,
        "SESSION_ERROR": status.HTTP_400_BAD_REQUEST,
        "EXECUTION_ERROR": status.HTTP_500_INTERNAL_SERVER_ERROR,
        "JUDGE0_ERROR": status.HTTP_503_SERVICE_UNAVAILABLE,
        "DATABASE_ERROR": status.HTTP_500_INTERNAL_SERVER_ERROR,
        "CONFIG_ERROR": status.HTTP_500_INTERNAL_SERVER_ERROR,
    }
    
    status_code = status_code_map.get(exc.error_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    return create_error_response(
        status_code=status_code,
        error_code=exc.error_code,
        message=exc.message,
        details=exc.details
    )

async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    """Handle FastAPI HTTP exceptions."""
    logger.warning(f"HTTP error: {exc.detail}", extra={
        "status_code": exc.status_code,
        "path": request.url.path
    })
    
    return create_error_response(
        status_code=exc.status_code,
        error_code="HTTP_ERROR",
        message=str(exc.detail),
        details={"status_code": exc.status_code}
    )

async def validation_exception_handler(request: Request, exc: Union[RequestValidationError, ValidationError]) -> JSONResponse:
    """Handle Pydantic validation errors."""
    logger.warning(f"Validation error: {exc}", extra={
        "path": request.url.path
    })
    
    if isinstance(exc, RequestValidationError):
        errors = exc.errors()
    else:
        errors = exc.errors()
    
    return create_error_response(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        error_code="VALIDATION_ERROR",
        message="Request validation failed",
        details={"validation_errors": errors}
    )

async def general_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handle unexpected exceptions."""
    logger.error(f"Unexpected error: {str(exc)}", extra={
        "path": request.url.path,
        "exception_type": type(exc).__name__
    }, exc_info=True)
    
    return create_error_response(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        error_code="INTERNAL_ERROR",
        message="An unexpected error occurred",
        details={"exception_type": type(exc).__name__}
    )

def setup_error_handlers(app):
    """Setup all error handlers for the FastAPI app."""
    app.add_exception_handler(LabSenseException, labsense_exception_handler)
    app.add_exception_handler(HTTPException, http_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(ValidationError, validation_exception_handler)
    app.add_exception_handler(Exception, general_exception_handler)
