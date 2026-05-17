# Research Papers Categorized by Methodology/Model/Commonality

## Rationale for Categorization

The comprehensive review of 23 research papers spanning the domain of automated code evaluation, analysis, and assessment systems necessitated a systematic categorization approach to facilitate meaningful analysis and comparison. The papers have been organized into three distinct categories based on their primary methodological foundations, technological approaches, and research objectives.

This categorization serves several critical purposes: (1) **Methodological Clarity**: It enables the identification and comparison of different technical approaches employed in code evaluation systems, allowing researchers to understand the evolution and diversity of methods in the field. (2) **Research Gap Identification**: By grouping papers with similar methodologies, gaps in existing research become more apparent, highlighting areas that require further investigation or where novel approaches might be beneficial. (3) **Systematic Analysis**: The categorization provides a structured framework for analyzing trends, evaluating the effectiveness of different approaches, and understanding the relationships between various research contributions. (4) **Comparative Evaluation**: It facilitates comparative analysis of papers within the same category, enabling assessment of relative strengths, limitations, and contributions of each approach. (5) **Literature Organization**: The structured organization aids in synthesizing findings from multiple studies, identifying common themes, and understanding the broader landscape of research in automated code evaluation and assessment.

Each paper has been assigned to a single category based on its primary research focus and dominant methodology, ensuring that each contribution is evaluated within its most relevant context while maintaining clarity and avoiding redundancy in the literature review.

---

## 1. AI/ML-Based Code Analysis and Generation

**Description:** This category comprises research contributions that employ artificial intelligence and machine learning methodologies, with particular emphasis on Large Language Models (LLMs), Transformer architectures, and deep learning neural networks. The papers within this classification investigate automated code review mechanisms, intelligent code generation systems, vulnerability detection frameworks, code comment summarization techniques, and enhanced code comprehension through AI-driven analytical approaches.

**Focus:** Large Language Models, Transformers, Deep Learning, and AI-driven approaches for code review, understanding, generation, and analysis

1. **Dong-Kyu Lee, Inwhee Joe** - A GPT-Based Code Review System With Accurate Feedback for Programming Education (2025)
   - GPT-4o-based system with CRM and CCM
   - Error detection and supportive feedback

2. **Larry Huynh, et al.** - Detecting Code Vulnerabilities using LLMs (2025)
   - LLM framework for C/C++ vulnerability detection
   - Prompt engineering approach

3. **Peeradon Sukkasem, et al.** - LLM-Based Code Comment Summarization: Efficacy Evaluation and Challenges (2025)
   - BART, T5, Flan-T5 for comment summarization

8. **Rosalia Tufano, et al.** - Code Review Automation: Strengths and Weaknesses of the State of the Art (2024)
   - Deep learning for code-to-comment & comment-to-code

9. **Vadim Moshkin, et al.** - Development of an Algorithm for Automatic Code Review Using Transformer Architecture (2024)
   - Transformer-based NLP for code review

10. **Danil Shaikhelislamov, et al.** - LLM-based Interactive Code Generation: Empirical Evaluation (2024)
    - CodePatchLLM with static analyzer feedback loop

11. **Sarah Fakhoury, et al.** - LLM-Based Test-Driven Interactive Code Generation (2024)
    - TICODER: test-driven iterative refinement

13. **Daye Nam, et al.** - Using an LLM to Help With Code Understanding (2024)
    - GILT tool with GPT-3.5-turbo for code explanation

19. **Rosalia Tufano** - Automating Code Review (2023)
    - Transformer models for review comment generation

---

## 2. Automated Grading and Assessment Systems

**Description:** This category encompasses research studies dedicated to the development and implementation of automated evaluation systems for programming assignments and assessments. The methodologies presented within this classification utilize static code analysis techniques, formal semantic verification, symbolic execution approaches, grey-box testing strategies, and control flow analysis mechanisms to systematically evaluate code quality, functional correctness, and compliance with specified requirements, thereby eliminating the necessity for manual evaluation processes.

