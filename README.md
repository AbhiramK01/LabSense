# LabSense Auth Module

FastAPI-based authentication module with JWT and role-based access (faculty/student).

## Quickstart (Backend)

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

- Login with username/email + password at `POST /auth/login`.
- Use the returned JWT as `Authorization: Bearer <token>`.
- Try:
  - `GET /dashboards/faculty` (faculty only)
  - `GET /dashboards/student` (student only)
  - `GET /auth/whoami` (any authenticated user)

## Configuration
Environment variables (optional):
- `LABSENSE_SECRET_KEY`: JWT signing secret
- `LABSENSE_ACCESS_TOKEN_EXPIRE_MINUTES`: token lifetime (minutes)
- `LABSENSE_ALGORITHM`: JWT algorithm (default HS256)

## Frontend (Vite + React + TS)

CORS is enabled for `http://localhost:5173` in `app/main.py`.

```bash
cd frontend
npm install
npm run dev
```

Open `http://127.0.0.1:5173` and log in with:
- Faculty: `prof_ada` / `password123`
- Student: `alice@student.edu` / `password123`

On success, you'll be redirected to `/faculty` or `/student` based on your role.

## AI Code Evaluator Setup

The evaluator can run in two modes:

### Option 1: Local Python-only (Default)
No setup needed. Works for Python code only:
```bash
# Already works out of the box
uvicorn app.main:app --reload
```

### Option 2: Judge0 for Multi-language Support
For JavaScript, Java, C++, etc.:

1. **Install Judge0 CE (Community Edition)**:
```bash
# Using Docker Compose
git clone https://github.com/judge0/judge0.git
cd judge0
cp docker-compose.yml docker-compose.override.yml
# Edit docker-compose.override.yml to expose port 2358
docker-compose up -d
```

2. **Set environment variable**:
```bash
export LABSENSE_JUDGE0_URL="http://localhost:2358"
uvicorn app.main:app --reload
```

3. **Test the evaluator**:
```bash
curl -X POST http://127.0.0.1:8000/evaluate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "language": "python",
    "student_code": "print(input())",
    "ideal_code": "print(input())",
    "test_cases": [
      {"input":"5\n","expected_output":"5\n","is_public":true}
    ]
  }'
```

**Note**: Without Judge0, only Python evaluation works. With Judge0, all languages (Python, JavaScript, Java, C++, Go) are supported.
