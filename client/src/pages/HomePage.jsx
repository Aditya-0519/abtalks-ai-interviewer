import {
  ArrowRight,
  BrainCircuit,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";

function HomePage() {
  return (
    <section className="min-h-[calc(100vh-76px)] px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-156px)] max-w-5xl items-center justify-center">
        <div className="w-full text-center">
          <div className="mx-auto mb-8 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/5 px-4 py-2 text-sm font-medium text-cyan-300">
            <Sparkles size={16} />
            <span>Adaptive Technical Interviewing</span>
          </div>

          <div className="mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5 shadow-2xl shadow-cyan-950/30">
            <BrainCircuit
              size={32}
              className="text-cyan-300"
            />
          </div>

          <h1 className="mx-auto max-w-4xl text-4xl font-bold leading-[1.18] tracking-tight text-white sm:text-6xl sm:leading-[1.12]">
            Build confidence by
            <span className="block bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 bg-clip-text pb-1 text-transparent">
              thinking like an engineer.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg">
            A personalized AI technical interviewer that
            adapts its questions to your learning journey,
            follows your answers, and evaluates your technical
            understanding.
          </p>

          <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              to="/interview"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-400 px-6 py-3 text-sm font-semibold text-slate-950 transition-transform hover:scale-[1.02] hover:bg-cyan-300"
            >
              Start Interview
              <ArrowRight size={17} />
            </Link>

            <Link
              to="/feedback"
              className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-slate-200 transition-colors hover:bg-white/10"
            >
              View Feedback
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HomePage;