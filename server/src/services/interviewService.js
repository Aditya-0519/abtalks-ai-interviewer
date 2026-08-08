import { randomUUID } from "node:crypto";

import { curriculum } from "../data/curriculum.js";
import {
  createSession,
  getSession,
  updateSession,
} from "./interviewSessionStore.js";
import { buildCandidateIntelligence } from "./candidateProfileService.js";
import {
  evaluateAnswerAndGenerateNextQuestion,
  generateFirstQuestion,
  generateQuestionForTopic,
} from "./questionService.js";

const MINIMUM_QUESTIONS = 8;
const MINIMUM_DAYS = 4;

const getTopicName = (topic) => topic.title || topic.topic;

const createHttpError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const selectInitialTopic = (candidate, intelligence) => {
  const priorityDays = new Set(
    intelligence.learningSignals.priorityDays,
  );

  const priorityTopic = curriculum.find((topic) =>
    priorityDays.has(topic.day),
  );

  if (priorityTopic) {
    return priorityTopic;
  }

  return (
    curriculum.find((topic) => topic.day === 7) ||
    curriculum[0]
  );
};

const selectNextTopic = (session) => {
  const coveredDays = new Set(session.coveredDays);

  const priorityDays = new Set(
    session.candidateIntelligence.learningSignals.priorityDays,
  );

  const priorityTopic = curriculum.find(
    (topic) =>
      priorityDays.has(topic.day) &&
      !coveredDays.has(topic.day),
  );

  if (priorityTopic) {
    return priorityTopic;
  }

  const uncoveredTopic = curriculum.find(
    (topic) => !coveredDays.has(topic.day),
  );

  if (uncoveredTopic) {
    return uncoveredTopic;
  }

  return curriculum[
    session.questionsAsked.length % curriculum.length
  ];
};

const hasMinimumCoverage = (session) => {
  return (
    session.questionsAsked.length >= MINIMUM_QUESTIONS &&
    session.answers.length >= MINIMUM_QUESTIONS &&
    session.coveredDays.length >= MINIMUM_DAYS
  );
};

const calculateAverageScore = (evaluations) => {
  if (evaluations.length === 0) {
    return 0;
  }

  const total = evaluations.reduce(
    (sum, evaluation) => sum + evaluation.score,
    0,
  );

  return Number((total / evaluations.length).toFixed(2));
};

const collectUniqueItems = (evaluations, field) => {
  const items = evaluations.flatMap(
    (evaluation) => evaluation[field] || [],
  );

  return [...new Set(items)];
};

const buildFeedback = (session) => {
  const evaluations = session.evaluations;

  const averageScore = calculateAverageScore(evaluations);

  const strengths = collectUniqueItems(
    evaluations,
    "strengths",
  );

  const gaps = collectUniqueItems(
    evaluations,
    "gaps",
  );

  const strongestAreas = evaluations
    .filter(
      (evaluation) =>
        evaluation.understanding === "strong",
    )
    .map((evaluation) => evaluation.topic)
    .filter(Boolean);

  const weakestAreas = evaluations
    .filter(
      (evaluation) =>
        evaluation.understanding === "weak" ||
        evaluation.technicalAccuracy === "weak",
    )
    .map((evaluation) => evaluation.topic)
    .filter(Boolean);

  return {
    overallScore: averageScore,
    questionsEvaluated: evaluations.length,
    curriculumDaysCovered: session.coveredDays.length,
    coveredDays: session.coveredDays,
    strengths,
    gaps,
    strongestAreas: [...new Set(strongestAreas)],
    weakestAreas: [...new Set(weakestAreas)],
    candidateIntelligence:
      session.candidateIntelligence,
    recommendation:
      averageScore >= 8
        ? "Strong technical understanding demonstrated across the interview."
        : averageScore >= 6
          ? "Good foundation demonstrated, with several areas that would benefit from deeper technical practice."
          : "The candidate should strengthen core concepts and practice explaining technical decisions with greater depth.",
  };
};

