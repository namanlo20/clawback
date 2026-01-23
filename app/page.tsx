// app/page.tsx
"use client";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

export default function HomePage() {
  const [showTour, setShowTour] = useState(false);
  const [tourStep, setTourStep] = useState(0);

  const tourSteps = [
    {
      title: "Welcome to ClawBack! 👋",
      description: "Stop leaving money on the table. We help you track and redeem every credit card benefit you're paying for.",
      visual: "welcome",
    },
    {
      title: "1. Save Your Cards",
      description: "Add the premium credit cards you have. We support Amex Platinum, Chase Sapphire Reserve, Venture X, and 12+ more.",
      visual: "cards",
    },
    {
      title: "2. Track Every Credit",
      description: "See all your credits organized by frequency. Tap to mark them used when you redeem. Never forget one again.",
      visual: "credits",
    },
    {
      title: "3. Get Reminders",
      description: "Email and SMS alerts 7 days and 1 day before credits expire. Set it and forget it.",
      visual: "reminders",
    },
    {
      title: "Upgrade to Pro",
      description: "Unlimited cards, calendar view, welcome bonus tracker, CSV export, and custom reminder timing. One-time payment, lifetime access.",
      visual: "pro",
    },
  ];

  const closeTour = () => {
    setShowTour(false);
    setTourStep(0);
  };

  const nextStep = () => {
    if (tourStep < tourSteps.length - 1) {
      setTourStep(prev => prev + 1);
    } else {
      closeTour();
    }
  };

  const prevStep = () => {
    if (tourStep > 0) {
      setTourStep(prev => prev - 1);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden text-white">
      {/* Premium gradient background */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[#070A12]" />
        <div className="absolute inset-0 bg-[radial-gradient(60%_40%_at_20%_20%,rgba(88,101,242,0.18),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(50%_40%_at_80%_30%,rgba(139,92,246,0.16),transparent_60%)]" />
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
            <button
              onClick={() => { setTourStep(0); setShowTour(true); }}
              className="rounded-full bg-purple-500/20 border border-purple-400/30 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-purple-200 hover:bg-purple-500/30 transition"
            >
              Take a Tour
            </button>
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
            Get Started Free
            <svg className="h-4 w-4 transition group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
          <div className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 backdrop-blur px-5 py-3 text-sm text-white/70">
            <svg className="h-4 w-4 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17H9m10-2V11a7 7 0 10-14 0v4l-2 2h18l-2-2z" />
              <path strokeLinecap="round" strokeWidth={1.8} d="M14 19a2 2 0 01-4 0" />
            </svg>
            Email + SMS reminders
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-3 text-xs sm:text-sm text-white/50">
          <div className="flex -space-x-2">
            {[1,2,3,4].map((i) => (
              <div key={i} className="h-6 w-6 sm:h-7 sm:w-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 border-2 border-[#070A12]" />
            ))}
          </div>
          <span>Join 100+ users tracking their credits</span>
        </div>
      </div>

      {/* Features */}
      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 pb-16">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { icon: "🔔", title: "Never miss a credit", desc: "7-day + 1-day reminders via email and SMS before credits expire." },
            { icon: "📈", title: "Addictive progress", desc: "Watch your redeemed totals grow. 🎉 Confetti when you beat your annual fee!" },
            { icon: "💡", title: "Smart recommendations", desc: "Take a quick quiz and we'll find the perfect card for your spending." },
          ].map((feature) => (
            <div key={feature.title} className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur p-5 hover:bg-white/[0.05] transition">
              <div className="text-2xl mb-3">{feature.icon}</div>
              <div className="text-base font-semibold text-white/95 mb-2">{feature.title}</div>
              <p className="text-sm text-white/55 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Cards Preview */}
      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 pb-16">
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-white/95">Premium cards supported</h2>
              <p className="text-sm text-white/50">All the major premium cards with complex credit systems</p>
            </div>
            <Link href="/app" className="text-sm text-purple-400 hover:text-purple-300 font-medium">View all cards →</Link>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {[
              { name: "Amex Platinum", value: "$3,074" },
              { name: "CSR", value: "$2,817" },
              { name: "Venture X", value: "$400" },
              { name: "Amex Gold", value: "$424" },
              { name: "Hilton Aspire", value: "$909" },
              { name: "Bonvoy Brilliant", value: "$600" },
            ].map((card) => (
              <div key={card.name} className="rounded-xl bg-white/5 border border-white/10 p-3 text-center hover:bg-white/[0.08] transition">
                <div className="w-10 h-7 rounded bg-gradient-to-br from-slate-600 to-slate-800 mx-auto mb-2" />
                <div className="text-xs text-white/70 truncate">{card.name}</div>
                <div className="text-xs text-emerald-400 font-medium">{card.value}/yr</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pro Features */}
      <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 pb-16">
        <h2 className="text-2xl font-bold text-center text-white/95 mb-2">ClawBack Pro</h2>
        <p className="text-center text-white/50 mb-8">Unlock the full experience</p>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { icon: "♾️", title: "Unlimited Cards", desc: "Track all your premium cards in one place" },
            { icon: "📅", title: "Credit Calendar", desc: "Visual calendar showing when credits reset" },
            { icon: "🎯", title: "Bonus Tracker", desc: "Track welcome bonus spend requirements" },
            { icon: "📊", title: "CSV Export", desc: "Export your data for spreadsheets" },
          ].map((feature) => (
            <div key={feature.title} className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/10">
              <div className="text-xl">{feature.icon}</div>
              <div>
                <div className="font-medium text-white/90">{feature.title}</div>
                <div className="text-sm text-white/50">{feature.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Final CTA */}
      <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 pb-16 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-white/95 mb-4">Ready to stop leaving money on the table?</h2>
        <p className="text-white/60 mb-6">Start free. Upgrade to Pro anytime.</p>
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

      {/* Tour Popup Modal */}
      {showTour && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={closeTour}
          />
          
          {/* Modal */}
          <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#0d1117] shadow-2xl overflow-hidden">
            {/* Progress bar */}
            <div className="h-1 bg-white/10">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-300"
                style={{ width: `${((tourStep + 1) / tourSteps.length) * 100}%` }}
              />
            </div>

            {/* Close button */}
            <button
              onClick={closeTour}
              className="absolute top-4 right-4 p-1 rounded-full bg-white/10 hover:bg-white/20 transition z-10"
            >
              <svg className="w-5 h-5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Visual */}
            <div className="p-6 sm:p-8 bg-gradient-to-br from-purple-500/10 to-indigo-500/10 flex items-center justify-center min-h-[200px]">
              {tourStep === 0 && (
                <div className="text-center animate-fade-in">
                  <div className="text-6xl mb-4">💳</div>
                  <div className="text-white/50 text-sm">Your credits. Your savings. Your way.</div>
                </div>
              )}

              {tourStep === 1 && (
                <div className="space-y-2 w-full max-w-xs animate-fade-in">
                  {["Amex Platinum", "Chase Sapphire Reserve", "Capital One Venture X"].map((card, i) => (
                    <div key={card} className={`flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 ${i === 0 ? 'ring-2 ring-purple-500/50' : ''}`}>
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-700 to-slate-900" />
                      <span className="text-sm text-white/80">{card}</span>
                      {i === 0 && <span className="ml-auto text-xs text-emerald-400">✓</span>}
                    </div>
                  ))}
                </div>
              )}

              {tourStep === 2 && (
                <div className="space-y-2 w-full max-w-xs animate-fade-in">
                  {[
                    { name: "$15 Uber Cash", used: true },
                    { name: "$20 Digital Credit", used: true },
                    { name: "$10 Grubhub", used: false },
                  ].map((credit) => (
                    <div key={credit.name} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${credit.used ? 'bg-emerald-500/20 border border-emerald-400/30' : 'bg-white/10 border border-white/20'}`}>
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

              {tourStep === 3 && (
                <div className="space-y-3 w-full max-w-xs animate-fade-in">
                  <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-400/20">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🔔</span>
                      <div>
                        <div className="text-sm font-medium text-white/90">$15 Uber Cash expiring!</div>
                        <div className="text-xs text-white/50">Resets in 7 days</div>
                      </div>
                    </div>
                  </div>
                  <div className="text-center text-xs text-white/40">via Email + SMS</div>
                </div>
              )}

              {tourStep === 4 && (
                <div className="w-full max-w-xs animate-fade-in">
                  <div className="p-5 rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-400/30">
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <span className="text-lg">✨</span>
                      <span className="font-bold text-white">ClawBack Pro</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      {["Unlimited card tracking", "Credit calendar view", "Welcome bonus tracker", "Custom reminder timing", "CSV export"].map((f) => (
                        <div key={f} className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-white/80">{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-6 sm:p-8">
              <div className="text-xs text-purple-400 uppercase tracking-wide mb-1">
                {tourStep + 1} of {tourSteps.length}
              </div>
              <h3 className="text-xl font-bold text-white/95 mb-2">
                {tourSteps[tourStep].title}
              </h3>
              <p className="text-white/60 text-sm leading-relaxed mb-6">
                {tourSteps[tourStep].description}
              </p>

              {/* Navigation */}
              <div className="flex items-center gap-3">
                {tourStep > 0 && (
                  <button
                    onClick={prevStep}
                    className="px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-white/70 hover:bg-white/10 transition"
                  >
                    ← Back
                  </button>
                )}
                <button
                  onClick={nextStep}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 text-sm text-white font-semibold hover:opacity-90 transition"
                >
                  {tourStep === tourSteps.length - 1 ? "Get Started! 🚀" : "Next →"}
                </button>
              </div>

              {/* Skip */}
              <button
                onClick={closeTour}
                className="w-full mt-3 text-xs text-white/40 hover:text-white/60 transition"
              >
                Skip tour
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </main>
  );
}
