# LabSense Evaluation System Redesign Plan

## Current System Analysis

### ✅ What Works
- Test case execution (Judge0 + local fallback)
- Public/private test case infrastructure exists (just not being used)
- Detailed results tracking

### ❌ Identified Flaws
1. **No private test cases**: Frontend hardcodes `is_public: true` in exam creation
2. **AST only for Python**: `python_ast_similarity` doesn't work for JS/Java/C/C++/Go
3. **Weight distribution**: 50% correctness is too high
4. **Effort heuristic too simplistic**: Code length + keyword detection isn't meaningful
5. **No LLM feedback**: Missing AI-powered insights for students and faculty

---

## New Evaluation System Design

### Scoring Weights
```
Final Score = (Effort × 20%) + (Logic Similarity × 40%) + (Test Cases × 40%) × 100
```

### Component Breakdown

#### 1. Test Cases (40% weight)
- **Public test cases**: Visible to students, immediate feedback
- **Private test cases**: Hidden, prevent gaming
- **Scoring**: `(public_pass_rate × 0.5) + (private_pass_rate × 0.5)`
- **Action**: Enable private test cases in exam creation UI

#### 2. Logic Similarity (40% weight)
- **Current**: AST-based (Python only)
- **Problem**: AST doesn't work for compiled/interpreted languages differently
- **Solution**: Use LLM for cross-language semantic similarity
  - Compare student code vs ideal solution
  - Assess algorithmic approach, not just structure
  - Works for all languages

#### 3. Effort (20% weight) - LLM-Powered
- **Current**: Heuristic (code length + keywords)
- **New**: LLM evaluation of:
  - Code complexity and problem-solving approach
  - Appropriate algorithm/data structure usage
  - Code organization and readability
  - Attempt to solve the problem (not just copying)

---

## LLM Integration: Local vs API

### Option A: Local LLM (Your Preference)

#### Pros ✅
1. **Cost**: No per-request API fees (after initial setup)
2. **Privacy**: Student code stays on-premises
3. **Control**: Full control over model, fine-tuning
4. **No rate limits**: Process as many as your hardware allows
5. **Offline**: Works without internet
6. **Data sovereignty**: Important for educational institutions

#### Cons ❌
1. **Hardware requirements**: 
   - 7B models: 8-16GB RAM minimum (e.g., Llama 3.1 8B, Mistral 7B)
   - 13B models: 16-32GB RAM (better quality, e.g., Llama 3.1 13B)
   - Larger: Need GPU (e.g., 24GB VRAM for 70B models)
2. **Initial setup complexity**: Model download, quantization, inference server
3. **Deployment**: Need to deploy model with your app
4. **Inference speed**: Slower than API (but acceptable with quantization)
5. **Model updates**: Manual process

#### Feasibility Assessment

**Small-scale deployment (single server, <100 students/exam):**
- ✅ **Feasible** with quantized 7B-13B models
- Hardware: 16GB RAM minimum, 32GB recommended
- Models: Llama 3.1 8B Q4/Q5, Mistral 7B Q4
- Inference: 2-5 seconds per evaluation (with vLLM/llama.cpp)

**Medium-scale (multi-server, 100-500 students):**
- ⚠️ **Challenging but doable**
- Need: Load balancer + multiple inference servers
- Or: Single powerful server (64GB+ RAM) with batch processing

**Large-scale (500+ students):**
- ⚠️ **May need hybrid**: Local for privacy, API for scale
- Or: Dedicated inference cluster

#### Implementation Stack (Recommended)

1. **Model Options**:
   ```
   - Llama 3.1 8B Q4/Q5 (4-6GB VRAM, good quality)
   - Mistral 7B Q4 (4GB VRAM, fast)
   - Phi-3 Medium 14B Q4 (7GB VRAM, excellent)
   - Qwen2 7B Q4 (good multilingual)
   ```

2. **Inference Server**:
   ```
   - vLLM (fastest, GPU-optimized)
   - llama.cpp (CPU-friendly, cross-platform)
   - Ollama (easiest setup, good for development)
   - Text Generation Inference (HuggingFace, production-ready)
   ```

3. **Deployment Options**:
   ```
   Option 1: Same server as FastAPI
   - Run inference server on same machine
   - FastAPI calls localhost HTTP API
   - Simple but shares resources
   
   Option 2: Separate inference server
   - Deploy inference on dedicated machine/container
   - FastAPI calls inference API over network
   - Better resource isolation
   
   Option 3: Docker Compose
   - FastAPI container + LLM inference container
   - Easy deployment, resource limits per container
   ```

