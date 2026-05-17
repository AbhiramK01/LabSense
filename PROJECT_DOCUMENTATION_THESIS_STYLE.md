# LabSense Project Documentation

## 3. Implementation

### 3.1 Overview

LabSense was implemented as a web-based coding examination platform designed to support secure assessment, automated evaluation, and actionable feedback generation. The system follows a client-server architecture, with the frontend developed in React and TypeScript, while the backend is implemented using FastAPI and Python. This structure enables a clear separation of concerns between the user interface, application logic, and data persistence layers.

The implementation emphasizes modularity, maintainability, and extensibility. Each major capability, including authentication, exam management, code submission, evaluation, and results reporting, is encapsulated within dedicated components and repositories. This design approach supports incremental development and makes it easier to adapt the system for future enhancements.

From an implementation perspective, the platform is organized around a complete academic workflow. Faculty members can define exams, configure questions, assign test cases, and publish assessments to student groups. Students can join active exams, receive their allocated question set, write code in the browser, and submit solutions for automated evaluation. Administrators and super administrators retain oversight over institutional structure, user accounts, and college-level data boundaries. This end-to-end workflow is central to the practical usefulness of the system.

### 3.2 Backend Implementation

The backend serves as the operational core of the platform. It provides RESTful API endpoints for authentication, student workflows, faculty workflows, administrative tasks, and code evaluation. JWT-based authentication is used to control access across the different user roles, namely Student, Faculty, Admin, and Super Admin. Role-based access control ensures that users can only access the functions permitted by their privileges.

Persistent storage is handled through JSON-based repositories. Although lightweight, this approach is sufficient for development and controlled deployment scenarios. The repository pattern abstracts the underlying storage mechanism, allowing the system to preserve its business logic independently of future database migration. This makes the platform more adaptable for scaling to larger institutional environments.

The backend also includes dedicated logic for managing colleges, departments, years, sections, exams, submissions, and runtime session data. These data structures are not treated as isolated records; instead, they are linked through repository-level relationships that preserve institutional context. As a result, the system can enforce access control, track exam ownership, and reconstruct student history even after application restarts.

Student session management is an important part of the backend implementation. When a student joins an exam, the system creates a session record that stores timing information, assigned questions, auto-saved code, and submission history. The session layer also supports exam state recovery, timed exam completion, and college-level data isolation. These mechanisms ensure continuity of assessment while maintaining institutional boundaries.

### 3.3 Evaluation Engine Implementation

The evaluation engine is one of the most significant components of the system. It combines automated test execution with AI-assisted semantic analysis to produce a balanced and pedagogically meaningful assessment. The final score is computed using a weighted formula in which effort contributes 20 percent, logic similarity contributes 40 percent, and public test case performance contributes 40 percent.

Code execution is supported through Judge0 for multi-language evaluation, with a local Python fallback when external execution services are unavailable. This design allows the platform to evaluate submissions in multiple languages while still providing a fallback path for basic operation. The engine normalizes inputs, executes each public test case, and records detailed outputs, execution times, and pass or fail status.

Logic similarity is computed using a hybrid strategy. Where available, AST-based similarity is combined with LLM-based semantic comparison. This approach improves robustness because AST analysis captures structural relationships, while the LLM provides language-agnostic interpretation of the solution strategy. Effort scoring is also produced by the LLM and focuses on problem-solving approach, code quality, and algorithmic choice. The system further generates structured feedback that includes an overall assessment, critical observations, improvement suggestions, and scope for further development.

The result of this design is that evaluation does not depend solely on exact output matching. A submission that is partially correct can still receive a meaningful score and detailed explanation, while a fully correct submission can receive full marks together with richer pedagogical feedback. This evaluation philosophy aligns the implementation with the educational objectives of a coding laboratory examination.

### 3.4 Frontend Implementation

