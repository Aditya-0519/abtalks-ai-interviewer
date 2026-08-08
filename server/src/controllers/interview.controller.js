import { z } from "zod";

import {
  getInterviewSession,
  startInterview,
  submitInterviewAnswer,
} from "../services/interviewService.js";

const interviewRequestSchema = z.object({
  sessionId: z.string().min(1),
});

const startRequestSchema = interviewRequestSchema.extend({
  candidate: z.record(z.string(), z.unknown()),
});

const turnRequestSchema = interviewRequestSchema.extend({
  message: z.string().trim().min(1),
});

export const interviewController = async (req, res, next) => {
  try {
    const body = req.body || {};

    if (body.candidate && !body.message) {
      const validation = startRequestSchema.safeParse(body);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: {
            message: "sessionId and candidate are required",
            statusCode: 400,
          },
        });
      }

      const result = await startInterview({
        sessionId: validation.data.sessionId,
        candidate: validation.data.candidate,
      });

      return res.status(201).json({
        reply: result.reply,
        done: result.done,
      });
    }

    const validation = turnRequestSchema.safeParse(body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: {
          message: "sessionId and message are required",
          statusCode: 400,
        },
      });
    }

    const result = await submitInterviewAnswer({
      sessionId: validation.data.sessionId,
      message: validation.data.message,
    });

    if (result.done) {
      return res.status(200).json({
        reply: result.reply,
        done: true,
        feedback: result.feedback,
      });
    }

    return res.status(200).json({
      reply: result.reply,
      done: false,
    });
  } catch (error) {
    next(error);
  }
};

export const getInterviewSessionController = (req, res, next) => {
  try {
    const session = getInterviewSession(req.params.sessionId);

    return res.status(200).json({
      success: true,
      data: {
        sessionId: session.id,
        status: session.status,
        questionsAsked: session.questionsAsked.length,
        coveredDays: session.coveredDays,
        coveredTopics: session.coveredTopics,
        currentTopic: session.currentTopic,
        currentDifficulty: session.currentDifficulty,
        feedback: session.feedback,
      },
    });
  } catch (error) {
    next(error);
  }
};