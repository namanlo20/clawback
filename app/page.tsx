// app/page.tsx
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden text-white">
      {/* Premium gradient background - matching dashboard */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[#070A12]" />
        <div className="absolute inset-0 bg-[radial-gradient(60%_40%_at_20%_20%,rgba(88,101,242,0.18),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(50%_40%_at_80%_30%,rgba(139,92,246,0.16),transparent_60%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.04),transparent_40%,transparent_60%,rgba(255,255,255,0.03))]" />
        {/* Subtle grid overlay */}
        <div 
          className="absolute inset-0 opacity-[0.02]" 
          style={{ 
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' 
          }} 
        />
        {/* Decorative blur orbs */}
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-purple-500/10 blur-3xl" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 mx-auto max-w-6xl px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="text-xl font-bold tracking-tight">ClawBack</div>
          <Link 
            href="/app"
            className="rounded-full bg-white/10 border border-white/10 px-4 py-2 text-sm font-medium text-white/90 hover:bg-white/15 transition"
          >
            Open App
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative z-10 mx-auto max-w-6xl px-6 pt-16 pb-24 lg:pt-24 lg:pb-32">
        <div className="max-w-2xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1.5 text-sm text-emerald-300 mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
            </span>
            Now tracking 12+ premium cards
          </div>

          <h1 className="text-5xl font-bold tracking-tight lg:text-6xl">
            Stop leaving money
            <span className="block mt-2 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              on the table.
            </span>
          </h1>
          
          <p className="mt-6 text-lg text-white/60 leading-relaxed max-w-xl">
            Track your credit card credits. Mark them used. Get reminders before they expire.
            <span className="text-white/80 font-medium"> ClawBack helps you maximize every dollar.</span>
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/app"
              className="group inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-base font-semibold text-black hover:bg-white/90 transition shadow-lg shadow-white/10"
            >
              Go to Dashboard
              <svg className="h-4 w-4 transition group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>

            <div className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 backdrop-blur px-6 py-3.5 text-base text-white/70">
              <svg className="h-5 w-5 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17H9m10-2V11a7 7 0 10-14 0v4l-2 2h18l-2-2z" />
                <path strokeLinecap="round" strokeWidth={1.8} d="M14 19a2 2 0 01-4 0" />
              </svg>
              Email + SMS reminders
            </div>
          </div>

          {/* Social proof */}
          <div className="mt-12 flex items-center gap-4 text-sm text-white/50">
            <div className="flex -space-x-2">
              {[1,2,3,4].map((i) => (
                <div key={i} className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 border-2 border-[#070A12]" />
              ))}
            </div>
            <span>Join 500+ users tracking their credits</span>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="relative z-10 mx-auto max-w-6xl px-6 pb-24">
        <div className="grid gap-5 md:grid-cols-3">
          {[
            {
              icon: (
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17H9m10-2V11a7 7 0 10-14 0v4l-2 2h18l-2-2z" />
                  <path strokeLinecap="round" strokeWidth={1.8} d="M14 19a2 2 0 01-4 0" />
                </svg>
              ),
              title: "Never miss a credit",
              bullets: [
                "7-day + 1-day reminders before expiry",
                "Customizable notification schedule",
                "Email and SMS support"
              ],
              accent: "indigo"
            },
            {
              icon: (
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              ),
              title: "Addictive progress",
              bullets: [
                "Watch your redeemed totals grow",
                "🎉 Confetti when you beat your annual fee",
                "Clear net value tracking"
              ],
              accent: "emerald"
            },
            {
              icon: (
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              ),
              title: "Smart recommendations",
              bullets: [
                "Find the perfect card for your spending",
                "Quiz-based personalized matching",
                "Compare cards side-by-side"
              ],
              accent: "purple"
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="group rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur p-6 hover:bg-white/[0.06] hover:border-white/15 transition duration-300"
            >
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-${feature.accent}-500/15 text-${feature.accent}-400 mb-4`}>
                {feature.icon}
              </div>
              <div className="text-lg font-semibold text-white/95 mb-3">{feature.title}</div>
              <ul className="space-y-2">
                {feature.bullets.map((bullet, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-white/60">
                    <svg className="h-4 w-4 mt-0.5 text-white/30 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {bullet}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Supported Cards Preview */}
      <div className="relative z-10 mx-auto max-w-6xl px-6 pb-24">
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur p-8 lg:p-12">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-white/95">Premium cards supported</h2>
            <p className="mt-2 text-white/50">All the major premium credit cards with complex credit systems</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[
              { name: "Amex Platinum", value: "$3,074" },
              { name: "Chase Sapphire Reserve", value: "$2,817" },
              { name: "Venture X", value: "$400" },
              { name: "Amex Gold", value: "$424" },
              { name: "Hilton Aspire", value: "$909" },
              { name: "Citi Strata Elite", value: "$1,169" },
            ].map((card) => (
              <div key={card.name} className="rounded-2xl border border-white/10 bg-black/20 p-4 text-center">
                <div className="text-xs text-white/50 mb-1">{card.name}</div>
                <div className="text-lg font-bold text-emerald-400">{card.value}</div>
                <div className="text-[10px] text-white/40">credits/year</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="relative z-10 mx-auto max-w-6xl px-6 pb-24">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-white/95">Simple pricing</h2>
          <p className="mt-2 text-white/50">No monthly fees. No subscriptions.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 max-w-3xl mx-auto">
          {/* Free tier */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8">
            <div className="text-sm font-medium text-white/50 mb-2">Free forever</div>
            <div className="text-4xl font-bold text-white/95">$0</div>
            <ul className="mt-6 space-y-3">
              {["Track 1 card", "Email reminders", "Full credit tracking", "Card recommendation quiz"].map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm text-white/70">
                  <svg className="h-4 w-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>
            <Link
              href="/app"
              className="mt-8 block w-full rounded-xl border border-white/15 bg-white/5 py-3 text-center text-sm font-semibold text-white/90 hover:bg-white/10 transition"
            >
              Get started free
            </Link>
          </div>

          {/* Pro tier */}
          <div className="rounded-3xl border border-purple-500/30 bg-gradient-to-b from-purple-500/10 to-transparent p-8 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="rounded-full bg-purple-500 px-3 py-1 text-xs font-semibold text-white">Coming Soon</span>
            </div>
            <div className="text-sm font-medium text-purple-300 mb-2">Multi-card</div>
            <div className="text-4xl font-bold text-white/95">$5</div>
            <div className="text-sm text-white/50">one-time payment</div>
            <ul className="mt-6 space-y-3">
              {["Unlimited cards", "SMS reminders", "Priority support", "Everything in Free"].map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm text-white/70">
                  <svg className="h-4 w-4 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>
            <button
              disabled
              className="mt-8 block w-full rounded-xl bg-purple-500/30 py-3 text-center text-sm font-semibold text-purple-200 cursor-not-allowed"
            >
              Join waitlist
            </button>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="relative z-10 mx-auto max-w-6xl px-6 pb-24">
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 p-12 text-center">
          <h2 className="text-3xl font-bold text-white/95">Ready to claw back your credits?</h2>
          <p className="mt-4 text-white/60 max-w-md mx-auto">
            Start tracking your credit card benefits today. It's free, takes 30 seconds, and could save you hundreds.
          </p>
          <Link
            href="/app"
            className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-white px-8 py-4 text-base font-semibold text-black hover:bg-white/90 transition"
          >
            Get started for free
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-sm text-white/40">
              © 2026 ClawBack. Made with 💜 for credit card enthusiasts.
            </div>
            <div className="flex items-center gap-6 text-sm text-white/40">
              <a href="#" className="hover:text-white/70 transition">Privacy</a>
              <a href="#" className="hover:text-white/70 transition">Terms</a>
              <a href="mailto:hello@clawback.app" className="hover:text-white/70 transition">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
