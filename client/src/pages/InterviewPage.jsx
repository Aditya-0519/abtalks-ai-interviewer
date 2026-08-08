import { useState } from "react";
import {
  ArrowRight,
  BrainCircuit,
  CircleAlert,
  LoaderCircle,
  MessageSquareText,
  Send,
  Target,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5000/api";

const FEEDBACK_STORAGE_KEY =
  "abtalks-interview-feedback";

const createSessionId = () => {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return `web-${crypto.randomUUID()}`;
  }

  return `web-${Date.now()}`;
};

const defaultCandidate = {
  name: "Sarah",
  role: "Senior Data Engineer",
  experience: "5+ years",
  completedMissions: [
    "Prompt Engineering",
    "Retrieval-Augmented Generation",
    "Vector Databases",
    "Agentic AI",
  ],
  attempts: [],
  skippedTopics: [],
  learningSignals: {
    strengths: [
      "Prompt Engineering",
      "Vector Databases",
    ],
    weaknesses: ["Structured Outputs"],
    repeatedAttempts: [],
  },
};

const getDifficultyLabel = (difficulty) => {
  if (!difficulty) {
    return "Not specified";
  }

  return (
    difficulty.charAt(0).toUpperCase() +
    difficulty.slice(1)
  );
};

function InterviewPage() {
  const navigate = useNavigate();

  const [sessionId, setSessionId] = useState("");
  const [candidate] = useState(defaultCandidate);
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState("");
  const [progress, setProgress] = useState(null);
  const [isInterviewStarted, setIsInterviewStarted] =
    useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const startInterview = async () => {
    setIsLoading(true);
    setError("");

    const newSessionId = createSessionId();

    try {
      const response = await fetch(
        `${API_BASE_URL}/interview`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sessionId: newSessionId,
            candidate,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error?.message ||
            "Unable to start the interview.",
        );
      }

      setSessionId(newSessionId);
      setReply(data.reply || "");
      setProgress(data.progress || null);
      setIsInterviewStarted(true);
    } catch (requestError) {
      setError(
        requestError.message ||
          "Unable to connect to the interview service.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const submitAnswer = async (event) => {
    event.preventDefault();

    const trimmedMessage = message.trim();

    if (
      !trimmedMessage ||
      !sessionId ||
      isLoading
    ) {
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/interview`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sessionId,
            message: trimmedMessage,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error?.message ||
            "Unable to submit your answer.",
        );
      }

      setMessage("");

      if (data.done) {
        if (data.feedback) {
          sessionStorage.setItem(
            FEEDBACK_STORAGE_KEY,
            JSON.stringify(data.feedback),
          );
        }

        navigate("/feedback", {
          state: {
            feedback: data.feedback || null,
          },
        });

        return;
      }

      setReply(data.reply || "");
      setProgress(data.progress || null);
    } catch (requestError) {
      setError(
        requestError.message ||
          "Unable to submit your answer.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!isInterviewStarted) {
    return (
      <section className="flex min-h-[calc(100vh-120px)] items-center justify-center py-8 sm:py-12">
        <div className="w-full max-w-4xl text-center">
          <div className="mx-auto inline-flex max-w-full items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/5 px-4 py-2 text-xs font-medium text-cyan-300">
            <MessageSquareText size={14} />
            Adaptive Technical Interview
          </div>

          <h1 className="mt-6 text-3xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Ready to test your
            <span className="block bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 bg-clip-text pb-2 text-transparent">
              engineering knowledge?
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">
            Your interview will adapt to your learning
            journey, evaluate your answers, and ask
            follow-up questions based on your technical
            understanding.
          </p>

          <div className="mx-auto mt-8 grid w-full max-w-3xl gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left">
              <p className="text-sm font-semibold text-white">
                Adaptive
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Questions change based on your answers.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left">
              <p className="text-sm font-semibold text-white">
                Technical
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Grounded in your completed curriculum.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left">
              <p className="text-sm font-semibold text-white">
                Personalized
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Focused on your learning signals.
              </p>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="mx-auto mt-6 flex max-w-2xl items-start gap-3 rounded-xl border border-red-400/20 bg-red-400/5 px-4 py-3 text-left text-sm text-red-300"
            >
              <CircleAlert
                size={18}
                className="mt-0.5 shrink-0"
              />
              <span>{error}</span>
            </div>
          )}

          <button
            type="button"
            onClick={startInterview}
            disabled={isLoading}
            className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-cyan-400 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300/50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? (
              <>
                <LoaderCircle
                  size={17}
                  className="animate-spin"
                />
                Preparing Interview...
              </>
            ) : (
              <>
                Start Interview
                <ArrowRight size={17} />
              </>
            )}
          </button>
        </div>
      </section>
    );
  }

  const questionsAnswered =
    progress?.questionsAnswered ?? 0;

  const minimumQuestions =
    progress?.minimumQuestions ?? 8;

  const daysCovered =
    progress?.daysCovered ??
    progress?.coveredDays?.length ??
    0;

  const minimumDays =
    progress?.minimumDays ?? 4;

  const difficulty =
    progress?.currentDifficulty ||
    "foundational";

  const questionProgress = Math.min(
    100,
    Math.round(
      (questionsAnswered / minimumQuestions) * 100,
    ),
  );

  return (
    <section className="w-full py-2 sm:py-4">
      <div className="mb-6 flex flex-col gap-4 sm:mb-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
            Live Interview
          </p>

          <h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
            Technical Interview
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Think aloud, explain your decisions, and treat
            this like a real engineering interview.
          </p>
        </div>

        <div className="flex w-full items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 sm:w-auto sm:min-w-48">
          <div>
            <p className="text-xs text-slate-500">
              Progress
            </p>
            <p className="mt-0.5 text-sm font-semibold text-white">
              {questionsAnswered}/{minimumQuestions} answered
            </p>
          </div>

          <Target
            size={19}
            className="shrink-0 text-cyan-300"
          />
        </div>
      </div>

      <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Questions
            </p>

            <p className="mt-1 text-sm font-semibold text-white">
              {questionsAnswered}/{minimumQuestions} answered
            </p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Curriculum
            </p>

            <p className="mt-1 text-sm font-semibold text-white">
              {daysCovered}/{minimumDays} days covered
            </p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Difficulty
            </p>

            <p className="mt-1 text-sm font-semibold text-cyan-300">
              {getDifficultyLabel(difficulty)}
            </p>
          </div>
        </div>

        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              Interview progress
            </span>

            <span className="font-semibold text-slate-300">
              {questionProgress}%
            </span>
          </div>

          <div
            className="h-2 overflow-hidden rounded-full bg-white/10"
            aria-label={`Interview progress ${questionProgress}%`}
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400 transition-all duration-500"
              style={{
                width: `${questionProgress}%`,
              }}
            />
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-white/10 bg-slate-950/60 shadow-2xl shadow-cyan-950/20">
        <div className="border-b border-white/10 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10">
              <BrainCircuit
                size={19}
                className="text-cyan-300"
              />
            </div>

            <div className="min-w-0">
              <p className="text-sm font-semibold text-white">
                AI Interviewer
              </p>

              <p className="flex items-center gap-1.5 text-xs text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Interview active
              </p>
            </div>
          </div>
        </div>

        <div className="px-4 py-5 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-7">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                Current Question
              </p>

              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-400">
                Question {questionsAnswered + 1}
              </span>
            </div>

            <p className="break-words text-base leading-8 text-slate-100 sm:text-lg">
              {reply || "Preparing your next question..."}
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="mt-5 flex items-start gap-3 rounded-xl border border-red-400/20 bg-red-400/5 px-4 py-3 text-sm text-red-300"
            >
              <CircleAlert
                size={18}
                className="mt-0.5 shrink-0"
              />
              <span>{error}</span>
            </div>
          )}

          <form
            onSubmit={submitAnswer}
            className="mt-6"
          >
            <label
              htmlFor="interview-answer"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              Your answer
            </label>

            <textarea
              id="interview-answer"
              value={message}
              onChange={(event) =>
                setMessage(event.target.value)
              }
              disabled={isLoading}
              rows={7}
              placeholder="Explain your reasoning clearly. Treat this like a real technical interview."
              className="min-h-40 w-full resize-y rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 text-sm leading-7 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-60"
            />

            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs leading-5 text-slate-500">
                Explain the concept, your reasoning, and
                relevant engineering trade-offs.
              </p>

              <button
                type="submit"
                disabled={
                  isLoading || !message.trim()
                }
                className="inline-flex min-h-12 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300/50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                {isLoading ? (
                  <>
                    <LoaderCircle
                      size={16}
                      className="animate-spin"
                    />
                    Evaluating...
                  </>
                ) : (
                  <>
                    Submit Answer
                    <Send size={16} />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}

export default InterviewPage;