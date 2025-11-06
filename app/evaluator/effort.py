def effort_score(student_code: str) -> float:
	length = len(student_code.strip())
	if length <= 0:
		return 0.0
	# heuristic: normalize by typical size 4000 chars, cap at 1.0
	norm = min(1.0, length / 4000.0)
	# small bonus for including functions/loops keywords (indicative of structure)
	bonus = 0.0
	for kw in ["def ", "for ", "while ", "if ", "class "]:
		if kw in student_code:
			bonus += 0.05
	return min(1.0, norm * 0.9 + bonus)
