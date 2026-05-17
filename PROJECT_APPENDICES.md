# Appendices

## Appendix A: Important Code Snippets

### A.1 Main Application Entry Point

This snippet shows how the FastAPI application is initialized, CORS is configured, and the API router is registered.

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api.router import api_router
from .core.error_handler import setup_error_handlers

app = FastAPI(
    title="LabSense API",
    version="1.0.0",
    description="AI-powered coding lab exam evaluation system"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://labsense-8jr.pages.dev",
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

setup_error_handlers(app)
app.include_router(api_router, prefix="/api")
```

### A.2 Evaluation Pipeline

This snippet represents the combined scoring strategy used during code evaluation.

```python
if test_case_score >= 1.0 and public_results and all(public_results):
    final_score = 100.0
else:
    final_score = (effort_score * 0.2 + logic_similarity * 0.4 + test_case_score * 0.4) * 100.0
```

The evaluation engine executes public test cases, calculates effort and logic similarity, and then returns a final score along with structured feedback.

### A.3 LLM-Based Feedback Generation

This snippet shows how the system generates educational feedback after evaluation.

```python
llm_evaluator = get_llm_evaluator()

effort_score, effort_breakdown, effort_reasoning = await llm_evaluator.evaluate_effort(
    student_code, ideal_code, language, question_text, test_results_summary
)

ast_sim = get_ast_similarity(language, student_code, ideal_code)

if ast_sim is not None and ast_sim > 0.0:
    llm_sim, logic_breakdown, logic_notes = await llm_evaluator.evaluate_logic_similarity(
        student_code, ideal_code, language, question_text
    )
```

The feedback object is later displayed in the student results interface.

### A.4 Student Submission Route

This route connects the student submission action to the evaluation engine and stores the result.

```python
from fastapi import APIRouter, Depends, HTTPException, status
from ...schemas.student_flow import StudentJoinRequest, SubmissionRequest, SubmissionResult, QuestionDetails, PublicTestCase
from ...models.user import UserRole
from ..deps import require_role
from ...repositories.registry import exam_repo, session_repo

@router.post("/submit/{exam_id}", response_model=SubmissionResult)
async def submit(exam_id: str, claims = Depends(require_role(UserRole.student)), payload: SubmissionRequest = None):
    user_id = claims.get('sub')
    try:
        result = session_repo.submit(user_id, exam_id, payload.question_id, payload.code)
        return SubmissionResult(**result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
```

### A.5 Student Results Display

This component renders the submission feedback, evaluation breakdown, and detailed result panels for the student.

```tsx
{submission.llm_feedback && typeof submission.llm_feedback === 'object' && Object.keys(submission.llm_feedback).length > 0 ? (
    <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Typography variant="subtitle2">AI Feedback & Insights</Typography>
        {submission.llm_feedback?.feedback && (
            <Typography variant="body2">
                {formatFeedbackAsBullets(submission.llm_feedback.feedback).map((point, idx) => (
                    <li key={idx}>{point}</li>
                ))}
            </Typography>
        )}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
            {typeof submission.effort_score === 'number' && <Chip label={`Effort: ${(submission.effort_score * 100).toFixed(1)}%`} size="small" />}
            {typeof submission.logic_similarity === 'number' && <Chip label={`Logic: ${(submission.logic_similarity * 100).toFixed(1)}%`} size="small" />}
            {typeof submission.correctness === 'number' && <Chip label={`Test Cases: ${(submission.correctness * 100).toFixed(1)}%`} size="small" />}
        </Box>
    </Box>
)
```

### A.6 Local Backend and Tunnel Startup

This shell script starts the backend server and Cloudflare Tunnel together.

```bash
source .venv/bin/activate
nohup uvicorn app.main:app --host 0.0.0.0 --port 8000 > backend.log 2>&1 &
nohup npx cloudflared tunnel --url http://localhost:8000 > tunnel.log 2>&1 &
```

This is the deployment pattern used for the project: the backend runs on the laptop, while the frontend is hosted separately on Cloudflare Pages.

### A.7 Student Exam Join and Session Creation

This snippet shows how the student is validated before joining an exam and how the session is created.

```python
@router.post("/join")
async def join_exam(claims = Depends(require_role(UserRole.student)), payload: StudentJoinRequest = None):
    user_id = claims.get('sub')
    try:
        result = session_repo.join_exam(user_id, payload.exam_id, payload.start_code)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
```

Inside the repository, the exam join logic checks the exam state, validates the start code, and stores the session so the student can continue working during the timed window.

### A.8 Weighted Evaluation Formula

This snippet shows the final score calculation used by the evaluation engine.

```python
if test_case_score >= 1.0 and public_results and all(public_results):
    final_score = 100.0
else:
    final_score = (effort_score * 0.2 + logic_similarity * 0.4 + test_case_score * 0.4) * 100.0
```

This formula ensures that successful code is rewarded fully, while partially correct submissions still receive a fair score based on effort and logic quality.

### A.9 Test Case Execution Loop

This snippet shows the logic used to execute public test cases and build detailed results.

```python
for tc in test_cases:
    if not tc.get('is_public', True):
        continue

    out, err, code, exec_time = run_case(tc['input'])

    passed = (code == 0 or code == 3) and out.strip()

    detailed_results.append({
        'input': tc['input'],
        'expected_output': tc['expected_output'],
        'actual_output': out,
        'passed': passed,
        'error': err if not passed else None,
        'execution_time': exec_time
    })
```

This is the core of the public test-case evaluation flow that produces the student-facing response.

### A.10 LLM Provider Selection

This snippet shows how the evaluator chooses between local and cloud LLM providers.

```python
def _detect_provider(self) -> LLMProvider:
    local_llm_url = os.environ.get('LABSENSE_LLM_URL')
    if local_llm_url:
        return LLMProvider.OLLAMA

    if os.environ.get('OPENAI_API_KEY'):
        return LLMProvider.OPENAI
    if os.environ.get('ANTHROPIC_API_KEY'):
        return LLMProvider.ANTHROPIC
    if os.environ.get('GEMINI_API_KEY') or os.environ.get('GOOGLE_API_KEY'):
        return LLMProvider.GEMINI

    return LLMProvider.OLLAMA
```

This design makes the evaluator flexible and allows it to fall back to the best available model at runtime.

### A.11 LLM Feedback Parsing

This snippet shows how the raw model response is converted into structured feedback fields.

```python
data = json.loads(content)

scope_for_improvement = data.get('scope_for_improvement', '')
if isinstance(scope_for_improvement, dict):
    parts = []
    for key, value in scope_for_improvement.items():
        key_formatted = key.replace('_', ' ').title()
        if isinstance(value, str):
            parts.append(f"{key_formatted}: {value}")
        else:
            parts.append(f"{key_formatted}: {json.dumps(value, indent=2)}")
    scope_for_improvement = '\n\n'.join(parts)

return {
    "feedback": data.get('feedback', ''),
    "critic": data.get('critic', ''),
    "improvements": data.get('improvements', ''),
    "scope_for_improvement": scope_for_improvement if isinstance(scope_for_improvement, str) else str(scope_for_improvement)
}
```

The parsed object is used directly in the student results interface to display readable feedback sections.

### A.12 Anti-Cheat Monitoring Logic

This snippet shows the core of the fullscreen and tab-visibility monitoring used during exams.

```tsx
function registerStrike(reason: string, type: 'hidden' | 'fullscreen' | 'blur' = 'hidden') {
  // De-duplicate rapid consecutive events (blur + visibilitychange)
  const now = Date.now()
  if (now - lastStrikeAtRef.current < 900) return
  lastStrikeAtRef.current = now
  setStrikeCount(prev => prev + 1)
  console.warn(`Anti-cheat strike: ${reason} [${type}]`)
}

const onVisibility = () => {
    if (document.visibilityState === 'hidden') {
        registerStrike('You left the exam tab or minimized the window', 'hidden')
    }
}

const onFullscreenChange = () => {
    const active = isFullscreenActive()
    if (!active) {
        registerStrike('Fullscreen mode was exited', 'fullscreen')
    }
}

document.addEventListener('visibilitychange', onVisibility)
document.addEventListener('fullscreenchange', onFullscreenChange)
```

This browser-side monitoring helps discourage tab switching and fullscreen exit during the exam session.

### A.13 Student Results Feedback Rendering

This snippet shows how the results page displays the structured feedback sections.

```tsx
{submission.llm_feedback && typeof submission.llm_feedback === 'object' && Object.keys(submission.llm_feedback).length > 0 ? (
    <Box sx={{ mt: 2.5, pt: 2.5, borderTop: '1px solid', borderColor: 'divider' }}>
        <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: 'text.primary', fontSize: '0.8125rem' }}>
            AI Feedback & Insights
        </Typography>

        {submission.llm_feedback?.critic && typeof submission.llm_feedback.critic === 'string' && (
            <Box sx={{ mb: 2 }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: 'warning.main', fontSize: '0.75rem', mb: 0.5, display: 'block' }}>
                    Critical Analysis
                </Typography>
                <Paper elevation={0} sx={{ p: 1.5, bgcolor: isDark ? '#1A1000' : '#FFFBF0', border: '1px solid', borderColor: 'warning.main', borderRadius: '6px' }}>
                    <Box component="ul" sx={{ m: 0, pl: 2.5, listStyle: 'none' }}>
                        {formatFeedbackAsBullets(submission.llm_feedback.critic).map((point, idx) => (
                            <Box key={idx} component="li" sx={{ mb: 0.75, position: 'relative' }}>
                                <Typography variant="body2" sx={{ color: 'text.primary', fontSize: '0.8125rem', lineHeight: 1.6 }}>
                                    {renderFeedbackText(point)}
                                </Typography>
                            </Box>
                        ))}
                    </Box>
                </Paper>
            </Box>
        )}

        {submission.llm_feedback?.scope_for_improvement && (
            <Box sx={{ mb: 2 }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: 'info.main', fontSize: '0.75rem', mb: 0.5, display: 'block' }}>
                    Scope for Improvement
                </Typography>
                <Paper elevation={0} sx={{ p: 1.5, bgcolor: isDark ? '#0F0F0F' : 'background.paper', border: '1px solid', borderColor: 'info.main', borderRadius: '6px' }}>
                    <Typography variant="body2" sx={{ color: 'text.primary', fontSize: '0.8125rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                        {submission.llm_feedback.scope_for_improvement}
                    </Typography>
                </Paper>
            </Box>
        )}

        {(typeof submission.effort_score === 'number' || typeof submission.logic_similarity === 'number' || typeof submission.correctness === 'number') && (
            <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.75rem', mb: 1, display: 'block' }}>
                    Evaluation Breakdown
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    {typeof submission.effort_score === 'number' && (
                        <Chip label={`Effort: ${(submission.effort_score * 100).toFixed(1)}%`} size="small" />
                    )}
                    {typeof submission.logic_similarity === 'number' && (
                        <Chip label={`Logic: ${(submission.logic_similarity * 100).toFixed(1)}%`} size="small" />
                    )}
                    {typeof submission.correctness === 'number' && (
                        <Chip label={`Test Cases: ${(submission.correctness * 100).toFixed(1)}%`} size="small" />
                    )}
                </Box>
            </Box>
        )}
    </Box>
) : null}
```

This is the section students see after the submission has been evaluated.

### A.14 Cloudflare Pages Build Settings

This snippet documents the deployment settings used for the frontend build.

```text
Framework preset: Vite
Build command: cd frontend && npm install && npm run build
Build output directory: frontend/dist
Environment variable: NPM_FLAGS=--include=optional
```

These settings ensure the frontend builds successfully on Cloudflare Pages and can connect to the tunneled backend.

## Appendix B: How to Download, Run, and Deploy the Application

### B.1 Download the Project

1. Clone the repository from GitHub.
2. Open the project folder in VS Code.
3. Ensure Python 3.9+ and Node.js 18+ are installed on the laptop.

```bash
git clone https://github.com/AbhiramK01/LabSense.git
cd LabSense
```

### B.2 Run the Backend on the Laptop

The backend, session storage, and local JSON data files run on the laptop itself. In this project setup, the laptop acts as the application server and database host.

1. Create a Python virtual environment.
2. Activate the environment.
3. Install backend dependencies.
4. Start the FastAPI application.

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

If you want to run the full local backend workflow used during development, you can also use the helper script:

```bash
./start_all.sh
```

This starts the backend and the Cloudflare Tunnel, and it writes the tunnel URL to the log files.

### B.3 Run the Frontend Locally for Development

1. Install frontend dependencies.
2. Start the Vite development server.

```bash
cd frontend
npm install
npm run dev
```

The frontend can then be accessed at `http://localhost:5173` during local development.

### B.4 Deploy the Frontend to Cloudflare Pages

The production-like deployment used for this project places the frontend on Cloudflare Pages.

1. Push the code to GitHub.
2. Connect the repository to Cloudflare Pages.
3. Set the build command to `cd frontend && npm install && npm run build`.
4. Set the build output directory to `frontend/dist`.
5. Set the environment variable `NPM_FLAGS=--include=optional`.
6. Deploy the site.

After deployment, the frontend is hosted on a Cloudflare Pages URL such as `https://labsense-8jr.pages.dev`.

### B.5 Connect the Frontend to the Laptop Backend

Because the backend runs on the laptop, it must be exposed through a tunnel so that the Cloudflare-hosted frontend can reach it.

1. Install Cloudflare Tunnel (`cloudflared`) on the laptop.
2. Start the backend locally on port 8000.
3. Start the tunnel pointing to `http://localhost:8000`.
4. Copy the generated tunnel URL.
5. Add `/api` to the end of the tunnel URL.
6. Update `VITE_API_BASE` in Cloudflare Pages environment variables.
7. Redeploy the frontend if necessary.

```bash
brew install cloudflare/cloudflare/cloudflared
npx cloudflared tunnel --url http://localhost:8000
```

### B.6 Update CORS for the Deployed Frontend

The backend CORS settings must include the Cloudflare Pages domain so that browser requests are accepted.

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://labsense-8jr.pages.dev",
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### B.7 Recommended Deployment Flow Used in This Project

The workflow followed for this project is summarized below.

1. Keep the backend, JSON storage, and server-side logic running on the laptop.
2. Expose the backend with a Cloudflare Tunnel.
3. Host the frontend on Cloudflare Pages.
4. Point the frontend API base URL to the tunnel endpoint ending in `/api`.
5. Verify that login, exam loading, submission, and results display work end to end.

### B.8 Verification Checklist

After deployment, verify the following:

1. `http://localhost:8000/health` returns a healthy status while the backend is running.
2. The Cloudflare Pages site loads correctly in the browser.
3. The student dashboard loads available exams from the backend through the tunnel.
4. Code submission returns a score and detailed feedback.
5. Student results show the evaluation breakdown and LLM feedback sections.

### B.9 Summary

This deployment arrangement keeps the backend and data on the laptop while using Cloudflare Pages for public frontend hosting. It is a practical low-cost setup for demonstrations and development because it requires no dedicated server infrastructure and can be restarted quickly using the provided helper scripts.