The frontend provides a responsive and role-aware user interface. It is built with React, TypeScript, and Material-UI, with Monaco Editor used to provide a professional coding environment for students. The interface is designed to support two major user experiences: exam administration for faculty and exam participation for students.

For students, the interface supports question viewing, code editing, auto-save, countdown timing, and submission tracking. The student dashboard also includes anti-cheat mechanisms such as fullscreen enforcement, tab visibility monitoring, and clipboard-related restrictions. These controls are implemented at the browser layer to discourage common forms of academic dishonesty during online examinations.

The student results component displays the outcome of each submission in a structured form. In addition to the final score, the interface renders the LLM-generated feedback fields, including overall feedback, critic, improvements, and scope for improvement. It also presents the evaluation breakdown so that students can understand how effort, logic similarity, and test performance contributed to the final outcome.

For faculty, the interface supports exam creation, question editing, test case management, and result analysis. The design of the frontend is intended to minimize operational complexity while ensuring that the workflow remains clear and efficient for institutional use.

The frontend also includes supporting dashboards for administrators, department managers, instructors, and super administrators. These views are used for managing colleges, departments, user records, and reporting workflows. In documentation terms, this gives the system a visible role hierarchy, which is important for illustrating how the platform operates in a real institutional setting.

### 3.5 Security and Integrity Features

Security was incorporated into the implementation through authentication, authorization, and exam integrity controls. JWT-based authentication protects the application endpoints, while role-based restrictions define access to administrative, instructional, and student-facing features. College-level filtering is also enforced so that user data remains isolated between institutions.

Academic integrity is supported through a combination of browser monitoring and question distribution logic. The system monitors fullscreen state, tab switching, and clipboard behavior to detect suspicious activity during exams. In addition, adjacent workstations can be assigned different questions, reducing the likelihood of direct copying between neighboring students. Although these controls do not eliminate all cheating possibilities, they provide a practical deterrent framework for supervised coding assessments.

## 4. Testing and Results

### 4.1 Testing Approach

The project was validated primarily through manual and workflow-based testing. The absence of a large dedicated automated test suite means that system behavior was verified by executing core application flows and observing the resulting API and user interface responses. The testing process focused on realistic usage scenarios rather than isolated unit checks.

The major areas of validation included authentication, exam creation, student exam joining, question assignment, auto-save, timed submission handling, evaluation execution, result retrieval, and AI-generated feedback display. In addition, the code execution pathway and the LLM fallback behavior were checked to ensure that the evaluation pipeline remained functional even when external services were unavailable.

Validation also covered the supporting dashboards and management screens that form part of the administrative workflow. These included exam setup views, layout assignment views, faculty dashboards, student result views, and monitoring-related interface states. Together, these checks ensured that the platform remained coherent across the full set of user roles instead of working only in isolated scenarios.

### 4.2 Functional Validation

Authentication and authorization were validated by confirming that users could access only the routes appropriate to their assigned roles. This included student-only exam workflows, faculty exam management actions, and administrative operations restricted to higher privilege roles. The college-scoped data model was also validated to ensure that users could not access exams or sessions outside their assigned institutional context.

The exam management workflow was tested by creating exams, defining multiple questions, assigning test cases, and verifying that the resulting exam data could be retrieved through the student-facing APIs. The student workflow was then validated by joining an exam, receiving the assigned question set, and submitting code for evaluation. The auto-save path was checked to ensure that intermediate code state could be preserved and restored during an active session.

The evaluation pipeline was tested by submitting sample code solutions and verifying that the system executed public test cases, computed the weighted score, and produced detailed response data. The final response included correctness, logic similarity, effort, and structured LLM feedback, which confirmed that the evaluation engine and the frontend presentation layer were aligned.

### 4.3 Observed Results

The testing results indicate that the platform meets its intended operational objectives. Correct submissions can achieve full marks when all public test cases pass, while partially correct submissions receive proportionate scores and explanatory feedback. This behavior supports the project’s emphasis on educational assessment rather than only binary pass or fail grading.

