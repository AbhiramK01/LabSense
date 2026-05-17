# LabSense - Project Documentation

## 1. Introduction

Programming forms the core of Computer Science education and is assessed through lab practicals meant to test logic and problem-solving skills. However, many students resort to memorizing or copying code to pass exams, as even minor execution errors can lead to failure. This undermines genuine learning and logical understanding, creating a need for a smart, AI-integrated evaluation system that evaluates logic, effort, and error tolerance beyond just final output.

LabSense is an AI-powered online coding lab examination system designed to address these challenges. The platform enables faculty to conduct coding exams with automated evaluation, real-time anti-cheat monitoring, and comprehensive AI-generated feedback. Students receive detailed insights into their code quality, logic, and test case performance in a secure, monitored environment. By leveraging Large Language Models (LLMs) and automated test case execution, LabSense provides consistent, fair, and educational feedback that goes beyond mere output verification, evaluating the underlying logic and problem-solving approach while significantly reducing faculty workload.

### 1.1 Problem Definition

Traditional coding lab examinations face several critical challenges that undermine genuine learning. **Student behavior issues** arise when students resort to memorizing or copying code to pass exams, as even minor execution errors can lead to failure in traditional evaluation systems. This approach prioritizes passing over understanding, undermining the development of logical thinking and problem-solving skills that are essential in Computer Science education.

**Manual evaluation** is time-consuming for large classes, subjective across evaluators, prone to human error, and difficult to scale across multiple sections. **Limited feedback quality** leaves students with minimal guidance, typically only pass/fail scores without explanations on code quality, algorithm choice, or areas for improvement, missing valuable learning opportunities. Traditional systems focus solely on final output, failing to evaluate logic, effort, and error tolerance, which are crucial aspects of programming competency.

**Academic integrity concerns** are acute in online exams, with students able to copy code from external sources, switch tabs to access solutions, and collaborate without real-time monitoring. **Multi-language support** requires separate execution environments and language-specific evaluation logic, making unified systems difficult. **Scalability issues** affect institutions needing to support multiple colleges and departments with data isolation and cost-effective deployment. **Deployment barriers** including expensive infrastructure, complex setup, and technical expertise requirements prevent many institutions from adopting modern evaluation systems.

LabSense addresses these challenges through an integrated, AI-powered platform that automates evaluation, provides comprehensive feedback that evaluates logic and effort beyond just output, enforces academic integrity through unique question sets and tab monitoring, and supports multiple programming languages in a scalable, cost-effective manner.

### 1.2 Existing Systems

Several existing systems attempt to address coding exam evaluation and plagiarism detection, each with significant limitations that prevent comprehensive assessment.

**String/Token Based Methods** such as MOSS and JPlag compare code text or sequences of tokens including keywords and variables. These methods are easily fooled by renaming variables or changing formatting, and cannot detect deeper meaning or different approaches to solving the same problem. They focus on surface-level similarity rather than semantic understanding.

**Abstract Syntax Tree (AST) Based Methods** like Deckard convert code into tree structures showing logic as structure including loops, conditions, and functions. However, if two codes solve the same problem with different structures, these methods may incorrectly identify them as different. They can miss semantic similarity when the underlying logic is equivalent but expressed differently.

**Program Dependency Graph (PDG) Based Methods** build graphs showing data flow and control flow in programs. These methods are very complex and slow to compute for large amounts of code, making them hard to use in real-time exam evaluation scenarios where immediate feedback is required.

**Machine Learning Embedding Based Methods** such as code2vec, code2seq, and Graph Neural Networks (GNNs) learn to represent code as vectors and compare them. These methods require extensive training data and fine-tuning, and may not work well for unseen coding styles or new problem types that differ from the training dataset.

**Automated code grading platforms** like HackerRank, LeetCode, and CodeChef excel at test case execution but are designed for competitive programming rather than educational exams. They lack AI-powered feedback, anti-cheat mechanisms, and multi-tenant support, while requiring expensive licensing. **LMS plugins** for Moodle and Blackboard offer basic code execution but lack intelligent evaluation, AI analysis, and effective anti-cheat features.

None of these systems provide integrated AI-powered evaluation with educational feedback that evaluates logic and semantics, comprehensive anti-cheat systems with unique question allocation and tab monitoring, multi-tenant architecture, cost-effective deployment options, or intelligent multi-language evaluation. LabSense is designed to fill these gaps and provide a complete solution for educational institutions.

### 1.3 Proposed System

LabSense is a comprehensive web-based platform that combines automated code evaluation, AI-powered analysis, and robust anti-cheat mechanisms to create an ideal solution for coding lab examinations.

#### 1.3.1 Core Features

**AI-Assisted Code Evaluation** forms the core of LabSense's assessment capabilities, evaluating logic and semantics rather than just syntax. The system employs a multi-component scoring approach evaluating code quality (20% effort score), logic similarity to ideal solutions using LLMs (40%), and test case performance (40%). Unlike traditional systems that focus solely on final output, LabSense evaluates the underlying logic, effort, and error tolerance, awarding marks fairly even with different coding styles. The system provides AI-powered feedback including overall assessment, strengths identification, improvement areas, and actionable suggestions. A full marks rule awards 100% if all test cases pass while still providing detailed feedback on code quality and approach.

**Insightful Reports and Analytics** provide detailed analytics for both faculty and students. The system tracks performance metrics, identifies strengths and weak areas, and generates comprehensive reports that help faculty understand student progress and students understand their learning journey. These reports go beyond simple scores, offering insights into problem-solving approaches, code quality trends, and areas requiring additional focus.

