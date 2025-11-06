from typing import List, Tuple
import base64
import os
import requests
import subprocess
import tempfile


def judge0_execute(language: str, source: str, stdin: str) -> Tuple[str, str, int]:
	url = os.environ.get('LABSENSE_JUDGE0_URL', 'https://judge0-ce.p.rapidapi.com')
	
	headers = {
    'x-rapidapi-key': "0980cc4ee0msheb8f1f00374dcedp1f5ad5jsne4f48d0e07fa",
    'x-rapidapi-host': "judge0-ce.p.rapidapi.com"
}
	
	payload = {
		"source_code": source,
		"language_id": _lang_to_judge0(language),
		"stdin": stdin,
		"redirect_stderr_to_stdout": True,
	}
	
	try:
		r = requests.post(f"{url}/submissions?base64_encoded=false&wait=true", 
						 json=payload, headers=headers, timeout=30)
		r.raise_for_status()
		data = r.json()
		stdout = data.get('stdout') or ''
		stderr = data.get('stderr') or ''
		status = data.get('status', {}).get('id', 0)
		return stdout, stderr, status
	except requests.exceptions.RequestException as e:
		# Fallback to local Python if cloud fails
		if language == 'python':
			return local_python_execute(source, stdin)
		else:
			return '', f'Judge0 Cloud error: {str(e)}', 1


def _lang_to_judge0(language: str) -> int:
	map = {
		'python': 71,
		'javascript': 63,
		'java': 62,
		'c': 50,
		'cpp': 54,
		'go': 60,
	}
	return map.get(language, 71)


def local_python_execute(source: str, stdin: str) -> Tuple[str, str, int]:
	with tempfile.TemporaryDirectory() as td:
		code_path = os.path.join(td, 'main.py')
		with open(code_path, 'w') as f:
			f.write(source)
		try:
			res = subprocess.run(['python3', code_path], input=stdin.encode(), capture_output=True, timeout=5)
			return res.stdout.decode(), res.stderr.decode(), res.returncode
		except subprocess.TimeoutExpired:
			return '', 'Timeout', 124