4. **Python Integration**:
   ```python
   # Using Ollama (simplest)
   import ollama
   response = ollama.chat(model='llama3.1:8b', messages=[...])
   
   # Using llama.cpp Python bindings
   from llama_cpp import Llama
   llm = Llama(model_path="model.gguf")
   
   # Using vLLM
   from vllm import LLM
   llm = LLM(model="meta-llama/Llama-3.1-8B-Instruct")
   ```

#### Fine-tuning (Optional but Recommended)

**Why fine-tune?**
- Better code evaluation accuracy
- Understands educational context
- Provides more relevant feedback

**How to fine-tune:**
1. **Prepare dataset**: 
   - Student submissions (anonymized)
   - Expert evaluations (effort scores, feedback)
   - Ideal solutions

2. **Fine-tuning methods**:
   ```
   - LoRA (Low-Rank Adaptation): 1-2GB additional storage, fast
   - QLoRA: Even smaller, quantized base model
   - Full fine-tuning: Large storage, best quality
   ```

3. **Tools**:
   - Unsloth (easy, fast LoRA)
   - Axolotl (Flexible, supports many models)
   - HuggingFace Transformers (traditional)

**Storage requirements**: Base model (4-7GB) + LoRA adapter (1-2GB)

---

### Option B: API LLM (OpenAI, Anthropic, etc.)

#### Pros ✅
1. **Zero setup**: Just API key
2. **No hardware**: No server requirements
3. **Always latest model**: Access to GPT-4, Claude, etc.
4. **Fast**: Optimized inference infrastructure
5. **High quality**: Best models available

#### Cons ❌
1. **Cost**: $0.01-0.10 per evaluation (adds up with scale)
2. **Privacy**: Code sent to third-party
3. **Rate limits**: May hit API limits during exam grading
4. **Dependency**: Requires internet, API availability
5. **Latency**: Network round-trip adds delay

#### Cost Estimate
- GPT-4o: ~$0.01 per evaluation
- 100 students × 3 questions = 300 evaluations = $3 per exam
- Claude 3.5 Sonnet: Similar pricing
- GPT-3.5 Turbo: ~$0.001 per evaluation (cheaper but lower quality)

---

## Recommendation: Hybrid Approach

### Best Strategy
1. **Start with API** (OpenAI/Anthropic) for MVP
   - Fast development
   - Validate system works
   - Understand evaluation quality

2. **Migrate to Local** for production
   - Start with Ollama + Llama 3.1 8B (easy setup)
   - Fine-tune on collected data
   - Deploy as separate service

3. **Use API as fallback**
   - If local LLM fails/timeout
   - For critical evaluations

### Implementation Path

**Phase 1: API-Based (Quick Start)**
```python
# app/evaluator/llm_evaluator.py
async def evaluate_with_llm(student_code, ideal_code, language, test_results):
    prompt = create_evaluation_prompt(...)
    # Use OpenAI/Anthropic API
    response = await openai.chat.completions.create(...)
    return parse_response(response)
```

**Phase 2: Local LLM (Production)**
```python
# app/evaluator/llm_evaluator_local.py
async def evaluate_with_local_llm(student_code, ideal_code, language, test_results):
    prompt = create_evaluation_prompt(...)
    # Use Ollama/vLLM local inference
    response = await local_llm.chat(...)
    return parse_response(response)
```

**Phase 3: Fallback Logic**
```python
try:
    result = await evaluate_with_local_llm(...)
except Exception:
    result = await evaluate_with_api_llm(...)  # Fallback
```

---

## LLM Prompt Design

### For Effort Evaluation (20%)
```
You are evaluating a student's programming solution for effort and code quality.

Student Code (Language: {language}):
{student_code}

Problem: {question_text}
Ideal Solution:
{ideal_code}

Test Results: {test_results_summary}

Evaluate the student's code on:
1. Problem-solving approach (0-1.0)
2. Code organization and readability (0-1.0)
3. Algorithm/data structure choice (0-1.0)
4. Attempt quality (not just minimal working code) (0-1.0)

Return JSON:
{
  "effort_score": 0.85,
  "components": {
    "approach": 0.9,
    "organization": 0.8,
    "algorithm_choice": 0.85,
    "attempt_quality": 0.85
  },
  "reasoning": "Student used appropriate data structures..."
}
```

### For Logic Similarity (40%)
```
Compare student code with ideal solution for logical similarity.

Student Code:
{student_code}

Ideal Solution:
{ideal_code}

Language: {language}

Assess:
1. Algorithmic approach similarity (same algorithm? different but valid?)
2. Logic flow similarity
3. Problem-solving strategy similarity

Return JSON:
{
  "logic_similarity": 0.75,
  "similarity_breakdown": {
    "algorithm": 0.8,
    "logic_flow": 0.7,
    "strategy": 0.75
  },
  "notes": "Student used iterative approach vs recursive ideal..."
}
```

