import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

function NotFoundPage() {
  return (
    <section className="flex min-h-[calc(100vh-140px)] items-center justify-center py-10">
      <div className="w-full max-w-lg text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">
          404
        </p>

        <h1 className="mt-4 text-4xl font-bold text-white sm:text-6xl">
          Page not found
        </h1>

        <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-slate-500 sm:text-base">
          The page you're looking for doesn't exist or
          may have been moved.
        </p>

        <Link
          to="/"
          className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-400/40"
        >
          <ArrowLeft size={17} />
          Back to Home
        </Link>
      </div>
    </section>
  );
}

export default NotFoundPage;