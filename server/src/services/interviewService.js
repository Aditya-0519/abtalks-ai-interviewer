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

const countValues = (items, field) => {
  return items.reduce((counts, item) => {
    const value = item[field];

    if (value) {
      counts[value] = (counts[value] || 0) + 1;
    }

    return counts;
  }, {});
};

const getPerformanceLevel = (score) => {
  if (score >= 8.5) {
    return "excellent";
  }

  if (score >= 7) {
    return "strong";
  }

  if (score >= 5) {
    return "developing";
  }

  return "needs-improvement";
};

const getScoreRecommendation = (score) => {
  if (score >= 8.5) {
    return "Strong technical performance. Continue practicing system design trade-offs and explaining implementation decisions with precision.";
  }

  if (score >= 7) {
    return "Good technical foundation. Focus on deeper reasoning, edge cases, and communicating trade-offs more clearly.";
  }

  if (score >= 5) {
    return "The candidate demonstrates a developing foundation. Strengthen weaker curriculum areas and practice explaining concepts with concrete technical examples.";
  }

  return "The candidate should strengthen core technical concepts and practice structured explanations before attempting more advanced interview questions.";
};

const buildAreaAnalysis = (evaluations) => {
  const areaMap = new Map();

  for (const evaluation of evaluations) {
    const topic = evaluation.topic;

    if (!topic) {
      continue;
    }

    if (!areaMap.has(topic)) {
      areaMap.set(topic, {
        topic,
        questions: 0,
        totalScore: 0,
        strong: 0,
        weak: 0,
      });
    }

    const area = areaMap.get(topic);

    area.questions += 1;
    area.totalScore += evaluation.score;

    if (evaluation.understanding === "strong") {
      area.strong += 1;
    }

    if (
      evaluation.understanding === "weak" ||
      evaluation.technicalAccuracy === "weak"
    ) {
      area.weak += 1;
    }
  }

  return [...areaMap.values()]
    .map((area) => ({
      ...area,
      averageScore: Number(
        (area.totalScore / area.questions).toFixed(2),
      ),
    }))
    .sort((a, b) => b.averageScore - a.averageScore);
};

const buildFeedback = (session) => {
  const evaluations = session.evaluations;

  const overallScore = calculateAverageScore(evaluations);

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
        evaluation.understanding === "strong" &&
        evaluation.technicalAccuracy === "strong",
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

  const difficultyDistribution = countValues(
    session.questionsAsked,
    "difficulty",
  );

  const technicalAccuracyDistribution = countValues(
    evaluations,
    "technicalAccuracy",
  );

  const depthDistribution = countValues(
    evaluations,
    "depth",
  );

  const understandingDistribution = countValues(
    evaluations,
    "understanding",
  );

  const followUps = evaluations.filter(
    (evaluation) => evaluation.needsFollowUp,
  ).length;

  const areaAnalysis = buildAreaAnalysis(evaluations);

  const topStrengths = [
    ...new Set(strongestAreas),
  ].slice(0, 5);

  const topWeaknesses = [
    ...new Set(weakestAreas),
  ].slice(0, 5);

  return {
    overallScore,
    performanceLevel:
      getPerformanceLevel(overallScore),

    questionsEvaluated: evaluations.length,

    curriculumDaysCovered:
      session.coveredDays.length,

    coveredDays: session.coveredDays,

    coveredTopics: session.coveredTopics,

    performanceSummary:
      getScoreRecommendation(overallScore),

    strengths,
    gaps,

    strongestAreas: topStrengths,
    weakestAreas: topWeaknesses,

    statistics: {
      followUps,
      difficultyDistribution,
      technicalAccuracyDistribution,
      depthDistribution,
      understandingDistribution,
    },

    areaAnalysis,

    candidateIntelligence:
      session.candidateIntelligence,

    recommendation:
      getScoreRecommendation(overallScore),
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

  const nextQuestionResult =
    useFollowUp
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
    updateSession(
      sessionId,
      updatedSession,
    );

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