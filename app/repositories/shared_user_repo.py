"""
Shared UserRepository instance that aliases the central registry instance.
This guarantees every route uses the same in-memory store.
"""
from .registry import user_repo as shared_user_repo
