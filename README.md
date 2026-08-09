# ABTalks AI Interviewer

An adaptive AI technical interviewer that conducts conversational
interviews based on a candidate's learning journey through the
31-day AI Cohort curriculum.

## Live Demo

YOUR_DEPLOYED_URL

## Repository

YOUR_GITHUB_REPOSITORY_URL

---

## Problem

Learners may understand the systems they built but struggle to
explain their technical decisions in an interview.

The AI Interviewer simulates a technical interview that adapts to
the candidate's curriculum progress and responses.

---

## Key Features

- Conversational technical interview
- Curriculum-aware questioning
- Adaptive follow-up questions
- Candidate-aware difficulty
- Multi-turn conversation context
- Answer evaluation
- Curriculum coverage tracking
- Structured interview feedback
- Mock mode for testing without external AI API calls

---

## How It Works

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

---

## Interview Completion

The interview completes when both requirements are satisfied:

- At least 8 questions answered
- At least 4 unique curriculum days covered

The completion check happens after the latest answer is processed
and before another question is generated.

---

## Tech Stack

### Frontend

- React
- Vite
- Tailwind CSS
- Lucide React

### Backend

- Node.js
- Express

### AI

- Google Gemini / configured AI provider

### Storage

- In-memory interview session store

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