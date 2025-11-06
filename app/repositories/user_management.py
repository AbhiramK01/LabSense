import json
import uuid
from typing import Dict, List, Optional
from ..models.user import User, UserRole
from ..schemas.user_management import UserCreate, UserUpdate, UserResponse, UserListResponse
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class UserManagementRepository:
	def __init__(self):
		self._users: Dict[str, User] = {}
		self._storage_file = "user_management.json"
		self._load_from_storage()

	def _load_from_storage(self):
		"""Load users from JSON file"""
		try:
			with open(self._storage_file, 'r') as f:
				data = json.load(f)
				for user_data in data.get('users', []):
					user = User(
						id=user_data['id'],
						username=user_data['username'],
						email=user_data['email'],
						hashed_password=user_data['hashed_password'],
						role=UserRole(user_data['role'])
					)
					self._users[user.id] = user
		except FileNotFoundError:
			# Create default admin user if no file exists
			self._create_default_admin()
		except Exception as e:
			print(f"Error loading users: {e}")

	def _save_to_storage(self):
		"""Save users to JSON file"""
		try:
			data = {
				'users': [
					{
						'id': user.id,
						'username': user.username,
						'email': user.email,
						'hashed_password': user.hashed_password,
						'role': user.role.value
					}
					for user in self._users.values()
				]
			}
			with open(self._storage_file, 'w') as f:
				json.dump(data, f, indent=2)
		except Exception as e:
			print(f"Error saving users: {e}")

	def _create_default_admin(self):
		"""Create default admin user"""
		admin_id = str(uuid.uuid4())
		admin_password = "admin123"  # Default password
		hashed_password = pwd_context.hash(admin_password)
		
		admin_user = User(
			id=admin_id,
			username="admin",
			email="admin@labsense.com",
			hashed_password=hashed_password,
			role=UserRole.admin
		)
		self._users[admin_id] = admin_user
		self._save_to_storage()
		print("Default admin user created: username=admin, password=admin123")

	def create_user(self, user_data: UserCreate) -> UserResponse:
		"""Create a new user"""
		# Check if username or email already exists
		for user in self._users.values():
			if user.username == user_data.username:
				raise ValueError("Username already exists")
			if user.email == user_data.email:
				raise ValueError("Email already exists")

		user_id = str(uuid.uuid4())
		hashed_password = pwd_context.hash(user_data.password)
		
		user = User(
			id=user_id,
			username=user_data.username,
			email=user_data.email,
			hashed_password=hashed_password,
			role=user_data.role
		)
		
		self._users[user_id] = user
		self._save_to_storage()
		
		return UserResponse(
			id=user.id,
			username=user.username,
			email=user.email,
			role=user.role
		)

	def get_user(self, user_id: str) -> Optional[UserResponse]:
		"""Get user by ID"""
		user = self._users.get(user_id)
		if not user:
			return None
		
		return UserResponse(
			id=user.id,
			username=user.username,
			email=user.email,
			role=user.role
		)

	def get_user_by_username(self, username: str) -> Optional[UserResponse]:
		"""Get user by username"""
		for user in self._users.values():
			if user.username == username:
				return UserResponse(
					id=user.id,
					username=user.username,
					email=user.email,
					role=user.role
				)
		return None

	def get_user_by_email(self, email: str) -> Optional[UserResponse]:
		"""Get user by email"""
		for user in self._users.values():
			if user.email == email:
				return UserResponse(
					id=user.id,
					username=user.username,
					email=user.email,
					role=user.role
				)
		return None

	def list_users(self, role_filter: Optional[UserRole] = None) -> UserListResponse:
		"""List all users with optional role filter"""
		users = list(self._users.values())
		
		if role_filter:
			users = [user for user in users if user.role == role_filter]
		
		user_responses = [
			UserResponse(
				id=user.id,
				username=user.username,
				email=user.email,
				role=user.role
			)
			for user in users
		]
		
		return UserListResponse(users=user_responses, total=len(user_responses))

	def update_user(self, user_id: str, user_data: UserUpdate) -> Optional[UserResponse]:
		"""Update user"""
		user = self._users.get(user_id)
		if not user:
			return None

		# Check for username conflicts
		if user_data.username and user_data.username != user.username:
			for existing_user in self._users.values():
				if existing_user.id != user_id and existing_user.username == user_data.username:
					raise ValueError("Username already exists")

		# Check for email conflicts
		if user_data.email and user_data.email != user.email:
			for existing_user in self._users.values():
				if existing_user.id != user_id and existing_user.email == user_data.email:
					raise ValueError("Email already exists")

		# Update fields
		if user_data.username:
			user.username = user_data.username
		if user_data.email:
			user.email = user_data.email
		if user_data.password:
			user.hashed_password = pwd_context.hash(user_data.password)
		if user_data.role:
			user.role = user_data.role

		self._save_to_storage()
		
		return UserResponse(
			id=user.id,
			username=user.username,
			email=user.email,
			role=user.role
		)

	def delete_user(self, user_id: str) -> bool:
		"""Delete user"""
		if user_id not in self._users:
			return False
		
		# Prevent deleting the last admin
		user = self._users[user_id]
		if user.role == UserRole.admin:
			admin_count = sum(1 for u in self._users.values() if u.role == UserRole.admin)
			if admin_count <= 1:
				raise ValueError("Cannot delete the last admin user")
		
		del self._users[user_id]
		self._save_to_storage()
		return True

	def verify_password(self, user_id: str, password: str) -> bool:
		"""Verify user password"""
		user = self._users.get(user_id)
		if not user:
			return False
		return pwd_context.verify(password, user.hashed_password)
