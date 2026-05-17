# ABSTRACT

LabSense is an AI-powered online coding lab examination system addressing critical challenges in Computer Science education where students resort to memorizing or copying code since traditional evaluation systems focus solely on final output, failing to assess logic, effort, and error tolerance. The system overcomes limitations of existing methods that are easily fooled by code variations, miss semantic similarity checks, or require extensive training [4]. LabSense employs a Large Language Model (LLM) to evaluate code logic and semantics [1], implementing a multi-component scoring system that assesses code quality, logic similarity using semantic analysis, and test case performance, awarding marks fairly even with different coding styles while providing comprehensive AI-generated feedback. The platform features intelligent question allocation with visualized lab layout mapping by assigning unique questions to neighbouring systems, real-time tab monitoring, full screen enforcement, and comprehensive anti-cheat mechanisms, supporting multiple programming languages. It also implements a multi-tenant architecture for scalable institutional deployment. In short, LabSense aims to promote genuine learning and logical understanding in coding lab examinations.

Keywords: AI, evaluation, LLM, assessment, programming, visualized, feedback, multi-tenant

## 1. Introduction

Programming forms the core of Computer Science education and is assessed through lab practicals meant to test logic and problem-solving skills. However, many students resort to memorizing or copying code to pass exams, as even minor execution errors can lead to failure. This undermines genuine learning and logical understanding, creating a need for a smart, AI-integrated evaluation system that evaluates logic, effort, and error tolerance beyond just final output.

LabSense is an AI-powered online coding lab examination system designed to address these challenges. The platform enables faculty to conduct coding exams with automated evaluation, real-time anti-cheat monitoring, and comprehensive AI-generated feedback. Students receive detailed insights into their code quality, logic, and test case performance in a secure, monitored environment. By leveraging Large Language Models (LLMs) and automated test case execution [18], LabSense provides consistent, fair, and educational feedback that goes beyond mere output verification, evaluating the underlying logic and problem-solving approach while significantly reducing faculty workload.

### 1.1 Problem Definition

Traditional coding lab examinations face several critical challenges that undermine genuine learning. Student behavior issues arise when students resort to memorizing or copying code to pass exams, as even minor execution errors can lead to failure in traditional evaluation systems. This approach prioritizes passing over understanding, undermining the development of logical thinking and problem-solving skills that are essential in Computer Science education.

Manual evaluation is time-consuming for large classes, subjective across evaluators, prone to human error [15], and difficult to scale across multiple sections. Limited feedback quality leaves students with minimal guidance, typically only pass/fail scores without explanations on code quality, algorithm choice, or areas for improvement [1], missing valuable learning opportunities. Traditional systems focus solely on final output, failing to evaluate logic, effort, and error tolerance, which are crucial aspects of programming competency.

Academic integrity concerns are acute in online exams, with students able to copy code from external sources, switch tabs to access solutions, and collaborate without real-time monitoring. Multi-language support requires separate execution environments and language-specific evaluation logic, making unified systems difficult. Scalability issues affect institutions needing to support multiple colleges and departments with data isolation and cost-effective deployment. Deployment barriers including expensive infrastructure, complex setup, and technical expertise requirements prevent many institutions from adopting modern evaluation systems.

LabSense addresses these challenges through an integrated, AI-powered platform that automates evaluation, provides comprehensive feedback that evaluates logic and effort beyond just output, enforces academic integrity through unique question sets and tab monitoring, and supports multiple programming languages in a scalable, cost-effective manner.

### 1.2 Existing Systems

Several existing systems attempt to address coding exam evaluation and plagiarism detection, each with significant limitations that prevent comprehensive assessment.

String/Token Based Methods such as MOSS and JPlag compare code text or sequences of tokens including keywords and variables [7]. These methods are easily fooled by renaming variables or changing formatting [5], and cannot detect deeper meaning or different approaches to solving the same problem. They focus on surface-level similarity rather than semantic understanding.

Abstract Syntax Tree (AST) Based Methods like Deckard convert code into tree structures showing logic as structure including loops, conditions, and functions [6]. However, if two codes solve the same problem with different structures, these methods may incorrectly identify them as different. They can miss semantic similarity when the underlying logic is equivalent but expressed differently [14].

Program Dependency Graph (PDG) Based Methods build graphs showing data flow and control flow in programs [12]. These methods are very complex and slow to compute for large amounts of code [20], making them hard to use in real-time exam evaluation scenarios where immediate feedback is required.

Machine Learning Embedding Based Methods such as code2vec, code2seq, and Graph Neural Networks (GNNs) learn to represent code as vectors and compare them [4]. These methods require extensive training data and fine-tuning, and may not work well for unseen coding styles or new problem types that differ from the training dataset [4].

