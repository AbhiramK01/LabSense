from typing import Dict, Optional
from uuid import uuid4

from ..storage.persistent import PersistentStorage


class CollegeRepository:
	def __init__(self) -> None:
		self._colleges: Dict[str, dict] = {}
		self.storage = PersistentStorage()
		self._load_from_storage()

	def _load_from_storage(self) -> None:
		data = self.storage.load_colleges()
		self._colleges = data or {}

	def _save_to_storage(self) -> None:
		self.storage.save_colleges(self._colleges)

	def list(self) -> list[dict]:
		return [dict(id=cid, **c) for cid, c in self._colleges.items()]

	def get(self, college_id: str) -> Optional[dict]:
		c = self._colleges.get(college_id)
		if not c:
			return None
		return dict(id=college_id, **c)

	def create(self, name: str, address: str, code: str, logo_url: str = "") -> str:
		# ensure unique name and code (case-insensitive)
		lname = name.strip().lower()
		lcode = code.strip().lower()
		for c in self._colleges.values():
			if c.get('name', '').strip().lower() == lname:
				raise ValueError(f'College name "{name}" already exists. Please choose a different name.')
			if c.get('code', '').strip().lower() == lcode:
				raise ValueError(f'College code "{code}" already exists. Please choose a different code.')
		cid = str(uuid4())
		self._colleges[cid] = {
			'name': name.strip(),
			'address': address.strip(),
			'code': code.strip(),
			'logo_url': logo_url or ""
		}
		self._save_to_storage()
		return cid

	def rename(self, college_id: str, name: str) -> bool:
		if college_id not in self._colleges:
			return False
		# Case-insensitive uniqueness check
		lname = name.strip().lower()
		for k, v in self._colleges.items():
			if k != college_id and v.get('name', '').strip().lower() == lname:
				raise ValueError(f'College name "{name}" already exists. Please choose a different name.')
		self._colleges[college_id]['name'] = name.strip()
		self._save_to_storage()
		return True

	def update(self, college_id: str, *, name: Optional[str] = None, address: Optional[str] = None, code: Optional[str] = None, logo_url: Optional[str] = None) -> bool:
		if college_id not in self._colleges:
			return False
		# Uniqueness checks when changing name/code
		if name is not None:
			lname = name.strip().lower()
			for k, v in self._colleges.items():
				if k != college_id and v.get('name', '').strip().lower() == lname:
					raise ValueError(f'College name "{name}" already exists. Please choose a different name.')
		if code is not None:
			lcode = code.strip().lower()
			for k, v in self._colleges.items():
				if k != college_id and v.get('code', '').strip().lower() == lcode:
					raise ValueError(f'College code "{code}" already exists. Please choose a different code.')
		# Apply updates
		c = self._colleges[college_id]
		if name is not None:
			c['name'] = name.strip()
		if address is not None:
			c['address'] = address.strip()
		if code is not None:
			c['code'] = code.strip()
		if logo_url is not None:
			c['logo_url'] = logo_url
		self._save_to_storage()
		return True

	def delete(self, college_id: str) -> bool:
		if college_id not in self._colleges:
			return False
		del self._colleges[college_id]
		self._save_to_storage()
		return True


