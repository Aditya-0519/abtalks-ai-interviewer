import { randomUUID } from "node:crypto";

import { generateStructuredResponse } from "./aiService.js";
import { interviewerSystemPrompt } from "../prompts/interviewerPrompt.js";
import { evaluationSystemPrompt } from "../prompts/evaluationPrompt.js";

const questionSchema = {
  type: "object",
  properties: {
    text: {
      type: "string",
    },
    difficulty: {
      type: "string",
      enum: ["foundational", "intermediate", "advanced"],
    },
  },
  required: ["text", "difficulty"],
};

const evaluationSchema = {
  type: "object",
  properties: {
    score: {
      type: "number",
      minimum: 0,
      maximum: 10,
    },
    understanding: {
      type: "string",
      enum: ["weak", "developing", "strong"],
    },
    strengths: {
      type: "array",
      items: {
        type: "string",
      },
    },
    gaps: {
      type: "array",
      items: {
        type: "string",
      },
    },
    technicalAccuracy: {
      type: "string",
      enum: ["weak", "partial", "strong"],
    },
    depth: {
      type: "string",
      enum: ["shallow", "moderate", "deep"],
    },
    needsFollowUp: {
      type: "boolean",
    },
    followUpFocus: {
      type: "string",
    },
    recommendedAction: {
      type: "string",
      enum: [
        "follow_up",
        "increase_difficulty",
        "change_topic",
        "probe_weakness",
      ],
    },
    nextQuestion: {
      type: "object",
      properties: {
        text: {
          type: "string",
        },
        difficulty: {
          type: "string",
          enum: ["foundational", "intermediate", "advanced"],
        },
      },
      required: ["text", "difficulty"],
    },
  },
  required: [
    "score",
    "understanding",
    "strengths",
    "gaps",
    "technicalAccuracy",
    "depth",
    "needsFollowUp",
    "followUpFocus",
    "recommendedAction",
    "nextQuestion",
  ],
};

const buildQuestion = ({
  text,
  difficulty,
  day,
  topic,
}) => ({
  id: randomUUID(),
  text,
  day,
  topic,
  difficulty,
});

export const generateFirstQuestion = async ({
  candidate,
  curriculumTopic,
}) => {
  const prompt = `
Candidate:
${JSON.stringify(candidate, null, 2)}

Curriculum topic:
${JSON.stringify(curriculumTopic, null, 2)}

Generate the first technical interview question.

The question should:
- test real understanding
- match the candidate's experience
- remain grounded in the curriculum
- be suitable for a technical interview
- avoid requiring information outside the supplied curriculum
`;

  const result = await generateStructuredResponse({
    systemInstruction: interviewerSystemPrompt,
    prompt,
    responseSchema: questionSchema,
  });

  return buildQuestion({
    text: result.text,
    difficulty: result.difficulty,
    day: curriculumTopic.day,
    topic: curriculumTopic.title || curriculumTopic.topic,
  });
};

export const evaluateAnswerAndGenerateNextQuestion = async ({
  candidate,
  curriculumTopic,
  previousQuestions,
  previousAnswers,
  previousEvaluations,
  latestQuestion,
  latestAnswer,
  progress,
}) => {
  const prompt = `
Candidate profile:
${JSON.stringify(candidate, null, 2)}

Current curriculum topic:
${JSON.stringify(curriculumTopic, null, 2)}

Latest question:
${JSON.stringify(latestQuestion, null, 2)}

Candidate's latest answer:
${JSON.stringify(latestAnswer, null, 2)}

Previous questions:
${JSON.stringify(previousQuestions, null, 2)}

Previous answers:
${JSON.stringify(previousAnswers, null, 2)}

Previous evaluations:
${JSON.stringify(previousEvaluations, null, 2)}

Interview progress:
${JSON.stringify(progress, null, 2)}

Evaluate the latest answer from 0 to 10.

Then determine the best next interviewer action.

The next question must:
- directly reflect the candidate's latest answer
- avoid repeating previous questions
- use the current curriculum context when a follow-up is appropriate
- increase difficulty when justified
- probe a weakness when necessary
- move toward uncovered curriculum days when appropriate
- remain appropriate for a technical interview

Do not provide the candidate with an answer.

Do not reveal internal reasoning.

Generate exactly one next technical question.
`;

  const result = await generateStructuredResponse({
    systemInstruction: evaluationSystemPrompt,
    prompt,
    responseSchema: evaluationSchema,
  });

  return {
    evaluation: {
      score: result.score,
      understanding: result.understanding,
      strengths: result.strengths,
      gaps: result.gaps,
      technicalAccuracy: result.technicalAccuracy,
      depth: result.depth,
      needsFollowUp: result.needsFollowUp,
      followUpFocus: result.followUpFocus,
      recommendedAction: result.recommendedAction,
    },
    nextQuestion: result.nextQuestion,
  };
};