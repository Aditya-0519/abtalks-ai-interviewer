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
  const answer = extractJsonObject(
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

const mockEvaluation = ({
  prompt,
  includeNextQuestion = false,
}) => {
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

  const topic = extractTopic(prompt);

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

  /*
   * Keep mock feedback realistic.
   *
   * Even a strong answer can have a useful
   * improvement area. This prevents the mock
   * interviewer from producing unrealistically
   * perfect feedback for every answer.
   */
  const gaps =
    score >= 9
      ? [
          `Consider exploring deeper engineering trade-offs and edge cases in ${topic}.`,
        ]
      : score >= 8
        ? [
            `Add more implementation-level detail and explain the trade-offs involved in ${topic}.`,
          ]
        : [
            `Strengthen the technical explanation of ${topic} with a concrete example and clearer engineering reasoning.`,
          ];

  const strengths =
    score >= 8
      ? [
          "Clear technical explanation",
          "Relevant engineering reasoning",
        ]
      : [
          "Attempted the core concept",
        ];

  const result = {
    score: Math.min(score, 10),

    understanding:
      score >= 8
        ? "strong"
        : score >= 6
          ? "developing"
          : "weak",

    strengths,

    gaps,

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

    /*
     * Mock mode intentionally does not force
     * follow-ups because curriculum coverage is
     * controlled deterministically by interviewService.
     */
    needsFollowUp: false,
    followUpFocus: "",

    recommendedAction:
      "change_topic",
  };

  if (includeNextQuestion) {
    result.nextQuestion = mockQuestion(
      topic,
      nextDifficulty,
    );
  }

  return result;
};

const mockResponse = ({
  prompt,
  responseSchema,
}) => {
  const hasNextQuestion =
    responseSchema?.properties?.nextQuestion;

  const isEvaluation =
    responseSchema?.properties?.score;

  if (isEvaluation) {
    return mockEvaluation({
      prompt,
      includeNextQuestion:
        Boolean(hasNextQuestion),
    });
  }

  const difficulty =
    prompt.includes('"advanced"')
      ? "advanced"
      : prompt.includes('"intermediate"')
        ? "intermediate"
        : "foundational";

  return mockQuestion(
    extractTopic(prompt),
    difficulty,
  );
};

const isQuotaOrRateLimitError = (
  error,
) => {
  const message =
    error?.message ||
    error?.error?.message ||
    String(error);

  const status =
    error?.status ||
    error?.statusCode ||
    error?.code ||
    error?.error?.code;

  return (
    Number(status) === 429 ||
    /429|quota|rate.?limit|resource.?exhausted|too many requests|exceeded.*limit/i.test(
      message,
    )
  );
};

const isTemporaryProviderError = (
  error,
) => {
  const message =
    error?.message ||
    error?.error?.message ||
    String(error);

  const status =
    error?.status ||
    error?.statusCode ||
    error?.code ||
    error?.error?.code;

  return (
    [408, 429, 500, 502, 503, 504].includes(
      Number(status),
    ) ||
    /timeout|temporarily unavailable|service unavailable|internal server error|bad gateway|gateway timeout/i.test(
      message,
    )
  );
};

const generateMockFallback = ({
  prompt,
  responseSchema,
  reason,
}) => {
  console.warn(
    `⚠️ AI provider unavailable (${reason}). Using mock fallback.`,
  );

  return mockResponse({
    prompt,
    responseSchema,
  });
};

export const generateStructuredResponse =
  async ({
    systemInstruction,
    prompt,
    responseSchema,
  }) => {
    /*
     * Explicit mock mode.
     *
     * Useful for local development and testing
     * without consuming Gemini API quota.
     */
    if (env.INTERVIEW_AI_MODE === "mock") {
      return mockResponse({
        prompt,
        responseSchema,
      });
    }

    try {
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
    } catch (error) {
      /*
       * Provider failures must never crash the
       * Express server.
       *
       * Gemini quota/rate-limit errors and temporary
       * provider failures fall back to deterministic
       * mock behavior so the interview can continue.
       */
      if (isQuotaOrRateLimitError(error)) {
        return generateMockFallback({
          prompt,
          responseSchema,
          reason:
            "Gemini quota/rate limit reached",
        });
      }

      if (isTemporaryProviderError(error)) {
        return generateMockFallback({
          prompt,
          responseSchema,
          reason:
            "temporary AI provider failure",
        });
      }

      /*
       * Configuration/programming errors should still
       * surface during development instead of being
       * silently hidden.
       */
      throw error;
    }
  };