**Focus:** Automatic evaluation of programming assignments using various techniques (static analysis, formal semantics, testing, etc.)

15. **Gary M. Weiss, et al.** - An Analysis of Grading Patterns in Undergraduate Courses (2023)
   - Longitudinal grading fairness study

16. **Srujana Inturi, M. Swamydas** - Programming Assignment Grading through Control Statement Features (2023)
   - Static analysis of control statements in C programs

17. **Erika Baksáné Varga, Antal K. Fekete** - Applications for Automatic C Code Assessment (2023)
   - Web-based platform with GitHub Classroom

18. **Xiao Liu, et al.** - Automatic Grading of Programming Assignments with Formal Semantics (2023)
   - AUTOGRADER: weakest precondition and symbolic execution

21. **Ján Skalka, Martin Drlík** - Development of Automatic Source Code Evaluation Tests Using Grey-Box (2023)
   - Grey-box: static + random testing

23. **Susilo Veri Yulianto, Inggriani Liem** - Automatic Grader for Programming Assignment Using Source Code Analyzer (2014)
   - SCAGrader: static analysis + XSLT for Java

---

## 3. Code Analysis, Similarity, and Plagiarism Detection

**Description:** This category encompasses research contributions that address code analysis methodologies utilizing Abstract Syntax Tree (AST) representations, symbolic execution techniques, and computational approaches for measuring code similarity metrics. The classification further incorporates research on plagiarism detection in source code through machine learning algorithms, string matching techniques, and semantic analysis methods designed to identify duplicated or substantially similar code segments across diverse implementations and codebases.

**Focus:** AST-based analysis, symbolic execution, code similarity measurement, and plagiarism detection methods

4. **Zixian Zhang, Takfarinas Saber** - Machine Learning Approaches to Code Similarity Measurement: A Systematic Review (2025)
   - Systematic review of ML methods (84 studies, 51 algorithms)
   - BigCloneBench dataset

5. **Munugapati Bhavana, et al.** - Plagiarism Detection and Similarity Checking Program using ML and String Matching (2024)
   - ML + string algorithms (KMP, Levenshtein distance)
   - Direct plagiarism detection

6. **Parvathy R, MG Thushara** - AST-Based and Token-Based Neural Networks for Source Code Classification (2024)
   - AST vs token-based RNN classifiers
   - Semantic capture through AST

7. **William Brach, et al.** - Can Large Language Model Detect Plagiarism in Source Code? (2024)
   - GPT-4o, LLaMA, CodeLlama for plagiarism detection
   - Semantic plagiarism detection
   - Comparison with JPlag

12. **Mengyan Zhao, et al.** - Static Code Analysis of IEC 61131-3 ST Programs via Symbolic Execution (2024)
   - Symbolic execution + pattern matching for PLC defects

14. **Lei Zhao, et al.** - A Novel Code Classification based on RNN and Multi-Head Attention (2023)
   - BiRNN + multi-head attention with AST features
   - Semantic and structural learning

20. **Guannan Wei, et al.** - Compiling Parallel Symbolic Execution with Continuations (2023)
   - GENSYM: CPS-based parallel symbolic execution
   - Performance optimization

22. **Kesu Wang, et al.** - Unified AST Representation Learning for Cross-Language Classification (2022)
   - UAST + BiLSTM + GCN
   - Cross-language program classification

---

## Summary Statistics

- **AI/ML-Based Approaches:** 9 papers (Papers 1, 2, 3, 8, 9, 10, 11, 13, 19)
- **Automated Grading Systems:** 6 papers (Papers 15, 16, 17, 18, 21, 23)
- **Code Analysis & Similarity Detection:** 8 papers (Papers 4, 5, 6, 7, 12, 14, 20, 22)

**Total:** 23 papers (Each paper number appears only once, assigned to its primary focus area)