const buildProgress = (session) => ({
  questionsAsked: session.questionsAsked.length,
  questionsAnswered: session.answers.length,
  minimumQuestions: MINIMUM_QUESTIONS,
  daysCovered: session.coveredDays.length,
  minimumDays: MINIMUM_DAYS,
  coveredDays: session.coveredDays,
  status: session.status,
});

export const startInterview = async ({
  sessionId,
  candidate,
}) => {
  if (!sessionId) {
    throw createHttpError(
      "sessionId is required",
      400,
    );
  }

  if (!candidate || typeof candidate !== "object") {
    throw createHttpError(
      "candidate is required",
      400,
    );
  }

  if (getSession(sessionId)) {
    throw createHttpError(
      `Interview session ${sessionId} already exists`,
      409,
    );
  }

  const candidateIntelligence =
    buildCandidateIntelligence(candidate);

  const initialTopic = selectInitialTopic(
    candidate,
    candidateIntelligence,
  );

  if (!initialTopic) {
    throw createHttpError(
      "No curriculum topic is available",
      500,
    );
  }

  const question = await generateFirstQuestion({
    candidate,
    candidateIntelligence,
    curriculumTopic: initialTopic,
  });

  const session = {
    id: sessionId,
    candidate,
    candidateIntelligence,

    status: "active",
    startedAt: new Date().toISOString(),

    currentDay: initialTopic.day,
    currentTopic: getTopicName(initialTopic),
    currentDifficulty: question.difficulty,

    questionsAsked: [question],
    answers: [],
    evaluations: [],

    conversation: [
      {
        role: "interviewer",
        questionId: question.id,
        text: question.text,
        day: question.day,
        topic: question.topic,
      },
    ],

    coveredDays: [initialTopic.day],
    coveredTopics: [
      getTopicName(initialTopic),
    ],

    followUps: [],

    feedback: null,

    minimumQuestions: MINIMUM_QUESTIONS,
    minimumDays: MINIMUM_DAYS,
  };

  createSession(session);

  return {
    reply: question.text,
    done: false,
    progress: buildProgress(session),
  };
};

