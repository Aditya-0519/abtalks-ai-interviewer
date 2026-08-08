function PageContainer({ children, className = "" }) {
  return (
    <main
      className={`mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 ${className}`}
    >
      {children}
    </main>
  );
}

export default PageContainer;