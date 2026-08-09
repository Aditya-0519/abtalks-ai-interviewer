import { randomUUID } from "node:crypto";

import { curriculum } from "../data/curriculum.js";
import {
  createSession,
  getSession,
  updateSession,
} from "./interviewSessionStore.js";
import { buildCandidateIntelligence } from "./candidateProfileService.js";
import {
  evaluateAnswer,
  generateFirstQuestion,
  generateQuestionForTopic,
} from "./questionService.js";

const MINIMUM_QUESTIONS = 8;
const MINIMUM_DAYS = 4;

const getTopicName = (topic) =>
  topic.title || topic.topic;

const createHttpError = (
  message,
  statusCode,
) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const selectInitialTopic = (
  candidate,
  intelligence,
) => {
  const priorityDays = new Set(
    intelligence.learningSignals.priorityDays,
  );

  const priorityTopic = curriculum.find(
    (topic) =>
      priorityDays.has(topic.day),
  );

  if (priorityTopic) {
    return priorityTopic;
  }

  return (
    curriculum.find(
      (topic) => topic.day === 7,
    ) || curriculum[0]
  );
};

/*
 * Select an uncovered curriculum topic while
 * the interview still needs minimum coverage.
 *
 * Priority days are preferred, but the returned
 * topic MUST belong to a day that has not yet
 * been covered.
 */
const selectRequiredCoverageTopic = (
  session,
) => {
  const coveredDays = new Set(
    session.coveredDays,
  );

  const priorityDays = new Set(
    session.candidateIntelligence
      .learningSignals.priorityDays,
  );

  const priorityTopic = curriculum.find(
    (topic) =>
      priorityDays.has(topic.day) &&
      !coveredDays.has(topic.day),
  );

  if (priorityTopic) {
    return priorityTopic;
  }

  return curriculum.find(
    (topic) =>
      !coveredDays.has(topic.day),
  );
};

const selectNextTopic = (session) => {
  const coveredDays = new Set(
    session.coveredDays,
  );

  const priorityDays = new Set(
    session.candidateIntelligence
      .learningSignals.priorityDays,
  );

  const priorityTopic = curriculum.find(
    (topic) =>
      priorityDays.has(topic.day) &&
      !coveredDays.has(topic.day),
  );

  if (priorityTopic) {
    return priorityTopic;
  }

  const uncoveredTopic =
    curriculum.find(
      (topic) =>
        !coveredDays.has(topic.day),
    );

  if (uncoveredTopic) {
    return uncoveredTopic;
  }

  return curriculum[
    session.questionsAsked.length %
      curriculum.length
  ];
};

const hasMinimumCoverage = (session) => {
  return (
    session.answers.length >=
      MINIMUM_QUESTIONS &&
    session.coveredDays.length >=
      MINIMUM_DAYS
  );
};

const calculateAverageScore = (
  evaluations,
) => {
  if (evaluations.length === 0) {
    return 0;
  }

  const total = evaluations.reduce(
    (sum, evaluation) =>
      sum + evaluation.score,
    0,
  );

  return Number(
    (
      total / evaluations.length
    ).toFixed(2),
  );
};

const collectUniqueItems = (
  evaluations,
  field,
) => {
  const items = evaluations.flatMap(
    (evaluation) =>
      evaluation[field] || [],
  );

  return [...new Set(items)];
};