Automated code grading platforms like HackerRank, LeetCode, and CodeChef excel at test case execution but are designed for competitive programming rather than educational exams [17]. They lack AI-powered feedback, anti-cheat mechanisms, and multi-tenant support, while requiring expensive licensing. LMS plugins for Moodle and Blackboard offer basic code execution but lack intelligent evaluation, AI analysis, and effective anti-cheat features.

None of these systems provide integrated AI-powered evaluation with educational feedback that evaluates logic and semantics, comprehensive anti-cheat systems with unique question allocation and tab monitoring, multi-tenant architecture, cost-effective deployment options, or intelligent multi-language evaluation. LabSense is designed to fill these gaps and provide a complete solution for educational institutions.

![Existing Systems Overview](EXISTING_SYSTEMS_DIAGRAM.puml)

*Figure 1.1: Existing Systems Overview - The figure shown above gives an at-a-glance summary of all the existing systems mentioned earlier and their key drawbacks.*

### 1.3 Proposed System

LabSense is a comprehensive web-based platform that combines automated code evaluation, AI-powered analysis, and robust anti-cheat mechanisms to create an ideal solution for coding lab examinations.

**AI-Assisted Code Evaluation** forms the core of LabSense's assessment capabilities, evaluating logic and semantics rather than just syntax. The system employs a multi-component scoring approach evaluating code quality (20% effort score), logic similarity to ideal solutions using LLMs (40%), and test case performance (40%) [16]. Unlike traditional systems that focus solely on final output, LabSense evaluates the underlying logic, effort, and error tolerance, awarding marks fairly even with different coding styles. The system provides AI-powered feedback including overall assessment, strengths identification, improvement areas, and actionable suggestions [1]. A full marks rule awards 100% if all test cases pass while still providing detailed feedback on code quality and approach.

**Insightful Reports and Analytics** provide detailed analytics for both faculty and students. The system tracks performance metrics, identifies strengths and weak areas, and generates comprehensive reports that help faculty understand student progress and students understand their learning journey. These reports go beyond simple scores, offering insights into problem-solving approaches, code quality trends, and areas requiring additional focus.

**Lab Layout and Proctoring System** implements intelligent question allocation where unique questions are assigned to neighboring systems, preventing students from easily copying from adjacent workstations. Tab focus monitoring tracks when students switch browser tabs or windows, detecting potential attempts to access unauthorized resources. This comprehensive proctoring approach reduces the need for separate plagiarism checkers by preventing cheating at the source through strategic question distribution and real-time monitoring.

**Real-time Anti-Cheat System** ensures academic integrity through full screen monitoring with automatic re-entry, clipboard blocking for external content, tab visibility detection, a three-strike policy with warnings, and comprehensive session tracking.

**Multi-Language Support** enables evaluation across Python, JavaScript, Java, C, C++, and Go using Judge0 Cloud API. LLM-based evaluation works across all languages, ensuring consistent quality regardless of programming language.

**Multi-Tenant Architecture** provides college-level data isolation, hierarchical department and section management, role-based access control (Faculty, Student, Admin, Super Admin), and scalable design supporting multiple institutions securely.

**Comprehensive Exam Management** includes smart question assignment with adjacency-based distribution, layout-based assignment for lab configurations with system-to-question mapping, exam versioning and history tracking, server-side timer management with auto-submission, and per-question auto-save functionality.

**User Experience** features a modern React-based responsive interface, Monaco Editor with syntax highlighting and code completion, real-time test case feedback, mobile support, and accessibility features including keyboard navigation and screen reader support.

![Proposed System Overview](PROPOSED_SYSTEM_DIAGRAM.puml)

*Figure 1.2: Proposed System Overview - The figure shown below provides a quick overview of the proposed system.*

LabSense introduces key innovations including educational AI feedback focused on learning rather than just scoring, a comprehensive multi-layered anti-cheat system, cost-effective deployment with free tiers, language-agnostic LLM-based evaluation across all languages, and multi-tenant architecture designed from the ground up for secure institutional support.

---

## 3. Design Methodology

The development of LabSense follows a systematic design approach that integrates iterative development practices, modular architecture design, and user-centered principles to address the requirements of an AI-powered educational assessment platform.

The design philosophy of LabSense is grounded in three core principles: educational effectiveness, ensuring that the system addresses real problems in coding lab examinations and promotes genuine learning; practical feasibility, designing features that can be implemented efficiently; and extensibility, creating a foundation that can be enhanced with additional features.

### 3.1 System Architecture Design

