import PageContainer from "../components/common/PageContainer";

function InterviewPage() {
  return (
    <PageContainer>
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8">
        <p className="text-sm font-medium text-[var(--accent)]">
          Interview
        </p>

        <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
          Interview workspace
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-secondary)] sm:text-base">
          The personalized interview experience will be built here.
        </p>
      </section>
    </PageContainer>
  );
}

export default InterviewPage;