const buildFeedback = (session) => {
  const evaluations =
    session.evaluations;

  const averageScore =
    calculateAverageScore(
      evaluations,
    );

  const strengths =
    collectUniqueItems(
      evaluations,
      "strengths",
    );

  let gaps = collectUniqueItems(
    evaluations,
    "gaps",
  );

  /*
   * Some providers may return an empty gaps array
   * even when the candidate still has room to improve.
   *
   * Derive useful improvement areas from lower-scoring
   * evaluations instead of showing an empty report.
   */
  if (gaps.length === 0) {
    gaps = evaluations
      .filter(
        (evaluation) =>
          Number(evaluation.score) < 9,
      )
      .map(
        (evaluation) =>
          evaluation.topic
            ? `Deepen your understanding of ${evaluation.topic} and explain its implementation trade-offs more precisely.`
            : "Provide more implementation-level detail and explain technical trade-offs more precisely.",
      )
      .filter(Boolean);
  }

  /*
   * Absolute fallback for unusually strong interviews.
   * A strong candidate can still have actionable feedback.
   */
  if (gaps.length === 0) {
    gaps = [
      "Continue practicing deeper system-design reasoning, edge cases, and implementation trade-offs.",
    ];
  }

  const strongestAreas =
    evaluations
      .filter(
        (evaluation) =>
          evaluation.understanding ===
          "strong",
      )
      .map(
        (evaluation) =>
          evaluation.topic,
      )
      .filter(Boolean);

  /*
   * Find genuinely weaker curriculum areas.
   *
   * This is more useful than only looking for the
   * literal "weak" classification because a candidate
   * can be developing/partial without being completely weak.
   */
  const topicScores = new Map();

  evaluations.forEach(
    (evaluation) => {
      if (!evaluation.topic) {
        return;
      }

      const existing =
        topicScores.get(
          evaluation.topic,
        );

      if (!existing) {
        topicScores.set(
          evaluation.topic,
          {
            total:
              Number(
                evaluation.score,
              ) || 0,
            count: 1,
          },
        );

        return;
      }

      existing.total +=
        Number(
          evaluation.score,
        ) || 0;

      existing.count += 1;
    },
  );

  const weakestAreas = [
    ...topicScores.entries(),
  ]
    .map(
      ([topic, data]) => ({
        topic,
        average:
          data.total / data.count,
      }),
    )
    .sort(
      (a, b) =>
        a.average - b.average,
    )
    .slice(0, 3)
    .filter(
      (item) =>
        item.average < 8,
    )
    .map(
      (item) => item.topic,
    );

  return {
    overallScore:
      averageScore,

    questionsEvaluated:
      evaluations.length,

    curriculumDaysCovered:
      session.coveredDays.length,

    coveredDays:
      session.coveredDays,

    strengths,

    gaps,

    strongestAreas: [
      ...new Set(
        strongestAreas,
      ),
    ],

    weakestAreas,

    recommendation:
      averageScore >= 8
        ? "Strong technical understanding demonstrated across the interview. Continue developing deeper implementation trade-offs and system-level reasoning."
        : averageScore >= 6
          ? "Good foundation demonstrated, with several areas that would benefit from deeper technical practice."
          : "The candidate should strengthen core concepts and practice explaining technical decisions with greater depth.",
  };
};

const buildProgress = (
  session,
) => ({
  questionsAsked:
    session.questionsAsked.length,

  questionsAnswered:
    session.answers.length,

  minimumQuestions:
    MINIMUM_QUESTIONS,

  daysCovered:
    session.coveredDays.length,

  minimumDays:
    MINIMUM_DAYS,

  coveredDays:
    session.coveredDays,

  status:
    session.status,
});

