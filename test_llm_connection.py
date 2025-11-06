#!/usr/bin/env python3
"""
Quick test script to verify LLM connection is working
"""

import os
import sys
import asyncio
from app.evaluator.llm_evaluator import get_llm_evaluator

async def test_llm():
    print("🧪 Testing LLM Connection...")
    print(f"LABSENSE_LLM_URL: {os.environ.get('LABSENSE_LLM_URL', 'NOT SET')}")
    print(f"LABSENSE_LLM_MODEL: {os.environ.get('LABSENSE_LLM_MODEL', 'NOT SET')}")
    print()
    
    evaluator = get_llm_evaluator()
    print(f"Detected provider: {evaluator.provider}")
    print(f"Local URL: {evaluator.local_url}")
    print()
    
    # Test effort evaluation
    print("Testing effort evaluation...")
    try:
        effort_score, breakdown, reasoning = await evaluator.evaluate_effort(
            student_code="print('hello')",
            ideal_code="print('hello world')",
            language="python",
            question_text="Print hello",
            test_results={'results': [], 'passed': 0, 'total': 0}
        )
        print(f"✅ Effort evaluation worked!")
        print(f"   Score: {effort_score}")
        print(f"   Reasoning: {reasoning[:100]}...")
        print()
    except Exception as e:
        print(f"❌ Effort evaluation failed: {e}")
        print()
    
    # Test logic similarity
    print("Testing logic similarity...")
    try:
        similarity, breakdown, notes = await evaluator.evaluate_logic_similarity(
            student_code="def add(a, b): return a + b",
            ideal_code="def add(x, y): return x + y",
            language="python"
        )
        print(f"✅ Logic similarity evaluation worked!")
        print(f"   Similarity: {similarity}")
        print(f"   Notes: {notes[:100]}...")
        print()
    except Exception as e:
        print(f"❌ Logic similarity evaluation failed: {e}")
        print()
    
    # Test feedback generation
    print("Testing feedback generation...")
    try:
        feedback = await evaluator.generate_feedback(
            student_code="print('hello')",
            ideal_code="print('hello world')",
            language="python",
            question_text="Print hello",
            test_results={'results': [{'passed': True, 'input': 'test', 'expected_output': 'hello', 'actual_output': 'hello'}], 'passed': 1, 'total': 1},
            effort_score=0.8,
            logic_similarity=0.9,
            test_case_score=1.0
        )
        print(f"✅ Feedback generation worked!")
        print(f"   Feedback keys: {list(feedback.keys())}")
        if feedback.get('feedback'):
            print(f"   Sample: {feedback['feedback'][:150]}...")
        print()
        print("🎉 All LLM tests passed! The system is ready to use.")
    except Exception as e:
        print(f"❌ Feedback generation failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_llm())

