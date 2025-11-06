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

### Prerequisites

- Python 3.9+
- Node.js 18+
- (Optional) Ollama for local LLM evaluation
- (Optional) Judge0 Cloud API key for multi-language support

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/LabSense2.git
cd LabSense2

# Backend setup
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Frontend setup
cd frontend
npm install
cd ..
```

### Running Locally

```bash
# Terminal 1: Start backend
source .venv/bin/activate
uvicorn app.main:app --reload

# Terminal 2: Start frontend
cd frontend
npm run dev
```

Visit `http://localhost:5173` and log in with:
- **Faculty**: `prof_ada` / `password123`
- **Student**: `alice@student.edu` / `password123`

> 📘 **Need more details?** Check out [QUICK_SETUP.md](QUICK_SETUP.md) for step-by-step instructions.

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
| [**QUICK_SETUP.md**](QUICK_SETUP.md) | 5-minute setup guide for local LLM |
| [**setup_judge0_cloud.md**](setup_judge0_cloud.md) | Judge0 Cloud API configuration |
| [**LLM_SETUP.md**](LLM_SETUP.md) | Complete LLM integration guide |

### 🧪 Evaluation System

| Document | Description |
|----------|-------------|
| [**EVALUATION_SYSTEM_REDESIGN.md**](EVALUATION_SYSTEM_REDESIGN.md) | Comprehensive evaluation system design |
| [**EVALUATION_IMPLEMENTATION_SUMMARY.md**](EVALUATION_IMPLEMENTATION_SUMMARY.md) | Implementation details and changes |

### 🤖 LLM Integration

| Document | Description |
|----------|-------------|
| [**LOCAL_LLM_SETUP_GUIDE.md**](LOCAL_LLM_SETUP_GUIDE.md) | Detailed local LLM setup (Ollama, llama.cpp, etc.) |
| [**LLM_READY.md**](LLM_READY.md) | Post-setup verification and next steps |
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

> 📘 Learn more: [EVALUATION_SYSTEM_REDESIGN.md](EVALUATION_SYSTEM_REDESIGN.md)

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
LabSense2/
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

- 📧 **Issues**: [GitHub Issues](https://github.com/yourusername/LabSense2/issues)
- 📖 **Documentation**: See the [Documentation](#-documentation) section above
- 💬 **Questions**: Open a discussion on GitHub

---

<div align="center">

**Made with ❤️ for educators and students**

⭐ Star this repo if you find it helpful!

</div>
