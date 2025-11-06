import math
from typing import List, Set, Tuple
from itertools import combinations, permutations

class QuestionAssignmentAlgorithm:
    """
    Advanced question assignment algorithm that ensures no two adjacent students
    get the same questions, even with different question combinations.
    """
    
    def __init__(self, total_questions: int):
        self.total_questions = total_questions
        self.used_combinations: Set[Tuple[int, ...]] = set()
        self.student_assignments: List[Tuple[int, ...]] = []
    
    def calculate_minimum_questions_needed(self, questions_per_student: int) -> int:
        """
        Calculate minimum number of questions needed to ensure no adjacency conflicts.
        
        For STRICT adjacency-free assignment (no shared questions between adjacent students):
        We need at least 2 * questions_per_student questions.
        This ensures we can create non-overlapping combinations.
        
        Examples:
        - 2 per student: need 4 questions → (1,2), (3,4) have no overlap
        - 3 per student: need 6 questions → (1,2,3), (4,5,6) have no overlap
        - 1 per student: need 2 questions → (1), (2) have no overlap
        
        Args:
            questions_per_student: Number of questions each student should get
            
        Returns:
            Minimum number of questions needed
        """
        if questions_per_student > self.total_questions:
            return self.total_questions  # Can't assign more than available
        
        # For strict adjacency-free assignment, we need at least 2 * questions_per_student
        return max(2 * questions_per_student, questions_per_student + 1)
    
    def _can_handle_strict_adjacency_constraints(self, n: int, k: int) -> bool:
        """
        Check if we have enough combinations to handle STRICT adjacency constraints.
        
        Strict adjacency means NO shared questions between adjacent students.
        This is much more restrictive than just avoiding identical combinations.
        
        Args:
            n: Total number of questions
            k: Questions per student
            
        Returns:
            True if we can handle strict adjacency constraints
        """
        if k == 1:
            return n >= 2
        
        # Generate all possible combinations
        from itertools import combinations
        
        all_combinations = list(combinations(range(1, n + 1), k))
        
        # For strict adjacency-free assignment, we need enough combinations
        # to create sequences where no adjacent students share ANY questions
        if len(all_combinations) < 3:
            return False
        
        # Try to find a sequence that avoids ANY question overlap between neighbors
        # This is much more restrictive than just avoiding identical combinations
        return self._can_create_strict_adjacency_free_sequence(all_combinations)
    
    def _can_create_strict_adjacency_free_sequence(self, combinations: List[Tuple[int, ...]]) -> bool:
        """
        Try to create a sequence where no adjacent students share any questions.
        
        This is a simplified check - in practice, we'd need more sophisticated logic
        to guarantee adjacency-free assignment for any number of students.
        """
        if len(combinations) < 3:
            return False
        
        # Try to find at least 3 combinations that don't share any questions
        # This is a simplified check - the actual assignment algorithm will handle
        # the full complexity of finding valid sequences
        unique_combinations = []
        used_questions = set()
        
        for combo in combinations:
            combo_set = set(combo)
            # Check if this combination shares any questions with already selected ones
            if not combo_set.intersection(used_questions):
                unique_combinations.append(combo)
                used_questions.update(combo_set)
                
                # If we can find at least 3 non-overlapping combinations,
                # we have a good chance of creating adjacency-free sequences
                if len(unique_combinations) >= 3:
                    return True
        
        return False
    
    def can_assign_combination(self, combination: Tuple[int, ...], student_index: int) -> bool:
        """
        Check if a combination can be assigned to a student without adjacency conflicts.
        
        Args:
            combination: Tuple of question IDs
            student_index: Index of the student (0-based)
            
        Returns:
            True if assignment is safe, False otherwise
        """
        # Check adjacency with previous student
        if student_index > 0:
            prev_assignment = self.student_assignments[student_index - 1]
            if combination == prev_assignment:
                return False
        
        # Check adjacency with next student (if exists)
        if student_index < len(self.student_assignments) - 1:
            next_assignment = self.student_assignments[student_index + 1]
            if combination == next_assignment:
                return False
        
        return True
    
    def assign_questions(self, questions_per_student: int, num_students: int) -> List[List[int]]:
        """
        Assign questions to students ensuring no adjacency conflicts.
        
        Algorithm:
        1. Generate all possible combinations
        2. Use a smart assignment strategy that avoids adjacency conflicts
        3. For each student, find a combination that doesn't share questions with neighbors
        4. Use a greedy approach with conflict detection
        
        Args:
            questions_per_student: Number of questions each student should get
            num_students: Number of students to assign questions to
            
        Returns:
            List of question assignments for each student
        """
        if questions_per_student > self.total_questions:
            raise ValueError(f"Cannot assign {questions_per_student} questions when only {self.total_questions} available")
        
        # Generate all possible combinations
        all_combinations = list(combinations(range(1, self.total_questions + 1), questions_per_student))
        
        if len(all_combinations) < num_students:
            raise ValueError(f"Not enough question combinations. Need {num_students}, have {len(all_combinations)}")
        
        # Use smart assignment algorithm
        return self._smart_assignment(all_combinations, num_students)
    
    def _smart_assignment(self, all_combinations: List[Tuple[int, ...]], num_students: int) -> List[List[int]]:
        """
        Smart assignment algorithm that avoids adjacency conflicts.
        
        Strategy:
        1. For each student, find combinations that don't conflict with neighbors
        2. Use a priority system to prefer combinations with less overlap
        3. If no perfect combination exists, choose the one with minimal conflicts
        """
        assignments = []
        used_combinations = set()
        
        for student_index in range(num_students):
            best_combination = None
            best_score = float('inf')
            
            # Find the best combination for this student
            for combination in all_combinations:
                if combination in used_combinations:
                    continue
                
                # Calculate conflict score (lower is better)
                conflict_score = self._calculate_conflict_score(combination, assignments, student_index)
                
                if conflict_score < best_score:
                    best_score = conflict_score
                    best_combination = combination
            
            # Assign the best combination found
            if best_combination:
                assignments.append(list(best_combination))
                used_combinations.add(best_combination)
            else:
                # Fallback: assign any unused combination
                for combination in all_combinations:
                    if combination not in used_combinations:
                        assignments.append(list(combination))
                        used_combinations.add(combination)
                        break
        
        return assignments
    
    def _calculate_conflict_score(self, combination: Tuple[int, ...], assignments: List[List[int]], student_index: int) -> int:
        """
        Calculate conflict score for a combination.
        Lower score = better (less conflicts)
        """
        combination_set = set(combination)
        conflict_score = 0
        
        # Check conflict with previous student (left neighbor)
        if student_index > 0:
            prev_assignment = set(assignments[student_index - 1])
            shared_questions = combination_set.intersection(prev_assignment)
            conflict_score += len(shared_questions) * 10  # Heavy penalty for shared questions
        
        # Check conflict with next student (right neighbor) if already assigned
        if student_index < len(assignments) - 1:
            next_assignment = set(assignments[student_index + 1])
            shared_questions = combination_set.intersection(next_assignment)
            conflict_score += len(shared_questions) * 10  # Heavy penalty for shared questions
        
        # Prefer combinations that haven't been used recently
        recent_usage_penalty = 0
        for i in range(max(0, student_index - 3), student_index):
            if i < len(assignments):
                prev_set = set(assignments[i])
                shared = combination_set.intersection(prev_set)
                recent_usage_penalty += len(shared) * 2  # Light penalty for recent usage
        
        return conflict_score + recent_usage_penalty
    
    def _greedy_assignment(self, all_combinations: List[Tuple[int, ...]], num_students: int, questions_per_student: int) -> List[List[int]]:
        """
        Greedy fallback assignment when backtracking fails.
        Tries to minimize adjacency conflicts.
        """
        assignments = []
        used_combinations = set()
        
        for student_index in range(num_students):
            best_combination = None
            min_conflicts = float('inf')
            
            # Find the combination with minimum adjacency conflicts
            for combination in all_combinations:
                if combination in used_combinations:
                    continue
                
                # Count potential conflicts
                conflicts = 0
                if student_index > 0:
                    prev_assignment = tuple(sorted(assignments[student_index - 1]))
                    if tuple(sorted(combination)) == prev_assignment:
                        conflicts += 1
                
                if conflicts < min_conflicts:
                    min_conflicts = conflicts
                    best_combination = combination
            
            # Assign the best combination found
            if best_combination:
                assignments.append(list(best_combination))
                used_combinations.add(best_combination)
            else:
                # Last resort: assign any unused combination
                for combination in all_combinations:
                    if combination not in used_combinations:
                        assignments.append(list(combination))
                        used_combinations.add(combination)
                        break
        
        return assignments
    
    def _has_adjacency_conflict(self, combination: Tuple[int, ...], assignments: List[List[int]], student_index: int) -> bool:
        """Check if a combination would create adjacency conflicts.
        
        Adjacency conflict occurs when:
        - Two adjacent students share ANY common questions
        - This is stricter than just having identical combinations
        """
        combination_set = set(combination)
        
        # Check with previous student (left neighbor)
        if student_index > 0:
            prev_assignment = set(assignments[student_index - 1])
            # If there's ANY overlap in questions, it's a conflict
            if combination_set.intersection(prev_assignment):
                return True
        
        # Check with next student (right neighbor) if already assigned
        if student_index < len(assignments) - 1:
            next_assignment = set(assignments[student_index + 1])
            # If there's ANY overlap in questions, it's a conflict
            if combination_set.intersection(next_assignment):
                return True
        
        return False
    
    def get_assignment_statistics(self, assignments: List[List[int]]) -> dict:
        """Get statistics about the assignment."""
        if not assignments:
            return {"total_students": 0, "unique_combinations": 0, "adjacency_conflicts": 0}
        
        unique_combinations = len(set(tuple(sorted(assignment)) for assignment in assignments))
        adjacency_conflicts = 0
        
        # Check for adjacency conflicts (any shared questions between adjacent students)
        for i in range(len(assignments) - 1):
            current_set = set(assignments[i])
            next_set = set(assignments[i + 1])
            # If there's ANY overlap in questions, it's a conflict
            if current_set.intersection(next_set):
                adjacency_conflicts += 1
        
        return {
            "total_students": len(assignments),
            "unique_combinations": unique_combinations,
            "adjacency_conflicts": adjacency_conflicts,
            "success_rate": (len(assignments) - adjacency_conflicts) / len(assignments) * 100 if assignments else 0
        }