**Lab Layout and Proctoring System** implements intelligent question allocation where unique questions are assigned to neighboring systems, preventing students from easily copying from adjacent workstations. Tab focus monitoring tracks when students switch browser tabs or windows, detecting potential attempts to access unauthorized resources. This comprehensive proctoring approach reduces the need for separate plagiarism checkers by preventing cheating at the source through strategic question distribution and real-time monitoring.

**Real-time Anti-Cheat System** ensures academic integrity through fullscreen monitoring with automatic re-entry, clipboard blocking for external content, tab visibility detection, a three-strike policy with warnings, and comprehensive session tracking.

**Multi-Language Support** enables evaluation across Python, JavaScript, Java, C, C++, and Go using Judge0 Cloud API with local Python fallback. LLM-based evaluation works across all languages, ensuring consistent quality regardless of programming language.

**Multi-Tenant Architecture** provides college-level data isolation, hierarchical department and section management, role-based access control (Faculty, Student, Admin, Super Admin), and scalable design supporting multiple institutions securely.

**Comprehensive Exam Management** includes intelligent question assignment algorithms with adjacency-based distribution, layout-based assignment for lab configurations with system-to-question mapping, exam versioning and history tracking, server-side timer management with auto-submission, and per-question auto-save functionality.

**User Experience** features a modern React-based responsive interface, Monaco Editor with syntax highlighting and code completion, real-time test case feedback, mobile support, and accessibility features including keyboard navigation and screen reader support.

#### 1.3.2 System Architecture

**Frontend (React + TypeScript)** provides a modern, responsive interface with real-time updates, secure authentication, and client-side anti-cheat enforcement. **Backend (FastAPI + Python)** implements a RESTful API supporting asynchronous code evaluation, multiple LLM providers (OpenAI, Anthropic, Ollama), and JSON-based storage easily migratable to databases. **Evaluation Engine** operates as a multi-threaded system executing code, performing LLM-powered semantic analysis, and generating formatted feedback concurrently. **Deployment Options** include Cloudflare Tunnel for free deployment, VM deployment with Docker Compose for production, and hybrid approaches combining CDN frontend with tunnel backend.

#### 1.3.3 Key Innovations

LabSense introduces key innovations including educational AI feedback focused on learning rather than just scoring, a comprehensive multi-layered anti-cheat system, cost-effective deployment with free tiers, language-agnostic LLM-based evaluation across all languages, and multi-tenant architecture designed from the ground up for secure institutional support.

### 1.4 Technical Specifications

#### 1.4.1 Hardware Requirements

**Minimum Requirements (Development/Testing)** include a dual-core CPU (2.0 GHz+), 4 GB RAM (8 GB recommended), 2 GB disk space, internet connection for API services, and 1024x768 display minimum. **Recommended Requirements (Production)** specify a quad-core CPU (2.5 GHz+), 8 GB RAM (16 GB for local LLM), 10 GB SSD storage, 10 Mbps broadband connection, and 1920x1080 display. **Server Requirements (VM Deployment)** include 2-4 vCPUs, 4-8 GB RAM, 20 GB SSD, public IP with ports 80/443 open, and Ubuntu 22.04 LTS. **Optional Local LLM Hosting** requires 8+ CPU cores, 16+ GB RAM (32 GB for larger models), optional NVIDIA GPU with 8+ GB VRAM, and 50+ GB storage. **Mobile Device Support** includes iOS 13.0+, Android 8.0+, modern browsers, and 7-inch+ tablets recommended.

#### 1.4.2 Software Requirements

**Development Environment** backend requires Python 3.9+ (3.11+ recommended), pip, venv, Uvicorn 0.30.6+, and key dependencies including FastAPI 0.115.0, Pydantic 2.9.2, python-jose[cryptography] 3.3.0, passlib[bcrypt] 1.7.4, requests 2.32.3, aiohttp 3.10.0, and asttokens 2.4.1. Frontend requires Node.js 18.0+ (20.0+ recommended), npm, Vite 5.4.8+, and dependencies including React 18.3.1, TypeScript 5.6.2, Material-UI 6.1.7, Monaco Editor 4.6.0, and React Router 6.26.2.

**Optional Services** include LLM integration via OpenAI API, Anthropic API, or Ollama (0.1.0+ with models like llama3.1:8b requiring 8GB+ RAM). Code execution can use Judge0 Cloud API via RapidAPI or built-in local Python execution. **Production Deployment** requires Docker 20.10+ and Docker Compose 2.0+, with optional Nginx 1.18+ and Certbot for SSL. **Operating Systems** support macOS 10.15+, Windows 10/11, Linux (Ubuntu 20.04+, Debian 11+, Fedora 34+), with Ubuntu 22.04 LTS recommended for production. **Browser Support** includes Chrome/Edge 90+, Firefox 88+, Safari 14+, and mobile browsers. **Database** currently uses JSON storage but can migrate to PostgreSQL 12+, MySQL 8.0+, or MongoDB 5.0+. **Version Control** requires Git 2.30+. **Development Tools** include VS Code, PyCharm, Postman, and code quality tools like Black, ESLint, and Prettier.

---

## 2. Design Methodology

The development of LabSense follows a systematic design approach that integrates iterative development practices, modular architecture design, and user-centered principles to address the requirements of an AI-powered educational assessment platform.

### 2.1 Overall Design Philosophy

