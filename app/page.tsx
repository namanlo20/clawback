export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden text-white">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[#070A12]" />
        <div className="absolute inset-0 bg-[radial-gradient(60%_40%_at_20%_20%,rgba(88,101,242,0.18),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(50%_40%_at_80%_30%,rgba(139,92,246,0.16),transparent_60%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.04),transparent_40%,transparent_60%,rgba(255,255,255,0.03))]" />
      </div>

      <div className="mx-auto max-w-5xl px-6 py-20">
        <h1 className="text-4xl font-semibold tracking-tight">ClawBack</h1>
        <p className="mt-4 max-w-xl text-white/70">
          Track credit card credits. Mark used. Never waste money again.
        </p>

        <div className="mt-10 flex flex-wrap gap-3">
          <a
            href="/app"
            className="rounded-2xl bg-white px-6 py-3 text-sm font-semibold text-black hover:bg-white/90"
          >
            Go to Dashboard â†’
          </a>

          <span className="rounded-2xl border border-white/20 px-6 py-3 text-sm text-white/80">
            Coming soon: reminders (email + SMS)
          </span>
        </div>

        <div className="mt-16 grid gap-4 md:grid-cols-3">
          {[
            ["Never miss a credit", "7-day + 1-day reminders before expiry."],
            ["Addictive progress", "Redeemed totals update live."],
            ["Premium feel", "Fast, clean, and built for daily use."],
          ].map(([title, desc]) => (
            <div
              key={title}
              className="rounded-3xl border border-white/15 bg-white/5 p-6 backdrop-blur"
            >
              <div className="text-sm font-medium">{title}</div>
              <div className="mt-2 text-xs text-white/60">{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