export const startInterview =
  async ({
    sessionId,
    candidate,
  }) => {
    if (!sessionId) {
      throw createHttpError(
        "sessionId is required",
        400,
      );
    }

    if (
      !candidate ||
      typeof candidate !==
        "object"
    ) {
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
      buildCandidateIntelligence(
        candidate,
      );

    const initialTopic =
      selectInitialTopic(
        candidate,
        candidateIntelligence,
      );

    if (!initialTopic) {
      throw createHttpError(
        "No curriculum topic is available",
        500,
      );
    }

    const question =
      await generateFirstQuestion({
        candidate,
        candidateIntelligence,
        curriculumTopic:
          initialTopic,
      });

    const session = {
      id: sessionId,

      candidate,

      candidateIntelligence,

      status: "active",

      startedAt:
        new Date().toISOString(),

      currentDay:
        initialTopic.day,

      currentTopic:
        getTopicName(
          initialTopic,
        ),

      currentDifficulty:
        question.difficulty,

      questionsAsked: [
        question,
      ],

      answers: [],

      evaluations: [],

      conversation: [
        {
          role: "interviewer",
          questionId:
            question.id,
          text: question.text,
          day: question.day,
          topic: question.topic,
        },
      ],

      /*
       * A curriculum day becomes covered
       * ONLY after the candidate answers
       * a question from that day.
       */
      coveredDays: [],

      coveredTopics: [],

      followUps: [],

      feedback: null,

      minimumQuestions:
        MINIMUM_QUESTIONS,

      minimumDays:
        MINIMUM_DAYS,
    };

    createSession(session);

    return {
      reply: question.text,
      done: false,
      progress:
        buildProgress(session),
    };
  };

export const submitInterviewAnswer =
  async ({
    sessionId,
    message,
  }) => {
    if (
      !message ||
      !message.trim()
    ) {
      throw createHttpError(
        "message is required",
        400,
      );
    }

    const session =
      getSession(sessionId);

    if (!session) {
      throw createHttpError(
        `Interview session ${sessionId} not found`,
        404,
      );
    }

    if (
      session.status ===
      "completed"
    ) {
      throw createHttpError(
        "Interview session is already completed",
        409,
      );
    }

    const latestQuestion =
      session.questionsAsked[
        session.questionsAsked
          .length - 1
      ];

    if (!latestQuestion) {
      throw createHttpError(
        "Interview session has no active question",
        500,
      );
    }

    const latestAnswer = {
      id: randomUUID(),

      questionId:
        latestQuestion.id,

      text: message.trim(),

      createdAt:
        new Date().toISOString(),
    };

    const currentTopic =
      curriculum.find(
        (topic) =>
          topic.day ===
          latestQuestion.day,
      );

    if (!currentTopic) {
      throw createHttpError(
        `Curriculum day ${latestQuestion.day} is not available`,
        500,
      );
    }

    /*
     * STEP 1
     *
     * Evaluate the candidate answer.
     *
     * No next question is generated yet.
     */
    const evaluation =
      await evaluateAnswer({
        candidate:
          session.candidate,

        candidateIntelligence:
          session.candidateIntelligence,

        curriculumTopic:
          currentTopic,

        previousQuestions:
          session.questionsAsked,

        previousAnswers:
          session.answers,

        previousEvaluations:
          session.evaluations,

        latestQuestion,

        latestAnswer,

        progress:
          buildProgress(
            session,
          ),
      });

    /*
     * STEP 2
     *
     * Store the answer.
     */
    const answerRecord = {
      ...latestAnswer,

      question:
        latestQuestion.text,

      day:
        latestQuestion.day,

      topic:
        latestQuestion.topic,
    };

    /*
     * STEP 3
     *
     * Store the evaluation.
     */
    const evaluationRecord = {
      questionId:
        latestQuestion.id,

      answerId:
        latestAnswer.id,

      topic:
        latestQuestion.topic,

      day:
        latestQuestion.day,

      ...evaluation,

      createdAt:
        new Date().toISOString(),
    };

    const answers = [
      ...session.answers,
      answerRecord,
    ];

    const evaluations = [
      ...session.evaluations,
      evaluationRecord,
    ];

    /*
     * STEP 4
     *
     * The candidate has now answered
     * the latest question.
     *
     * ONLY NOW can its curriculum day
     * become covered.
     *
     * The array remains unique.
     */
    const coveredDays =
      session.coveredDays.includes(
        latestQuestion.day,
      )
        ? session.coveredDays
        : [
            ...session.coveredDays,
            latestQuestion.day,
          ];

    const coveredTopics =
      session.coveredTopics.includes(
        latestQuestion.topic,
      )
        ? session.coveredTopics
        : [
            ...session.coveredTopics,
            latestQuestion.topic,
          ];

    const answeredSession = {
      ...session,

      answers,

      evaluations,

      coveredDays,

      coveredTopics,
    };

    /*
     * STEP 5
     *
     * COMPLETION CHECK.
     *
     * This happens BEFORE selecting or
     * generating another question.
     */
    if (
      hasMinimumCoverage(
        answeredSession,
      )
    ) {
      const feedback =
        buildFeedback(
          answeredSession,
        );

      const completedSession =
        updateSession(
          sessionId,
          {
            ...answeredSession,

            status:
              "completed",

            completedAt:
              new Date().toISOString(),

            feedback,
          },
        );

      return {
        reply:
          "Interview completed.",

        done: true,

        feedback:
          completedSession.feedback,

        progress:
          buildProgress(
            completedSession,
          ),
      };
    }

    /*
     * STEP 6
     *
     * The interview is not complete.
     *
     * Now determine what the next
     * curriculum topic should be.
     */
    const action =
      evaluation.recommendedAction;

    const useFollowUp =
      action ===
        "follow_up" ||
      action ===
        "probe_weakness";

    let nextTopic;

    /*
     * CRITICAL COVERAGE RULE
     *
     * Until 4 unique curriculum days
     * have actually been answered,
     * follow-up recommendations cannot
     * keep the interview on the same day.
     *
     * Coverage has priority.
     */
    if (
      answeredSession.coveredDays
        .length <
      MINIMUM_DAYS
    ) {
      nextTopic =
        selectRequiredCoverageTopic(
          answeredSession,
        );
    } else {
      /*
       * Minimum coverage is satisfied.
       *
       * Normal adaptive behavior resumes.
       */
      nextTopic = useFollowUp
        ? currentTopic
        : selectNextTopic(
            answeredSession,
          );
    }

    if (!nextTopic) {
      throw createHttpError(
        "No suitable curriculum topic is available",
        500,
      );
    }

    /*
     * STEP 7
     *
     * Generate the next question
     * only after completion has been checked.
     */
    const nextQuestionResult =
      await generateQuestionForTopic(
        {
          candidate:
            session.candidate,

          candidateIntelligence:
            session.candidateIntelligence,

          curriculumTopic:
            nextTopic,

          previousQuestions:
            session.questionsAsked,

          previousAnswers:
            answers,

          previousEvaluations:
            evaluations,

          previousEvaluation:
            evaluation,
        },
      );

    const nextQuestion = {
      id: randomUUID(),

      text:
        nextQuestionResult.text,

      day:
        nextTopic.day,

      topic:
        getTopicName(
          nextTopic,
        ),

      difficulty:
        nextQuestionResult.difficulty,
    };

    /*
     * IMPORTANT
     *
     * Do NOT add nextQuestion.day
     * to coveredDays here.
     *
     * It becomes covered only after
     * the candidate answers it.
     */
    const questionsAsked = [
      ...answeredSession.questionsAsked,
      nextQuestion,
    ];

    const conversation = [
      ...answeredSession.conversation,

      {
        role: "candidate",

        answerId:
          latestAnswer.id,

        questionId:
          latestQuestion.id,

        text:
          latestAnswer.text,
      },

      {
        role: "interviewer",

        questionId:
          nextQuestion.id,

        text:
          nextQuestion.text,

        day:
          nextQuestion.day,

        topic:
          nextQuestion.topic,
      },
    ];

    const updatedSession = {
      ...answeredSession,

      currentDay:
        nextTopic.day,

      currentTopic:
        getTopicName(
          nextTopic,
        ),

      currentDifficulty:
        nextQuestion.difficulty,

      questionsAsked,

      conversation,

      /*
       * coveredDays intentionally remains
       * unchanged here.
       */
      followUps: useFollowUp
        ? [
            ...answeredSession.followUps,
            {
              questionId:
                nextQuestion.id,

              focus:
                evaluation.followUpFocus,
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
      reply:
        nextQuestion.text,

      done: false,

      progress:
        buildProgress(
          activeSession,
        ),
    };
  };

export const getInterviewSession = (
  sessionId,
) => {
  const session =
    getSession(sessionId);

  if (!session) {
    throw createHttpError(
      `Interview session ${sessionId} not found`,
      404,
    );
  }

  return session;
};