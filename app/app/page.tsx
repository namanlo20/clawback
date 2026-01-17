// app/app/page.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import Image from "next/image";
import { createClient, type Session, type User } from "@supabase/supabase-js";
import {
  CARDS,
  pointValueUsd,
  type Card,
  type Credit,
  type CreditFrequency,
  type SpendCategory,
} from "../../data/cards";

// -----------------------------
// SUPABASE
// -----------------------------
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// -----------------------------
// CONFETTI EFFECT
// -----------------------------
function fireConfetti() {
  const duration = 4000;
  const animationEnd = Date.now() + duration;
  const colors = ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#fbbf24', '#f59e0b', '#8b5cf6', '#a78bfa'];

  function randomInRange(min: number, max: number) {
    return Math.random() * (max - min) + min;
  }

  const interval = setInterval(function () {
    const timeLeft = animationEnd - Date.now();
    if (timeLeft <= 0) return clearInterval(interval);

    const particleCount = 50 * (timeLeft / duration);
    for (let i = 0; i < particleCount / 10; i++) {
      createParticle(randomInRange(0.2, 0.4), randomInRange(0.5, 0.9), colors);
      createParticle(randomInRange(0.6, 0.8), randomInRange(0.5, 0.9), colors);
    }
  }, 250);
}

function createParticle(x: number, y: number, colors: string[]) {
  const particle = document.createElement('div');
  particle.style.cssText = `
    position: fixed;
    left: ${x * 100}vw;
    top: ${y * 100}vh;
    width: ${Math.random() * 10 + 5}px;
    height: ${Math.random() * 10 + 5}px;
    background: ${colors[Math.floor(Math.random() * colors.length)]};
    border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
    pointer-events: none;
    z-index: 9999;
    animation: confetti-fall 3s ease-out forwards;
    transform: rotate(${Math.random() * 360}deg);
  `;
  document.body.appendChild(particle);
  setTimeout(() => particle.remove(), 3000);
}

