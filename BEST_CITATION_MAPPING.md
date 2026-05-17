# Best Paper Mapping for Each Citation

## Recommended Paper Assignments Based on Context

### ABSTRACT Section

**[1]** - "require extensive training" (limitations of existing methods)
- **Context:** Discussing limitations of existing code similarity methods
- **Best Paper:** **Paper 4** (Zhang & Saber - Systematic Review of ML methods)
- **Reasoning:** This is a comprehensive review that discusses training requirements and limitations of ML-based code similarity methods

**[2]** - "semantics" (LLM evaluation of code logic and semantics)
- **Context:** LabSense employs LLM to evaluate code logic and semantics
- **Best Paper:** **Paper 1** (Lee & Joe - GPT-Based Code Review with Feedback)
- **Reasoning:** This paper specifically uses GPT-4o for code evaluation with semantic understanding and feedback generation

### 1. Introduction Section

**[3]** - "test case execution" (automated test case execution)
- **Context:** Leveraging LLMs and automated test case execution
- **Best Paper:** **Paper 18** (Liu et al. - AUTOGRADER with Formal Semantics)
- **Reasoning:** This paper is specifically about automatic grading with test case execution using formal semantics

### 1.1 Problem Definition Section

**[4]** - "human error" (manual evaluation prone to human error)
- **Context:** Manual evaluation is time-consuming and prone to human error
- **Best Paper:** **Paper 15** (Weiss et al. - Grading Patterns Analysis)
- **Reasoning:** This longitudinal study analyzes grading patterns and identifies issues with manual evaluation including subjectivity and errors

**[5]** - "explanations" (limited feedback quality - no explanations)
- **Context:** Limited feedback quality leaves students without explanations
- **Best Paper:** **Paper 1** (Lee & Joe - GPT-Based Code Review with Feedback)
- **Reasoning:** This paper specifically addresses providing accurate and supportive feedback, which is what's missing in traditional systems

### 1.2 Existing Systems Section

**[6]** - MOSS/JPlag (String/Token Based Methods)
- **Context:** String/Token Based Methods such as MOSS and JPlag
- **Best Paper:** **Paper 7** (Brach et al. - LLM vs JPlag for Plagiarism Detection)
- **Reasoning:** This paper directly compares LLMs with JPlag, discussing JPlag's methodology and limitations

**[7]** - "formatting" (easily fooled by renaming/changing formatting)
- **Context:** String/token methods are easily fooled by renaming variables or changing formatting
- **Best Paper:** **Paper 5** (Bhavana et al. - Plagiarism Detection using String Matching)
- **Reasoning:** This paper uses string matching algorithms (KMP, Levenshtein) and discusses their limitations with formatting changes

**[8]** - AST tree structures (AST-Based Methods)
- **Context:** AST-Based Methods convert code into tree structures
- **Best Paper:** **Paper 6** (Parvathy & Thushara - AST-Based Neural Networks)
- **Reasoning:** This paper specifically discusses AST-based approaches for code classification

**[9]** - "differently" (AST methods miss semantic similarity)
- **Context:** AST methods can miss semantic similarity when logic is equivalent but expressed differently
- **Best Paper:** **Paper 14** (Zhao et al. - RNN with Multi-Head Attention and AST)
- **Reasoning:** This paper discusses AST-based methods and their ability (or limitations) to capture semantic similarity

**[10]** - PDG graphs (PDG-Based Methods - data flow and control flow)
- **Context:** PDG-Based Methods build graphs showing data flow and control flow
- **Best Paper:** **Paper 12** (Mengyan Zhao et al. - Symbolic Execution for Code Analysis)
- **Reasoning:** While not specifically PDG, this paper uses symbolic execution which analyzes control and data flow, making it the closest match. Alternatively, this citation could be removed if no PDG paper is available.