The design philosophy for LabSense prioritizes **practical implementation** and **educational value**. The approach emphasizes modularity and maintainability to facilitate development and future enhancements. The design integrates software engineering principles including separation of concerns, component-based architecture, and iterative development.

The design philosophy is grounded in three core principles: **educational effectiveness**, ensuring that the system addresses real problems in coding lab examinations and promotes genuine learning; **practical feasibility**, designing features that can be implemented efficiently; and **extensibility**, creating a foundation that can be enhanced with additional features.

### 2.2 System Architecture Design

The system architecture follows a **modular client-server architecture** with clear separation between frontend, backend API, and external services. The architecture is designed to be maintainable and extensible, allowing for future enhancements.

The overall system architecture is illustrated in Figure 2.1, which shows the three-tier architecture consisting of Presentation Layer, Application Layer, and Data Layer. The Presentation Layer contains user interfaces for different roles, each interacting with the API Server in the Application Layer. The Application Layer contains specialized modules for authentication, exam management, user management, code evaluation, and multi-tenancy control. The Data Layer manages persistent storage with separate data stores for users, exams, submissions, colleges, and sessions.

![System Architecture Diagram](SYSTEM_ARCHITECTURE_DIAGRAM.puml)

*Figure 2.1: LabSense System Architecture - Three-tier architecture showing Presentation, Application, and Data layers*

**Frontend Architecture** employs a **component-based design pattern** using React with TypeScript. The frontend is organized into reusable components, with separation between presentation components and container components managing state and API calls. The architecture follows React best practices including unidirectional data flow and component composition.

**Backend Architecture** follows a **layered architecture** with distinct layers for API routing, business logic, data access, and external service integration. The architecture supports multiple LLM providers (OpenAI, Anthropic, Ollama) through a unified interface, allowing flexibility in choosing LLM services based on availability and cost considerations.

**Evaluation Engine Design** implements a **sequential pipeline architecture** where code evaluation proceeds through stages: code validation, test case execution, LLM-based semantic analysis, score calculation, and feedback generation. Each stage is implemented as a separate module, allowing for independent development and testing.

**Data Architecture** employs a **repository pattern** that abstracts data access logic, currently using JSON file storage. The design allows future migration to database systems (PostgreSQL, MySQL, MongoDB) without major code changes. Multi-tenant data isolation is implemented at the repository level, ensuring data separation between different colleges and departments.

#### 2.2.1 Data Model Design

The data model was designed using object-oriented principles, with classes representing key entities in the system. Figure 2.2 shows the **Class Diagram** illustrating the relationships between core entities: User, College, Department, Year, Section, Exam, ExamQuestion, Session, and Submission. The diagram shows how users are organized hierarchically within colleges, how exams contain multiple questions, how sessions track student exam attempts, and how submissions store evaluation results.

![Class Diagram](CLASS_DIAGRAM.puml)

*Figure 2.2: LabSense Class Diagram - UML class diagram showing data model and relationships*

#### 2.2.2 Interaction Design

The interaction between system components during exam taking is illustrated in Figure 2.3, which shows a **Sequence Diagram** for the exam taking workflow. The diagram demonstrates the step-by-step interactions between Student, Frontend, Backend API, Database, and Judge0 API during login, exam start, code submission, and exam completion.

![Exam Taking Sequence Diagram](EXAM_TAKING_SEQUENCE.puml)

*Figure 2.3: LabSense Exam Taking Sequence - Sequence diagram showing interactions during exam taking*

### 2.3 Development Methodology

LabSense was developed using an **iterative and incremental approach**, following phases of requirements analysis, system design, implementation, testing, and documentation, with continuous refinement based on testing and feedback.

**Requirements Analysis Phase** involved identifying problems in existing coding lab examination systems through literature review of research papers on code evaluation, plagiarism detection methods (MOSS, JPlag, AST-based approaches), and automated grading platforms. This phase included studying existing platforms like HackerRank and LeetCode to understand their limitations, and defining functional requirements based on gaps identified in current solutions.

To systematically capture functional requirements, a **Use Case Diagram** was developed to identify all actors (Student, Faculty, College Admin, Super Admin) and their interactions with the system. The use case diagram, shown in Figure 2.4, illustrates the core functionalities including exam taking, code submission, exam creation, question management, user management, and administrative functions.

![Use Case Diagram](USE_CASE_DIAGRAM.puml)

*Figure 2.4: LabSense Use Case Diagram - Illustrates all actors and their interactions with the system*

**System Design Phase** employed a **layered architecture approach** with clear separation between frontend, backend API, business logic, and data access layers. The design utilized modular decomposition to break the system into manageable components that could be developed and tested independently. Key design decisions included RESTful API architecture for backend services, component-based React frontend, and a flexible evaluation engine design that supports multiple LLM providers through a unified interface.

**Implementation Phase** followed a **feature-driven approach**, prioritizing core functionality first. Development started with basic authentication and exam management, followed by code execution and evaluation features. Advanced features such as AI-powered feedback, anti-cheat mechanisms, and multi-tenant support were added incrementally. Testing was performed iteratively during development, with focus on ensuring core workflows function correctly.

**Testing and Validation Phase** involved testing of key functionalities including user authentication, exam creation and taking, code submission, evaluation, and result viewing. Testing was performed iteratively during development, with emphasis on manual testing of critical user workflows and edge cases.

### 2.4 Evaluation System Design

The evaluation system design implements a **multi-component scoring approach** that combines automated test case execution, AI-powered semantic analysis using LLMs, and code quality assessment.

