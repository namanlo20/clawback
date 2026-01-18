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
  notif_offsets_days: number[];
  sms_consent: boolean;
};

type QuizInputs = {
  spend: Record<SpendCategory, number>;
  annualFeeTolerance: number;
  creditUtilizationPct: number;
  includeWelcomeBonus: boolean;
};

type QuizStep = 'intro' | 'q1_dining' | 'q2_travel' | 'q3_travelfreq' | 'q4_fee' | 'q5_delivery' | 'q6_optimize' | 'q7_brand' | 'results';

type PartnerOffer = {
  id: string;
  merchant: string;
  amount: number;
  isPercent: boolean;
  expiry: string;
  cardKey: string;
};

type ReferralLink = {
  id: string;
  cardKey: string;
  url: string;
  bonus: string; // e.g., "30,000 MR" or "$200"
  notes?: string;
};

// Downgrade paths database
const DOWNGRADE_PATHS: Record<string, { name: string; loses: string[]; keeps: string[] }[]> = {
  'amex-platinum': [
    { name: 'Amex Gold', loses: ['Centurion Lounge', 'CLEAR credit', 'Uber credits'], keeps: ['MR points', 'Dining 4x', 'Grocery 4x'] },
    { name: 'Amex Green', loses: ['All lounge access', 'Hotel status', 'Most credits'], keeps: ['MR points', 'Transit 3x'] },
  ],
  'amex-gold': [
    { name: 'Amex Green', loses: ['Dining 4x', 'Uber/Grubhub credits'], keeps: ['MR points', 'Transit 3x'] },
    { name: 'Amex EveryDay', loses: ['All bonus categories', 'All credits'], keeps: ['MR points'] },
  ],
  'chase-sapphire-reserve': [
    { name: 'Chase Sapphire Preferred', loses: ['Priority Pass', 'DoorDash credits', '1.5x PYB'], keeps: ['UR points', 'Travel 2x', 'Dining 3x'] },
    { name: 'Chase Freedom Unlimited', loses: ['All travel perks', 'Transfer partners'], keeps: ['UR points (at 1cpp)'] },
  ],
  'capitalone-venture-x': [
    { name: 'Venture', loses: ['Lounge access', 'Credits'], keeps: ['Miles', '2x everywhere'] },
    { name: 'VentureOne', loses: ['All perks', 'No AF'], keeps: ['Miles', '1.25x'] },
  ],
};

// -----------------------------
// ICONS
// -----------------------------
const IconGear = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
  </svg>
);

const IconSparkles = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
  </svg>
);

const IconInfo = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
  </svg>
);

