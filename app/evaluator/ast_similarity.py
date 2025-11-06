import ast
from typing import Set, Optional


def _walk_nodes(node: ast.AST, bag: Set[str]) -> None:
	"""Walk AST nodes and collect node types"""
	for child in ast.iter_child_nodes(node):
		bag.add(type(child).__name__)
		_walk_nodes(child, bag)


def python_ast_similarity(a_code: str, b_code: str) -> float:
	"""Calculate AST similarity for Python code"""
	try:
		a_tree = ast.parse(a_code)
		b_tree = ast.parse(b_code)
	except Exception:
		return 0.0
	a_nodes: Set[str] = set()
	b_nodes: Set[str] = set()
	_walk_nodes(a_tree, a_nodes)
	_walk_nodes(b_tree, b_nodes)
	if not a_nodes or not b_nodes:
		return 0.0
	intersection = len(a_nodes & b_nodes)
	union = len(a_nodes | b_nodes)
	return intersection / union


def javascript_ast_similarity(a_code: str, b_code: str) -> Optional[float]:
	"""Calculate AST similarity for JavaScript code using pyjsparser"""
	try:
		import pyjsparser
	except ImportError:
		# pyjsparser not available, return None to fall back to LLM
		return None
	
	try:
		a_tree = pyjsparser.parse(a_code)
		b_tree = pyjsparser.parse(b_code)
	except Exception:
		return None
	
	# Extract node types from AST
	def _extract_node_types(node, bag: Set[str]) -> None:
		if isinstance(node, dict):
			if 'type' in node:
				bag.add(node['type'])
			for value in node.values():
				if isinstance(value, (dict, list)):
					_extract_node_types(value, bag)
		elif isinstance(node, list):
			for item in node:
				_extract_node_types(item, bag)
	
	a_nodes: Set[str] = set()
	b_nodes: Set[str] = set()
	_extract_node_types(a_tree, a_nodes)
	_extract_node_types(b_tree, b_nodes)
	
	if not a_nodes or not b_nodes:
		return None
	
	intersection = len(a_nodes & b_nodes)
	union = len(a_nodes | b_nodes)
	return intersection / union if union > 0 else 0.0


def java_ast_similarity(a_code: str, b_code: str) -> Optional[float]:
	"""Calculate AST similarity for Java code using javalang"""
	try:
		import javalang
	except ImportError:
		# javalang not available, return None to fall back to LLM
		return None
	
	try:
		a_tree = javalang.parse.parse(a_code)
		b_tree = javalang.parse.parse(b_code)
	except Exception:
		return None
	
	# Extract node types from AST
	def _extract_node_types(node, bag: Set[str]) -> None:
		if hasattr(node, '__class__'):
			bag.add(node.__class__.__name__)
		if hasattr(node, '__dict__'):
			for value in node.__dict__.values():
				if isinstance(value, (list, tuple)):
					for item in value:
						if hasattr(item, '__class__'):
							_extract_node_types(item, bag)
				elif hasattr(value, '__class__'):
					_extract_node_types(value, bag)
	
	a_nodes: Set[str] = set()
	b_nodes: Set[str] = set()
	_extract_node_types(a_tree, a_nodes)
	_extract_node_types(b_tree, b_nodes)
	
	if not a_nodes or not b_nodes:
		return None
	
	intersection = len(a_nodes & b_nodes)
	union = len(a_nodes | b_nodes)
	return intersection / union if union > 0 else 0.0


def get_ast_similarity(language: str, a_code: str, b_code: str) -> Optional[float]:
	"""Get AST similarity for a language, returns None if not supported or fails"""
	lang = language.lower()
	
	if lang == 'python':
		return python_ast_similarity(a_code, b_code)
	elif lang in ('javascript', 'js', 'nodejs'):
		return javascript_ast_similarity(a_code, b_code)
	elif lang == 'java':
		return java_ast_similarity(a_code, b_code)
	else:
		# Other languages: C, C++, Go, etc. - no AST parsers available
		return None