The code evaluation process is illustrated in Figure 2.5, which shows an **Activity Flowchart** detailing the step-by-step evaluation workflow. The flowchart begins with student code submission, followed by the execution of test cases via either the Judge0 API or local execution. A decision point then determines if the execution was successful. If not, the system logs an execution error and prepares an error response. If successful, the system proceeds to calculate a correctness score from test case results, analyze logic similarity using an AST + LLM hybrid approach, assess the effort level through LLM evaluation, generate comprehensive feedback via LLM, and finally calculate a weighted final score (20% effort + 40% logic + 40% test cases) before preparing a success response. Both successful and unsuccessful paths then converge to store submission results, update the session, and return results to the student, allowing for code correction if needed. This entire process facilitates real-time evaluation with immediate feedback, leveraging a multi-metric scoring system.

![Code Evaluation Flowchart](CODE_EVALUATION_FLOWCHART.puml)

*Figure 2.5: LabSense Code Evaluation Activity - Flowchart showing the code evaluation process*

**Scoring Component Design** implements a weighted scoring model where effort assessment (20%), logic similarity (40%), and test case performance (40%) are combined. Each component is implemented as a separate module, allowing for experimentation with different weights and easy addition of new scoring components. The design includes the full marks rule (100% if all test cases pass) to ensure correct solutions are properly recognized.

**LLM Integration Design** employs a **unified interface pattern** that allows the system to work with multiple LLM providers (OpenAI, Anthropic, Ollama) through a common API. Prompt templates were refined through iterative testing to generate educational feedback rather than just scores. The design includes basic error handling and fallback mechanisms for LLM service unavailability.

**Test Case Execution Design** implements code execution using external services (Judge0 Cloud API) and local Python execution. The design uses Judge0 for multi-language support when available and falls back to local Python execution. Basic timeout management and output handling are implemented.

### 2.5 Anti-Cheat System Design

The anti-cheat system design implements **multiple prevention mechanisms** to discourage academic dishonesty during exams.

**Client-Side Monitoring Design** implements browser-based monitoring using JavaScript event listeners to track fullscreen state changes, tab visibility changes, and clipboard access. The design employs a **strike-based warning system** that alerts students when violations are detected, providing progressive warnings before taking action. The implementation uses standard browser APIs (Fullscreen API, Page Visibility API) with basic error handling to ensure monitoring failures don't prevent exam completion.

**Question Allocation Design** implements **adjacency-based assignment algorithms** that ensure neighboring workstations receive different questions. The design includes a lab layout creator tool that allows faculty to visualize and configure physical lab arrangements, with algorithms that assign different questions to adjacent systems.

**Session Management Design** implements tracking of exam sessions including start times, submission times, and basic interaction logs. The design stores violation records for review by faculty.

### 2.6 User Interface Design

The user interface design follows **Material-UI design principles** using the Material-UI component library, which provides consistent, accessible components. The design emphasizes usability and clarity.

**Faculty Interface Design** focuses on providing functional workflows for exam creation, question management, and result viewing. The design includes dashboard views that display key information such as exam lists, student submissions, and evaluation results.

**Student Interface Design** prioritizes clarity and focus during exam taking, with a clean interface that minimizes distractions. The design includes a code editor (Monaco Editor) with syntax highlighting, real-time test case feedback, and clear indicators of exam status and remaining time.

**Responsive Design** ensures basic functionality works across different screen sizes, with the interface adapting to desktop and tablet displays using Material-UI's responsive grid system.

### 2.7 Security Design

The security design implements **essential security measures** focusing on authentication, authorization, and data protection. Security considerations were integrated during development.

**Authentication Design** implements JWT-based authentication using FastAPI's security utilities, providing token-based access control. The design includes token expiration mechanisms and secure password hashing using bcrypt. The implementation follows FastAPI security best practices, with protection against common vulnerabilities (XSS, CSRF) through framework features and careful input handling.

**Authorization Design** implements **role-based access control (RBAC)** with role-based permissions (Student, Faculty, Admin, Super Admin) and multi-tenant data isolation. The design ensures users can only access resources within their authorized scope, with tenant filtering implemented at the data access layer.

**Data Protection Design** implements secure password hashing using bcrypt, input validation to prevent injection attacks, and basic data protection measures. The design uses parameterized data access patterns to prevent injection vulnerabilities.

### 2.8 Testing Methodology

The testing methodology employs a **practical testing approach** focused on ensuring core functionality works correctly, with emphasis on manual testing of critical workflows. Testing was performed iteratively during development.

**Manual Testing Approach** involved systematic testing of key functionalities including user authentication, exam creation and management, student exam taking, code submission, evaluation, and result viewing. Testing was performed by creating test accounts, simulating user workflows, and verifying expected behavior. Edge cases and error scenarios were tested to ensure robust error handling.

**Integration Testing** involved testing interactions between frontend and backend, API endpoints, LLM provider integrations, and code execution services, with focus on ensuring data flows correctly between components.

**User Acceptance Testing** was performed through testing with sample exam scenarios and user workflows, verifying that the system meets functional requirements and provides a usable experience.

### 2.9 Documentation and Maintenance

The documentation approach emphasizes **practical documentation** that supports development, deployment, and usage of the system. Documentation was created iteratively during development.

**Code Documentation** includes docstrings for key functions and classes, type hints for type safety, and comments for complex algorithms. The documentation follows language conventions, with emphasis on clarity for future maintenance.

**API Documentation** is automatically generated using FastAPI's built-in Swagger/OpenAPI documentation, which provides interactive API documentation with examples and parameter descriptions.

