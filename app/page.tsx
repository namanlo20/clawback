export default function HomePage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-4xl px-6 py-16">
        <div className="text-4xl font-semibold tracking-tight">ClawBack</div>
        <div className="mt-3 text-white/70">
          Track credit card credits. Mark used. Never waste money again.
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <a
            href="/app"
            className="rounded-2xl bg-white px-5 py-3 text-sm font-medium text-black hover:bg-white/90"
          >
            Go to Dashboard →
          </a>

          <a
            href="#"
            className="rounded-2xl border border-white/20 px-5 py-3 text-sm hover:bg-white/10"
          >
            Coming soon: reminders (email + SMS)
          </a>
        </div>

        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {[
            ["Never miss a credit", "7-day + 1-day reminders before expiry."],
            ["Addictive progress", "Win rate + redeemed totals that update live."],
            ["Premium feel", "Fast, clean, and built for daily use."],
          ].map(([title, desc]) => (
            <div key={title} className="rounded-3xl border border-white/15 bg-white/5 p-5">
              <div className="text-sm font-medium">{title}</div>
              <div className="mt-2 text-xs text-white/60">{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}