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
// SUPABASE (non-null, TS-safe)
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
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

  function randomInRange(min: number, max: number) {
    return Math.random() * (max - min) + min;
  }

  const interval = setInterval(function () {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 50 * (timeLeft / duration);

    // Create confetti particles manually with CSS
    for (let i = 0; i < particleCount / 10; i++) {
      createConfettiParticle(randomInRange(0.2, 0.4), randomInRange(0.5, 0.9));
      createConfettiParticle(randomInRange(0.6, 0.8), randomInRange(0.5, 0.9));
    }
  }, 250);
}

function createConfettiParticle(x: number, y: number) {
  const colors = ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#fbbf24', '#f59e0b', '#8b5cf6', '#a78bfa'];
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

// Add keyframes for confetti
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
  card_start_date: string | null; // yyyy-mm-dd
};

type DbCreditState = {
  state_key: string; // `${cardKey}:${creditId}`
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
// ICONS (no dependencies)
// -----------------------------
function IconBell({ className }: { className?: string }) {
  return (
    <svg className={className ?? "h-4 w-4"} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M15 17H9m10-2V11a7 7 0 10-14 0v4l-2 2h18l-2-2z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 19a2 2 0 01-4 0"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
function IconEyeOff({ className }: { className?: string }) {
  return (
    <svg className={className ?? "h-4 w-4"} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path
        d="M10.6 10.6a3 3 0 004.24 4.24"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M9.9 5.2A10.5 10.5 0 0122 12c-.8 1.8-2.2 3.9-4.3 5.5M6.2 6.2C4.1 7.8 2.8 10 2 12c1.7 3.9 6 8 10 8 1.3 0 2.6-.3 3.8-.8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function IconCheck({ className }: { className?: string }) {
  return (
    <svg className={className ?? "h-4 w-4"} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M20 6L9 17l-5-5"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function IconGear({ className }: { className?: string }) {
  return (
    <svg className={className ?? "h-4 w-4"} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 15.5a3.5 3.5 0 110-7 3.5 3.5 0 010 7z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M19.4 15a8.4 8.4 0 000-6l-2.1.4a6.7 6.7 0 00-1.2-1.2L16.5 6a8.4 8.4 0 00-6 0l.4 2.2a6.7 6.7 0 00-1.2 1.2L7.5 9a8.4 8.4 0 000 6l2.2-.4a6.7 6.7 0 001.2 1.2L10.5 18a8.4 8.4 0 006 0l-.4-2.2a6.7 6.7 0 001.2-1.2l2.1.4z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconSparkles({ className }: { className?: string }) {
  return (
    <svg className={className ?? "h-4 w-4"} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M19 15l.5 1.5 1.5.5-1.5.5-.5 1.5-.5-1.5L17 17l1.5-.5.5-1.5z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5 19l.5 1.5L7 21l-1.5.5L5 23l-.5-1.5L3 21l1.5-.5L5 19z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// -----------------------------
// HELPERS
// -----------------------------
function formatMoney(n: number): string {
  return n.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });
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
  const order: CreditFrequency[] = [
    "monthly",
    "quarterly",
    "semiannual",
    "annual",
    "every4years",
    "every5years",
    "onetime",
  ];
  return order.indexOf(freq);
}

function creditSubtitle(c: Credit): string {
  const a = annualize(c.amount, c.frequency);
  return `${freqLabel(c.frequency)} • ${formatMoney(c.amount)} • Annualized: ${formatMoney(a)}`;
}

function surfaceCardClass(extra?: string): string {
  return [
    "rounded-2xl border border-white/10 bg-[#11141B]/80 backdrop-blur-sm shadow-[0_0_70px_rgba(0,0,0,0.55)]",
    extra ?? "",
  ].join(" ");
}

function formatDateShort(d: Date): string {
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

// -----------------------------
// EXPIRING SOON DATE MATH (v2)
// -----------------------------
function nextResetDateForCredit(params: {
  credit: Credit;
  cardStartDate: Date; // user's cardmember year start
  now: Date;
}): Date | null {
  const { credit, cardStartDate, now } = params;

  if (credit.frequency === "onetime") return null;

  const makeDate = (y: number, m0: number, d: number) => {
    const dd = clampDayToEndOfMonth(y, m0, d);
    return new Date(y, m0, dd, 0, 0, 0, 0);
  };

  const startMonth = cardStartDate.getMonth();
  const startDay = cardStartDate.getDate();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // monthly → next month same day (clamp)
  if (credit.frequency === "monthly") {
    const y = now.getFullYear();
    const m0 = now.getMonth();
    const nextM0 = m0 + 1;
    const nextY = y + Math.floor(nextM0 / 12);
    const normalizedM0 = ((nextM0 % 12) + 12) % 12;
    return makeDate(nextY, normalizedM0, startDay);
  }

  // every4years / every5years
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

  // quarterly / semiannual / annual
  const monthsStep =
    credit.frequency === "quarterly"
      ? 3
      : credit.frequency === "semiannual"
      ? 6
      : 12;

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
// QUIZ ENGINE (deterministic)
// -----------------------------
type QuizInputs = {
  spend: Record<SpendCategory, number>; // monthly spend
  annualFeeTolerance: number; // soft penalty threshold
  creditUtilizationPct: number; // 0..1
  includeWelcomeBonus: boolean;
};

type QuizStep = 'intro' | 'categories' | 'fee' | 'results';

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
    `Fee penalty (soft): -${formatMoney(penalty)}`,
  ];

  return { score, estAnnualValue, breakdown };
}

function inTier(card: Card, min: number, max: number): boolean {
  return card.annualFee >= min && card.annualFee <= max;
}

function normalizeOffsets(input: number[]): number[] {
  const cleaned = input
    .map((x) => Number(x))
    .filter((x) => Number.isFinite(x) && x > 0 && x <= 60);
  const unique = Array.from(new Set(cleaned));
  unique.sort((a, b) => b - a); // show larger first: 14, 7, 1
  return unique.length ? unique : [7, 1];
}

// -----------------------------
// PAGE
// -----------------------------
export default function AppDashboardPage() {
  const [mobileView, setMobileView] = useState<"cards" | "credits" | "insights">("credits");

  // Auth
  const [session, setSession] = useState<Session | null>(null);
  const user: User | null = session?.user ?? null;

  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [authMsg, setAuthMsg] = useState<string | null>(null);

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup" | "reset">("signin");
  const [resetEmail, setResetEmail] = useState("");
  const [resetMsg, setResetMsg] = useState<string | null>(null);

  // Settings (profiles)
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [phoneE164, setPhoneE164] = useState("");
  const [notifEmailEnabled, setNotifEmailEnabled] = useState(true);
  const [notifSmsEnabled, setNotifSmsEnabled] = useState(false);
  const [smsConsent, setSmsConsent] = useState(false);
  const [offsetsDays, setOffsetsDays] = useState<number[]>([7, 1]);

  const displayName = useMemo(() => {
    const n = fullName.trim();
    if (n) return n;
    return (user?.email ?? "").trim();
  }, [fullName, user?.email]);

  // Founder logic
  const FOUNDER_EMAIL = "namanlohia02@gmail.com";
  const isFounder = (user?.email ?? "").toLowerCase() === FOUNDER_EMAIL.toLowerCase();

  // Top Picks pinned
  const pinnedOrder: Card["key"][] = ["amex-platinum", "chase-sapphire-reserve", "capitalone-venture-x"];

  const [search, setSearch] = useState("");

  // ✅ Platinum default
  const [activeCardKey, setActiveCardKey] = useState<Card["key"]>("amex-platinum");

  const [savedCards, setSavedCards] = useState<string[]>([]);
  const [cardStartDates, setCardStartDates] = useState<Record<string, string>>({});
  const [used, setUsed] = useState<ToggleState>({});
  const [dontCare, setDontCare] = useState<ToggleState>({});
  const [remind, setRemind] = useState<ToggleState>({});

  const [dbWarning, setDbWarning] = useState<string | null>(null);

  // Confetti state - track if we've celebrated
  const [hasCelebrated, setHasCelebrated] = useState<Record<string, boolean>>({});

  // Fee filter
  const feeBounds = useMemo(() => {
    const fees = CARDS.map((c) => c.annualFee);
    return { min: Math.min(...fees), max: Math.max(...fees) };
  }, []);

  const [feeMin, setFeeMin] = useState<number>(feeBounds.min);
  const [feeMax, setFeeMax] = useState<number>(feeBounds.max);

  const activeCard = useMemo(() => CARDS.find((c) => c.key === activeCardKey) ?? CARDS[0], [activeCardKey]);

  // ✅ Credits sorted by frequency bucket THEN alphabetized by title
  const creditsSorted = useMemo(() => {
    return activeCard.credits
      .slice()
      .sort((a, b) => {
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

  // 🎉 CONFETTI: Check if redeemed exceeds annual fee
  useEffect(() => {
    const cardKey = activeCard.key;
    const exceedsFee = totals.totalRedeemed > activeCard.annualFee;
    const alreadyCelebrated = hasCelebrated[cardKey];

    if (exceedsFee && !alreadyCelebrated && totals.totalRedeemed > 0) {
      fireConfetti();
      setHasCelebrated(prev => ({ ...prev, [cardKey]: true }));
    }
  }, [totals.totalRedeemed, activeCard.annualFee, activeCard.key, hasCelebrated]);

  // Quiz state - with step flow
  const [quizOpen, setQuizOpen] = useState(false);
  const [quizStep, setQuizStep] = useState<QuizStep>('intro');
  const [selectedCategories, setSelectedCategories] = useState<SpendCategory[]>([]);
  const [quiz, setQuiz] = useState<QuizInputs>({
    spend: { dining: 600, travel: 400, groceries: 400, gas: 120, online: 200, other: 800 },
    annualFeeTolerance: 200,
    creditUtilizationPct: 0.5,
    includeWelcomeBonus: true,
  });

  const quizResults = useMemo(() => {
    const scored = CARDS.map((c) => ({ card: c, ...scoreCard(c, quiz) })).sort((a, b) => b.score - a.score);
    return scored.slice(0, 3);
  }, [quiz]);

  const resetQuiz = useCallback(() => {
    setQuizStep('intro');
    setSelectedCategories([]);
    setQuiz({
      spend: { dining: 600, travel: 400, groceries: 400, gas: 120, online: 200, other: 800 },
      annualFeeTolerance: 200,
      creditUtilizationPct: 0.5,
      includeWelcomeBonus: true,
    });
  }, []);

  // -----------------------------
  // AUTH: init + subscribe
  // -----------------------------
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

  // -----------------------------
  // LOAD USER DATA
  // -----------------------------
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

        // 1) Load profile
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

        // 2) Load user_cards
        const { data: uc, error: ucErr } = await supabase
          .from("user_cards")
          .select("card_key, card_start_date")
          .eq("user_id", user.id);

        if (ucErr) throw ucErr;
        const loaded = (uc ?? []) as DbUserCard[];
        setSavedCards(loaded.map((x) => x.card_key));

        const starts: Record<string, string> = {};
        for (const r of loaded) {
          if (r.card_start_date) starts[r.card_key] = r.card_start_date;
        }
        setCardStartDates(starts);

        // 3) Load credit_states
        const { data: cs, error: csErr } = await supabase
          .from("credit_states")
          .select("state_key, used, dont_care, remind")
          .eq("user_id", user.id);

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

  // -----------------------------
  // SAVE USER DATA (debounced)
  // -----------------------------
  const saveTimeout = useRef<NodeJS.Timeout | null>(null);

  const queueDbSave = useCallback(() => {
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      void saveAllState();
    }, 600);
  }, []);

  async function saveAllState() {
    if (!user) return;

    try {
      // upsert credit_states
      const rows: { user_id: string; state_key: string; used: boolean; dont_care: boolean; remind: boolean }[] = [];
      const allKeys = new Set([...Object.keys(used), ...Object.keys(dontCare), ...Object.keys(remind)]);

      for (const k of allKeys) {
        rows.push({
          user_id: user.id,
          state_key: k,
          used: !!used[k],
          dont_care: !!dontCare[k],
          remind: !!remind[k],
        });
      }

      if (rows.length > 0) {
        const { error } = await supabase.from("credit_states").upsert(rows, { onConflict: "user_id,state_key" });
        if (error) console.error("credit_states upsert error:", error);
      }
    } catch (e) {
      console.error("saveAllState error:", e);
    }
  }

  // Trigger save on toggle changes
  useEffect(() => {
    if (!user) return;
    queueDbSave();
  }, [used, dontCare, remind, user, queueDbSave]);

  // -----------------------------
  // NOTIFY ME
  // -----------------------------
  async function notifyMeForThisCard() {
    if (!user) {
      setAuthModalOpen(true);
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
      const { error } = await supabase.from("user_cards").insert({
        user_id: user.id,
        card_key: activeCard.key,
        card_start_date: null,
      });
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
      const { error } = await supabase
        .from("user_cards")
        .update({ card_start_date: val || null })
        .eq("user_id", user.id)
        .eq("card_key", cardKey);

      if (error) console.error("updateCardStartDate error:", error);
    } catch (e) {
      console.error("updateCardStartDate error:", e);
    }
  }

  // -----------------------------
  // TOGGLE HANDLERS
  // -----------------------------
  function toggleUsed(creditKey: string) {
    setUsed((prev) => ({ ...prev, [creditKey]: !prev[creditKey] }));
  }
  function toggleDontCare(creditKey: string) {
    setDontCare((prev) => ({ ...prev, [creditKey]: !prev[creditKey] }));
  }
  function toggleRemind(creditKey: string) {
    setRemind((prev) => ({ ...prev, [creditKey]: !prev[creditKey] }));
  }

  // -----------------------------
  // AUTH HANDLERS
  // -----------------------------
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
    const { error } = await supabase.auth.signUp({ email: authEmail, password: authPassword });
    setAuthBusy(false);
    if (error) {
      setAuthMsg(error.message);
    } else {
      setAuthMsg("Check your email to confirm your account.");
    }
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

  // -----------------------------
  // PROFILE SAVE
  // -----------------------------
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

  // -----------------------------
  // EXPIRING SOON
  // -----------------------------
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

  // -----------------------------
  // CARD FILTERING
  // -----------------------------
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

  // -----------------------------
  // COMPONENTS
  // -----------------------------
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
          <div className="text-xs text-white/55">
            {card.issuer} • Fee: {formatMoney(card.annualFee)}
          </div>
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

  // -------------------------
  // TOP-RIGHT (auth + settings)
  // -------------------------
  const TopRight = (
    <div className="flex items-center gap-2">
      <button
        onClick={() => { setQuizOpen(true); resetQuiz(); }}
        className="flex items-center gap-1.5 rounded-full border border-purple-400/20 bg-purple-500/10 px-3 py-2 text-sm text-purple-100 hover:bg-purple-500/20 transition"
        type="button"
      >
        <IconSparkles className="h-4 w-4" />
        <span>Find My Card</span>
      </button>
      {user ? (
        <>
          <button
            onClick={() => setSettingsOpen(true)}
            className="rounded-full border border-white/10 bg-white/5 p-2 text-white/70 hover:bg-white/10"
            type="button"
            aria-label="Settings"
          >
            <IconGear className="h-5 w-5" />
          </button>
          <button onClick={handleSignOut} className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10" type="button">
            Sign out
          </button>
        </>
      ) : (
        <button onClick={() => setAuthModalOpen(true)} className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-white/90" type="button">
          Sign in
        </button>
      )}
    </div>
  );

  // -------------------------
  // AUTH MODAL
  // -------------------------
  const AuthModal = !authModalOpen ? null : (
    <div className="fixed inset-0 z-50">
      <button className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setAuthModalOpen(false)} aria-label="Close auth modal" />
      <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2">
        <div className={surfaceCardClass("p-6")}>
          <div className="text-xl font-semibold text-white/95">{authMode === "signin" ? "Sign in" : authMode === "signup" ? "Create account" : "Reset password"}</div>

          {authMode === "reset" ? (
            <div className="mt-4">
              <input
                type="email"
                placeholder="Email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#0F1218] px-3 py-2 text-sm outline-none"
              />
              <button onClick={handleResetPassword} disabled={authBusy} className="mt-3 w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black hover:bg-white/90 disabled:opacity-50" type="button">
                {authBusy ? "Sending..." : "Send reset link"}
              </button>
              {resetMsg && <div className="mt-2 text-sm text-white/70">{resetMsg}</div>}
              <button onClick={() => setAuthMode("signin")} className="mt-3 text-sm text-white/55 hover:text-white/80" type="button">
                Back to sign in
              </button>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              <input
                type="email"
                placeholder="Email"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#0F1218] px-3 py-2 text-sm outline-none"
              />
              <input
                type="password"
                placeholder="Password"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#0F1218] px-3 py-2 text-sm outline-none"
              />
              <button
                onClick={authMode === "signin" ? handleSignIn : handleSignUp}
                disabled={authBusy}
                className="w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black hover:bg-white/90 disabled:opacity-50"
                type="button"
              >
                {authBusy ? "Loading..." : authMode === "signin" ? "Sign in" : "Create account"}
              </button>
              {authMsg && <div className="text-sm text-white/70">{authMsg}</div>}

              <div className="flex items-center justify-between text-sm">
                <button onClick={() => setAuthMode(authMode === "signin" ? "signup" : "signin")} className="text-white/55 hover:text-white/80" type="button">
                  {authMode === "signin" ? "Create account" : "Sign in"}
                </button>
                <button onClick={() => setAuthMode("reset")} className="text-white/55 hover:text-white/80" type="button">
                  Forgot password?
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // -------------------------
  // SETTINGS MODAL
  // -------------------------
  const SettingsModal = !settingsOpen ? null : (
    <div className="fixed inset-0 z-50">
      <button className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSettingsOpen(false)} aria-label="Close settings modal" />
      <div className="absolute left-1/2 top-8 w-[92vw] max-w-lg -translate-x-1/2 max-h-[90vh] overflow-auto">
        <div className={surfaceCardClass("p-5")}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xl font-semibold text-white/95">Settings</div>
              <div className="mt-1 text-sm text-white/55">{displayName}</div>
            </div>
            <button
              onClick={() => setSettingsOpen(false)}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80 hover:bg-white/10"
              type="button"
            >
              Close
            </button>
          </div>

          <div className="mt-5 space-y-4">
            <div>
              <div className="text-sm font-semibold text-white/90">Display name</div>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your name"
                className="mt-1 w-full rounded-xl border border-white/10 bg-[#0F1218] px-3 py-2 text-sm outline-none"
              />
            </div>

            <div>
              <div className="text-sm font-semibold text-white/90">Phone (E.164)</div>
              <input
                value={phoneE164}
                onChange={(e) => setPhoneE164(e.target.value)}
                placeholder="+15551234567"
                className="mt-1 w-full rounded-xl border border-white/10 bg-[#0F1218] px-3 py-2 text-sm outline-none"
              />
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
                I consent to receive SMS messages from ClawBack
              </label>
            </div>

            <div>
              <div className="text-sm font-semibold text-white/90">Reminder offsets (days before reset)</div>
              <input
                value={offsetsDays.join(", ")}
                onChange={(e) => setOffsetsDays(e.target.value.split(",").map((x) => parseInt(x.trim(), 10)).filter((x) => !isNaN(x)))}
                placeholder="7, 1"
                className="mt-1 w-full rounded-xl border border-white/10 bg-[#0F1218] px-3 py-2 text-sm outline-none"
              />
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

  // -------------------------
  // LEFT: Card picker
  // -------------------------
  const LeftPanel = (
    <aside className="lg:col-span-4">
      <div className={surfaceCardClass("p-4")}>
        <div className="flex items-start gap-3 border-b border-white/10 pb-4">
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-black/30">
            <Image src={activeCard.logo} alt={activeCard.name} fill className="object-cover" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-lg font-semibold leading-6 line-clamp-2">{activeCard.name}</div>
            <div className="mt-1 text-sm text-white/55">
              {activeCard.issuer} • {formatMoney(activeCard.annualFee)}/yr
            </div>
          </div>
        </div>

        <div className="mt-4">
          <div className="text-sm font-semibold text-white/90">Your Cards</div>
          <div className="mt-1 text-xs text-white/55">
            {savedCards.length} saved • {isFounder ? "Founder: unlimited" : "Free: 1 card"}
          </div>

          {!user ? (
            <div className="mt-3 rounded-xl border border-white/10 bg-black/25 p-3 text-xs text-white/70">
              Browse everything free. Sign in (top-right) to save 1 card + your reminders.
            </div>
          ) : dbWarning ? (
            <div className="mt-3 rounded-xl border border-amber-300/20 bg-amber-300/10 p-3 text-xs text-amber-100/90">
              {dbWarning}
            </div>
          ) : null}

          <div className="mt-3 space-y-2">
            {savedCards.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-black/25 p-3 text-xs text-white/60">
                No saved cards yet. Pick a card and click "Notify me".
              </div>
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
                      <div className="text-[11px] text-white/50">Cardmember year start (for Expiring Soon)</div>
                      <input
                        type="date"
                        value={start}
                        onChange={(e) => updateCardStartDate(k, e.target.value)}
                        className="mt-1 w-full rounded-lg border border-white/10 bg-black/25 px-2 py-2 text-xs outline-none"
                        disabled={!user}
                      />
                      {!user ? <div className="mt-1 text-[11px] text-white/40">Sign in to save start dates.</div> : null}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Choose your card */}
        <div className="mt-4">
          <div className="text-lg font-semibold text-white/95">Choose your card</div>
          <div className="mt-1 text-xs text-white/55">Browse any card free. "Notify me" saves it to your dashboard.</div>

          <div className="mt-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search cards..."
              className="w-full rounded-xl border border-white/10 bg-[#0F1218] px-3 py-2 text-sm outline-none placeholder:text-white/30"
            />
          </div>

          {/* Fee filter */}
          <div className="mt-3 rounded-2xl border border-white/10 bg-[#0F1218] p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-white/90">Annual fee filter</div>
              <button
                className="text-xs text-white/45 hover:text-white/70"
                onClick={() => {
                  setFeeMin(feeBounds.min);
                  setFeeMax(feeBounds.max);
                }}
                type="button"
              >
                Reset
              </button>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <div>
                <div className="text-[11px] text-white/50">Min</div>
                <input
                  type="number"
                  value={feeMin}
                  min={feeBounds.min}
                  max={feeMax}
                  onChange={(e) => setFeeMin(Number(e.target.value || 0))}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/25 px-2 py-2 text-xs outline-none"
                />
              </div>
              <div>
                <div className="text-[11px] text-white/50">Max</div>
                <input
                  type="number"
                  value={feeMax}
                  min={feeMin}
                  max={feeBounds.max}
                  onChange={(e) => setFeeMax(Number(e.target.value || 0))}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/25 px-2 py-2 text-xs outline-none"
                />
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {[
                { label: "0–250", min: 0, max: 250 },
                { label: "250–500", min: 250, max: 500 },
                { label: "500+", min: 500, max: feeBounds.max },
              ].map((chip) => (
                <button
                  key={chip.label}
                  onClick={() => {
                    setFeeMin(chip.min);
                    setFeeMax(chip.max);
                  }}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80 hover:bg-white/10"
                  type="button"
                >
                  {chip.label}
                </button>
              ))}
            </div>

            <div className="mt-3 text-[11px] text-white/40">Hard filter affects browsing only. Quiz uses soft fee penalty.</div>
          </div>

          {/* Tiered list */}
          <div className="mt-3 overflow-auto rounded-2xl border border-white/10 bg-[#0F1218] lg:max-h-[46vh]">
            {topPicksVisible ? (
              <div className="border-b border-white/10">
                <div className="px-3 py-3 bg-amber-400/10">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-lg font-semibold text-amber-100">Top Picks</div>
                      <div className="text-xs text-white/55">Your 3 highlighted cards</div>
                    </div>
                    {badgePill(`${topPicks.length} cards`, "gold")}
                  </div>
                </div>
                {topPicks.map((c) => (
                  <CardRow key={c.key} card={c} showTopPickBadge />
                ))}
              </div>
            ) : null}

            <Section title="Tier 3" subtitle="$500+ annual fee" cards={tier3} accent="slate" />
            <Section title="Tier 2" subtitle="$250–$500 annual fee" cards={tier2} accent="neutral" />
            <Section title="Tier 1" subtitle="$0–$250 annual fee" cards={tier1} accent="neutral" />

            {baseFiltered.length === 0 ? <div className="p-4 text-sm text-white/60">No cards match your search / fee filter.</div> : null}
          </div>

          <button
            onClick={() => void notifyMeForThisCard()}
            className="mt-4 w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black hover:bg-white/90"
            type="button"
          >
            {savedCards.includes(activeCard.key) ? "Saved ✓" : "Notify me for this card"}
          </button>

          <div className="mt-2 text-xs text-white/40">Free: save 1 card • Multi-card is $5 flat (coming soon)</div>

          {authMsg ? (
            <div className="mt-2 rounded-xl border border-white/10 bg-black/25 p-3 text-xs text-white/70">{authMsg}</div>
          ) : null}
        </div>
      </div>
    </aside>
  );

  // -------------------------
  // MIDDLE: Credits
  // -------------------------
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
          <div className="mt-2 text-xs text-white/50">{totals.pct}% used</div>
          {isPositiveNet && (
            <div className="absolute top-2 right-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 px-2 py-1 text-[10px] font-semibold text-emerald-300">
                🎉 Profitable!
              </span>
            </div>
          )}
        </div>

        <div className={surfaceCardClass("p-4")}>
          <div className="text-xs text-white/55">Total Credits Available</div>
          <div className="mt-2 text-3xl font-semibold text-white/95">{formatMoney(totals.totalAvail)}</div>
          <div className="mt-2 text-xs text-white/50">excludes credits marked "Don't care"</div>
        </div>

        <div className={surfaceCardClass(`p-4 ${isPositiveNet ? 'border-emerald-400/15 bg-emerald-500/6' : 'border-red-400/15 bg-red-500/6'}`)}>
          <div className="text-xs text-white/55">Net Value</div>
          <div className={`mt-2 text-3xl font-semibold ${isPositiveNet ? 'text-emerald-100' : 'text-red-100'}`}>
            {isPositiveNet ? '+' : ''}{formatMoney(netValue)}
          </div>
          <div className="mt-2 text-xs text-white/50">
            redeemed minus {formatMoney(activeCard.annualFee)} fee
          </div>
        </div>
      </div>

      <div className={surfaceCardClass("mt-5 p-4")}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold text-white/95">Credits</div>
            <div className="text-xs text-white/55">Toggle Used, Don't care, and Remind for each credit.</div>
          </div>
        </div>

        <div className="mt-4 space-y-2">
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
                  <button
                    onClick={() => toggleUsed(k)}
                    className={[
                      "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition",
                      isUsedOn ? "border-emerald-400/30 bg-emerald-500/20 text-emerald-200" : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10",
                    ].join(" ")}
                    type="button"
                  >
                    <IconCheck className="h-3.5 w-3.5" />
                    Used
                  </button>

                  <button
                    onClick={() => toggleDontCare(k)}
                    className={[
                      "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition",
                      isDontCareOn ? "border-slate-400/30 bg-slate-500/20 text-slate-200" : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10",
                    ].join(" ")}
                    type="button"
                  >
                    <IconEyeOff className="h-3.5 w-3.5" />
                    Don't care
                  </button>

                  <button
                    onClick={() => toggleRemind(k)}
                    className={[
                      "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition",
                      isRemindOn ? "border-sky-400/30 bg-sky-500/20 text-sky-200" : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10",
                    ].join(" ")}
                    type="button"
                  >
                    <IconBell className="h-3.5 w-3.5" />
                    Remind
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );

  // -------------------------
  // RIGHT: Insights
  // -------------------------
  const RightPanel = (
    <aside className="lg:col-span-3">
      <div className={surfaceCardClass("p-4")}>
        <div className="text-lg font-semibold text-white/95">Summary</div>
        <div className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-white/60">Card</span>
            <span className="text-white/90">{activeCard.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/60">Annual fee</span>
            <span className="text-red-200">{formatMoney(activeCard.annualFee)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/60">Credits available</span>
            <span className="text-white/90">{formatMoney(totals.totalAvail)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/60">Credits redeemed</span>
            <span className="text-emerald-200">{formatMoney(totals.totalRedeemed)}</span>
          </div>
          <div className="border-t border-white/10 pt-2 flex justify-between font-semibold">
            <span className="text-white/80">Net value</span>
            <span className={isPositiveNet ? "text-emerald-300" : "text-red-300"}>
              {isPositiveNet ? "+" : ""}{formatMoney(netValue)}
            </span>
          </div>
        </div>
      </div>

      <div className={surfaceCardClass("mt-5 p-5 border-sky-300/12 bg-sky-500/5")}>
        <div className="text-lg font-semibold text-white/95">Expiring soon</div>
        <div className="mt-1 text-xs text-white/55">Date-based (needs your cardmember year start date).</div>

        {!cardStartDates[activeCard.key] ? (
          <div className="mt-4 rounded-xl border border-amber-300/20 bg-amber-300/10 p-3 text-sm text-amber-100/90">
            Add your <b>cardmember year start date</b> in "Your Cards" to enable Expiring Soon.
          </div>
        ) : null}

        <div className="mt-4 space-y-2">
          {expiringSoon.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-black/25 p-3 text-sm text-white/60">
              {cardStartDates[activeCard.key]
                ? "No credits expiring in the next 14 days (with Remind on)."
                : "No date set yet. Toggle Remind + set start date."}
            </div>
          ) : (
            expiringSoon.map((x) => (
              <div key={x.credit.id} className="rounded-xl border border-white/10 bg-[#0F1218] p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold leading-5 line-clamp-2">{x.credit.title}</div>
                    <div className="mt-1 text-xs text-white/55">{creditSubtitle(x.credit)}</div>
                  </div>
                  <div className="shrink-0 rounded-full border border-sky-300/20 bg-sky-300/10 px-2 py-0.5 text-[11px] text-sky-100">
                    due {formatDateShort(x.due)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-3 text-[11px] text-white/45">
          Rules: Remind ON, not Used, not Don't care, and reset within 14 days.
        </div>
      </div>

      <div className={surfaceCardClass("mt-5 p-5")}>
        <div className="text-lg font-semibold text-white/95">Reminders</div>
        <div className="mt-1 text-xs text-white/55">
          Current schedule: <b>{normalizeOffsets(offsetsDays).join(", ")}</b> days before reset
        </div>
        <div className="mt-3 rounded-xl border border-white/10 bg-black/25 p-3 text-xs text-white/65">
          Email: <b className="text-white/85">{notifEmailEnabled ? "ON" : "OFF"}</b> • SMS:{" "}
          <b className="text-white/85">{notifSmsEnabled ? "ON" : "OFF"}</b>
          <div className="mt-2 text-[11px] text-white/45">
            Configure in <b>Settings</b> (top-right). SMS requires consent + phone.
          </div>
        </div>
      </div>
    </aside>
  );

  // -------------------------
  // QUIZ MODAL (conversational flow)
  // -------------------------
  const categoryLabels: Record<SpendCategory, { name: string; emoji: string; desc: string }> = {
    dining: { name: "Dining", emoji: "🍽️", desc: "Restaurants, takeout, delivery" },
    travel: { name: "Travel", emoji: "✈️", desc: "Flights, hotels, car rentals" },
    groceries: { name: "Groceries", emoji: "🛒", desc: "Supermarkets, food stores" },
    gas: { name: "Gas", emoji: "⛽", desc: "Gas stations, EV charging" },
    online: { name: "Online Shopping", emoji: "🛍️", desc: "Amazon, online retail" },
    other: { name: "Everything Else", emoji: "💳", desc: "Bills, general purchases" },
  };

  const QuizModal = !quizOpen ? null : (
    <div className="fixed inset-0 z-50">
      <button className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setQuizOpen(false)} aria-label="Close quiz modal backdrop" />
      <div className="absolute left-1/2 top-8 w-[92vw] max-w-2xl -translate-x-1/2 max-h-[90vh] overflow-auto">
        <div className={surfaceCardClass("p-6")}>
          
          {/* Step: Intro */}
          {quizStep === 'intro' && (
            <div className="text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/30 to-indigo-500/30 flex items-center justify-center mb-6">
                <IconSparkles className="h-8 w-8 text-purple-300" />
              </div>
              <h2 className="text-2xl font-bold text-white/95">Find Your Perfect Card</h2>
              <p className="mt-3 text-white/60 max-w-md mx-auto">
                Answer a few quick questions and we'll recommend the best credit card for your spending habits.
              </p>
              
              <div className="mt-8 space-y-3">
                <button
                  onClick={() => setQuizStep('categories')}
                  className="w-full rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 px-6 py-4 text-base font-semibold text-white hover:opacity-90 transition"
                  type="button"
                >
                  Yes, help me find a card →
                </button>
                <button
                  onClick={() => setQuizOpen(false)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-6 py-4 text-base text-white/70 hover:bg-white/10 transition"
                  type="button"
                >
                  Not now
                </button>
              </div>
            </div>
          )}

          {/* Step: Categories */}
          {quizStep === 'categories' && (
            <div>
              <button onClick={() => setQuizStep('intro')} className="text-sm text-white/50 hover:text-white/80 mb-4">← Back</button>
              <h2 className="text-xl font-bold text-white/95">Where do you spend the most?</h2>
              <p className="mt-2 text-sm text-white/60">Select your top spending categories and enter monthly amounts.</p>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(Object.keys(categoryLabels) as SpendCategory[]).map((cat) => {
                  const { name, emoji, desc } = categoryLabels[cat];
                  const isSelected = selectedCategories.includes(cat);
                  return (
                    <div
                      key={cat}
                      className={[
                        "rounded-xl border p-4 cursor-pointer transition",
                        isSelected 
                          ? "border-purple-400/30 bg-purple-500/15" 
                          : "border-white/10 bg-white/5 hover:bg-white/10"
                      ].join(" ")}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedCategories(prev => prev.filter(c => c !== cat));
                        } else {
                          setSelectedCategories(prev => [...prev, cat]);
                        }
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{emoji}</span>
                            <span className="font-semibold text-white/90">{name}</span>
                          </div>
                          <div className="mt-1 text-xs text-white/50">{desc}</div>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-purple-400 bg-purple-500' : 'border-white/30'}`}>
                          {isSelected && <IconCheck className="h-3 w-3 text-white" />}
                        </div>
                      </div>
                      
                      {isSelected && (
                        <div className="mt-3" onClick={(e) => e.stopPropagation()}>
                          <div className="text-[11px] text-white/50">Monthly spend ($)</div>
                          <input
                            type="number"
                            value={quiz.spend[cat]}
                            onChange={(e) => setQuiz(p => ({
                              ...p,
                              spend: { ...p.spend, [cat]: Number(e.target.value || 0) }
                            }))}
                            className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none"
                            placeholder="0"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <button
                onClick={() => setQuizStep('fee')}
                disabled={selectedCategories.length === 0}
                className="mt-6 w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed"
                type="button"
              >
                Continue →
              </button>
            </div>
          )}

          {/* Step: Fee tolerance + options */}
          {quizStep === 'fee' && (
            <div>
              <button onClick={() => setQuizStep('categories')} className="text-sm text-white/50 hover:text-white/80 mb-4">← Back</button>
              <h2 className="text-xl font-bold text-white/95">A few more details</h2>
              <p className="mt-2 text-sm text-white/60">Help us fine-tune your recommendation.</p>

              <div className="mt-6 space-y-5">
                <div>
                  <div className="text-sm font-semibold text-white/90">What's your annual fee comfort zone?</div>
                  <div className="mt-3 grid grid-cols-4 gap-2">
                    {[0, 200, 500, 1000].map((fee) => (
                      <button
                        key={fee}
                        onClick={() => setQuiz(p => ({ ...p, annualFeeTolerance: fee }))}
                        className={[
                          "rounded-lg border py-3 text-sm font-medium transition",
                          quiz.annualFeeTolerance === fee
                            ? "border-purple-400/30 bg-purple-500/20 text-purple-200"
                            : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
                        ].join(" ")}
                        type="button"
                      >
                        {fee === 0 ? "$0" : fee === 1000 ? "$1000+" : `$${fee}`}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-semibold text-white/90">How much of the card's credits will you actually use?</div>
                  <div className="mt-3 grid grid-cols-4 gap-2">
                    {[
                      { val: 0.25, label: "25%" },
                      { val: 0.5, label: "50%" },
                      { val: 0.75, label: "75%" },
                      { val: 1, label: "100%" },
                    ].map((opt) => (
                      <button
                        key={opt.val}
                        onClick={() => setQuiz(p => ({ ...p, creditUtilizationPct: opt.val }))}
                        className={[
                          "rounded-lg border py-3 text-sm font-medium transition",
                          quiz.creditUtilizationPct === opt.val
                            ? "border-purple-400/30 bg-purple-500/20 text-purple-200"
                            : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
                        ].join(" ")}
                        type="button"
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-white/5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={quiz.includeWelcomeBonus}
                    onChange={(e) => setQuiz(p => ({ ...p, includeWelcomeBonus: e.target.checked }))}
                    className="w-5 h-5 rounded"
                  />
                  <div>
                    <div className="text-sm font-medium text-white/90">Include welcome bonus in calculation</div>
                    <div className="text-xs text-white/50">First-year value only</div>
                  </div>
                </label>
              </div>

              <button
                onClick={() => setQuizStep('results')}
                className="mt-6 w-full rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 px-4 py-3 text-sm font-semibold text-white hover:opacity-90"
                type="button"
              >
                Show my recommendations →
              </button>
            </div>
          )}

          {/* Step: Results */}
          {quizStep === 'results' && (
            <div>
              <button onClick={() => setQuizStep('fee')} className="text-sm text-white/50 hover:text-white/80 mb-4">← Back</button>
              <h2 className="text-xl font-bold text-white/95">Your Top Card Matches</h2>
              <p className="mt-2 text-sm text-white/60">Based on your spending habits and preferences.</p>

              <div className="mt-6 space-y-4">
                {quizResults.map((r, i) => (
                  <div 
                    key={r.card.key} 
                    className={[
                      "rounded-2xl border p-5 transition",
                      i === 0 
                        ? "border-amber-400/30 bg-gradient-to-br from-amber-500/15 to-orange-500/10" 
                        : "border-white/10 bg-[#0F1218]"
                    ].join(" ")}
                  >
                    <div className="flex items-start gap-4">
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-black/30">
                        <Image src={r.card.logo} alt={r.card.name} fill className="object-cover" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            {i === 0 && (
                              <span className="inline-block mb-1 rounded-full bg-amber-400/20 border border-amber-400/30 px-2 py-0.5 text-[10px] font-semibold text-amber-200">
                                🏆 Best Match
                              </span>
                            )}
                            <div className="text-base font-semibold text-white/95">{r.card.name}</div>
                            <div className="text-xs text-white/55">{r.card.issuer}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-emerald-300">+{formatMoney(r.estAnnualValue)}</div>
                            <div className="text-[11px] text-white/50">est. annual value</div>
                          </div>
                        </div>
                        
                        <div className="mt-3 flex items-center gap-4 text-xs text-white/60">
                          <span>Fee: {formatMoney(r.card.annualFee)}</span>
                          <span>•</span>
                          <span>Credits: {formatMoney(r.card.creditsTrackedAnnualized)}/yr</span>
                        </div>

                        <div className="mt-3 space-y-1">
                          {r.breakdown.slice(0, 3).map((b) => (
                            <div key={b} className="text-xs text-white/50">• {b}</div>
                          ))}
                        </div>

                        <button
                          onClick={() => {
                            setActiveCardKey(r.card.key);
                            setQuizOpen(false);
                          }}
                          className="mt-4 rounded-lg border border-white/15 bg-white/10 px-4 py-2 text-xs font-medium text-white/90 hover:bg-white/15 transition"
                          type="button"
                        >
                          View this card →
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => { resetQuiz(); setQuizStep('intro'); }}
                className="mt-6 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70 hover:bg-white/10"
                type="button"
              >
                Start over
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // -------------------------
  // PAGE
  // -------------------------
  return (
    <div className="relative min-h-screen text-white">
      {/* Premium gradient background */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[#070A12]" />
        <div className="absolute inset-0 bg-[radial-gradient(60%_40%_at_20%_20%,rgba(88,101,242,0.18),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(50%_40%_at_80%_30%,rgba(139,92,246,0.16),transparent_60%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.04),transparent_40%,transparent_60%,rgba(255,255,255,0.03))]" />
        {/* Subtle grid overlay */}
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <a href="/" className="text-2xl font-semibold text-white/95 hover:text-white transition">ClawBack</a>
            <div className="text-sm text-white/55">No bank logins. Just credits, reminders, and savings.</div>
          </div>

          {TopRight}
        </div>

        {/* Mobile tabs */}
        <div className="mb-4 flex gap-2 lg:hidden">
          {[
            { key: "cards", label: "Cards" },
            { key: "credits", label: "Credits" },
            { key: "insights", label: "Insights" },
          ].map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setMobileView(t.key as "cards" | "credits" | "insights")}
              className={[
                "flex-1 rounded-full border px-3 py-2 text-sm font-semibold transition",
                mobileView === t.key ? "border-white/20 bg-white/10 text-white" : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10",
              ].join(" ")}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Desktop grid */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className={["lg:block", mobileView === "cards" ? "block" : "hidden", "lg:col-span-4"].join(" ")}>
            {LeftPanel}
          </div>

          <div className={["lg:block", mobileView === "credits" ? "block" : "hidden", "lg:col-span-5"].join(" ")}>
            {MiddlePanel}
          </div>

          <div className={["lg:block", mobileView === "insights" ? "block" : "hidden", "lg:col-span-3"].join(" ")}>
            {RightPanel}
          </div>
        </div>
      </div>

      {AuthModal}
      {SettingsModal}
      {QuizModal}
    </div>
  );
}