**Deployment Documentation** includes step-by-step guides for local development setup, Cloudflare Tunnel deployment, and production VM deployment.

**User Documentation** includes README files with quick start guides, feature descriptions, and troubleshooting sections.

---

## 4. Experimental Results and Discussion

The LabSense platform was developed and tested to validate its core functionalities and assess its effectiveness in addressing the challenges of coding lab examinations. This chapter presents the experimental results obtained during system testing and discusses the findings.

### 4.1 System Testing and Validation

The system was tested across multiple dimensions to ensure reliability, functionality, and user experience. Testing was conducted on key workflows including user authentication, exam creation and management, code submission, AI-powered evaluation, anti-cheat mechanisms, and multi-tenant functionality.

**Authentication and Authorization Testing** validated that JWT-based authentication correctly manages user sessions, role-based access control properly restricts access based on user roles (Student, Faculty, Admin, Super Admin), and multi-tenant data isolation ensures users can only access resources within their authorized college and department scope. All authentication tests passed successfully, confirming secure access control.

**Exam Management Testing** verified that faculty can create exams with multiple questions, configure exam settings including time limits and question allocation strategies, assign questions to students based on lab layout and adjacency algorithms, and manage exam versions with history tracking. The testing confirmed that the intelligent question allocation algorithm successfully assigns different questions to adjacent systems, reducing the potential for copying during exams.

**Code Evaluation Testing** assessed the multi-component scoring system, LLM-powered feedback generation, and test case execution across multiple programming languages. The evaluation engine was tested with sample code submissions in Python, JavaScript, Java, C, and C++, confirming that the system correctly executes test cases, generates semantic analysis using LLMs, calculates weighted scores (20% effort + 40% logic + 40% test cases), and provides comprehensive feedback. The full marks rule was validated to ensure correct solutions receive 100% scores while still receiving detailed feedback.

**Anti-Cheat System Testing** validated that fullscreen monitoring detects when students exit fullscreen mode, tab visibility detection tracks browser tab switches, clipboard blocking prevents external content pasting, the strike system correctly issues warnings and tracks violations, and session tracking records all relevant events for faculty review. Testing confirmed that the system provides real-time warnings to students while maintaining exam functionality.

**Multi-Language Support Testing** verified code execution across Python, JavaScript, Java, C, C++, and Go using Judge0 Cloud API and local Python execution fallback. The testing confirmed that the LLM-based evaluation works consistently across all supported languages, providing language-agnostic semantic analysis and feedback.

**Multi-Tenant Architecture Testing** validated that college-level data isolation prevents cross-tenant data access, hierarchical department and section management functions correctly, role-based permissions are enforced at all access points, and the system scales appropriately with multiple colleges and departments.

### 4.2 Performance Evaluation

Performance testing was conducted to assess system responsiveness and scalability. The evaluation engine was tested with concurrent code submissions to measure response times and resource utilization. The multi-threaded evaluation architecture successfully handles multiple simultaneous submissions, with average evaluation times ranging from 3-8 seconds depending on code complexity and LLM response times.

The system's deployment flexibility was validated through testing on both Cloudflare Tunnel (free tier) and VM-based production deployments. Both deployment options functioned correctly, with Cloudflare Tunnel providing adequate performance for small to medium-scale usage and VM deployment offering better performance and control for larger institutions.

### 4.3 User Experience Assessment

User experience testing was conducted through manual testing of key workflows from both faculty and student perspectives. The React-based frontend interface was tested for responsiveness, clarity, and ease of use. The Monaco Editor integration provides a professional coding experience with syntax highlighting and code completion, enhancing the exam-taking experience for students.

The real-time test case feedback feature was validated to provide immediate results after code submission, allowing students to understand their code's correctness instantly. The AI-powered feedback generation produces detailed, educational feedback that helps students understand their code quality, logic, and areas for improvement.

### 4.4 Discussion of Results

The experimental results demonstrate that LabSense successfully addresses the key challenges identified in traditional coding lab examination systems. The AI-powered evaluation system provides comprehensive assessment beyond simple output verification, evaluating logic, effort, and code quality while offering educational feedback that promotes learning.

The anti-cheat mechanisms, including intelligent question allocation and real-time monitoring, provide effective deterrents against academic dishonesty. The adjacency-based question assignment algorithm successfully prevents students from easily copying from neighboring workstations, while tab monitoring and fullscreen enforcement discourage external resource access.

The multi-tenant architecture enables secure, scalable deployment supporting multiple institutions with proper data isolation. The flexible deployment options, from free Cloudflare Tunnel to production VM setups, make the system accessible to institutions of varying sizes and technical capabilities.

The system's multi-language support, combined with language-agnostic LLM evaluation, ensures consistent assessment quality regardless of programming language, addressing a significant limitation of traditional systems that require language-specific evaluation logic.

### 4.5 Limitations and Observations

During testing, several observations were made regarding system limitations and areas for potential improvement. LLM response times can vary depending on the provider and model used, with cloud-based LLMs (OpenAI, Anthropic) providing faster responses compared to local models (Ollama), though local models offer better privacy and cost control.

The anti-cheat system relies on client-side monitoring, which can be circumvented by determined students using advanced techniques. However, the combination of multiple monitoring mechanisms, intelligent question allocation, and session tracking provides a comprehensive approach that significantly reduces cheating opportunities compared to unmonitored systems.

The current JSON-based storage system works well for small to medium-scale deployments but may require migration to database systems (PostgreSQL, MySQL, MongoDB) for larger institutions with thousands of concurrent users. The repository pattern design facilitates this migration without major code changes.