**[11]** - "code" (PDG methods are complex and slow)
- **Context:** PDG methods are very complex and slow to compute
- **Best Paper:** **Paper 12** (Mengyan Zhao et al. - Symbolic Execution) or **Paper 20** (Wei et al. - Parallel Symbolic Execution)
- **Reasoning:** Paper 20 discusses performance optimization of symbolic execution, which relates to complexity issues. Paper 12 is also relevant.

**[12]** - ML embedding methods (code2vec, code2seq, GNNs)
- **Context:** Machine Learning Embedding Based Methods learn to represent code as vectors
- **Best Paper:** **Paper 4** (Zhang & Saber - Systematic Review of ML Code Similarity)
- **Reasoning:** This comprehensive review covers code2vec, code2seq, GNNs, and other ML embedding methods (84 studies, 51 algorithms)

**[13]** - "coding styles" (ML methods may not work for unseen coding styles)
- **Context:** ML methods may not work well for unseen coding styles or new problem types
- **Best Paper:** **Paper 4** (Zhang & Saber - Systematic Review)
- **Reasoning:** The systematic review discusses limitations and challenges of ML-based approaches, including generalization issues

**[14]** - "competitive programming" (grading platforms designed for competitive programming)
- **Context:** Automated code grading platforms excel at test case execution but designed for competitive programming
- **Best Paper:** **Paper 17** (Varga & Fekete - Automatic C Code Assessment Platform)
- **Reasoning:** This paper discusses web-based platforms for automatic code assessment, which relates to grading platforms

### 1.3 Proposed System Section

**[15]** - "40%)" (multi-component scoring approach)
- **Context:** Multi-component scoring: 20% effort, 40% logic, 40% test cases
- **Best Paper:** **Paper 16** (Inturi & Swamydas - Grading through Control Statement Features)
- **Reasoning:** This paper uses multi-component scoring based on control statement features, demonstrating a weighted scoring approach

**[16]** - "suggestions" (AI-powered feedback with actionable suggestions)
- **Context:** AI-powered feedback including overall assessment, strengths, improvement areas, and actionable suggestions
- **Best Paper:** **Paper 1** (Lee & Joe - GPT-Based Code Review with Accurate Feedback)
- **Reasoning:** This paper specifically focuses on providing accurate and supportive feedback for programming education, which aligns perfectly

### 3. Design Methodology Section

**[17]** - "platforms" (literature review of code evaluation and grading platforms)
- **Context:** Literature review of research papers on code evaluation, plagiarism detection, and automated grading platforms
- **Best Paper:** **Paper 4** (Zhang & Saber - Systematic Review)
- **Reasoning:** This is a systematic review that synthesizes multiple studies, making it ideal for citing a literature review approach

### 3.3 Evaluation System Design Section

**[18]** - "hybrid approach" (AST + LLM hybrid approach)
- **Context:** Analyze logic similarity using an AST + LLM hybrid approach
- **Best Paper:** **Paper 6** (Parvathy & Thushara - AST-Based Neural Networks) + **Paper 1** (Lee & Joe - LLM)
- **Reasoning:** Since this is a hybrid approach, ideally cite both: Paper 6 for AST component and Paper 1 for LLM component. However, if only one citation is allowed, use **Paper 6** as it discusses AST-based semantic analysis, which is the structural component of the hybrid.

**[19]** - "LLM evaluation" (assess effort level through LLM evaluation)
- **Context:** Assess the effort level through LLM evaluation
- **Best Paper:** **Paper 1** (Lee & Joe - GPT-Based Code Review)
- **Reasoning:** This paper uses GPT-4o for code evaluation, including effort assessment through LLM analysis

**[20]** - "via LLM" (generate comprehensive feedback via LLM)
- **Context:** Generate comprehensive feedback via LLM
- **Best Paper:** **Paper 1** (Lee & Joe - GPT-Based Code Review with Feedback)
- **Reasoning:** This paper specifically focuses on LLM-generated feedback for programming education

