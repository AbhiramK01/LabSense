# Citation Accuracy Analysis

## Issues Found and Corrections Needed

After reviewing all 23 citations against the actual research papers, here are the issues:

### ✅ ACCURATE CITATIONS (Good matches):

1. **[1]** - "require extensive training" → **Paper 4** (Zhang & Saber - ML review) ✓
2. **[2]** - "semantics" (LLM evaluation) → **Paper 1** (Lee & Joe - GPT code review) ✓
3. **[4]** - "human error" (manual evaluation) → **Paper 15** (Weiss et al. - grading patterns) ✓
4. **[6]** - MOSS/JPlag methods → **Paper 7** (Brach et al. - compares LLMs with JPlag) ✓
5. **[7]** - "formatting" (string/token limitations) → **Paper 5** (Bhavana et al. - string matching) ✓
6. **[8]** - AST tree structures → **Paper 6** (Parvathy & Thushara - AST-based) ✓
7. **[12]** - ML embedding methods → **Paper 4** (Zhang & Saber - ML review) ✓
8. **[13]** - "coding styles" (ML limitations) → **Paper 4** (Zhang & Saber - ML review) ✓
9. **[16]** - AI feedback → **Paper 1** (Lee & Joe - GPT feedback system) ✓
10. **[17]** - Literature review → **Paper 4** (Zhang & Saber - systematic review) ✓
11. **[19]** - LLM effort evaluation → **Paper 1** (Lee & Joe - GPT evaluation) ✓
12. **[20]** - LLM feedback → **Paper 1** (Lee & Joe - GPT feedback) ✓
13. **[21]** - LLM providers → **Paper 1** (Lee & Joe - GPT-based) or **Paper 13** (Nam et al. - GILT) ✓
14. **[22]** - Prompt templates → **Paper 2** (Huynh et al. - prompt engineering) ✓

### ⚠️ NEEDS CORRECTION:

1. **[3]** - "test case execution" 
   - **Current:** Sequential [3]
   - **Should be:** Paper 17 (Varga & Fekete - automatic C code assessment) or Paper 18 (Liu et al. - AUTOGRADER) or Paper 21 (Skalka & Drlík - grey-box testing)
   - **Issue:** Paper 1 is about code review, not test execution

2. **[5]** - "explanations" (limited feedback)
   - **Current:** Sequential [5]
   - **Should be:** Paper 1 (Lee & Joe - feedback system) or Paper 8 (Tufano et al. - code review automation)
   - **Issue:** Needs a paper specifically about feedback quality

3. **[9]** - "differently" (AST limitations)
   - **Current:** Sequential [9]
   - **Should be:** Paper 6 (same as [8]) or Paper 14 (Zhao et al. - AST with attention)
   - **Issue:** Using same paper twice or should use different AST paper

4. **[10]** - PDG graphs
   - **Current:** Sequential [10]
   - **Should be:** No specific PDG paper in list - could use Paper 12 (Zhao et al. - symbolic execution) or remove
   - **Issue:** No PDG-specific paper available

5. **[11]** - "code" (PDG complexity)
   - **Current:** Sequential [11]
   - **Should be:** Same as [10] or remove
   - **Issue:** No PDG-specific paper available

6. **[14]** - "competitive programming" (grading platforms)
   - **Current:** Sequential [14]
   - **Should be:** Paper 17 (Varga & Fekete) or Paper 18 (Liu et al. - AUTOGRADER)
   - **Issue:** Should cite actual grading platform papers

7. **[15]** - "40%)" (multi-component scoring)
   - **Current:** Sequential [15]
   - **Should be:** Paper 16 (Inturi & Swamydas - control statement grading) or Paper 18 (Liu et al. - AUTOGRADER)
   - **Issue:** Needs a paper about scoring methodology

8. **[18]** - "hybrid approach" (AST + LLM)
   - **Current:** Sequential [18]
   - **Should be:** Paper 6 (Parvathy & Thushara - AST) + Paper 1 (Lee & Joe - LLM) or Paper 14 (Zhao et al. - AST with attention)
   - **Issue:** Should cite both AST and LLM papers or a hybrid approach paper

9. **[23]** - "execution" (Judge0/local)
   - **Current:** Sequential [23]
   - **Should be:** Paper 17 (Varga & Fekete - web-based execution) or Paper 21 (Skalka & Drlík - testing)
   - **Issue:** Should cite execution platform papers

## RECOMMENDED CORRECTED MAPPING:

Based on actual paper content:

1. [1] → Paper 4 (Zhang & Saber - ML review)
2. [2] → Paper 1 (Lee & Joe - LLM evaluation)
3. [3] → Paper 17 (Varga & Fekete - automatic assessment) or Paper 18 (Liu et al.)
4. [4] → Paper 15 (Weiss et al. - grading patterns)
5. [5] → Paper 1 (Lee & Joe - feedback) or Paper 8 (Tufano et al.)
6. [6] → Paper 7 (Brach et al. - JPlag comparison)
7. [7] → Paper 5 (Bhavana et al. - string matching)
8. [8] → Paper 6 (Parvathy & Thushara - AST)
9. [9] → Paper 14 (Zhao et al. - AST with attention) or Paper 6
10. [10] → Paper 12 (Zhao et al. - symbolic execution) or remove
11. [11] → Same as [10] or remove
12. [12] → Paper 4 (Zhang & Saber - ML review)
13. [13] → Paper 4 (Zhang & Saber - ML review)
14. [14] → Paper 17 (Varga & Fekete) or Paper 18 (Liu et al.)
15. [15] → Paper 16 (Inturi & Swamydas) or Paper 18 (Liu et al.)
16. [16] → Paper 1 (Lee & Joe - feedback)
17. [17] → Paper 4 (Zhang & Saber - systematic review)
18. [18] → Paper 6 (AST) + Paper 1 (LLM) or Paper 14
19. [19] → Paper 1 (Lee & Joe - LLM evaluation)
20. [20] → Paper 1 (Lee & Joe - feedback) or Paper 3 (Sukkasem et al. - summarization)
21. [21] → Paper 1 (Lee & Joe) or Paper 13 (Nam et al. - GILT)
22. [22] → Paper 2 (Huynh et al. - prompt engineering)
23. [23] → Paper 17 (Varga & Fekete) or Paper 21 (Skalka & Drlík)

## CONCLUSION:

**The sequential numbering [1]-[23] is NOT accurate** because:
- Some citations don't match the context (e.g., [3] about test execution citing code review paper)
- Some papers are cited multiple times (Paper 1, Paper 4) which is fine, but the sequential numbering suggests unique papers
- Some topics (PDG) don't have matching papers in the list
- The numbering should reflect actual paper numbers from literature survey, not sequential 1-23

**RECOMMENDATION:** The citations should be remapped to actual paper numbers from your literature survey, not sequential 1-23. Each citation should point to the most relevant paper for that specific context.