The system architecture follows a modular client-server architecture with clear separation between frontend, backend API, and external services. The architecture is designed to be maintainable and extensible, allowing for future enhancements.

The overall system architecture is illustrated in Figure 3.1, which shows the three-tier architecture consisting of Presentation Layer, Application Layer, and Data Layer. The Presentation Layer contains user interfaces for different roles, each interacting with the API Server in the Application Layer. The Application Layer contains specialized modules for authentication, exam management, user management, code evaluation, and multi-tenancy control. The Data Layer manages persistent storage with separate data stores for users, exams, submissions, colleges, and sessions.

![System Architecture Diagram](SYSTEM_ARCHITECTURE_DIAGRAM.puml)

*Figure 3.1: Three-tier System Architecture - LabSense System Architecture showing Presentation, Application, and Data layers*

**Frontend Architecture** employs a component-based design pattern using React with TypeScript. The frontend is organized into reusable components, with separation between presentation components and container components managing state and API calls. The architecture follows React best practices including unidirectional data flow and component composition.

**Backend Architecture** follows a layered architecture with distinct layers for API routing, business logic, data access, and external service integration. The architecture supports multiple LLM providers (OpenAI, Anthropic, Ollama) through a unified interface, allowing flexibility in choosing LLM services based on availability and cost considerations.

**Evaluation Engine Design** implements a sequential pipeline architecture where code evaluation proceeds through stages: code validation, test case execution, LLM-based semantic analysis, score calculation, and feedback generation. Each stage is implemented as a separate module, allowing for independent development and testing.

**Data Architecture** employs a repository pattern that abstracts data access logic, currently using JSON file storage. The design allows future migration to database systems (PostgreSQL, MySQL, MongoDB) without major code changes. Multi-tenant data isolation is implemented at the repository level, ensuring data separation between different colleges and departments.

### 3.1.1 Data Model Design

The data model was designed using object-oriented principles, with classes representing key entities in the system. Figure 3.2 shows the Class Diagram illustrating the relationships between core entities: User, College, Department, Year, Section, Exam, ExamQuestion, Session, and Submission. The diagram shows how users are organized hierarchically within colleges, how exams contain multiple questions, how sessions track student exam attempts, and how submissions store evaluation results.

![Class Diagram](CLASS_DIAGRAM.puml)

*Figure 3.2: Class Diagram - UML class diagram showing data model and relationships*

### 3.1.2 Interaction Design

The interaction between system components during exam taking is illustrated in Figure 3.3, which shows a Sequence Diagram for the exam taking workflow. The diagram demonstrates the step-by-step interactions between Student, Frontend, Backend API, Database, and Judge0 API during login, exam start, code submission, and exam completion.

![Exam Taking Sequence Diagram](EXAM_TAKING_SEQUENCE.puml)

*Figure 3.3: Exam Taking Sequence - Sequence diagram showing interactions during exam taking*

### 3.2 Development Methodology

LabSense was developed using an iterative and incremental approach, following phases of requirements analysis, system design, implementation, testing, and documentation, with continuous refinement based on testing and feedback.

**Requirements Analysis Phase** involved identifying problems in existing coding lab examination systems through literature review of research papers on code evaluation, plagiarism detection methods (MOSS, JPlag, AST-based approaches), and automated grading platforms [4]. This phase included studying existing platforms like HackerRank and LeetCode to understand their limitations, and defining functional requirements based on gaps identified in current solutions.

To systematically capture functional requirements, a Use Case Diagram was developed to identify all actors (Student, Faculty, College Admin, Super Admin) and their interactions with the system. The use case diagram, shown in Figure 3.4, illustrates the core functionalities including exam taking, code submission, exam creation, question management, user management, and administrative functions.

**System Design Phase** employed a layered architecture approach with clear separation between frontend, backend API, business logic, and data access layers. The design utilized modular decomposition to break the system into manageable components that could be developed and tested independently. Key design decisions included RESTful API architecture for backend services, component-based React frontend, and a flexible evaluation engine design that supports multiple LLM providers through a unified interface.

**Implementation Phase** followed a feature-driven approach, prioritizing core functionality first. Development started with basic authentication and exam management, followed by code execution and evaluation features. Advanced features such as AI-powered feedback, anti-cheat mechanisms, and multi-tenant support were added incrementally. Testing was performed iteratively during development, with focus on ensuring core workflows function correctly.

**Testing and Validation Phase** involved testing of key functionalities including user authentication, exam creation and taking, code submission, evaluation, and result viewing. Testing was performed iteratively during development, with emphasis on manual testing of critical user workflows and edge cases.