**[21]** - "Ollama)" (multiple LLM providers: OpenAI, Anthropic, Ollama)
- **Context:** Unified interface pattern for multiple LLM providers
- **Best Paper:** **Paper 1** (Lee & Joe - GPT-Based) or **Paper 13** (Nam et al. - GILT with GPT-3.5-turbo)
- **Reasoning:** Both papers use LLM providers. Paper 1 uses GPT-4o, Paper 13 uses GPT-3.5-turbo. **Paper 1** is preferred as it's more recent and comprehensive.

**[22]** - "scores" (prompt templates refined to generate educational feedback)
- **Context:** Prompt templates were refined through iterative testing to generate educational feedback rather than just scores
- **Best Paper:** **Paper 2** (Huynh et al. - Detecting Code Vulnerabilities using LLMs with Prompt Engineering)
- **Reasoning:** This paper specifically discusses prompt engineering approaches for LLM-based code analysis

**[23]** - "execution" (Judge0 Cloud API and local Python execution)
- **Context:** Code execution using external services (Judge0 Cloud API) and local Python execution
- **Best Paper:** **Paper 17** (Varga & Fekete - Web-based Automatic C Code Assessment)
- **Reasoning:** This paper discusses web-based platforms for automatic code assessment, which relates to execution platforms like Judge0

---

## Summary of Recommended Mappings

| Citation | Context | Recommended Paper | Paper Title |
|----------|---------|-------------------|-------------|
| [1] | ML training limitations | **4** | Zhang & Saber - ML Code Similarity Review |
| [2] | LLM semantic evaluation | **1** | Lee & Joe - GPT Code Review |
| [3] | Test case execution | **18** | Liu et al. - AUTOGRADER |
| [4] | Manual evaluation errors | **15** | Weiss et al. - Grading Patterns |
| [5] | Limited feedback | **1** | Lee & Joe - GPT Code Review |
| [6] | MOSS/JPlag methods | **7** | Brach et al. - LLM vs JPlag |
| [7] | String/token limitations | **5** | Bhavana et al. - String Matching |
| [8] | AST tree structures | **6** | Parvathy & Thushara - AST Neural Networks |
| [9] | AST semantic limitations | **14** | Zhao et al. - RNN with AST Attention |
| [10] | PDG graphs | **12** | Mengyan Zhao - Symbolic Execution |
| [11] | PDG complexity | **20** | Wei et al. - Parallel Symbolic Execution |
| [12] | ML embedding methods | **4** | Zhang & Saber - ML Review |
| [13] | ML generalization issues | **4** | Zhang & Saber - ML Review |
| [14] | Grading platforms | **17** | Varga & Fekete - Automatic Assessment |
| [15] | Multi-component scoring | **16** | Inturi & Swamydas - Control Statement Grading |
| [16] | AI feedback | **1** | Lee & Joe - GPT Code Review |
| [17] | Literature review | **4** | Zhang & Saber - Systematic Review |
| [18] | AST + LLM hybrid | **6** | Parvathy & Thushara - AST Neural Networks |
| [19] | LLM effort evaluation | **1** | Lee & Joe - GPT Code Review |
| [20] | LLM feedback generation | **1** | Lee & Joe - GPT Code Review |
| [21] | Multiple LLM providers | **1** | Lee & Joe - GPT Code Review |
| [22] | Prompt engineering | **2** | Huynh et al. - Prompt Engineering |
| [23] | Code execution platforms | **17** | Varga & Fekete - Web-based Assessment |

## Notes

- **Paper 1** (Lee & Joe) appears 6 times - this is appropriate as it's highly relevant to LLM-based evaluation and feedback
- **Paper 4** (Zhang & Saber) appears 4 times - appropriate as it's a comprehensive review covering multiple ML methods
- **Paper 17** (Varga & Fekete) appears 2 times - both relate to execution/grading platforms
- Some papers (like PDG) don't have direct matches, so related papers (symbolic execution) are suggested
- If multiple citations are allowed for [18], cite both Paper 6 (AST) and Paper 1 (LLM)





