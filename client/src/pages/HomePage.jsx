import { ArrowRight, BrainCircuit } from "lucide-react";
import { Link } from "react-router-dom";
import PageContainer from "../components/common/PageContainer";

function HomePage() {
  return (
    <PageContainer className="flex min-h-[calc(100vh-4rem)] items-center">
      <section className="w-full">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface)] text-[var(--accent)] shadow-2xl shadow-violet-950/20">
            <BrainCircuit size={28} />
          </div>

          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
            ABTalks AI
          </p>

          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Build confidence for your next{" "}
            <span className="text-[var(--accent)]">technical interview.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-[var(--text-secondary)] sm:text-lg">
            A personalized AI interviewer designed around your learning
            journey, technical knowledge, and previous answers.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              to="/interview"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--background)]"
            >
              Start Interview
              <ArrowRight size={17} />
            </Link>

            <Link
              to="/feedback"
              className="inline-flex items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] px-5 py-3 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-[var(--surface-elevated)]"
            >
              View Feedback
            </Link>
          </div>
        </div>
      </section>
    </PageContainer>
  );
}

export default HomePage;