// app/page.tsx
// ClawBack Landing Page - routes to /
import Link from "next/link";
import Image from "next/image";

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden text-white">
      {/* Premium gradient background */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[#060810]" />
        <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_25%_15%,rgba(88,101,242,0.18),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(50%_50%_at_75%_25%,rgba(139,92,246,0.14),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(40%_40%_at_50%_80%,rgba(16,185,129,0.08),transparent_50%)]" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 mx-auto max-w-6xl px-6 py-5">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logos/clawback-logo.png" alt="ClawBack" width={36} height={36} className="rounded-xl" />
            <span className="text-xl font-bold tracking-tight">ClawBack</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/app" className="rounded-full bg-white/10 border border-white/10 px-4 py-2.5 text-sm font-medium text-white/90 hover:bg-white/15 transition">
              Sign In
            </Link>
            <Link href="/app" className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black hover:bg-white/90 transition shadow-lg shadow-white/10">
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative z-10 mx-auto max-w-6xl px-6 pt-16 pb-20 text-center">
        {/* Logo mark large */}
        <div className="mx-auto mb-8 w-20 h-20 rounded-2xl overflow-hidden shadow-2xl shadow-purple-500/20 border border-white/10">
          <Image src="/logos/clawback-logo.png" alt="ClawBack" width={80} height={80} className="w-full h-full object-cover" />
        </div>

        {/* Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300 mb-8">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
          </span>
          Now tracking 15+ premium cards
        </div>

        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]">
          Stop leaving money<br />
          <span className="bg-gradient-to-r from-purple-400 via-violet-400 to-indigo-400 bg-clip-text text-transparent">on the table.</span>
        </h1>
        
        <p className="mt-8 text-xl text-white/60 leading-relaxed max-w-2xl mx-auto">
          Track your credit card credits. Mark them used. Get reminders before they expire.
          <span className="text-white/80 font-medium"> ClawBack helps you maximize every dollar.</span>
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link href="/app" className="group inline-flex items-center gap-2 rounded-2xl bg-white px-8 py-4 text-lg font-semibold text-black hover:bg-white/90 transition shadow-xl shadow-white/10">
            Start Tracking — Free
            <svg className="h-5 w-5 transition group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
          <div className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 backdrop-blur px-6 py-4 text-white/70">
            <svg className="h-5 w-5 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17H9m10-2V11a7 7 0 10-14 0v4l-2 2h18l-2-2z" />
              <path strokeLinecap="round" strokeWidth={1.8} d="M14 19a2 2 0 01-4 0" />
            </svg>
            Email + SMS reminders
          </div>
        </div>

        {/* Trust microcopy */}
        <div className="mt-8 flex items-center justify-center gap-2 text-sm text-white/40">
          <svg className="h-4 w-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span>No bank logins. No SSN. No credit score access. Ever.</span>
        </div>

        {/* Social proof */}
        <div className="mt-8 flex items-center justify-center gap-4 text-sm text-white/50">
          <div className="flex -space-x-2">
            {[1,2,3,4,5].map((i) => (
              <div key={i} className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 border-2 border-[#060810]" />
            ))}
          </div>
          <span>Join 100+ users tracking their credits</span>
        </div>
      </div>

      {/* Features */}
      <div className="relative z-10 mx-auto max-w-6xl px-6 pb-20">
        <div className="grid gap-5 md:grid-cols-3">
          {[
            {
              icon: "🔔",
              title: "Never miss a credit",
              desc: "Get reminders 7 days and 1 day before credits expire. Email and SMS supported."
            },
            {
              icon: "📈",
              title: "Track your progress",
              desc: "See exactly how much you've captured. 🎉 Confetti when you beat your annual fee!"
            },
            {
              icon: "💡",
              title: "Find better cards",
              desc: "Take our quiz and we'll recommend cards that match your spending habits."
            },
          ].map((feature) => (
            <div key={feature.title} className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur p-6 hover:bg-white/[0.05] transition">
              <div className="text-3xl mb-4">{feature.icon}</div>
              <div className="text-lg font-semibold text-white/95 mb-2">{feature.title}</div>
              <p className="text-sm text-white/55 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Cards Preview */}
      <div className="relative z-10 mx-auto max-w-6xl px-6 pb-20">
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl font-bold text-white/95">Premium cards we track</h2>
              <p className="text-sm text-white/50 mt-1">All the cards with complex credit systems that are easy to forget</p>
            </div>
            <Link href="/app" className="text-sm text-purple-400 hover:text-purple-300 font-medium">
              View all 15+ cards →
            </Link>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {[
              { name: "Amex Platinum", value: "$1,800+", logo: "/logos/amex-platinum.png" },
              { name: "Sapphire Reserve", value: "$550+", logo: "/logos/chase-sapphire-reserve.png" },
              { name: "Venture X", value: "$500+", logo: "/logos/capitalone-venture-x.png" },
              { name: "Amex Gold", value: "$380+", logo: "/logos/amex-gold.png" },
              { name: "Hilton Aspire", value: "$700+", logo: "/logos/hilton-aspire.png" },
              { name: "Marriott Brilliant", value: "$700+", logo: "/logos/marriott-brilliant.png" },
            ].map((card) => (
              <div key={card.name} className="rounded-xl border border-white/10 bg-black/20 p-4 text-center hover:bg-black/30 transition">
                <div className="relative w-12 h-12 mx-auto mb-3 rounded-lg overflow-hidden border border-white/10">
                  <Image src={card.logo} alt={card.name} fill className="object-cover" />
                </div>
                <div className="text-xs text-white/50 mb-1 truncate">{card.name}</div>
                <div className="text-lg font-bold text-emerald-400">{card.value}</div>
                <div className="text-[10px] text-white/40">in credits/yr</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="relative z-10 mx-auto max-w-4xl px-6 pb-20">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-white/95">Simple, fair pricing</h2>
          <p className="mt-2 text-white/50">No monthly fees. No subscriptions. Pay once, own forever.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Free tier */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8">
            <div className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-4">Free</div>
            <div className="flex items-baseline gap-2 mb-6">
              <span className="text-4xl font-bold text-white/95">$0</span>
              <span className="text-sm text-white/50">forever</span>
            </div>
            <ul className="space-y-3 mb-8">
              {["Track 1 card", "Email reminders", "Browse all 15+ cards", "Card recommendation quiz"].map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm text-white/70">
                  <svg className="h-5 w-5 text-emerald-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
            <Link href="/app" className="block w-full rounded-xl border border-white/15 bg-white/5 py-3.5 text-center text-sm font-semibold text-white/90 hover:bg-white/10 transition">
              Get started free
            </Link>
          </div>

          {/* Pro tier */}
          <div className="rounded-2xl border-2 border-amber-400/30 bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-transparent p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-amber-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm font-semibold text-amber-300 uppercase tracking-wider">Pro Lifetime</span>
                <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-bold text-amber-200">BEST VALUE</span>
              </div>
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-4xl font-bold text-white/95">$9.99</span>
                <span className="text-sm text-white/50">one-time</span>
              </div>
              <ul className="space-y-3 mb-8">
                {["Track unlimited cards", "Expiring Soon alerts (real dates)", "Custom reminder schedule", "CSV export", "Priority support", "Everything in Free"].map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm text-white/70">
                    <svg className="h-5 w-5 text-amber-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/app" className="block w-full rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 py-3.5 text-center text-sm font-bold text-black hover:opacity-90 transition shadow-lg shadow-amber-500/20">
                Upgrade to Pro — $9.99
              </Link>
              <div className="mt-4 text-center text-xs text-white/40">No subscriptions. No bank connections.</div>
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="relative z-10 mx-auto max-w-4xl px-6 pb-20">
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 p-10 text-center">
          <h2 className="text-3xl font-bold text-white/95">Ready to claw back your credits?</h2>
          <p className="mt-3 text-white/60 max-w-lg mx-auto">
            Start tracking today. It's free, takes 30 seconds, and could save you hundreds of dollars per year.
          </p>
          <Link href="/app" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-semibold text-black hover:bg-white/90 transition shadow-lg">
            Get started for free
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Image src="/logos/clawback-logo.png" alt="ClawBack" width={24} height={24} className="rounded-lg" />
              <span className="text-sm text-white/40">© 2026 ClawBack</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-white/40">
              <svg className="h-4 w-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>No bank logins. No SSN. We only store your card selections.</span>
            </div>
            <div className="flex items-center gap-6">
              <a href="/privacy" className="text-sm text-white/40 hover:text-white/70 transition">Privacy</a>
              <a href="/terms" className="text-sm text-white/40 hover:text-white/70 transition">Terms</a>
              <a href="mailto:hello@clawback.app" className="text-sm text-white/40 hover:text-white/70 transition">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
