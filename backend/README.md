# AI Interview Committee Platform

This repository contains the backend service for the AI Interview Committee platform, a production-ready application that powers an AI hiring assistant.

## System Overview

The backend orchestrates multiple AI agents to perform the following:
1. **Resume Analysis**: Analyzes resumes against Job Descriptions.
2. **Question Generation**: Generates a 3-tier interview question bank based on skills and experience.
3. **Answer Evaluation**: Evaluates candidate answers in real-time.
4. **Hiring Verdict**: Aggregates interview data to produce a final hire/no-hire decision with a reasoning trace.

## Architecture

The system is built horizontally to separate concerns:
- **API (`app/api/`)**: FastAPI routes that expose endpoints and rely on dependency injection for services.
- **Services (`app/services/`)**: The orchestration layer. Routes call services, which in turn orchestrate the agents.
- **Agents (`app/agents/`)**: Specialized classes acting as domain experts (ResumeAnalyzer, QuestionGenerator, etc.). They use an injected LLM Client.
- **Core (`app/core/`)**: Cross-cutting concerns such as configuration, structured logging, and the centralized, robust `LLMClient` wrapping the Gemini API.
- **Models (`app/models/`)**: Strict Pydantic v2 schemas validating all incoming requests, LLM outputs, and outgoing HTTP responses.
- **Utils (`app/utils/`)**: Utility functions, notably robust JSON extraction handling malformed LLM outputs.

## Production-Oriented Design
- **Async Everywhere**: The backend utilizes `async`/`await` from the route level down to the LLM client, allowing for high concurrency and performance.
- **Structured Logging**: Instead of raw prints, the system uses a centralized logging configuration.
- **Strong Typing**: Python type hints and strictly typed Pydantic models validate data at boundaries, preventing "dict-passing" and silent failures.
- **Resilience**: The custom `LLMClient` implements retries, timeouts, and structured error handling for Google Generative AI capabilities.

## Local Setup

### Requirements
- Python 3.11+
- pip

### Installation
1. Clone the repository and navigate into the folder.
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Copy the environment example file:
   ```bash
   cp .env.example .env
   ```
4. Insert your Gemini API Key in the `.env` file.

### Running the Server
Run the FastAPI application with Uvicorn from inside the backend directory:
```bash
cd backend
uvicorn app.main:app --reload
```

The application will be accessible at `http://127.0.0.1:8000`. You can visit `http://127.0.0.1:8000/docs` to view the auto-generated Swagger UI.