// -----------------------------
// HELPERS
// -----------------------------
function formatMoney(val: number): string {
  return val.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function formatMoneyDecimal(val: number): string {
  return val.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function freqLabel(f: CreditFrequency): string {
  const map: Record<CreditFrequency, string> = {
    monthly: "Monthly",
    quarterly: "Quarterly",
    semiannual: "Semi-annual",
    annual: "Annual",
    every4years: "Every 4 years",
    every5years: "Every 5 years",
    onetime: "One-time",
  };
  return map[f] ?? f;
}

function freqSort(f: CreditFrequency): number {
  const order: CreditFrequency[] = ["monthly", "quarterly", "semiannual", "annual", "every4years", "every5years", "onetime"];
  return order.indexOf(f);
}

function annualize(amount: number, freq: CreditFrequency): number {
  switch (freq) {
    case "monthly": return amount * 12;
    case "quarterly": return amount * 4;
    case "semiannual": return amount * 2;
    case "annual": return amount;
    case "every4years": return amount / 4;
    case "every5years": return amount / 5;
    case "onetime": return 0;
    default: return 0;
  }
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

function getDaysUntilReset(freq: CreditFrequency): number {
  const now = new Date();
  const day = now.getDate();
  const month = now.getMonth();
  
  switch (freq) {
    case "monthly":
      const daysInMonth = new Date(now.getFullYear(), month + 1, 0).getDate();
      return daysInMonth - day + 1;
    case "quarterly":
      const quarterEnd = Math.ceil((month + 1) / 3) * 3;
      const quarterEndDate = new Date(now.getFullYear(), quarterEnd, 0);
      return Math.ceil((quarterEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    case "semiannual":
      const halfEnd = month < 6 ? 6 : 12;
      const halfEndDate = new Date(now.getFullYear(), halfEnd, 0);
      return Math.ceil((halfEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    case "annual":
      const yearEnd = new Date(now.getFullYear(), 11, 31);
      return Math.ceil((yearEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    default:
      return 365;
  }
}

// -----------------------------
// PERIOD-BASED TRACKING
// -----------------------------
type Period = {
  key: string;      // e.g., "2026-01", "2026-Q1", "2026-H1", "2026"
  label: string;    // e.g., "Jan", "Q1", "H1", "2026"
  shortLabel: string; // e.g., "J", "Q1", "H1", "26"
};

function getPeriodsForFrequency(freq: CreditFrequency, year: number = new Date().getFullYear()): Period[] {
  const now = new Date();
  const currentMonth = now.getMonth(); // 0-11
  const currentYear = now.getFullYear();
  
  // Only show periods up to current period (can't use future credits)
  const isCurrentYear = year === currentYear;
  
  switch (freq) {
    case "monthly": {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const shortMonths = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
      const maxMonth = isCurrentYear ? currentMonth : 11;
      return months.slice(0, maxMonth + 1).map((m, i) => ({
        key: `${year}-${String(i + 1).padStart(2, '0')}`,
        label: m,
        shortLabel: shortMonths[i],
      }));
    }
    case "quarterly": {
      const quarters = [
        { key: `${year}-Q1`, label: 'Q1', shortLabel: 'Q1', endMonth: 2 },
        { key: `${year}-Q2`, label: 'Q2', shortLabel: 'Q2', endMonth: 5 },
        { key: `${year}-Q3`, label: 'Q3', shortLabel: 'Q3', endMonth: 8 },
        { key: `${year}-Q4`, label: 'Q4', shortLabel: 'Q4', endMonth: 11 },
      ];
      const maxQuarter = isCurrentYear ? Math.floor(currentMonth / 3) : 3;
      return quarters.slice(0, maxQuarter + 1);
    }
    case "semiannual": {
      const halves = [
        { key: `${year}-H1`, label: 'H1', shortLabel: 'H1', endMonth: 5 },
        { key: `${year}-H2`, label: 'H2', shortLabel: 'H2', endMonth: 11 },
      ];
      const maxHalf = isCurrentYear ? (currentMonth < 6 ? 0 : 1) : 1;
      return halves.slice(0, maxHalf + 1);
    }
    case "annual":
      return [{ key: `${year}`, label: `${year}`, shortLabel: `'${String(year).slice(-2)}` }];
    case "every4years":
    case "every5years":
    case "onetime":
      return [{ key: `${year}`, label: `${year}`, shortLabel: `'${String(year).slice(-2)}` }];
    default:
      return [];
  }
}

function getPeriodStateKey(cardKey: string, creditId: string, periodKey: string): string {
  return `${cardKey}::${creditId}::${periodKey}`;
}

function countUsedPeriods(cardKey: string, creditId: string, freq: CreditFrequency, usedState: ToggleState): number {
  const periods = getPeriodsForFrequency(freq);
  let count = 0;
  for (const p of periods) {
    const stateKey = getPeriodStateKey(cardKey, creditId, p.key);
    if (usedState[stateKey]) count++;
  }
  return count;
}

// -----------------------------
// SCORING ENGINE
// -----------------------------
function scoreCard(card: Card, inputs: QuizInputs): { score: number; detailLines: string[] } {
  let score = 0;
  const detailLines: string[] = [];
  const pvUsd = pointValueUsd(card.pointsProgram);
  
  for (const cat of Object.keys(inputs.spend) as SpendCategory[]) {
    const spend = inputs.spend[cat];
    const rate = card.earnRates[cat] ?? 1;
    const pts = spend * 12 * rate;
    const val = pts * pvUsd;
    score += val;
    if (spend > 0 && rate > 1) {
      detailLines.push(`${cat}: ${rate}x → ${formatMoney(val)}/yr`);
    }
  }
  
  const creditVal = card.creditsTrackedAnnualized * inputs.creditUtilizationPct;
  score += creditVal;
  if (creditVal > 0) detailLines.push(`Credits: ${formatMoney(creditVal)}/yr`);
  
  if (inputs.includeWelcomeBonus && card.signupBonusEstUsd) {
    score += card.signupBonusEstUsd * 0.25;
    detailLines.push(`SUB: ~${formatMoney(card.signupBonusEstUsd)} (weighted)`);
  }
  
  score -= card.annualFee;
  detailLines.push(`Annual fee: -${formatMoney(card.annualFee)}`);
  
  if (card.annualFee > inputs.annualFeeTolerance) {
    score *= 0.5;
    detailLines.push(`(Fee exceeds tolerance → score halved)`);
  }
  
  return { score, detailLines };
}

function parseOffsets(arr: unknown): number[] {
  if (!Array.isArray(arr)) return [7, 1];
  const nums = arr.filter((x) => typeof x === "number" && x > 0);
  const unique = Array.from(new Set(nums)) as number[];
  unique.sort((a, b) => b - a);
  return unique.length ? unique : [7, 1];
}

// -----------------------------
// SKELETON LOADER
// -----------------------------
function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-white/10 rounded ${className ?? ''}`} />
  );
}

// -----------------------------
// TOOLTIP COMPONENT
// -----------------------------
function Tooltip({ children, text }: { children: React.ReactNode; text: string }) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-block">
      <span onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
        {children}
      </span>
      {show && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-black/90 rounded whitespace-nowrap z-50">
          {text}
        </span>
      )}
    </span>
  );
}

// -----------------------------
// PROGRESS RING COMPONENT
// -----------------------------
function ProgressRing({ percent, size = 80, stroke = 6 }: { percent: number; size?: number; stroke?: number }) {
  const radius = (size - stroke) / 2;
  const circumference = radius * 2 * Math.PI;
  const clampedPercent = Math.min(Math.max(percent, 0), 100);
  const offset = circumference - (clampedPercent / 100) * circumference;
  const color = clampedPercent >= 100 ? '#10b981' : clampedPercent >= 60 ? '#fbbf24' : '#ef4444';
  
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} strokeWidth={stroke} stroke="rgba(255,255,255,0.1)" fill="none" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={stroke}
        stroke={color}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="transition-all duration-500"
      />
    </svg>
  );
}

// -----------------------------
// PAGE
// -----------------------------
export default function AppDashboardPage() {
  const [mobileView, setMobileView] = useState<"cards" | "credits" | "insights">("credits");
  const [activeTab, setActiveTab] = useState<"dashboard" | "compare" | "learn" | "settings">("dashboard");
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

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

  // Partner offers
  const [partnerOffers, setPartnerOffers] = useState<PartnerOffer[]>([]);
  const [offerModalOpen, setOfferModalOpen] = useState(false);
  const [newOffer, setNewOffer] = useState<Partial<PartnerOffer>>({});

  // Referral links (Pro feature)
  const [referralLinks, setReferralLinks] = useState<ReferralLink[]>([]);
  const [newReferral, setNewReferral] = useState<Partial<ReferralLink>>({});

  // Compare tool
  const [compareCards, setCompareCards] = useState<string[]>([]);
  const [compareModalOpen, setCompareModalOpen] = useState(false);

  // Check Pro status + hash routing on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsPro(localStorage.getItem('clawback_isPro') === 'true');
      
      // Load partner offers
      const savedOffers = localStorage.getItem('clawback_partnerOffers');
      if (savedOffers) {
        try { setPartnerOffers(JSON.parse(savedOffers)); } catch {}
      }
      
      // Load referral links
      const savedReferrals = localStorage.getItem('clawback_referralLinks');
      if (savedReferrals) {
        try { setReferralLinks(JSON.parse(savedReferrals)); } catch {}
      }
      
      // Simulate loading
      setTimeout(() => {
        setIsLoading(false);
        setLastUpdated(new Date());
      }, 800);
    }
  }, []);

  // Save partner offers to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && partnerOffers.length > 0) {
      localStorage.setItem('clawback_partnerOffers', JSON.stringify(partnerOffers));
    }
  }, [partnerOffers]);

  // Save referral links to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('clawback_referralLinks', JSON.stringify(referralLinks));
    }
  }, [referralLinks]);

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

  // Display name
  const displayName = useMemo(() => {
    const n = fullName.trim();
    if (n) return n.split(' ')[0];
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

  // Group credits by frequency for tiered display
  const creditsGrouped = useMemo(() => {
    const groups: Record<CreditFrequency, Credit[]> = {
      monthly: [],
      quarterly: [],
      semiannual: [],
      annual: [],
      every4years: [],
      every5years: [],
      onetime: [],
    };
    
    for (const c of activeCard.credits) {
      groups[c.frequency].push(c);
    }
    
    // Sort each group alphabetically
    for (const key of Object.keys(groups) as CreditFrequency[]) {
      groups[key].sort((a, b) => a.title.localeCompare(b.title));
    }
    
    return groups;
  }, [activeCard]);

  // Frequency display order and labels
  const frequencyOrder: CreditFrequency[] = ['monthly', 'quarterly', 'semiannual', 'annual', 'every4years', 'every5years', 'onetime'];
  const frequencyLabels: Record<CreditFrequency, string> = {
    monthly: 'Monthly Credits',
    quarterly: 'Quarterly Credits',
    semiannual: 'Semi-Annual Credits',
    annual: 'Annual Credits',
    every4years: 'Every 4 Years',
    every5years: 'Every 5 Years',
    onetime: 'One-Time Credits',
  };

  // Calculate totals for active card - PERIOD-BASED TRACKING
  const totals = useMemo(() => {
    let totalAvail = 0;
    let totalRedeemed = 0;
    let totalRemaining = 0;
    
    for (const c of activeCard.credits) {
      const periods = getPeriodsForFrequency(c.frequency);
      const totalPeriods = periods.length;
      const usedPeriodsCount = countUsedPeriods(activeCard.key, c.id, c.frequency, used);
      
      // Total available = periods so far this year × amount
      const availThisYear = totalPeriods * c.amount;
      totalAvail += availThisYear;
      
      // Redeemed = used periods × amount
      totalRedeemed += usedPeriodsCount * c.amount;
      
      // Remaining = (total periods - used periods) × amount
      // Only count if not marked as "don't care"
      const baseKey = `${activeCard.key}::${c.id}`;
      const isDontCare = !!dontCare[baseKey];
      if (!isDontCare) {
        totalRemaining += (totalPeriods - usedPeriodsCount) * c.amount;
      }
    }
    
    return { totalAvail, totalRedeemed, totalRemaining };
  }, [activeCard, used, dontCare]);

  // My Savings calculations
  const savingsData = useMemo(() => {
    const fee = activeCard.annualFee;
    const redeemed = totals.totalRedeemed;
    const remaining = totals.totalRemaining;
    const netValue = redeemed - fee;
    const projectedNet = (redeemed + remaining * 0.7) - fee; // 70% likely to use remaining
    const percentRecovered = fee > 0 ? Math.round((redeemed / fee) * 100) : 100;
    const breakEvenReached = redeemed >= fee;
    const toBreakEven = Math.max(0, fee - redeemed);
    
    return { fee, redeemed, remaining, netValue, projectedNet, percentRecovered, breakEvenReached, toBreakEven };
  }, [activeCard, totals]);

  // Confetti on break-even
  useEffect(() => {
    if (savingsData.breakEvenReached && !hasCelebrated[activeCard.key] && totals.totalRedeemed > 0) {
      fireConfetti();
      setHasCelebrated((prev) => ({ ...prev, [activeCard.key]: true }));
    }
  }, [savingsData.breakEvenReached, activeCard.key, hasCelebrated, totals.totalRedeemed]);

  // Use Today items (urgency feed)
  const useTodayItems = useMemo(() => {
    const items: Array<{ card: Card; credit: Credit; daysLeft: number; value: number; type: 'expiring' | 'resetting' | 'high-value' }> = [];
    
    const cardsToCheck = isPro ? CARDS : CARDS.slice(0, 1);
    
    for (const card of cardsToCheck) {
      if (!savedCards.includes(card.key) && savedCards.length > 0) continue;
      
      for (const credit of card.credits) {
        const key = `${card.key}::${credit.id}`;
        if (used[key] || dontCare[key]) continue;
        
        const daysLeft = getDaysUntilReset(credit.frequency);
        const value = credit.amount;
        
        if (daysLeft <= 7) {
          items.push({ card, credit, daysLeft, value, type: 'expiring' });
        } else if (daysLeft <= 14) {
          items.push({ card, credit, daysLeft, value, type: 'resetting' });
        } else if (value >= 50) {
          items.push({ card, credit, daysLeft, value, type: 'high-value' });
        }
      }
    }
    
    // Add partner offers expiring soon
    for (const offer of partnerOffers) {
      const expiry = new Date(offer.expiry);
      const daysLeft = Math.ceil((expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (daysLeft <= 7 && daysLeft > 0) {
        const card = CARDS.find(c => c.key === offer.cardKey);
        if (card) {
          items.push({
            card,
            credit: { id: offer.id, title: `${offer.merchant} Offer`, amount: offer.amount, frequency: 'onetime' },
            daysLeft,
            value: offer.amount,
            type: 'expiring'
          });
        }
      }
    }
    
    // Sort: expiring first, then resetting, then high-value, then by value
    items.sort((a, b) => {
      if (a.type !== b.type) {
        const order = { expiring: 0, resetting: 1, 'high-value': 2 };
        return order[a.type] - order[b.type];
      }
      if (a.daysLeft !== b.daysLeft) return a.daysLeft - b.daysLeft;
      return b.value - a.value;
    });
    
    return isPro ? items.slice(0, 10) : items.slice(0, 3);
  }, [savedCards, used, dontCare, isPro, partnerOffers]);

  // Recommended action (deterministic)
  const recommendedAction = useMemo(() => {
    // Rule 1: Highest $ credit expiring within 7 days AND unused
    const expiringSoon = useTodayItems.filter(i => i.type === 'expiring' && i.daysLeft <= 7);
    if (expiringSoon.length > 0) {
      const best = expiringSoon.reduce((a, b) => a.value > b.value ? a : b);
      return {
        type: 'use-credit' as const,
        message: `Use your ${formatMoney(best.value)} ${best.credit.title} on ${best.card.name}`,
        subtext: `Expires in ${best.daysLeft} day${best.daysLeft === 1 ? '' : 's'}`,
        cardKey: best.card.key,
      };
    }
    
    // Rule 2: Highest unused monthly credit
    for (const card of CARDS) {
      for (const credit of card.credits) {
        const key = `${card.key}::${credit.id}`;
        if (!used[key] && !dontCare[key] && credit.frequency === 'monthly') {
          return {
            type: 'use-credit' as const,
            message: `Use your ${formatMoney(credit.amount)} ${credit.title}`,
            subtext: `${card.name} • Monthly credit`,
            cardKey: card.key,
          };
        }
      }
    }
    
    // Rule 3: Prompt to add card or take quiz
    if (savedCards.length === 0) {
      return {
        type: 'add-card' as const,
        message: 'Add your first card to start tracking',
        subtext: 'Or take the quiz to find your perfect card',
        cardKey: null,
      };
    }
    
    return {
      type: 'all-good' as const,
      message: "You're all caught up! 🎉",
      subtext: 'All credits used or tracked',
      cardKey: null,
    };
  }, [useTodayItems, savedCards, used, dontCare]);

  // Annual fee defense
  const feeDefense = useMemo(() => {
    const percent = savingsData.percentRecovered;
    let verdict: 'worth-it' | 'consider' | 'downgrade';
    let message: string;
    
    if (percent >= 100) {
      verdict = 'worth-it';
      message = "You've exceeded your annual fee in value!";
    } else if (percent >= 60) {
      verdict = 'consider';
      message = `${100 - percent}% more to break even. Consider using remaining credits.`;
    } else {
      verdict = 'downgrade';
      message = "Consider downgrading to a no-fee card.";
    }
    
    const downgradePaths = DOWNGRADE_PATHS[activeCard.key] || [];
    
    return { percent, verdict, message, downgradePaths };
  }, [savingsData, activeCard]);

  // Quiz state
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

  // Quiz results
  const quizResults = useMemo(() => {
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
  }, []);

  // Handle URL hash for modal routing
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash === '#signin') {
        setAuthModalOpen(true);
        setAuthMode('signin');
        window.history.replaceState(null, '', '/app');
      } else if (hash === '#signup') {
        setAuthModalOpen(true);
        setAuthMode('signup');
        window.history.replaceState(null, '', '/app');
      } else if (hash === '#quiz') {
        setQuizOpen(true);
        resetQuiz();
        window.history.replaceState(null, '', '/app');
      }
    };
    
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [resetQuiz]);

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

  // Load profile
  useEffect(() => {
    if (!user) return;
    let alive = true;
    (async () => {
      const { data } = await supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle();
      if (!alive || !data) return;
      const p = data as DbProfile;
      setFullName(p.full_name ?? "");
      setPhoneE164(p.phone_e164 ?? "");
      setNotifEmailEnabled(p.notif_email_enabled ?? true);
      setNotifSmsEnabled(p.notif_sms_enabled ?? false);
      setSmsConsent(p.sms_consent ?? false);
      setOffsetsDays(parseOffsets(p.notif_offsets_days));
    })();
    return () => { alive = false; };
  }, [user]);

  // Load saved cards + credit states
  useEffect(() => {
    if (!user) return;
    let alive = true;
    (async () => {
      const { data: uc } = await supabase.from("user_cards").select("card_key, card_start_date").eq("user_id", user.id);
      if (alive && uc) {
        setSavedCards((uc as DbUserCard[]).map((r) => r.card_key));
        const starts: Record<string, string> = {};
        for (const r of uc as DbUserCard[]) {
          if (r.card_start_date) starts[r.card_key] = r.card_start_date;
        }
        setCardStartDates(starts);
      }

      const { data: cs } = await supabase.from("credit_states").select("state_key, used, dont_care, remind").eq("user_id", user.id);
      if (alive && cs) {
        const u: ToggleState = {};
        const d: ToggleState = {};
        const r: ToggleState = {};
        for (const row of cs as DbCreditState[]) {
          u[row.state_key] = row.used;
          d[row.state_key] = row.dont_care;
          r[row.state_key] = row.remind;
        }
        setUsed(u);
        setDontCare(d);
        setRemind(r);
      }
    })();
    return () => { alive = false; };
  }, [user]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    showToast("Signed out successfully");
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthBusy(true);
    setAuthMsg(null);

    try {
      if (authMode === "signup") {
        const { error } = await supabase.auth.signUp({ email: authEmail, password: authPassword });
        if (error) throw error;
        setAuthMsg("Check your email for the confirmation link!");
      } else if (authMode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword });
        if (error) throw error;
        setAuthModalOpen(false);
        showToast("Welcome back!");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(resetEmail);
        if (error) throw error;
        setResetMsg("Check your email for the reset link.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      if (authMode === "reset") setResetMsg(msg);
      else setAuthMsg(msg);
    } finally {
      setAuthBusy(false);
    }
  };

  const saveProfile = async () => {
    if (!user) return;
    setProfileLoading(true);
    setProfileMsg(null);

    const payload: Partial<DbProfile> = {
      user_id: user.id,
      full_name: fullName || null,
      phone_e164: phoneE164 || null,
      notif_email_enabled: notifEmailEnabled,
      notif_sms_enabled: notifSmsEnabled,
      notif_offsets_days: offsetsDays,
      sms_consent: smsConsent,
    };

    const { error } = await supabase.from("profiles").upsert(payload, { onConflict: "user_id" });
    setProfileLoading(false);

    if (error) {
      setProfileMsg("Failed to save: " + error.message);
    } else {
      setProfileMsg("Saved!");
      showToast("Settings saved ✓");
      setTimeout(() => setProfileMsg(null), 2000);
    }
  };

  const toggleSaveCard = async (key: string) => {
    if (!user) {
      setAuthModalOpen(true);
      setAuthMode("signup");
      return;
    }

    // Free tier: limit to 1 card
    if (!isPro && !savedCards.includes(key) && savedCards.length >= 1) {
      setUpgradeModalOpen(true);
      return;
    }

    const alreadySaved = savedCards.includes(key);
    if (alreadySaved) {
      setSavedCards((prev) => prev.filter((k) => k !== key));
      await supabase.from("user_cards").delete().eq("user_id", user.id).eq("card_key", key);
    } else {
      setSavedCards((prev) => [...prev, key]);
      await supabase.from("user_cards").upsert({ user_id: user.id, card_key: key });
    }
    showToast(alreadySaved ? "Card removed" : "Card saved ✓");
  };

  const toggleUsed = async (creditKey: string) => {
    const next = !used[creditKey];
    setUsed((prev) => ({ ...prev, [creditKey]: next }));
    if (user) {
      await supabase.from("credit_states").upsert({ user_id: user.id, state_key: creditKey, used: next, dont_care: dontCare[creditKey] ?? false, remind: remind[creditKey] ?? true }, { onConflict: "user_id,state_key" });
    }
    showToast(next ? "Marked as used ✓" : "Unmarked");
  };

  const toggleDontCare = async (creditKey: string) => {
    const next = !dontCare[creditKey];
    setDontCare((prev) => ({ ...prev, [creditKey]: next }));
    if (user) {
      await supabase.from("credit_states").upsert({ user_id: user.id, state_key: creditKey, used: used[creditKey] ?? false, dont_care: next, remind: remind[creditKey] ?? true }, { onConflict: "user_id,state_key" });
    }
  };

  // Add partner offer
  const addPartnerOffer = () => {
    if (!newOffer.merchant || !newOffer.amount || !newOffer.expiry || !newOffer.cardKey) return;
    
    // Free tier: limit to 5 offers
    if (!isPro && partnerOffers.length >= 5) {
      setUpgradeModalOpen(true);
      return;
    }
    
    const offer: PartnerOffer = {
      id: `offer-${Date.now()}`,
      merchant: newOffer.merchant,
      amount: newOffer.amount,
      isPercent: newOffer.isPercent ?? false,
      expiry: newOffer.expiry,
      cardKey: newOffer.cardKey,
    };
    
    setPartnerOffers(prev => [...prev, offer]);
    setNewOffer({});
    setOfferModalOpen(false);
    showToast("Offer added ✓");
  };

  // Export to CSV (Pro only)
  const exportCSV = () => {
    if (!isPro) {
      setUpgradeModalOpen(true);
      return;
    }
    
    let csv = "Card,Credit,Amount,Frequency,Status\n";
    for (const card of CARDS) {
      if (!savedCards.includes(card.key) && savedCards.length > 0) continue;
      for (const credit of card.credits) {
        const key = `${card.key}::${credit.id}`;
        const status = used[key] ? 'Used' : dontCare[key] ? 'Skipped' : 'Pending';
        csv += `"${card.name}","${credit.title}",${credit.amount},"${freqLabel(credit.frequency)}","${status}"\n`;
      }
    }
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'clawback-credits.csv';
    a.click();
    showToast("CSV exported ✓");
  };

  // Filter cards
  // Group cards by fee tiers: $500+, $250-500, $0-250
  const cardsByTier = useMemo(() => {
    let list = CARDS;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((c) => c.name.toLowerCase().includes(q) || c.issuer.toLowerCase().includes(q));
    }
    list = list.filter((c) => c.annualFee >= feeMin && c.annualFee <= feeMax);

    // Define tiers
    const tier1 = list.filter(c => c.annualFee >= 500).sort((a, b) => b.annualFee - a.annualFee);
    const tier2 = list.filter(c => c.annualFee >= 250 && c.annualFee < 500).sort((a, b) => b.annualFee - a.annualFee);
    const tier3 = list.filter(c => c.annualFee < 250).sort((a, b) => b.annualFee - a.annualFee);

    return {
      premium: { label: 'Premium ($500+)', cards: tier1 },
      mid: { label: 'Mid-Tier ($250-$499)', cards: tier2 },
      entry: { label: 'Entry ($0-$249)', cards: tier3 },
      total: tier1.length + tier2.length + tier3.length,
    };
  }, [search, feeMin, feeMax]);

  // Updated X mins ago
  const updatedAgo = useMemo(() => {
    const mins = Math.floor((Date.now() - lastUpdated.getTime()) / 60000);
    if (mins < 1) return 'Just now';
    if (mins === 1) return '1 min ago';
    return `${mins} mins ago`;
  }, [lastUpdated]);

  // --- UI COMPONENTS ---

  // My Savings Widget
  const MySavingsWidget = (
    <div className={surfaceCardClass("p-5")}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold text-white/95">My Savings</h3>
          <Tooltip text="Track how much value you've redeemed vs your annual fee">
            <IconInfo className="h-4 w-4 text-white/40 cursor-help" />
          </Tooltip>
        </div>
        <span className="text-xs text-white/40">{updatedAgo}</span>
      </div>
      
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-20 rounded-full mx-auto" />
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>
      ) : (
        <div className="flex items-center gap-6">
          <div className="relative">
            <ProgressRing percent={savingsData.percentRecovered} size={90} stroke={8} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold text-white/95">{savingsData.percentRecovered}%</span>
            </div>
          </div>
          
          <div className="flex-1 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-white/60">Annual Fee</span>
              <span className="text-white/90 font-medium">{formatMoney(savingsData.fee)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/60">Redeemed</span>
              <span className="text-emerald-400 font-medium">{formatMoney(savingsData.redeemed)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/60">Remaining</span>
              <span className="text-white/70">{formatMoney(savingsData.remaining)}</span>
            </div>
            <div className="pt-2 border-t border-white/10">
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Net Value</span>
                <span className={savingsData.netValue >= 0 ? "text-emerald-400 font-semibold" : "text-red-400 font-semibold"}>
                  {savingsData.netValue >= 0 ? '+' : ''}{formatMoney(savingsData.netValue)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {!isLoading && savingsData.breakEvenReached && (
        <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-400/20 text-center">
          <span className="text-emerald-300 text-sm font-medium">🎉 Break-even reached!</span>
        </div>
      )}
      
      {!isLoading && !savingsData.breakEvenReached && savingsData.toBreakEven > 0 && (
        <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-400/20 text-center">
          <span className="text-amber-300 text-sm">{formatMoney(savingsData.toBreakEven)} to break even</span>
        </div>
      )}
    </div>
  );

  // Use Today Strip
  const UseTodayStrip = useTodayItems.length === 0 ? null : (
    <div className={surfaceCardClass("p-4 mb-6")}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white/95 flex items-center gap-2">
          <span className="text-lg">⚡</span> Use Today
        </h3>
        {!isPro && useTodayItems.length >= 3 && (
          <button onClick={() => setUpgradeModalOpen(true)} className="text-xs text-purple-400 hover:text-purple-300">
            See all →
          </button>
        )}
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
        {useTodayItems.map((item, i) => (
          <button
            key={`${item.card.key}-${item.credit.id}-${i}`}
            onClick={() => setActiveCardKey(item.card.key)}
            className="flex-shrink-0 rounded-xl border border-white/10 bg-white/5 p-3 hover:bg-white/10 transition text-left min-w-[160px]"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                item.type === 'expiring' ? 'bg-red-500/20 text-red-300' :
                item.type === 'resetting' ? 'bg-amber-500/20 text-amber-300' :
                'bg-emerald-500/20 text-emerald-300'
              }`}>
                {item.type === 'expiring' ? `${item.daysLeft}d left` :
                 item.type === 'resetting' ? 'Resets soon' : 'High value'}
              </span>
            </div>
            <div className="text-white/90 font-semibold">{formatMoney(item.value)}</div>
            <div className="text-xs text-white/50 truncate">{item.credit.title}</div>
            <div className="text-xs text-white/40 truncate">{item.card.name}</div>
          </button>
        ))}
      </div>
    </div>
  );

  // Recommended Action
  const RecommendedActionWidget = (
    <div className={surfaceCardClass("p-4 mb-6 border-purple-500/20 bg-gradient-to-r from-purple-500/5 to-transparent")}>
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
          <IconSparkles className="h-5 w-5 text-purple-400" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium text-white/95">{recommendedAction.message}</div>
          <div className="text-xs text-white/50 mt-1">{recommendedAction.subtext}</div>
        </div>
        {recommendedAction.cardKey && (
          <button
            onClick={() => setActiveCardKey(recommendedAction.cardKey!)}
            className="text-xs text-purple-400 hover:text-purple-300 font-medium"
          >
            View →
          </button>
        )}
        {recommendedAction.type === 'add-card' && (
          <button
            onClick={() => { setQuizOpen(true); resetQuiz(); }}
            className="text-xs text-purple-400 hover:text-purple-300 font-medium"
          >
            Take Quiz →
          </button>
        )}
      </div>
    </div>
  );

  // Widgets row
  const WidgetsRow = (
    <div className="grid grid-cols-3 gap-3 mb-6">
      <div className={surfaceCardClass("p-4 text-center")}>
        <div className="text-2xl mb-1">📅</div>
        <div className="text-lg font-bold text-white/95">{useTodayItems.filter(i => i.type === 'expiring').length}</div>
        <div className="text-xs text-white/50">Expiring this week</div>
      </div>
      <div className={surfaceCardClass("p-4 text-center")}>
        <div className="text-2xl mb-1">🎯</div>
        <div className="text-lg font-bold text-white/95">{formatMoney(savingsData.toBreakEven)}</div>
        <div className="text-xs text-white/50">To break even</div>
      </div>
      <div className={surfaceCardClass("p-4 text-center")}>
        <div className="text-2xl mb-1">🔔</div>
        <div className="text-lg font-bold text-white/95">{offsetsDays[0] || 7}d</div>
        <div className="text-xs text-white/50">Next reminder</div>
      </div>
    </div>
  );

  // Earning Categories Widget
  const EarningCategoriesWidget = (
    <div className={surfaceCardClass("p-5")}>
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-base font-semibold text-white/95">Earning Categories</h3>
        <Tooltip text="Points multipliers for different spending categories">
          <IconInfo className="h-4 w-4 text-white/40 cursor-help" />
        </Tooltip>
      </div>
      
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      ) : (
        <div className="space-y-2">
          {Object.entries(activeCard.earnRates).length === 0 ? (
            <div className="text-sm text-white/50 text-center py-2">No category bonuses</div>
          ) : (
            Object.entries(activeCard.earnRates)
              .sort(([, a], [, b]) => (b as number) - (a as number))
              .map(([category, multiplier]) => {
                const categoryIcons: Record<string, string> = {
                  dining: '🍽️',
                  travel: '✈️',
                  groceries: '🛒',
                  gas: '⛽',
                  online: '🛍️',
                  other: '💳',
                };
                const categoryLabels: Record<string, string> = {
                  dining: 'Dining',
                  travel: 'Travel',
                  groceries: 'Groceries',
                  gas: 'Gas',
                  online: 'Online Shopping',
                  other: 'Everything Else',
                };
                const mult = multiplier as number;
                const isHighMultiplier = mult >= 3;
                
                return (
                  <div
                    key={category}
                    className={`flex items-center justify-between p-3 rounded-xl ${
                      isHighMultiplier ? 'bg-purple-500/10 border border-purple-400/20' : 'bg-white/5 border border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{categoryIcons[category] || '💳'}</span>
                      <span className="text-sm text-white/90">{categoryLabels[category] || category}</span>
                    </div>
                    <div className={`text-sm font-bold ${isHighMultiplier ? 'text-purple-300' : 'text-white/70'}`}>
                      {mult}x
                    </div>
                  </div>
                );
              })
          )}
        </div>
      )}
      
      {/* Points program badge */}
      <div className="mt-4 pt-3 border-t border-white/10">
        <div className="flex items-center justify-between text-xs">
          <span className="text-white/50">Points Program</span>
          <span className="text-white/70 font-medium uppercase">
            {activeCard.pointsProgram.replace('_', ' ')}
          </span>
        </div>
      </div>
    </div>
  );

  // Annual Fee Defense Widget
  const FeeDefenseWidget = (
    <div className={surfaceCardClass("p-5")}>
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-base font-semibold text-white/95">Annual Fee Defense</h3>
        <Tooltip text="Should you keep or downgrade this card?">
          <IconInfo className="h-4 w-4 text-white/40 cursor-help" />
        </Tooltip>
      </div>
      
      <div className="flex items-center gap-4 mb-4">
        <div className={`px-3 py-1.5 rounded-full text-sm font-medium ${
          feeDefense.verdict === 'worth-it' ? 'bg-emerald-500/20 text-emerald-300' :
          feeDefense.verdict === 'consider' ? 'bg-amber-500/20 text-amber-300' :
          'bg-red-500/20 text-red-300'
        }`}>
          {feeDefense.verdict === 'worth-it' ? '✓ Worth keeping' :
           feeDefense.verdict === 'consider' ? '⚠ Consider usage' :
           '↓ Consider downgrade'}
        </div>
        <div className="text-sm text-white/60">{feeDefense.percent}% recovered</div>
      </div>
      
      <p className="text-sm text-white/70 mb-4">{feeDefense.message}</p>
      
      {feeDefense.verdict === 'downgrade' && feeDefense.downgradePaths.length > 0 && (
        <div className="space-y-3">
          <div className="text-xs text-white/50 uppercase tracking-wide">Downgrade options</div>
          {feeDefense.downgradePaths.map((path, i) => (
            <div key={i} className="p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="font-medium text-white/90 text-sm mb-2">{path.name}</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <div className="text-red-400 mb-1">You lose:</div>
                  <ul className="text-white/50 space-y-0.5">
                    {path.loses.map((l, j) => <li key={j}>• {l}</li>)}
                  </ul>
                </div>
                <div>
                  <div className="text-emerald-400 mb-1">You keep:</div>
                  <ul className="text-white/50 space-y-0.5">
                    {path.keeps.map((k, j) => <li key={j}>• {k}</li>)}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Render a single card button
  const renderCardButton = (card: Card) => {
    const isSaved = savedCards.includes(card.key);
    const isActive = card.key === activeCardKey;
    return (
      <button
        key={card.key}
        onClick={() => setActiveCardKey(card.key)}
        className={[
          "w-full text-left rounded-xl border p-3 transition flex items-center gap-3",
          isActive ? "border-purple-500/50 bg-purple-500/10" : "border-white/10 bg-white/5 hover:bg-white/10",
        ].join(" ")}
      >
        <Image src={card.logo} alt={card.name} width={40} height={40} className="rounded-lg" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-white/95 truncate">{card.name}</span>
            {isSaved && <span className="text-xs text-emerald-400">✓</span>}
          </div>
          <div className="text-xs text-white/50">{card.issuer} • {formatMoney(card.annualFee)}/yr</div>
        </div>
        <div className="text-right">
          <div className="text-emerald-400 font-semibold">{formatMoney(card.creditsTrackedAnnualized)}</div>
          <div className="text-xs text-white/40">/year</div>
        </div>
      </button>
    );
  };

  // Card list with empty state - Grouped by tiers
  const CardListContent = cardsByTier.total === 0 ? (
    <div className="text-center py-12">
      <div className="text-4xl mb-3">🔍</div>
      <div className="text-white/70 font-medium">No cards match your filters</div>
      <div className="text-white/50 text-sm mt-1">Try adjusting your search or fee range</div>
    </div>
  ) : (
    <div className="space-y-4">
      {/* Premium Tier ($500+) */}
      {cardsByTier.premium.cards.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold text-purple-400">{cardsByTier.premium.label}</span>
            <div className="flex-1 h-px bg-purple-500/20" />
            <span className="text-xs text-white/40">{cardsByTier.premium.cards.length}</span>
          </div>
          <div className="space-y-2">
            {cardsByTier.premium.cards.map(renderCardButton)}
          </div>
        </div>
      )}
      
      {/* Mid Tier ($250-$499) */}
      {cardsByTier.mid.cards.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold text-amber-400">{cardsByTier.mid.label}</span>
            <div className="flex-1 h-px bg-amber-500/20" />
            <span className="text-xs text-white/40">{cardsByTier.mid.cards.length}</span>
          </div>
          <div className="space-y-2">
            {cardsByTier.mid.cards.map(renderCardButton)}
          </div>
        </div>
      )}
      
      {/* Entry Tier ($0-$249) */}
      {cardsByTier.entry.cards.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold text-emerald-400">{cardsByTier.entry.label}</span>
            <div className="flex-1 h-px bg-emerald-500/20" />
            <span className="text-xs text-white/40">{cardsByTier.entry.cards.length}</span>
          </div>
          <div className="space-y-2">
            {cardsByTier.entry.cards.map(renderCardButton)}
          </div>
        </div>
      )}
    </div>
  );

  // Left Panel - Card List
  const LeftPanel = (
    <div className={surfaceCardClass("p-4 h-fit")}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white/95">Cards</h2>
        <span className="text-xs text-white/50">{cardsByTier.total} cards</span>
      </div>
      
      <input
        type="text"
        placeholder="Search cards..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/50 mb-4"
      />
      
      <div className="flex items-center gap-2 mb-4 text-xs">
        <span className="text-white/50">Fee:</span>
        <select
          value={feeMin}
          onChange={(e) => setFeeMin(Number(e.target.value))}
          className="rounded bg-white/10 border border-white/10 px-2 py-1 text-white"
        >
          <option value={0}>$0</option>
          <option value={95}>$95</option>
          <option value={250}>$250</option>
          <option value={550}>$550</option>
        </select>
        <span className="text-white/40">–</span>
        <select
          value={feeMax}
          onChange={(e) => setFeeMax(Number(e.target.value))}
          className="rounded bg-white/10 border border-white/10 px-2 py-1 text-white"
        >
          <option value={250}>$250</option>
          <option value={550}>$550</option>
          <option value={695}>$695</option>
          <option value={895}>$895</option>
          <option value={2500}>$2500+</option>
        </select>
      </div>
      
      <div className="max-h-[500px] overflow-y-auto -mx-4 px-4">
        {isLoading ? (
          <div className="space-y-2">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        ) : CardListContent}
      </div>
    </div>
  );

  // Middle Panel - Credits
  const MiddlePanel = (
    <div className={surfaceCardClass("p-4")}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Image src={activeCard.logo} alt={activeCard.name} width={44} height={44} className="rounded-xl" />
          <div>
            <h2 className="text-lg font-semibold text-white/95">{activeCard.name}</h2>
            <div className="text-xs text-white/50">{activeCard.issuer} • {formatMoney(activeCard.annualFee)}/yr</div>
          </div>
        </div>
        <button
          onClick={() => toggleSaveCard(activeCard.key)}
          className={[
            "rounded-lg px-3 py-2 text-sm font-medium transition",
            savedCards.includes(activeCard.key)
              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30"
              : "bg-white/10 text-white/70 border border-white/10 hover:bg-white/15",
          ].join(" ")}
        >
          {savedCards.includes(activeCard.key) ? "✓ Saved" : "+ Save Card"}
        </button>
      </div>

      {/* Credits list - Grouped by frequency */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-2">
            {[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
          </div>
        ) : activeCard.credits.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-3xl mb-2">📭</div>
            <div className="text-white/60">No credits for this card</div>
          </div>
        ) : (
          frequencyOrder.map((freq) => {
            const credits = creditsGrouped[freq];
            if (credits.length === 0) return null;
            
            return (
              <div key={freq}>
                {/* Section header */}
                <div className="flex items-center gap-2 mb-2 mt-4 first:mt-0">
                  <h3 className="text-sm font-semibold text-white/70">{frequencyLabels[freq]}</h3>
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-xs text-white/40">{credits.length}</span>
                </div>
                
                {/* Credits in this tier */}
                <div className="space-y-2">
                  {credits.map((c) => {
                    const baseKey = `${activeCard.key}::${c.id}`;
                    const isDontCare = !!dontCare[baseKey];
                    const daysLeft = getDaysUntilReset(c.frequency);
                    const periods = getPeriodsForFrequency(c.frequency);
                    const usedCount = countUsedPeriods(activeCard.key, c.id, c.frequency, used);
                    const allUsed = usedCount === periods.length && periods.length > 0;
                    
                    return (
                      <div
                        key={c.id}
                        className={[
                          "rounded-xl border p-4 transition",
                          allUsed ? "border-emerald-400/30 bg-emerald-500/10" :
                          isDontCare ? "border-white/5 bg-white/[0.02] opacity-50" :
                          "border-white/10 bg-white/5",
                        ].join(" ")}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-white/95">{c.title}</span>
                              {daysLeft <= 7 && usedCount < periods.length && !isDontCare && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-300">
                                  {daysLeft}d left
                                </span>
                              )}
                            </div>
                            {c.notes && <div className="text-xs text-white/40 mt-1">{c.notes}</div>}
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-emerald-400">{formatMoney(c.amount)}</div>
                            <div className="text-xs text-white/40">
                              {usedCount}/{periods.length} used
                            </div>
                          </div>
                        </div>
                        
                        {/* Period checkboxes */}
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {periods.map((period) => {
                            const periodKey = getPeriodStateKey(activeCard.key, c.id, period.key);
                            const isUsed = !!used[periodKey];
                            
                            return (
                              <button
                                key={period.key}
                                onClick={() => toggleUsed(periodKey)}
                                disabled={isDontCare}
                                className={[
                                  "min-w-[32px] px-2 py-1.5 rounded-lg text-xs font-medium transition",
                                  isUsed 
                                    ? "bg-emerald-500/30 text-emerald-200 border border-emerald-400/30" 
                                    : "bg-white/10 text-white/60 border border-white/10 hover:bg-white/15",
                                  isDontCare ? "opacity-50 cursor-not-allowed" : "",
                                ].join(" ")}
                                title={`${period.label} - ${isUsed ? 'Used' : 'Not used'}`}
                              >
                                {period.label}
                              </button>
                            );
                          })}
                        </div>
                        
                        {/* Skip button */}
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-white/40">
                            {allUsed ? '✓ All periods used' : `${formatMoney(usedCount * c.amount)} redeemed`}
                          </div>
                          <button
                            onClick={() => toggleDontCare(baseKey)}
                            className={[
                              "px-3 py-1.5 rounded-lg text-xs transition",
                              isDontCare ? "bg-white/20 text-white/70" : "bg-white/5 text-white/40 hover:bg-white/10",
                            ].join(" ")}
                          >
                            {isDontCare ? "Skipped" : "Skip credit"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  // Right Panel - Insights
  const RightPanel = (
    <div className="space-y-4">
      {MySavingsWidget}
      {EarningCategoriesWidget}
      {FeeDefenseWidget}
      
      {/* Partner Offers */}
      <div className={surfaceCardClass("p-5")}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-white/95">Partner Offers</h3>
          <button
            onClick={() => setOfferModalOpen(true)}
            className="text-xs text-purple-400 hover:text-purple-300"
          >
            + Add
          </button>
        </div>
        
        {partnerOffers.length === 0 ? (
          <div className="text-center py-4">
            <div className="text-2xl mb-2">🎁</div>
            <div className="text-sm text-white/50">No offers tracked yet</div>
            <button
              onClick={() => setOfferModalOpen(true)}
              className="mt-2 text-xs text-purple-400 hover:text-purple-300"
            >
              Add your first offer
            </button>
          </div>
        ) : (
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {partnerOffers.slice(0, isPro ? undefined : 5).map((offer) => {
              const card = CARDS.find(c => c.key === offer.cardKey);
              const daysLeft = Math.ceil((new Date(offer.expiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
              return (
                <div key={offer.id} className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-white/90">{offer.merchant}</span>
                    <span className="text-emerald-400 font-semibold">
                      {offer.isPercent ? `${offer.amount}%` : formatMoney(offer.amount)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1 text-xs text-white/50">
                    <span>{card?.name || 'Unknown card'}</span>
                    <span className={daysLeft <= 7 ? 'text-red-400' : ''}>{daysLeft}d left</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {!isPro && partnerOffers.length >= 5 && (
          <button
            onClick={() => setUpgradeModalOpen(true)}
            className="mt-3 w-full text-xs text-purple-400 hover:text-purple-300"
          >
            Upgrade for unlimited offers →
          </button>
        )}
      </div>
      
      {/* Quick Actions */}
      <div className={surfaceCardClass("p-5")}>
        <h3 className="text-base font-semibold text-white/95 mb-4">Quick Actions</h3>
        <div className="space-y-2">
          <button
            onClick={() => { setQuizOpen(true); resetQuiz(); }}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-purple-500/10 border border-purple-400/20 text-left hover:bg-purple-500/20 transition"
          >
            <IconSparkles className="h-5 w-5 text-purple-400" />
            <span className="text-sm text-white/90">Find My Perfect Card</span>
          </button>
          <button
            onClick={() => setActiveTab('compare')}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 text-left hover:bg-white/10 transition"
          >
            <span className="text-lg">⚖️</span>
            <span className="text-sm text-white/70">Compare Cards</span>
          </button>
          <button
            onClick={exportCSV}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 text-left hover:bg-white/10 transition"
          >
            <span className="text-lg">📥</span>
            <span className="text-sm text-white/70">Export CSV {!isPro && <span className="text-purple-400 text-xs">PRO</span>}</span>
          </button>
        </div>
      </div>
    </div>
  );

  // Compare Tab Content
  const CompareTabContent = (
    <div className={surfaceCardClass("p-6")}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white/95">Card Comparison</h2>
        <div className="text-xs text-white/50">
          {isPro ? 'Compare up to 3 cards' : 'Free: 2 cards'} • {compareCards.length} selected
        </div>
      </div>
      
      {/* Card selector */}
      <div className="flex flex-wrap gap-2 mb-6">
        {CARDS.map((card) => {
          const isSelected = compareCards.includes(card.key);
          const maxCards = isPro ? 3 : 2;
          return (
            <button
              key={card.key}
              onClick={() => {
                if (isSelected) {
                  setCompareCards(prev => prev.filter(k => k !== card.key));
                } else if (compareCards.length < maxCards) {
                  setCompareCards(prev => [...prev, card.key]);
                } else if (!isPro) {
                  setUpgradeModalOpen(true);
                }
              }}
              className={[
                "px-3 py-2 rounded-lg text-sm transition",
                isSelected ? "bg-purple-500/20 border-purple-400/30 text-purple-200" : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10",
                "border"
              ].join(" ")}
            >
              {card.name}
            </button>
          );
        })}
      </div>
      
      {compareCards.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">⚖️</div>
          <div className="text-white/70">Select cards to compare</div>
          <div className="text-white/50 text-sm mt-1">Click on card names above to add them</div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 text-sm text-white/50 font-medium">Feature</th>
                {compareCards.map((key) => {
                  const card = CARDS.find(c => c.key === key)!;
                  return (
                    <th key={key} className="text-center py-3">
                      <Image src={card.logo} alt={card.name} width={32} height={32} className="rounded-lg mx-auto mb-1" />
                      <div className="text-sm text-white/90 font-medium">{card.name}</div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-white/5">
                <td className="py-3 text-sm text-white/70">Annual Fee</td>
                {compareCards.map((key) => {
                  const card = CARDS.find(c => c.key === key)!;
                  return <td key={key} className="text-center py-3 text-white/90 font-medium">{formatMoney(card.annualFee)}</td>;
                })}
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-3 text-sm text-white/70">Credit Value</td>
                {compareCards.map((key) => {
                  const card = CARDS.find(c => c.key === key)!;
                  return <td key={key} className="text-center py-3 text-emerald-400 font-medium">{formatMoney(card.creditsTrackedAnnualized)}</td>;
                })}
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-3 text-sm text-white/70">Net Value</td>
                {compareCards.map((key) => {
                  const card = CARDS.find(c => c.key === key)!;
                  const net = card.creditsTrackedAnnualized - card.annualFee;
                  return (
                    <td key={key} className={`text-center py-3 font-medium ${net >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {net >= 0 ? '+' : ''}{formatMoney(net)}
                    </td>
                  );
                })}
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-3 text-sm text-white/70">Points Program</td>
                {compareCards.map((key) => {
                  const card = CARDS.find(c => c.key === key)!;
                  return <td key={key} className="text-center py-3 text-white/70 text-sm">{card.pointsProgram.replace('_', ' ').toUpperCase()}</td>;
                })}
              </tr>
              <tr>
                <td className="py-3 text-sm text-white/70"># Credits</td>
                {compareCards.map((key) => {
                  const card = CARDS.find(c => c.key === key)!;
                  return <td key={key} className="text-center py-3 text-white/70">{card.credits.length}</td>;
                })}
              </tr>
            </tbody>
          </table>
        </div>
      )}
      
      {isPro && compareCards.length > 0 && (
        <button
          onClick={() => {
            let csv = "Feature," + compareCards.map(k => CARDS.find(c => c.key === k)!.name).join(",") + "\n";
            csv += "Annual Fee," + compareCards.map(k => CARDS.find(c => c.key === k)!.annualFee).join(",") + "\n";
            csv += "Credit Value," + compareCards.map(k => CARDS.find(c => c.key === k)!.creditsTrackedAnnualized).join(",") + "\n";
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'card-comparison.csv';
            a.click();
            showToast("Comparison exported ✓");
          }}
          className="mt-4 text-sm text-purple-400 hover:text-purple-300"
        >
          Export comparison →
        </button>
      )}
    </div>
  );

  // Learn Tab Content
  const LearnTabContent = (
    <div className={surfaceCardClass("p-6")}>
      <h2 className="text-xl font-bold text-white/95 mb-6">Learn</h2>
      
      <div className="grid gap-4 md:grid-cols-2">
        {/* Card Reviews */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <div className="text-2xl mb-3">📝</div>
          <h3 className="text-base font-semibold text-white/95 mb-2">Card Reviews</h3>
          <p className="text-sm text-white/60 mb-4">In-depth analysis of each premium card's value proposition.</p>
          <div className="space-y-2">
            {['Amex Platinum Review', 'CSR vs Venture X', 'Amex Gold Deep Dive'].map((title, i) => (
              <button key={i} className="w-full text-left p-3 rounded-lg bg-white/5 text-sm text-white/70 hover:bg-white/10 transition">
                {title}
                {!isPro && i > 0 && <span className="text-purple-400 text-xs ml-2">PRO</span>}
              </button>
            ))}
          </div>
        </div>
        
        {/* Strategy Guides */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <div className="text-2xl mb-3">🎯</div>
          <h3 className="text-base font-semibold text-white/95 mb-2">Strategy Guides</h3>
          <p className="text-sm text-white/60 mb-4">Maximize your rewards with proven strategies.</p>
          <div className="space-y-2">
            {['Amex Trifecta Guide', 'Chase Trifecta Guide', 'Credit Stacking 101'].map((title, i) => (
              <button key={i} className="w-full text-left p-3 rounded-lg bg-white/5 text-sm text-white/70 hover:bg-white/10 transition">
                {title}
                {!isPro && <span className="text-purple-400 text-xs ml-2">PRO</span>}
              </button>
            ))}
          </div>
        </div>
        
        {/* Card Playbooks */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <div className="text-2xl mb-3">📚</div>
          <h3 className="text-base font-semibold text-white/95 mb-2">Card Playbooks</h3>
          <p className="text-sm text-white/60 mb-4">Step-by-step guides for each card.</p>
          <div className="space-y-2">
            {['First 30 Days', 'Monthly Routine', 'Annual Routine'].map((title, i) => (
              <button key={i} className="w-full text-left p-3 rounded-lg bg-white/5 text-sm text-white/70 hover:bg-white/10 transition flex items-center justify-between">
                <span>{title}</span>
                {isPro ? (
                  <span className="text-xs text-white/40">✓ Checklist</span>
                ) : (
                  <span className="text-purple-400 text-xs">PRO</span>
                )}
              </button>
            ))}
          </div>
        </div>
        
        {/* Redemption Guides */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <div className="text-2xl mb-3">💰</div>
          <h3 className="text-base font-semibold text-white/95 mb-2">Redemption Guides</h3>
          <p className="text-sm text-white/60 mb-4">Get the most value from your points.</p>
          <div className="space-y-2">
            {['Transfer Partners 101', 'Best Redemptions 2026', 'Sweet Spots Guide'].map((title, i) => (
              <button key={i} className="w-full text-left p-3 rounded-lg bg-white/5 text-sm text-white/70 hover:bg-white/10 transition">
                {title}
                {!isPro && i > 0 && <span className="text-purple-400 text-xs ml-2">PRO</span>}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {!isPro && (
        <div className="mt-6 p-4 rounded-xl bg-purple-500/10 border border-purple-400/20 text-center">
          <p className="text-sm text-white/70 mb-3">Unlock all guides, playbooks, and checklists</p>
          <button onClick={() => setUpgradeModalOpen(true)} className="px-4 py-2 rounded-lg bg-purple-500 text-white text-sm font-medium hover:bg-purple-400 transition">
            Upgrade to Pro — $9.99
          </button>
        </div>
      )}
    </div>
  );

  // Settings Tab Content
  const SettingsTabContent = (
    <div className={surfaceCardClass("p-6")}>
      <h2 className="text-xl font-bold text-white/95 mb-6">Settings</h2>
      
      <div className="space-y-6 max-w-lg">
        <div>
          <label className="block text-sm text-white/70 mb-2">Display Name</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Your name"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/50"
          />
        </div>
        
        <div>
          <label className="block text-sm text-white/70 mb-2">Phone (for SMS reminders)</label>
          <input
            type="tel"
            value={phoneE164}
            onChange={(e) => setPhoneE164(e.target.value)}
            placeholder="+1 (555) 123-4567"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/50"
          />
        </div>
        
        <div className="space-y-3">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={notifEmailEnabled}
              onChange={(e) => setNotifEmailEnabled(e.target.checked)}
              className="w-5 h-5 rounded border-white/20 bg-white/10"
            />
            <span className="text-sm text-white/90">Email reminders</span>
          </label>
          
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={notifSmsEnabled}
              onChange={(e) => setNotifSmsEnabled(e.target.checked)}
              className="w-5 h-5 rounded border-white/20 bg-white/10"
            />
            <span className="text-sm text-white/90">SMS reminders</span>
          </label>
          
          {notifSmsEnabled && (
            <label className="flex items-center gap-3 ml-8">
              <input
                type="checkbox"
                checked={smsConsent}
                onChange={(e) => setSmsConsent(e.target.checked)}
                className="w-5 h-5 rounded border-white/20 bg-white/10"
              />
              <span className="text-xs text-white/60">I consent to receive SMS messages. Msg & data rates may apply.</span>
            </label>
          )}
        </div>
        
        <div>
          <label className="block text-sm text-white/70 mb-3">Reminder timing (days before expiry)</label>
          <div className="flex flex-wrap gap-2">
            {[1, 3, 5, 7, 10, 14].map((d) => {
              const isActive = offsetsDays.includes(d);
              const isCustom = d > 7;
              return (
                <button
                  key={d}
                  onClick={() => {
                    if (isCustom && !isPro) {
                      setUpgradeModalOpen(true);
                      return;
                    }
                    if (isActive) {
                      setOffsetsDays(prev => prev.filter(x => x !== d));
                    } else {
                      setOffsetsDays(prev => [...prev, d].sort((a, b) => b - a));
                    }
                  }}
                  className={[
                    "px-3 py-2 rounded-lg text-sm transition",
                    isActive ? "bg-purple-500/20 border-purple-400/30 text-purple-200" : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10",
                    "border",
                  ].join(" ")}
                >
                  {d}d {isCustom && !isPro && <span className="text-purple-400 text-xs">PRO</span>}
                </button>
              );
            })}
          </div>
        </div>
        
        <button
          onClick={saveProfile}
          disabled={profileLoading}
          className="w-full rounded-xl bg-purple-500 px-6 py-3 text-white font-semibold hover:bg-purple-400 transition disabled:opacity-50"
        >
          {profileLoading ? 'Saving...' : 'Save Settings'}
        </button>
        
        {profileMsg && (
          <p className={`text-sm ${profileMsg.includes('Failed') ? 'text-red-400' : 'text-emerald-400'}`}>
            {profileMsg}
          </p>
        )}
        
        {/* Referral Links - Pro Feature */}
        <div className="pt-6 border-t border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium text-white/90">My Referral Links</h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">PRO</span>
            </div>
            {isPro && (
              <span className="text-xs text-white/40">{referralLinks.length} links</span>
            )}
          </div>
          
          {!isPro ? (
            <div className="text-center py-6 rounded-xl bg-white/5 border border-white/10">
              <div className="text-2xl mb-2">🔗</div>
              <div className="text-sm text-white/70 mb-3">Store & share your referral links</div>
              <button
                onClick={() => setUpgradeModalOpen(true)}
                className="text-sm text-purple-400 hover:text-purple-300"
              >
                Upgrade to Pro →
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Add new referral form */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                <select
                  value={newReferral.cardKey || ''}
                  onChange={(e) => setNewReferral(prev => ({ ...prev, cardKey: e.target.value }))}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500/50"
                >
                  <option value="">Select card...</option>
                  {CARDS.map(c => (
                    <option key={c.key} value={c.key}>{c.name}</option>
                  ))}
                </select>
                
                <input
                  type="url"
                  value={newReferral.url || ''}
                  onChange={(e) => setNewReferral(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="Referral URL (e.g., https://amex.co/refer/...)"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/50"
                />
                
                <input
                  type="text"
                  value={newReferral.bonus || ''}
                  onChange={(e) => setNewReferral(prev => ({ ...prev, bonus: e.target.value }))}
                  placeholder="Referral bonus (e.g., 30,000 MR)"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/50"
                />
                
                <button
                  onClick={() => {
                    if (newReferral.cardKey && newReferral.url && newReferral.bonus) {
                      const newLink: ReferralLink = {
                        id: `ref-${Date.now()}`,
                        cardKey: newReferral.cardKey,
                        url: newReferral.url,
                        bonus: newReferral.bonus,
                      };
                      setReferralLinks(prev => [...prev, newLink]);
                      setNewReferral({});
                      showToast('Referral link saved ✓');
                    }
                  }}
                  disabled={!newReferral.cardKey || !newReferral.url || !newReferral.bonus}
                  className="w-full rounded-lg bg-purple-500 px-4 py-2 text-sm text-white font-medium hover:bg-purple-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  + Add Referral Link
                </button>
              </div>
              
              {/* Existing referral links */}
              {referralLinks.length > 0 && (
                <div className="space-y-2">
                  {referralLinks.map((ref) => {
                    const card = CARDS.find(c => c.key === ref.cardKey);
                    return (
                      <div key={ref.id} className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3">
                        {card && (
                          <Image src={card.logo} alt={card.name} width={32} height={32} className="rounded-lg" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-white/90 truncate">{card?.name || 'Unknown'}</div>
                          <div className="text-xs text-emerald-400">Earn: {ref.bonus}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(ref.url);
                              showToast('Link copied! 📋');
                            }}
                            className="px-3 py-1.5 rounded-lg bg-white/10 text-xs text-white/70 hover:bg-white/15 transition"
                          >
                            📋 Copy
                          </button>
                          <button
                            onClick={() => setReferralLinks(prev => prev.filter(r => r.id !== ref.id))}
                            className="px-2 py-1.5 rounded-lg bg-red-500/10 text-xs text-red-400 hover:bg-red-500/20 transition"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              
              {referralLinks.length === 0 && (
                <div className="text-center py-4 text-sm text-white/50">
                  No referral links yet. Add your first one above!
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Pro Status */}
        <div className="pt-6 border-t border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-white/90">Current Plan</div>
              <div className="text-xs text-white/50">{isPro ? 'Pro Lifetime' : 'Free'}</div>
            </div>
            {!isPro && (
              <button
                onClick={() => setUpgradeModalOpen(true)}
                className="px-4 py-2 rounded-lg bg-purple-500 text-white text-sm font-medium hover:bg-purple-400 transition"
              >
                Upgrade — $9.99
              </button>
            )}
            {isPro && (
              <div className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-400/30 px-3 py-1.5 text-xs font-semibold text-amber-200">
                <span>✨</span>
                <span>PRO</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Top bar
  const TopBar = (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        <Image 
          src="/logos/clawback-mark.png" 
          alt="ClawBack" 
          width={64} 
          height={64} 
          className="rounded-xl shadow-lg shadow-purple-500/30 ring-2 ring-white/10" 
        />
        <div>
          <h1 className="text-xl font-bold text-white/95">ClawBack</h1>
          {user && <div className="text-xs text-white/50">Welcome{displayName ? `, ${displayName}` : ''}</div>}
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <button
          onClick={() => { setQuizOpen(true); resetQuiz(); }}
          className="flex items-center gap-1.5 rounded-full border border-purple-400/20 bg-purple-500/10 px-3 py-2 text-sm text-purple-100 hover:bg-purple-500/20 transition"
        >
          <IconSparkles className="h-4 w-4" />
          <span className="hidden sm:inline">Find My Card</span>
        </button>
        
        {user ? (
          <>
            {isPro && (
              <div className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-400/30 px-3 py-1.5 text-xs font-semibold text-amber-200 shadow-[0_0_12px_rgba(251,191,36,0.15)]">
                <span>✨</span>
                <span>PRO</span>
              </div>
            )}
            <button
              onClick={() => setActiveTab('settings')}
              className="rounded-full border border-white/10 bg-white/5 p-2 text-white/70 hover:bg-white/10"
              aria-label="Settings"
            >
              <IconGear className="h-5 w-5" />
            </button>
            <button onClick={handleSignOut} className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70 hover:bg-white/10">
              Sign out
            </button>
          </>
        ) : (
          <>
            <button onClick={() => { setAuthModalOpen(true); setAuthMode("signin"); }} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10">
              Sign in
            </button>
            <button onClick={() => { setAuthModalOpen(true); setAuthMode("signup"); }} className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-white/90">
              Sign up
            </button>
          </>
        )}
      </div>
    </div>
  );

  // Tabs
  const TabBar = (
    <div className="flex gap-1 p-1 rounded-xl bg-white/5 border border-white/10 mb-6 w-fit">
      {[
        { key: 'dashboard', label: 'Dashboard' },
        { key: 'compare', label: 'Compare' },
        { key: 'learn', label: 'Learn' },
        { key: 'settings', label: 'Settings' },
      ].map((tab) => (
        <button
          key={tab.key}
          onClick={() => setActiveTab(tab.key as typeof activeTab)}
          className={[
            "px-4 py-2 rounded-lg text-sm font-medium transition",
            activeTab === tab.key ? "bg-white/10 text-white" : "text-white/50 hover:text-white/70",
          ].join(" ")}
        >
          {tab.label}
        </button>
      ))}
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
            {authMode === "signin" ? "Sign in to access your saved cards" : authMode === "signup" ? "Start tracking your credits today" : "We'll send you a reset link"}
          </div>
          
          {/* Trust copy */}
          <div className="mt-4 flex items-center gap-2 text-xs text-white/40">
            <svg className="h-4 w-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>No bank logins. No SSN. Ever.</span>
          </div>

          <form onSubmit={handleAuthSubmit} className="mt-6 space-y-4">
            {authMode === "signup" && (
              <input
                type="text"
                placeholder="Your name"
                value={authName}
                onChange={(e) => setAuthName(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/50"
              />
            )}
            {authMode !== "reset" ? (
              <>
                <input
                  type="email"
                  placeholder="Email"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  required
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/50"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  required
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/50"
                />
              </>
            ) : (
              <input
                type="email"
                placeholder="Email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                required
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/50"
              />
            )}

            {authMsg && <p className="text-sm text-amber-400">{authMsg}</p>}
            {resetMsg && <p className="text-sm text-amber-400">{resetMsg}</p>}

            <button
              type="submit"
              disabled={authBusy}
              className="w-full rounded-xl bg-purple-500 px-6 py-3 text-white font-semibold hover:bg-purple-400 transition disabled:opacity-50"
            >
              {authBusy ? "Please wait..." : authMode === "signin" ? "Sign in" : authMode === "signup" ? "Create account" : "Send reset link"}
            </button>
          </form>

          <div className="mt-4 flex justify-between text-sm">
            {authMode === "signin" && (
              <>
                <button onClick={() => setAuthMode("signup")} className="text-purple-400 hover:text-purple-300">Create account</button>
                <button onClick={() => setAuthMode("reset")} className="text-white/50 hover:text-white/70">Forgot password?</button>
              </>
            )}
            {authMode === "signup" && (
              <button onClick={() => setAuthMode("signin")} className="text-purple-400 hover:text-purple-300">Already have an account?</button>
            )}
            {authMode === "reset" && (
              <button onClick={() => setAuthMode("signin")} className="text-purple-400 hover:text-purple-300">Back to sign in</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Settings Modal (fallback)
  const SettingsModal = !settingsOpen ? null : (
    <div className="fixed inset-0 z-50">
      <button className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSettingsOpen(false)} aria-label="Close" />
      <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2 max-h-[90vh] overflow-y-auto">
        {SettingsTabContent}
      </div>
    </div>
  );

  // Partner Offer Modal
  const OfferModal = !offerModalOpen ? null : (
    <div className="fixed inset-0 z-50">
      <button className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOfferModalOpen(false)} aria-label="Close" />
      <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2">
        <div className={surfaceCardClass("p-6")}>
          <h2 className="text-xl font-semibold text-white/95 mb-4">Add Partner Offer</h2>
          
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Merchant (e.g. Whole Foods)"
              value={newOffer.merchant || ''}
              onChange={(e) => setNewOffer(prev => ({ ...prev, merchant: e.target.value }))}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/50"
            />
            
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Amount"
                value={newOffer.amount || ''}
                onChange={(e) => setNewOffer(prev => ({ ...prev, amount: Number(e.target.value) }))}
                className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/50"
              />
              <button
                onClick={() => setNewOffer(prev => ({ ...prev, isPercent: !prev.isPercent }))}
                className={`px-4 py-3 rounded-lg border ${newOffer.isPercent ? 'border-purple-400/30 bg-purple-500/20' : 'border-white/10 bg-white/5'} text-white/70`}
              >
                {newOffer.isPercent ? '%' : '$'}
              </button>
            </div>
            
            <input
              type="date"
              value={newOffer.expiry || ''}
              onChange={(e) => setNewOffer(prev => ({ ...prev, expiry: e.target.value }))}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white focus:outline-none focus:border-purple-500/50"
            />
            
            <select
              value={newOffer.cardKey || ''}
              onChange={(e) => setNewOffer(prev => ({ ...prev, cardKey: e.target.value }))}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white focus:outline-none focus:border-purple-500/50"
            >
              <option value="">Select card</option>
              {CARDS.map((card) => (
                <option key={card.key} value={card.key}>{card.name}</option>
              ))}
            </select>
            
            <button
              onClick={addPartnerOffer}
              className="w-full rounded-xl bg-purple-500 px-6 py-3 text-white font-semibold hover:bg-purple-400 transition"
            >
              Add Offer
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Quiz Modal
  const QuizModal = !quizOpen ? null : (
    <div className="fixed inset-0 z-50">
      <button className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setQuizOpen(false)} aria-label="Close" />
      <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-lg -translate-x-1/2 -translate-y-1/2 max-h-[90vh] overflow-y-auto">
        <div className={surfaceCardClass("p-6")}>
          {quizStep === 'intro' && (
            <>
              <div className="text-center mb-6">
                <div className="text-4xl mb-3">💳</div>
                <h2 className="text-2xl font-bold text-white/95">Find Your Perfect Card</h2>
                <p className="text-white/60 mt-2">Answer 7 quick questions to get personalized recommendations</p>
              </div>
              <button
                onClick={() => setQuizStep('q1_dining')}
                className="w-full rounded-xl bg-purple-500 px-6 py-4 text-white font-semibold hover:bg-purple-400 transition"
              >
                Start Quiz
              </button>
              <button onClick={() => setQuizOpen(false)} className="w-full mt-3 rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm text-white/70 hover:bg-white/10 transition">
                Maybe later
              </button>
            </>
          )}
          
          {quizStep === 'q1_dining' && (
            <>
              <div className="text-sm text-purple-400 mb-2">Question 1 of 7</div>
              <h3 className="text-lg font-semibold text-white/95 mb-4">How much do you spend on dining per month?</h3>
              <div className="space-y-2">
                {[
                  { label: '$0 - $100', value: 50 },
                  { label: '$100 - $300', value: 200 },
                  { label: '$300 - $600', value: 450 },
                  { label: '$600+', value: 800 },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => { setQDining(opt.value); setQuizStep('q2_travel'); }}
                    className={`w-full text-left p-4 rounded-xl border ${qDining === opt.value ? 'border-purple-400/50 bg-purple-500/10' : 'border-white/10 bg-white/5 hover:bg-white/10'} transition`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </>
          )}
          
          {quizStep === 'q2_travel' && (
            <>
              <div className="text-sm text-purple-400 mb-2">Question 2 of 7</div>
              <h3 className="text-lg font-semibold text-white/95 mb-4">How much do you spend on travel per month?</h3>
              <div className="space-y-2">
                {[
                  { label: '$0 - $100', value: 50 },
                  { label: '$100 - $300', value: 200 },
                  { label: '$300 - $700', value: 500 },
                  { label: '$700+', value: 1000 },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => { setQTravel(opt.value); setQuizStep('q3_travelfreq'); }}
                    className={`w-full text-left p-4 rounded-xl border ${qTravel === opt.value ? 'border-purple-400/50 bg-purple-500/10' : 'border-white/10 bg-white/5 hover:bg-white/10'} transition`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <button onClick={() => setQuizStep('q1_dining')} className="mt-4 text-sm text-white/50 hover:text-white/70">← Back</button>
            </>
          )}
          
          {quizStep === 'q3_travelfreq' && (
            <>
              <div className="text-sm text-purple-400 mb-2">Question 3 of 7</div>
              <h3 className="text-lg font-semibold text-white/95 mb-4">How many trips do you take per year?</h3>
              <div className="space-y-2">
                {['0-1', '2-4', '5-10', '10+'].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => { setQTravelFreq(opt); setQuizStep('q4_fee'); }}
                    className={`w-full text-left p-4 rounded-xl border ${qTravelFreq === opt ? 'border-purple-400/50 bg-purple-500/10' : 'border-white/10 bg-white/5 hover:bg-white/10'} transition`}
                  >
                    {opt} trips
                  </button>
                ))}
              </div>
              <button onClick={() => setQuizStep('q2_travel')} className="mt-4 text-sm text-white/50 hover:text-white/70">← Back</button>
            </>
          )}
          
          {quizStep === 'q4_fee' && (
            <>
              <div className="text-sm text-purple-400 mb-2">Question 4 of 7</div>
              <h3 className="text-lg font-semibold text-white/95 mb-4">What's your annual fee tolerance?</h3>
              <div className="space-y-2">
                {[
                  { label: '$0 - $250', value: '0-250' },
                  { label: '$250 - $500', value: '250-500' },
                  { label: '$500+', value: '500+' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => { setQFeeTolerance(opt.value); setQuizStep('q5_delivery'); }}
                    className={`w-full text-left p-4 rounded-xl border ${qFeeTolerance === opt.value ? 'border-purple-400/50 bg-purple-500/10' : 'border-white/10 bg-white/5 hover:bg-white/10'} transition`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <button onClick={() => setQuizStep('q3_travelfreq')} className="mt-4 text-sm text-white/50 hover:text-white/70">← Back</button>
            </>
          )}
          
          {quizStep === 'q5_delivery' && (
            <>
              <div className="text-sm text-purple-400 mb-2">Question 5 of 7</div>
              <h3 className="text-lg font-semibold text-white/95 mb-4">Do you use delivery apps? (Uber Eats, DoorDash, Instacart)</h3>
              <div className="space-y-2">
                {[
                  { label: 'Yes, regularly', value: true },
                  { label: 'Not really', value: false },
                ].map((opt) => (
                  <button
                    key={String(opt.value)}
                    onClick={() => { setQUsesDelivery(opt.value); setQuizStep('q6_optimize'); }}
                    className={`w-full text-left p-4 rounded-xl border ${qUsesDelivery === opt.value ? 'border-purple-400/50 bg-purple-500/10' : 'border-white/10 bg-white/5 hover:bg-white/10'} transition`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <button onClick={() => setQuizStep('q4_fee')} className="mt-4 text-sm text-white/50 hover:text-white/70">← Back</button>
            </>
          )}
          
          {quizStep === 'q6_optimize' && (
            <>
              <div className="text-sm text-purple-400 mb-2">Question 6 of 7</div>
              <h3 className="text-lg font-semibold text-white/95 mb-4">What's your optimization style?</h3>
              <div className="space-y-2">
                {[
                  { label: 'Keep it simple - one great card', value: 'simple' },
                  { label: 'Maximize rewards - willing to juggle cards', value: 'maximize' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => { setQOptimize(opt.value); setQuizStep('q7_brand'); }}
                    className={`w-full text-left p-4 rounded-xl border ${qOptimize === opt.value ? 'border-purple-400/50 bg-purple-500/10' : 'border-white/10 bg-white/5 hover:bg-white/10'} transition`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <button onClick={() => setQuizStep('q5_delivery')} className="mt-4 text-sm text-white/50 hover:text-white/70">← Back</button>
            </>
          )}
          
          {quizStep === 'q7_brand' && (
            <>
              <div className="text-sm text-purple-400 mb-2">Question 7 of 7</div>
              <h3 className="text-lg font-semibold text-white/95 mb-4">Any brand preference?</h3>
              <div className="space-y-2">
                {[
                  { label: 'No preference', value: 'any' },
                  { label: 'Prefer Chase', value: 'chase' },
                  { label: 'Prefer Amex', value: 'amex' },
                  { label: 'Prefer Capital One', value: 'cap1' },
                  { label: 'Prefer Citi', value: 'citi' },
                  { label: 'Avoid Amex (acceptance issues)', value: 'avoid-amex' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => { setQBrandPref(opt.value); setQuizStep('results'); }}
                    className={`w-full text-left p-4 rounded-xl border ${qBrandPref === opt.value ? 'border-purple-400/50 bg-purple-500/10' : 'border-white/10 bg-white/5 hover:bg-white/10'} transition`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <button onClick={() => setQuizStep('q6_optimize')} className="mt-4 text-sm text-white/50 hover:text-white/70">← Back</button>
            </>
          )}
          
          {quizStep === 'results' && (
            <>
              <div className="text-center mb-6">
                <div className="text-4xl mb-3">🎉</div>
                <h2 className="text-2xl font-bold text-white/95">Your Top Cards</h2>
                <p className="text-white/60 mt-2">Based on your spending and preferences</p>
              </div>
              
              <div className="space-y-4">
                {quizResults.map((r, i) => (
                  <div key={r.card.key} className={`p-4 rounded-xl border ${i === 0 ? 'border-purple-400/30 bg-purple-500/10' : 'border-white/10 bg-white/5'}`}>
                    <div className="flex items-center gap-3 mb-3">
                      <Image src={r.card.logo} alt={r.card.name} width={40} height={40} className="rounded-lg" />
                      <div className="flex-1">
                        <div className="font-semibold text-white/95">{r.card.name}</div>
                        <div className="text-xs text-white/50">{r.card.issuer}</div>
                      </div>
                      {i === 0 && <span className="text-xs px-2 py-1 rounded-full bg-purple-500/30 text-purple-200">Best Match</span>}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><span className="text-white/50">Annual Fee:</span> <span className="text-white/90">{formatMoney(r.card.annualFee)}</span></div>
                      <div><span className="text-white/50">Credits:</span> <span className="text-emerald-400">{formatMoney(r.card.creditsTrackedAnnualized)}/yr</span></div>
                    </div>
                    <button
                      onClick={() => { setActiveCardKey(r.card.key); setQuizOpen(false); }}
                      className="mt-3 w-full rounded-lg border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white/90 hover:bg-white/15 transition"
                    >
                      View Card Details
                    </button>
                  </div>
                ))}
              </div>
              
              <button onClick={() => resetQuiz()} className="mt-5 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70 hover:bg-white/10">
                Retake Quiz
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );

  // Upgrade Modal
  const UpgradeModal = !upgradeModalOpen ? null : (
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
              "Expiring Soon alerts",
              "Custom reminder schedule",
              "CSV export",
              "Card comparison (3 cards)",
              "Annual fee defense",
              "Unlimited partner offers",
              "Full Learn library",
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
            <button onClick={handleUpgrade} className="w-full rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 px-6 py-4 text-base font-semibold text-white hover:opacity-90 transition">
              Upgrade for $9.99
            </button>
            <button onClick={() => setUpgradeModalOpen(false)} className="w-full rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm text-white/70 hover:bg-white/10 transition">
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative min-h-screen overflow-hidden text-white">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[#070A12]" />
        <div className="absolute inset-0 bg-[radial-gradient(60%_40%_at_20%_20%,rgba(88,101,242,0.18),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(50%_40%_at_80%_30%,rgba(139,92,246,0.16),transparent_60%)]" />
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6">
        {TopBar}
        {TabBar}

        {/* Mobile view toggle */}
        <div className="flex gap-2 lg:hidden mb-4">
          {[
            { key: "cards", label: "Cards" },
            { key: "credits", label: "Credits" },
            { key: "insights", label: "Insights" },
          ].map((t) => (
            <button key={t.key} onClick={() => setMobileView(t.key as "cards" | "credits" | "insights")} className={["flex-1 rounded-full border px-3 py-2 text-sm font-semibold transition", mobileView === t.key ? "border-white/20 bg-white/10 text-white" : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"].join(" ")}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Main content based on tab */}
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className={["lg:block", mobileView === "cards" ? "block" : "hidden", "lg:col-span-4"].join(" ")}>{LeftPanel}</div>
            <div className={["lg:block", mobileView === "credits" ? "block" : "hidden", "lg:col-span-5"].join(" ")}>{MiddlePanel}</div>
            <div className={["lg:block", mobileView === "insights" ? "block" : "hidden", "lg:col-span-3"].join(" ")}>{RightPanel}</div>
          </div>
        )}
        
        {activeTab === 'compare' && CompareTabContent}
        {activeTab === 'learn' && LearnTabContent}
        {activeTab === 'settings' && SettingsTabContent}

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
      {UpgradeModal}
      {OfferModal}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-xl border border-emerald-400/30 bg-emerald-500/20 backdrop-blur px-5 py-3 text-sm text-emerald-100 shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