if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes confetti-fall {
      0% { opacity: 1; transform: translateY(0) rotate(0deg) scale(1); }
      100% { opacity: 0; transform: translateY(100vh) rotate(720deg) scale(0.3); }
    }
  `;
  document.head.appendChild(style);
}

// -----------------------------
// TYPES
// -----------------------------
type ToggleState = Record<string, boolean>;

type DbUserCard = {
  card_key: string;
  card_start_date: string | null;
};

type DbCreditState = {
  state_key: string;
  used: boolean;
  dont_care: boolean;
  remind: boolean;
};

type DbProfile = {
  user_id: string;
  full_name: string | null;
  phone_e164: string | null;
  phone_verified: boolean;
  notif_email_enabled: boolean;
  notif_sms_enabled: boolean;
  sms_consent: boolean;
  default_offsets_days: number[] | null;
};

// -----------------------------
// ICONS
// -----------------------------
function IconBell({ className }: { className?: string }) {
  return (
    <svg className={className ?? "h-4 w-4"} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M15 17H9m10-2V11a7 7 0 10-14 0v4l-2 2h18l-2-2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 19a2 2 0 01-4 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function IconEyeOff({ className }: { className?: string }) {
  return (
    <svg className={className ?? "h-4 w-4"} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M10.6 10.6a3 3 0 004.24 4.24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M9.9 5.2A10.5 10.5 0 0122 12c-.8 1.8-2.2 3.9-4.3 5.5M6.2 6.2C4.1 7.8 2.8 10 2 12c1.7 3.9 6 8 10 8 1.3 0 2.6-.3 3.8-.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconCheck({ className }: { className?: string }) {
  return (
    <svg className={className ?? "h-4 w-4"} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconGear({ className }: { className?: string }) {
  return (
    <svg className={className ?? "h-4 w-4"} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 15.5a3.5 3.5 0 110-7 3.5 3.5 0 010 7z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M19.4 15a8.4 8.4 0 000-6l-2.1.4a6.7 6.7 0 00-1.2-1.2L16.5 6a8.4 8.4 0 00-6 0l.4 2.2a6.7 6.7 0 00-1.2 1.2L7.5 9a8.4 8.4 0 000 6l2.2-.4a6.7 6.7 0 001.2 1.2L10.5 18a8.4 8.4 0 006 0l-.4-2.2a6.7 6.7 0 001.2-1.2l2.1.4z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

function IconSparkles({ className }: { className?: string }) {
  return (
    <svg className={className ?? "h-4 w-4"} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M19 15l.5 1.5 1.5.5-1.5.5-.5 1.5-.5-1.5L17 17l1.5-.5.5-1.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// -----------------------------
// HELPERS
// -----------------------------
function formatMoney(n: number): string {
  return n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 2 });
}

function clampDayToEndOfMonth(year: number, monthIndex0: number, day: number) {
  const lastDay = new Date(year, monthIndex0 + 1, 0).getDate();
  return Math.min(day, lastDay);
}

function annualize(amount: number, freq: CreditFrequency): number {
  if (freq === "monthly") return amount * 12;
  if (freq === "quarterly") return amount * 4;
  if (freq === "semiannual") return amount * 2;
  if (freq === "annual") return amount;
  if (freq === "every4years") return amount / 4;
  if (freq === "every5years") return amount / 5;
  return amount;
}

function freqLabel(freq: CreditFrequency): string {
  if (freq === "monthly") return "Monthly";
  if (freq === "quarterly") return "Quarterly";
  if (freq === "semiannual") return "Semiannual";
  if (freq === "annual") return "Annual";
  if (freq === "every4years") return "Every 4 years";
  if (freq === "every5years") return "Every 5 years";
  return "One-time";
}

function freqSort(freq: CreditFrequency): number {
  const order: CreditFrequency[] = ["monthly", "quarterly", "semiannual", "annual", "every4years", "every5years", "onetime"];
  return order.indexOf(freq);
}

function creditSubtitle(c: Credit): string {
  return `${freqLabel(c.frequency)} • ${formatMoney(c.amount)}`;
}

function surfaceCardClass(extra?: string): string {
  return ["rounded-2xl border border-white/10 bg-[#11141B]/80 backdrop-blur-sm shadow-[0_0_70px_rgba(0,0,0,0.55)]", extra ?? ""].join(" ");
}

function formatDateShort(d: Date): string {
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

// -----------------------------
// EXPIRING SOON DATE MATH
// -----------------------------
function nextResetDateForCredit(params: { credit: Credit; cardStartDate: Date; now: Date }): Date | null {
  const { credit, cardStartDate, now } = params;
  if (credit.frequency === "onetime") return null;

  const makeDate = (y: number, m0: number, d: number) => {
    const dd = clampDayToEndOfMonth(y, m0, d);
    return new Date(y, m0, dd, 0, 0, 0, 0);
  };

  const startMonth = cardStartDate.getMonth();
  const startDay = cardStartDate.getDate();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (credit.frequency === "monthly") {
    const y = now.getFullYear();
    const m0 = now.getMonth();
    const nextM0 = m0 + 1;
    const nextY = y + Math.floor(nextM0 / 12);
    const normalizedM0 = ((nextM0 % 12) + 12) % 12;
    return makeDate(nextY, normalizedM0, startDay);
  }

  if (credit.frequency === "every4years" || credit.frequency === "every5years") {
    const years = credit.frequency === "every4years" ? 4 : 5;
    const startY = cardStartDate.getFullYear();
    const nowY = now.getFullYear();
    let k = Math.floor((nowY - startY) / years);
    if (k < 0) k = 0;
    let candY = startY + k * years;
    let cand = makeDate(candY, startMonth, startDay);
    if (cand <= today) {
      candY += years;
      cand = makeDate(candY, startMonth, startDay);
    }
    return cand;
  }

  const monthsStep = credit.frequency === "quarterly" ? 3 : credit.frequency === "semiannual" ? 6 : 12;
  let candidate = makeDate(now.getFullYear(), startMonth, startDay);
  if (candidate > today) candidate = makeDate(now.getFullYear() - 1, startMonth, startDay);
  while (candidate <= today) {
    const next = new Date(candidate);
    next.setMonth(next.getMonth() + monthsStep);
    candidate = makeDate(next.getFullYear(), next.getMonth(), startDay);
  }
  return candidate;
}

// -----------------------------
// QUIZ ENGINE
// -----------------------------
type QuizInputs = {
  spend: Record<SpendCategory, number>;
  annualFeeTolerance: number;
  creditUtilizationPct: number;
  includeWelcomeBonus: boolean;
};

type QuizStep = 'intro' | 'q1_dining' | 'q2_travel' | 'q3_frequency' | 'q4_fee' | 'q5_delivery' | 'q6_optimize' | 'q7_brand' | 'results';

function getEarnRate(card: Card, cat: SpendCategory): number {
  const r = card.earnRates[cat];
  if (typeof r === "number") return r;
  return card.earnRates.other ?? 1;
}

function softFeePenalty(annualFee: number, tolerance: number): number {
  const harshness = 1.15;
  if (annualFee <= tolerance) return 0;
  return (annualFee - tolerance) * harshness;
}

function scoreCard(card: Card, input: QuizInputs) {
  const pv = pointValueUsd(card.pointsProgram);
  const annualSpendByCat: Record<SpendCategory, number> = {
    dining: input.spend.dining * 12,
    travel: input.spend.travel * 12,
    groceries: input.spend.groceries * 12,
    gas: input.spend.gas * 12,
    online: input.spend.online * 12,
    other: input.spend.other * 12,
  };

  let rewardsValue = 0;
  for (const cat of Object.keys(annualSpendByCat) as SpendCategory[]) {
    const spend = annualSpendByCat[cat];
    const rate = getEarnRate(card, cat);
    rewardsValue += spend * rate * pv;
  }

  const creditsValue = card.creditsTrackedAnnualized * input.creditUtilizationPct;
  const bonusValue = input.includeWelcomeBonus ? card.signupBonusEstUsd ?? 0 : 0;
  const fee = card.annualFee;
  const penalty = softFeePenalty(fee, input.annualFeeTolerance);
  const estAnnualValue = rewardsValue + creditsValue + bonusValue - fee;
  const score = estAnnualValue - penalty;

  const breakdown = [
    `Rewards: ${formatMoney(rewardsValue)}`,
    `Credits used: ${formatMoney(creditsValue)}`,
    `Welcome bonus: ${formatMoney(bonusValue)}`,
    `Annual fee: -${formatMoney(fee)}`,
  ];

  return { score, estAnnualValue, breakdown };
}

function inTier(card: Card, min: number, max: number): boolean {
  return card.annualFee >= min && card.annualFee <= max;
}

function normalizeOffsets(input: number[]): number[] {
  const cleaned = input.map((x) => Number(x)).filter((x) => Number.isFinite(x) && x > 0 && x <= 60);
  const unique = Array.from(new Set(cleaned));
  unique.sort((a, b) => b - a);
  return unique.length ? unique : [7, 1];
}

// -----------------------------
// PAGE
// -----------------------------
export default function AppDashboardPage() {
  const [mobileView, setMobileView] = useState<"cards" | "credits" | "insights">("credits");
  const [activeTab, setActiveTab] = useState<"dashboard" | "quiz" | "coming-soon" | "settings">("dashboard");
  
  // Pro state
  const [isPro, setIsPro] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Auth
  const [session, setSession] = useState<Session | null>(null);
  const user: User | null = session?.user ?? null;

  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [authMsg, setAuthMsg] = useState<string | null>(null);

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup" | "reset">("signin");
  const [resetEmail, setResetEmail] = useState("");
  const [resetMsg, setResetMsg] = useState<string | null>(null);

  // Settings
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [phoneE164, setPhoneE164] = useState("");
  const [notifEmailEnabled, setNotifEmailEnabled] = useState(true);
  const [notifSmsEnabled, setNotifSmsEnabled] = useState(false);
  const [smsConsent, setSmsConsent] = useState(false);
  const [offsetsDays, setOffsetsDays] = useState<number[]>([7, 1]);

  // Check Pro status on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsPro(localStorage.getItem('clawback_isPro') === 'true');
    }
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleUpgrade = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('clawback_isPro', 'true');
    }
    setIsPro(true);
    setUpgradeModalOpen(false);
    showToast("🎉 Pro enabled! Enjoy unlimited features.");
  };

  // Display name - just show first name or name
  const displayName = useMemo(() => {
    const n = fullName.trim();
    if (n) return n.split(' ')[0]; // Just first name
    return "";
  }, [fullName]);

  const FOUNDER_EMAIL = "namanlohia02@gmail.com";
  const isFounder = (user?.email ?? "").toLowerCase() === FOUNDER_EMAIL.toLowerCase();

  const pinnedOrder: Card["key"][] = ["amex-platinum", "chase-sapphire-reserve", "capitalone-venture-x"];

  const [search, setSearch] = useState("");
  const [activeCardKey, setActiveCardKey] = useState<Card["key"]>("amex-platinum");
  const [savedCards, setSavedCards] = useState<string[]>([]);
  const [cardStartDates, setCardStartDates] = useState<Record<string, string>>({});
  const [used, setUsed] = useState<ToggleState>({});
  const [dontCare, setDontCare] = useState<ToggleState>({});
  const [remind, setRemind] = useState<ToggleState>({});
  const [dbWarning, setDbWarning] = useState<string | null>(null);
  const [hasCelebrated, setHasCelebrated] = useState<Record<string, boolean>>({});

  const feeBounds = useMemo(() => {
    const fees = CARDS.map((c) => c.annualFee);
    return { min: Math.min(...fees), max: Math.max(...fees) };
  }, []);

  const [feeMin, setFeeMin] = useState<number>(feeBounds.min);
  const [feeMax, setFeeMax] = useState<number>(feeBounds.max);

  const activeCard = useMemo(() => CARDS.find((c) => c.key === activeCardKey) ?? CARDS[0], [activeCardKey]);

  const creditsSorted = useMemo(() => {
    return activeCard.credits.slice().sort((a, b) => {
      const fa = freqSort(a.frequency);
      const fb = freqSort(b.frequency);
      if (fa !== fb) return fa - fb;
      return a.title.localeCompare(b.title);
    });
  }, [activeCard]);

  const totals = useMemo(() => {
    let totalAvail = 0;
    let totalRedeemed = 0;
    for (const c of creditsSorted) {
      const k = `${activeCard.key}:${c.id}`;
      const isDontCareOn = !!dontCare[k];
      const isUsedOn = !!used[k];
      const a = annualize(c.amount, c.frequency);
      if (!isDontCareOn) totalAvail += a;
      if (!isDontCareOn && isUsedOn) totalRedeemed += a;
    }
    const pct = totalAvail <= 0 ? 0 : Math.min(100, Math.round((totalRedeemed / totalAvail) * 100));
    return { totalAvail, totalRedeemed, pct };
  }, [creditsSorted, activeCard.key, dontCare, used]);

  // Confetti check
  useEffect(() => {
    const cardKey = activeCard.key;
    const exceedsFee = totals.totalRedeemed > activeCard.annualFee;
    const alreadyCelebrated = hasCelebrated[cardKey];
    if (exceedsFee && !alreadyCelebrated && totals.totalRedeemed > 0) {
      fireConfetti();
      setHasCelebrated(prev => ({ ...prev, [cardKey]: true }));
    }
  }, [totals.totalRedeemed, activeCard.annualFee, activeCard.key, hasCelebrated]);

  // Quiz state - expanded to 7 questions
  const [quizOpen, setQuizOpen] = useState(false);
  const [quizStep, setQuizStep] = useState<QuizStep>('intro');
  const [topSpendCategories, setTopSpendCategories] = useState<SpendCategory[]>([]);
  
  // Quiz answers
  const [qDining, setQDining] = useState<number>(300);
  const [qTravel, setQTravel] = useState<number>(200);
  const [qTravelFreq, setQTravelFreq] = useState<string>('2-4');
  const [qFeeTolerance, setQFeeTolerance] = useState<string>('250-500');
  const [qUsesDelivery, setQUsesDelivery] = useState<boolean>(true);
  const [qOptimize, setQOptimize] = useState<string>('maximize');
  const [qBrandPref, setQBrandPref] = useState<string>('any');
  
  const [quiz, setQuiz] = useState<QuizInputs>({
    spend: { dining: 500, travel: 300, groceries: 400, gas: 100, online: 200, other: 500 },
    annualFeeTolerance: 500,
    creditUtilizationPct: 0.75,
    includeWelcomeBonus: true,
  });

  // Compute quiz results based on answers
  const quizResults = useMemo(() => {
    // Build quiz inputs from answers
    const feeTol = qFeeTolerance === '0-250' ? 250 : qFeeTolerance === '250-500' ? 500 : 1000;
    const utilization = qOptimize === 'maximize' ? 0.85 : 0.6;
    
    const modifiedQuiz: QuizInputs = {
      spend: { 
        dining: qDining, 
        travel: qTravel, 
        groceries: 400, 
        gas: 100, 
        online: qUsesDelivery ? 300 : 100, 
        other: 300 
      },
      annualFeeTolerance: feeTol,
      creditUtilizationPct: utilization,
      includeWelcomeBonus: true,
    };
    
    let scored = CARDS.map((c) => {
      const base = scoreCard(c, modifiedQuiz);
      let score = base.score;
      
      // Brand preference boost/penalty
      if (qBrandPref === 'chase' && c.issuer === 'Chase') score *= 1.2;
      else if (qBrandPref === 'amex' && c.issuer === 'American Express') score *= 1.2;
      else if (qBrandPref === 'cap1' && c.issuer === 'Capital One') score *= 1.2;
      else if (qBrandPref === 'citi' && c.issuer === 'Citi') score *= 1.2;
      else if (qBrandPref === 'avoid-amex' && c.issuer === 'American Express') score *= 0.3;
      
      return { card: c, ...base, score };
    }).sort((a, b) => b.score - a.score);
    
    return scored.slice(0, 3);
  }, [qDining, qTravel, qFeeTolerance, qOptimize, qUsesDelivery, qBrandPref]);

  const resetQuiz = useCallback(() => {
    setQuizStep('intro');
    setTopSpendCategories([]);
    setQDining(300);
    setQTravel(200);
    setQTravelFreq('2-4');
    setQFeeTolerance('250-500');
    setQUsesDelivery(true);
    setQOptimize('maximize');
    setQBrandPref('any');
    setQuiz({
      spend: { dining: 500, travel: 300, groceries: 400, gas: 100, online: 200, other: 500 },
      annualFeeTolerance: 500,
      creditUtilizationPct: 0.75,
      includeWelcomeBonus: true,
    });
  }, []);

  // Auth init
  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!alive) return;
      setSession(data.session ?? null);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_evt, sess) => {
      setSession(sess);
    });

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // Load user data
  const didInitialLoad = useRef(false);

  useEffect(() => {
    if (!user) {
      setSavedCards([]);
      setCardStartDates({});
      setUsed({});
      setDontCare({});
      setRemind({});
      setDbWarning(null);
      setFullName("");
      setPhoneE164("");
      setNotifEmailEnabled(true);
      setNotifSmsEnabled(false);
      setSmsConsent(false);
      setOffsetsDays([7, 1]);
      didInitialLoad.current = false;
      return;
    }

    if (didInitialLoad.current) return;
    didInitialLoad.current = true;

    (async () => {
      try {
        setDbWarning(null);
        setProfileLoading(true);

        const { data: prof, error: profErr } = await supabase
          .from("profiles")
          .select("user_id, full_name, phone_e164, phone_verified, notif_email_enabled, notif_sms_enabled, sms_consent, default_offsets_days")
          .eq("user_id", user.id)
          .maybeSingle();

        if (profErr) throw profErr;
        if (prof) {
          setFullName(prof.full_name ?? "");
          setPhoneE164(prof.phone_e164 ?? "");
          setNotifEmailEnabled(prof.notif_email_enabled ?? true);
          setNotifSmsEnabled(prof.notif_sms_enabled ?? false);
          setSmsConsent(prof.sms_consent ?? false);
          setOffsetsDays(prof.default_offsets_days ?? [7, 1]);
        }
        setProfileLoading(false);

        const { data: uc, error: ucErr } = await supabase.from("user_cards").select("card_key, card_start_date").eq("user_id", user.id);
        if (ucErr) throw ucErr;
        const loaded = (uc ?? []) as DbUserCard[];
        setSavedCards(loaded.map((x) => x.card_key));
        const starts: Record<string, string> = {};
        for (const r of loaded) {
          if (r.card_start_date) starts[r.card_key] = r.card_start_date;
        }
        setCardStartDates(starts);

        const { data: cs, error: csErr } = await supabase.from("credit_states").select("state_key, used, dont_care, remind").eq("user_id", user.id);
        if (csErr) throw csErr;
        const states = (cs ?? []) as DbCreditState[];
        const u: ToggleState = {};
        const dc: ToggleState = {};
        const rm: ToggleState = {};
        for (const s of states) {
          u[s.state_key] = s.used;
          dc[s.state_key] = s.dont_care;
          rm[s.state_key] = s.remind;
        }
        setUsed(u);
        setDontCare(dc);
        setRemind(rm);
      } catch (err: any) {
        console.error("DB load error:", err);
        setDbWarning(err?.message ?? "Failed to load your saved data.");
      }
    })();
  }, [user]);

  // Save user data
  const saveTimeout = useRef<NodeJS.Timeout | null>(null);

  const queueDbSave = useCallback(() => {
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => void saveAllState(), 600);
  }, []);

  async function saveAllState() {
    if (!user) return;
    try {
      const rows: { user_id: string; state_key: string; used: boolean; dont_care: boolean; remind: boolean }[] = [];
      const allKeys = new Set([...Object.keys(used), ...Object.keys(dontCare), ...Object.keys(remind)]);
      for (const k of allKeys) {
        rows.push({ user_id: user.id, state_key: k, used: !!used[k], dont_care: !!dontCare[k], remind: !!remind[k] });
      }
      if (rows.length > 0) {
        const { error } = await supabase.from("credit_states").upsert(rows, { onConflict: "user_id,state_key" });
        if (error) console.error("credit_states upsert error:", error);
      }
    } catch (e) {
      console.error("saveAllState error:", e);
    }
  }

  useEffect(() => {
    if (!user) return;
    queueDbSave();
  }, [used, dontCare, remind, user, queueDbSave]);

  // Notify me
  async function notifyMeForThisCard() {
    if (!user) {
      setAuthModalOpen(true);
      setAuthMode("signup");
      return;
    }
    if (savedCards.includes(activeCard.key)) {
      setAuthMsg("Card already saved!");
      return;
    }
    if (!isFounder && savedCards.length >= 1) {
      setAuthMsg("Free tier: 1 saved card. Multi-card tracking is $5 flat (coming soon).");
      return;
    }
    try {
      const { error } = await supabase.from("user_cards").insert({ user_id: user.id, card_key: activeCard.key, card_start_date: null });
      if (error) throw error;
      setSavedCards((prev) => [...prev, activeCard.key]);
      setAuthMsg("Card saved! Set your cardmember year start date for best results.");
    } catch (err: any) {
      console.error("notifyMe error:", err);
      setAuthMsg(err?.message ?? "Failed to save card.");
    }
  }

  async function updateCardStartDate(cardKey: string, val: string) {
    setCardStartDates((prev) => ({ ...prev, [cardKey]: val }));
    if (!user) return;
    try {
      const { error } = await supabase.from("user_cards").update({ card_start_date: val || null }).eq("user_id", user.id).eq("card_key", cardKey);
      if (error) console.error("updateCardStartDate error:", error);
    } catch (e) {
      console.error("updateCardStartDate error:", e);
    }
  }

  function toggleUsed(creditKey: string) {
    setUsed((prev) => ({ ...prev, [creditKey]: !prev[creditKey] }));
  }
  function toggleDontCare(creditKey: string) {
    setDontCare((prev) => ({ ...prev, [creditKey]: !prev[creditKey] }));
  }
  function toggleRemind(creditKey: string) {
    setRemind((prev) => ({ ...prev, [creditKey]: !prev[creditKey] }));
  }

  // Auth handlers
  async function handleSignIn() {
    setAuthBusy(true);
    setAuthMsg(null);
    const { error } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword });
    setAuthBusy(false);
    if (error) {
      setAuthMsg(error.message);
    } else {
      setAuthModalOpen(false);
      setAuthEmail("");
      setAuthPassword("");
    }
  }

  async function handleSignUp() {
    setAuthBusy(true);
    setAuthMsg(null);
    const { data, error } = await supabase.auth.signUp({ email: authEmail, password: authPassword });
    if (error) {
      setAuthBusy(false);
      setAuthMsg(error.message);
      return;
    }
    // Save name to profile
    if (data.user && authName.trim()) {
      await supabase.from("profiles").upsert({ user_id: data.user.id, full_name: authName.trim() }, { onConflict: "user_id" });
    }
    setAuthBusy(false);
    setAuthMsg("Check your email to confirm your account!");
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  async function handleResetPassword() {
    setAuthBusy(true);
    setResetMsg(null);
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail);
    setAuthBusy(false);
    if (error) {
      setResetMsg(error.message);
    } else {
      setResetMsg("Check your email for reset instructions.");
    }
  }

  async function saveProfile() {
    if (!user) return;
    setProfileLoading(true);
    setProfileMsg(null);
    try {
      const { error } = await supabase.from("profiles").upsert(
        {
          user_id: user.id,
          full_name: fullName || null,
          phone_e164: phoneE164 || null,
          notif_email_enabled: notifEmailEnabled,
          notif_sms_enabled: notifSmsEnabled,
          sms_consent: smsConsent,
          default_offsets_days: normalizeOffsets(offsetsDays),
        },
        { onConflict: "user_id" }
      );
      if (error) throw error;
      setProfileMsg("Saved!");
    } catch (err: any) {
      console.error("saveProfile error:", err);
      setProfileMsg(err?.message ?? "Failed to save profile.");
    }
    setProfileLoading(false);
  }

  // Expiring soon
  const expiringSoon = useMemo(() => {
    const startStr = cardStartDates[activeCard.key];
    if (!startStr) return [];
    const start = new Date(startStr + "T00:00:00");
    const now = new Date();
    const results: { credit: Credit; due: Date }[] = [];
    for (const c of creditsSorted) {
      const k = `${activeCard.key}:${c.id}`;
      if (!remind[k]) continue;
      if (used[k]) continue;
      if (dontCare[k]) continue;
      const due = nextResetDateForCredit({ credit: c, cardStartDate: start, now });
      if (!due) continue;
      const diffMs = due.getTime() - now.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      if (diffDays >= 0 && diffDays <= 14) {
        results.push({ credit: c, due });
      }
    }
    results.sort((a, b) => a.due.getTime() - b.due.getTime());
    return results;
  }, [activeCard.key, cardStartDates, creditsSorted, remind, used, dontCare]);

  // Card filtering
  const baseFiltered = useMemo(() => {
    return CARDS.filter((c) => {
      const matchFee = c.annualFee >= feeMin && c.annualFee <= feeMax;
      const matchSearch = search.trim() === "" || c.name.toLowerCase().includes(search.toLowerCase()) || c.issuer.toLowerCase().includes(search.toLowerCase());
      return matchFee && matchSearch;
    });
  }, [feeMin, feeMax, search]);

  const topPicks = useMemo(() => {
    return pinnedOrder.map((k) => CARDS.find((c) => c.key === k)).filter(Boolean) as Card[];
  }, [pinnedOrder]);

  const topPicksVisible = useMemo(() => {
    return topPicks.some((c) => baseFiltered.some((b) => b.key === c.key));
  }, [topPicks, baseFiltered]);

  const tier3 = useMemo(() => baseFiltered.filter((c) => inTier(c, 500, 9999) && !pinnedOrder.includes(c.key)), [baseFiltered, pinnedOrder]);
  const tier2 = useMemo(() => baseFiltered.filter((c) => inTier(c, 250, 499) && !pinnedOrder.includes(c.key)), [baseFiltered, pinnedOrder]);
  const tier1 = useMemo(() => baseFiltered.filter((c) => inTier(c, 0, 249) && !pinnedOrder.includes(c.key)), [baseFiltered, pinnedOrder]);

  // Components
  function badgePill(label: string, color: "gold" | "slate" | "neutral") {
    const colors = {
      gold: "bg-amber-400/15 text-amber-200 border-amber-300/20",
      slate: "bg-slate-400/15 text-slate-200 border-slate-300/20",
      neutral: "bg-white/10 text-white/80 border-white/15",
    };
    return <span className={`inline-block rounded-full border px-2 py-0.5 text-[11px] font-semibold ${colors[color]}`}>{label}</span>;
  }

  function CardRow({ card, showTopPickBadge }: { card: Card; showTopPickBadge?: boolean }) {
    const isActive = activeCard.key === card.key;
    return (
      <button
        type="button"
        onClick={() => setActiveCardKey(card.key)}
        className={[
          "w-full flex items-center gap-3 px-3 py-3 text-left transition border-b border-white/5 last:border-b-0",
          isActive ? "bg-white/10" : "hover:bg-white/5",
        ].join(" ")}
      >
        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-black/30">
          <Image src={card.logo} alt={card.name} fill className="object-cover" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold leading-5 line-clamp-1">{card.name}</span>
            {showTopPickBadge ? badgePill("Top Pick", "gold") : null}
          </div>
          <div className="text-xs text-white/55">{card.issuer} • {formatMoney(card.annualFee)}</div>
        </div>
      </button>
    );
  }

  function Section({ title, subtitle, cards, accent }: { title: string; subtitle: string; cards: Card[]; accent: "gold" | "slate" | "neutral" }) {
    if (cards.length === 0) return null;
    return (
      <div className="border-b border-white/10 last:border-b-0">
        <div className="px-3 py-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-base font-semibold text-white/90">{title}</div>
              <div className="text-xs text-white/55">{subtitle}</div>
            </div>
            {badgePill(`${cards.length} cards`, accent)}
          </div>
        </div>
        {cards.map((c) => (
          <CardRow key={c.key} card={c} />
        ))}
      </div>
    );
  }

  // Top Right - Tabs + Auth
  const TopRight = (
    <div className="flex items-center gap-4">
      {/* Tab Navigation */}
      {user && (
        <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1">
          {[
            { key: 'dashboard', label: 'Dashboard' },
            { key: 'quiz', label: 'Quiz' },
            { key: 'coming-soon', label: 'Coming Soon' },
            { key: 'settings', label: 'Settings' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                if (tab.key === 'quiz') {
                  setQuizOpen(true);
                  resetQuiz();
                } else {
                  setActiveTab(tab.key as typeof activeTab);
                }
              }}
              className={[
                "rounded-full px-3 py-1.5 text-sm font-medium transition",
                activeTab === tab.key ? "bg-white/10 text-white" : "text-white/60 hover:text-white/80"
              ].join(" ")}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}
      
      {!user && (
        <button
          onClick={() => { setQuizOpen(true); resetQuiz(); }}
          className="flex items-center gap-1.5 rounded-full border border-purple-400/20 bg-purple-500/10 px-3 py-2 text-sm text-purple-100 hover:bg-purple-500/20 transition"
          type="button"
        >
          <IconSparkles className="h-4 w-4" />
          <span>Find My Card</span>
        </button>
      )}
      
      {user ? (
        <>
          {/* Pro Badge */}
          {isPro && (
            <div className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-400/30 px-3 py-1.5 text-xs font-semibold text-amber-200 shadow-[0_0_12px_rgba(251,191,36,0.15)]">
              <span>✨</span>
              <span>PRO Lifetime</span>
            </div>
          )}
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2">
            <span className="text-sm font-medium text-white/90">{displayName || 'User'}</span>
          </div>
          <button onClick={handleSignOut} className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70 hover:bg-white/10" type="button">
            Sign out
          </button>
        </>
      ) : (
        <>
          <button 
            onClick={() => { setAuthModalOpen(true); setAuthMode("signin"); }} 
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10" 
            type="button"
          >
            Sign in
          </button>
          <button 
            onClick={() => { setAuthModalOpen(true); setAuthMode("signup"); }} 
            className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-white/90" 
            type="button"
          >
            Sign up
          </button>
        </>
      )}
    </div>
  );

  // Auth Modal
  const AuthModal = !authModalOpen ? null : (
    <div className="fixed inset-0 z-50">
      <button className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setAuthModalOpen(false)} aria-label="Close" />
      <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2">
        <div className={surfaceCardClass("p-6")}>
          <div className="text-xl font-semibold text-white/95">
            {authMode === "signin" ? "Welcome back" : authMode === "signup" ? "Create your account" : "Reset password"}
          </div>
          <div className="text-sm text-white/50 mt-1">
            {authMode === "signin" ? "Sign in to access your dashboard" : authMode === "signup" ? "Start tracking your credits for free" : "We'll send you a reset link"}
          </div>

          {authMode === "reset" ? (
            <div className="mt-5">
              <input type="email" placeholder="Email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#0F1218] px-3 py-2.5 text-sm outline-none" />
              <button onClick={handleResetPassword} disabled={authBusy} className="mt-3 w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black hover:bg-white/90 disabled:opacity-50" type="button">
                {authBusy ? "Sending..." : "Send reset link"}
              </button>
              {resetMsg && <div className="mt-2 text-sm text-white/70">{resetMsg}</div>}
              <button onClick={() => setAuthMode("signin")} className="mt-3 text-sm text-white/55 hover:text-white/80" type="button">← Back to sign in</button>
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {authMode === "signup" && (
                <input type="text" placeholder="Your name" value={authName} onChange={(e) => setAuthName(e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#0F1218] px-3 py-2.5 text-sm outline-none" />
              )}
              <input type="email" placeholder="Email" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#0F1218] px-3 py-2.5 text-sm outline-none" />
              <input type="password" placeholder="Password" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#0F1218] px-3 py-2.5 text-sm outline-none" />
              <button onClick={authMode === "signin" ? handleSignIn : handleSignUp} disabled={authBusy} className="w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black hover:bg-white/90 disabled:opacity-50" type="button">
                {authBusy ? "Loading..." : authMode === "signin" ? "Sign in" : "Create account"}
              </button>
              {authMsg && <div className="text-sm text-white/70">{authMsg}</div>}
              <div className="flex items-center justify-between text-sm pt-2">
                <button onClick={() => setAuthMode(authMode === "signin" ? "signup" : "signin")} className="text-white/55 hover:text-white/80" type="button">
                  {authMode === "signin" ? "Create account" : "Already have an account?"}
                </button>
                {authMode === "signin" && (
                  <button onClick={() => setAuthMode("reset")} className="text-white/55 hover:text-white/80" type="button">Forgot password?</button>
                )}
              </div>
              {/* Trust microcopy */}
              <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-2 text-xs text-white/40">
                <svg className="h-4 w-4 text-emerald-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>No bank logins. No SSN. No credit score access. Ever.</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Settings Modal
  const SettingsModal = !settingsOpen ? null : (
    <div className="fixed inset-0 z-50">
      <button className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSettingsOpen(false)} aria-label="Close" />
      <div className="absolute left-1/2 top-8 w-[92vw] max-w-lg -translate-x-1/2 max-h-[90vh] overflow-auto">
        <div className={surfaceCardClass("p-5")}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xl font-semibold text-white/95">Settings</div>
              <div className="mt-1 text-sm text-white/55">{user?.email}</div>
            </div>
            <button onClick={() => setSettingsOpen(false)} className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80 hover:bg-white/10" type="button">Close</button>
          </div>

          <div className="mt-5 space-y-4">
            <div>
              <div className="text-sm font-semibold text-white/90">Display name</div>
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" className="mt-1 w-full rounded-xl border border-white/10 bg-[#0F1218] px-3 py-2 text-sm outline-none" />
            </div>

            <div>
              <div className="text-sm font-semibold text-white/90">Phone (E.164 format)</div>
              <input value={phoneE164} onChange={(e) => setPhoneE164(e.target.value)} placeholder="+15551234567" className="mt-1 w-full rounded-xl border border-white/10 bg-[#0F1218] px-3 py-2 text-sm outline-none" />
              <div className="mt-1 text-xs text-white/45">Required for SMS reminders.</div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm text-white/80">
                <input type="checkbox" checked={notifEmailEnabled} onChange={(e) => setNotifEmailEnabled(e.target.checked)} />
                Email reminders
              </label>
              <label className="flex items-center gap-2 text-sm text-white/80">
                <input type="checkbox" checked={notifSmsEnabled} onChange={(e) => setNotifSmsEnabled(e.target.checked)} />
                SMS reminders
              </label>
              <label className="flex items-center gap-2 text-sm text-white/80">
                <input type="checkbox" checked={smsConsent} onChange={(e) => setSmsConsent(e.target.checked)} />
                I consent to receive SMS from ClawBack
              </label>
            </div>

            <div>
              <div className="text-sm font-semibold text-white/90">Reminder days before reset</div>
              <input value={offsetsDays.join(", ")} onChange={(e) => setOffsetsDays(e.target.value.split(",").map((x) => parseInt(x.trim(), 10)).filter((x) => !isNaN(x)))} placeholder="7, 1" className="mt-1 w-full rounded-xl border border-white/10 bg-[#0F1218] px-3 py-2 text-sm outline-none" />
              <div className="mt-1 text-xs text-white/45">Comma-separated. Example: 14, 7, 1</div>
            </div>

            <button onClick={saveProfile} disabled={profileLoading} className="w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black hover:bg-white/90 disabled:opacity-50" type="button">
              {profileLoading ? "Saving..." : "Save settings"}
            </button>
            {profileMsg && <div className="text-sm text-white/70">{profileMsg}</div>}
          </div>
        </div>
      </div>
    </div>
  );

  // Left Panel - Card picker
  const LeftPanel = (
    <aside className="lg:col-span-4">
      <div className={surfaceCardClass("p-4")}>
        <div className="flex items-start gap-3 border-b border-white/10 pb-4">
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-black/30">
            <Image src={activeCard.logo} alt={activeCard.name} fill className="object-cover" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-lg font-semibold leading-6 line-clamp-2">{activeCard.name}</div>
            <div className="mt-1 text-sm text-white/55">{activeCard.issuer} • {formatMoney(activeCard.annualFee)}/yr</div>
          </div>
        </div>

        <div className="mt-4">
          <div className="text-sm font-semibold text-white/90">Your Cards</div>
          <div className="mt-1 text-xs text-white/55">{savedCards.length} saved • {isFounder ? "Founder: unlimited" : "Free: 1 card"}</div>

          {!user ? (
            <div className="mt-3 rounded-xl border border-white/10 bg-black/25 p-3 text-xs text-white/70">
              Sign up (free) to save your card + get reminders.
            </div>
          ) : dbWarning ? (
            <div className="mt-3 rounded-xl border border-amber-300/20 bg-amber-300/10 p-3 text-xs text-amber-100/90">{dbWarning}</div>
          ) : null}

          <div className="mt-3 space-y-2">
            {savedCards.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-black/25 p-3 text-xs text-white/60">No saved cards yet. Pick a card and click "Save this card".</div>
            ) : (
              savedCards.map((k) => {
                const card = CARDS.find((c) => c.key === k);
                if (!card) return null;
                const start = cardStartDates[k] ?? "";
                return (
                  <div key={k} className="rounded-xl border border-white/10 bg-black/25 p-3">
                    <div className="flex items-start gap-3">
                      <div className="relative mt-0.5 h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-black/30">
                        <Image src={card.logo} alt={card.name} fill className="object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold leading-5 line-clamp-2">{card.name}</div>
                        <div className="mt-0.5 text-xs text-white/55">Fee: {formatMoney(card.annualFee)}</div>
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="text-[11px] text-white/50">Cardmember year start</div>
                      <input type="date" value={start} onChange={(e) => updateCardStartDate(k, e.target.value)} className="mt-1 w-full rounded-lg border border-white/10 bg-black/25 px-2 py-2 text-xs outline-none" disabled={!user} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Card browser */}
        <div className="mt-4">
          <div className="text-lg font-semibold text-white/95">Browse cards</div>
          <div className="mt-2">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search cards..." className="w-full rounded-xl border border-white/10 bg-[#0F1218] px-3 py-2 text-sm outline-none placeholder:text-white/30" />
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {[
              { label: "All", min: feeBounds.min, max: feeBounds.max },
              { label: "$0–250", min: 0, max: 250 },
              { label: "$250–500", min: 250, max: 500 },
              { label: "$500+", min: 500, max: feeBounds.max },
            ].map((chip) => (
              <button
                key={chip.label}
                onClick={() => { setFeeMin(chip.min); setFeeMax(chip.max); }}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${feeMin === chip.min && feeMax === chip.max ? 'border-purple-400/30 bg-purple-500/20 text-purple-200' : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10'}`}
                type="button"
              >
                {chip.label}
              </button>
            ))}
          </div>

          <div className="mt-3 overflow-auto rounded-2xl border border-white/10 bg-[#0F1218] lg:max-h-[40vh]">
            {topPicksVisible && (
              <div className="border-b border-white/10">
                <div className="px-3 py-3 bg-amber-400/10">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-base font-semibold text-amber-100">Top Picks</div>
                      <div className="text-xs text-white/55">Popular premium cards</div>
                    </div>
                    {badgePill(`${topPicks.length}`, "gold")}
                  </div>
                </div>
                {topPicks.map((c) => <CardRow key={c.key} card={c} showTopPickBadge />)}
              </div>
            )}
            <Section title="Tier 3" subtitle="$500+ annual fee" cards={tier3} accent="slate" />
            <Section title="Tier 2" subtitle="$250–$500" cards={tier2} accent="neutral" />
            <Section title="Tier 1" subtitle="$0–$250" cards={tier1} accent="neutral" />
            {baseFiltered.length === 0 && <div className="p-4 text-sm text-white/60">No cards match your search.</div>}
          </div>

          <button onClick={() => void notifyMeForThisCard()} className="mt-4 w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black hover:bg-white/90" type="button">
            {savedCards.includes(activeCard.key) ? "Saved ✓" : "Save this card"}
          </button>
          <div className="mt-2 text-xs text-white/40 text-center">Free: 1 card • Multi-card: $5 (coming soon)</div>
          {authMsg && <div className="mt-2 rounded-xl border border-white/10 bg-black/25 p-3 text-xs text-white/70">{authMsg}</div>}
        </div>
      </div>
    </aside>
  );

  // Middle Panel - Credits
  const netValue = totals.totalRedeemed - activeCard.annualFee;
  const isPositiveNet = netValue > 0;

  const MiddlePanel = (
    <main className="lg:col-span-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className={surfaceCardClass("p-4 relative overflow-hidden")}>
          <div className="text-xs text-white/55">Credits Redeemed</div>
          <div className="mt-2 text-3xl font-semibold text-emerald-100">{formatMoney(totals.totalRedeemed)}</div>
          <div className="mt-4 h-2 w-full rounded-full bg-black/30">
            <div className="h-2 rounded-full bg-emerald-400/80 transition-all duration-500" style={{ width: `${totals.pct}%` }} />
          </div>
          <div className="mt-2 text-xs text-white/50">{totals.pct}% of available credits used</div>
          {isPositiveNet && (
            <div className="absolute top-2 right-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 px-2 py-1 text-[10px] font-semibold text-emerald-300">🎉 Profitable!</span>
            </div>
          )}
        </div>

        <div className={surfaceCardClass("p-4")}>
          <div className="text-xs text-white/55">Available Credits</div>
          <div className="mt-2 text-3xl font-semibold text-white/95">{formatMoney(totals.totalAvail)}</div>
          <div className="mt-2 text-xs text-white/50">excludes "Don't care" items</div>
        </div>

        <div className={surfaceCardClass(`p-4 ${isPositiveNet ? 'border-emerald-400/15 bg-emerald-500/6' : 'border-red-400/15 bg-red-500/6'}`)}>
          <div className="text-xs text-white/55">Net Value</div>
          <div className={`mt-2 text-3xl font-semibold ${isPositiveNet ? 'text-emerald-100' : 'text-red-100'}`}>
            {isPositiveNet ? '+' : ''}{formatMoney(netValue)}
          </div>
          <div className="mt-2 text-xs text-white/50">redeemed − {formatMoney(activeCard.annualFee)} fee</div>
        </div>
      </div>

      <div className={surfaceCardClass("mt-5 p-4")}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-lg font-semibold text-white/95">Credits</div>
            <div className="text-xs text-white/55">Mark as Used, Don't care, or Remind me</div>
          </div>
        </div>

        <div className="space-y-2">
          {creditsSorted.map((c) => {
            const k = `${activeCard.key}:${c.id}`;
            const isUsedOn = !!used[k];
            const isDontCareOn = !!dontCare[k];
            const isRemindOn = !!remind[k];

            return (
              <div
                key={c.id}
                className={[
                  "rounded-xl border p-3 transition",
                  isDontCareOn ? "border-white/5 bg-black/20 opacity-50" : isUsedOn ? "border-emerald-400/20 bg-emerald-500/10" : "border-white/10 bg-[#0F1218]",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold leading-5">{c.title}</div>
                    <div className="mt-1 text-xs text-white/55">{creditSubtitle(c)}</div>
                    {c.notes && <div className="mt-1 text-[11px] text-white/40">{c.notes}</div>}
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button onClick={() => toggleUsed(k)} className={["flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition", isUsedOn ? "border-emerald-400/30 bg-emerald-500/20 text-emerald-200" : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"].join(" ")} type="button">
                    <IconCheck className="h-3.5 w-3.5" />Used
                  </button>
                  <button onClick={() => toggleDontCare(k)} className={["flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition", isDontCareOn ? "border-slate-400/30 bg-slate-500/20 text-slate-200" : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"].join(" ")} type="button">
                    <IconEyeOff className="h-3.5 w-3.5" />Don't care
                  </button>
                  <button onClick={() => toggleRemind(k)} className={["flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition", isRemindOn ? "border-sky-400/30 bg-sky-500/20 text-sky-200" : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"].join(" ")} type="button">
                    <IconBell className="h-3.5 w-3.5" />Remind
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );

  // Helper to format points program name
  const formatProgramName = (program: string) => {
    const names: Record<string, string> = {
      amex_mr: "MEMBERSHIP REWARDS",
      chase_ur: "ULTIMATE REWARDS",
      cap1_miles: "CAPITAL ONE MILES",
      citi_typ: "THANKYOU POINTS",
      aa_miles: "AADVANTAGE MILES",
      delta_miles: "SKYMILES",
      marriott_points: "MARRIOTT BONVOY",
      hilton_points: "HILTON HONORS",
      cashback: "CASH BACK",
    };
    return names[program] || program.toUpperCase();
  };

  // Right Panel - Points/Rewards, Expiring Soon & Reminders
  const RightPanel = (
    <aside className="lg:col-span-3">
      {/* Points / Rewards */}
      <div className={surfaceCardClass("p-5 mb-5")}>
        <div className="text-lg font-semibold text-white/95">Points / Rewards</div>
        <div className="mt-1 text-[11px] text-white/40 uppercase tracking-wider">{formatProgramName(activeCard.pointsProgram)}</div>
        <div className="mt-4 space-y-3">
          {activeCard.multipliers.map((m, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="rounded-full bg-purple-500/20 border border-purple-400/30 px-2.5 py-0.5 text-base font-bold text-purple-200 min-w-[44px] text-center">{m.x}x</span>
              <span className="text-sm text-white/70 leading-tight">{m.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Expiring Soon */}
      <div className={surfaceCardClass("p-5 border-sky-300/12 bg-sky-500/5")}>
        <div className="text-lg font-semibold text-white/95">Expiring soon</div>
        <div className="mt-1 text-xs text-white/55">Credits resetting in the next 14 days</div>

        {!cardStartDates[activeCard.key] ? (
          <div className="mt-4 rounded-xl border border-amber-300/20 bg-amber-300/10 p-3 text-sm text-amber-100/90">
            Set your <b>cardmember year start date</b> to see expiring credits.
          </div>
        ) : null}

        <div className="mt-4 space-y-2">
          {expiringSoon.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-black/25 p-3 text-sm text-white/60">
              {cardStartDates[activeCard.key] ? "No credits expiring soon with Remind on." : "Set start date + toggle Remind."}
            </div>
          ) : (
            expiringSoon.map((x) => (
              <div key={x.credit.id} className="rounded-xl border border-white/10 bg-[#0F1218] p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold leading-5 line-clamp-2">{x.credit.title}</div>
                    <div className="mt-1 text-xs text-white/55">{formatMoney(x.credit.amount)}</div>
                  </div>
                  <div className="shrink-0 rounded-full border border-sky-300/20 bg-sky-300/10 px-2 py-0.5 text-[11px] text-sky-100">
                    {formatDateShort(x.due)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className={surfaceCardClass("mt-5 p-5")}>
        <div className="text-lg font-semibold text-white/95">Reminders</div>
        <div className="mt-1 text-xs text-white/55">
          Schedule: <b>{normalizeOffsets(offsetsDays).join(", ")}</b> days before
        </div>
        <div className="mt-3 rounded-xl border border-white/10 bg-black/25 p-3 text-xs text-white/65">
          Email: <b className="text-white/85">{notifEmailEnabled ? "ON" : "OFF"}</b> • SMS: <b className="text-white/85">{notifSmsEnabled ? "ON" : "OFF"}</b>
          <div className="mt-2 text-[11px] text-white/45">Configure in Settings (gear icon).</div>
        </div>
      </div>

      {/* Quick tips */}
      <div className={surfaceCardClass("mt-5 p-5")}>
        <div className="text-base font-semibold text-white/95">💡 Quick tips</div>
        <ul className="mt-3 space-y-2 text-xs text-white/60">
          <li>• Toggle <span className="text-emerald-300">Used</span> when you redeem a credit</li>
          <li>• Toggle <span className="text-slate-300">Don't care</span> to hide credits you won't use</li>
          <li>• Toggle <span className="text-sky-300">Remind</span> to get notified before expiry</li>
        </ul>
      </div>
    </aside>
  );

  // Quiz Modal
  const categoryInfo: Record<SpendCategory, { emoji: string; name: string }> = {
    dining: { emoji: "🍽️", name: "Dining & Restaurants" },
    travel: { emoji: "✈️", name: "Travel & Hotels" },
    groceries: { emoji: "🛒", name: "Groceries" },
    gas: { emoji: "⛽", name: "Gas & Transit" },
    online: { emoji: "🛍️", name: "Online Shopping" },
    other: { emoji: "💳", name: "Everything Else" },
  };

  const QuizModal = !quizOpen ? null : (
    <div className="fixed inset-0 z-50">
      <button className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setQuizOpen(false)} aria-label="Close" />
      <div className="absolute left-1/2 top-8 w-[92vw] max-w-xl -translate-x-1/2 max-h-[90vh] overflow-auto">
        <div className={surfaceCardClass("p-6")}>
          
          {quizStep === 'intro' && (
            <div className="text-center">
              <div className="mx-auto w-14 h-14 rounded-full bg-gradient-to-br from-purple-500/30 to-indigo-500/30 flex items-center justify-center mb-5">
                <IconSparkles className="h-7 w-7 text-purple-300" />
              </div>
              <h2 className="text-2xl font-bold text-white/95">Find Your Perfect Card</h2>
              <p className="mt-3 text-white/60">Answer 7 quick questions and we'll recommend the best card for your spending.</p>
              
              <div className="mt-8 space-y-3">
                <button onClick={() => setQuizStep('q1_dining')} className="w-full rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 px-6 py-4 text-base font-semibold text-white hover:opacity-90 transition" type="button">
                  Let's do it →
                </button>
                <button onClick={() => setQuizOpen(false)} className="w-full rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm text-white/70 hover:bg-white/10 transition" type="button">
                  Not right now
                </button>
              </div>
            </div>
          )}

          {/* Q1: Dining */}
          {quizStep === 'q1_dining' && (
            <div>
              <div className="text-xs text-white/40 mb-2">Question 1 of 7</div>
              <h2 className="text-xl font-bold text-white/95">Monthly dining spend?</h2>
              <p className="mt-2 text-sm text-white/60">Restaurants, cafes, bars, etc.</p>

              <div className="mt-5 grid grid-cols-2 gap-3">
                {[
                  { label: "Under $100", value: 75 },
                  { label: "$100 – $300", value: 200 },
                  { label: "$300 – $600", value: 450 },
                  { label: "$600+", value: 800 },
                ].map((opt) => (
                  <button key={opt.value} onClick={() => setQDining(opt.value)} className={["rounded-xl border p-4 text-left transition", qDining === opt.value ? "border-purple-400/30 bg-purple-500/15" : "border-white/10 bg-white/5 hover:bg-white/10"].join(" ")} type="button">
                    <div className="text-sm font-medium text-white/90">{opt.label}</div>
                  </button>
                ))}
              </div>
              <button onClick={() => setQuizStep('q2_travel')} className="mt-6 w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black hover:bg-white/90" type="button">Continue →</button>
            </div>
          )}

          {/* Q2: Travel */}
          {quizStep === 'q2_travel' && (
            <div>
              <button onClick={() => setQuizStep('q1_dining')} className="text-sm text-white/50 hover:text-white/80 mb-2">← Back</button>
              <div className="text-xs text-white/40 mb-2">Question 2 of 7</div>
              <h2 className="text-xl font-bold text-white/95">Monthly travel spend?</h2>
              <p className="mt-2 text-sm text-white/60">Flights, hotels, rental cars, etc.</p>

              <div className="mt-5 grid grid-cols-2 gap-3">
                {[
                  { label: "Under $100", value: 50 },
                  { label: "$100 – $300", value: 200 },
                  { label: "$300 – $700", value: 500 },
                  { label: "$700+", value: 1000 },
                ].map((opt) => (
                  <button key={opt.value} onClick={() => setQTravel(opt.value)} className={["rounded-xl border p-4 text-left transition", qTravel === opt.value ? "border-purple-400/30 bg-purple-500/15" : "border-white/10 bg-white/5 hover:bg-white/10"].join(" ")} type="button">
                    <div className="text-sm font-medium text-white/90">{opt.label}</div>
                  </button>
                ))}
              </div>
              <button onClick={() => setQuizStep('q3_frequency')} className="mt-6 w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black hover:bg-white/90" type="button">Continue →</button>
            </div>
          )}

          {/* Q3: Travel Frequency */}
          {quizStep === 'q3_frequency' && (
            <div>
              <button onClick={() => setQuizStep('q2_travel')} className="text-sm text-white/50 hover:text-white/80 mb-2">← Back</button>
              <div className="text-xs text-white/40 mb-2">Question 3 of 7</div>
              <h2 className="text-xl font-bold text-white/95">How often do you travel?</h2>
              <p className="mt-2 text-sm text-white/60">Trips per year (flights or hotel stays)</p>

              <div className="mt-5 grid grid-cols-2 gap-3">
                {[
                  { label: "0–1 trips", value: '0-1' },
                  { label: "2–4 trips", value: '2-4' },
                  { label: "5–10 trips", value: '5-10' },
                  { label: "10+ trips", value: '10+' },
                ].map((opt) => (
                  <button key={opt.value} onClick={() => setQTravelFreq(opt.value)} className={["rounded-xl border p-4 text-left transition", qTravelFreq === opt.value ? "border-purple-400/30 bg-purple-500/15" : "border-white/10 bg-white/5 hover:bg-white/10"].join(" ")} type="button">
                    <div className="text-sm font-medium text-white/90">{opt.label}</div>
                  </button>
                ))}
              </div>
              <button onClick={() => setQuizStep('q4_fee')} className="mt-6 w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black hover:bg-white/90" type="button">Continue →</button>
            </div>
          )}

          {/* Q4: Fee Tolerance */}
          {quizStep === 'q4_fee' && (
            <div>
              <button onClick={() => setQuizStep('q3_frequency')} className="text-sm text-white/50 hover:text-white/80 mb-2">← Back</button>
              <div className="text-xs text-white/40 mb-2">Question 4 of 7</div>
              <h2 className="text-xl font-bold text-white/95">Annual fee comfort?</h2>
              <p className="mt-2 text-sm text-white/60">Higher fee cards often have more valuable perks.</p>

              <div className="mt-5 space-y-3">
                {[
                  { label: "Under $250/year", value: '0-250', desc: "No fee or low fee cards" },
                  { label: "$250 – $500/year", value: '250-500', desc: "Mid-range premium cards" },
                  { label: "$500+/year", value: '500+', desc: "Top-tier premium cards" },
                ].map((opt) => (
                  <button key={opt.value} onClick={() => setQFeeTolerance(opt.value)} className={["w-full rounded-xl border p-4 text-left transition", qFeeTolerance === opt.value ? "border-purple-400/30 bg-purple-500/15" : "border-white/10 bg-white/5 hover:bg-white/10"].join(" ")} type="button">
                    <div className="text-sm font-medium text-white/90">{opt.label}</div>
                    <div className="text-xs text-white/50 mt-1">{opt.desc}</div>
                  </button>
                ))}
              </div>
              <button onClick={() => setQuizStep('q5_delivery')} className="mt-6 w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black hover:bg-white/90" type="button">Continue →</button>
            </div>
          )}

          {/* Q5: Delivery Apps */}
          {quizStep === 'q5_delivery' && (
            <div>
              <button onClick={() => setQuizStep('q4_fee')} className="text-sm text-white/50 hover:text-white/80 mb-2">← Back</button>
              <div className="text-xs text-white/40 mb-2">Question 5 of 7</div>
              <h2 className="text-xl font-bold text-white/95">Use delivery apps?</h2>
              <p className="mt-2 text-sm text-white/60">Uber, DoorDash, Instacart, etc.</p>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <button onClick={() => setQUsesDelivery(true)} className={["rounded-xl border p-5 text-center transition", qUsesDelivery ? "border-purple-400/30 bg-purple-500/15" : "border-white/10 bg-white/5 hover:bg-white/10"].join(" ")} type="button">
                  <div className="text-2xl mb-2">✅</div>
                  <div className="text-sm font-medium text-white/90">Yes, regularly</div>
                </button>
                <button onClick={() => setQUsesDelivery(false)} className={["rounded-xl border p-5 text-center transition", !qUsesDelivery ? "border-purple-400/30 bg-purple-500/15" : "border-white/10 bg-white/5 hover:bg-white/10"].join(" ")} type="button">
                  <div className="text-2xl mb-2">❌</div>
                  <div className="text-sm font-medium text-white/90">No / rarely</div>
                </button>
              </div>
              <button onClick={() => setQuizStep('q6_optimize')} className="mt-6 w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black hover:bg-white/90" type="button">Continue →</button>
            </div>
          )}

          {/* Q6: Optimization Style */}
          {quizStep === 'q6_optimize' && (
            <div>
              <button onClick={() => setQuizStep('q5_delivery')} className="text-sm text-white/50 hover:text-white/80 mb-2">← Back</button>
              <div className="text-xs text-white/40 mb-2">Question 6 of 7</div>
              <h2 className="text-xl font-bold text-white/95">Your optimization style?</h2>
              <p className="mt-2 text-sm text-white/60">How much effort do you want to put in?</p>

              <div className="mt-5 space-y-3">
                <button onClick={() => setQOptimize('simple')} className={["w-full rounded-xl border p-4 text-left transition", qOptimize === 'simple' ? "border-purple-400/30 bg-purple-500/15" : "border-white/10 bg-white/5 hover:bg-white/10"].join(" ")} type="button">
                  <div className="text-sm font-medium text-white/90">😌 Keep it simple</div>
                  <div className="text-xs text-white/50 mt-1">One good card for everything</div>
                </button>
                <button onClick={() => setQOptimize('maximize')} className={["w-full rounded-xl border p-4 text-left transition", qOptimize === 'maximize' ? "border-purple-400/30 bg-purple-500/15" : "border-white/10 bg-white/5 hover:bg-white/10"].join(" ")} type="button">
                  <div className="text-sm font-medium text-white/90">🎯 Maximize rewards</div>
                  <div className="text-xs text-white/50 mt-1">Willing to track credits and optimize</div>
                </button>
              </div>
              <button onClick={() => setQuizStep('q7_brand')} className="mt-6 w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black hover:bg-white/90" type="button">Continue →</button>
            </div>
          )}

          {/* Q7: Brand Preference */}
          {quizStep === 'q7_brand' && (
            <div>
              <button onClick={() => setQuizStep('q6_optimize')} className="text-sm text-white/50 hover:text-white/80 mb-2">← Back</button>
              <div className="text-xs text-white/40 mb-2">Question 7 of 7</div>
              <h2 className="text-xl font-bold text-white/95">Brand preference?</h2>
              <p className="mt-2 text-sm text-white/60">Do you prefer a specific card issuer?</p>

              <div className="mt-5 space-y-2">
                {[
                  { label: "Open to any brand", value: 'any' },
                  { label: "Prefer Chase", value: 'chase' },
                  { label: "Prefer Amex", value: 'amex' },
                  { label: "Prefer Capital One", value: 'cap1' },
                  { label: "Prefer Citi", value: 'citi' },
                  { label: "Avoid Amex (acceptance concerns)", value: 'avoid-amex' },
                ].map((opt) => (
                  <button key={opt.value} onClick={() => setQBrandPref(opt.value)} className={["w-full rounded-xl border p-3 text-left transition", qBrandPref === opt.value ? "border-purple-400/30 bg-purple-500/15" : "border-white/10 bg-white/5 hover:bg-white/10"].join(" ")} type="button">
                    <div className="text-sm font-medium text-white/90">{opt.label}</div>
                  </button>
                ))}
              </div>
              <button onClick={() => setQuizStep('results')} className="mt-6 w-full rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 px-4 py-3 text-sm font-semibold text-white hover:opacity-90" type="button">
                Show my recommendations →
              </button>
            </div>
          )}

          {/* Results */}
          {quizStep === 'results' && (
            <div>
              <h2 className="text-xl font-bold text-white/95">Your Top Matches</h2>
              <p className="mt-2 text-sm text-white/60">Based on your answers</p>

              <div className="mt-5 space-y-4">
                {quizResults.map((r, i) => (
                  <div key={r.card.key} className={["rounded-xl border p-4", i === 0 ? "border-amber-400/30 bg-gradient-to-br from-amber-500/15 to-orange-500/10" : "border-white/10 bg-[#0F1218]"].join(" ")}>
                    <div className="flex items-start gap-3">
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-black/30">
                        <Image src={r.card.logo} alt={r.card.name} fill className="object-cover" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            {i === 0 && <span className="inline-block mb-1 rounded-full bg-amber-400/20 border border-amber-400/30 px-2 py-0.5 text-[10px] font-semibold text-amber-200">🏆 Best Match</span>}
                            <div className="text-base font-semibold text-white/95">{r.card.name}</div>
                            <div className="text-xs text-white/55">{r.card.issuer} • {formatMoney(r.card.annualFee)}/yr</div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-emerald-300">+{formatMoney(r.estAnnualValue)}</div>
                            <div className="text-[10px] text-white/50">est. value/yr</div>
                          </div>
                        </div>
                        <button onClick={() => { setActiveCardKey(r.card.key); setQuizOpen(false); }} className="mt-3 rounded-lg border border-white/15 bg-white/10 px-4 py-2 text-xs font-medium text-white/90 hover:bg-white/15 transition" type="button">
                          View card →
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button onClick={() => { resetQuiz(); }} className="mt-5 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70 hover:bg-white/10" type="button">
                Start over
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative min-h-screen text-white">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[#070A12]" />
        <div className="absolute inset-0 bg-[radial-gradient(60%_40%_at_20%_20%,rgba(88,101,242,0.18),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(50%_40%_at_80%_30%,rgba(139,92,246,0.16),transparent_60%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.04),transparent_40%,transparent_60%,rgba(255,255,255,0.03))]" />
      </div>

      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <a href="/" className="text-2xl font-semibold text-white/95 hover:text-white transition">ClawBack</a>
            <div className="text-sm text-white/55">Track credits. Get reminders. Save money.</div>
          </div>
          {TopRight}
        </div>

        {/* Main Content - Tab Aware */}
        {activeTab === 'dashboard' && (
          <>
            {/* Mobile tabs */}
            <div className="mb-4 flex gap-2 lg:hidden">
              {[
                { key: "cards", label: "Cards" },
                { key: "credits", label: "Credits" },
                { key: "insights", label: "Insights" },
              ].map((t) => (
                <button key={t.key} type="button" onClick={() => setMobileView(t.key as "cards" | "credits" | "insights")} className={["flex-1 rounded-full border px-3 py-2 text-sm font-semibold transition", mobileView === t.key ? "border-white/20 bg-white/10 text-white" : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"].join(" ")}>
                  {t.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              <div className={["lg:block", mobileView === "cards" ? "block" : "hidden", "lg:col-span-4"].join(" ")}>{LeftPanel}</div>
              <div className={["lg:block", mobileView === "credits" ? "block" : "hidden", "lg:col-span-5"].join(" ")}>{MiddlePanel}</div>
              <div className={["lg:block", mobileView === "insights" ? "block" : "hidden", "lg:col-span-3"].join(" ")}>{RightPanel}</div>
            </div>
          </>
        )}

        {activeTab === 'coming-soon' && (
          <div className="max-w-4xl mx-auto">
            <div className={surfaceCardClass("p-8 text-center")}>
              <div className="text-3xl mb-2">🚀</div>
              <h2 className="text-2xl font-bold text-white/95">Coming Soon</h2>
              <p className="mt-2 text-white/60">Features on our roadmap</p>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {[
                { icon: "📸", title: "Receipt Scan", desc: "Scan receipts or statements → auto-marks credits as Used" },
                { icon: "💳", title: "Best Card to Use", desc: "Know which card to swipe at restaurants, hotels, flights" },
                { icon: "✈️", title: "Airport Mode", desc: "Quick access to lounge info + travel benefits at the airport" },
                { icon: "📧", title: "Email Forward", desc: "Forward confirmation emails → we detect credits posted" },
                { icon: "🔔", title: "Smart Reminders", desc: "\"Your Uber credit expires tomorrow—use it here...\"" },
                { icon: "📊", title: "Annual Report", desc: "See your total savings, usage patterns, and ROI per card" },
              ].map((item) => (
                <div key={item.title} className={surfaceCardClass("p-5")}>
                  <div className="text-2xl mb-3">{item.icon}</div>
                  <div className="text-base font-semibold text-white/95">{item.title}</div>
                  <p className="mt-2 text-sm text-white/55">{item.desc}</p>
                </div>
              ))}
            </div>

            {!isPro && (
              <div className={surfaceCardClass("mt-6 p-6 text-center border-purple-500/20 bg-purple-500/5")}>
                <div className="text-lg font-semibold text-white/95">Unlock Pro Lifetime</div>
                <p className="mt-2 text-sm text-white/60">Get unlimited cards, Expiring Soon alerts, and more for just $9.99 one-time.</p>
                <button onClick={() => setUpgradeModalOpen(true)} className="mt-4 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 px-6 py-3 text-sm font-semibold text-white hover:opacity-90 transition" type="button">
                  Upgrade to Pro — $9.99
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-2xl mx-auto">
            <div className={surfaceCardClass("p-6")}>
              <h2 className="text-xl font-bold text-white/95">Settings</h2>
              {user && <p className="mt-1 text-sm text-white/55">{user.email}</p>}

              <div className="mt-6 space-y-5">
                <div>
                  <label className="text-sm font-semibold text-white/90">Display name</label>
                  <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" className="mt-2 w-full rounded-xl border border-white/10 bg-[#0F1218] px-4 py-3 text-sm outline-none" />
                </div>

                <div>
                  <label className="text-sm font-semibold text-white/90">Phone (for SMS)</label>
                  <input value={phoneE164} onChange={(e) => setPhoneE164(e.target.value)} placeholder="+15551234567" className="mt-2 w-full rounded-xl border border-white/10 bg-[#0F1218] px-4 py-3 text-sm outline-none" />
                </div>

                <div className="space-y-3">
                  <label className="flex items-center gap-3 text-sm text-white/80">
                    <input type="checkbox" checked={notifEmailEnabled} onChange={(e) => setNotifEmailEnabled(e.target.checked)} className="h-4 w-4 rounded" />
                    Email reminders
                  </label>
                  <label className="flex items-center gap-3 text-sm text-white/80">
                    <input type="checkbox" checked={notifSmsEnabled} onChange={(e) => setNotifSmsEnabled(e.target.checked)} className="h-4 w-4 rounded" />
                    SMS reminders
                  </label>
                  <label className="flex items-center gap-3 text-sm text-white/80">
                    <input type="checkbox" checked={smsConsent} onChange={(e) => setSmsConsent(e.target.checked)} className="h-4 w-4 rounded" />
                    I consent to receive SMS from ClawBack
                  </label>
                </div>

                <div>
                  <label className="text-sm font-semibold text-white/90">Reminder days before reset</label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {[1, 3, 5, 7, 10, 14].map((d) => (
                      <button
                        key={d}
                        onClick={() => {
                          if (!isPro && !offsetsDays.includes(d)) {
                            setUpgradeModalOpen(true);
                            return;
                          }
                          setOffsetsDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d].sort((a,b) => b - a));
                        }}
                        className={[
                          "rounded-full border px-4 py-2 text-sm font-medium transition",
                          offsetsDays.includes(d) ? "border-purple-400/30 bg-purple-500/20 text-purple-200" : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
                        ].join(" ")}
                        type="button"
                      >
                        {d} days
                      </button>
                    ))}
                  </div>
                  {!isPro && <p className="mt-2 text-xs text-white/40">Custom offsets require Pro</p>}
                </div>

                <button onClick={saveProfile} disabled={profileLoading} className="w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black hover:bg-white/90 disabled:opacity-50" type="button">
                  {profileLoading ? "Saving..." : "Save settings"}
                </button>
                {profileMsg && <div className="text-sm text-white/70">{profileMsg}</div>}
              </div>
            </div>

            {/* Pro Status */}
            <div className={surfaceCardClass("mt-6 p-6")}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-base font-semibold text-white/95">Plan</div>
                  <p className="mt-1 text-sm text-white/55">{isPro ? "Pro Lifetime — unlimited features" : "Free — 1 card, email reminders"}</p>
                </div>
                {isPro ? (
                  <div className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-400/30 px-3 py-1.5 text-xs font-semibold text-amber-200">
                    <span>✨</span>
                    <span>PRO Lifetime</span>
                  </div>
                ) : (
                  <button onClick={() => setUpgradeModalOpen(true)} className="rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition" type="button">
                    Upgrade — $9.99
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-10 pt-6 border-t border-white/10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/40">
            <div>© 2026 ClawBack</div>
            <div className="flex items-center gap-2">
              <svg className="h-3.5 w-3.5 text-emerald-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>No bank logins. No SSN. We only store your card selections + reminder preferences.</span>
            </div>
            <div className="flex items-center gap-4">
              <a href="/privacy" className="hover:text-white/70 transition">Privacy</a>
              <a href="/terms" className="hover:text-white/70 transition">Terms</a>
              <a href="mailto:hello@clawback.app" className="hover:text-white/70 transition">Contact</a>
            </div>
          </div>
        </footer>
      </div>

      {AuthModal}
      {SettingsModal}
      {QuizModal}

      {/* Upgrade Modal */}
      {upgradeModalOpen && (
        <div className="fixed inset-0 z-50">
          <button className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setUpgradeModalOpen(false)} aria-label="Close" />
          <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2">
            <div className={surfaceCardClass("p-6 text-center border-purple-500/20")}>
              <div className="mx-auto w-14 h-14 rounded-full bg-gradient-to-br from-amber-500/30 to-yellow-500/30 flex items-center justify-center mb-5">
                <span className="text-2xl">✨</span>
              </div>
              <h2 className="text-2xl font-bold text-white/95">Unlock Pro Lifetime</h2>
              <p className="mt-3 text-white/60">One-time payment. Forever access.</p>

              <ul className="mt-6 space-y-3 text-left">
                {[
                  "Track unlimited cards",
                  "Expiring Soon alerts (real reset dates)",
                  "Custom reminder schedule",
                  "Export credits + reminders (CSV)",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-white/80">
                    <svg className="h-5 w-5 text-emerald-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>

              <div className="mt-6 pt-6 border-t border-white/10">
                <div className="text-3xl font-bold text-white/95">$9.99</div>
                <div className="text-sm text-white/50">one-time payment</div>
              </div>

              <div className="mt-4 text-xs text-white/40 flex items-center justify-center gap-2">
                <svg className="h-4 w-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>No subscriptions. No bank connections.</span>
              </div>

              <div className="mt-6 space-y-3">
                <button onClick={handleUpgrade} className="w-full rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 px-6 py-4 text-base font-semibold text-white hover:opacity-90 transition" type="button">
                  Upgrade for $9.99
                </button>
                <button onClick={() => setUpgradeModalOpen(false)} className="w-full rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm text-white/70 hover:bg-white/10 transition" type="button">
                  Not now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-xl border border-emerald-400/30 bg-emerald-500/20 backdrop-blur px-5 py-3 text-sm text-emerald-100 shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
