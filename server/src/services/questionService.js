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
      enum: [
        "foundational",
        "intermediate",
        "advanced",
      ],
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
      enum: [
        "weak",
        "developing",
        "strong",
      ],
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
      enum: [
        "weak",
        "partial",
        "strong",
      ],
    },
    depth: {
      type: "string",
      enum: [
        "shallow",
        "moderate",
        "deep",
      ],
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
          enum: [
            "foundational",
            "intermediate",
            "advanced",
          ],
        },
      },
      required: [
        "text",
        "difficulty",
      ],
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

const getTopicName = (topic) =>
  topic.title || topic.topic;

export const generateFirstQuestion = async ({
  candidate,
  candidateIntelligence,
  curriculumTopic,
}) => {
  const prompt = `
Candidate:
${JSON.stringify(candidate, null, 2)}

Candidate intelligence:
${JSON.stringify(
  candidateIntelligence,
  null,
  2,
)}

Curriculum topic:
${JSON.stringify(
  curriculumTopic,
  null,
  2,
)}

Generate the first technical interview question.

The question must:

- test real understanding
- match the candidate's experience
- match the candidate's recommended difficulty
- prioritize learning areas that show weakness or repeated attempts
- remain grounded in the curriculum
- be suitable for a technical interview
- avoid requiring information outside the supplied curriculum
- be specific to the supplied curriculum topic
`;

  const result =
    await generateStructuredResponse({
      systemInstruction:
        interviewerSystemPrompt,
      prompt,
      responseSchema:
        questionSchema,
    });

  return buildQuestion({
    text: result.text,
    difficulty:
      result.difficulty,
    day: curriculumTopic.day,
    topic: getTopicName(curriculumTopic),
  });
};

export const generateQuestionForTopic =
  async ({
    candidate,
    candidateIntelligence,
    curriculumTopic,
    previousQuestions,
    previousAnswers,
    previousEvaluations,
    previousEvaluation,
  }) => {
    const prompt = `
Candidate:
${JSON.stringify(candidate, null, 2)}

Candidate intelligence:
${JSON.stringify(
  candidateIntelligence,
  null,
  2,
)}

Target curriculum topic:
${JSON.stringify(
  curriculumTopic,
  null,
  2,
)}

Previous questions:
${JSON.stringify(
  previousQuestions,
  null,
  2,
)}

Previous answers:
${JSON.stringify(
  previousAnswers,
  null,
  2,
)}

Previous evaluations:
${JSON.stringify(
  previousEvaluations,
  null,
  2,
)}

Latest evaluation:
${JSON.stringify(
  previousEvaluation,
  null,
  2,
)}

Generate exactly one new technical interview question
for the TARGET curriculum topic.

Requirements:

- The question MUST be grounded in the target curriculum topic.
- Do not ask about a previous topic merely because it appeared earlier.
- Do not repeat any previous question.
- Adapt difficulty to the candidate's demonstrated ability.
- Use the previous evaluation to guide difficulty.
- If the candidate demonstrated weakness, probe the underlying concept.
- If the candidate demonstrated strong understanding, increase depth.
- Keep the question suitable for a realistic technical interview.
- Do not provide the answer.
- Do not reveal internal reasoning.
`;

    const result =
      await generateStructuredResponse({
        systemInstruction:
          interviewerSystemPrompt,
        prompt,
        responseSchema:
          questionSchema,
      });

    return {
      text: result.text,
      difficulty:
        result.difficulty,
    };
  };

export const evaluateAnswerAndGenerateNextQuestion =
  async ({
    candidate,
    candidateIntelligence,
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
${JSON.stringify(
  candidate,
  null,
  2,
)}

Candidate intelligence:
${JSON.stringify(
  candidateIntelligence,
  null,
  2,
)}

Current curriculum topic:
${JSON.stringify(
  curriculumTopic,
  null,
  2,
)}

Latest question:
${JSON.stringify(
  latestQuestion,
  null,
  2,
)}

Candidate's latest answer:
${JSON.stringify(
  latestAnswer,
  null,
  2,
)}

Previous questions:
${JSON.stringify(
  previousQuestions,
  null,
  2,
)}

Previous answers:
${JSON.stringify(
  previousAnswers,
  null,
  2,
)}

Previous evaluations:
${JSON.stringify(
  previousEvaluations,
  null,
  2,
)}

Interview progress:
${JSON.stringify(
  progress,
  null,
  2,
)}

Evaluate the latest answer from 0 to 10.

Use the candidate intelligence when deciding whether:

- the candidate needs a follow-up
- the candidate needs a deeper question
- the candidate should move to another topic
- a weak or repeated-attempt area should be probed

The next question must:

- directly reflect the candidate's latest answer when a follow-up is appropriate
- avoid repeating previous questions
- increase difficulty when justified
- probe a weakness when necessary
- remain grounded in the current curriculum topic
- remain appropriate for a technical interview

Do not provide the candidate with an answer.

Do not reveal internal reasoning.

Generate exactly one next technical question.
`;

    const result =
      await generateStructuredResponse({
        systemInstruction:
          evaluationSystemPrompt,
        prompt,
        responseSchema:
          evaluationSchema,
      });

    return {
      evaluation: {
        score: result.score,
        understanding:
          result.understanding,
        strengths:
          result.strengths,
        gaps:
          result.gaps,
        technicalAccuracy:
          result.technicalAccuracy,
        depth: result.depth,
        needsFollowUp:
          result.needsFollowUp,
        followUpFocus:
          result.followUpFocus,
        recommendedAction:
          result.recommendedAction,
      },

      nextQuestion:
        result.nextQuestion,
    };
  };