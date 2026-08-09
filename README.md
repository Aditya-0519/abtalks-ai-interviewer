# ABTalks AI Interviewer

An adaptive AI technical interviewer that conducts conversational interviews based on a candidate's learning journey through the 31-day AI Cohort curriculum.

## Live Demo

https://abtalks-ai-interviewer-tau.vercel.app/      

## Repository

https://github.com/Aditya-0519/abtalks-ai-interviewer

---

## Problem

Learners may understand the systems they built but struggle to explain their technical decisions during an interview.

The AI Interviewer simulates a technical interview that adapts to the candidate's curriculum progress, demonstrated ability, and previous responses.

---

## Key Features

* Conversational technical interview
* Curriculum-aware questioning
* Adaptive follow-up questions
* Candidate-aware difficulty
* Multi-turn conversation context
* AI-powered answer evaluation
* Curriculum coverage tracking
* Structured interview feedback
* Controlled mock fallback for AI provider failures
* Mock mode for development and testing without external AI API calls

---

## How It Works

```text
Candidate Profile
        ↓
Interview Session
        ↓
Curriculum Topic Selection
        ↓
AI Question Generation
        ↓
Candidate Answer
        ↓
AI Answer Evaluation
        ↓
Adaptive Topic Selection
        ↓
Next Question
        ↓
Final Structured Feedback
```

---

## AI Availability & Fallback

The application normally runs in **live AI mode** using the configured Gemini model.

The interview backend also includes a controlled fallback mechanism for temporary AI provider failures.

If Gemini returns a quota/rate-limit error such as HTTP 429, or a temporary provider availability error, the backend:

1. Detects the provider failure.
2. Prevents the provider error from terminating the Express server.
3. Falls back to the application's deterministic mock interview response generator.
4. Continues the interview using the same interview lifecycle and API contract.

This ensures that temporary AI provider availability issues do not make the deployed application unusable during testing or judging.

The fallback does not change the interview session management or API contract.

### Interview AI Modes

The backend supports two modes through the `INTERVIEW_AI_MODE` environment variable.

#### Live Mode

```env
INTERVIEW_AI_MODE=live
```

In live mode, interview questions and answer evaluations are generated using Gemini.

#### Mock Mode

```env
INTERVIEW_AI_MODE=mock
```

Mock mode bypasses the external AI provider and uses deterministic responses. It is intended for local development, testing, and situations where external AI API access is unavailable.

---

## Interview Completion

The interview completes when both requirements are satisfied:

* At least **8 questions answered**
* At least **4 unique curriculum days covered**

The completion check happens after the latest answer is processed and before another question is generated.

This ensures that the interview cannot finish before the required minimum question count and curriculum coverage are achieved.

---

## Tech Stack

### Frontend

* React
* Vite
* Tailwind CSS
* Lucide React

### Backend

* Node.js
* Express

### AI

* Google Gemini
* Google GenAI SDK

### Storage

* In-memory interview session store

---

## Project Structure

```text
client/
  src/
    pages/
    ...

server/
  src/
    controllers/
    services/
    data/
    prompts/
    ...

README.md
PROMPTS.md
```
