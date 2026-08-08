import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  GraduationCap,
  Lightbulb,
  Target,
  TrendingDown,
  Trophy,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const FEEDBACK_STORAGE_KEY =
  "abtalks-interview-feedback";

const safeArray = (value) =>
  Array.isArray(value) ? value.filter(Boolean) : [];

const formatScore = (score) => {
  const numericScore = Number(score);

  if (!Number.isFinite(numericScore)) {
    return null;
  }

  return Math.round(numericScore * 10);
};

function SectionCard({
  icon: Icon,
  title,
  children,
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10">
          <Icon
            size={18}
            className="text-cyan-300"
          />
        </div>

        <h2 className="text-base font-semibold text-white sm:text-lg">
          {title}
        </h2>
      </div>

      {children}
    </section>
  );
}

function FeedbackList({
  items,
  emptyText,
}) {
  if (items.length === 0) {
    return (
      <p className="text-sm leading-6 text-slate-500">
        {emptyText}
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((item, index) => (
        <li
          key={`${item}-${index}`}
          className="flex items-start gap-3 text-sm leading-6 text-slate-300"
        >
          <CheckCircle2
            size={17}
            className="mt-1 shrink-0 text-cyan-300"
          />
          <span className="break-words">{item}</span>
        </li>
      ))}
    </ul>
  );
}

function FeedbackPage() {
  const location = useLocation();

  let feedback = location.state?.feedback || null;

  if (!feedback) {
    try {
      const storedFeedback = sessionStorage.getItem(
        FEEDBACK_STORAGE_KEY,
      );

      if (storedFeedback) {
        feedback = JSON.parse(storedFeedback);
      }
    } catch {
      feedback = null;
    }
  }

  if (
    !feedback ||
    typeof feedback !== "object" ||
    Array.isArray(feedback)
  ) {
    return (
      <section className="flex min-h-[calc(100vh-140px)] items-center justify-center py-10">
        <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-center shadow-2xl sm:p-10">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-400/10">
            <BarChart3
              size={26}
              className="text-cyan-300"
            />
          </div>

          <h1 className="mt-6 text-2xl font-bold text-white sm:text-3xl">
            No interview feedback available yet.
          </h1>

          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
            Complete an adaptive technical interview to
            generate your personalized assessment.
          </p>

          <Link
            to="/interview"
            className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300/50"
          >
            Start Interview
            <ArrowRight size={17} />
          </Link>
        </div>
      </section>
    );
  }

  const strengths = safeArray(feedback.strengths);
  const gaps = safeArray(feedback.gaps);
  const strongestAreas = safeArray(
    feedback.strongestAreas,
  );
  const weakestAreas = safeArray(
    feedback.weakestAreas,
  );
  const coveredDays = safeArray(
    feedback.coveredDays,
  );

  const score = formatScore(feedback.overallScore);

  const questionsEvaluated = Number(
    feedback.questionsEvaluated,
  );

  const curriculumDaysCovered = Number(
    feedback.curriculumDaysCovered,
  );

  const candidateIntelligence =
    feedback.candidateIntelligence &&
    typeof feedback.candidateIntelligence === "object"
      ? feedback.candidateIntelligence
      : null;

  const priorityDays = safeArray(
    candidateIntelligence?.learningSignals
      ?.priorityDays,
  );

  return (
    <section className="w-full py-2 sm:py-4">
      <div className="mb-7 sm:mb-9">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
          Assessment Report
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Technical Interview Feedback
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">
          Your personalized assessment based on your
          interview performance.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="relative overflow-hidden rounded-3xl border border-cyan-400/15 bg-gradient-to-br from-cyan-400/[0.08] via-white/[0.03] to-violet-400/[0.06] p-6 shadow-2xl shadow-cyan-950/20 sm:p-8">
          <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-cyan-400/10 blur-3xl" />

          <div className="relative">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10">
                <Trophy
                  size={20}
                  className="text-cyan-300"
                />
              </div>

              <p className="text-sm font-semibold text-slate-300">
                Overall Score
              </p>
            </div>

            <div className="mt-7 flex flex-wrap items-end gap-3">
              <span className="text-5xl font-bold tracking-tight text-white sm:text-6xl">
                {score ?? "—"}
              </span>

              {score !== null && (
                <span className="mb-2 text-lg text-slate-500">
                  / 100
                </span>
              )}
            </div>

            {feedback.recommendation && (
              <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-300">
                {feedback.recommendation}
              </p>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-400/10">
              <BarChart3
                size={20}
                className="text-blue-300"
              />
            </div>

            <p className="text-sm font-semibold text-white">
              Interview Summary
            </p>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs text-slate-500">
                Questions
              </p>
              <p className="mt-1 text-xl font-bold text-white">
                {Number.isFinite(questionsEvaluated)
                  ? questionsEvaluated
                  : "—"}
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs text-slate-500">
                Days covered
              </p>
              <p className="mt-1 text-xl font-bold text-white">
                {Number.isFinite(
                  curriculumDaysCovered,
                )
                  ? curriculumDaysCovered
                  : "—"}
              </p>
            </div>
          </div>
        </section>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <SectionCard
          icon={CheckCircle2}
          title="Strengths"
        >
          <FeedbackList
            items={strengths}
            emptyText="No specific strengths were recorded."
          />
        </SectionCard>

        <SectionCard
          icon={TrendingDown}
          title="Areas for Improvement"
        >
          <FeedbackList
            items={gaps}
            emptyText="No specific improvement areas were recorded."
          />
        </SectionCard>

        <SectionCard
          icon={Trophy}
          title="Strongest Areas"
        >
          <FeedbackList
            items={strongestAreas}
            emptyText="No strongest areas were identified."
          />
        </SectionCard>

        <SectionCard
          icon={Target}
          title="Weakest Areas"
        >
          <FeedbackList
            items={weakestAreas}
            emptyText="No weakest areas were identified."
          />
        </SectionCard>
      </div>

      {feedback.recommendation && (
        <div className="mt-5">
          <SectionCard
            icon={Lightbulb}
            title="Recommendation"
          >
            <p className="text-sm leading-7 text-slate-300">
              {feedback.recommendation}
            </p>
          </SectionCard>
        </div>
      )}

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <SectionCard
          icon={GraduationCap}
          title="Curriculum Coverage"
        >
          {coveredDays.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {coveredDays.map((day) => (
                <span
                  key={day}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300"
                >
                  Day {day}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              No curriculum coverage data available.
            </p>
          )}
        </SectionCard>

        {priorityDays.length > 0 && (
          <SectionCard
            icon={Target}
            title="Learning Focus"
          >
            <div className="flex flex-wrap gap-2">
              {priorityDays.map((day) => (
                <span
                  key={day}
                  className="rounded-full border border-cyan-400/20 bg-cyan-400/5 px-3 py-1.5 text-xs font-medium text-cyan-300"
                >
                  Priority Day {day}
                </span>
              ))}
            </div>
          </SectionCard>
        )}
      </div>
    </section>
  );
}

export default FeedbackPage;