---

## 5. Conclusion and Future Scope

### 5.1 Conclusion

LabSense represents a comprehensive solution to the challenges faced in coding lab examinations, successfully integrating AI-powered evaluation, robust anti-cheat mechanisms, multi-language support, and scalable multi-tenant architecture into a unified platform. The system addresses critical limitations of existing evaluation methods by providing semantic analysis beyond surface-level code comparison, educational feedback that promotes learning, and intelligent proctoring that prevents academic dishonesty at the source.

The development of LabSense demonstrates the practical application of modern software engineering principles, including modular architecture design, iterative development methodology, and user-centered design. The system's flexible deployment options, from free Cloudflare Tunnel setup to production VM deployment, make it accessible to educational institutions of all sizes while maintaining enterprise-grade features and security.

Experimental testing validated that the system successfully fulfills its core objectives: providing comprehensive AI-powered code evaluation that assesses logic and effort beyond output verification, implementing effective anti-cheat mechanisms through intelligent question allocation and real-time monitoring, supporting multiple programming languages with consistent evaluation quality, and enabling secure multi-tenant deployment for multiple institutions.

The integration of Large Language Models for semantic code analysis represents a significant advancement over traditional string-based, AST-based, and ML embedding methods, providing context-aware evaluation that understands code logic and intent. The multi-component scoring approach (effort, logic similarity, test cases) ensures fair assessment that recognizes different coding styles and problem-solving approaches.

LabSense's contribution to educational technology lies in its holistic approach to coding examination challenges, combining evaluation, proctoring, and feedback into a single integrated platform. By reducing faculty workload through automation while providing students with detailed, educational feedback, the system promotes genuine learning and skill development rather than rote memorization or code copying.

### 5.2 Future Scope

Several areas present opportunities for future enhancement and expansion of the LabSense platform, building upon the current foundation to address additional requirements and improve system capabilities.

**Advanced AI Capabilities** could include fine-tuning custom LLM models specifically for code evaluation tasks, implementing multi-model ensemble approaches that combine predictions from multiple LLMs for improved accuracy, developing specialized prompt engineering for different problem types and difficulty levels, and integrating code explanation generation that helps students understand optimal solutions and alternative approaches.

**Enhanced Anti-Cheat Mechanisms** could incorporate browser extension-based monitoring for more robust client-side enforcement, integration with webcam-based proctoring services for visual monitoring, keystroke pattern analysis to detect unusual typing behaviors, and machine learning-based anomaly detection that identifies suspicious patterns in submission timing and code similarity.

**Expanded Language Support** could add support for additional programming languages including Rust, Swift, Kotlin, and functional languages like Haskell and Scala, with specialized evaluation logic and test case execution environments for each language.

**Database Integration** could migrate from JSON storage to production-grade databases (PostgreSQL, MySQL, MongoDB) with optimized queries, connection pooling, and caching mechanisms for improved performance at scale. This would enable support for thousands of concurrent users and large-scale institutional deployments.

**Advanced Analytics and Reporting** could implement predictive analytics that identify students at risk of failing based on performance patterns, detailed performance dashboards with visualizations and trend analysis, comparative analytics that benchmark performance across sections and departments, and automated report generation for faculty and administrators.

**Collaborative Features** could add peer code review functionality where students can review and learn from anonymized solutions, group project support with collaborative coding and evaluation, and discussion forums integrated with exam questions for post-exam learning.

**Mobile Application Development** could create native mobile applications for iOS and Android, providing optimized exam-taking experiences on mobile devices with offline capability and push notifications for exam reminders and results.

**Integration Capabilities** could develop APIs for integration with Learning Management Systems (LMS) like Moodle, Canvas, and Blackboard, single sign-on (SSO) support using OAuth 2.0 and SAML protocols, and webhook support for real-time notifications to external systems.

**Accessibility Enhancements** could implement comprehensive screen reader support with ARIA labels and semantic HTML, keyboard-only navigation for all functionalities, high contrast mode and customizable color schemes, and support for multiple languages in the user interface.

**Performance Optimization** could implement caching mechanisms for frequently accessed data, code execution result caching to reduce redundant LLM calls, database query optimization and indexing strategies, and CDN integration for faster static asset delivery.

These future enhancements would further strengthen LabSense's position as a comprehensive, scalable, and educational platform for coding lab examinations, addressing evolving needs in educational technology and assessment methodologies.

---

## Appendix A: How to Download and Run the Application

This appendix provides detailed step-by-step instructions for downloading, setting up, and running the LabSense application on a local development environment.

### A.1 Prerequisites

Before downloading and running LabSense, ensure that the following software is installed on your system:

