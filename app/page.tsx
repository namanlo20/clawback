// app/page.tsx
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-black text-white">
      {/* Subtle vignette + glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black to-black" />
        <div className="absolute left-1/2 top-[-180px] h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="absolute left-[12%] top-[35%] h-[360px] w-[360px] rounded-full bg-cyan-400/8 blur-3xl" />
        <div className="absolute right-[10%] top-[30%] h-[360px] w-[360px] rounded-full bg-indigo-400/8 blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/70 to-black" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-6xl items-center px-6">
        <div className="w-full">
          {/* Centered hero */}
          <div className="mx-auto max-w-3xl text-center">
            {/* Title */}
            <h1
              className="text-5xl tracking-tight sm:text-6xl"
              style={{
                fontFamily:
                  'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
                fontWeight: 500,
              }}
            >
              ClawBack
            </h1>

            {/* Tagline (italic serif like screenshot) */}
            <p
              className="mx-auto mt-4 max-w-2xl text-lg text-white/75 sm:text-xl"
              style={{
                fontFamily:
                  'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
                fontStyle: "italic",
              }}
            >
              Track credit card credits. Mark used. Never waste money again.
            </p>

            {/* Buttons */}
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/app" className="group">
                <span className="inline-flex items-center justify-center rounded-full border border-emerald-300/25 bg-emerald-400/10 px-6 py-2.5 text-sm font-medium text-emerald-100 shadow-[0_0_0_1px_rgba(16,185,129,0.10),0_0_24px_rgba(16,185,129,0.22)] transition hover:bg-emerald-400/14 hover:shadow-[0_0_0_1px_rgba(16,185,129,0.16),0_0_34px_rgba(16,185,129,0.30)]">
                  Go to Dashboard
                </span>
              </Link>

              <button
                type="button"
                className="inline-flex items-center justify-center rounded-full border border-cyan-300/25 bg-cyan-400/10 px-6 py-2.5 text-sm font-medium text-cyan-100 shadow-[0_0_0_1px_rgba(34,211,238,0.10),0_0_24px_rgba(34,211,238,0.20)] transition hover:bg-cyan-400/14 hover:shadow-[0_0_0_1px_rgba(34,211,238,0.16),0_0_34px_rgba(34,211,238,0.28)]"
                onClick={() => {
                  // keep this as a non-link since reminders aren't live yet
                  // (matches your screenshot vibe)
                }}
              >
                Coming soon: reminders (email + SMS)
              </button>
            </div>
          </div>

          {/* Feature cards row */}
          <div className="mx-auto mt-16 grid max-w-5xl gap-6 md:grid-cols-3">
            <FeatureCard
              title="Never miss a credit"
              body="7-day + 1-day reminders before expiry."
            />
            <FeatureCard
              title="Addictive progress"
              body="Win rate + redeemed totals that update live."
            />
            <FeatureCard
              title="Premium feel"
              body="Fast, clean, and built for daily use."
            />
          </div>

          {/* Spacing bottom to match airy screenshot */}
          <div className="h-24" />
        </div>
      </div>
    </main>
  );
}

function FeatureCard(props: { title: string; body: string }) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-md">
      <div className="text-base font-medium text-white/90">{props.title}</div>
      <div className="mt-2 text-sm leading-relaxed text-white/60">
        {props.body}
      </div>
    </div>
  );
}
