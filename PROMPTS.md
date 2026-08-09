# AI Usage Log — ABTalks AI Interviewer

## Project

ABTalks AI Interviewer

## Purpose

This document records the AI-assisted development process used during
the ABTalks Vibe Code Hackathon.

AI assistance was used for architecture discussion, implementation,
debugging, UI development, testing, and refinement.

---

# 1. Initial Product Planning

## Goal

Build an AI technical interviewer that:

- conducts a multi-turn interview
- uses the supplied curriculum
- adapts questions based on candidate responses
- generates follow-up questions
- maintains conversation context
- evaluates answers
- produces structured feedback

## AI-assisted work

Used AI to help break the problem statement into:

- frontend interview flow
- backend interview lifecycle
- candidate intelligence
- curriculum selection
- answer evaluation
- question generation
- feedback generation
- session state management

---

# 2. Backend Architecture

AI assistance was used to design and implement the backend services.

Main components:

- interview controller
- interview service
- question service
- AI service
- interview session store
- candidate profile service

The interview service became responsible for controlling the
interview lifecycle while the AI services handled question generation
and answer evaluation.

---

# 3. Curriculum-Aware Interviewing

The interview was designed around the supplied curriculum.

AI assistance was used to implement curriculum topic selection based on:

- candidate learning signals
- priority days
- previously covered days
- adaptive follow-up recommendations

The system tracks curriculum coverage using `coveredDays`.

A curriculum day is counted only after the candidate answers a
question belonging to that day.

---

# 4. Conversational Follow-Up Logic

The interviewer evaluates each candidate answer before selecting the
next question.

The evaluation can recommend:

- follow_up
- probe_weakness
- increase_difficulty
- change_topic

The backend uses this evaluation to adapt subsequent questions.

Follow-up questions remain part of the interview rather than using
a fixed questionnaire sequence.

---

# 5. Minimum Interview Requirements

The hackathon requires:

- at least 8 answered questions
- at least 4 different curriculum days

The interview service therefore checks:

`answers.length >= 8`

AND

`coveredDays.length >= 4`

before completing the interview.

The completion check occurs after processing the candidate's latest
answer and before generating another question.

This prevents an unnecessary Question 9 when the requirements have
already been satisfied.

---

# 6. Mock Mode

Mock mode was retained so the application can be tested without
depending on an external AI API quota.

Mock mode was used during development and testing of the complete
interview lifecycle.

The curriculum selection logic ensures that the interview can cover
multiple curriculum days during testing.

---

# 7. Frontend

AI assistance was used to implement the React interview experience.

The frontend:

- starts an interview session
- displays the current question
- submits candidate answers
- displays interview progress
- receives backend completion state
- stores final feedback
- navigates to `/feedback`

The backend remains the source of truth for interview completion.

---

# 8. Debugging and Iteration

AI assistance was used during debugging of:

- API communication
- interview session state
- curriculum coverage
- question/answer counting
- completion lifecycle
- mock mode
- progress display
- feedback generation
- frontend navigation

---

# 9. Final Completion Logic

The final interview lifecycle is:

1. Candidate submits an answer.
2. Answer is evaluated.
3. Answer is stored.
4. Curriculum coverage is updated.
5. Completion requirements are checked.
6. If requirements are satisfied, feedback is generated and the
   session is completed.
7. Otherwise, the next curriculum topic is selected.
8. The next question is generated.

The system never generates the next question before checking
completion.

---

# 10. Human Decisions

AI tools assisted with implementation and debugging, but the project
was iteratively reviewed, tested, and modified during development.

Final implementation decisions were made based on the hackathon
requirements and observed application behavior.


# 11. Final Validation

The final implementation was tested against the required interview
lifecycle:

- Minimum 8 answered questions
- Minimum 4 unique curriculum days
- Adaptive follow-up questions
- Conversation context preservation
- Structured final feedback
- Backend-controlled completion
- Mock-mode testing
- No Question 9 when the completion criteria are already satisfied

The implementation was reviewed and iteratively modified during
development based on observed application behavior.