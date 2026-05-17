# Citation Placement Guide for 23 In-Line References

## Exact Line Numbers and Citation Points

### ABSTRACT Section

1. **Line 1** - "The system overcomes limitations of existing methods that are easily fooled by code variations, miss semantic similarity checks, or require extensive training."
   - **Place citation after:** "require extensive training"
   - **Suggested citation:** Review paper on code similarity methods (e.g., Paper 4 - Zhang & Saber)

2. **Line 1** - "LabSense employs a Large Language Model (LLM) to evaluate code logic and semantics"
   - **Place citation after:** "semantics"
   - **Suggested citation:** LLM-based code evaluation paper (e.g., Paper 1 - Lee & Joe, or Paper 2 - Huynh et al.)

### 1. Introduction Section

3. **Line 3** - "By leveraging Large Language Models (LLMs) and automated test case execution"
   - **Place citation after:** "test case execution"
   - **Suggested citation:** LLM evaluation paper (e.g., Paper 1 - Lee & Joe)

### 1.1 Problem Definition Section

4. **Line 5** - "Manual evaluation is time-consuming for large classes, subjective across evaluators, prone to human error"
   - **Place citation after:** "human error"
   - **Suggested citation:** Grading patterns study (e.g., Paper 15 - Weiss et al.)

5. **Line 5** - "Limited feedback quality leaves students with minimal guidance, typically only pass/fail scores without explanations"
   - **Place citation after:** "explanations"
   - **Suggested citation:** Feedback quality study or automated grading paper

### 1.2 Existing Systems Section

6. **Line 7** - "String/Token Based Methods such as MOSS and JPlag compare code text or sequences of tokens"
   - **Place citation after:** "sequences of tokens"
   - **Suggested citation:** MOSS/JPlag methodology paper or comparison study (e.g., Paper 7 - Brach et al.)

7. **Line 7** - "These methods are easily fooled by renaming variables or changing formatting"
   - **Place citation after:** "formatting"
   - **Suggested citation:** Paper discussing limitations (e.g., Paper 5 - Bhavana et al., or Paper 7 - Brach et al.)

8. **Line 8** - "Abstract Syntax Tree (AST) Based Methods like Deckard convert code into tree structures"
   - **Place citation after:** "tree structures"
   - **Suggested citation:** AST-based method paper (e.g., Paper 6 - Parvathy & Thushara, or Paper 14 - Zhao et al.)

9. **Line 8** - "They can miss semantic similarity when the underlying logic is equivalent but expressed differently"
   - **Place citation after:** "differently"
   - **Suggested citation:** AST limitations paper (e.g., Paper 6 - Parvathy & Thushara)

10. **Line 9** - "Program Dependency Graph (PDG) Based Methods build graphs showing data flow and control flow"
    - **Place citation after:** "control flow"
    - **Suggested citation:** PDG-based method paper

11. **Line 9** - "These methods are very complex and slow to compute for large amounts of code"
    - **Place citation after:** "code"
    - **Suggested citation:** PDG complexity study

12. **Line 10** - "Machine Learning Embedding Based Methods such as code2vec, code2seq, and Graph Neural Networks (GNNs)"
    - **Place citation after:** "Graph Neural Networks (GNNs)"
    - **Suggested citation:** ML embedding review (e.g., Paper 4 - Zhang & Saber)

13. **Line 10** - "These methods require extensive training data and fine-tuning, and may not work well for unseen coding styles"
    - **Place citation after:** "coding styles"
    - **Suggested citation:** ML limitations paper (e.g., Paper 4 - Zhang & Saber)

14. **Line 11** - "Automated code grading platforms like HackerRank, LeetCode, and CodeChef excel at test case execution but are designed for competitive programming"
    - **Place citation after:** "competitive programming"
    - **Suggested citation:** Automated grading platform study (e.g., Paper 18 - Liu et al., or Paper 17 - Varga & Fekete)

### 1.3 Proposed System Section

15. **Line 13** - "The system employs a multi-component scoring approach evaluating code quality (20% effort score), logic similarity to ideal solutions using LLMs (40%), and test case performance (40%)"
    - **Place citation after:** "test case performance (40%)"
    - **Suggested citation:** Multi-metric scoring paper (e.g., Paper 16 - Inturi & Swamydas, or Paper 18 - Liu et al.)

16. **Line 13** - "The system provides AI-powered feedback including overall assessment, strengths identification, improvement areas, and actionable suggestions"
    - **Place citation after:** "actionable suggestions"
    - **Suggested citation:** LLM feedback generation paper (e.g., Paper 1 - Lee & Joe, or Paper 8 - Tufano et al.)

### 3. Design Methodology Section

17. **Line 20** - "Requirements Analysis Phase involved identifying problems in existing coding lab examination systems through literature review of research papers on code evaluation, plagiarism detection methods (MOSS, JPlag, AST-based approaches)"
    - **Place citation after:** "AST-based approaches)"
    - **Suggested citation:** Systematic review paper (e.g., Paper 4 - Zhang & Saber, or Paper 8 - Tufano et al.)

### 3.3 Evaluation System Design Section

18. **Line 22** - "analyze logic similarity using an AST + LLM hybrid approach"
    - **Place citation after:** "hybrid approach"
    - **Suggested citation:** Hybrid evaluation paper (e.g., Paper 6 - Parvathy & Thushara, or Paper 14 - Zhao et al.)

19. **Line 22** - "assess the effort level through LLM evaluation"
    - **Place citation after:** "LLM evaluation"
    - **Suggested citation:** LLM effort assessment paper (e.g., Paper 1 - Lee & Joe)

20. **Line 22** - "generate comprehensive feedback via LLM"
    - **Place citation after:** "via LLM"
    - **Suggested citation:** LLM feedback paper (e.g., Paper 1 - Lee & Joe, or Paper 3 - Sukkasem et al.)

21. **Line 23** - "LLM Integration Design employs a unified interface pattern that allows the system to work with multiple LLM providers (OpenAI, Anthropic, Ollama)"
    - **Place citation after:** "Ollama)"
    - **Suggested citation:** LLM integration paper (e.g., Paper 1 - Lee & Joe, or Paper 13 - Nam et al.)

22. **Line 23** - "Prompt templates were refined through iterative testing to generate educational feedback rather than just scores"
    - **Place citation after:** "scores"
    - **Suggested citation:** Prompt engineering paper (e.g., Paper 2 - Huynh et al., or Paper 1 - Lee & Joe)

23. **Line 23** - "Test Case Execution Design implements code execution using external services (Judge0 Cloud API) and local Python execution"
    - **Place citation after:** "local Python execution"
    - **Suggested citation:** Code execution platform paper (e.g., Paper 17 - Varga & Fekete, or Paper 21 - Skalka & Drlík)

---

## Format for Citations

Use square brackets with numbers, e.g., [1], [2], etc. based on your literature survey numbering.

Example:
- "The system overcomes limitations of existing methods that are easily fooled by code variations, miss semantic similarity checks, or require extensive training [4]."
- "LabSense employs a Large Language Model (LLM) to evaluate code logic and semantics [1]."





