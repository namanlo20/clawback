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
  type PointsProgram,
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
  is_pro: boolean | null;
  pro_activated_at: string | null; // timestamptz
  stripe_customer_id: string | null;
  stripe_checkout_session_id: string | null;
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
// CREDIT CALENDAR COMPONENT
// -----------------------------
function CreditCalendar({ 
  cards, 
  savedCards, 
  used,
  getPeriodsForFrequency,
  getPeriodStateKey,
  onCardSelect,
}: { 
  cards: Card[]; 
  savedCards: string[]; 
  used: Record<string, boolean>;
  getPeriodsForFrequency: (freq: CreditFrequency, year?: number) => { key: string; label: string; shortLabel: string }[];
  getPeriodStateKey: (cardKey: string, creditId: string, periodKey: string) => string;
  onCardSelect?: (cardKey: string) => void;
}) {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const [viewMonth, setViewMonth] = useState(currentMonth);
  const [viewYear, setViewYear] = useState(currentYear);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];
  
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  
  // Helper to get the period key for a specific month/frequency
  const getPeriodKeyForMonth = (freq: CreditFrequency, month: number, year: number): string | null => {
    switch (freq) {
      case 'monthly':
        return `${year}-${String(month + 1).padStart(2, '0')}`;
      case 'quarterly':
        // Q1: months 0,1,2 -> Q1, Q2: months 3,4,5 -> Q2, etc.
        const quarter = Math.floor(month / 3) + 1;
        return `${year}-Q${quarter}`;
      case 'semiannual':
        const half = month < 6 ? 1 : 2;
        return `${year}-H${half}`;
      case 'annual':
        return `${year}`;
      default:
        return null;
    }
  };
  
  // Get credits that reset at end of this month with color coding
  const creditResets = useMemo(() => {
    const resets: Array<{ day: number; credits: Array<{ card: Card; credit: Credit; color: string; isUsed: boolean; periodKey: string }> }> = [];
    
    for (let d = 1; d <= daysInMonth; d++) {
      resets.push({ day: d, credits: [] });
    }
    
    const cardsToCheck = savedCards.length > 0 
      ? cards.filter(c => savedCards.includes(c.key))
      : cards.slice(0, 3);
    
    const colors = ['#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'];
    
    cardsToCheck.forEach((card, cardIndex) => {
      const color = colors[cardIndex % colors.length];
      
      card.credits.forEach(credit => {
        let resetDay = 0;
        
        switch (credit.frequency) {
          case 'monthly':
            // Monthly credits reset at end of every month
            resetDay = daysInMonth;
            break;
          case 'quarterly':
            // Quarterly resets at end of Mar (2), Jun (5), Sep (8), Dec (11)
            if ([2, 5, 8, 11].includes(viewMonth)) {
              resetDay = daysInMonth;
            }
            break;
          case 'semiannual':
            // Semi-annual resets at end of Jun (5) and Dec (11)
            if (viewMonth === 5 || viewMonth === 11) {
              resetDay = daysInMonth;
            }
            break;
          case 'annual':
            // Annual resets at end of Dec (11)
            if (viewMonth === 11) {
              resetDay = daysInMonth;
            }
            break;
        }
        
        if (resetDay > 0 && resetDay <= daysInMonth) {
          // Get the period key for the viewed month
          const periodKey = getPeriodKeyForMonth(credit.frequency, viewMonth, viewYear) || '';
          const stateKey = periodKey ? getPeriodStateKey(card.key, credit.id, periodKey) : '';
          const isUsed = !!used[stateKey];
          
          resets[resetDay - 1].credits.push({ card, credit, color, isUsed, periodKey });
        }
      });
    });
    
    return resets;
  }, [cards, savedCards, viewMonth, viewYear, daysInMonth, used, getPeriodStateKey]);
  
  // Count unused credits expiring this month
  const unusedCount = useMemo(() => {
    let count = 0;
    creditResets.forEach(day => {
      day.credits.forEach(c => {
        if (!c.isUsed) count++;
      });
    });
    return count;
  }, [creditResets]);
  
  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
    setSelectedDay(null);
  };
  
  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
    setSelectedDay(null);
  };

  const selectedDayCredits = selectedDay ? creditResets[selectedDay - 1]?.credits || [] : [];
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={prevMonth} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition">
          <svg className="w-4 h-4 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="text-sm font-medium text-white/90">
          {monthNames[viewMonth]} {viewYear}
        </div>
        <button onClick={nextMonth} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition">
          <svg className="w-4 h-4 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      
      {/* Unused credits warning */}
      {unusedCount > 0 && viewMonth === currentMonth && viewYear === currentYear && (
        <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-400/20 text-center">
          <span className="text-xs text-amber-300">⚠️ {unusedCount} unused credit{unusedCount > 1 ? 's' : ''} expiring this month</span>
        </div>
      )}
      
      <div className="grid grid-cols-7 gap-1">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
          <div key={i} className="text-center text-xs text-white/40 py-1">{day}</div>
        ))}
        
        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}
        
        {creditResets.map(({ day, credits }) => {
          const isToday = day === now.getDate() && viewMonth === currentMonth && viewYear === currentYear;
          const hasCredits = credits.length > 0;
          const hasUnused = credits.some(c => !c.isUsed);
          const isSelected = selectedDay === day;
          
          return (
            <div
              key={day}
              onClick={() => hasCredits && setSelectedDay(isSelected ? null : day)}
              className={`aspect-square rounded-lg relative flex flex-col items-center justify-center text-xs transition ${
                isSelected ? 'bg-purple-500/30 ring-2 ring-purple-400' :
                isToday ? 'bg-purple-500/30 ring-1 ring-purple-400' : 
                hasCredits && hasUnused ? 'bg-amber-500/10 hover:bg-amber-500/20 cursor-pointer border border-amber-400/20' :
                hasCredits ? 'bg-white/5 hover:bg-white/10 cursor-pointer' : ''
              }`}
            >
              <span className={isToday ? 'text-white font-medium' : 'text-white/60'}>{day}</span>
              {hasCredits && (
                <div className="flex gap-0.5 mt-0.5">
                  {credits.slice(0, 3).map((c, i) => (
                    <div
                      key={i}
                      className={`w-1.5 h-1.5 rounded-full ${c.isUsed ? 'opacity-40' : 'ring-1 ring-white/50'}`}
                      style={{ backgroundColor: c.color }}
                    />
                  ))}
                  {credits.length > 3 && (
                    <span className="text-[8px] text-white/40">+{credits.length - 3}</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Selected day popup */}
      {selectedDay && selectedDayCredits.length > 0 && (
        <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-white/90">
              {monthNames[viewMonth]} {selectedDay} — {selectedDayCredits.length} credit{selectedDayCredits.length > 1 ? 's' : ''} expiring
            </span>
            <button onClick={() => setSelectedDay(null)} className="text-white/40 hover:text-white/70 text-xs">✕</button>
          </div>
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {selectedDayCredits.map((c, i) => (
              <div 
                key={i} 
                className={`p-2 rounded-lg flex items-center justify-between ${c.isUsed ? 'bg-emerald-500/10 border border-emerald-400/20' : 'bg-amber-500/10 border border-amber-400/20'}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white/90 truncate">{c.credit.title}</div>
                  <div className="text-xs text-white/50">{c.card.name} • ${c.credit.amount}</div>
                </div>
                <div className="flex items-center gap-2">
                  {c.isUsed ? (
                    <span className="text-xs text-emerald-400">✓ Used</span>
                  ) : (
                    <span className="text-xs text-amber-400">Not used</span>
                  )}
                  {onCardSelect && (
                    <button
                      onClick={() => onCardSelect(c.card.key)}
                      className="text-xs text-purple-400 hover:text-purple-300"
                    >
                      View →
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Legend */}
      <div className="flex flex-wrap gap-2 pt-2 border-t border-white/10">
        {savedCards.slice(0, 4).map((cardKey, i) => {
          const card = cards.find(c => c.key === cardKey);
          if (!card) return null;
          const colors = ['#10b981', '#8b5cf6', '#f59e0b', '#ef4444'];
          return (
            <div key={cardKey} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors[i % colors.length] }} />
              <span className="text-xs text-white/50 truncate max-w-[80px]">{card.name}</span>
            </div>
          );
        })}
      </div>
      
      {/* Legend for used vs unused */}
      <div className="flex items-center gap-4 text-xs text-white/40">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-emerald-500 opacity-40" />
          <span>Used</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-white/50" />
          <span>Not used</span>
        </div>
      </div>
    </div>
  );
}

// -----------------------------
// SPENDING OPTIMIZER COMPONENT
// -----------------------------
function SpendingOptimizer({ cards, savedCards }: { cards: Card[]; savedCards: string[] }) {
  const [selectedCategory, setSelectedCategory] = useState<SpendCategory>('dining');
  const [amount, setAmount] = useState<number>(500);
  
  const categories: { key: SpendCategory; label: string; icon: string }[] = [
    { key: 'dining', label: 'Dining', icon: '🍽️' },
    { key: 'travel', label: 'Travel', icon: '✈️' },
    { key: 'groceries', label: 'Groceries', icon: '🛒' },
    { key: 'gas', label: 'Gas', icon: '⛽' },
    { key: 'online', label: 'Online', icon: '🛍️' },
    { key: 'other', label: 'Other', icon: '💳' },
  ];
  
  const cardsToCheck = savedCards.length > 0 
    ? cards.filter(c => savedCards.includes(c.key))
    : cards;
  
  const recommendations = useMemo(() => {
    const results: Array<{
      card: Card;
      multiplier: number;
      pointsEarned: number;
      estimatedValue: number;
    }> = [];
    
    cardsToCheck.forEach(card => {
      const rate = card.earnRates[selectedCategory] ?? 1;
      const points = amount * rate;
      const value = points * pointValueUsd(card.pointsProgram);
      
      results.push({
        card,
        multiplier: rate,
        pointsEarned: points,
        estimatedValue: value,
      });
    });
    
    return results.sort((a, b) => b.estimatedValue - a.estimatedValue);
  }, [cardsToCheck, selectedCategory, amount]);
  
  const bestCard = recommendations[0];
  const worstCard = recommendations[recommendations.length - 1];
  const potentialLoss = bestCard && worstCard ? bestCard.estimatedValue - worstCard.estimatedValue : 0;
  
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {categories.map(cat => (
          <button
            key={cat.key}
            onClick={() => setSelectedCategory(cat.key)}
            className={`px-3 py-1.5 rounded-lg text-xs transition ${
              selectedCategory === cat.key 
                ? 'bg-purple-500/30 text-purple-200 border border-purple-400/30' 
                : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10'
            }`}
          >
            {cat.icon} {cat.label}
          </button>
        ))}
      </div>
      
      <div className="flex items-center gap-2">
        <span className="text-sm text-white/60">For</span>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">$</span>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value) || 0)}
            className="w-24 pl-7 pr-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500/50"
          />
        </div>
        <span className="text-sm text-white/60">{categories.find(c => c.key === selectedCategory)?.label.toLowerCase()} spend</span>
      </div>
      
      {bestCard && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-400/20">
          <div className="flex items-center gap-3">
            <Image src={bestCard.card.logo} alt={bestCard.card.name} width={36} height={36} className="rounded-lg" />
            <div className="flex-1">
              <div className="text-sm font-medium text-white/90">Use {bestCard.card.name}</div>
              <div className="text-xs text-white/50">
                {bestCard.multiplier}x points • {bestCard.pointsEarned.toLocaleString()} pts
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-emerald-400">${bestCard.estimatedValue.toFixed(2)}</div>
              <div className="text-xs text-white/40">value</div>
            </div>
          </div>
        </div>
      )}
      
      {recommendations.length > 1 && potentialLoss > 0.5 && (
        <div className="text-xs text-amber-400 flex items-center gap-2">
          <span>⚠️</span>
          <span>
            Using {worstCard.card.name} instead would cost you ${potentialLoss.toFixed(2)} in value
          </span>
        </div>
      )}
      
      <div className="space-y-2">
        <div className="text-xs text-white/40 uppercase tracking-wide">All cards ranked</div>
        {recommendations.slice(0, 5).map((rec, i) => (
          <div key={rec.card.key} className="flex items-center gap-3 p-2 rounded-lg bg-white/5">
            <span className="text-xs text-white/40 w-4">{i + 1}</span>
            <Image src={rec.card.logo} alt={rec.card.name} width={24} height={24} className="rounded" />
            <span className="flex-1 text-sm text-white/70 truncate">{rec.card.name}</span>
            <span className="text-xs text-white/50">{rec.multiplier}x</span>
            <span className="text-sm text-white/90">${rec.estimatedValue.toFixed(2)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// -----------------------------
// PAGE
// -----------------------------
export default function AppDashboardPage() {
  const [mobileView, setMobileView] = useState<"cards" | "credits" | "insights">("credits");
  const [activeTab, setActiveTab] = useState<"dashboard" | "calendar" | "compare" | "learn" | "settings">("dashboard");
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Pro state
  const [isPro, setIsPro] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Collapsed frequency sections (default: all expanded)
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  // Collapsed tier sections for card list (default: all expanded)
  const [collapsedTiers, setCollapsedTiers] = useState<Record<string, boolean>>({});

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

  // Points Portfolio (Pro feature) - user enters their points balances
  const [pointsBalances, setPointsBalances] = useState<Record<string, number>>({});
  
  // Welcome Bonus Tracker (Pro feature)
  type SUBTracker = {
    cardKey: string;
    spendRequired: number;
    spendCompleted: number;
    deadline: string; // ISO date
    bonusAmount: string; // e.g., "150,000 MR"
  };
  const [subTrackers, setSubTrackers] = useState<SUBTracker[]>([]);
  const [newSub, setNewSub] = useState<Partial<SUBTracker>>({});

  // Compare tool
  const [compareCards, setCompareCards] = useState<string[]>(['amex-platinum', 'chase-sapphire-reserve']);
  const [compareModalOpen, setCompareModalOpen] = useState(false);

  // Streaks & Badges (Pro feature)
  type StreakData = {
    currentStreak: number;
    longestStreak: number;
    perfectMonths: string[]; // Array of "YYYY-MM" strings
    badges: string[]; // Array of badge IDs
  };
  const [streakData, setStreakData] = useState<StreakData>({
    currentStreak: 0,
    longestStreak: 0,
    perfectMonths: [],
    badges: [],
  });

  // Non-Monetary Benefits Guide modal
  const [benefitsGuideOpen, setBenefitsGuideOpen] = useState(false);

  // Onboarding Tour
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  
  const onboardingSteps = [
    {
      title: "Welcome to ClawBack! 👋",
      description: "Let's take a quick tour to help you maximize your credit card rewards. This only takes 30 seconds.",
      target: null,
      position: "center" as const,
    },
    {
      title: "1. Save Your Cards",
      description: "Start by clicking '+ Save Card' to add the credit cards you have. We'll track all the credits for you.",
      target: "save-card-btn",
      position: "right" as const,
    },
    {
      title: "2. Track Your Credits",
      description: "Each card has credits that reset monthly, quarterly, or annually. Click the checkmark when you use one!",
      target: "credits-section",
      position: "left" as const,
    },
    {
      title: "3. Watch Your Savings Grow",
      description: "See how much you've redeemed vs your annual fee. Beat your fee and you're winning! 🎉",
      target: "savings-widget",
      position: "left" as const,
    },
    {
      title: "4. Never Miss a Credit",
      description: "We'll send you email/SMS reminders before credits expire. Set this up in Settings.",
      target: "settings-btn",
      position: "bottom" as const,
    },
    {
      title: "You're All Set! 🚀",
      description: "Start by saving your first card. Pro tip: Take the 'Find My Card' quiz if you're not sure which card to get!",
      target: null,
      position: "center" as const,
    },
  ];

  const completeOnboarding = () => {
    setShowOnboarding(false);
    setOnboardingStep(0);
    if (typeof window !== 'undefined') {
      localStorage.setItem('clawback_onboarding_complete', 'true');
    }
  };

  const nextOnboardingStep = () => {
    if (onboardingStep < onboardingSteps.length - 1) {
      setOnboardingStep(prev => prev + 1);
    } else {
      completeOnboarding();
    }
  };

  const prevOnboardingStep = () => {
    if (onboardingStep > 0) {
      setOnboardingStep(prev => prev - 1);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
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
      
      // Load points balances
      const savedPoints = localStorage.getItem('clawback_pointsBalances');
      if (savedPoints) {
        try { setPointsBalances(JSON.parse(savedPoints)); } catch {}
      }
      
      // Load SUB trackers
      const savedSubs = localStorage.getItem('clawback_subTrackers');
      if (savedSubs) {
        try { setSubTrackers(JSON.parse(savedSubs)); } catch {}
      }

      // Load streak data
      const savedStreaks = localStorage.getItem('clawback_streakData');
      if (savedStreaks) {
        try { setStreakData(JSON.parse(savedStreaks)); } catch {}
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

  // Save points balances to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('clawback_pointsBalances', JSON.stringify(pointsBalances));
    }
  }, [pointsBalances]);

  // Save SUB trackers to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('clawback_subTrackers', JSON.stringify(subTrackers));
    }
  }, [subTrackers]);

  // Save streak data to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('clawback_streakData', JSON.stringify(streakData));
    }
  }, [streakData]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Stripe Payment Link
  const handleUpgrade = async () => {
  // Require account before paying
  if (!user) {
    setAuthMode("signup");
    setAuthModalOpen(true);
    showToast("Create an account or sign in to upgrade.");
    return;
  }

  try {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.access_token) {
      showToast("Session error. Please sign in again.");
      return;
    }

    const res = await fetch("/api/stripe/create-checkout-session", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Create checkout session failed:", data);
      showToast(data?.error || "Stripe checkout failed.");
      return;
    }

    if (data?.url) {
      window.location.href = data.url;
    } else {
      showToast("Stripe checkout missing URL.");
    }
  } catch (err) {
    console.error(err);
    showToast("Upgrade failed. Try again.");
  }
  };

  // Display name
  const displayName = useMemo(() => {
    const n = fullName.trim();
    if (n) return n.split(' ')[0];
    return "";
  }, [fullName]);

  const FOUNDER_EMAIL = "namanlohia02@gmail.com";
  const isFounder = (user?.email ?? "").toLowerCase() === FOUNDER_EMAIL.toLowerCase();

  // Grant Pro access to founder
  useEffect(() => {
    if (isFounder) {
      setIsPro(true);
      if (typeof window !== 'undefined') {
      }
    }
  }, [isFounder]);

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

  // Onboarding is now on landing page - this only triggers from Settings "Take the Tour" button
  // No auto-popup for signed-in users

  const feeBounds = useMemo(() => {
    const fees = CARDS.map((c) => c.annualFee);
    return { min: Math.min(...fees), max: Math.max(...fees) };
  }, []);

  const [feeMin, setFeeMin] = useState<number>(feeBounds.min);
  const [feeMax, setFeeMax] = useState<number>(feeBounds.max);

  const activeCard = useMemo(() => CARDS.find((c) => c.key === activeCardKey) ?? CARDS[0], [activeCardKey]);

  // Group credits by frequency for tiered display
  // Helper to check if a credit is available in the current month
  const isCreditAvailableThisMonth = useCallback((credit: Credit): boolean => {
    const currentMonth = new Date().getMonth(); // 0 = Jan, 11 = Dec
    const title = credit.title.toLowerCase();
    const notes = (credit.notes || '').toLowerCase();
    
    // Check for December-only credits
    if (title.includes('(dec)') || notes.includes('december only')) {
      return currentMonth === 11; // December
    }
    
    // Check for Jan-Nov credits
    if (title.includes('(jan-nov)') || title.includes('jan-nov')) {
      return currentMonth >= 0 && currentMonth <= 10; // January through November
    }
    
    // Default: available all months
    return true;
  }, []);

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
      // Only include credits available this month
      if (isCreditAvailableThisMonth(c)) {
        groups[c.frequency].push(c);
      }
    }
    
    // Sort each group alphabetically
    for (const key of Object.keys(groups) as CreditFrequency[]) {
      groups[key].sort((a, b) => a.title.localeCompare(b.title));
    }
    
    return groups;
  }, [activeCard, isCreditAvailableThisMonth]);

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

  // Points Portfolio total value calculation
  const pointsPortfolio = useMemo(() => {
    const programs: Array<{ program: PointsProgram; name: string; balance: number; value: number }> = [];
    const programNames: Record<PointsProgram, string> = {
      amex_mr: 'Amex MR',
      chase_ur: 'Chase UR',
      cap1_miles: 'Capital One Miles',
      citi_typ: 'Citi TYP',
      aa_miles: 'AA Miles',
      delta_miles: 'Delta Miles',
      marriott_points: 'Marriott Points',
      hilton_points: 'Hilton Points',
      cashback: 'Cash Back',
      united_miles: 'United Miles',
      usbank_points: 'US Bank Points',
      boa_points: 'BoA Points',
      luxury_points: 'Luxury Points',
    };
    
    let totalValue = 0;
    for (const [program, balance] of Object.entries(pointsBalances)) {
      if (balance > 0) {
        const valuePerPoint = pointValueUsd(program as PointsProgram);
        const value = balance * valuePerPoint;
        totalValue += value;
        programs.push({
          program: program as PointsProgram,
          name: programNames[program as PointsProgram] || program,
          balance,
          value,
        });
      }
    }
    
    return { programs, totalValue };
  }, [pointsBalances]);

  // Card Anniversary Alerts - cards renewing in next 60 days
  const anniversaryAlerts = useMemo(() => {
    const alerts: Array<{ card: Card; daysUntilRenewal: number; renewalDate: Date }> = [];
    const now = new Date();
    
    for (const cardKey of savedCards) {
      const card = CARDS.find(c => c.key === cardKey);
      const startDate = cardStartDates[cardKey];
      if (!card || !startDate) continue;
      
      // Parse start date and calculate next anniversary
      const start = new Date(startDate);
      const thisYearAnniversary = new Date(now.getFullYear(), start.getMonth(), start.getDate());
      const nextYearAnniversary = new Date(now.getFullYear() + 1, start.getMonth(), start.getDate());
      
      // Pick the next upcoming anniversary
      const nextRenewal = thisYearAnniversary > now ? thisYearAnniversary : nextYearAnniversary;
      const daysUntil = Math.ceil((nextRenewal.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntil <= 60) {
        alerts.push({ card, daysUntilRenewal: daysUntil, renewalDate: nextRenewal });
      }
    }
    
    return alerts.sort((a, b) => a.daysUntilRenewal - b.daysUntilRenewal);
  }, [savedCards, cardStartDates]);

  // Annual Summary - total redeemed across all saved cards
  const annualSummary = useMemo(() => {
    let totalRedeemed = 0;
    let totalFees = 0;
    let cardCount = 0;
    
    for (const cardKey of savedCards) {
      const card = CARDS.find(c => c.key === cardKey);
      if (!card) continue;
      
      cardCount++;
      totalFees += card.annualFee;
      
      // Count redeemed credits for this card
      for (const credit of card.credits) {
        const periods = getPeriodsForFrequency(credit.frequency);
        const usedCount = countUsedPeriods(cardKey, credit.id, credit.frequency, used);
        totalRedeemed += usedCount * credit.amount;
      }
    }
    
    const netValue = totalRedeemed - totalFees;
    const percentRecovered = totalFees > 0 ? Math.round((totalRedeemed / totalFees) * 100) : 0;
    
    return { totalRedeemed, totalFees, netValue, cardCount, percentRecovered };
  }, [savedCards, used]);

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

  // Quiz results - improved scoring that properly weights earning rates vs credits
  const quizResults = useMemo(() => {
    const feeTol = qFeeTolerance === '0-250' ? 250 : qFeeTolerance === '250-500' ? 500 : 1000;
    
    // Credit utilization depends on travel frequency and optimization style
    // Most people don't use 100% of credits - be realistic
    const baseUtil = qOptimize === 'maximize' ? 0.70 : 0.45;
    const travelBonus = qTravelFreq === '10+' ? 0.15 : qTravelFreq === '5-10' ? 0.10 : qTravelFreq === '2-4' ? 0.05 : 0;
    const utilization = Math.min(baseUtil + travelBonus, 0.85);
    
    // Estimate groceries based on dining (correlated spending)
    const estimatedGroceries = qDining < 200 ? 300 : qDining < 500 ? 450 : 600;
    
    const modifiedQuiz: QuizInputs = {
      spend: { 
        dining: qDining, 
        travel: qTravel, 
        groceries: estimatedGroceries, 
        gas: 150, 
        online: qUsesDelivery ? 250 : 100, 
        other: 400 
      },
      annualFeeTolerance: feeTol,
      creditUtilizationPct: utilization,
      includeWelcomeBonus: true,
    };
    
    let scored = CARDS.map((c) => {
      let score = 0;
      const detailLines: string[] = [];
      const pvUsd = pointValueUsd(c.pointsProgram);
      
      // EARNING VALUE - weight this heavily (2x multiplier for importance)
      let earningValue = 0;
      for (const cat of Object.keys(modifiedQuiz.spend) as SpendCategory[]) {
        const spend = modifiedQuiz.spend[cat];
        const rate = c.earnRates[cat] ?? 1;
        const pts = spend * 12 * rate;
        const val = pts * pvUsd;
        earningValue += val;
        if (spend > 0 && rate > 1) {
          detailLines.push(`${cat}: ${rate}x → ${formatMoney(val)}/yr`);
        }
      }
      score += earningValue * 1.5; // Boost earning importance
      
      // CREDITS VALUE - cap at realistic usage
      // High fee cards have credits that many people can't fully use
      const creditCap = c.annualFee <= 200 ? 1.0 : c.annualFee <= 400 ? 0.8 : c.annualFee <= 600 ? 0.6 : 0.5;
      const creditVal = c.creditsTrackedAnnualized * utilization * creditCap;
      score += creditVal;
      if (creditVal > 0) detailLines.push(`Credits: ${formatMoney(creditVal)}/yr (${Math.round(utilization * creditCap * 100)}% util)`);
      
      // Welcome bonus (amortized over 2 years)
      if (c.signupBonusEstUsd) {
        const subVal = c.signupBonusEstUsd * 0.5; // 2-year amortization
        score += subVal;
        detailLines.push(`SUB: ~${formatMoney(c.signupBonusEstUsd)} (${formatMoney(subVal)}/yr avg)`);
      }
      
      // Subtract annual fee
      score -= c.annualFee;
      detailLines.push(`Annual fee: -${formatMoney(c.annualFee)}`);
      
      // PENALTY for fee exceeding tolerance
      if (c.annualFee > feeTol) {
        score *= 0.4; // Stronger penalty
        detailLines.push(`(Fee exceeds ${formatMoney(feeTol)} tolerance → penalized)`);
      }
      
      // BONUS for matching spending patterns
      // Dining-heavy user? Boost cards with high dining rates
      if (qDining >= 400 && (c.earnRates.dining ?? 1) >= 3) {
        score *= 1.15;
        detailLines.push(`(Great dining rewards match!)`);
      }
      // Travel-heavy user? Boost cards with high travel rates  
      if (qTravel >= 400 && (c.earnRates.travel ?? 1) >= 3) {
        score *= 1.15;
        detailLines.push(`(Great travel rewards match!)`);
      }
      // Grocery-heavy? Boost grocery cards
      if (estimatedGroceries >= 450 && (c.earnRates.groceries ?? 1) >= 3) {
        score *= 1.12;
      }
      
      // Brand preference
      if (qBrandPref === 'chase' && c.issuer === 'Chase') score *= 1.25;
      else if (qBrandPref === 'amex' && c.issuer === 'American Express') score *= 1.25;
      else if (qBrandPref === 'cap1' && c.issuer === 'Capital One') score *= 1.25;
      else if (qBrandPref === 'citi' && c.issuer === 'Citi') score *= 1.25;
      else if (qBrandPref === 'avoid-amex' && c.issuer === 'American Express') score *= 0.2;
      
      return { card: c, detailLines, score };
    }).sort((a, b) => b.score - a.score);
    
    return scored.slice(0, 3);
  }, [qDining, qTravel, qTravelFreq, qFeeTolerance, qOptimize, qUsesDelivery, qBrandPref]);

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
      // Set Pro status from database (source of truth)
      setIsPro(p.is_pro === true);
    })();
    return () => { alive = false; };
  }, [user]);

  // Handle upgrade success URL parameter (after returning from Stripe)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const upgradeStatus = params.get('upgrade');
    
    if (upgradeStatus === 'success' && user) {
      // Clear the URL parameter
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
      
      // Poll for Pro status (webhook may take a moment)
      let attempts = 0;
      const maxAttempts = 10;
      
      const pollProStatus = async () => {
        const { data } = await supabase
          .from("profiles")
          .select("is_pro")
          .eq("user_id", user.id)
          .maybeSingle();
        
        if (data?.is_pro === true) {
          setIsPro(true);
          showToast("✅ Pro Activated! Welcome to ClawBack Pro.");
          return;
        }
        
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(pollProStatus, 1000);
        } else {
          // After 10 seconds, check one more time then show appropriate message
          showToast("Payment received! Pro access activating...");
          // Final check after a longer delay
          setTimeout(async () => {
            const { data: finalCheck } = await supabase
              .from("profiles")
              .select("is_pro")
              .eq("user_id", user.id)
              .maybeSingle();
            if (finalCheck?.is_pro === true) {
              setIsPro(true);
              showToast("✅ Pro Activated!");
            }
          }, 3000);
        }
      };
      
      pollProStatus();
    } else if (upgradeStatus === 'cancel') {
      // Clear the URL parameter
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
      showToast("Upgrade cancelled. No charge was made.");
    }
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
        setAuthMsg("Account created — you can sign in now. If email verification is enabled, you may also receive a confirmation email");
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

    // Non-Pro users always get default timing [1, 7]
    const timingToSave = isPro ? offsetsDays : [7, 1];

    const payload: Partial<DbProfile> = {
      user_id: user.id,
      full_name: fullName || null,
      phone_e164: phoneE164 || null,
      notif_email_enabled: notifEmailEnabled,
      notif_sms_enabled: notifSmsEnabled,
      notif_offsets_days: timingToSave,
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

    // Get saved cards first (sorted by annual fee descending)
    const mySavedCards = list.filter(c => savedCards.includes(c.key)).sort((a, b) => b.annualFee - a.annualFee);
    
    // Get remaining cards (not saved) for tiers
    const remainingCards = list.filter(c => !savedCards.includes(c.key));

    // Define tiers from remaining cards
    const tier1 = remainingCards.filter(c => c.annualFee >= 500).sort((a, b) => b.annualFee - a.annualFee);
    const tier2 = remainingCards.filter(c => c.annualFee >= 250 && c.annualFee < 500).sort((a, b) => b.annualFee - a.annualFee);
    const tier3 = remainingCards.filter(c => c.annualFee < 250).sort((a, b) => b.annualFee - a.annualFee);

    return {
      myCards: { label: '⭐ My Cards', cards: mySavedCards },
      premium: { label: 'Premium ($500+)', cards: tier1 },
      mid: { label: 'Mid-Tier ($250-$499)', cards: tier2 },
      entry: { label: 'Entry ($0-$249)', cards: tier3 },
      total: mySavedCards.length + tier1.length + tier2.length + tier3.length,
    };
  }, [search, feeMin, feeMax, savedCards]);

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
  // Earnings data for all cards (from highest to lowest)
  const cardEarningsData: Record<string, { category: string; multiplier: string; description: string }[]> = {
    'chase-sapphire-reserve': [
      { category: 'Chase Travel', multiplier: '8x', description: 'Booked through Chase Travel portal' },
      { category: 'Flights (Direct)', multiplier: '4x', description: 'Flights booked direct with airlines' },
      { category: 'Hotels (Direct)', multiplier: '4x', description: 'Hotels booked direct' },
      { category: 'Dining', multiplier: '3x', description: 'Restaurants worldwide' },
      { category: 'Everything Else', multiplier: '1x', description: 'All other purchases' },
    ],
    'hilton-honors-aspire': [
      { category: 'Hilton Hotels', multiplier: '14x', description: 'Purchases directly with Hilton portfolio hotels' },
      { category: 'Flights & Travel', multiplier: '7x', description: 'Booked through flight or Amex Travel or car rentals' },
      { category: 'Dining', multiplier: '7x', description: 'Restaurants worldwide' },
      { category: 'Everything Else', multiplier: '3x', description: 'All other purchases' },
    ],
    'amex-platinum': [
      { category: 'Flights & Travel', multiplier: '5x', description: 'Booked directly or through Amex Travel' },
      { category: 'Prepaid Hotels', multiplier: '5x', description: 'Prepaid hotels on Amex Travel' },
      { category: 'Everything Else', multiplier: '1x', description: 'All other purchases' },
    ],
    'amex-gold': [
      { category: 'Restaurants', multiplier: '4x', description: 'Restaurants worldwide' },
      { category: 'Groceries', multiplier: '4x', description: 'U.S. supermarkets (up to $25K/yr)' },
      { category: 'Flights & Travel', multiplier: '3x', description: 'Booked directly or through Amex Travel' },
      { category: 'Prepaid Hotels', multiplier: '2x', description: 'Prepaid hotels' },
      { category: 'Everything Else', multiplier: '1x', description: 'All other purchases' },
    ],
    'capitalone-venture-x': [
      { category: 'Hotels & Rentals', multiplier: '10x', description: 'Hotels & rental cars through Capital One Travel' },
      { category: 'Flights & Vacation Rentals', multiplier: '5x', description: 'Flights & vacation rentals through Capital One Travel' },
      { category: 'Everything Else', multiplier: '2x', description: 'All other purchases' },
    ],
    'delta-reserve': [
      { category: 'Delta Purchases', multiplier: '3x', description: 'Delta purchases directly' },
      { category: 'Everything Else', multiplier: '1x', description: 'All other purchases' },
    ],
    'chase-sapphire-preferred': [
      { category: 'Chase Travel', multiplier: '5x', description: 'Booked through Chase Travel portal' },
      { category: 'Dining', multiplier: '3x', description: 'Restaurants worldwide' },
      { category: 'Online Groceries', multiplier: '3x', description: 'Online grocery purchases' },
      { category: 'Streaming', multiplier: '3x', description: 'Select streaming services' },
      { category: 'Other Travel', multiplier: '2x', description: 'Travel outside Chase portal' },
      { category: 'Everything Else', multiplier: '1x', description: 'All other purchases' },
    ],
    'amex-green': [
      { category: 'Travel', multiplier: '3x', description: 'Flights, hotels, cruises, tours' },
      { category: 'Transit', multiplier: '3x', description: 'Trains, buses, rideshare, parking' },
      { category: 'Dining', multiplier: '3x', description: 'Restaurants worldwide' },
      { category: 'Everything Else', multiplier: '1x', description: 'All other purchases' },
    ],
    'hilton-surpass': [
      { category: 'Hilton Hotels', multiplier: '12x', description: 'Purchases at Hilton properties' },
      { category: 'Dining', multiplier: '6x', description: 'Restaurants worldwide' },
      { category: 'U.S. Supermarkets', multiplier: '6x', description: 'Grocery stores' },
      { category: 'Gas Stations', multiplier: '6x', description: 'U.S. gas stations' },
      { category: 'U.S. Online Retail', multiplier: '4x', description: 'Online shopping' },
      { category: 'Everything Else', multiplier: '3x', description: 'All other purchases' },
    ],
    'marriott-brilliant': [
      { category: 'Marriott Hotels', multiplier: '6x', description: 'Marriott Bonvoy properties' },
      { category: 'Restaurants', multiplier: '3x', description: 'Restaurants worldwide' },
      { category: 'Flights', multiplier: '3x', description: 'Airlines directly' },
      { category: 'Everything Else', multiplier: '2x', description: 'All other purchases' },
    ],
    'citi-strata-elite': [
      { category: 'Hotels/Cars/Attractions', multiplier: '12x', description: 'Booked through Citi Travel' },
      { category: 'Air Travel (Citi)', multiplier: '6x', description: 'Flights through Citi Travel' },
      { category: 'Dining (Fri/Sat Night)', multiplier: '6x', description: 'Restaurants on Citi Nights (Fri/Sat 6pm-6am)' },
      { category: 'Dining (Other)', multiplier: '3x', description: 'Restaurants at other times' },
      { category: 'Everything Else', multiplier: '1.5x', description: 'All other purchases' },
    ],
    'citi-aa-executive': [
      { category: 'AA Portal Hotels/Cars', multiplier: '10x', description: 'Hotels & car rentals via AA portal' },
      { category: 'American Airlines', multiplier: '4x', description: 'AA purchases directly' },
      { category: 'Everything Else', multiplier: '1x', description: 'All other purchases' },
    ],
  };

  const activeCardEarnings = cardEarningsData[activeCard?.key || ''];

  const EarningCategoriesWidget = (
    <div className={surfaceCardClass("p-5")}>
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-base font-semibold text-white/95">💰 Earning Categories</h3>
        <Tooltip text="Points/miles multipliers for different spending categories">
          <IconInfo className="h-4 w-4 text-white/40 cursor-help" />
        </Tooltip>
      </div>
      
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      ) : activeCardEarnings ? (
        <div className="space-y-2">
          {activeCardEarnings.map((earning, i) => {
            const mult = parseInt(earning.multiplier);
            const isHighMultiplier = mult >= 4;
            const isMidMultiplier = mult >= 2 && mult < 4;
            
            return (
              <div
                key={i}
                className={`flex items-center justify-between p-3 rounded-xl ${
                  isHighMultiplier ? 'bg-purple-500/10 border border-purple-400/20' : 
                  isMidMultiplier ? 'bg-emerald-500/10 border border-emerald-400/20' :
                  'bg-white/5 border border-white/10'
                }`}
              >
                <div className="flex-1">
                  <div className="text-sm text-white/90">{earning.category}</div>
                  <div className="text-xs text-white/50">{earning.description}</div>
                </div>
                <div className={`text-sm font-bold ml-3 ${
                  isHighMultiplier ? 'text-purple-300' : 
                  isMidMultiplier ? 'text-emerald-300' :
                  'text-white/70'
                }`}>
                  {earning.multiplier}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-sm text-white/50 text-center py-4">
          No earning rate data available for this card
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

  // Annual Summary Widget (Pro)
  const AnnualSummaryWidget = isPro && savedCards.length > 0 ? (
    <div className={surfaceCardClass("p-5")}>
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-base font-semibold text-white/95">📊 Annual Summary</h3>
        <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">PRO</span>
      </div>
      
      <div className="text-center mb-4">
        <div className="text-3xl font-bold text-emerald-400">{formatMoney(annualSummary.totalRedeemed)}</div>
        <div className="text-sm text-white/50">redeemed across {annualSummary.cardCount} card{annualSummary.cardCount !== 1 ? 's' : ''}</div>
      </div>
      
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="p-3 rounded-lg bg-white/5">
          <div className="text-white/50 text-xs">Total Fees</div>
          <div className="text-white/90 font-medium">{formatMoney(annualSummary.totalFees)}</div>
        </div>
        <div className="p-3 rounded-lg bg-white/5">
          <div className="text-white/50 text-xs">Net Value</div>
          <div className={`font-medium ${annualSummary.netValue >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {annualSummary.netValue >= 0 ? '+' : ''}{formatMoney(annualSummary.netValue)}
          </div>
        </div>
      </div>
      
      <div className="mt-3 h-2 bg-white/10 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all ${annualSummary.percentRecovered >= 100 ? 'bg-emerald-500' : annualSummary.percentRecovered >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
          style={{ width: `${Math.min(annualSummary.percentRecovered, 100)}%` }}
        />
      </div>
      <div className="text-xs text-white/50 mt-1 text-center">{annualSummary.percentRecovered}% of fees recovered</div>
    </div>
  ) : null;

  // Points Portfolio Widget (Pro)
  const PointsPortfolioWidget = isPro ? (
    <div className={surfaceCardClass("p-5")}>
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-base font-semibold text-white/95">💎 Points Portfolio</h3>
        <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">PRO</span>
      </div>
      
      {pointsPortfolio.programs.length === 0 ? (
        <div className="text-center py-4">
          <div className="text-2xl mb-2">📈</div>
          <div className="text-sm text-white/50 mb-2">Track your points value</div>
          <div className="text-xs text-white/40">Add your balances in Settings</div>
        </div>
      ) : (
        <>
          <div className="text-center mb-4">
            <div className="text-2xl font-bold text-purple-300">~{formatMoney(pointsPortfolio.totalValue)}</div>
            <div className="text-xs text-white/50">estimated total value</div>
          </div>
          
          <div className="space-y-2">
            {pointsPortfolio.programs.map((p) => (
              <div key={p.program} className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                <div>
                  <div className="text-sm text-white/90">{p.name}</div>
                  <div className="text-xs text-white/50">{p.balance.toLocaleString()} pts</div>
                </div>
                <div className="text-sm text-emerald-400">{formatMoney(p.value)}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  ) : null;

  // Anniversary Alerts Widget (Pro)
  const AnniversaryAlertsWidget = isPro && anniversaryAlerts.length > 0 ? (
    <div className={surfaceCardClass("p-5")}>
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-base font-semibold text-white/95">🗓️ Upcoming Renewals</h3>
        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">{anniversaryAlerts.length}</span>
      </div>
      
      <div className="space-y-2">
        {anniversaryAlerts.map((alert) => (
          <div key={alert.card.key} className={`p-3 rounded-lg border ${alert.daysUntilRenewal <= 30 ? 'bg-red-500/10 border-red-400/30' : 'bg-amber-500/10 border-amber-400/30'}`}>
            <div className="flex items-center gap-3">
              <Image src={alert.card.logo} alt={alert.card.name} width={32} height={32} className="rounded-lg" />
              <div className="flex-1">
                <div className="text-sm font-medium text-white/90">{alert.card.name}</div>
                <div className="text-xs text-white/50">{formatMoney(alert.card.annualFee)} fee</div>
              </div>
              <div className="text-right">
                <div className={`text-sm font-bold ${alert.daysUntilRenewal <= 30 ? 'text-red-400' : 'text-amber-400'}`}>
                  {alert.daysUntilRenewal}d
                </div>
                <div className="text-xs text-white/40">until renewal</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  ) : null;

  // SUB Tracker Widget (Pro)
  const SUBTrackerWidget = isPro && subTrackers.length > 0 ? (
    <div className={surfaceCardClass("p-5")}>
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-base font-semibold text-white/95">🎯 Welcome Bonus Tracker</h3>
        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">{subTrackers.length}</span>
      </div>
      
      <div className="space-y-3">
        {subTrackers.map((sub, i) => {
          const card = CARDS.find(c => c.key === sub.cardKey);
          const percent = sub.spendRequired > 0 ? Math.round((sub.spendCompleted / sub.spendRequired) * 100) : 0;
          const daysLeft = Math.ceil((new Date(sub.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          const isComplete = percent >= 100;
          const isUrgent = daysLeft <= 30 && !isComplete;
          
          return (
            <div key={i} className={`p-3 rounded-lg border ${isComplete ? 'bg-emerald-500/10 border-emerald-400/30' : isUrgent ? 'bg-red-500/10 border-red-400/30' : 'bg-white/5 border-white/10'}`}>
              <div className="flex items-center gap-3 mb-2">
                {card && <Image src={card.logo} alt={card.name} width={28} height={28} className="rounded-lg" />}
                <div className="flex-1">
                  <div className="text-sm font-medium text-white/90">{card?.name || 'Unknown'}</div>
                  <div className="text-xs text-purple-300">{sub.bonusAmount}</div>
                </div>
                <div className="text-right">
                  <div className={`text-xs font-medium ${isUrgent ? 'text-red-400' : 'text-white/50'}`}>
                    {daysLeft > 0 ? `${daysLeft}d left` : 'Expired'}
                  </div>
                </div>
              </div>
              
              <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-1">
                <div 
                  className={`h-full transition-all ${isComplete ? 'bg-emerald-500' : 'bg-purple-500'}`}
                  style={{ width: `${Math.min(percent, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-white/50">
                <span>{formatMoney(sub.spendCompleted)} / {formatMoney(sub.spendRequired)}</span>
                <span>{percent}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  ) : null;

  // Credit Calendar Widget (available to all users)
  const CreditCalendarWidget = (
    <div className={surfaceCardClass("p-5")}>
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-base font-semibold text-white/95">📅 Credit Calendar</h3>
      </div>
      
      <CreditCalendar 
        cards={CARDS} 
        savedCards={savedCards} 
        used={used}
        getPeriodsForFrequency={getPeriodsForFrequency}
        getPeriodStateKey={getPeriodStateKey}
        onCardSelect={(cardKey) => {
          setActiveCardKey(cardKey);
          setActiveTab('dashboard');
        }}
      />
    </div>
  );

  // Spending Optimizer Widget (Pro)
  const SpendingOptimizerWidget = isPro ? (
    <div className={surfaceCardClass("p-5")}>
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-base font-semibold text-white/95">💡 Spending Optimizer</h3>
        <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">PRO</span>
      </div>
      
      <SpendingOptimizer cards={CARDS} savedCards={savedCards} />
    </div>
  ) : null;

  // Pro Upgrade Banner (for free users) - Starbucks comparison
  const ProUpgradeBanner = !isPro ? (
    <div className={surfaceCardClass("p-5 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border-purple-500/20")}>
      <div className="flex items-start gap-4">
        <div className="text-3xl">☕</div>
        <div className="flex-1">
          <div className="text-sm font-semibold text-white/95 mb-1">
            Less than a coffee. Save hundreds.
          </div>
          <div className="text-xs text-white/60 mb-3">
            That $15 credit you forgot last month? Pro reminders would've saved it.
          </div>
          <button
            onClick={handleUpgrade}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-sm font-semibold hover:opacity-90 transition"
          >
            Upgrade — $4.99 lifetime
          </button>
        </div>
      </div>
    </div>
  ) : null;

  // Non-Monetary Benefits Data
  const nonMonetaryBenefitsData: Record<string, { title: string; benefits: { name: string; description: string }[] }> = {
    "marriott-brilliant": {
      title: "Marriott Bonvoy Brilliant® American Express® Card",
      benefits: [
        { name: "Automatic Marriott Bonvoy Platinum Elite Status", description: "Includes room upgrades (when available), late checkout, welcome gift at check-in, enhanced bonus points on stays (50% extra), and lounge access at many participating Marriott brands (e.g., executive lounges with free breakfast/snacks at select properties)." },
        { name: "25 Elite Night Credits", description: "Added each calendar year toward qualifying for higher Marriott Bonvoy Elite tiers (e.g., Titanium at 75 nights)." },
        { name: "Priority PassTM Select Membership", description: "Unlimited visits to over 1,200 airport lounges in 130+ countries (for the primary cardholder; guests may be allowed in some lounges)." },
        { name: "Brilliant Earned Choice Award", description: "After $60,000 in annual eligible spend, select one special benefit (e.g., additional Suite Night Awards, gift options, or other Marriott perks; one per year)." },
        { name: "Up to 21x Total Points Earning on Hotel Stays", description: "Stacks card earning (6x) with base membership (up to 10x) and Platinum Elite bonus (up to 5x) for accelerated rewards accumulation." },
        { name: "Standard premium travel protections", description: "Trip delay/cancellation insurance, baggage insurance, car rental coverage — details via Amex terms." },
      ],
    },
    "citi-strata-elite": {
      title: "Citi Strata EliteSM Card",
      benefits: [
        { name: "Priority PassTM Select Membership", description: "Unlimited lounge visits to 1,500+ airports worldwide (for primary cardholder and authorized users; up to 2 guests often included)." },
        { name: "4 Annual Admirals Club® Passes", description: "For access to nearly 50 American Airlines Admirals Club lounges each calendar year (great for AA flyers)." },
        { name: "Access to Citi Travel Portal Perks", description: "Exclusive offers, discounts, or enhanced availability on hotels, car rentals, and attractions when booking through the portal (beyond just earning rates)." },
        { name: "Premium Travel Protections", description: "Includes trip cancellation/interruption coverage, trip delay reimbursement, lost luggage protection, baggage delay, and purchase/return protections (Mastercard World Elite level benefits like extended warranty)." },
        { name: "No Foreign Transaction Fees", description: "Saves on international purchases." },
        { name: "High earning multipliers", description: "High earning multipliers (e.g., 12x/6x on portal bookings) act as an indirect non-monetary boost by accelerating points accumulation for transfers to partners like American Airlines." },
      ],
    },
    "citi-aa-executive": {
      title: "Citi® / AAdvantage® Executive World Elite Mastercard®",
      benefits: [
        { name: "Unlimited Admirals Club® Membership", description: "Full access to American Airlines Admirals Club lounges (and partner lounges when flying AA/oneworld) for the primary cardholder every year (authorized users get access to AA lounges only; high value for hub users or frequent flyers)." },
        { name: "Free First Checked Bag", description: "On domestic American Airlines flights for you and up to 8 companions on the same reservation (saves time and hassle at check-in)." },
        { name: "Priority Services on AA", description: "Priority check-in (business-class counters where available), priority security screening (when offered), and priority boarding for you and up to 8 companions on the same reservation." },
        { name: "Loyalty Points Earning", description: "Earn 1 Loyalty Point toward AAdvantage status for every eligible AAdvantage mile earned with the card (helps qualify for elite status faster)." },
        { name: "AAdvantage Miles Booster", description: "After $150,000 annual spend, earn 5x miles (instead of 4x) on eligible AA purchases for the rest of the year." },
        { name: "Premium Travel Protections", description: "Trip cancellation/interruption, trip delay, lost baggage, and worldwide car rental insurance coverage." },
        { name: "No Foreign Transaction Fees", description: "No foreign transaction fees." },
      ],
    },

    'amex-platinum': {
      title: 'Amex Platinum Non-Monetary Benefits',
      benefits: [
        { name: 'Global Lounge Collection', description: 'Access to 1,550+ lounges including Centurion Lounges, Priority Pass Select, Delta Sky Club when flying Delta (valued $850+/year)' },
        { name: 'Hotel Elite Status', description: 'Complimentary Marriott Bonvoy Gold and Hilton Honors Gold elite status with room upgrades, bonuses, late checkout' },
        { name: 'Fine Hotels + Resorts Perks', description: 'Room upgrades when available, daily breakfast for two, $100 property credit, early check-in/late checkout' },
        { name: 'Global Dining Access by Resy', description: 'Priority reservations and exclusive dining events at top restaurants' },
        { name: 'Travel Protections', description: 'Trip delay/cancellation/interruption insurance, baggage insurance, car rental loss/damage waiver' },
        { name: 'Purchase Protections', description: 'Extended warranty, return protection up to $300, purchase protection up to $10,000 per item' },
        { name: 'Concierge Service', description: '24/7 premium concierge service and no foreign transaction fees' },
      ]
    },
    'chase-sapphire-reserve': {
      title: 'Chase Sapphire Reserve Non-Monetary Benefits',
      benefits: [
        { name: 'Lounge Access', description: 'Priority Pass Select membership + Chase Sapphire Lounges with unlimited access for cardholder + guests' },
        { name: 'IHG Platinum Elite Status', description: 'Complimentary IHG One Rewards Platinum Elite through 12/31/2027 with room upgrades, bonuses, late checkout' },
        { name: 'Primary Car Rental Insurance', description: 'Primary coverage for theft and collision damage when you decline rental insurance' },
        { name: 'Trip Protections', description: 'Trip cancellation/interruption up to $10,000/person, trip delay reimbursement $500, lost luggage up to $3,000' },
        { name: 'Points Transfer Partners', description: 'Transfer points 1:1 to airline/hotel partners including United, Southwest, Hyatt' },
        { name: 'Reserve Travel Designer', description: 'Personalized booking service for travel arrangements' },
        { name: 'No Foreign Transaction Fees', description: 'Use worldwide without additional fees' },
      ]
    },
    'hilton-honors-aspire': {
      title: 'Hilton Aspire Non-Monetary Benefits',
      benefits: [
        { name: 'Hilton Diamond Elite Status', description: 'Top-tier status with room upgrades, executive lounge access, bonus points, priority late checkout' },
        { name: 'Annual Free Night Reward', description: 'One complimentary night at participating Hilton properties on card anniversary' },
        { name: '5th Night Free on Awards', description: 'Book 5+ nights with points and get the 5th night free' },
        { name: 'National Car Rental Status', description: 'Complimentary Emerald Club Executive status with upgrades and faster service' },
        { name: 'Travel Protections', description: 'Baggage insurance and car rental coverage included' },
        { name: 'No Foreign Transaction Fees', description: 'Use worldwide without additional fees' },
      ]
    },
    'amex-gold': {
      title: 'Amex Gold Non-Monetary Benefits',
      benefits: [
        { name: 'Earning Power', description: '4X points on restaurants worldwide (up to $50K/year) and U.S. supermarkets (up to $25K/year)' },
        { name: 'Amex Offers', description: 'Targeted deals for extra points and credits at various merchants' },
        { name: 'Purchase Protections', description: 'Extended warranty, return protection up to $300, purchase protection' },
        { name: 'No Foreign Transaction Fees', description: 'Available on some versions - check your card terms' },
        { name: 'Amex Experiences', description: 'Access to exclusive events and experiences through American Express' },
      ]
    },
    'amex-green': {
      title: 'American Express® Green Card',
      benefits: [
        { name: 'Broad 3x Membership Rewards Points Earning', description: 'Earn 3x on travel (including flights, hotels, car rentals), transit (rideshare/taxis/public transport/parking/tolls), and restaurants worldwide (including takeout/delivery) — accelerates points for transfers to airline/hotel partners or other redemptions.' },
        { name: 'No Foreign Transaction Fees', description: 'Avoids typical ~3% fees on international purchases and travel spend abroad.' },
        { name: 'Premium Travel & Purchase Protections', description: 'Trip delay coverage (if delayed 6+ hours), baggage insurance, secondary car rental loss/damage coverage, purchase protection (up to $1,000/item within 90 days), extended warranty (adds up to 1 year), and return protection (eligible items).' },
        { name: 'Global Assist Hotline', description: '24/7 travel assistance for medical/legal referrals, translations, and other support while traveling.' },
        { name: 'Flexible Payment Options', description: 'Pay Over Time and Plan It for added flexibility on eligible purchases.' },
      ]
    },
    'hilton-surpass': {
      title: 'Hilton Honors American Express Surpass® Card',
      benefits: [
        { name: 'Automatic Hilton Honors Gold Elite Status', description: 'Includes ~80% bonus points on paid stays, space-available room upgrades, late checkout when available, welcome gift at check-in, and priority service; at many brands this includes free breakfast (or a food/beverage credit) and lounge access where offered.' },
        { name: 'Path to Hilton Honors Diamond Status', description: 'After $40,000 in eligible annual spend, earn Diamond status through the end of the next calendar year (100% bonus points on stays, executive lounge access where offered, space-available upgrades, and more).' },
        { name: 'National Car Rental Emerald Club Executive Status', description: 'After enrollment, access Executive Area benefits like faster service, upgrades when available, and accelerated earning in the U.S. and Canada.' },
        { name: 'Free Night Reward Earning Potential', description: 'Earn a Free Night Reward after $15,000 in eligible purchases in a calendar year (redeemable for standard room nights; value varies by property).' },
        { name: 'No Foreign Transaction Fees', description: 'Avoids extra fees on international Hilton stays or other purchases abroad.' },
        { name: 'Premium Travel & Purchase Protections', description: 'Standard Amex protections such as trip delay/cancellation/interruption coverage, baggage insurance, secondary car rental loss/damage coverage, purchase protection, extended warranty, and return protection (see terms for details).' },
      ]
    },
    'capitalone-venture-x': {
      title: 'Capital One Venture X Non-Monetary Benefits',
      benefits: [
        { name: 'Unlimited Lounge Access', description: 'Capital One Lounges + Priority Pass (1,300+ lounges worldwide). Note: Guest access policy changes Feb 2026' },
        { name: 'Premier Collection Hotels', description: '$100 experience credit, room upgrades when available, daily breakfast for two, early check-in/late checkout' },
        { name: 'Hertz President\'s Circle', description: 'Complimentary elite status with upgrades and faster service' },
        { name: 'Travel Protections', description: 'Trip delay, lost luggage, and primary car rental coverage' },
        { name: 'Points Transfer Partners', description: 'Transfer points to airline and hotel partners' },
        { name: 'No Foreign Transaction Fees', description: 'Use worldwide without additional fees' },
      ]
    },
    'delta-reserve': {
      title: 'Delta Reserve Non-Monetary Benefits',
      benefits: [
        { name: 'Delta Sky Club Access', description: '15 visits per Medallion Year when flying Delta; unlimited after $75K annual spend' },
        { name: 'Centurion & Escape Lounge Access', description: 'Access when purchasing Delta flights with card - you + up to 2 guests' },
        { name: 'Annual Companion Certificate', description: 'Round-trip companion ticket (First, Comfort+, or Main Cabin) on domestic/Caribbean flights - pay taxes/fees only ($400-$1,000+ value)' },
        { name: 'MQD Headstart', description: '$2,500 Medallion Qualification Dollars annually + $1 MQD per $10 spent toward Delta elite status' },
        { name: 'Complimentary Upgrades', description: 'Priority for upgrades after Medallion Members' },
        { name: 'Hertz President\'s Circle', description: 'Complimentary elite status with rental car benefits' },
        { name: 'Travel Protections', description: 'Trip delay/cancellation and baggage insurance' },
        { name: 'No Foreign Transaction Fees', description: 'Use worldwide without additional fees' },
      ]
    },
    'chase-sapphire-preferred': {
      title: 'Chase Sapphire Preferred Non-Monetary Benefits',
      benefits: [
        { name: 'Trip Cancellation Insurance', description: 'Up to $5,000 per trip for covered reasons' },
        { name: 'Trip Delay Reimbursement', description: '$500 per ticket for 12+ hour delays' },
        { name: 'Primary Car Rental Insurance', description: 'Covers collision damage when you decline rental insurance' },
        { name: 'Purchase Protection', description: '120 days coverage against damage/theft' },
      ]
    },
  };

  const activeCardBenefits = nonMonetaryBenefitsData[activeCard?.key || ''];

  const NonMonetaryBenefitsWidget = activeCardBenefits ? (
    <div className={surfaceCardClass("p-5")}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold text-white/95">🎁 Non-Monetary Benefits</h3>
        </div>
        <button
          onClick={() => setBenefitsGuideOpen(true)}
          className="text-xs text-purple-400 hover:text-purple-300"
        >
          View All →
        </button>
      </div>
      
      <div className="space-y-2">
        {activeCardBenefits.benefits.slice(0, 3).map((benefit, i) => (
          <div key={i} className="p-3 rounded-lg bg-white/5 border border-white/10">
            <div className="text-sm font-medium text-white/90">{benefit.name}</div>
            <div className="text-xs text-white/50 mt-1">{benefit.description}</div>
          </div>
        ))}
        {activeCardBenefits.benefits.length > 3 && (
          <button
            onClick={() => setBenefitsGuideOpen(true)}
            className="w-full p-2 text-xs text-purple-400 hover:text-purple-300"
          >
            +{activeCardBenefits.benefits.length - 3} more benefits →
          </button>
        )}
      </div>
    </div>
  ) : null;

  // Badge definitions
  const badgeDefinitions = [
    { id: 'first-credit', name: 'First Credit', icon: '🎯', description: 'Used your first credit' },
    { id: 'perfect-month', name: 'Perfect Month', icon: '⭐', description: 'Used all credits in a month' },
    { id: 'streak-3', name: 'On Fire', icon: '🔥', description: '3 month streak' },
    { id: 'streak-6', name: 'Unstoppable', icon: '💪', description: '6 month streak' },
    { id: 'streak-12', name: 'Credit Master', icon: '👑', description: '12 month streak' },
    { id: 'saved-500', name: '$500 Club', icon: '💰', description: 'Saved $500 total' },
    { id: 'saved-1000', name: '$1K Club', icon: '💎', description: 'Saved $1,000 total' },
    { id: 'saved-5000', name: '$5K Club', icon: '🏆', description: 'Saved $5,000 total' },
  ];

  // Calculate streaks from used credits
  const calculatedStreaks = useMemo(() => {
    if (!isPro || savedCards.length === 0) return streakData;
    
    // This is a simplified calculation - in production you'd track by month
    const totalUsed = Object.values(used).filter(Boolean).length;
    const earnedBadges: string[] = [];
    
    if (totalUsed >= 1) earnedBadges.push('first-credit');
    if (savingsData.redeemed >= 500) earnedBadges.push('saved-500');
    if (savingsData.redeemed >= 1000) earnedBadges.push('saved-1000');
    if (savingsData.redeemed >= 5000) earnedBadges.push('saved-5000');
    
    // Simulate streak based on redeemed percentage
    let currentStreak = 0;
    if (savingsData.percentRecovered >= 100) currentStreak = 3;
    else if (savingsData.percentRecovered >= 75) currentStreak = 2;
    else if (savingsData.percentRecovered >= 50) currentStreak = 1;
    
    if (currentStreak >= 3) earnedBadges.push('streak-3');
    if (currentStreak >= 6) earnedBadges.push('streak-6');
    if (currentStreak >= 12) earnedBadges.push('streak-12');
    
    return {
      currentStreak,
      longestStreak: Math.max(currentStreak, streakData.longestStreak),
      perfectMonths: streakData.perfectMonths,
      badges: earnedBadges,
    };
  }, [isPro, savedCards, used, savingsData, streakData]);

  // Streaks & Badges Widget (Pro)
  const StreaksBadgesWidget = isPro ? (
    <div className={surfaceCardClass("p-5")}>
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-base font-semibold text-white/95">🏆 Streaks & Badges</h3>
        <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">PRO</span>
      </div>
      
      {/* Current Streak */}
      <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-amber-500/20 mb-4">
        <div className="text-4xl">🔥</div>
        <div>
          <div className="text-2xl font-bold text-white/95">{calculatedStreaks.currentStreak} month{calculatedStreaks.currentStreak !== 1 ? 's' : ''}</div>
          <div className="text-sm text-white/50">Current streak</div>
        </div>
        {calculatedStreaks.longestStreak > calculatedStreaks.currentStreak && (
          <div className="ml-auto text-right">
            <div className="text-sm text-white/70">{calculatedStreaks.longestStreak}</div>
            <div className="text-xs text-white/40">Best</div>
          </div>
        )}
      </div>
      
      {/* Badges */}
      <div className="text-sm text-white/70 mb-2">Badges Earned</div>
      <div className="flex flex-wrap gap-2">
        {badgeDefinitions.map((badge) => {
          const earned = calculatedStreaks.badges.includes(badge.id);
          return (
            <Tooltip key={badge.id} text={`${badge.name}: ${badge.description}`}>
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition ${
                  earned 
                    ? 'bg-gradient-to-br from-amber-500/30 to-orange-500/30 border border-amber-400/30' 
                    : 'bg-white/5 border border-white/10 opacity-40 grayscale'
                }`}
              >
                {badge.icon}
              </div>
            </Tooltip>
          );
        })}
      </div>
      
      {calculatedStreaks.badges.length === 0 && (
        <div className="text-xs text-white/40 mt-2">Use your credits to earn badges!</div>
      )}
    </div>
  ) : null;

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
          isActive ? "border-purple-500/50 bg-purple-500/10" : 
          isSaved ? "border-amber-400/30 bg-amber-500/5 hover:bg-amber-500/10" : 
          "border-white/10 bg-white/5 hover:bg-white/10",
        ].join(" ")}
      >
        <Image src={card.logo} alt={card.name} width={40} height={40} className="rounded-lg" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {isSaved && <span className="text-amber-400">⭐</span>}
            <span className="font-medium text-white/95 truncate">{card.name}</span>
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
      {/* My Cards Section (Saved cards at top) */}
      {cardsByTier.myCards.cards.length > 0 && (
        <div>
          <button
            onClick={() => setCollapsedTiers(prev => ({ ...prev, myCards: !prev.myCards }))}
            className="w-full flex items-center gap-2 mb-2 group cursor-pointer"
          >
            <span className={`text-white/50 transition-transform duration-200 text-xs ${collapsedTiers.myCards ? '' : 'rotate-90'}`}>
              ▶
            </span>
            <span className="text-xs font-semibold text-amber-400">{cardsByTier.myCards.label}</span>
            <div className="flex-1 h-px bg-amber-500/30" />
            <span className="text-xs text-white/40">{cardsByTier.myCards.cards.length}</span>
          </button>
          {!collapsedTiers.myCards && (
            <div className="space-y-2">
              {cardsByTier.myCards.cards.map(renderCardButton)}
            </div>
          )}
        </div>
      )}
      
      {/* Premium Tier ($500+) */}
      {cardsByTier.premium.cards.length > 0 && (
        <div>
          <button
            onClick={() => setCollapsedTiers(prev => ({ ...prev, premium: !prev.premium }))}
            className="w-full flex items-center gap-2 mb-2 group cursor-pointer"
          >
            <span className={`text-white/50 transition-transform duration-200 text-xs ${collapsedTiers.premium ? '' : 'rotate-90'}`}>
              ▶
            </span>
            <span className="text-xs font-semibold text-purple-400">{cardsByTier.premium.label}</span>
            <div className="flex-1 h-px bg-purple-500/20" />
            <span className="text-xs text-white/40">{cardsByTier.premium.cards.length}</span>
          </button>
          {!collapsedTiers.premium && (
            <div className="space-y-2">
              {cardsByTier.premium.cards.map(renderCardButton)}
            </div>
          )}
        </div>
      )}
      
      {/* Mid Tier ($250-$499) */}
      {cardsByTier.mid.cards.length > 0 && (
        <div>
          <button
            onClick={() => setCollapsedTiers(prev => ({ ...prev, mid: !prev.mid }))}
            className="w-full flex items-center gap-2 mb-2 group cursor-pointer"
          >
            <span className={`text-white/50 transition-transform duration-200 text-xs ${collapsedTiers.mid ? '' : 'rotate-90'}`}>
              ▶
            </span>
            <span className="text-xs font-semibold text-amber-400">{cardsByTier.mid.label}</span>
            <div className="flex-1 h-px bg-amber-500/20" />
            <span className="text-xs text-white/40">{cardsByTier.mid.cards.length}</span>
          </button>
          {!collapsedTiers.mid && (
            <div className="space-y-2">
              {cardsByTier.mid.cards.map(renderCardButton)}
            </div>
          )}
        </div>
      )}
      
      {/* Entry Tier ($0-$249) */}
      {cardsByTier.entry.cards.length > 0 && (
        <div>
          <button
            onClick={() => setCollapsedTiers(prev => ({ ...prev, entry: !prev.entry }))}
            className="w-full flex items-center gap-2 mb-2 group cursor-pointer"
          >
            <span className={`text-white/50 transition-transform duration-200 text-xs ${collapsedTiers.entry ? '' : 'rotate-90'}`}>
              ▶
            </span>
            <span className="text-xs font-semibold text-emerald-400">{cardsByTier.entry.label}</span>
            <div className="flex-1 h-px bg-emerald-500/20" />
            <span className="text-xs text-white/40">{cardsByTier.entry.cards.length}</span>
          </button>
          {!collapsedTiers.entry && (
            <div className="space-y-2">
              {cardsByTier.entry.cards.map(renderCardButton)}
            </div>
          )}
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
            
            const isCollapsed = collapsedSections[freq] ?? false;
            
            return (
              <div key={freq}>
                {/* Section header - clickable to toggle */}
                <button
                  onClick={() => setCollapsedSections(prev => ({ ...prev, [freq]: !prev[freq] }))}
                  className="w-full flex items-center gap-2 mb-2 mt-4 first:mt-0 group cursor-pointer"
                >
                  <span className={`text-white/50 transition-transform duration-200 ${isCollapsed ? '' : 'rotate-90'}`}>
                    ▶
                  </span>
                  <h3 className="text-sm font-semibold text-white/70 group-hover:text-white/90 transition">{frequencyLabels[freq]}</h3>
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-xs text-white/40">{credits.length}</span>
                </button>
                
                {/* Credits in this tier - collapsible */}
                {!isCollapsed && (
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
                )}
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
      {ProUpgradeBanner}
      {MySavingsWidget}
      {EarningCategoriesWidget}
      {NonMonetaryBenefitsWidget}
      {StreaksBadgesWidget}
      {AnnualSummaryWidget}
      {SUBTrackerWidget}
      {AnniversaryAlertsWidget}
      {SpendingOptimizerWidget}
      {PointsPortfolioWidget}
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

  // Pros and Cons data for cards
  const cardProsConsData: Record<string, { pros: string[]; cons: string[] }> = {
    'amex-platinum': {
      pros: [
        'Unmatched global lounge access (Centurion, Priority Pass, Delta Sky Clubs) — perfect for frequent flyers',
        'Massive stack of annual credits (Uber, Resy, lululemon, Equinox, etc.) totaling $1,000+ if maximized',
      ],
      cons: [
        'Rewards heavily skewed toward travel; weak 1x on most everyday spending outside bonus categories',
        'Many credits are "use-it-or-lose-it" with enrollment required and strict terms, making full value hard to capture',
      ],
    },
    'chase-sapphire-reserve': {
      pros: [
        'High earning on travel/dining (4x on flights/hotels) plus flexible Ultimate Rewards with excellent transfer partners',
        'Strong travel protections and growing lounge network (Sapphire Lounges + Priority Pass)',
      ],
      cons: [
        'Perks and credits (dining, StubHub, The Edit) have different reset periods and activation requirements — easy to miss value',
        'Redemption bonuses through Chase Travel changed (no guaranteed 1.5x for new applicants), reducing simplicity',
      ],
    },
    'hilton-honors-aspire': {
      pros: [
        'Automatic Hilton Diamond status + up to $400 resort credits annually for elite perks on stays',
        'Annual free night award redeemable at most Hilton properties worldwide (often worth $500+ at high-end spots)',
      ],
      cons: [
        'Rewards and benefits almost entirely locked to Hilton — little value if you prefer other hotel chains',
        'Limited everyday earning outside Hilton purchases, making it niche for non-loyalists',
      ],
    },
    'amex-gold': {
      pros: [
        'Top-tier 4x points on dining worldwide and U.S. supermarkets — ideal for food and grocery-heavy spenders',
        'Monthly dining/Uber credits that frequently offset a big chunk of the fee for everyday users',
      ],
      cons: [
        'No meaningful lounge access or broad travel protections — feels limited for frequent flyers',
        'Rewards structure favors food categories but offers lower value on non-bonus spend (gas, utilities)',
      ],
    },
    'capitalone-venture-x': {
      pros: [
        'Flat 2x miles on everything (higher on Capital One Travel) with transferable miles for flexible redemptions',
        'Easy offset via $300 travel credit + 10,000 anniversary bonus miles annually (~$100+ value)',
      ],
      cons: [
        'Lounge network (Priority Pass + Capital One Lounges) is solid but smaller than Amex or Chase in many airports',
        'Guest policies tightened (no free lounge guests for AUs starting 2026), reducing family/group value',
      ],
    },
    'delta-reserve': {
      pros: [
        'Delta Sky Club access + elite status boosts and priority perks for loyal Delta flyers',
        'Annual companion certificate (free round-trip for companion — pay taxes/fees only, often $22–$250)',
      ],
      cons: [
        'SkyMiles have lower average redemption value and less flexibility compared to transferable points programs',
        'Perks deeply tied to Delta ecosystem — major downside if routes change or you switch airlines',
      ],
    },
    'chase-sapphire-preferred': {
      pros: [
        'Low $95 annual fee for premium travel card perks and benefits',
        'Same excellent Ultimate Rewards transfer partners as the Reserve',
      ],
      cons: [
        'No lounge access included',
        'Lower earning rates than Chase Sapphire Reserve (3x vs 5x on travel)',
      ],
    },
    'amex-green': {
      pros: [
        'Broad 3x earning on travel, transit, and dining — flexible Membership Rewards points that transfer to many airline/hotel partners',
        'Up to $209 CLEAR credit helps offset the fee for people who use CLEAR lanes regularly (and it\'s still easy to maximize)',
      ],
      cons: [
        'Loss of the LoungeBuddy credit reduces the card\'s value for occasional travelers who liked occasional lounge access without a premium card',
        'No airport lounge membership (like Priority Pass) or other strong non-monetary perks — less competitive against higher-tier cards for frequent flyers',
      ],
    },
    'hilton-surpass': {
      pros: [
        'Automatic Hilton Honors Gold elite status (upgrades when available, bonus points on stays, late checkout, free breakfast at many brands) plus a path to Diamond after $40,000 annual spend — excellent for frequent Hilton stays',
        'High earning potential (12x at Hilton, 6x on common U.S. categories) plus up to $200 quarterly Hilton credits and an annual Free Night Reward after $15,000 spend — strong offset for Hilton loyalists',
      ],
      cons: [
        'Rewards are locked into the Hilton Honors ecosystem (less flexible than transferable points like Membership Rewards)',
        'Credits are Hilton-specific and quarterly (use-or-lose), so value drops if you don\'t stay at Hilton often — the $150 fee can feel high without regular use',
      ],
    },
    'marriott-brilliant': {
      pros: [
        'Massive value from annual Free Night Award (up to 85,000 points, often worth $595–$680+) combined with up to 21x total points on Marriott stays (6x card + 10x base + 5x Platinum Elite bonus)',
        'Strong offset from $300 dining credit, $100 Ritz/St. Regis credit, automatic Platinum Elite status (upgrades/late checkout), 25 Elite Night Credits, and Priority Pass lounge access',
      ],
      cons: [
        'Many perks have restrictions — Free Night requires specific stays, $100 property credit needs 2-night min, dining credit is monthly use-it-or-lose-it',
        'Rewards heavily tied to Marriott ecosystem; everyday 2x is solid but not top-tier if you prefer other chains or airlines',
      ],
    },
    'citi-strata-elite': {
      pros: [
        'High earning rates on travel (12x hotels/cars/attractions, 6x air via Citi Travel) plus generous lounge access (Priority Pass + Admirals Club)',
        'Multiple stackable credits ($300 hotel, $200 Splurge, $200 Blacklane) that can easily offset the $595 fee for heavy travelers',
      ],
      cons: [
        'Many credits require bookings through Citi Travel or specific brands (1stDibs, Best Buy, Live Nation), reducing flexibility',
        'ThankYou Points are transferable but less valuable if you don\'t use Citi\'s airline partners (e.g., American Airlines)',
      ],
    },
    'citi-aa-executive': {
      pros: [
        'Unlimited Admirals Club lounge access (high value for frequent AA flyers) plus free first checked bag for you + up to 8 companions (savings up to $720/round trip for families)',
        'Full Admirals Club membership (not just passes), priority boarding, and inflight savings make this a powerhouse for dedicated AA travelers',
      ],
      cons: [
        'Rewards locked into American Airlines ecosystem with low everyday earning (1x base on non-AA purchases)',
        'High $595 fee only worth it if you fly AA often; credits (Lyft, Grubhub, car rentals) may not fully offset for casual flyers',
      ],
    },
  };

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
        <div className="space-y-6">
          {/* Main comparison table */}
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
                <tr className="border-b border-white/5">
                  <td className="py-3 text-sm text-white/70"># Credits</td>
                  {compareCards.map((key) => {
                    const card = CARDS.find(c => c.key === key)!;
                    return <td key={key} className="text-center py-3 text-white/70">{card.credits.length}</td>;
                  })}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Earning Categories Comparison */}
          <div className="pt-4 border-t border-white/10">
            <h3 className="text-base font-semibold text-white/95 mb-4">💰 Earning Categories</h3>
            <div className={`grid gap-4 ${compareCards.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
              {compareCards.map((key) => {
                const earnings = cardEarningsData[key];
                return (
                  <div key={key} className="rounded-xl bg-white/5 border border-white/10 p-4">
                    <div className="text-sm font-medium text-white/90 mb-3">{CARDS.find(c => c.key === key)?.name}</div>
                    {earnings ? (
                      <div className="space-y-2">
                        {earnings.map((e, i) => (
                          <div key={i} className="flex items-center justify-between text-xs">
                            <span className="text-white/60">{e.category}</span>
                            <span className={`font-medium ${parseInt(e.multiplier) >= 4 ? 'text-purple-400' : parseInt(e.multiplier) >= 2 ? 'text-emerald-400' : 'text-white/50'}`}>
                              {e.multiplier}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-white/40">No earning data available</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pros and Cons */}
          <div className="pt-4 border-t border-white/10">
            <h3 className="text-base font-semibold text-white/95 mb-4">⚖️ Pros & Cons</h3>
            <div className={`grid gap-4 ${compareCards.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
              {compareCards.map((key) => {
                const prosCons = cardProsConsData[key];
                const card = CARDS.find(c => c.key === key);
                return (
                  <div key={key} className="rounded-xl bg-white/5 border border-white/10 p-4">
                    <div className="text-sm font-medium text-white/90 mb-3">{card?.name}</div>
                    {prosCons ? (
                      <div className="space-y-3">
                        <div>
                          <div className="text-xs text-emerald-400 font-medium mb-1.5">✓ Pros</div>
                          {prosCons.pros.map((pro, i) => (
                            <div key={i} className="text-xs text-white/60 mb-1 pl-2">• {pro}</div>
                          ))}
                        </div>
                        <div>
                          <div className="text-xs text-red-400 font-medium mb-1.5">✗ Cons</div>
                          {prosCons.cons.map((con, i) => (
                            <div key={i} className="text-xs text-white/60 mb-1 pl-2">• {con}</div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-white/40">No data available</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          
          {isPro && (
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
              className="text-sm text-purple-400 hover:text-purple-300"
            >
              Export comparison →
            </button>
          )}
        </div>
      )}
    </div>
  );

  // Learn Tab Content
  const LearnTabContent = (
    <div className={surfaceCardClass("p-6")}>
      <div className="text-center py-8">
        <div className="text-6xl mb-6">📚</div>
        <h2 className="text-2xl font-bold text-white/95 mb-3">Learn Hub Coming Soon</h2>
        <p className="text-white/60 max-w-md mx-auto mb-8">
          We're building the ultimate credit card education center. Here's what's coming:
        </p>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 text-left max-w-4xl mx-auto">
          {/* Card Reviews */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-5">
            <div className="text-2xl mb-3">📝</div>
            <h3 className="text-base font-semibold text-white/95 mb-2">Card Reviews</h3>
            <p className="text-sm text-white/50">In-depth analysis of each premium card — is it worth it for YOU?</p>
          </div>
          
          {/* Strategy Guides */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-5">
            <div className="text-2xl mb-3">🎯</div>
            <h3 className="text-base font-semibold text-white/95 mb-2">Strategy Guides</h3>
            <p className="text-sm text-white/50">Amex Trifecta, Chase Trifecta, credit stacking strategies</p>
          </div>
          
          {/* Video Tutorials */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-5">
            <div className="text-2xl mb-3">🎬</div>
            <h3 className="text-base font-semibold text-white/95 mb-2">Video Tutorials</h3>
            <p className="text-sm text-white/50">Step-by-step walkthroughs for redeeming every credit</p>
          </div>
          
          {/* Points Valuations */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-5">
            <div className="text-2xl mb-3">💎</div>
            <h3 className="text-base font-semibold text-white/95 mb-2">Points Valuations</h3>
            <p className="text-sm text-white/50">Live valuations and best redemption sweet spots</p>
          </div>
          
          {/* Transfer Partner Guide */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-5">
            <div className="text-2xl mb-3">✈️</div>
            <h3 className="text-base font-semibold text-white/95 mb-2">Transfer Partners</h3>
            <p className="text-sm text-white/50">Which airlines & hotels to transfer to and when</p>
          </div>
          
          {/* Beginner Bootcamp */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-5">
            <div className="text-2xl mb-3">🚀</div>
            <h3 className="text-base font-semibold text-white/95 mb-2">Beginner Bootcamp</h3>
            <p className="text-sm text-white/50">New to premium cards? Start here with the basics</p>
          </div>
          
          {/* Annual Fee Defense */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-5">
            <div className="text-2xl mb-3">🛡️</div>
            <h3 className="text-base font-semibold text-white/95 mb-2">Annual Fee Defense</h3>
            <p className="text-sm text-white/50">Scripts and tips for retention calls & downgrades</p>
          </div>
          
          {/* Credit Card News */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-5">
            <div className="text-2xl mb-3">📰</div>
            <h3 className="text-base font-semibold text-white/95 mb-2">Credit Card News</h3>
            <p className="text-sm text-white/50">Latest devaluations, new cards, and benefit changes</p>
          </div>
          
          {/* Community Q&A */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-5">
            <div className="text-2xl mb-3">💬</div>
            <h3 className="text-base font-semibold text-white/95 mb-2">Community Q&A</h3>
            <p className="text-sm text-white/50">Ask questions and learn from other cardholders</p>
          </div>
        </div>
        
        <div className="mt-10 p-4 rounded-xl bg-purple-500/10 border border-purple-400/20 max-w-md mx-auto">
          <p className="text-sm text-white/70 mb-2">Want to be notified when Learn launches?</p>
          <p className="text-xs text-white/50">We'll email Pro users when new content is available</p>
        </div>
      </div>
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
          <div className="flex items-center gap-2 mb-3">
            <label className="block text-sm text-white/70">Reminder timing (days before expiry)</label>
            {!isPro && <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">PRO to customize</span>}
          </div>
          <div className="flex flex-wrap gap-2">
            {[1, 3, 5, 7, 10, 14].map((d) => {
              const isDefault = d === 1 || d === 7;
              const isActive = isPro ? offsetsDays.includes(d) : isDefault;
              const isLocked = !isPro;
              return (
                <button
                  key={d}
                  onClick={() => {
                    if (isLocked) {
                      setUpgradeModalOpen(true);
                      return;
                    }
                    if (isActive) {
                      setOffsetsDays(prev => prev.filter(x => x !== d));
                    } else {
                      setOffsetsDays(prev => [...prev, d].sort((a, b) => b - a));
                    }
                  }}
                  disabled={isLocked}
                  className={[
                    "px-3 py-2 rounded-lg text-sm transition",
                    isActive ? "bg-purple-500/20 border-purple-400/30 text-purple-200" : "bg-white/5 border-white/10 text-white/70",
                    isLocked ? "opacity-50 cursor-not-allowed" : "hover:bg-white/10",
                    "border",
                  ].join(" ")}
                >
                  {d}d
                </button>
              );
            })}
          </div>
          {!isPro && (
            <p className="text-xs text-white/40 mt-2">Free plan: 1-day and 7-day reminders. Upgrade to Pro to customize.</p>
          )}
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
        
        {/* Points Portfolio Input - Pro Feature */}
        <div className="pt-6 border-t border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium text-white/90">💎 Points Balances</h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">PRO</span>
            </div>
          </div>
          
          {!isPro ? (
            <div className="text-center py-4 rounded-xl bg-white/5 border border-white/10">
              <div className="text-sm text-white/70 mb-2">Track your total points value</div>
              <button onClick={() => setUpgradeModalOpen(true)} className="text-sm text-purple-400 hover:text-purple-300">
                Upgrade to Pro →
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {(['amex_mr', 'chase_ur', 'cap1_miles', 'citi_typ', 'hilton_points', 'marriott_points'] as const).map((program) => {
                const names: Record<string, string> = {
                  amex_mr: 'Amex MR',
                  chase_ur: 'Chase UR', 
                  cap1_miles: 'Capital One Miles',
                  citi_typ: 'Citi TYP',
                  hilton_points: 'Hilton Points',
                  marriott_points: 'Marriott Points',
                };
                return (
                  <div key={program} className="flex items-center gap-3">
                    <label className="text-sm text-white/70 w-32">{names[program]}</label>
                    <input
                      type="number"
                      value={pointsBalances[program] || ''}
                      onChange={(e) => setPointsBalances(prev => ({ ...prev, [program]: Number(e.target.value) || 0 }))}
                      placeholder="0"
                      className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/50"
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        {/* SUB Tracker - Pro Feature */}
        <div className="pt-6 border-t border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium text-white/90">🎯 Welcome Bonus Tracker</h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">PRO</span>
            </div>
          </div>
          
          {!isPro ? (
            <div className="text-center py-4 rounded-xl bg-white/5 border border-white/10">
              <div className="text-sm text-white/70 mb-2">Track your signup bonus progress</div>
              <button onClick={() => setUpgradeModalOpen(true)} className="text-sm text-purple-400 hover:text-purple-300">
                Upgrade to Pro →
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                <select
                  value={newSub.cardKey || ''}
                  onChange={(e) => setNewSub(prev => ({ ...prev, cardKey: e.target.value }))}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500/50"
                >
                  <option value="">Select card...</option>
                  {CARDS.map(c => (
                    <option key={c.key} value={c.key}>{c.name}</option>
                  ))}
                </select>
                
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    value={newSub.spendRequired || ''}
                    onChange={(e) => setNewSub(prev => ({ ...prev, spendRequired: Number(e.target.value) }))}
                    placeholder="Spend required ($)"
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/50"
                  />
                  <input
                    type="number"
                    value={newSub.spendCompleted || ''}
                    onChange={(e) => setNewSub(prev => ({ ...prev, spendCompleted: Number(e.target.value) }))}
                    placeholder="Spent so far ($)"
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/50"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={newSub.bonusAmount || ''}
                    onChange={(e) => setNewSub(prev => ({ ...prev, bonusAmount: e.target.value }))}
                    placeholder="Bonus (e.g., 150K MR)"
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/50"
                  />
                  <input
                    type="date"
                    value={newSub.deadline || ''}
                    onChange={(e) => setNewSub(prev => ({ ...prev, deadline: e.target.value }))}
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500/50"
                  />
                </div>
                
                <button
                  onClick={() => {
                    if (newSub.cardKey && newSub.spendRequired && newSub.bonusAmount && newSub.deadline) {
                      setSubTrackers(prev => [...prev, {
                        cardKey: newSub.cardKey!,
                        spendRequired: newSub.spendRequired!,
                        spendCompleted: newSub.spendCompleted || 0,
                        bonusAmount: newSub.bonusAmount!,
                        deadline: newSub.deadline!,
                      }]);
                      setNewSub({});
                      showToast('SUB tracker added ✓');
                    }
                  }}
                  disabled={!newSub.cardKey || !newSub.spendRequired || !newSub.bonusAmount || !newSub.deadline}
                  className="w-full rounded-lg bg-purple-500 px-4 py-2 text-sm text-white font-medium hover:bg-purple-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  + Add SUB Tracker
                </button>
              </div>
              
              {/* Existing SUB trackers */}
              {subTrackers.length > 0 && (
                <div className="space-y-2">
                  {subTrackers.map((sub, i) => {
                    const card = CARDS.find(c => c.key === sub.cardKey);
                    const percent = sub.spendRequired > 0 ? Math.round((sub.spendCompleted / sub.spendRequired) * 100) : 0;
                    return (
                      <div key={i} className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3">
                        {card && <Image src={card.logo} alt={card.name} width={28} height={28} className="rounded-lg" />}
                        <div className="flex-1">
                          <div className="text-sm font-medium text-white/90">{card?.name}</div>
                          <div className="text-xs text-white/50">{formatMoney(sub.spendCompleted)} / {formatMoney(sub.spendRequired)} ({percent}%)</div>
                        </div>
                        <button
                          onClick={() => setSubTrackers(prev => prev.filter((_, j) => j !== i))}
                          className="px-2 py-1.5 rounded-lg bg-red-500/10 text-xs text-red-400 hover:bg-red-500/20 transition"
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Card Start Dates - For Anniversary Alerts */}
        <div className="pt-6 border-t border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium text-white/90">🗓️ Card Anniversary Dates</h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">PRO</span>
            </div>
          </div>
          
          {!isPro ? (
            <div className="text-center py-4 rounded-xl bg-white/5 border border-white/10">
              <div className="text-sm text-white/70 mb-2">Get alerts before annual fees hit</div>
              <button onClick={() => setUpgradeModalOpen(true)} className="text-sm text-purple-400 hover:text-purple-300">
                Upgrade to Pro →
              </button>
            </div>
          ) : savedCards.length === 0 ? (
            <div className="text-center py-4 text-sm text-white/50">
              Save some cards first to set anniversary dates
            </div>
          ) : (
            <div className="space-y-3">
              {savedCards.map((cardKey) => {
                const card = CARDS.find(c => c.key === cardKey);
                if (!card) return null;
                return (
                  <div key={cardKey} className="flex items-center gap-3">
                    <Image src={card.logo} alt={card.name} width={28} height={28} className="rounded-lg" />
                    <span className="text-sm text-white/70 flex-1">{card.name}</span>
                    <input
                      type="date"
                      value={cardStartDates[cardKey] || ''}
                      onChange={(e) => setCardStartDates(prev => ({ ...prev, [cardKey]: e.target.value }))}
                      className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500/50"
                    />
                  </div>
                );
              })}
              <div className="text-xs text-white/40">Enter the date you opened each card</div>
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
                Upgrade — $4.99
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

        {/* Help & Support */}
        <div className="pt-6 border-t border-white/10">
          <div className="text-sm font-medium text-white/90 mb-3">Help & Support</div>
          <div className="space-y-2">
            <button
              onClick={() => {
                setOnboardingStep(0);
                setShowOnboarding(true);
              }}
              className="w-full flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10 text-left hover:bg-white/10 transition"
            >
              <span className="text-lg">🎓</span>
              <div>
                <div className="text-sm text-white/90">Take the Tour</div>
                <div className="text-xs text-white/50">Learn how to use ClawBack</div>
              </div>
            </button>
            <a
              href="mailto:hello@clawback.app"
              className="w-full flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10 text-left hover:bg-white/10 transition"
            >
              <span className="text-lg">💬</span>
              <div>
                <div className="text-sm text-white/90">Contact Support</div>
                <div className="text-xs text-white/50">hello@clawback.app</div>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );

  // Top bar
  const TopBar = (
    <div className="flex items-center justify-between mb-6">
      <a
        href="/"
        className="flex items-center gap-4 hover:opacity-90 transition cursor-pointer"
      >

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
      </a>
      
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

  // Tabs (Desktop)
  const TabBar = (
    <div className="hidden md:flex gap-1 p-1 rounded-xl bg-white/5 border border-white/10 mb-6 w-fit">
      {[
        { key: 'dashboard', label: 'Dashboard', pro: false },
        { key: 'calendar', label: 'Calendar', pro: true },
        { key: 'compare', label: 'Compare', pro: false },
        { key: 'learn', label: 'Learn', pro: false },
        { key: 'settings', label: 'Settings', pro: false },
      ].map((tab) => (
        <button
          key={tab.key}
          onClick={() => setActiveTab(tab.key as typeof activeTab)}
          className={[
            "px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5",
            activeTab === tab.key ? "bg-white/10 text-white" : "text-white/50 hover:text-white/70",
          ].join(" ")}
        >
          {tab.label}
          {tab.pro && !isPro && <span className="text-purple-400 text-[10px]">PRO</span>}
        </button>
      ))}
    </div>
  );

  // Bottom Navigation (Mobile) - Native app feel
  const BottomNav = (
    <div 
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0d1117]/95 backdrop-blur-lg border-t border-white/10"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-center justify-around px-2 py-2">
        {[
          { key: 'dashboard', label: 'Home', icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          )},
          { key: 'calendar', label: 'Calendar', icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          ), pro: true },
          { key: 'compare', label: 'Compare', icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          )},
          { key: 'learn', label: 'Learn', icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          )},
          { key: 'settings', label: 'Settings', icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          )},
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              if (tab.pro && !isPro) {
                setUpgradeModalOpen(true);
                return;
              }
              setActiveTab(tab.key as typeof activeTab);
            }}
            className={[
              "flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all min-w-[60px]",
              activeTab === tab.key 
                ? "text-purple-400" 
                : "text-white/40 active:scale-95",
            ].join(" ")}
          >
            <div className={activeTab === tab.key ? "text-purple-400" : "text-white/40"}>
              {tab.icon}
            </div>
            <span className="text-[10px] mt-1 font-medium">{tab.label}</span>
            {tab.pro && !isPro && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-purple-500 rounded-full" />
            )}
          </button>
        ))}
      </div>
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

  // Non-Monetary Benefits Guide Modal
  const BenefitsGuideModal = !benefitsGuideOpen || !activeCardBenefits ? null : (
    <div className="fixed inset-0 z-50">
      <button className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setBenefitsGuideOpen(false)} aria-label="Close" />
      <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-2xl -translate-x-1/2 -translate-y-1/2 max-h-[85vh] overflow-y-auto">
        <div className={surfaceCardClass("p-6")}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white/95">🎁 {activeCardBenefits.title.replace('Hidden', 'Non-Monetary')}</h2>
            <button onClick={() => setBenefitsGuideOpen(false)} className="text-white/40 hover:text-white/70">
              ✕
            </button>
          </div>
          
          <div className="space-y-4">
            {activeCardBenefits.benefits.map((benefit, i) => (
              <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="text-base font-semibold text-white/95 mb-2">{benefit.name}</div>
                <div className="text-sm text-white/70">{benefit.description}</div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 p-4 rounded-xl bg-purple-500/10 border border-purple-400/20">
            <div className="text-sm text-white/70">
              💡 <strong className="text-white/90">Pro tip:</strong> Save this page or screenshot these benefits. 
              Most people don't realize they have these protections and perks!
            </div>
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
            <div className="text-3xl font-bold text-white/95">$4.99</div>
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
              Upgrade for $4.99
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

      <div className="mx-auto max-w-7xl px-4 py-6 pb-24 md:pb-6">
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
        
        {activeTab === 'calendar' && (
          <div className="max-w-4xl mx-auto">
            {!isPro ? (
              <div className={surfaceCardClass("p-8 text-center")}>
                <div className="text-4xl mb-4">📅</div>
                <h2 className="text-xl font-bold text-white/95 mb-2">Credit Calendar</h2>
                <p className="text-white/60 mb-6">See all your credits on a calendar view. Never miss an expiring credit again.</p>
                <button
                  onClick={() => setUpgradeModalOpen(true)}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-semibold hover:opacity-90 transition"
                >
                  Unlock with Pro — $4.99
                </button>
              </div>
            ) : savedCards.length === 0 ? (
              <div className={surfaceCardClass("p-8 text-center")}>
                <div className="text-4xl mb-4">📅</div>
                <h2 className="text-xl font-bold text-white/95 mb-2">Credit Calendar</h2>
                <p className="text-white/60 mb-6">Save a card to see your credits on the calendar.</p>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className="px-6 py-3 rounded-xl bg-white/10 border border-white/20 text-white font-semibold hover:bg-white/15 transition"
                >
                  Go to Dashboard
                </button>
              </div>
            ) : (
              <div className={surfaceCardClass("p-6")}>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-white/95">Credit Calendar</h2>
                    <p className="text-sm text-white/50">Track when your credits reset and expire</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 text-xs text-white/50">
                      <div className="w-3 h-3 rounded-full bg-emerald-500" />
                      <span>Used</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-white/50">
                      <div className="w-3 h-3 rounded-full bg-amber-500" />
                      <span>Unused</span>
                    </div>
                  </div>
                </div>
                <CreditCalendar 
                  cards={CARDS} 
                  savedCards={savedCards} 
                  used={used}
                  getPeriodsForFrequency={getPeriodsForFrequency}
                  getPeriodStateKey={getPeriodStateKey}
                  onCardSelect={(cardKey) => { setActiveCardKey(cardKey); setActiveTab('dashboard'); }}
                />
              </div>
            )}
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

      {/* Onboarding Tour */}
      {showOnboarding && (
        <div className="fixed inset-0 z-[60]">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          
          {/* Tour Card */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-md">
            <div className={surfaceCardClass("p-6 border-purple-500/30")}>
              {/* Progress dots */}
              <div className="flex justify-center gap-1.5 mb-6">
                {onboardingSteps.map((_, i) => (
                  <div 
                    key={i} 
                    className={`h-2 rounded-full transition-all ${
                      i === onboardingStep 
                        ? 'w-6 bg-purple-500' 
                        : i < onboardingStep 
                          ? 'w-2 bg-purple-500/50' 
                          : 'w-2 bg-white/20'
                    }`}
                  />
                ))}
              </div>
              
              {/* Step content */}
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-white/95 mb-3">
                  {onboardingSteps[onboardingStep].title}
                </h3>
                <p className="text-white/60 leading-relaxed">
                  {onboardingSteps[onboardingStep].description}
                </p>
              </div>
              
              {/* Illustration based on step */}
              {onboardingStep === 0 && (
                <div className="flex justify-center mb-6">
                  <div className="text-6xl">💳</div>
                </div>
              )}
              {onboardingStep === 1 && (
                <div className="flex justify-center mb-6">
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white font-bold">+</div>
                      <span className="text-white/70">Save Card</span>
                    </div>
                  </div>
                </div>
              )}
              {onboardingStep === 2 && (
                <div className="flex justify-center mb-6">
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center">
                        <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-white/70">$15 Uber Cash</span>
                      <span className="text-emerald-400 text-sm">Used ✓</span>
                    </div>
                  </div>
                </div>
              )}
              {onboardingStep === 3 && (
                <div className="flex justify-center mb-6">
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-400/30">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-emerald-400">$1,247</div>
                      <div className="text-xs text-white/50">Redeemed this year</div>
                    </div>
                  </div>
                </div>
              )}
              {onboardingStep === 4 && (
                <div className="flex justify-center mb-6">
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🔔</span>
                      <div>
                        <div className="text-sm text-white/90">Credit expiring soon!</div>
                        <div className="text-xs text-white/50">7 days before reset</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {onboardingStep === 5 && (
                <div className="flex justify-center mb-6">
                  <div className="text-6xl">🚀</div>
                </div>
              )}
              
              {/* Navigation buttons */}
              <div className="flex gap-3">
                {onboardingStep > 0 && (
                  <button
                    onClick={prevOnboardingStep}
                    className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white/70 hover:bg-white/10 transition"
                  >
                    ← Back
                  </button>
                )}
                <button
                  onClick={nextOnboardingStep}
                  className="flex-1 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 px-4 py-3 text-sm font-semibold text-white hover:opacity-90 transition"
                >
                  {onboardingStep === onboardingSteps.length - 1 ? "Get Started!" : "Next →"}
                </button>
              </div>
              
              {/* Skip link */}
              <button
                onClick={completeOnboarding}
                className="w-full mt-4 text-sm text-white/40 hover:text-white/60 transition"
              >
                Skip tour
              </button>
            </div>
          </div>
        </div>
      )}

      {AuthModal}
      {SettingsModal}
      {QuizModal}
      {UpgradeModal}
      {OfferModal}
      {BenefitsGuideModal}

      {/* Bottom Navigation (Mobile) */}
      {BottomNav}

      {/* Toast - positioned above bottom nav on mobile */}
      {toast && (
        <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-xl border border-emerald-400/30 bg-emerald-500/20 backdrop-blur px-5 py-3 text-sm text-emerald-100 shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
