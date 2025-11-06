# 🎓 LabSense

<div align="center">

**AI-Powered Coding Lab Exam Evaluation System**

[![Python](https://img.shields.io/badge/Python-3.9+-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18.3+-61dafb.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6+-3178c6.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

*Intelligent code evaluation with AI-powered feedback for educational institutions*

[🚀 Quick Start](#-quick-start) • [📚 Documentation](#-documentation) • [✨ Features](#-features) • [🛠️ Tech Stack](#️-tech-stack)

</div>

---

## 📖 Overview

**LabSense** is a comprehensive online coding exam platform designed for educational institutions. It provides AI-powered code evaluation, real-time anti-cheat monitoring, and detailed feedback to help students improve their programming skills.

### 🎯 Key Capabilities

- ✅ **Multi-language Support**: Python, JavaScript, Java, C++, Go, and more
- ✅ **AI-Powered Evaluation**: LLM-based code analysis with effort, logic similarity, and test case scoring
- ✅ **Real-time Anti-Cheat**: Fullscreen monitoring, clipboard blocking, tab visibility detection
- ✅ **Comprehensive Feedback**: Detailed AI-generated feedback with strengths, improvements, and scope for growth
- ✅ **Multi-tenant Architecture**: Support for multiple colleges with isolated data
- ✅ **Role-based Access**: Faculty, Student, Admin, and Super Admin roles

---

## 🚀 Quick Start

Follow these steps to get LabSense running on your local machine in minutes.

### Step 1: Prerequisites Check

**Required:**
- **Python 3.9 or higher** - [Download Python](https://www.python.org/downloads/)
- **Node.js 18 or higher** - [Download Node.js](https://nodejs.org/)
- **Git** - [Download Git](https://git-scm.com/downloads)

**Verify installations:**
```bash
python --version    # Should show Python 3.9+
node --version     # Should show v18.x.x or higher
npm --version      # Should show version number
git --version      # Should show version number
```

**Optional (for enhanced features):**
- **Ollama** - For local LLM evaluation (see [LOCAL_LLM_SETUP_GUIDE.md](LOCAL_LLM_SETUP_GUIDE.md))
- **Judge0 Cloud API** - For multi-language code execution (see [setup_judge0_cloud.md](setup_judge0_cloud.md))

> ⚠️ **Note**: The app works without LLM/Judge0, but with limited features:
> - Without LLM: Basic heuristic evaluation (no AI feedback)
> - Without Judge0: Only Python code execution supported

---

### Step 2: Clone the Repository

```bash
git clone https://github.com/AbhiramK01/LabSense.git
cd LabSense
```

> 💡 **Troubleshooting**: If you get "command not found: git", install Git from the link above.

---

### Step 3: Backend Setup

#### 3.1 Create Virtual Environment

**On macOS/Linux:**
```bash
python3 -m venv .venv
source .venv/bin/activate
```

**On Windows:**
```bash
python -m venv .venv
.venv\Scripts\activate
```

> ✅ **Success indicator**: Your terminal prompt should show `(.venv)` at the beginning.

> ⚠️ **Common errors:**
> - `python: command not found` → Use `python3` instead, or install Python
> - `venv: No module named venv` → Install Python 3.9+ (venv is included)
> - `Permission denied` → Try `python3 -m venv .venv` or use `sudo` (Linux only)

#### 3.2 Install Python Dependencies

```bash
pip install -r requirements.txt
```

> ✅ **Success indicator**: You should see "Successfully installed" messages.

> ⚠️ **Common errors:**
> - `pip: command not found` → Use `pip3` or `python -m pip`
> - `ERROR: Could not find a version` → Update pip: `pip install --upgrade pip`
> - `Permission denied` → Make sure virtual environment is activated (see `.venv` in prompt)

#### 3.3 Create Data Directory

```bash
mkdir -p data
```

> ✅ **Note**: The `data/` directory stores all application data (exams, submissions, users). It's automatically created, but creating it manually ensures proper permissions.

---

### Step 4: Frontend Setup

```bash
cd frontend
npm install
cd ..
```

> ✅ **Success indicator**: You should see "added X packages" message.

> ⚠️ **Common errors:**
> - `npm: command not found` → Install Node.js from nodejs.org
> - `ERR! network` → Check internet connection, try `npm install --verbose`
> - `EACCES: permission denied` → Don't use `sudo` with npm. Fix permissions: `npm config set prefix ~/.npm-global`

---

### Step 5: Configure Environment (Optional but Recommended)

Create a `.env` file in the project root for custom configuration:

```bash
# In project root (LabSense/)
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

> ✅ **Note**: If you don't create `.env`, the app uses default values (works for development).

---

### Step 6: Start the Application

You need **two terminal windows/tabs** running simultaneously.

#### Terminal 1: Backend Server

```bash
# Make sure you're in project root
cd /path/to/LabSense

# Activate virtual environment
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Start FastAPI server
uvicorn app.main:app --reload
```

> ✅ **Success indicator**: You should see:
> ```
> INFO:     Uvicorn running on http://127.0.0.1:8000
> INFO:     Application startup complete.
> ```

> ⚠️ **Common errors:**
> - `Port 8000 already in use` → Stop other services on port 8000, or use: `uvicorn app.main:app --reload --port 8001`
> - `ModuleNotFoundError: No module named 'app'` → Make sure you're in project root, not in `frontend/` or `app/`
> - `ImportError: attempted relative import with no known parent package` → **You're in the wrong directory!** Run `uvicorn app.main:app` from the project root (where `app/` folder is), NOT from inside the `app/` directory
> - `ImportError` → Make sure virtual environment is activated and dependencies are installed

#### Terminal 2: Frontend Server

```bash
# Make sure you're in project root
cd /path/to/LabSense

# Navigate to frontend
cd frontend

# Start development server
npm run dev
```

> ✅ **Success indicator**: You should see:
> ```
> VITE v5.x.x  ready in xxx ms
> ➜  Local:   http://localhost:5173/
> ```

> ⚠️ **Common errors:**
> - `Port 5173 already in use` → Stop other Vite servers, or edit `vite.config.ts` to use different port
> - `Cannot find module` → Run `npm install` again in `frontend/` directory
> - `EADDRINUSE` → Another process is using the port, find and kill it

---

### Step 7: Access the Application

1. **Open your browser** and navigate to: `http://localhost:5173`

2. **Login with default credentials:**

   **Faculty Account:**
   - Username/Email: `prof_ada`
   - Password: `password123`

   **Student Account:**
   - Username/Email: `alice@student.edu`
   - Password: `password123`

> ✅ **Success indicator**: You should see the dashboard based on your role (Faculty or Student).

> ⚠️ **Common issues:**
> - **Blank page / "Cannot GET /"** → Make sure frontend server is running (Terminal 2)
> - **"Network Error" / "Failed to fetch"** → Make sure backend server is running (Terminal 1)
> - **Login fails** → Check browser console (F12) for errors, verify backend is on port 8000
> - **CORS errors** → Backend CORS is configured for `localhost:5173`. If using different port, update `app/main.py`

---

### Step 8: Verify Everything Works

1. **Backend API**: Visit `http://localhost:8000/docs` - You should see FastAPI interactive documentation
2. **Health Check**: Visit `http://localhost:8000/health` - Should return `{"status":"healthy"}`
3. **Frontend**: Visit `http://localhost:5173` - Should show login page
4. **Login**: Use credentials above - Should redirect to dashboard

---

### Next Steps

- ✅ **Basic setup complete!** You can now create exams, take exams, and view results.

- 📘 **For AI-powered evaluation**: See [LOCAL_LLM_SETUP_GUIDE.md](LOCAL_LLM_SETUP_GUIDE.md)
- 📘 **For multi-language support**: See [setup_judge0_cloud.md](setup_judge0_cloud.md)
- 📘 **For production deployment**: See [deploy/DEPLOYMENT.md](deploy/DEPLOYMENT.md)

---

### Troubleshooting

#### Backend won't start
- ✅ Check Python version: `python --version` (needs 3.9+)
- ✅ Verify virtual environment is activated (`.venv` in prompt)
- ✅ Reinstall dependencies: `pip install -r requirements.txt --force-reinstall`
- ✅ Check port 8000 is free: `lsof -i :8000` (macOS/Linux) or `netstat -ano | findstr :8000` (Windows)

#### Frontend won't start
- ✅ Check Node.js version: `node --version` (needs 18+)
- ✅ Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
- ✅ Clear npm cache: `npm cache clean --force`
- ✅ Check port 5173 is free

#### Can't login
- ✅ Verify backend is running (check Terminal 1)
- ✅ Check browser console (F12) for errors
- ✅ Verify you're using correct credentials
- ✅ Try accessing `http://localhost:8000/docs` to test backend

#### Data not persisting
- ✅ Check `data/` directory exists and is writable
- ✅ Verify you're in project root when starting backend
- ✅ Check file permissions: `chmod -R 755 data/` (Linux/macOS)

#### Still having issues?
- 📘 Check [CHECK_LLM_STATUS.md](CHECK_LLM_STATUS.md) for LLM-related issues
- 📘 Review error messages in terminal output
- 📘 Check [GitHub Issues](https://github.com/AbhiramK01/LabSense/issues) for known problems

---

## ✨ Features

### 🧠 Intelligent Code Evaluation

- **Effort Scoring (20%)**: AI evaluates code quality, problem-solving approach, and algorithm choice
- **Logic Similarity (40%)**: Semantic comparison between student code and ideal solutions
- **Test Cases (40%)**: Automated test case execution with public/private test support
- **Full Marks**: Automatic 100% score if all test cases pass

### 🛡️ Anti-Cheat System

- Fullscreen detection with periodic checks
- Clipboard content blocking (prevents external copy-paste)
- Tab visibility monitoring
- Session tracking and strike system

### 📊 Comprehensive Feedback

- **Overall Assessment**: General evaluation of the submission
- **Strengths**: What the student did well
- **Areas for Improvement**: Specific issues to address
- **Scope for Improvement**: Detailed suggestions for next steps

### 🏫 Multi-tenant Support

- College-level isolation
- Department and section management
- Student assignment algorithms
- Exam versioning and history

---

## 🛠️ Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **Pydantic** - Data validation
- **JWT** - Authentication
- **Ollama/OpenAI/Anthropic** - LLM integration
- **Judge0 Cloud API** - Code execution

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Material-UI (MUI)** - Component library
- **Monaco Editor** - Code editor
- **Vite** - Build tool

### Infrastructure
- **Docker** - Containerization
- **Nginx** - Reverse proxy
- **Cloudflare** - CDN and tunneling

---

## 📚 Documentation

### 📖 Getting Started

| Document | Description |
|----------|-------------|
| [**LOCAL_LLM_SETUP_GUIDE.md**](LOCAL_LLM_SETUP_GUIDE.md) | Complete local LLM setup guide (Ollama, vLLM, llama.cpp) |
| [**setup_judge0_cloud.md**](setup_judge0_cloud.md) | Judge0 Cloud API configuration |
| [**LLM_SETUP.md**](LLM_SETUP.md) | LLM integration overview (API and local options) |

### 🧪 Evaluation System

| Document | Description |
|----------|-------------|
| [**EVALUATION_IMPLEMENTATION_SUMMARY.md**](EVALUATION_IMPLEMENTATION_SUMMARY.md) | Complete evaluation system implementation details |

### 🤖 LLM Integration

| Document | Description |
|----------|-------------|
| [**LOCAL_LLM_SETUP_GUIDE.md**](LOCAL_LLM_SETUP_GUIDE.md) | Detailed local LLM setup (Ollama, llama.cpp, etc.) |
| [**CHECK_LLM_STATUS.md**](CHECK_LLM_STATUS.md) | Troubleshooting LLM connection issues |

### 🚀 Deployment

| Document | Description |
|----------|-------------|
| [**deploy/CLOUDFLARE_TUNNEL_SETUP.md**](deploy/CLOUDFLARE_TUNNEL_SETUP.md) | Free deployment with Cloudflare Tunnel (No credit card!) |
| [**deploy/DEPLOYMENT.md**](deploy/DEPLOYMENT.md) | Production deployment guide (VM, Docker, Nginx) |
| [**deploy/env.example**](deploy/env.example) | Environment variables template |

### ⚙️ Configuration & Architecture

| Document | Description |
|----------|-------------|
| [**DATA_INTEGRITY_RULES.md**](DATA_INTEGRITY_RULES.md) | Multi-tenant data integrity and conflict prevention |

---

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the project root:

```bash
# Authentication
LABSENSE_SECRET_KEY=your-secret-key-here
LABSENSE_ACCESS_TOKEN_EXPIRE_MINUTES=1440

# LLM Configuration (choose one)
LABSENSE_LLM_URL=http://localhost:11434  # For Ollama
LABSENSE_LLM_MODEL=llama3.1:8b
# OR
OPENAI_API_KEY=your-openai-key
# OR
ANTHROPIC_API_KEY=your-anthropic-key

# Code Execution
LABSENSE_JUDGE0_URL=https://judge0-ce.p.rapidapi.com  # For multi-language support
```

> 📘 See [deploy/env.example](deploy/env.example) for all available options.

---

## 🎨 Evaluation System

### Scoring Breakdown

```
Final Score = (Effort × 20%) + (Logic Similarity × 40%) + (Test Cases × 40%) × 100
```

- **Effort (20%)**: Code quality, problem-solving approach, algorithm choice
- **Logic Similarity (40%)**: Semantic comparison with ideal solution
- **Test Cases (40%)**: Public and private test case pass rate

### Special Rules

- ✅ **Full Marks**: 100% if all test cases pass
- ✅ **Multi-language**: Works for Python, JavaScript, Java, C++, Go
- ✅ **AI Feedback**: Detailed, constructive feedback for every submission

> 📘 Learn more: [EVALUATION_IMPLEMENTATION_SUMMARY.md](EVALUATION_IMPLEMENTATION_SUMMARY.md)

---

## 🌐 Deployment Options

### Option 1: Cloudflare Tunnel (Free, No Credit Card) ⭐ Recommended

Perfect for students and quick demos:
- Frontend on Cloudflare Pages (always online)
- Backend via Cloudflare Tunnel from your computer
- Zero cost, no credit card required

> 📘 **Guide**: [deploy/CLOUDFLARE_TUNNEL_SETUP.md](deploy/CLOUDFLARE_TUNNEL_SETUP.md)

### Option 2: VM Deployment (Production)

For production use:
- Deploy on Azure/Oracle Cloud/AWS
- Docker Compose setup
- Nginx reverse proxy with HTTPS
- Let's Encrypt certificates

> 📘 **Guide**: [deploy/DEPLOYMENT.md](deploy/DEPLOYMENT.md)

---

## 🧪 Testing

### Test Code Execution

```bash
# Test with Python (default, no setup needed)
curl -X POST http://127.0.0.1:8000/evaluate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "language": "python",
    "student_code": "print(input())",
    "ideal_code": "print(input())",
    "test_cases": [{"input":"5\n","expected_output":"5\n","is_public":true}]
  }'
```

### Verify LLM Connection

```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Test LLM
ollama run llama3.1:8b "Say hello"
```

> 📘 **Troubleshooting**: [CHECK_LLM_STATUS.md](CHECK_LLM_STATUS.md)

---

## 📁 Project Structure

```
LabSense/
├── app/                    # Backend FastAPI application
│   ├── api/               # API routes
│   ├── core/              # Core utilities (auth, errors)
│   ├── evaluator/         # Code evaluation logic
│   ├── models/            # Data models
│   ├── repositories/      # Data access layer
│   └── schemas/           # Pydantic schemas
├── frontend/              # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── api.ts         # API client
│   │   └── App.tsx        # Main app component
│   └── package.json
├── data/                  # JSON data storage
├── deploy/                # Deployment configurations
└── requirements.txt       # Python dependencies
```

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🙏 Acknowledgments

- [Judge0](https://judge0.com/) - Code execution service
- [Ollama](https://ollama.ai/) - Local LLM inference
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) - Code editor
- [Material-UI](https://mui.com/) - React component library

---

## 📞 Support

- 📧 **Issues**: [GitHub Issues](https://github.com/AbhiramK01/LabSense/issues)
- 📖 **Documentation**: See the [Documentation](#-documentation) section above
- 💬 **Questions**: [GitHub Discussions](https://github.com/AbhiramK01/LabSense/discussions)

---

<div align="center">

**Made with ❤️ for educators and students**

⭐ Star this repo if you find it helpful!

</div>
