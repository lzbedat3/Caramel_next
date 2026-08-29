export function HeroFallback() {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-gradient-to-br from-caramel-soft via-caramel to-caramel-deep" />
      <div className="absolute -start-10 top-0 size-56 rounded-full bg-surface/50 blur-3xl" />
      <div className="absolute -end-8 bottom-0 size-64 rounded-full bg-caramel/40 blur-3xl" />
      <div className="absolute inset-x-1/4 top-1/3 size-40 rounded-full bg-surface/30 blur-2xl" />
    </div>
  );
}
