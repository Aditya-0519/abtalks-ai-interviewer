import { Link } from "react-router-dom";
import PageContainer from "../components/common/PageContainer";

function NotFoundPage() {
  return (
    <PageContainer className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
      <section className="text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
          404
        </p>

        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
          Page not found
        </h1>

        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[var(--text-secondary)]">
          The page you're looking for doesn't exist or has moved.
        </p>

        <Link
          to="/"
          className="mt-6 inline-flex rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-hover)]"
        >
          Back to home
        </Link>
      </section>
    </PageContainer>
  );
}

export default NotFoundPage;