export const submitInterviewAnswer = async ({
  sessionId,
  message,
}) => {
  if (!message || !message.trim()) {
    throw createHttpError(
      "message is required",
      400,
    );
  }

  const session = getSession(sessionId);

  if (!session) {
    throw createHttpError(
      `Interview session ${sessionId} not found`,
      404,
    );
  }

  if (session.status === "completed") {
    throw createHttpError(
      "Interview session is already completed",
      409,
    );
  }

  const latestQuestion =
    session.questionsAsked[
      session.questionsAsked.length - 1
    ];

  if (!latestQuestion) {
    throw createHttpError(
      "Interview session has no active question",
      500,
    );
  }

  const latestAnswer = {
    id: randomUUID(),
    questionId: latestQuestion.id,
    text: message.trim(),
    createdAt: new Date().toISOString(),
  };

  const currentTopic = curriculum.find(
    (topic) =>
      topic.day === latestQuestion.day,
  );

  if (!currentTopic) {
    throw createHttpError(
      `Curriculum day ${latestQuestion.day} is not available`,
      500,
    );
  }

  const evaluationResult =
    await evaluateAnswerAndGenerateNextQuestion({
      candidate: session.candidate,
      candidateIntelligence:
        session.candidateIntelligence,
      curriculumTopic: currentTopic,
      previousQuestions:
        session.questionsAsked,
      previousAnswers: session.answers,
      previousEvaluations:
        session.evaluations,
      latestQuestion,
      latestAnswer,
      progress: buildProgress(session),
    });

  const answerRecord = {
    ...latestAnswer,
    question: latestQuestion.text,
    day: latestQuestion.day,
    topic: latestQuestion.topic,
  };

  const evaluationRecord = {
    questionId: latestQuestion.id,
    answerId: latestAnswer.id,
    topic: latestQuestion.topic,
    day: latestQuestion.day,
    ...evaluationResult.evaluation,
    createdAt: new Date().toISOString(),
  };

  const answers = [
    ...session.answers,
    answerRecord,
  ];

  const evaluations = [
    ...session.evaluations,
    evaluationRecord,
  ];

  const answeredSession = {
    ...session,
    answers,
    evaluations,
  };

  /*
   * Completion is checked BEFORE generating another question.
   *
   * This prevents the interview from claiming completion
   * immediately after generating question #8. The candidate
   * must actually answer all minimum required questions.
   */
  if (hasMinimumCoverage(answeredSession)) {
    const feedback =
      buildFeedback(answeredSession);

    const completedSession =
      updateSession(sessionId, {
        ...answeredSession,
        status: "completed",
        completedAt:
          new Date().toISOString(),
        feedback,
      });

    return {
      reply: "Interview completed.",
      done: true,
      feedback:
        completedSession.feedback,
    };
  }

  const action =
    evaluationResult.evaluation
      .recommendedAction;

  const useFollowUp =
    action === "follow_up" ||
    action === "probe_weakness";

  const nextTopic = useFollowUp
    ? currentTopic
    : selectNextTopic(answeredSession);

  /*
   * If the AI decides to change topic, generate a fresh
   * question grounded in the selected curriculum topic.
   *
   * This prevents the question's topic from disagreeing
   * with session.currentTopic.
   */
  const nextQuestionResult = useFollowUp
    ? evaluationResult.nextQuestion
    : await generateQuestionForTopic({
        candidate: session.candidate,
        candidateIntelligence:
          session.candidateIntelligence,
        curriculumTopic: nextTopic,
        previousQuestions:
          session.questionsAsked,
        previousAnswers: answers,
        previousEvaluations:
          evaluations,
        previousEvaluation:
          evaluationResult.evaluation,
      });

  const nextQuestion = {
    id: randomUUID(),
    text: nextQuestionResult.text,
    day: nextTopic.day,
    topic: getTopicName(nextTopic),
    difficulty:
      nextQuestionResult.difficulty,
  };

  const coveredDays =
    answeredSession.coveredDays.includes(
      nextTopic.day,
    )
      ? answeredSession.coveredDays
      : [
          ...answeredSession.coveredDays,
          nextTopic.day,
        ];

  const coveredTopics =
    answeredSession.coveredTopics.includes(
      getTopicName(nextTopic),
    )
      ? answeredSession.coveredTopics
      : [
          ...answeredSession.coveredTopics,
          getTopicName(nextTopic),
        ];

  const questionsAsked = [
    ...answeredSession.questionsAsked,
    nextQuestion,
  ];

  const conversation = [
    ...answeredSession.conversation,
    {
      role: "candidate",
      answerId: latestAnswer.id,
      questionId: latestQuestion.id,
      text: latestAnswer.text,
    },
    {
      role: "interviewer",
      questionId: nextQuestion.id,
      text: nextQuestion.text,
      day: nextQuestion.day,
      topic: nextQuestion.topic,
    },
  ];

  const updatedSession = {
    ...answeredSession,

    currentDay: nextTopic.day,
    currentTopic: getTopicName(nextTopic),
    currentDifficulty:
      nextQuestion.difficulty,

    questionsAsked,
    conversation,

    coveredDays,
    coveredTopics,

    followUps: useFollowUp
      ? [
          ...answeredSession.followUps,
          {
            questionId: nextQuestion.id,
            focus:
              evaluationResult
                .evaluation
                .followUpFocus,
          },
        ]
      : answeredSession.followUps,

    status: "active",
  };

  const activeSession =
    updateSession(sessionId, updatedSession);

  return {
    reply: nextQuestion.text,
    done: false,
    progress:
      buildProgress(activeSession),
  };
};

export const getInterviewSession = (
  sessionId,
) => {
  const session = getSession(sessionId);

  if (!session) {
    throw createHttpError(
      `Interview session ${sessionId} not found`,
      404,
    );
  }

  return session;
};