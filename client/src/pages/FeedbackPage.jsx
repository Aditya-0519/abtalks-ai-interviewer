import PageContainer from "../components/common/PageContainer";

function FeedbackPage() {
  return (
    <PageContainer>
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8">
        <p className="text-sm font-medium text-[var(--accent)]">
          Feedback
        </p>

        <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
          Interview feedback
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-secondary)] sm:text-base">
          Your structured technical interview assessment will appear here.
        </p>
      </section>
    </PageContainer>
  );
}

export default FeedbackPage;