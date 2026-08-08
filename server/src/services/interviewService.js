import { randomUUID } from "node:crypto";

import { curriculum } from "../data/curriculum.js";
import {
  createSession,
  getSession,
  updateSession,
} from "./interviewSessionStore.js";
import {
  buildCandidateIntelligence,
} from "./candidateProfileService.js";
import {
  evaluateAnswerAndGenerateNextQuestion,
  generateFirstQuestion,
} from "./questionService.js";

const MINIMUM_QUESTIONS = 8;
const MINIMUM_DAYS = 4;

const getTopicName = (topic) => topic.title || topic.topic;

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
    const error = new Error("sessionId is required");
    error.statusCode = 400;
    throw error;
  }

  if (!candidate || typeof candidate !== "object") {
    const error = new Error("candidate is required");
    error.statusCode = 400;
    throw error;
  }

  if (getSession(sessionId)) {
    const error = new Error(
      `Interview session ${sessionId} already exists`,
    );

    error.statusCode = 409;
    throw error;
  }

  const candidateIntelligence =
    buildCandidateIntelligence(candidate);

  const initialTopic = selectInitialTopic(
    candidate,
    candidateIntelligence,
  );

  if (!initialTopic) {
    const error = new Error(
      "No curriculum topic is available",
    );

    error.statusCode = 500;
    throw error;
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
  };
};

export const submitInterviewAnswer = async ({
  sessionId,
  message,
}) => {
  if (!message || !message.trim()) {
    const error = new Error("message is required");
    error.statusCode = 400;
    throw error;
  }

  const session = getSession(sessionId);

  if (!session) {
    const error = new Error(
      `Interview session ${sessionId} not found`,
    );

    error.statusCode = 404;
    throw error;
  }

  if (session.status === "completed") {
    const error = new Error(
      "Interview session is already completed",
    );

    error.statusCode = 409;
    throw error;
  }

  const latestQuestion =
    session.questionsAsked[
      session.questionsAsked.length - 1
    ];

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
    const error = new Error(
      `Curriculum day ${latestQuestion.day} is not available`,
    );

    error.statusCode = 500;
    throw error;
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

  const action =
    evaluationResult.evaluation
      .recommendedAction;

  const useFollowUp =
    action === "follow_up" ||
    action === "probe_weakness";

  const nextTopic = useFollowUp
    ? currentTopic
    : selectNextTopic(session);

  const nextQuestion = {
    id: randomUUID(),
    text: evaluationResult.nextQuestion.text,
    day: nextTopic.day,
    topic: getTopicName(nextTopic),
    difficulty:
      evaluationResult.nextQuestion.difficulty,
  };

  const coveredDays = session.coveredDays.includes(
    nextTopic.day,
  )
    ? session.coveredDays
    : [
        ...session.coveredDays,
        nextTopic.day,
      ];

  const coveredTopics =
    session.coveredTopics.includes(
      getTopicName(nextTopic),
    )
      ? session.coveredTopics
      : [
          ...session.coveredTopics,
          getTopicName(nextTopic),
        ];

  const questionsAsked = [
    ...session.questionsAsked,
    nextQuestion,
  ];

  const conversation = [
    ...session.conversation,
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
    ...session,

    currentDay: nextTopic.day,
    currentTopic: getTopicName(nextTopic),
    currentDifficulty:
      nextQuestion.difficulty,

    questionsAsked,
    answers,
    evaluations,

    conversation,

    coveredDays,
    coveredTopics,

    followUps: useFollowUp
      ? [
          ...session.followUps,
          {
            questionId: nextQuestion.id,
            focus:
              evaluationResult
                .evaluation.followUpFocus,
          },
        ]
      : session.followUps,
  };

  if (hasMinimumCoverage(updatedSession)) {
    const feedback =
      buildFeedback(updatedSession);

    const completedSession =
      updateSession(sessionId, {
        ...updatedSession,
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

  const activeSession =
    updateSession(sessionId, {
      ...updatedSession,
      status: "active",
    });

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
    const error = new Error(
      `Interview session ${sessionId} not found`,
    );

    error.statusCode = 404;
    throw error;
  }

  return session;
};