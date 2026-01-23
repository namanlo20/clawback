// app/page.tsx
"use client";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";

export default function HomePage() {
  const [tourStep, setTourStep] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const tourSteps = [
    {
      title: "Save Your Cards",
      description: "Add the premium credit cards you have. We support 12+ cards including Amex Platinum, Chase Sapphire Reserve, and more.",
      visual: "cards",
    },
    {
      title: "Track Every Credit",
      description: "See all your credits organized by frequency. Tap to mark them used when you redeem.",
      visual: "credits",
    },
    {
      title: "Watch Your Savings",
      description: "Track how much you've redeemed vs your annual fee. Beat your fee and celebrate! 🎉",
      visual: "savings",
    },
    {
      title: "Never Miss Again",
      description: "Get email and SMS reminders 7 days and 1 day before credits expire. Set it and forget it.",
      visual: "reminders",
    },
    {
      title: "Go Pro for $4.99",
      description: "One-time payment. Unlimited cards, calendar view, welcome bonus tracker, and more. Lifetime access.",
      visual: "pro",
    },
  ];

  // Auto-advance tour
  useEffect(() => {
    if (!isAutoPlaying) return;
    const timer = setInterval(() => {
      setTourStep((prev) => (prev + 1) % tourSteps.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [isAutoPlaying, tourSteps.length]);

  const goToStep = (step: number) => {
    setIsAutoPlaying(false);
    setTourStep(step);
  };

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

      {/* Navigation */}
      <nav className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 sm:gap-4">
            <Image 
              src="/logos/clawback-mark.png" 
              alt="ClawBack" 
              width={96} 
              height={96} 
              className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-xl sm:rounded-2xl shadow-2xl shadow-purple-500/50 ring-2 ring-white/20 ring-offset-2 ring-offset-[#070A12]" 
            />
            <span className="hidden sm:inline text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-white via-white to-purple-200 bg-clip-text text-transparent">ClawBack</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link 
              href="/app#signin"
              className="rounded-full bg-white/10 border border-white/10 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white/90 hover:bg-white/15 transition"
            >
              Sign In
            </Link>
            <Link 
              href="/app#signup"
              className="rounded-full bg-white px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-black hover:bg-white/90 transition"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 pt-6 sm:pt-10 pb-6 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1.5 text-xs sm:text-sm text-emerald-300 mb-4 sm:mb-6">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
          </span>
          Now tracking 12+ premium cards
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
          Stop leaving money on the table.
        </h1>
        
        <p className="mt-4 text-base sm:text-lg text-white/60 leading-relaxed max-w-2xl mx-auto px-2">
          Track your credit card credits. Mark them used. Get reminders before they expire.
        </p>

        <div className="mt-6 flex flex-col sm:flex-row flex-wrap justify-center gap-3">
          <Link
            href="/app#signup"
            className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3 text-base font-semibold text-black hover:bg-white/90 transition shadow-lg shadow-white/10"
          >
            Start Free
            <svg className="h-4 w-4 transition group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Interactive Tour Section */}
      <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 pb-12">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur overflow-hidden">
          {/* Tour Header */}
          <div className="px-4 sm:px-6 py-4 border-b border-white/10 flex items-center justify-between">
            <div className="text-sm font-medium text-white/70">See How It Works</div>
            <div className="flex items-center gap-2">
              {tourSteps.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goToStep(i)}
                  className={`h-2 rounded-full transition-all ${
                    i === tourStep 
                      ? 'w-6 bg-purple-500' 
                      : 'w-2 bg-white/20 hover:bg-white/40'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Tour Content */}
          <div className="grid md:grid-cols-2 gap-0">
            {/* Visual Side */}
            <div className="p-6 sm:p-8 bg-gradient-to-br from-purple-500/5 to-indigo-500/5 flex items-center justify-center min-h-[280px] sm:min-h-[320px]">
              {tourStep === 0 && (
                <div className="space-y-3 w-full max-w-xs animate-fade-in">
                  {["Amex Platinum", "Chase Sapphire Reserve", "Capital One Venture X"].map((card, i) => (
                    <div key={card} className={`flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 transition-all ${i === 0 ? 'ring-2 ring-purple-500/50' : ''}`}>
                      <div className={`w-10 h-10 rounded-lg ${i === 0 ? 'bg-gradient-to-br from-slate-700 to-slate-900' : i === 1 ? 'bg-gradient-to-br from-blue-900 to-slate-900' : 'bg-gradient-to-br from-slate-800 to-slate-900'}`} />
                      <span className="text-sm text-white/80">{card}</span>
                      {i === 0 && <span className="ml-auto text-xs text-emerald-400">✓ Saved</span>}
                    </div>
                  ))}
                  <button className="w-full p-3 rounded-xl border-2 border-dashed border-white/20 text-white/50 text-sm hover:border-white/40 transition">
                    + Save Card
                  </button>
                </div>
              )}

              {tourStep === 1 && (
                <div className="space-y-3 w-full max-w-xs animate-fade-in">
                  <div className="text-xs text-white/50 uppercase tracking-wide mb-2">Monthly Credits</div>
                  {[
                    { name: "$15 Uber Cash", used: true },
                    { name: "$20 Digital Credit", used: true },
                    { name: "$10 Grubhub", used: false },
                  ].map((credit) => (
                    <div key={credit.name} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${credit.used ? 'bg-emerald-500/20 border border-emerald-400/30' : 'bg-white/10 border border-white/20'}`}>
                        {credit.used && <svg className="w-3 h-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                      </div>
                      <span className="text-sm text-white/80">{credit.name}</span>
                      <span className={`ml-auto text-xs ${credit.used ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {credit.used ? 'Used' : 'Unused'}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {tourStep === 2 && (
                <div className="w-full max-w-xs animate-fade-in">
                  <div className="p-6 rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-400/20">
                    <div className="text-center mb-4">
                      <div className="text-3xl font-bold text-emerald-400">$1,847</div>
                      <div className="text-xs text-white/50">Redeemed This Year</div>
                    </div>
                    <div className="h-3 bg-white/10 rounded-full overflow-hidden mb-2">
                      <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full" style={{ width: '73%' }} />
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-white/50">$695 Annual Fee</span>
                      <span className="text-emerald-400">+$1,152 Net Value!</span>
                    </div>
                  </div>
                  <div className="mt-3 text-center text-2xl">🎉</div>
                </div>
              )}

              {tourStep === 3 && (
                <div className="w-full max-w-xs space-y-3 animate-fade-in">
                  <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-400/20">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">🔔</div>
                      <div>
                        <div className="text-sm font-medium text-white/90">$15 Uber Cash expiring!</div>
                        <div className="text-xs text-white/50">Resets in 7 days</div>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-400/20">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">⏰</div>
                      <div>
                        <div className="text-sm font-medium text-white/90">Last chance: $200 airline credit</div>
                        <div className="text-xs text-white/50">Expires tomorrow!</div>
                      </div>
                    </div>
                  </div>
                  <div className="text-center text-xs text-white/40">Email + SMS reminders</div>
                </div>
              )}

              {tourStep === 4 && (
                <div className="w-full max-w-xs animate-fade-in">
                  <div className="p-6 rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-400/30">
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <span className="text-xl">✨</span>
                      <span className="text-lg font-bold text-white">ClawBack Pro</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      {[
                        "Unlimited card tracking",
                        "Credit calendar view",
                        "Welcome bonus tracker",
                        "CSV export",
                        "Priority support",
                      ].map((feature) => (
                        <div key={feature} className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-white/80">{feature}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/10 text-center">
                      <div className="text-2xl font-bold text-white">$4.99</div>
                      <div className="text-xs text-white/50">one-time payment • lifetime access</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Text Side */}
            <div className="p-6 sm:p-8 flex flex-col justify-center">
              <div className="text-xs text-purple-400 uppercase tracking-wide mb-2">
                Step {tourStep + 1} of {tourSteps.length}
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white/95 mb-3">
                {tourSteps[tourStep].title}
              </h3>
              <p className="text-white/60 leading-relaxed mb-6">
                {tourSteps[tourStep].description}
              </p>
              
              {/* Navigation */}
              <div className="flex gap-3">
                <button
                  onClick={() => goToStep(tourStep > 0 ? tourStep - 1 : tourSteps.length - 1)}
                  className="px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-white/70 hover:bg-white/10 transition"
                >
                  ← Prev
                </button>
                <button
                  onClick={() => goToStep((tourStep + 1) % tourSteps.length)}
                  className="px-4 py-2 rounded-lg bg-purple-500 text-sm text-white font-medium hover:bg-purple-400 transition"
                >
                  Next →
                </button>
                {tourStep === tourSteps.length - 1 && (
                  <Link
                    href="/app#signup"
                    className="px-4 py-2 rounded-lg bg-white text-sm text-black font-semibold hover:bg-white/90 transition ml-auto"
                  >
                    Get Started Free
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pro Banner */}
      <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 pb-12">
        <div className="rounded-2xl border border-purple-500/20 bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-purple-500/10 p-6 flex flex-col md:flex-row items-center gap-6">
          <div className="text-5xl">☕</div>
          <div className="flex-1 text-center md:text-left">
            <div className="text-lg font-semibold text-white/95 mb-1">
              Less than a coffee. Save hundreds.
            </div>
            <div className="text-sm text-white/60">
              That $15 credit you forgot last month? Pro reminders would have saved it.
            </div>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="text-2xl font-bold text-white/95">$4.99</div>
            <div className="text-xs text-white/50">lifetime access</div>
            <Link
              href="/app#signup"
              className="mt-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-sm font-semibold hover:opacity-90 transition"
            >
              Upgrade to Pro →
            </Link>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 pb-16">
        <h2 className="text-2xl font-bold text-center text-white/95 mb-8">Why ClawBack?</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: "💳", title: "12+ Premium Cards", desc: "Amex Platinum, Gold, CSR, Venture X, Hilton Aspire, and more." },
            { icon: "🔔", title: "Smart Reminders", desc: "Email + SMS alerts 7 days and 1 day before credits expire." },
            { icon: "📈", title: "Track Progress", desc: "See your redeemed value vs annual fee in real-time." },
            { icon: "📅", title: "Calendar View", desc: "Pro: See all your credits on a visual calendar." },
            { icon: "🎯", title: "Bonus Tracker", desc: "Pro: Track welcome bonus spend requirements." },
            { icon: "🧠", title: "Card Quiz", desc: "Not sure which card to get? We'll help you decide." },
          ].map((feature) => (
            <div key={feature.title} className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur p-5 hover:bg-white/[0.05] transition">
              <div className="text-2xl mb-3">{feature.icon}</div>
              <div className="text-base font-semibold text-white/95 mb-2">{feature.title}</div>
              <p className="text-sm text-white/55 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Social Proof */}
      <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 pb-16 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="flex -space-x-2">
            {[1,2,3,4,5].map((i) => (
              <div key={i} className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 border-2 border-[#070A12]" />
            ))}
          </div>
        </div>
        <p className="text-white/50 text-sm">Join 100+ users already tracking their credits</p>
      </div>

      {/* Final CTA */}
      <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 pb-16 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-white/95 mb-4">Ready to stop leaving money on the table?</h2>
        <p className="text-white/60 mb-6">Start free. Upgrade to Pro anytime for $4.99.</p>
        <Link
          href="/app#signup"
          className="inline-flex items-center gap-2 rounded-2xl bg-white px-8 py-4 text-lg font-semibold text-black hover:bg-white/90 transition shadow-lg shadow-white/10"
        >
          Get Started Free
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 py-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/40">
          <div>© 2026 ClawBack. All rights reserved.</div>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-white/60 transition">Privacy</Link>
            <Link href="/terms" className="hover:text-white/60 transition">Terms</Link>
            <a href="mailto:hello@clawback.app" className="hover:text-white/60 transition">Contact</a>
          </div>
        </div>
      </footer>

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.4s ease-out;
        }
      `}</style>
    </main>
  );
}