The LLM-based feedback mechanism provides more informative evaluation than traditional test-only grading systems. Students receive comments on what went well, what needs improvement, and how their solution compares to the expected approach. This makes the platform more useful as a learning instrument, not merely as an examination tool.

The anti-cheat measures also function as intended at the interface level. Fullscreen monitoring, tab change detection, and warning-based enforcement create a more controlled exam environment. While browser-based controls cannot completely prevent deliberate misuse, they significantly improve the integrity of the online assessment process.

### 4.4 Screenshots to Include

For a complete project documentation submission, the following screenshots should be included in the results chapter. These images should be captured from the running application so that the documentation reflects the actual implementation rather than placeholder figures.

1. Login page showing the authentication interface.
2. Student dashboard showing the available or active exam list.
3. Exam join screen with the start code entry field.
4. Student exam interface with Monaco Editor and question display.
5. Countdown timer or active exam status indicator.
6. Auto-save or code restoration state, if visible in the interface.
7. Anti-cheat warning or fullscreen enforcement dialog.
8. Question submission result showing score, correctness, and test-case output.
9. Detailed submission view showing the LLM feedback sections.
10. Student results page with final score, effort, logic similarity, and public test case summary.
11. Faculty dashboard showing exam management or results overview.
12. Exam creation screen showing question entry and test case configuration.
13. Lab layout or question assignment screen, if used in your implementation.
14. Admin or super admin dashboard for institutional management, if your report includes role-based coverage.

If you want the documentation to look more polished, place these screenshots in the same order as the user workflow: login, exam access, exam taking, submission, evaluation results, and faculty review. That sequence helps the reader understand the complete system flow without jumping between unrelated screens.

### 4.5 Limitations Noted During Validation

Several limitations were observed during validation. First, the reliance on LLM services introduces variability in response time and availability. When the LLM is unreachable, the system falls back to heuristic scoring and simplified feedback, which preserves continuity but reduces the richness of the evaluation.

Second, the current JSON-based persistence layer is practical for small-scale deployment, but it is not ideal for large institutions with high concurrency or complex reporting requirements. Third, the anti-cheat controls rely primarily on client-side enforcement, which is useful but not fully tamper-proof. These limitations do not undermine the current utility of the system, but they define clear boundaries for future refinement.

## 5. Conclusion and Future Scope

### 5.1 Conclusion

LabSense demonstrates a complete and practical approach to coding lab examination management. The platform integrates exam administration, timed student workflows, multi-language code execution, AI-assisted semantic evaluation, and feedback-rich result reporting into a unified system. Its implementation goes beyond conventional automated grading by assessing effort, logic similarity, and public test case performance in combination.

The project also addresses several important institutional concerns, including secure authentication, college-level isolation, exam assignment control, and basic anti-cheat enforcement. As a result, the system is not only technically functional but also educationally meaningful, since it provides students with guidance that can support future improvement.

### 5.2 Future Scope

The platform can be extended in several directions. A major improvement would be migration from JSON storage to a relational or document-based database such as PostgreSQL or MongoDB. This would improve scalability, concurrency handling, and reporting flexibility for larger institutional deployments.

The anti-cheat system could also be strengthened through more advanced monitoring and server-side audit logging. Additional proctoring signals, richer anomaly detection, and stronger session integrity checks would make the examination environment more resilient against misuse.

Another important area for future work is testing automation. A formal test suite for backend APIs, repository behavior, evaluation logic, and frontend interaction flows would improve reliability and reduce regression risk. Similarly, caching strategies for repeated LLM evaluations could reduce latency and lower dependency costs.

Future versions of the system could also expand faculty analytics, support more advanced feedback visualization, and incorporate question generation or difficulty calibration features. With these enhancements, LabSense can evolve from a functional examination platform into a more comprehensive academic assessment ecosystem.