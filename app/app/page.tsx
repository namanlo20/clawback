// app/app/page.tsx
"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import {
  CARDS,
  pointValueUsd,
  type Card,
  type Credit,
  type CreditFrequency,
  type SpendCategory,
} from "../../data/cards";

type ToggleState = Record<string, boolean>;

function formatMoney(n: number): string {
  return n.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });
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

function pillClass(kind: "off" | "on" | "warn" | "good"): string {
  const base =
    "rounded-full border px-3 py-1 text-xs font-medium transition whitespace-nowrap";
  if (kind === "on")
    return `${base} border-emerald-400/30 bg-emerald-400/10 text-emerald-100 hover:bg-emerald-400/15`;
  if (kind === "warn")
    return `${base} border-amber-300/30 bg-amber-300/10 text-amber-100 hover:bg-amber-300/15`;
  if (kind === "good")
    return `${base} border-sky-400/30 bg-sky-400/10 text-sky-100 hover:bg-sky-400/15`;
  return `${base} border-white/10 bg-white/5 text-white/75 hover:bg-white/10`;
}

function surfaceCardClass(extra?: string): string {
  return [
    "rounded-2xl border border-white/10 bg-[#11141B] shadow-[0_0_70px_rgba(0,0,0,0.55)]",
    extra ?? "",
  ].join(" ");
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

export default function AppDashboardPage() {
  const [mobileView, setMobileView] = useState<"cards" | "credits" | "insights">(
    "credits"
  );
  const [quizOpen, setQuizOpen] = useState(false);

  // Your Top Picks (pinned)
  const pinnedOrder: Card["key"][] = [
    "amex-platinum",
    "chase-sapphire-reserve",
    "capitalone-venture-x",
  ];

  const [search, setSearch] = useState("");
  const [activeCardKey, setActiveCardKey] =
    useState<Card["key"]>("chase-sapphire-reserve");

  const [savedCards, setSavedCards] = useState<string[]>([]);
  const [used, setUsed] = useState<ToggleState>({});
  const [dontCare, setDontCare] = useState<ToggleState>({});
  const [remind, setRemind] = useState<ToggleState>({});

  // Hard fee filter for browsing
  const feeBounds = useMemo(() => {
    const fees = CARDS.map((c) => c.annualFee);
    return { min: Math.min(...fees), max: Math.max(...fees) };
  }, []);

  const [feeMin, setFeeMin] = useState<number>(feeBounds.min);
  const [feeMax, setFeeMax] = useState<number>(feeBounds.max);

  const activeCard = useMemo(
    () => CARDS.find((c) => c.key === activeCardKey) ?? CARDS[0],
    [activeCardKey]
  );

  const creditsSorted = useMemo(() => {
    return activeCard.credits
      .slice()
      .sort((a, b) => {
        const fa = freqSort(a.frequency);
        const fb = freqSort(b.frequency);
        if (fa !== fb) return fa - fb;
        return annualize(b.amount, b.frequency) - annualize(a.amount, a.frequency);
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

    const pct =
      totalAvail <= 0 ? 0 : Math.min(100, Math.round((totalRedeemed / totalAvail) * 100));
    return { totalAvail, totalRedeemed, pct };
  }, [creditsSorted, activeCard.key, dontCare, used]);

  // Expiring Soon (still remind-only until date math v2)
  const expiringSoon = useMemo(() => {
    const out: Credit[] = [];
    for (const c of creditsSorted) {
      const k = `${activeCard.key}:${c.id}`;
      if (!remind[k]) continue;
      if (used[k]) continue;
      if (dontCare[k]) continue;
      out.push(c);
    }
    return out.slice(0, 6);
  }, [creditsSorted, activeCard.key, remind, used, dontCare]);

  // Quiz state (modal)
  const [quiz, setQuiz] = useState<QuizInputs>({
    spend: { dining: 600, travel: 400, groceries: 400, gas: 120, online: 200, other: 800 },
    annualFeeTolerance: 200,
    creditUtilizationPct: 0.5,
    includeWelcomeBonus: true,
  });

  const quizResults = useMemo(() => {
    const scored = CARDS.map((c) => ({ card: c, ...scoreCard(c, quiz) })).sort(
      (a, b) => b.score - a.score
    );
    return scored.slice(0, 3);
  }, [quiz]);

  function toggleUsed(cardKey: string, creditId: string) {
    const k = `${cardKey}:${creditId}`;
    setUsed((prev) => ({ ...prev, [k]: !prev[k] }));
  }
  function toggleDontCare(cardKey: string, creditId: string) {
    const k = `${cardKey}:${creditId}`;
    setDontCare((prev) => ({ ...prev, [k]: !prev[k] }));
  }
  function toggleRemind(cardKey: string, creditId: string) {
    const k = `${cardKey}:${creditId}`;
    setRemind((prev) => ({ ...prev, [k]: !prev[k] }));
  }
  function notifyMeForThisCard() {
    setSavedCards((prev) => (prev.includes(activeCard.key) ? prev : [...prev, activeCard.key]));
  }

  // Card list: apply search + hard fee filter first, then render sections
  const baseFiltered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const inFeeRange = CARDS.filter((c) => c.annualFee >= feeMin && c.annualFee <= feeMax);
    const list = q
      ? inFeeRange.filter((c) => (c.name + " " + c.issuer).toLowerCase().includes(q))
      : inFeeRange.slice();
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [search, feeMin, feeMax]);

  const topPicksVisible = useMemo(() => {
    const q = search.trim();
    const isDefaultFeeRange = feeMin === feeBounds.min && feeMax === feeBounds.max;
    return q.length === 0 && isDefaultFeeRange;
  }, [search, feeMin, feeMax, feeBounds.min, feeBounds.max]);

  const topPicks = useMemo(() => {
    return pinnedOrder
      .map((k) => CARDS.find((c) => c.key === k))
      .filter(Boolean) as Card[];
  }, [pinnedOrder]);

  const tier3 = useMemo(() => baseFiltered.filter((c) => inTier(c, 500, 999999)), [baseFiltered]);
  const tier2 = useMemo(() => baseFiltered.filter((c) => inTier(c, 250, 499.99)), [baseFiltered]);
  const tier1 = useMemo(() => baseFiltered.filter((c) => inTier(c, 0, 249.99)), [baseFiltered]);

  function CardRow({
    card,
    showTopPickBadge,
  }: {
    card: Card;
    showTopPickBadge?: boolean;
  }) {
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
        <div className="relative mt-0.5 h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-black/30">
          <Image src={card.logo} alt={card.name} fill className="object-cover" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-sm font-semibold leading-5 line-clamp-2 text-white/95">
              {card.name}
            </div>
            {showTopPickBadge ? (
              <span className="shrink-0 rounded-full border border-amber-400/35 bg-amber-400/12 px-2 py-0.5 text-[10px] text-amber-100">
                Top pick
              </span>
            ) : null}
          </div>
          <div className="mt-0.5 text-xs text-white/55">
            Fee: {formatMoney(card.annualFee)} • Credits: {formatMoney(card.creditsTrackedAnnualized)}
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
    spotlight,
  }: {
    title: string;
    subtitle: string;
    cards: Card[];
    accent: "gold" | "slate" | "neutral";
    spotlight?: boolean;
  }) {
    if (cards.length === 0) return null;

    const headerBg =
      accent === "gold"
        ? "bg-amber-400/10 border-amber-400/20"
        : accent === "slate"
        ? "bg-sky-400/8 border-sky-400/18"
        : "bg-white/5 border-white/10";

    const titleColor =
      accent === "gold"
        ? "text-amber-100"
        : accent === "slate"
        ? "text-sky-100"
        : "text-white/90";

    return (
      <div className="border-t border-white/10">
        <div className={["px-3 py-2 border-b", headerBg, spotlight ? "bg-white/8" : ""].join(" ")}>
          <div className={["text-base font-semibold", titleColor].join(" ")}>{title}</div>
          <div className="text-xs text-white/50">{subtitle}</div>
        </div>
        {cards.map((c) => (
          <CardRow key={c.key} card={c} />
        ))}
      </div>
    );
  }

  // -------------------------
  // LEFT PANEL: Your Cards + picker
  // -------------------------
  const LeftPanel = (
    <aside className="lg:col-span-4">
      <div className={surfaceCardClass("p-4 lg:sticky lg:top-5")}>
        {/* Your Cards (saved) — placed ABOVE list */}
        <div className="rounded-2xl border border-white/10 bg-[#0F1218] p-4">
          <div className="text-lg font-semibold text-white/95">Your Cards</div>
          <div className="mt-1 text-xs text-white/55">
            Saved cards appear here (later: tied to your login).
          </div>

          <div className="mt-3 space-y-2">
            {savedCards.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-black/25 p-3 text-xs text-white/60">
                No saved cards yet. Pick a card below and click “Notify me”.
              </div>
            ) : (
              savedCards.map((k) => {
                const card = CARDS.find((c) => c.key === k);
                if (!card) return null;
                return (
                  <div
                    key={k}
                    className="flex items-start gap-3 rounded-xl border border-white/10 bg-black/25 p-3"
                  >
                    <div className="relative mt-0.5 h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-black/30">
                      <Image src={card.logo} alt={card.name} fill className="object-cover" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold leading-5 line-clamp-2">{card.name}</div>
                      <div className="mt-0.5 text-xs text-white/55">
                        Fee: {formatMoney(card.annualFee)}
                      </div>
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
          <div className="mt-1 text-xs text-white/55">
            Browse any card free. “Notify me” saves it to your dashboard.
          </div>

          <div className="mt-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search cards..."
              className="w-full rounded-xl border border-white/10 bg-[#0F1218] px-3 py-2 text-sm outline-none placeholder:text-white/30"
            />
          </div>

          {/* Hard fee filter */}
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

            <div className="mt-3 text-[11px] text-white/40">
              Hard filter affects browsing only. Quiz uses soft fee penalty.
            </div>
          </div>

          {/* Tiered list: taller + clearer */}
          <div className="mt-3 overflow-auto rounded-2xl border border-white/10 bg-[#0F1218] lg:max-h-[46vh]">
            {topPicksVisible ? (
              <div className="border-b border-white/10">
                <div className="px-3 py-2 bg-amber-400/8">
                  <div className="text-base font-semibold text-amber-100">Top Picks</div>
                  <div className="text-xs text-white/50">Your 3 highlighted cards</div>
                </div>
                {topPicks.map((c) => (
                  <CardRow key={c.key} card={c} showTopPickBadge />
                ))}
              </div>
            ) : null}

            <Section title="Tier 3" subtitle="$500+ annual fee" cards={tier3} accent="slate" />
            <Section title="Tier 2" subtitle="$250–$500 annual fee" cards={tier2} accent="neutral" />
            <Section title="Tier 1" subtitle="$0–$250 annual fee" cards={tier1} accent="neutral" />

            {baseFiltered.length === 0 ? (
              <div className="p-4 text-sm text-white/60">
                No cards match your search / fee filter.
              </div>
            ) : null}
          </div>

          <button
            onClick={notifyMeForThisCard}
            className="mt-4 w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black hover:bg-white/90"
            type="button"
          >
            Notify me for this card
          </button>

          <div className="mt-2 text-xs text-white/40">
            Free: save 1 card • Multi-card is $5 flat
          </div>
        </div>
      </div>
    </aside>
  );

  // -------------------------
  // MIDDLE: Credits
  // -------------------------
  const MiddlePanel = (
    <main className="lg:col-span-5">
      {/* Metric row (bigger numbers, clearer hierarchy) */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className={surfaceCardClass("p-4")}>
          <div className="text-xs text-white/55">Credits Redeemed</div>
          <div className="mt-2 text-3xl font-semibold text-emerald-100">
            {formatMoney(totals.totalRedeemed)}
          </div>
          <div className="mt-4 h-2 w-full rounded-full bg-black/30">
            <div
              className="h-2 rounded-full bg-emerald-400/80"
              style={{ width: `${totals.pct}%` }}
            />
          </div>
          <div className="mt-2 text-xs text-white/50">{totals.pct}% used</div>
        </div>

        <div className={surfaceCardClass("p-4")}>
          <div className="text-xs text-white/55">Total Credits Available</div>
          <div className="mt-2 text-3xl font-semibold text-white/95">
            {formatMoney(totals.totalAvail)}
          </div>
          <div className="mt-2 text-xs text-white/50">
            excludes credits marked “Don’t care”
          </div>
        </div>

        <div className={surfaceCardClass("p-4 border-red-400/15 bg-red-500/6")}>
          <div className="text-xs text-white/55">Annual Fee</div>
          <div className="mt-2 text-3xl font-semibold text-red-100">
            {formatMoney(activeCard.annualFee)}
          </div>
          <div className="mt-2 text-xs text-white/50">next: net value vs fee</div>
        </div>
      </div>

      {/* Active card header + credits list */}
      <div className={surfaceCardClass("mt-6 p-5")}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative h-12 w-12 overflow-hidden rounded-xl border border-white/10 bg-black/30">
              <Image src={activeCard.logo} alt={activeCard.name} fill className="object-cover" />
            </div>
            <div className="min-w-0">
              <div className="truncate text-xl font-semibold text-white/95">
                {activeCard.name}
              </div>
              <div className="mt-0.5 truncate text-sm text-white/55">
                Annual fee: {formatMoney(activeCard.annualFee)} • Credits tracked:{" "}
                {formatMoney(activeCard.creditsTrackedAnnualized)}
              </div>
            </div>
          </div>
          <div className="text-xs text-white/45 text-right">
            Status
            <br />
            Preview only
          </div>
        </div>

        <div className="mt-6">
          <div className="text-base font-semibold text-white/90">Credits</div>

          <div className="mt-4 space-y-3">
            {creditsSorted.map((c) => {
              const key = `${activeCard.key}:${c.id}`;
              const usedOn = !!used[key];
              const dontCareOn = !!dontCare[key];
              const remindOn = !!remind[key];

              return (
                <div
                  key={c.id}
                  className="rounded-2xl border border-white/10 bg-[#0F1218] p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-white/95">
                        {c.title}
                      </div>
                      <div className="mt-0.5 truncate text-xs text-white/55">
                        {creditSubtitle(c)}
                        {c.notes ? ` • ${c.notes}` : ""}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 sm:justify-end lg:flex-nowrap">
                      <button
                        className={pillClass(remindOn ? "on" : "off")}
                        onClick={() => toggleRemind(activeCard.key, c.id)}
                        type="button"
                      >
                        Remind
                      </button>
                      <button
                        className={pillClass(dontCareOn ? "warn" : "off")}
                        onClick={() => toggleDontCare(activeCard.key, c.id)}
                        type="button"
                      >
                        Don&apos;t care
                      </button>
                      <button
                        className={pillClass(usedOn ? "good" : "off")}
                        onClick={() => toggleUsed(activeCard.key, c.id)}
                        type="button"
                      >
                        Mark used
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {creditsSorted.length === 0 && (
              <div className="rounded-2xl border border-white/10 bg-[#0F1218] p-4 text-sm text-white/60">
                No credits found for this card.
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );

  // -------------------------
  // RIGHT: Points + Expiring soon only
  // -------------------------
  const RightPanel = (
    <aside className="lg:col-span-3">
      <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-5 shadow-[0_0_70px_rgba(0,0,0,0.55)]">
        <div className="text-lg font-semibold text-amber-100">Points / Cash Back</div>
        <div className="mt-1 text-xs text-amber-100/70">
          Category multipliers for the active card
        </div>

        <div className="mt-4 space-y-2">
          {activeCard.multipliers.map((m) => (
            <div
              key={m.label}
              className="flex items-center justify-between gap-3 rounded-xl border border-amber-200/15 bg-black/20 px-3 py-2"
            >
              <div className="text-sm font-medium text-amber-50/90 leading-5 line-clamp-2">
                {m.label}
              </div>
              <div className="shrink-0 text-sm font-semibold text-amber-50">
                {m.x}x
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Expiring soon directly under Points */}
      <div className={surfaceCardClass("mt-5 p-5 border-sky-300/12 bg-sky-500/5")}>
        <div className="text-lg font-semibold text-white/95">Expiring soon</div>
        <div className="mt-1 text-xs text-white/55">
          Shows credits marked “Remind” (and not Used / Don’t care). Next step: true date math.
        </div>

        <div className="mt-4 space-y-2">
          {expiringSoon.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-black/25 p-3 text-sm text-white/60">
              No reminders set yet. Toggle “Remind” on any credit.
            </div>
          ) : (
            expiringSoon.map((c) => (
              <div key={c.id} className="rounded-xl border border-white/10 bg-[#0F1218] p-3">
                <div className="text-sm font-semibold">{c.title}</div>
                <div className="mt-0.5 text-xs text-white/55">{creditSubtitle(c)}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </aside>
  );

  // -------------------------
  // QUIZ MODAL
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
              <div className="text-xl font-semibold text-white/95">Quick Fit Quiz</div>
              <div className="mt-1 text-sm text-white/55">
                Hard filter for browsing. Soft penalty for recommendations.
              </div>
            </div>
            <button
              onClick={() => setQuizOpen(false)}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80 hover:bg-white/10"
              type="button"
            >
              Close
            </button>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {(["dining", "travel", "groceries", "gas", "online", "other"] as SpendCategory[]).map(
              (cat) => (
                <div key={cat}>
                  <div className="text-xs text-white/50">{cat} / mo</div>
                  <input
                    type="number"
                    value={quiz.spend[cat]}
                    onChange={(e) =>
                      setQuiz((p) => ({
                        ...p,
                        spend: { ...p.spend, [cat]: Number(e.target.value || 0) },
                      }))
                    }
                    className="mt-1 w-full rounded-xl border border-white/10 bg-[#0F1218] px-3 py-2 text-sm outline-none"
                  />
                </div>
              )
            )}
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <div className="text-xs text-white/50">Annual fee tolerance</div>
              <input
                type="number"
                value={quiz.annualFeeTolerance}
                onChange={(e) =>
                  setQuiz((p) => ({
                    ...p,
                    annualFeeTolerance: Number(e.target.value || 0),
                  }))
                }
                className="mt-1 w-full rounded-xl border border-white/10 bg-[#0F1218] px-3 py-2 text-sm outline-none"
              />
            </div>
            <div>
              <div className="text-xs text-white/50">Credit usage %</div>
              <select
                value={quiz.creditUtilizationPct}
                onChange={(e) => setQuiz((p) => ({ ...p, creditUtilizationPct: Number(e.target.value) }))}
                className="mt-1 w-full rounded-xl border border-white/10 bg-[#0F1218] px-3 py-2 text-sm outline-none"
              >
                <option value={0.25}>25%</option>
                <option value={0.5}>50%</option>
                <option value={0.75}>75%</option>
                <option value={1}>100%</option>
              </select>
            </div>
          </div>

          <label className="mt-4 flex items-center gap-2 text-sm text-white/70">
            <input
              type="checkbox"
              checked={quiz.includeWelcomeBonus}
              onChange={(e) => setQuiz((p) => ({ ...p, includeWelcomeBonus: e.target.checked }))}
            />
            Include welcome bonus value (if any)
          </label>

          <div className="mt-5">
            <div className="text-base font-semibold text-white/90">Top matches</div>
            <div className="mt-3 space-y-3">
              {quizResults.map((r) => (
                <div key={r.card.key} className="rounded-2xl border border-white/10 bg-[#0F1218] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold leading-5 line-clamp-2">
                        {r.card.name}
                      </div>
                      <div className="mt-1 text-sm text-white/60">
                        Est annual value: {formatMoney(r.estAnnualValue)} • Score: {formatMoney(r.score)}
                      </div>
                    </div>
                    <div className="shrink-0 text-xs text-white/50">
                      Fee {formatMoney(r.card.annualFee)}
                    </div>
                  </div>

                  <div className="mt-3 space-y-1 text-xs text-white/55">
                    {r.breakdown.slice(0, 4).map((b) => (
                      <div key={b}>• {b}</div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 text-xs text-white/45">
              Next: add AI explanation text + “what to do next this month” checklist.
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // -------------------------
  // PAGE
  // -------------------------
  return (
    <div className="min-h-screen bg-[#0A0C10] text-white">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-2xl font-semibold text-white/95">ClawBack</div>
            <div className="text-sm text-white/55">
              No bank logins. No SSN. Just credits, reminders, and savings.
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-sm">
            <button
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-white/80 hover:bg-white/10"
              type="button"
            >
              Login (mock)
            </button>
            <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-white/70">
              Founder off
            </div>
            <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-white/70">
              Plan: Free
            </div>

            {/* ✅ Quiz “tab” next to Free */}
            <button
              onClick={() => setQuizOpen(true)}
              className="rounded-full border border-amber-300/25 bg-amber-300/10 px-4 py-2 text-amber-100 hover:bg-amber-300/15"
              type="button"
            >
              Quiz
            </button>

            <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-white/70">
              ← Back
            </div>
          </div>
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
                mobileView === t.key
                  ? "border-white/20 bg-white/10 text-white"
                  : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10",
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

      {QuizModal}
    </div>
  );
}