**Required Software:**
- **Python 3.9 or higher** - Required for the backend FastAPI server. Download from [python.org](https://www.python.org/downloads/).
- **Node.js 18.0 or higher** - Required for the frontend React application. Download from [nodejs.org](https://nodejs.org/).
- **Git** - Required for cloning the repository. Download from [git-scm.com](https://git-scm.com/downloads).

**Verification:**
After installation, verify that all prerequisites are correctly installed by running the following commands in a terminal or command prompt:

```bash
python --version    # Should display Python 3.9.x or higher
node --version      # Should display v18.x.x or higher
npm --version       # Should display version number
git --version       # Should display version number
```

**Optional Software (for enhanced features):**
- **Ollama** - For local LLM evaluation (see LOCAL_LLM_SETUP_GUIDE.md in the repository)
- **Judge0 Cloud API** - For multi-language code execution support (see setup_judge0_cloud.md in the repository)

**Note:** The application will function without these optional components, but with limited features:
- Without LLM: Basic heuristic evaluation without AI-powered feedback
- Without Judge0: Only Python code execution will be supported

### A.2 Downloading the Application

**Step 1: Clone the Repository**

Open a terminal or command prompt and navigate to the directory where you want to store the LabSense project. Then execute the following command to clone the repository:

```bash
git clone https://github.com/AbhiramK01/LabSense.git
cd LabSense
```

This command downloads the entire LabSense codebase into a directory named `LabSense` in your current location. The `cd LabSense` command navigates into the project directory.

**Troubleshooting:**
- If you receive a "command not found: git" error, install Git from the link provided in the prerequisites section.
- If the clone operation fails due to network issues, ensure you have an active internet connection and try again.

### A.3 Backend Setup

The backend is built using FastAPI and Python. Follow these steps to set up the backend environment:

**Step 1: Create a Python Virtual Environment**

A virtual environment isolates project dependencies from system-wide Python packages, preventing conflicts.

**On macOS and Linux:**
```bash
python3 -m venv .venv
source .venv/bin/activate
```

**On Windows:**
```bash
python -m venv .venv
.venv\Scripts\activate
```

**Success Indicator:** After activation, your terminal prompt should display `(.venv)` at the beginning, indicating that the virtual environment is active.

**Common Errors:**
- `python: command not found` → Use `python3` instead, or ensure Python is installed and added to your system PATH.
- `venv: No module named venv` → Install Python 3.9 or higher (venv module is included with Python 3.3+).
- `Permission denied` → On Linux/macOS, try `python3 -m venv .venv` without sudo, or check directory permissions.

**Step 2: Install Python Dependencies**

With the virtual environment activated, install all required Python packages:

```bash
pip install -r requirements.txt
```

This command reads the `requirements.txt` file and installs all listed dependencies, including FastAPI, Uvicorn, Pydantic, JWT authentication libraries, and other required packages.

**Success Indicator:** You should see "Successfully installed" messages for all packages.

**Common Errors:**
- `pip: command not found` → Use `pip3` or `python -m pip` instead.
- `ERROR: Could not find a version` → Update pip: `pip install --upgrade pip`
- `Permission denied` → Ensure the virtual environment is activated (check for `.venv` in your prompt).

**Step 3: Create Data Directory**

Create a directory for storing application data:

```bash
mkdir -p data
```

This directory stores all application data including exams, submissions, users, colleges, and sessions. The directory is automatically created if it doesn't exist, but creating it manually ensures proper permissions.

### A.4 Frontend Setup

The frontend is built using React, TypeScript, and Vite. Follow these steps to set up the frontend:

**Step 1: Navigate to Frontend Directory**

```bash
cd frontend
```

**Step 2: Install Node.js Dependencies**

Install all required npm packages:

```bash
npm install
```

This command reads the `package.json` file and installs all dependencies including React, TypeScript, Material-UI, Monaco Editor, and other required packages.

**Success Indicator:** You should see "added X packages" message indicating successful installation.

**Step 3: Return to Project Root**

```bash
cd ..
```

**Common Errors:**
- `npm: command not found` → Install Node.js from nodejs.org.
- `ERR! network` → Check internet connection, try `npm install --verbose` for detailed output.
- `EACCES: permission denied` → Do not use `sudo` with npm. Fix npm permissions: `npm config set prefix ~/.npm-global`

### A.5 Environment Configuration

While the application works with default settings, creating a `.env` file allows customization of configuration parameters.

**Step 1: Create Environment File**

Create a `.env` file in the project root directory (LabSense/):

**On macOS/Linux:**
```bash
cat > .env << EOF
# JWT Secret Key (change this in production!)
LABSENSE_SECRET_KEY=dev-secret-key-change-in-production

# Token expiration (minutes)
LABSENSE_ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Optional: LLM Configuration (uncomment if using)
# LABSENSE_LLM_URL=http://localhost:11434
# LABSENSE_LLM_MODEL=llama3.1:8b
# OR use API:
# OPENAI_API_KEY=your-key-here
# ANTHROPIC_API_KEY=your-key-here

# Optional: Judge0 for multi-language support
# LABSENSE_JUDGE0_URL=https://judge0-ce.p.rapidapi.com
EOF
```

**On Windows (PowerShell):**
```powershell
@"
LABSENSE_SECRET_KEY=dev-secret-key-change-in-production
LABSENSE_ACCESS_TOKEN_EXPIRE_MINUTES=1440
"@ | Out-File -FilePath .env -Encoding utf8
```

**Note:** If you don't create a `.env` file, the application uses default values suitable for development. For production deployment, always configure a secure secret key and appropriate settings.

### A.6 Starting the Application

LabSense requires two separate processes running simultaneously: the backend server and the frontend development server. You need two terminal windows or tabs.

**Terminal 1: Start Backend Server**

1. Open a terminal or command prompt.
2. Navigate to the project root directory:
   ```bash
   cd /path/to/LabSense
   ```
3. Activate the virtual environment:
   ```bash
   source .venv/bin/activate    # On macOS/Linux
   # OR
   .venv\Scripts\activate       # On Windows
   ```
4. Start the FastAPI server:
   ```bash
   uvicorn app.main:app --reload
   ```

**Success Indicator:** You should see output similar to:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
```

The `--reload` flag enables automatic server restart when code changes are detected, useful for development.

**Common Errors:**
- `Port 8000 already in use` → Stop other services using port 8000, or use a different port: `uvicorn app.main:app --reload --port 8001`
- `ModuleNotFoundError: No module named 'app'` → Ensure you're in the project root directory, not in `frontend/` or `app/` subdirectories.
- `ImportError: attempted relative import with no known parent package` → You're in the wrong directory. Run the command from the project root (where the `app/` folder is located), not from inside the `app/` directory.
- `ImportError` → Ensure the virtual environment is activated and dependencies are installed.

**Terminal 2: Start Frontend Server**

1. Open a second terminal or command prompt.
2. Navigate to the project root directory:
   ```bash
   cd /path/to/LabSense
   ```
3. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

**Success Indicator:** You should see output similar to:
```
VITE v5.x.x  ready in xxx ms
➜  Local:   http://localhost:5173/
```

**Common Errors:**
- `Port 5173 already in use` → Stop other Vite servers, or edit `vite.config.ts` to use a different port.
- `Cannot find module` → Run `npm install` again in the `frontend/` directory.
- `EADDRINUSE` → Another process is using the port. Find and terminate it, or use a different port.

### A.7 Accessing the Application

**Step 1: Open Web Browser**

Open your web browser and navigate to: `http://localhost:5173`

**Step 2: Login with Default Credentials**

The application comes with default test accounts for immediate testing:

**Faculty Account:**
- Username/Email: `prof_ada`
- Password: `password123`

**Student Account:**
- Username/Email: `alice@student.edu`
- Password: `password123`

**Success Indicator:** After successful login, you should be redirected to the appropriate dashboard based on your role (Faculty Dashboard or Student Dashboard).

**Common Issues:**
- **Blank page or "Cannot GET /"** → Ensure the frontend server is running (check Terminal 2).
- **"Network Error" or "Failed to fetch"** → Ensure the backend server is running (check Terminal 1).
- **Login fails** → Open browser developer console (F12) to check for errors. Verify that the backend is running on port 8000.
- **CORS errors** → The backend CORS is configured for `localhost:5173`. If using a different port, update CORS settings in `app/main.py`.

### A.8 Verification

Verify that all components are functioning correctly:

1. **Backend API Documentation:** Visit `http://localhost:8000/docs` - You should see the FastAPI interactive API documentation (Swagger UI).

2. **Backend Health Check:** Visit `http://localhost:8000/health` - Should return `{"status":"healthy"}`.

3. **Frontend Application:** Visit `http://localhost:5173` - Should display the login page.

4. **Authentication:** Login with the default credentials - Should redirect to the appropriate dashboard.

5. **API Connectivity:** The frontend should successfully communicate with the backend API without CORS errors.

### A.9 Troubleshooting

**Backend Won't Start:**
- Verify Python version: `python --version` (requires 3.9+)
- Ensure virtual environment is activated (check for `.venv` in terminal prompt)
- Reinstall dependencies: `pip install -r requirements.txt --force-reinstall`
- Check if port 8000 is available:
  - macOS/Linux: `lsof -i :8000`
  - Windows: `netstat -ano | findstr :8000`

**Frontend Won't Start:**
- Verify Node.js version: `node --version` (requires 18+)
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install` (macOS/Linux) or `rmdir /s node_modules && npm install` (Windows)
- Clear npm cache: `npm cache clean --force`
- Check if port 5173 is available

**Can't Login:**
- Verify backend server is running (check Terminal 1 for "Uvicorn running" message)
- Open browser developer console (F12) and check for JavaScript errors
- Verify you're using the correct default credentials
- Test backend directly: Visit `http://localhost:8000/docs` to verify backend is accessible

**Data Not Persisting:**
- Ensure `data/` directory exists and is writable
- Verify you're in the project root directory when starting the backend
- Check file permissions (Linux/macOS): `chmod -R 755 data/`

**Still Having Issues:**
- Review error messages in terminal output for both backend and frontend
- Check the repository's GitHub Issues page for known problems
- Review additional documentation files in the repository:
  - `CHECK_LLM_STATUS.md` for LLM-related issues
  - `LOCAL_LLM_SETUP_GUIDE.md` for local LLM setup
  - `setup_judge0_cloud.md` for multi-language code execution setup

### A.10 Next Steps

After successfully running the application:

1. **Explore Features:** Create test exams, take exams as a student, and review evaluation results.

2. **Configure LLM Integration:** For AI-powered evaluation feedback, see `LOCAL_LLM_SETUP_GUIDE.md` or configure API keys in `.env` file.

3. **Setup Multi-Language Support:** For code execution in languages other than Python, see `setup_judge0_cloud.md`.

4. **Production Deployment:** For production deployment options, see `deploy/DEPLOYMENT.md` and `deploy/CLOUDFLARE_TUNNEL_SETUP.md`.

5. **Customization:** Modify exam settings, add custom questions, and configure multi-tenant college and department structures.

---

## Summary

LabSense represents a comprehensive solution to the challenges faced in coding lab examinations. By combining AI-powered evaluation, robust anti-cheat mechanisms, multi-language support, and a scalable multi-tenant architecture, it provides educational institutions with a modern, efficient, and educational platform for conducting coding exams. The system's flexible deployment options, from free Cloudflare Tunnel setup to production VM deployment, make it accessible to institutions of all sizes while maintaining enterprise-grade features and security.

The technical specifications ensure compatibility with a wide range of hardware and software environments, from student laptops to production servers, making LabSense a versatile and practical solution for modern educational needs.
