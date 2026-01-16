// app/app/page.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
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

// -----------------------------
// CONFETTI (no deps)
// -----------------------------
function ConfettiBurst({ seed }: { seed: number }) {
  const [show, setShow] = useState(false);

  const pieces = useMemo(() => {
    if (!seed) return [] as Array<{ id: number; left: number; size: number; rotate: number; delay: number; dur: number; drift: number }>;
    const rand = (min: number, max: number) => Math.random() * (max - min) + min;
    return Array.from({ length: 80 }).map((_, i) => ({
      id: i,
      left: rand(0, 100),
      size: rand(6, 11),
      rotate: rand(0, 360),
      delay: rand(0, 120),
      dur: rand(700, 1200),
      drift: rand(-80, 80),
    }));
  }, [seed]);

  useEffect(() => {
    if (!seed) return;
    setShow(true);
    const t = window.setTimeout(() => setShow(false), 1200);
    return () => window.clearTimeout(t);
  }, [seed]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[70] pointer-events-none overflow-hidden">
      <style jsx global>{`
        @keyframes clawback_confetti {
          0% { transform: translate3d(0, -20px, 0) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          100% { transform: translate3d(var(--drift), 110vh, 0) rotate(720deg); opacity: 0; }
        }
      `}</style>
      {pieces.map((p) => (
        <div
          key={p.id}
          className="absolute top-0 rounded-sm bg-white/80"
          style={{
            left: `${p.left}%`,
            width: `${p.size}px`,
            height: `${Math.max(4, p.size * 0.55)}px`,
            transform: `rotate(${p.rotate}deg)`,
            animation: `clawback_confetti ${p.dur}ms ease-out ${p.delay}ms forwards`,
            // @ts-expect-error CSS var
            '--drift': `${p.drift}px`,
          }}
        />
      ))}
    </div>
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
  return `${freqLabel(c.frequency)} - ${formatMoney(c.amount)} - Annualized: ${formatMoney(a)}`;
}

function surfaceCardClass(extra?: string): string {
  return [
    "rounded-2xl border border-white/10 bg-[#11141B] shadow-[0_0_70px_rgba(0,0,0,0.55)]",
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

  // monthly -> next month same day (clamp)
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
type QuizIntent = "max_points" | "max_cashback" | "luxury_perks" | "low_annual_fee";
type QuizFeeSensitivity = "premium_ok" | "under_250" | "no_fee";

type QuizInputs = {
  intent: QuizIntent;
  spend: Record<SpendCategory, number>; // monthly spend
  feeSensitivity: QuizFeeSensitivity;
  trackingTolerancePct: number; // 0..1 (how willing you are to track credits)
  includeWelcomeBonus: boolean;
};

type QuizResult = {
  card: Card;
  score: number;
  estAnnualValue: number;
  confidence: "High" | "Medium" | "Low";
  why: string[];
  breakdown: string[];
};

function getEarnRate(card: Card, cat: SpendCategory): number {
  const r = card.earnRates[cat];
  if (typeof r === "number") return r;
  return card.earnRates.other ?? 1;
}

function maxFeeAllowed(feeSensitivity: QuizFeeSensitivity): number {
  if (feeSensitivity === "no_fee") return 0;
  if (feeSensitivity === "under_250") return 250;
  return Number.POSITIVE_INFINITY;
}

function scoreCardV2(card: Card, input: QuizInputs): QuizResult {
  const pv = pointValueUsd(card.pointsProgram);

  const annualSpendByCat: Record<SpendCategory, number> = {
    dining: input.spend.dining * 12,
    travel: input.spend.travel * 12,
    groceries: input.spend.groceries * 12,
    gas: input.spend.gas * 12,
    online: input.spend.online * 12,
    other: input.spend.other * 12,
  };

  // Rewards value (deterministic)
  let rewardsValue = 0;
  const catContrib: Record<SpendCategory, number> = {
    dining: 0,
    travel: 0,
    groceries: 0,
    gas: 0,
    online: 0,
    other: 0,
  };

  for (const cat of Object.keys(annualSpendByCat) as SpendCategory[]) {
    const spend = annualSpendByCat[cat];
    const rate = getEarnRate(card, cat);
    const v = spend * rate * pv;
    rewardsValue += v;
    catContrib[cat] = v;
  }

  // Credit value depends on willingness to track
  const creditsValue = card.creditsTrackedAnnualized * input.trackingTolerancePct;

  // Optional welcome bonus
  const bonusValue = input.includeWelcomeBonus ? card.signupBonusEstUsd ?? 0 : 0;

  const fee = card.annualFee;

  // Fee sensitivity (hard-ish)
  const maxFee = maxFeeAllowed(input.feeSensitivity);
  const feeGatePenalty = fee > maxFee ? 10_000 : 0; // effectively filters

  // Intent shaping (all deterministic)
  let intentAdj = 0;
  if (input.intent === "max_cashback") {
    // Prefer cashback cards heavily
    intentAdj += card.pointsProgram === "cashback" ? 250 : -250;
  }
  if (input.intent === "max_points") {
    // Prefer points ecosystems slightly
    intentAdj += card.pointsProgram === "cashback" ? -80 : 80;
  }
  if (input.intent === "luxury_perks") {
    // Prefer high-credit, premium-fee products
    const perkScore = Math.min(700, creditsValue * 0.45) + (fee >= 395 ? 120 : 0);
    intentAdj += perkScore;
  }
  if (input.intent === "low_annual_fee") {
    // Strongly penalize fee
    intentAdj -= fee * 1.2;
    intentAdj += fee <= 95 ? 180 : 0;
    intentAdj += fee === 0 ? 220 : 0;
  }

  // Net value
  const estAnnualValue = rewardsValue + creditsValue + bonusValue - fee;

  // Final score
  const score = estAnnualValue + intentAdj - feeGatePenalty;

  const breakdown = [
    `Rewards: ${formatMoney(rewardsValue)}`,
    `Credits (based on tracking): ${formatMoney(creditsValue)}`,
    `Welcome bonus: ${formatMoney(bonusValue)}`,
    `Annual fee: -${formatMoney(fee)}`,
    `Intent adjustment: ${formatMoney(intentAdj)}`,
  ];
  if (feeGatePenalty) breakdown.push(`Fee preference filter: -${formatMoney(feeGatePenalty)}`);

  // Explainable bullets (deterministic)
  const topCat = (Object.entries(catContrib) as [SpendCategory, number][])    .slice()    .sort((a, b) => b[1] - a[1])[0][0];
  const topRate = getEarnRate(card, topCat);

  const why: string[] = [];
  if (input.intent === "luxury_perks") {
    why.push(`Big credits stack: ~${formatMoney(card.creditsTrackedAnnualized)} / yr tracked (you said ${Math.round(
      input.trackingTolerancePct * 100
    )}% willing to track).`);
  }
  if (input.intent === "max_cashback") {
    why.push(card.pointsProgram === "cashback" ? "Pure cash-back structure (simple ROI)." : "High value, but not a pure cash-back card.");
  }
  if (input.intent === "max_points") {
    why.push(card.pointsProgram === "cashback" ? "Strong earn, but you said you want points." : "Points ecosystem + strong earn profile.");
  }
  why.push(`Your top spend category looks like ${topCat}. This card earns ~${topRate}x there.`);

  const feeLine = input.feeSensitivity === "no_fee" ? "You said no annual fee." : input.feeSensitivity === "under_250" ? "You said keep fees under $250." : "You're fine paying a premium fee if ROI is real.";
  why.push(`${feeLine} This card is ${formatMoney(fee)} / yr.`);

  if ((card.signupBonusEstUsd ?? 0) > 0 && input.includeWelcomeBonus) {
    why.push(`Includes an estimated welcome bonus value (~${formatMoney(card.signupBonusEstUsd ?? 0)}).`);
  }

  // Keep confidence as a strict union type so TS doesn't widen it to `string`.
  const confidence: QuizResult["confidence"] = "Low";
  return { card, score, estAnnualValue, breakdown, why, confidence };
}

function confidenceFromGap(topScore: number, secondScore: number, topValue: number): "High" | "Medium" | "Low" {
  const gap = topScore - secondScore;
  if (topValue > 200 && gap > 200) return "High";
  if (topValue > 50 && gap > 90) return "Medium";
  return "Low";
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

  const chooseCardRef = useRef<HTMLDivElement | null>(null);

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

  //  Platinum default
  const [activeCardKey, setActiveCardKey] = useState<Card["key"]>("amex-platinum");

  const [savedCards, setSavedCards] = useState<string[]>([]);
  const [cardStartDates, setCardStartDates] = useState<Record<string, string>>({});
  const [used, setUsed] = useState<ToggleState>({});
  const [dontCare, setDontCare] = useState<ToggleState>({});
  const [remind, setRemind] = useState<ToggleState>({});

  const [dbWarning, setDbWarning] = useState<string | null>(null);

  // Fee filter
  const feeBounds = useMemo(() => {
    const fees = CARDS.map((c) => c.annualFee);
    return { min: Math.min(...fees), max: Math.max(...fees) };
  }, []);

  const [feeMin, setFeeMin] = useState<number>(feeBounds.min);
  const [feeMax, setFeeMax] = useState<number>(feeBounds.max);

  const activeCard = useMemo(() => CARDS.find((c) => c.key === activeCardKey) ?? CARDS[0], [activeCardKey]);

  //  Credits sorted by frequency bucket THEN alphabetized by title
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

  // Quiz (v2: gated + deterministic)
  const [quizOpen, setQuizOpen] = useState(false);
  const [quizStage, setQuizStage] = useState<0 | 1 | 2>(0);
  const [lookingForNew, setLookingForNew] = useState<boolean | null>(null);
  const [quiz, setQuiz] = useState<QuizInputs>({
    intent: "max_points",
    spend: { dining: 600, travel: 400, groceries: 400, gas: 120, online: 200, other: 800 },
    feeSensitivity: "premium_ok",
    trackingTolerancePct: 0.5,
    includeWelcomeBonus: true,
  });

  const quizResults: QuizResult[] = useMemo(() => {
    if (!lookingForNew) return [];
    const scored: QuizResult[] = CARDS.map((c) => scoreCardV2(c, quiz)).sort((a, b) => b.score - a.score);

    // Confidence computed from gap between #1 and #2
    const top = scored[0];
    const second = scored[1];
    const gap = top && second ? top.score - second.score : 0;
    const confidence: QuizResult["confidence"] = gap >= 250 ? "High" : gap >= 110 ? "Medium" : "Low";

    return scored.slice(0, 3).map((r, idx) => ({ ...r, confidence: idx === 0 ? confidence : r.confidence }));
  }, [quiz, lookingForNew]);

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

        const p = (prof ?? null) as DbProfile | null;
        if (p) {
          setFullName((p.full_name ?? "").toString());
          setPhoneE164((p.phone_e164 ?? "").toString());
          setNotifEmailEnabled(!!p.notif_email_enabled);
          setNotifSmsEnabled(!!p.notif_sms_enabled);
          setSmsConsent(!!p.sms_consent);
          setOffsetsDays(normalizeOffsets((p.default_offsets_days ?? [7, 1]) as number[]));
        } else {
          // defensive: if trigger didn't insert, create now
          await supabase.from("profiles").insert({ user_id: user.id });
        }
        setProfileLoading(false);

        // 2) Load saved cards
        const { data: cards, error: cardsErr } = await supabase
          .from("user_cards")
          .select("card_key, card_start_date")
          .order("created_at", { ascending: true });

        if (cardsErr) throw cardsErr;

        const typedCards = (cards ?? []) as DbUserCard[];
        setSavedCards(typedCards.map((c) => c.card_key));

        const startMap: Record<string, string> = {};
        for (const c of typedCards) {
          if (c.card_start_date) startMap[c.card_key] = c.card_start_date;
        }
        setCardStartDates(startMap);

        // 3) Load credit states
        const { data: states, error: statesErr } = await supabase
          .from("credit_states")
          .select("state_key, used, dont_care, remind");

        if (statesErr) throw statesErr;

        const typedStates = (states ?? []) as DbCreditState[];

        const usedMap: ToggleState = {};
        const dcMap: ToggleState = {};
        const remindMap: ToggleState = {};

        for (const s of typedStates) {
          usedMap[s.state_key] = !!s.used;
          dcMap[s.state_key] = !!s.dont_care;
          remindMap[s.state_key] = !!s.remind;
        }

        setUsed(usedMap);
        setDontCare(dcMap);
        setRemind(remindMap);
      } catch {
        setProfileLoading(false);
        setDbWarning("Supabase tables/policies might not be set up yet. App will still run (no persistence).");
      }
    })();
  }, [user]);

  // -----------------------------
  //  EXPIRING SOON (date-based v2)
  // -----------------------------
  const expiringSoon = useMemo(() => {
    const out: Array<{ credit: Credit; due: Date }> = [];

    const startStr = cardStartDates[activeCard.key];
    if (!startStr) return out;

    const start = new Date(startStr + "T00:00:00");
    const now = new Date();
    const horizonDays = 14;
    const horizon = new Date(now);
    horizon.setDate(horizon.getDate() + horizonDays);

    for (const c of creditsSorted) {
      const k = `${activeCard.key}:${c.id}`;
      if (!remind[k]) continue;
      if (used[k]) continue;
      if (dontCare[k]) continue;

      const due = nextResetDateForCredit({ credit: c, cardStartDate: start, now });
      if (!due) continue;
      if (due <= horizon) out.push({ credit: c, due });
    }

    out.sort((a, b) => a.due.getTime() - b.due.getTime());
    return out.slice(0, 8);
  }, [creditsSorted, activeCard.key, remind, used, dontCare, cardStartDates]);


  // -----------------------------
  // Premium: hero preview + win moments
  // -----------------------------

  const feeRecovered = useMemo(() => {
    if (!activeCard.annualFee) return false;
    return totals.totalRedeemed >= activeCard.annualFee;
  }, [totals.totalRedeemed, activeCard.annualFee]);

  const thisMonthRecovered = useMemo(() => {
    // Deterministic & safe approximation: only monthly credits counted as "this month"
    let v = 0;
    for (const c of creditsSorted) {
      if (c.frequency !== "monthly") continue;
      const k = `${activeCard.key}:${c.id}`;
      if (dontCare[k]) continue;
      if (!used[k]) continue;
      v += c.amount;
    }
    return v;
  }, [creditsSorted, activeCard.key, dontCare, used]);

  const streakCount = useMemo(() => {
    // "Streak" (optional): number of credits checked off (any frequency)
    let n = 0;
    for (const c of creditsSorted) {
      const k = `${activeCard.key}:${c.id}`;
      if (dontCare[k]) continue;
      if (used[k]) n += 1;
    }
    return n;
  }, [creditsSorted, activeCard.key, dontCare, used]);

  const bestDining = useMemo(() => {
    const list = CARDS.slice().sort((a, b) => getEarnRate(b, "dining") - getEarnRate(a, "dining"));
    const top = list[0] ?? CARDS[0];
    return { card: top, rate: getEarnRate(top, "dining") };
  }, []);

  const nextExpiryPreview = useMemo(() => {
    const first = expiringSoon[0];
    if (!first) return { label: "-", days: null as number | null };
    const now = new Date();
    const ms = first.due.getTime() - now.getTime();
    const days = Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
    return { label: `${days} day${days === 1 ? "" : "s"}`, days };
  }, [expiringSoon]);

  const [toast, setToast] = useState<string | null>(null);
  const [confettiSeed, setConfettiSeed] = useState<number>(0);
  const prevFeeRecovered = useRef<boolean>(false);

  function startTrackingScroll() {
    const el = chooseCardRef.current;
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function launchConfettiOncePerCard(cardKey: string) {
    try {
      const k = `feeRecoveredShown:${cardKey}`;
      if (localStorage.getItem(k)) return;
      localStorage.setItem(k, "1");
    } catch {
      // ignore
    }

    setConfettiSeed((x) => x + 1);
    setToast("You've fully clawed back your annual fee ");
    window.setTimeout(() => setToast(null), 3500);
  }

  useEffect(() => {
    const crossed = feeRecovered && !prevFeeRecovered.current;
    prevFeeRecovered.current = feeRecovered;
    if (!crossed) return;
    launchConfettiOncePerCard(activeCard.key);
  }, [feeRecovered, activeCard.key]);

  // -----------------------------
  // PERSIST HELPERS
  // -----------------------------
  async function upsertCreditState(stateKey: string, patch: Partial<DbCreditState>) {
    if (!user) return;
    await supabase.from("credit_states").upsert(
      {
        user_id: user.id,
        state_key: stateKey,
        used: !!patch.used,
        dont_care: !!patch.dont_care,
        remind: !!patch.remind,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,state_key" }
    );
  }

  function toggleUsed(cardKey: string, creditId: string) {
    const k = `${cardKey}:${creditId}`;
    setUsed((prev) => {
      const next = { ...prev, [k]: !prev[k] };
      void upsertCreditState(k, { used: next[k], dont_care: !!dontCare[k], remind: !!remind[k] });
      return next;
    });
  }

  function toggleDontCare(cardKey: string, creditId: string) {
    const k = `${cardKey}:${creditId}`;
    setDontCare((prev) => {
      const next = { ...prev, [k]: !prev[k] };
      void upsertCreditState(k, { used: !!used[k], dont_care: next[k], remind: !!remind[k] });
      return next;
    });
  }

  function toggleRemind(cardKey: string, creditId: string) {
    const k = `${cardKey}:${creditId}`;
    setRemind((prev) => {
      const next = { ...prev, [k]: !prev[k] };
      void upsertCreditState(k, { used: !!used[k], dont_care: !!dontCare[k], remind: next[k] });
      return next;
    });
  }

  async function notifyMeForThisCard() {
    if (!user) {
      setAuthMsg("Sign in to save a card.");
      setAuthModalOpen(true);
      setAuthMode("signin");
      return;
    }

    if (!isFounder && savedCards.length >= 1 && !savedCards.includes(activeCard.key)) {
      setAuthMsg("Free tier saves 1 card. Multi-card is $5 flat (coming soon).");
      return;
    }

    setSavedCards((prev) => (prev.includes(activeCard.key) ? prev : [...prev, activeCard.key]));

    try {
      await supabase.from("user_cards").upsert(
        { user_id: user.id, card_key: activeCard.key },
        { onConflict: "user_id,card_key" }
      );
    } catch {
      // ignore
    }
  }

  async function updateCardStartDate(cardKey: string, iso: string) {
    setCardStartDates((p) => ({ ...p, [cardKey]: iso }));
    if (!user) return;

    try {
      await supabase.from("user_cards").upsert(
        { user_id: user.id, card_key: cardKey, card_start_date: iso },
        { onConflict: "user_id,card_key" }
      );
    } catch {
      // ignore
    }
  }

  async function saveProfile(patch: Partial<DbProfile>) {
    if (!user) return;
    setProfileMsg(null);
    try {
      const payload: any = { user_id: user.id };

      if (typeof patch.full_name !== "undefined") payload.full_name = patch.full_name;
      if (typeof patch.phone_e164 !== "undefined") payload.phone_e164 = patch.phone_e164;
      if (typeof patch.notif_email_enabled !== "undefined") payload.notif_email_enabled = !!patch.notif_email_enabled;
      if (typeof patch.notif_sms_enabled !== "undefined") payload.notif_sms_enabled = !!patch.notif_sms_enabled;
      if (typeof patch.sms_consent !== "undefined") payload.sms_consent = !!patch.sms_consent;
      if (typeof patch.default_offsets_days !== "undefined") payload.default_offsets_days = normalizeOffsets(patch.default_offsets_days as number[]);

      const { error } = await supabase.from("profiles").upsert(payload, { onConflict: "user_id" });
      if (error) throw error;

      setProfileMsg("Saved.");
      setTimeout(() => setProfileMsg(null), 1200);
    } catch {
      setProfileMsg("Could not save settings. Check RLS / table exists.");
    }
  }

  // -----------------------------
  // BROWSE LIST (Alphabetical)
  // -----------------------------
  const baseFiltered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const inFeeRange = CARDS.filter((c) => c.annualFee >= feeMin && c.annualFee <= feeMax);
    const list = q ? inFeeRange.filter((c) => (c.name + " " + c.issuer).toLowerCase().includes(q)) : inFeeRange.slice();
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [search, feeMin, feeMax]);

  const topPicksVisible = useMemo(() => {
    const q = search.trim();
    const isDefaultFeeRange = feeMin === feeBounds.min && feeMax === feeBounds.max;
    return q.length === 0 && isDefaultFeeRange;
  }, [search, feeMin, feeMax, feeBounds.min, feeBounds.max]);

  const topPicks = useMemo(() => {
    return pinnedOrder.map((k) => CARDS.find((c) => c.key === k)).filter(Boolean) as Card[];
  }, [pinnedOrder]);

  const tier3 = useMemo(() => baseFiltered.filter((c) => inTier(c, 500, 999999)), [baseFiltered]);
  const tier2 = useMemo(() => baseFiltered.filter((c) => inTier(c, 250, 499.99)), [baseFiltered]);
  const tier1 = useMemo(() => baseFiltered.filter((c) => inTier(c, 0, 249.99)), [baseFiltered]);

  // -------------------------
  // AUTH ACTIONS
  // -------------------------
  async function signIn() {
    setAuthBusy(true);
    setAuthMsg(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: authEmail.trim(),
        password: authPassword,
      });
      if (error) setAuthMsg(error.message);
      else {
        setAuthMsg(null);
        setAuthModalOpen(false);
      }
    } finally {
      setAuthBusy(false);
    }
  }

  async function signUp() {
    setAuthBusy(true);
    setAuthMsg(null);
    try {
      const { error } = await supabase.auth.signUp({
        email: authEmail.trim(),
        password: authPassword,
      });
      if (error) setAuthMsg(error.message);
      else setAuthMsg("Check your email to confirm your account (if required).");
    } finally {
      setAuthBusy(false);
    }
  }

  async function sendPasswordReset() {
    setAuthBusy(true);
    setResetMsg(null);
    try {
      const email = (resetEmail || authEmail).trim();
      if (!email) {
        setResetMsg("Enter your email first.");
        return;
      }

      const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/app/auth/reset` : undefined;

      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

      if (error) setResetMsg(error.message);
      else setResetMsg("Password reset email sent. Check your inbox.");
    } finally {
      setAuthBusy(false);
    }
  }

  async function signOut() {
    setAuthMsg(null);

    // optimistic UI update (no refresh needed)
    setSession(null);
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

    await supabase.auth.signOut({ scope: "local" });
  }

  // -----------------------------
  // UI helpers
  // -----------------------------
  function badgePill(text: string, tone: "gold" | "slate" | "neutral") {
    const cls =
      tone === "gold"
        ? "border-amber-300/25 bg-amber-300/10 text-amber-100"
        : tone === "slate"
        ? "border-sky-300/20 bg-sky-300/10 text-sky-100"
        : "border-white/10 bg-white/5 text-white/70";
    return (
      <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${cls}`}>
        {text}
      </span>
    );
  }

  function IconToggleButton(props: {
    on: boolean;
    onClick: () => void;
    title: string;
    icon: React.ReactNode;
    tone: "neutral" | "good" | "warn";
  }) {
    const base = "inline-flex items-center justify-center rounded-full border px-2.5 py-2 text-xs transition select-none";
    const cls =
      props.tone === "good"
        ? props.on
          ? "border-emerald-300/30 bg-emerald-300/15 text-emerald-100"
          : "border-white/10 bg-white/5 text-white/65 hover:bg-white/10"
        : props.tone === "warn"
        ? props.on
          ? "border-amber-300/30 bg-amber-300/15 text-amber-100"
          : "border-white/10 bg-white/5 text-white/65 hover:bg-white/10"
        : props.on
        ? "border-sky-300/30 bg-sky-300/15 text-sky-100"
        : "border-white/10 bg-white/5 text-white/65 hover:bg-white/10";

    return (
      <button type="button" onClick={props.onClick} title={props.title} className={`${base} ${cls}`}>
        {props.icon}
      </button>
    );
  }

  function Chip(props: { on: boolean; label: string; onClick: () => void }) {
    return (
      <button
        type="button"
        onClick={props.onClick}
        className={[
          "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
          props.on ? "border-amber-300/30 bg-amber-300/15 text-amber-100" : "border-white/10 bg-white/5 text-white/75 hover:bg-white/10",
        ].join(" ")}
      >
        {props.label}
      </button>
    );
  }

  function CardRow({ card, showTopPickBadge }: { card: Card; showTopPickBadge?: boolean }) {
    const active = card.key === activeCard.key;

    return (
      <button
        onClick={() => {
          setActiveCardKey(card.key);
          setMobileView("credits");
        }}
        className={[
          "flex w-full items-start gap-3 px-3 py-3 text-left transition",
          active ? "bg-white/8" : "hover:bg-white/5",
        ].join(" ")}
        type="button"
      >
        <div
          className={[
            "relative mt-0.5 h-10 w-10 shrink-0 overflow-hidden rounded-lg border bg-black/30",
            active
              ? "border-amber-300/30 shadow-[0_0_0_2px_rgba(245,158,11,0.12),0_0_40px_rgba(245,158,11,0.10)]"
              : "border-white/10",
          ].join(" ")}
        >
          <Image src={card.logo} alt={card.name} fill className="object-cover" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-sm font-semibold leading-5 line-clamp-2 text-white/95">{card.name}</div>

            {typeof card.signupBonusEstUsd === "number" && card.signupBonusEstUsd > 0 ? (
              <span className="shrink-0 rounded-full border border-emerald-300/25 bg-emerald-300/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-100">
                Bonus est: {formatMoney(card.signupBonusEstUsd)}
              </span>
            ) : null}

            {showTopPickBadge ? (
              <span className="shrink-0 rounded-full border border-amber-400/35 bg-amber-400/12 px-2 py-0.5 text-[10px] font-semibold text-amber-100">
                Top pick
              </span>
            ) : null}
          </div>

          <div className="mt-0.5 text-xs text-white/55">
            Fee: {formatMoney(card.annualFee)} - Credits: {formatMoney(card.creditsTrackedAnnualized)}
          </div>
        </div>

        <div className="pt-1 text-[10px] text-white/35">{active ? "Viewing" : ""}</div>
      </button>
    );
  }

  function Section({
    title,
    subtitle,
    cards,
    accent,
  }: {
    title: string;
    subtitle: string;
    cards: Card[];
    accent: "gold" | "slate" | "neutral";
  }) {
    if (cards.length === 0) return null;

    const headerBg =
      accent === "gold"
        ? "bg-amber-400/10 border-amber-400/20"
        : accent === "slate"
        ? "bg-sky-400/10 border-sky-400/20"
        : "bg-white/5 border-white/10";

    const titleColor = accent === "gold" ? "text-amber-100" : accent === "slate" ? "text-sky-100" : "text-white/90";

    return (
      <div className="border-t border-white/10">
        <div className={["px-3 py-3 border-b flex items-center justify-between gap-3", headerBg].join(" ")}>
          <div>
            <div className={["text-lg font-semibold leading-6", titleColor].join(" ")}>{title}</div>
            <div className="text-xs text-white/55">{subtitle}</div>
          </div>
          <div className="flex items-center gap-2">{badgePill(`${cards.length} cards`, accent === "neutral" ? "neutral" : accent)}</div>
        </div>
        {cards.map((c) => (
          <CardRow key={c.key} card={c} />
        ))}
      </div>
    );
  }

  // -------------------------
  // TOP-RIGHT AUTH + QUIZ + SETTINGS
  // -------------------------
  const TopRight = (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      {user ? (
        <>
          <div className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-4 py-2 text-emerald-100">
            {isFounder ? "Founder" : "Signed in"}
          </div>
          <div className="hidden sm:block rounded-full border border-white/10 bg-white/5 px-4 py-2 text-white/70 max-w-[320px] truncate">
            {displayName || user.email}
          </div>

          <button
            onClick={() => {
              setSettingsOpen(true);
              setProfileMsg(null);
            }}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-white/80 hover:bg-white/10 inline-flex items-center gap-2"
            type="button"
            title="Settings"
          >
            <IconGear className="h-4 w-4" />
            <span className="hidden sm:inline">Settings</span>
          </button>

          <button
            onClick={signOut}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-white/80 hover:bg-white/10"
            type="button"
          >
            Sign out
          </button>
        </>
      ) : (
        <>
          <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-white/70">Preview mode</div>
          <button
            onClick={() => {
              setAuthModalOpen(true);
              setAuthMode("signin");
              setAuthMsg(null);
              setResetMsg(null);
            }}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-white/80 hover:bg-white/10"
            type="button"
          >
            Sign in
          </button>
          <button
            onClick={() => {
              setAuthModalOpen(true);
              setAuthMode("signup");
              setAuthMsg(null);
              setResetMsg(null);
            }}
            className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-4 py-2 text-emerald-100 hover:bg-emerald-300/15"
            type="button"
          >
            Sign up
          </button>
        </>
      )}

      <button
        onClick={() => setQuizOpen(true)}
        className="rounded-full border border-amber-300/25 bg-amber-300/10 px-4 py-2 text-amber-100 hover:bg-amber-300/15"
        type="button"
      >
        Quiz
      </button>
    </div>
  );

  const SettingsModal = !settingsOpen ? null : (
    <div className="fixed inset-0 z-50">
      <button
        className="absolute inset-0 bg-black/60"
        onClick={() => setSettingsOpen(false)}
        aria-label="Close settings modal backdrop"
      />
      <div className="absolute left-1/2 top-10 w-[92vw] max-w-xl -translate-x-1/2">
        <div className={surfaceCardClass("p-5")}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xl font-semibold text-white/95">Settings</div>
              <div className="mt-1 text-sm text-white/55">
                Email reminders can be on by default. SMS is off by default and requires consent.
              </div>
            </div>
            <button
              onClick={() => setSettingsOpen(false)}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80 hover:bg-white/10"
              type="button"
            >
              Close
            </button>
          </div>

          {!user ? (
            <div className="mt-4 rounded-xl border border-white/10 bg-black/25 p-3 text-sm text-white/70">
              Sign in to edit settings.
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              <div>
                <div className="text-xs text-white/50">Full name</div>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g., Naman"
                  className="mt-1 w-full rounded-xl border border-white/10 bg-[#0F1218] px-3 py-2 text-sm outline-none placeholder:text-white/30"
                />
              </div>

              <div>
                <div className="text-xs text-white/50">Phone (optional, E.164)</div>
                <input
                  value={phoneE164}
                  onChange={(e) => setPhoneE164(e.target.value)}
                  placeholder="+14155551234"
                  className="mt-1 w-full rounded-xl border border-white/10 bg-[#0F1218] px-3 py-2 text-sm outline-none placeholder:text-white/30"
                />
                <div className="mt-1 text-[11px] text-white/40">
                  SMS reminders are OFF by default. We'll add phone verification later.
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#0F1218] p-4">
                <div className="text-sm font-semibold text-white/90">Reminder channels</div>

                <div className="mt-3 space-y-3">
                  <label className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-white/75">Email reminders</span>
                    <input
                      type="checkbox"
                      checked={notifEmailEnabled}
                      onChange={(e) => setNotifEmailEnabled(e.target.checked)}
                    />
                  </label>

                  <label className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-white/75">SMS reminders</span>
                    <input
                      type="checkbox"
                      checked={notifSmsEnabled}
                      onChange={(e) => setNotifSmsEnabled(e.target.checked)}
                    />
                  </label>

                  {notifSmsEnabled ? (
                    <label className="flex items-start gap-2 text-xs text-white/70">
                      <input
                        type="checkbox"
                        checked={smsConsent}
                        onChange={(e) => setSmsConsent(e.target.checked)}
                      />
                      <span>
                        I consent to receive SMS reminders from ClawBack. Msg & data rates may apply. Reply STOP to unsubscribe.
                      </span>
                    </label>
                  ) : null}

                  {notifSmsEnabled && !smsConsent ? (
                    <div className="rounded-xl border border-amber-300/20 bg-amber-300/10 p-3 text-xs text-amber-100/90">
                      SMS requires consent checkbox to be enabled.
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#0F1218] p-4">
                <div className="text-sm font-semibold text-white/90">Reminder schedule</div>
                <div className="mt-1 text-xs text-white/55">Choose how many days before reset you want to be notified.</div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {[1, 3, 5, 7, 10, 14].map((d) => (
                    <Chip
                      key={d}
                      label={`${d} day${d === 1 ? "" : "s"}`}
                      on={offsetsDays.includes(d)}
                      onClick={() => {
                        setOffsetsDays((prev) => {
                          const has = prev.includes(d);
                          const next = has ? prev.filter((x) => x !== d) : [...prev, d];
                          return normalizeOffsets(next);
                        });
                      }}
                    />
                  ))}
                </div>

                <div className="mt-2 text-[11px] text-white/45">
                  Default is <b>7</b> and <b>1</b> days. (These are global offsets, not per-credit.)
                </div>
              </div>

              <button
                onClick={async () => {
                  const effectiveSmsEnabled = notifSmsEnabled && smsConsent && phoneE164.trim().length > 0;
                  await saveProfile({
                    full_name: fullName.trim() || null,
                    phone_e164: phoneE164.trim() || null,
                    notif_email_enabled: notifEmailEnabled,
                    notif_sms_enabled: effectiveSmsEnabled,
                    sms_consent: smsConsent,
                    default_offsets_days: offsetsDays,
                  } as any);

                  // Reflect any normalization (ex: turning sms off if no consent/phone)
                  setNotifSmsEnabled(effectiveSmsEnabled);
                }}
                className="w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black hover:bg-white/90 disabled:opacity-60"
                type="button"
                disabled={profileLoading || (notifSmsEnabled && !smsConsent)}
              >
                Save settings
              </button>

              {profileMsg ? (
                <div className="rounded-xl border border-white/10 bg-black/25 p-3 text-xs text-white/70">{profileMsg}</div>
              ) : null}

              <div className="text-[11px] text-white/40">
                Tip: You can keep SMS off and still get email reminders.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const AuthModal = !authModalOpen ? null : (
    <div className="fixed inset-0 z-50">
      <button
        className="absolute inset-0 bg-black/60"
        onClick={() => setAuthModalOpen(false)}
        aria-label="Close auth modal backdrop"
      />
      <div className="absolute left-1/2 top-10 w-[92vw] max-w-xl -translate-x-1/2">
        <div className={surfaceCardClass("p-5")}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xl font-semibold text-white/95">
                {authMode === "signin" ? "Sign in" : authMode === "signup" ? "Create account" : "Reset password"}
              </div>
              <div className="mt-1 text-sm text-white/55">
                {authMode === "reset" ? "We'll email you a reset link." : "Email/password. No anonymous accounts."}
              </div>
            </div>
            <button
              onClick={() => setAuthModalOpen(false)}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80 hover:bg-white/10"
              type="button"
            >
              Close
            </button>
          </div>

          {authMode !== "reset" ? (
            <div className="mt-4 space-y-2">
              <input
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                placeholder="Email"
                className="w-full rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm outline-none placeholder:text-white/30"
              />
              <input
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                placeholder="Password"
                type="password"
                className="w-full rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm outline-none placeholder:text-white/30"
              />

              <div className="flex gap-2 pt-1">
                {authMode === "signin" ? (
                  <>
                    <button
                      onClick={signIn}
                      disabled={authBusy}
                      className="flex-1 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-black hover:bg-white/90 disabled:opacity-60"
                      type="button"
                    >
                      Sign in
                    </button>
                    <button
                      onClick={() => setAuthMode("signup")}
                      disabled={authBusy}
                      className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white/80 hover:bg-white/10 disabled:opacity-60"
                      type="button"
                    >
                      Sign up
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={signUp}
                      disabled={authBusy}
                      className="flex-1 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-black hover:bg-white/90 disabled:opacity-60"
                      type="button"
                    >
                      Create account
                    </button>
                    <button
                      onClick={() => setAuthMode("signin")}
                      disabled={authBusy}
                      className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white/80 hover:bg-white/10 disabled:opacity-60"
                      type="button"
                    >
                      Back to sign in
                    </button>
                  </>
                )}
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => {
                    setAuthMode("reset");
                    setResetEmail(authEmail);
                    setResetMsg(null);
                  }}
                  className="text-xs text-white/55 hover:text-white/80"
                  type="button"
                >
                  Forgot password?
                </button>
                <div className="text-xs text-white/40">Tip: confirm email can be OFF during testing.</div>
              </div>

              {authMsg ? (
                <div className="mt-2 rounded-xl border border-white/10 bg-black/25 p-3 text-xs text-white/70">{authMsg}</div>
              ) : null}
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              <input
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="Email"
                className="w-full rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm outline-none placeholder:text-white/30"
              />
              <button
                onClick={sendPasswordReset}
                disabled={authBusy}
                className="w-full rounded-xl bg-white px-3 py-2 text-sm font-semibold text-black hover:bg-white/90 disabled:opacity-60"
                type="button"
              >
                Send reset email
              </button>

              <div className="flex items-center justify-between pt-2">
                <button onClick={() => setAuthMode("signin")} className="text-xs text-white/55 hover:text-white/80" type="button">
                  Back to sign in
                </button>
                <div className="text-xs text-white/40">Reset link opens /app/auth/reset</div>
              </div>

              {resetMsg ? (
                <div className="mt-2 rounded-xl border border-white/10 bg-black/25 p-3 text-xs text-white/70">{resetMsg}</div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // -------------------------
  // LEFT PANEL
  // -------------------------
  const LeftPanel = (
    <aside className="lg:col-span-4">
      <div className={surfaceCardClass("p-4 lg:sticky lg:top-5")}>
        {/* Your Cards (top) */}
        <div className="rounded-2xl border border-white/10 bg-[#0F1218] p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-lg font-semibold text-white/95">Your Cards</div>
              <div className="mt-1 text-xs text-white/55">Saved cards appear here.</div>
            </div>
            {user ? (
              <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs text-emerald-100">
                Synced
              </span>
            ) : (
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
                Preview
              </span>
            )}
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
        <div className="mt-4" ref={chooseCardRef}>
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
                { label: "0-250", min: 0, max: 250 },
                { label: "250-500", min: 250, max: 500 },
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
            <Section title="Tier 2" subtitle="$250-$500 annual fee" cards={tier2} accent="neutral" />
            <Section title="Tier 1" subtitle="$0-$250 annual fee" cards={tier1} accent="neutral" />

            {baseFiltered.length === 0 ? <div className="p-4 text-sm text-white/60">No cards match your search / fee filter.</div> : null}
          </div>

          <button
            onClick={() => void notifyMeForThisCard()}
            className="mt-4 w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black hover:bg-white/90"
            type="button"
          >
            {savedCards.includes(activeCard.key) ? "Saved (saved)" : "Notify me for this card"}
          </button>

          <div className="mt-2 text-xs text-white/40">Free: save 1 card - Multi-card is $5 flat (coming soon)</div>

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
  const MiddlePanel = (
    <main className="lg:col-span-5">

      

          {/* Mini dashboard preview */}
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0B0E14] p-5 shadow-[0_0_70px_rgba(0,0,0,0.55)]">
            <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-emerald-300/10 blur-3xl" />
            <div className="absolute -left-12 -bottom-12 h-48 w-48 rounded-full bg-red-400/10 blur-3xl" />

            <div className="relative">
              <div className="flex items-center justify-between">
                <div className="text-xs text-white/55">Mini preview</div>
                <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white/70">
                  {activeCard.name}
                </div>
              </div>

              <div className="mt-5 grid gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-[11px] text-white/55">Recovered this year</div>
                  <div className="mt-2 text-2xl font-semibold text-emerald-100">{formatMoney(totals.totalRedeemed)}</div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-[11px] text-white/55">Next credit expiring in</div>
                  <div className="mt-2 text-2xl font-semibold text-white/95">{nextExpiryPreview.label}</div>
                  <div className="mt-1 text-xs text-white/45">based on your saved start date + Remind toggles</div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-[11px] text-white/55">Best card for dining</div>
                  <div className="mt-2 text-sm font-semibold text-white/95 line-clamp-2">
                    {bestDining.card.issuer} {bestDining.card.name}
                  </div>
                  <div className="mt-1 text-xs text-white/50">~{bestDining.rate}x dining</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPIs (secondary) */}
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className={surfaceCardClass("p-4")}>
          <div className="text-xs text-white/55">Credits Redeemed</div>
          <div className="mt-2 text-3xl font-semibold text-emerald-100">{formatMoney(totals.totalRedeemed)}</div>
          <div className="mt-4 h-2 w-full rounded-full bg-black/30">
            <div className="h-2 rounded-full bg-emerald-400/80" style={{ width: `${totals.pct}%` }} />
          </div>
          <div className="mt-2 text-xs text-white/50">{totals.pct}% used</div>
        </div>

        <div className={surfaceCardClass("p-4")}>
          <div className="text-xs text-white/55">Total Credits Available</div>
          <div className="mt-2 text-3xl font-semibold text-white/95">{formatMoney(totals.totalAvail)}</div>
          <div className="mt-2 text-xs text-white/50">excludes credits marked "Don't care"</div>
        </div>

        <div className={surfaceCardClass("p-4 border-red-400/15 bg-red-500/6")}>
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs text-white/55">Annual Fee</div>
            {feeRecovered ? (
              <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-2 py-1 text-[11px] text-emerald-100">
                Fee recovered 
              </span>
            ) : null}
          </div>
          <div className="mt-2 text-3xl font-semibold text-red-100">{formatMoney(activeCard.annualFee)}</div>
          <div className="mt-2 text-xs text-white/50">net value vs fee coming next</div>
        </div>
      </div>

      {/* Tier-1 premium quick wins */}
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className={surfaceCardClass("p-4")}>
          <div className="text-xs text-white/55">This month recovered</div>
          <div className="mt-2 text-2xl font-semibold text-white/95">{formatMoney(thisMonthRecovered)}</div>
          <div className="mt-2 text-xs text-white/50">approx: monthly credits you marked used</div>
        </div>
        <div className={surfaceCardClass("p-4")}>
          <div className="text-xs text-white/55">Streak</div>
          <div className="mt-2 text-2xl font-semibold text-white/95">{streakCount} credits checked off</div>
          <div className="mt-2 text-xs text-white/50">keeps you honest (and keeps your fee "paid for")</div>
        </div>
      </div>

      {/* Active card glow */}
      <div className={surfaceCardClass("mt-6 p-5 border-amber-300/15 shadow-[0_0_0_2px_rgba(245,158,11,0.10),0_0_90px_rgba(245,158,11,0.08)]")}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative h-12 w-12 overflow-hidden rounded-xl border border-white/10 bg-black/30">
              <Image src={activeCard.logo} alt={activeCard.name} fill className="object-cover" />
            </div>
            <div className="min-w-0">
              <div className="text-xl font-semibold text-white/95 leading-6 line-clamp-2">{activeCard.name}</div>
              <div className="mt-1 text-sm text-white/55">
                Annual fee: {formatMoney(activeCard.annualFee)} - Credits tracked: {formatMoney(activeCard.creditsTrackedAnnualized)}
              </div>
            </div>
          </div>
          <div className="text-xs text-white/45 text-right">
            Status
            <br />
            {user ? "Synced" : "Preview"}
          </div>
        </div>

        <div className="mt-6">
          <div className="text-base font-semibold text-white/90">Credits</div>

          <div className="mt-2 text-xs text-white/50">
            Sorted by frequency (Monthly -> Quarterly -> Semiannual -> Annual -> Other), then A-Z.
          </div>

          <div className="mt-4 space-y-3">
            {creditsSorted.map((c) => {
              const key = `${activeCard.key}:${c.id}`;
              const usedOn = !!used[key];
              const dontCareOn = !!dontCare[key];
              const remindOn = !!remind[key];

              return (
                <div key={c.id} className="rounded-2xl border border-white/10 bg-[#0F1218] p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-white/95 leading-5 line-clamp-2">{c.title}</div>
                      <div className="mt-1 text-xs text-white/55">
                        {creditSubtitle(c)}
                        {c.notes ? ` - ${c.notes}` : ""}
                      </div>
                    </div>

                    {/* Icon toggles */}
                    <div className="flex items-center gap-2 sm:justify-end">
                      <IconToggleButton
                        on={remindOn}
                        onClick={() => toggleRemind(activeCard.key, c.id)}
                        title="Remind"
                        icon={<IconBell className="h-4 w-4" />}
                        tone="neutral"
                      />
                      <IconToggleButton
                        on={dontCareOn}
                        onClick={() => toggleDontCare(activeCard.key, c.id)}
                        title="Don't care"
                        icon={<IconEyeOff className="h-4 w-4" />}
                        tone="warn"
                      />
                      <IconToggleButton
                        on={usedOn}
                        onClick={() => toggleUsed(activeCard.key, c.id)}
                        title="Mark used"
                        icon={<IconCheck className="h-4 w-4" />}
                        tone="good"
                      />
                    </div>
                  </div>
                </div>
              );
            })}

            {creditsSorted.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-[#0F1218] p-4 text-sm text-white/60">
                No credits found for this card.
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );

  // -------------------------
  // RIGHT: Multipliers + Expiring Soon
  // -------------------------
  const RightPanel = (
    <aside className="lg:col-span-3">
      <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-5 shadow-[0_0_70px_rgba(0,0,0,0.55)]">
        <div className="text-lg font-semibold text-amber-100">Points / Cash Back</div>
        <div className="mt-1 text-xs text-amber-100/70">Category multipliers for the active card</div>

        <div className="mt-4 space-y-2">
          {activeCard.multipliers.map((m) => (
            <div
              key={m.label}
              className="flex items-center justify-between gap-3 rounded-xl border border-amber-200/15 bg-black/20 px-3 py-2"
            >
              <div className="text-sm font-medium text-amber-50/90 leading-5 line-clamp-2">{m.label}</div>
              <div className="shrink-0 text-sm font-semibold text-amber-50">{m.x}x</div>
            </div>
          ))}
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
          Email: <b className="text-white/85">{notifEmailEnabled ? "ON" : "OFF"}</b> - SMS:{" "}
          <b className="text-white/85">{notifSmsEnabled ? "ON" : "OFF"}</b>
          <div className="mt-2 text-[11px] text-white/45">
            Configure in <b>Settings</b> (top-right). SMS requires consent + phone.
          </div>
        </div>
      </div>
    </aside>
  );

  // -------------------------
  // QUIZ MODAL (unchanged)
  // -------------------------

  const QuizModal = !quizOpen ? null : (
    <div className="fixed inset-0 z-50">
      <button
        className="absolute inset-0 bg-black/60"
        onClick={() => setQuizOpen(false)}
        aria-label="Close quiz modal backdrop"
      />
      <div className="absolute left-1/2 top-8 w-[92vw] max-w-3xl -translate-x-1/2">
        <div className={surfaceCardClass("p-5")}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xl font-semibold text-white/95">Card Fit Quiz</div>
              <div className="mt-1 text-sm text-white/55">Explainable, deterministic ranking (no AI calls).</div>
            </div>
            <button
              onClick={() => setQuizOpen(false)}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80 hover:bg-white/10"
              type="button"
            >
              Close
            </button>
          </div>

          {/* Step 0 */}
          {quizStage === 0 ? (
            <div className="mt-6">
              <div className="rounded-2xl border border-white/10 bg-[#0F1218] p-5">
                <div className="text-lg font-semibold text-white/95">Are you looking for a new card?</div>
                <div className="mt-2 text-sm text-white/60">
                  If you're just optimizing what you already have, we'll keep it focused on reminders and wins - no
                  "fake" recommendations.
                </div>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => {
                      setLookingForNew(true);
                      setQuizStage(1);
                    }}
                    className="flex-1 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black hover:bg-white/90"
                  >
                    Yes - recommend a new card
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLookingForNew(false);
                      setQuizStage(2);
                    }}
                    className="flex-1 rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white/90 hover:bg-white/10"
                  >
                    No - optimize my current card
                  </button>
                </div>

                <div className="mt-4 text-xs text-white/45">
                  Tip: The quiz is fast - your answers only change a deterministic score.
                </div>
              </div>
            </div>
          ) : null}

          {/* Optimize mode */}
          {quizStage === 2 && lookingForNew === false ? (
            <div className="mt-6 space-y-4">
              <div className="rounded-2xl border border-white/10 bg-[#0F1218] p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-lg font-semibold text-white/95">Optimize your current setup</div>
                    <div className="mt-1 text-sm text-white/60">Best ROI is usually just using what you already pay for.</div>
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
                    {activeCard.name}
                  </span>
                </div>

                <div className="mt-4 space-y-2 text-sm text-white/75">
                  <div>- Set your <b>cardmember year start date</b> so Expiring Soon is accurate.</div>
                  <div>- Turn on <b>Remind</b> for credits you care about - we'll surface what's due next.</div>
                  <div>- Aim for <b>Fee recovered</b>: {formatMoney(activeCard.annualFee)} in redeemed value.</div>
                  <div>- Use the "This month recovered" card as your weekly scoreboard.</div>
                </div>

                <div className="mt-4 rounded-xl border border-white/10 bg-black/25 p-3 text-xs text-white/60">
                  Pro tip: start with the credits you already use (Uber, streaming, travel) - then add the weird ones.
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={startTrackingScroll}
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/85 hover:bg-white/10"
                  >
                    Jump to "Choose your card"
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLookingForNew(true);
                      setQuizStage(1);
                    }}
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/85 hover:bg-white/10"
                  >
                    Actually, recommend a new card
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#0F1218] p-5">
                <div className="text-sm font-semibold text-white/90">Quick snapshot</div>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="text-[11px] text-white/55">Recovered</div>
                    <div className="mt-2 text-lg font-semibold text-emerald-100">{formatMoney(totals.totalRedeemed)}</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="text-[11px] text-white/55">Fee</div>
                    <div className="mt-2 text-lg font-semibold text-red-100">{formatMoney(activeCard.annualFee)}</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="text-[11px] text-white/55">Next expiry</div>
                    <div className="mt-2 text-lg font-semibold text-white/95">{nextExpiryPreview.label}</div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {/* Step 1: Questions */}
          {quizStage === 1 && lookingForNew === true ? (
            <div className="mt-6">
              <div className="rounded-2xl border border-white/10 bg-[#0F1218] p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-lg font-semibold text-white/95">What are you optimizing for?</div>
                    <div className="mt-1 text-sm text-white/60">We'll rank cards using an explainable score.</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setQuizStage(0);
                      setLookingForNew(null);
                    }}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80 hover:bg-white/10"
                  >
                    Back
                  </button>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div>
                    <div className="text-xs text-white/50">Intent</div>
                    <div className="mt-2 grid grid-cols-1 gap-2">
                      {[
                        { key: "max_points" as const, label: "Max points (travel hacking)" },
                        { key: "max_cashback" as const, label: "Max cash back (simple)" },
                        { key: "luxury_perks" as const, label: "Luxury perks (lounges + credits)" },
                        { key: "low_annual_fee" as const, label: "Low annual fee" },
                      ].map((o) => (
                        <button
                          key={o.key}
                          type="button"
                          onClick={() => setQuiz((p) => ({ ...p, intent: o.key }))}
                          className={[
                            "rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition",
                            quiz.intent === o.key
                              ? "border-white/25 bg-white/10 text-white"
                              : "border-white/10 bg-black/25 text-white/75 hover:bg-white/10",
                          ].join(" ")}
                        >
                          {o.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-white/50">Annual fee sensitivity</div>
                    <div className="mt-2 grid grid-cols-1 gap-2">
                      {[
                        { key: "premium_ok" as const, label: "Fine paying premium fee if ROI is real" },
                        { key: "under_250" as const, label: "Keep under $250" },
                        { key: "no_fee" as const, label: "No annual fee" },
                      ].map((o) => (
                        <button
                          key={o.key}
                          type="button"
                          onClick={() => setQuiz((p) => ({ ...p, feeSensitivity: o.key }))}
                          className={[
                            "rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition",
                            quiz.feeSensitivity === o.key
                              ? "border-white/25 bg-white/10 text-white"
                              : "border-white/10 bg-black/25 text-white/75 hover:bg-white/10",
                          ].join(" ")}
                        >
                          {o.label}
                        </button>
                      ))}
                    </div>

                    <div className="mt-5">
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-white/50">Credit-tracking tolerance</div>
                        <div className="text-xs text-white/70">{Math.round(quiz.trackingTolerancePct * 100)}%</div>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={Math.round(quiz.trackingTolerancePct * 100)}
                        onChange={(e) => setQuiz((p) => ({ ...p, trackingTolerancePct: Number(e.target.value) / 100 }))}
                        className="mt-2 w-full"
                      />
                      <div className="mt-1 text-[11px] text-white/45">0% = hate tracking. 100% = I'll use every credit.</div>
                    </div>

                    <label className="mt-4 flex items-center gap-2 text-sm text-white/70">
                      <input
                        type="checkbox"
                        checked={quiz.includeWelcomeBonus}
                        onChange={(e) => setQuiz((p) => ({ ...p, includeWelcomeBonus: e.target.checked }))}
                      />
                      Include welcome bonus value (if any)
                    </label>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="text-xs text-white/50">Monthly spend (rough)</div>
                  <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {(["dining", "travel", "groceries", "gas", "online", "other"] as SpendCategory[]).map((cat) => (
                      <div key={cat}>
                        <div className="text-xs text-white/50">{cat}</div>
                        <input
                          type="number"
                          value={quiz.spend[cat]}
                          onChange={(e) =>
                            setQuiz((p) => ({
                              ...p,
                              spend: { ...p.spend, [cat]: Number(e.target.value || 0) },
                            }))
                          }
                          className="mt-1 w-full rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm outline-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-xs text-white/45">Next: we'll show 1 best match + 2 alternatives with why bullets.</div>
                  <button
                    type="button"
                    onClick={() => setQuizStage(2)}
                    className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black hover:bg-white/90"
                  >
                    Show recommendations
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {/* Step 2: Results */}
          {quizStage === 2 && lookingForNew === true ? (
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setQuizStage(1)}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80 hover:bg-white/10"
                >
                  Back
                </button>
                <span className="text-xs text-white/45">Deterministic ranking - explainable</span>
              </div>

              {quizResults.length ? (
                <div className="rounded-2xl border border-white/10 bg-[#0F1218] p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm text-white/55">Top recommendation</div>
                      <div className="mt-1 text-xl font-semibold text-white/95">{quizResults[0].card.issuer} {quizResults[0].card.name}</div>
                      <div className="mt-1 text-sm text-white/60">
                        Est annual value: {formatMoney(quizResults[0].estAnnualValue)} - Fee {formatMoney(quizResults[0].card.annualFee)}
                      </div>
                    </div>
                    <span className={[
                      "shrink-0 rounded-full border px-3 py-1 text-xs font-semibold",
                      quizResults[0].confidence === "High"
                        ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100"
                        : quizResults[0].confidence === "Medium"
                        ? "border-amber-300/20 bg-amber-300/10 text-amber-100"
                        : "border-white/10 bg-white/5 text-white/70",
                    ].join(" ")}
                    >
                      Confidence: {quizResults[0].confidence}
                    </span>
                  </div>

                  <div className="mt-4">
                    <div className="text-sm font-semibold text-white/90">Why this fits you</div>
                    <div className="mt-2 space-y-1 text-sm text-white/75">
                      {quizResults[0].why.slice(0, 5).map((w) => (
                        <div key={w}>- {w}</div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 rounded-xl border border-white/10 bg-black/25 p-3 text-xs text-white/60">
                    Score is based on your spend, your willingness to track credits, and your annual-fee preference.
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-white/10 bg-[#0F1218] p-5 text-sm text-white/70">
                  No results yet - go back and answer the questions.
                </div>
              )}

              {quizResults.length > 1 ? (
                <div className="rounded-2xl border border-white/10 bg-[#0F1218] p-5">
                  <div className="text-sm font-semibold text-white/90">Alternatives</div>
                  <div className="mt-3 space-y-3">
                    {quizResults.slice(1, 3).map((r) => (
                      <div key={r.card.key} className="rounded-2xl border border-white/10 bg-black/25 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm font-semibold leading-5 line-clamp-2">{r.card.issuer} {r.card.name}</div>
                            <div className="mt-1 text-sm text-white/60">
                              Est annual value: {formatMoney(r.estAnnualValue)} - Fee {formatMoney(r.card.annualFee)}
                            </div>
                          </div>
                          <div className="shrink-0 text-xs text-white/50">Score {formatMoney(r.score)}</div>
                        </div>
                        <div className="mt-3 space-y-1 text-xs text-white/60">
                          {r.why.slice(0, 3).map((w) => (
                            <div key={w}>- {w}</div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );

  // -------------------------
  // PAGE
  // -------------------------
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050611] text-white">
      {/* Background (landing aesthetic) */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.18),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(34,197,94,0.10),transparent_55%)]" />
        <div className="absolute inset-0 opacity-70 bg-[linear-gradient(120deg,rgba(59,130,246,0.10),transparent_35%,rgba(236,72,153,0.08))]" />
        <div className="absolute -inset-[40%] rotate-12 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.05)_50%,transparent_100%)] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_70%)]" />
        <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:120px_120px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-2xl font-semibold text-white/95">ClawBack</div>
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

      {/* Toast + confetti */}
      {toast ? (
        <div className="fixed bottom-6 left-1/2 z-[80] -translate-x-1/2">
          <div className="rounded-full border border-white/10 bg-black/80 px-4 py-2 text-sm text-white/90 shadow-lg">{toast}</div>
        </div>
      ) : null}
      <ConfettiBurst seed={confettiSeed} />


      {AuthModal}
      {SettingsModal}
      {QuizModal}
    </div>
  );
}
