import { GoogleGenAI } from "@google/genai";

import { env } from "../config/env.js";

const createClient = () => {
  if (!env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  return new GoogleGenAI({
    apiKey: env.GEMINI_API_KEY,
  });
};

const extractJsonObject = (prompt, label) => {
  const start = prompt.indexOf(label);

  if (start === -1) {
    return null;
  }

  const jsonStart = prompt.indexOf("{", start);

  if (jsonStart === -1) {
    return null;
  }

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (
    let index = jsonStart;
    index < prompt.length;
    index += 1
  ) {
    const character = prompt[index];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (character === "\\") {
      escaped = true;
      continue;
    }

    if (character === '"') {
      inString = !inString;
      continue;
    }

    if (inString) {
      continue;
    }

    if (character === "{") {
      depth += 1;
    }

    if (character === "}") {
      depth -= 1;

      if (depth === 0) {
        try {
          return JSON.parse(
            prompt.slice(
              jsonStart,
              index + 1,
            ),
          );
        } catch {
          return null;
        }
      }
    }
  }

  return null;
};

const extractTopic = (prompt) => {
  const topic =
    extractJsonObject(
      prompt,
      "Current curriculum topic:",
    ) ||
    extractJsonObject(
      prompt,
      "Target curriculum topic:",
    ) ||
    extractJsonObject(
      prompt,
      "Curriculum topic:",
    );

  return (
    topic?.title ||
    topic?.topic ||
    "Technical Engineering"
  );
};

const extractAnswer = (prompt) => {
  const answer =
    extractJsonObject(
      prompt,
      "Candidate's latest answer:",
    );

  return answer?.text || "";
};

const mockQuestion = (
  topic,
  difficulty,
) => ({
  text: `In a real engineering system, how would you explain and apply ${topic} at a ${difficulty} level? Include the key concept, one practical use case, and an important trade-off.`,
  difficulty,
});

const mockResponse = ({
  prompt,
  responseSchema,
}) => {
  const hasNextQuestion =
    responseSchema?.properties?.nextQuestion;

  const isEvaluation =
    responseSchema?.properties?.score;

  if (isEvaluation && !hasNextQuestion) {
    const answer = extractAnswer(prompt);
    const normalizedAnswer =
      answer.toLowerCase();

    const answerLength =
      answer.trim().length;

    let score = 5;

    if (answerLength >= 120) {
      score = 8;
    } else if (answerLength >= 60) {
      score = 7;
    }

    const hasTechnicalSignal =
      /because|trade-?off|example|latency|accuracy|scalab|embedding|retriev|vector|model|database|api|system|index/i.test(
        normalizedAnswer,
      );

    if (
      hasTechnicalSignal &&
      score < 9
    ) {
      score += 1;
    }

    return {
      score: Math.min(score, 10),

      understanding:
        score >= 8
          ? "strong"
          : score >= 6
            ? "developing"
            : "weak",

      strengths:
        score >= 8
          ? [
              "Clear technical explanation",
              "Relevant engineering reasoning",
            ]
          : [
              "Attempted the core concept",
            ],

      gaps:
        score >= 8
          ? []
          : [
              `Add more technical depth when explaining ${extractTopic(prompt)}`,
            ],

      technicalAccuracy:
        score >= 8
          ? "strong"
          : score >= 6
            ? "partial"
            : "weak",

      depth:
        score >= 8
          ? "deep"
          : score >= 6
            ? "moderate"
            : "shallow",

      needsFollowUp: false,
      followUpFocus: "",

      recommendedAction:
        "change_topic",
    };
  }

  if (!hasNextQuestion) {
    const difficulty =
      prompt.includes('"advanced"')
        ? "advanced"
        : "foundational";

    return mockQuestion(
      extractTopic(prompt),
      difficulty,
    );
  }

  const answer = extractAnswer(prompt);
  const normalizedAnswer =
    answer.toLowerCase();

  const answerLength =
    answer.trim().length;

  let score = 5;

  if (answerLength >= 120) {
    score = 8;
  } else if (answerLength >= 60) {
    score = 7;
  }

  const hasTechnicalSignal =
    /because|trade-?off|example|latency|accuracy|scalab|embedding|retriev|vector|model|database|api|system|index/i.test(
      normalizedAnswer,
    );

  if (
    hasTechnicalSignal &&
    score < 9
  ) {
    score += 1;
  }

  const currentDifficulty =
    prompt.includes('"advanced"')
      ? "advanced"
      : prompt.includes('"intermediate"')
        ? "intermediate"
        : "foundational";

  const nextDifficulty =
    score >= 8
      ? currentDifficulty ===
        "foundational"
        ? "intermediate"
        : "advanced"
      : currentDifficulty;

  const topic = extractTopic(prompt);

  return {
    score: Math.min(score, 10),

    understanding:
      score >= 8
        ? "strong"
        : score >= 6
          ? "developing"
          : "weak",

    strengths:
      score >= 8
        ? [
            "Clear technical explanation",
            "Relevant engineering reasoning",
          ]
        : [
            "Attempted the core concept",
          ],

    gaps:
      score >= 8
        ? []
        : [
            `Add more technical depth when explaining ${topic}`,
          ],

    technicalAccuracy:
      score >= 8
        ? "strong"
        : score >= 6
          ? "partial"
          : "weak",

    depth:
      score >= 8
        ? "deep"
        : score >= 6
          ? "moderate"
          : "shallow",

    needsFollowUp: false,
    followUpFocus: "",

    recommendedAction:
      "change_topic",

    nextQuestion: mockQuestion(
      topic,
      nextDifficulty,
    ),
  };
};

export const generateStructuredResponse =
  async ({
    systemInstruction,
    prompt,
    responseSchema,
  }) => {
    if (
      env.INTERVIEW_AI_MODE ===
      "mock"
    ) {
      return mockResponse({
        prompt,
        responseSchema,
      });
    }

    const client = createClient();

    const response =
      await client.models.generateContent({
        model: env.GEMINI_MODEL,
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType:
            "application/json",
          responseSchema,
        },
      });

    if (!response.text) {
      throw new Error(
        "AI provider returned an empty response",
      );
    }

    try {
      return JSON.parse(
        response.text,
      );
    } catch {
      throw new Error(
        "AI provider returned invalid JSON",
      );
    }
  };