### For Feedback Generation
```
Generate constructive feedback for the student.

Code: {student_code}
Test Results: {test_results}
Effort Score: {effort_score}
Logic Similarity: {logic_similarity}

Provide:
1. What they did well
2. Areas for improvement
3. Specific suggestions
4. Scope for improvement insights

Format: Structured markdown with sections
```

---

## Architecture Changes Needed

### 1. Backend (`app/evaluator/`)

**New files:**
- `llm_evaluator.py` - LLM evaluation logic (API + local)
- `feedback_generator.py` - Generate feedback and insights
- `logic_similarity_llm.py` - Cross-language logic comparison
- `config.py` - LLM configuration (model choice, API keys)

**Modified files:**
- `combine.py` - New scoring weights, integrate LLM
- `effort.py` - Replace heuristic with LLM call
- `ast_similarity.py` - Keep as fallback, add LLM version

### 2. Frontend Changes

**Exam Creation:**
- Add checkbox for each test case: "Public" / "Private"
- Currently hardcodes `is_public: true` (line 398 in `IntegratedCreateExam.tsx`)

**Results Display:**
- Show LLM-generated feedback
- Display "Scope of Improvement" section
- Show effort/logic breakdown

### 3. Database/Schema

**New fields in submissions:**
- `effort_score`
- `effort_breakdown` (JSON)
- `logic_similarity` (for all languages)
- `logic_breakdown` (JSON)
- `ai_feedback` (markdown text)
- `improvement_suggestions` (JSON)
- `llm_model_used` (track which model evaluated)

---

## Implementation Roadmap

### Week 1: Foundation
- [ ] Create LLM evaluator interface
- [ ] Implement API-based evaluation (OpenAI/Anthropic)
- [ ] Design prompts for effort + logic + feedback
- [ ] Test on sample submissions

### Week 2: Integration
- [ ] Update `combine.py` with new weights (20/40/40)
- [ ] Integrate LLM calls into evaluation flow
- [ ] Add feedback generation
- [ ] Update submission schema

### Week 3: Frontend
- [ ] Fix exam creation (private test cases)
- [ ] Display LLM feedback in results
- [ ] Add improvement insights section
- [ ] Update scoring breakdown UI

### Week 4: Local LLM (Optional)
- [ ] Set up Ollama/llama.cpp
- [ ] Test local inference
- [ ] Implement fallback logic
- [ ] Performance optimization

### Week 5: Fine-tuning (Optional)
- [ ] Collect evaluation dataset
- [ ] Fine-tune model with LoRA
- [ ] Validate improvements
- [ ] Deploy fine-tuned model

---

## Deployment Considerations

### Local LLM Deployment Options

**Option 1: Same Server (Small Scale)**
```
Server Specs:
- CPU: 8+ cores
- RAM: 32GB+
- Storage: 20GB+ (for model)

Docker Compose:
services:
  fastapi:
    ...
  ollama:
    image: ollama/ollama
    volumes:
      - ollama-data:/root/.ollama
    ports:
      - "11434:11434"
```

**Option 2: Separate Inference Server (Recommended)**
```
Inference Server:
- GPU: NVIDIA with 8GB+ VRAM (optional, faster)
- RAM: 16GB+ (CPU inference)
- Model: Llama 3.1 8B Q4 (4-6GB)

FastAPI Server:
- Calls inference API over HTTP
- Can scale independently
```

**Option 3: Cloud Deployment**
- AWS: EC2 instance with GPU (g4dn.xlarge)
- GCP: Compute Engine with GPU
- Azure: VM with GPU
- Or: Use managed inference (SageMaker, Vertex AI)

### Cost Comparison

**API-based (OpenAI GPT-4o):**
- $0.01 per evaluation
- 100 students × 3 questions = $3/exam
- Monthly: $300 for 100 exams

**Local LLM (One-time):**
- Hardware: $500-2000 (server/GPU)
- Electricity: ~$50-100/month (running costs)
- **Break-even**: After ~50-100 exams (2-3 months)

---

## Next Steps

1. **Decide**: API-first or Local-first?
2. **If API**: Which provider? (OpenAI, Anthropic, Together.ai, etc.)
3. **If Local**: What hardware do you have available?
4. **Timeline**: Quick MVP with API, then migrate to local?

Would you like me to:
1. Start implementing the API-based version (faster)?
2. Set up local LLM infrastructure first?
3. Create a hybrid system with both?

