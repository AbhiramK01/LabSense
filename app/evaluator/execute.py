from typing import Tuple
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
		# Fallback to local execution if cloud fails
		if language == 'python':
			return local_python_execute(source, stdin)
		if language == 'java':
			return local_java_execute(source, stdin)
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


def local_java_execute(source: str, stdin: str) -> Tuple[str, str, int]:
	with tempfile.TemporaryDirectory() as td:
		source_path = os.path.join(td, 'Main.java')
		with open(source_path, 'w') as f:
			f.write(source)
		try:
			compile_res = subprocess.run(
				['javac', source_path],
				cwd=td,
				capture_output=True,
				timeout=15,
			)
			if compile_res.returncode != 0:
				return compile_res.stdout.decode(), compile_res.stderr.decode(), compile_res.returncode

			run_res = subprocess.run(
				['java', '-cp', td, 'Main'],
				cwd=td,
				input=stdin.encode(),
				capture_output=True,
				timeout=5,
			)
			return run_res.stdout.decode(), run_res.stderr.decode(), run_res.returncode
		except FileNotFoundError as exc:
			return '', f'Java runtime not available: {str(exc)}', 127
		except subprocess.TimeoutExpired:
			return '', 'Timeout', 124
