from typing import Dict, Optional
from uuid import uuid4

from ..core.security import hash_password
from ..models.user import User, UserRole
from ..storage.persistent import PersistentStorage


class UserRepository:
	def __init__(self) -> None:
		self._users_by_username: Dict[str, User] = {}
		self._users_by_email: Dict[str, User] = {}
		self._users_by_id: Dict[str, User] = {}
		self._users_by_roll_number: Dict[str, User] = {}
		self.storage = PersistentStorage()
		self._load_from_storage()
		if not self._users_by_username:  # Only seed if no users exist
			self._seed_demo_users()

	def _load_from_storage(self) -> None:
		"""Load users from persistent storage"""
		data = self.storage.load_users()
		for user_id, user_data in data.items():
			# Convert role string back to UserRole enum
			if isinstance(user_data.get('role'), str):
				user_data['role'] = UserRole(user_data['role'])
			
			# Add default values for new fields if they don't exist
			user_data.setdefault('department_id', None)
			user_data.setdefault('year', None)
			user_data.setdefault('section_id', None)
			user_data.setdefault('roll_number', None)
			user_data.setdefault('college_id', None)
			
			user = User(**user_data)
			self._index_user(user)

	def _save_to_storage(self) -> None:
		"""Save users to persistent storage"""
		data = {user.id: {
			'id': user.id,
			'username': user.username,
			'email': user.email,
			'hashed_password': user.hashed_password,
			'role': user.role.value,
			'department_id': user.department_id,
			'year': user.year,
			'section_id': user.section_id,
			'roll_number': user.roll_number,
			'college_id': getattr(user, 'college_id', None)
		} for user in self._users_by_username.values()}
		self.storage.save_users(data)

	def _seed_demo_users(self) -> None:
		# Start fresh with only a static super admin
		super_admin = User(
			id=str(uuid4()),
			username="superadmin",
			email="superadmin@labsense.com",
			hashed_password=hash_password("superadmin123"),
			role=UserRole.super_admin,
		)
		self._index_user(super_admin)
		self._save_to_storage()

	def _index_user(self, user: User) -> None:
		self._users_by_username[user.username.lower()] = user
		self._users_by_email[user.email.lower()] = user
		self._users_by_id[user.id] = user
		if user.roll_number:
			self._users_by_roll_number[user.roll_number.lower()] = user

	def add_user(self, user: User) -> None:
		self._index_user(user)
		self._save_to_storage()

	def get_by_username(self, username: str) -> Optional[User]:
		return self._users_by_username.get(username.lower())

	def get_by_email(self, email: str) -> Optional[User]:
		return self._users_by_email.get(email.lower())

	def find_by_username_or_email(self, value: str) -> Optional[User]:
		if "@" in value:
			return self.get_by_email(value)
		return self.get_by_username(value)

	def find_by_id(self, user_id: str) -> Optional[User]:
		"""Find user by ID"""
		for user in self._users_by_username.values():
			if user.id == user_id:
				return user
		return None
	
	def find_by_roll_number(self, roll_number: str, college_id: Optional[str] = None) -> Optional[User]:
		"""Find user by roll number, optionally scoped to college"""
		# Use case-insensitive lookup since roll numbers are indexed in lowercase
		user = self._users_by_roll_number.get(roll_number.lower())
		if user and (college_id is None or user.college_id == college_id):
			return user
		return None
	
	def list_all(self):
		"""Return all users in the system"""
		return list(self._users_by_username.values())
	
	def update_user(self, user_id: str, update_data: dict) -> Optional[User]:
		"""Update user by ID"""
		user = self.find_by_id(user_id)
		if not user:
			return None
		
		# Update fields if provided
		if 'username' in update_data and update_data['username'] != user.username:
			# Remove old username from index
			del self._users_by_username[user.username.lower()]
			user.username = update_data['username']
			self._users_by_username[user.username.lower()] = user
		
		if 'email' in update_data and update_data['email'] != user.email:
			# Remove old email from index
			del self._users_by_email[user.email.lower()]
			user.email = update_data['email']
			self._users_by_email[user.email.lower()] = user
		
		if 'password' in update_data and update_data['password']:
			from ..core.security import hash_password
			user.hashed_password = hash_password(update_data['password'])
		
		if 'role' in update_data:
			user.role = update_data['role']
		
		if 'department_id' in update_data:
			user.department_id = update_data['department_id']
		
		if 'year' in update_data:
			user.year = update_data['year']
		
		if 'section_id' in update_data:
			user.section_id = update_data['section_id']
		
		if 'roll_number' in update_data:
			user.roll_number = update_data['roll_number']
		
		self._save_to_storage()
		return user
