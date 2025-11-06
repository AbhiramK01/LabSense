from typing import Dict, List, Optional
from dataclasses import dataclass, asdict
from time import time
from ..storage.persistent import PersistentStorage


@dataclass
class Submission:
	id: str
	student_id: str
	exam_id: Optional[str]
	question_id: Optional[str]
	language: str
	score: float
	feedback: str
	correctness: float
	logic_similarity: float
	effort: float
	timestamp: float


class SubmissionRepository:
	def __init__(self) -> None:
		self._items: Dict[str, Submission] = {}
		self.storage = PersistentStorage()
		self._load_from_storage()

	def _load_from_storage(self) -> None:
		"""Load submissions from persistent storage"""
		data = self.storage.load_submissions()
		for sub_id, sub_data in data.items():
			submission = Submission(**sub_data)
			self._items[sub_id] = submission

	def _save_to_storage(self) -> None:
		"""Save submissions to persistent storage"""
		data = {sub_id: asdict(sub) for sub_id, sub in self._items.items()}
		self.storage.save_submissions(data)

	def add(self, sub: Submission) -> None:
		self._items[sub.id] = sub
		self._save_to_storage()

	def list(self, exam_id: Optional[str] = None, student_id: Optional[str] = None, question_id: Optional[str] = None) -> List[Submission]:
		items = list(self._items.values())
		if exam_id:
			items = [s for s in items if s.exam_id == exam_id]
		if student_id:
			items = [s for s in items if s.student_id == student_id]
		if question_id:
			items = [s for s in items if s.question_id == question_id]
		return sorted(items, key=lambda s: s.timestamp, reverse=True)

	def to_dicts(self, items: List[Submission]) -> List[dict]:
		return [asdict(s) for s in items]
	
	def delete_by_exam_id(self, exam_id: str) -> int:
		"""Delete all submissions for a specific exam and return count of deleted items"""
		submissions_to_delete = [sub_id for sub_id, sub in self._items.items() if sub.exam_id == exam_id]
		for sub_id in submissions_to_delete:
			del self._items[sub_id]
		if submissions_to_delete:
			self._save_to_storage()
		return len(submissions_to_delete)

	def delete_by_student_id(self, student_id: str) -> int:
		"""Delete all submissions for a specific student and return count of deleted items"""
		submissions_to_delete = [sub_id for sub_id, sub in self._items.items() if sub.student_id == student_id]
		for sub_id in submissions_to_delete:
			del self._items[sub_id]
		if submissions_to_delete:
			self._save_to_storage()
		return len(submissions_to_delete)

	def delete_by_exam_and_student(self, exam_id: str, student_id: str) -> int:
		"""Delete all submissions for a specific student within an exam"""
		submissions_to_delete = [sub_id for sub_id, sub in self._items.items() if sub.exam_id == exam_id and sub.student_id == student_id]
		for sub_id in submissions_to_delete:
			del self._items[sub_id]
		if submissions_to_delete:
			self._save_to_storage()
		return len(submissions_to_delete)