![Use Case Diagram](USE_CASE_DIAGRAM.puml)

*Figure 3.4: Use Case Diagram - Illustrates all actors and their interactions with the system*

### 3.3 Evaluation System Design

The evaluation system design implements a multi-component scoring approach that combines automated test case execution, AI-powered semantic analysis using LLMs, and code quality assessment.

The code evaluation process is illustrated in Figure 3.5, which shows an Activity Flowchart detailing the step-by-step evaluation workflow. The flowchart begins with student code submission, followed by the execution of test cases via either the Judge0 API or local execution. A decision point then determines if the execution was successful. If not, the system logs an execution error and prepares an error response. If successful, the system proceeds to calculate a correctness score from test case results, analyze logic similarity using an AST + LLM hybrid approach [6], assess the effort level through LLM evaluation [1], generate comprehensive feedback via LLM [1], and finally calculate a weighted final score (20% effort + 40% logic + 40% test cases) before preparing a success response. Both successful and unsuccessful paths then converge to store submission results, update the session, and return results to the student, allowing for code correction if needed. This entire process facilitates real-time evaluation with immediate feedback, leveraging a multi-metric scoring system.

**Scoring Component Design** implements a weighted scoring model where effort assessment (20%), logic similarity (40%), and test case performance (40%) are combined. Each component is implemented as a separate module, allowing for experimentation with different weights and easy addition of new scoring components. The design includes the full marks rule (100% if all test cases pass) to ensure correct solutions are properly recognized.

**LLM Integration Design** employs a unified interface pattern that allows the system to work with multiple LLM providers (OpenAI, Anthropic, Ollama) through a common API [1]. Prompt templates were refined through iterative testing to generate educational feedback rather than just scores [2]. The design includes basic error handling and fallback mechanisms for LLM service unavailability.

**Test Case Execution Design** implements code execution using external services (Judge0 Cloud API) and local Python execution [17]. The design uses Judge0 for multi-language support. Basic timeout management and output handling are implemented.

![Code Evaluation Flowchart](CODE_EVALUATION_FLOWCHART.puml)

*Figure 3.5: Code Evaluation Activity Diagram - Flowchart showing the code evaluation process*

### 3.4 Anti-Cheat System Design

The anti-cheat system design implements multiple prevention mechanisms to discourage academic dishonesty during exams.

**Client-Side Monitoring Design** implements browser-based monitoring using JavaScript event listeners to track fullscreen state changes, tab visibility changes, and clipboard access. The design employs a strike-based warning system that alerts students when violations are detected, providing progressive warnings before taking action. The implementation uses standard browser APIs (Fullscreen API, Page Visibility API) with basic error handling to ensure monitoring failures don't prevent exam completion.

**Question Allocation Design** implements adjacency-based assignment algorithms that ensure neighboring workstations receive different questions. The design includes a lab layout creator tool that allows faculty to visualize and configure physical lab arrangements, with algorithms that assign different questions to adjacent systems.

**Session Management Design** implements tracking of exam sessions including start times, submission times, and basic interaction logs. The design stores violation records for review by faculty.

### 3.5 User Interface Design

The user interface design follows Material-UI design principles using the Material-UI component library, which provides consistent, accessible components. The design emphasizes usability and clarity.

**Faculty Interface Design** focuses on providing functional workflows for exam creation, question management, and result viewing. The design includes dashboard views that display key information such as exam lists, student submissions, and evaluation results.

**Student Interface Design** prioritizes clarity and focus during exam taking, with a clean interface that minimizes distractions. The design includes a code editor (Monaco Editor) with syntax highlighting, real-time test case feedback, and clear indicators of exam status and remaining time.

**Responsive Design** ensures basic functionality works across different screen sizes, with the interface adapting to desktop and tablet displays using Material-UI's responsive grid system.

### 3.6 Security Design

The security design implements essential security measures focusing on authentication, authorization, and data protection. Security considerations were integrated during development.

**Authentication Design** implements JWT-based authentication using FastAPI's security utilities, providing token-based access control. The design includes token expiration mechanisms and secure password hashing using bcrypt. The implementation follows FastAPI security best practices, with protection against common vulnerabilities (XSS, CSRF) through framework features and careful input handling.

**Authorization Design** implements role-based access control (RBAC) with role-based permissions (Student, Faculty, Admin, Super Admin) and multi-tenant data isolation. The design ensures users can only access resources within their authorized scope, with tenant filtering implemented at the data access layer.

**Data Protection Design** implements secure password hashing using bcrypt, input validation to prevent injection attacks, and basic data protection measures. The design uses parameterized data access patterns to prevent injection vulnerabilities.

