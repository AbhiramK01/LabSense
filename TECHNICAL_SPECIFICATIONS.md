# Technical Specifications

## 1.4 Technical Specifications

### 1.4.1 Hardware Requirements

#### Minimum Requirements (Development/Testing)
- **Processor**: Dual-core CPU (2.0 GHz or higher)
- **RAM**: 4 GB (8 GB recommended)
- **Storage**: 2 GB free disk space
- **Network**: Internet connection for API services (LLM, Judge0)
- **Display**: 1024x768 resolution minimum

#### Recommended Requirements (Production)
- **Processor**: Quad-core CPU (2.5 GHz or higher)
- **RAM**: 8 GB (16 GB recommended for LLM local hosting)
- **Storage**: 10 GB free disk space (SSD recommended)
- **Network**: Stable broadband connection (10 Mbps upload/download minimum)
- **Display**: 1920x1080 resolution or higher

#### Server Requirements (VM Deployment)
- **CPU**: 2-4 vCPUs
- **RAM**: 4-8 GB
- **Storage**: 20 GB SSD
- **Network**: Public IP address, ports 80/443 open
- **OS**: Ubuntu 22.04 LTS or similar Linux distribution

#### Optional: Local LLM Hosting
- **CPU**: 8+ cores recommended
- **RAM**: 16+ GB (32 GB for larger models)
- **GPU**: NVIDIA GPU with 8+ GB VRAM (optional, significantly improves performance)
- **Storage**: 50+ GB for model storage

#### Mobile Device Support
- **iOS**: iOS 13.0 or later
- **Android**: Android 8.0 (API level 26) or later
- **Browser**: Modern browser with JavaScript enabled
- **Screen Size**: 7-inch tablet or larger recommended for coding exams

### 1.4.2 Software Requirements

#### Development Environment

##### Backend
- **Python**: 3.9 or higher (3.11+ recommended)
- **Package Manager**: pip (included with Python)
- **Virtual Environment**: venv (included with Python 3.9+)
- **Web Server**: Uvicorn 0.30.6 or higher
- **Python Dependencies**:
  - FastAPI 0.115.0
  - Pydantic 2.9.2
  - python-jose[cryptography] 3.3.0
  - passlib[bcrypt] 1.7.4
  - requests 2.32.3
  - aiohttp 3.10.0
  - asttokens 2.4.1

##### Frontend
- **Node.js**: 18.0 or higher (20.0+ recommended)
- **Package Manager**: npm (included with Node.js)
- **Build Tool**: Vite 5.4.8 or higher
- **JavaScript Runtime**: Modern browser with ES6+ support
- **Key Dependencies**:
  - React 18.3.1
  - TypeScript 5.6.2
  - Material-UI (MUI) 6.1.7
  - Monaco Editor 4.6.0
  - React Router 6.26.2

#### Optional Services

##### LLM Integration (Choose One)
- **OpenAI API**
  - Requires API key
  - Requires internet connection
- **Anthropic (Claude) API**
  - Requires API key
  - Requires internet connection
- **Ollama** (Local LLM hosting)
  - Ollama 0.1.0 or higher
  - Model: llama3.1:8b or similar (8GB+ RAM required)
  - Alternative: vLLM, llama.cpp for different deployment scenarios

##### Code Execution
- **Judge0 Cloud API**
  - Free tier available via RapidAPI
  - Requires RapidAPI account
  - Requires internet connection
  - Requires API key from RapidAPI
- **Local Python Execution**
  - Built-in, no additional setup required
  - Limits support to Python only

#### Production Deployment

##### Containerization
- **Docker**: 20.10 or higher
- **Docker Compose**: 2.0 or higher

##### Web Server (Optional)
- **Nginx**: 1.18 or higher (for reverse proxy and HTTPS)

##### SSL/TLS
- **Certbot**: For Let's Encrypt certificates (free SSL)

#### Operating Systems

##### Development
- macOS 10.15+ (Catalina or later)
- Windows 10/11
- Linux (Ubuntu 20.04+, Debian 11+, Fedora 34+)

##### Production Server
- Ubuntu 22.04 LTS (recommended)
- Debian 11+
- CentOS 8+ / Rocky Linux 8+

#### Browser Support
- **Chrome/Edge**: Version 90+ (recommended)
- **Firefox**: Version 88+
- **Safari**: Version 14+
- **Mobile Browsers**:
  - Chrome Mobile 90+
  - Safari iOS 14+
  - Firefox Mobile 88+

#### Database (Future Enhancement)
- Currently uses JSON file storage
- Can be migrated to:
  - PostgreSQL 12+ (recommended)
  - MySQL 8.0+
  - MongoDB 5.0+

#### Version Control
- **Git**: 2.30 or higher (for cloning and development)

#### Development Tools (Optional)
- **IDE**: VS Code, PyCharm, or any modern code editor
- **API Testing**: Postman, curl, or browser DevTools
- **Code Quality**:
  - Black (Python formatter)
  - ESLint (JavaScript/TypeScript linter)
  - Prettier (Code formatter)







