// app/page.tsx
import Link from "next/link";
import Image from "next/image";

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden text-white">
      {/* Premium gradient background */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[#070A12]" />
        <div className="absolute inset-0 bg-[radial-gradient(60%_40%_at_20%_20%,rgba(88,101,242,0.18),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(50%_40%_at_80%_30%,rgba(139,92,246,0.16),transparent_60%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.04),transparent_40%,transparent_60%,rgba(255,255,255,0.03))]" />
        <div 
          className="absolute inset-0 opacity-[0.02]" 
          style={{ 
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' 
          }} 
        />
      </div>

      {/* Navigation - CHANGED: Logo 56x56, hash routing on buttons */}
      <nav className="relative z-10 mx-auto max-w-6xl px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image 
              src="/logos/clawback-mark.png" 
              alt="ClawBack" 
              width={64} 
              height={64} 
              className="rounded-2xl shadow-xl shadow-purple-500/40 ring-2 ring-white/20 ring-offset-2 ring-offset-[#070A12]" 
            />
            <span className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white via-white to-purple-200 bg-clip-text text-transparent">ClawBack</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link 
              href="/app#signin"
              className="rounded-full bg-white/10 border border-white/10 px-4 py-2 text-sm font-medium text-white/90 hover:bg-white/15 transition"
            >
              Sign In
            </Link>
            <Link 
              href="/app#signup"
              className="rounded-full bg-white px-4 py-2 text-sm font-medium text-black hover:bg-white/90 transition"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero - Centered & Compact (UNCHANGED) */}
      <div className="relative z-10 mx-auto max-w-6xl px-6 pt-12 pb-16 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1.5 text-sm text-emerald-300 mb-6">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
          </span>
          Now tracking 12+ premium cards
        </div>

        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
          Stop leaving money on the table.
        </h1>
        
        <p className="mt-5 text-lg text-white/60 leading-relaxed max-w-2xl mx-auto">
          Track your credit card credits. Mark them used. Get reminders before they expire.
          <span className="text-white/80 font-medium"> ClawBack helps you maximize every dollar.</span>
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/app"
            className="group inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3 text-base font-semibold text-black hover:bg-white/90 transition shadow-lg shadow-white/10"
          >
            Go to Dashboard
            <svg className="h-4 w-4 transition group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>

          <div className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 backdrop-blur px-5 py-3 text-sm text-white/70">
            <svg className="h-4 w-4 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17H9m10-2V11a7 7 0 10-14 0v4l-2 2h18l-2-2z" />
              <path strokeLinecap="round" strokeWidth={1.8} d="M14 19a2 2 0 01-4 0" />
            </svg>
            Email + SMS reminders
          </div>
        </div>

        {/* Social proof (UNCHANGED) */}
        <div className="mt-8 flex items-center justify-center gap-3 text-sm text-white/50">
          <div className="flex -space-x-2">
            {[1,2,3,4].map((i) => (
              <div key={i} className="h-7 w-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 border-2 border-[#070A12]" />
            ))}
          </div>
          <span>Join 100+ users tracking their credits</span>
        </div>
      </div>

      {/* Features - Compact Grid (UNCHANGED) */}
      <div className="relative z-10 mx-auto max-w-6xl px-6 pb-16">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              icon: "🔔",
              title: "Never miss a credit",
              desc: "7-day + 1-day reminders via email and SMS before credits expire."
            },
            {
              icon: "📈",
              title: "Addictive progress",
              desc: "Watch your redeemed totals grow. 🎉 Confetti when you beat your annual fee!"
            },
            {
              icon: "💡",
              title: "Smart recommendations",
              desc: "Take a quick quiz and we'll find the perfect card for your spending."
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur p-5 hover:bg-white/[0.05] transition"
            >
              <div className="text-2xl mb-3">{feature.icon}</div>
              <div className="text-base font-semibold text-white/95 mb-2">{feature.title}</div>
              <p className="text-sm text-white/55 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Cards Preview - Compact (UNCHANGED) */}
      <div className="relative z-10 mx-auto max-w-6xl px-6 pb-16">
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-white/95">Premium cards supported</h2>
              <p className="text-sm text-white/50">All the major premium cards with complex credit systems</p>
            </div>
            <Link href="/app" className="text-sm text-purple-400 hover:text-purple-300 font-medium">
              View all cards →
            </Link>
          </div>
          
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {[
              { name: "Amex Platinum", value: "$3,074" },
              { name: "CSR", value: "$2,817" },
              { name: "Venture X", value: "$400" },
              { name: "Amex Gold", value: "$424" },
              { name: "Hilton Aspire", value: "$909" },
              { name: "Strata Elite", value: "$1,169" },
            ].map((card) => (
              <div key={card.name} className="rounded-xl border border-white/10 bg-black/20 p-3 text-center">
                <div className="text-[11px] text-white/50 mb-1 truncate">{card.name}</div>
                <div className="text-base font-bold text-emerald-400">{card.value}</div>
                <div className="text-[10px] text-white/40">/year</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pricing - Side by Side Compact (CHANGED: $9.99 price only) */}
      <div className="relative z-10 mx-auto max-w-4xl px-6 pb-16">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white/95">Simple pricing</h2>
          <p className="mt-1 text-sm text-white/50">No monthly fees. No subscriptions.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Free tier (UNCHANGED) */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-3xl font-bold text-white/95">$0</span>
              <span className="text-sm text-white/50">forever</span>
            </div>
            <ul className="space-y-2 mb-6">
              {["Track 1 card", "Email reminders", "Full credit tracking", "Card quiz"].map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-white/70">
                  <svg className="h-4 w-4 text-emerald-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
            <Link href="/app" className="block w-full rounded-xl border border-white/15 bg-white/5 py-2.5 text-center text-sm font-semibold text-white/90 hover:bg-white/10 transition">
              Get started free
            </Link>
          </div>

          {/* Pro tier (CHANGED: $9.99 price, kept "Soon" badge and waitlist) */}
          <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-b from-purple-500/10 to-transparent p-6 relative">
            <span className="absolute -top-2.5 right-4 rounded-full bg-purple-500 px-2 py-0.5 text-[11px] font-semibold text-white">Soon</span>
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-3xl font-bold text-white/95">$9.99</span>
              <span className="text-sm text-white/50">one-time</span>
            </div>
            <ul className="space-y-2 mb-6">
              {["Unlimited cards", "SMS reminders", "Priority support", "Everything free"].map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-white/70">
                  <svg className="h-4 w-4 text-purple-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
            <button disabled className="block w-full rounded-xl bg-purple-500/30 py-2.5 text-center text-sm font-semibold text-purple-200 cursor-not-allowed">
              Join waitlist
            </button>
          </div>
        </div>
      </div>

      {/* Final CTA - Compact (UNCHANGED) */}
      <div className="relative z-10 mx-auto max-w-4xl px-6 pb-16">
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 p-8 text-center">
          <h2 className="text-2xl font-bold text-white/95">Ready to claw back your credits?</h2>
          <p className="mt-2 text-sm text-white/60 max-w-md mx-auto">
            Start tracking today. Free, takes 30 seconds, and could save you hundreds.
          </p>
          <Link
            href="/app"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-black hover:bg-white/90 transition"
          >
            Get started for free
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Footer - Minimal (UNCHANGED) */}
      <footer className="relative z-10 border-t border-white/10">
        <div className="mx-auto max-w-6xl px-6 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-white/40">
            <div>© 2026 ClawBack. Made with 💜</div>
            <div className="flex items-center gap-4">
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
