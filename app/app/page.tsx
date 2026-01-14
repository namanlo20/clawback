// app/app/page.tsx
"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import { CARDS, type Card, type Credit, type CreditFrequency } from "../../data/cards";

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
  const parts = [
    `${freqLabel(c.frequency)} • ${formatMoney(c.amount)}`,
    `Annualized: ${formatMoney(a)}`,
  ];
  return parts.join(" • ");
}

function pillClass(kind: "off" | "on" | "warn" | "good"): string {
  const base = "rounded-full border px-3 py-1 text-xs font-medium transition whitespace-nowrap";
  if (kind === "on") return `${base} border-emerald-500/30 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/15`;
  if (kind === "warn") return `${base} border-amber-500/30 bg-amber-500/10 text-amber-200 hover:bg-amber-500/15`;
  if (kind === "good") return `${base} border-sky-500/30 bg-sky-500/10 text-sky-200 hover:bg-sky-500/15`;
  return `${base} border-white/10 bg-white/5 text-white/80 hover:bg-white/10`;
}

function statCardClass(tone: "green" | "gray" | "red"): string {
  const base = "rounded-2xl border p-4 shadow-[0_0_60px_rgba(0,0,0,0.45)]";
  if (tone === "green") return `${base} border-emerald-500/15 bg-emerald-500/10`;
  if (tone === "red") return `${base} border-red-500/15 bg-red-500/10`;
  return `${base} border-white/10 bg-white/5`;
}

export default function AppDashboardPage() {
  const pinnedKeys = new Set<Card["key"]>([
    "amex-platinum",
    "chase-sapphire-reserve",
    "capitalone-venture-x",
  ]);

  const [search, setSearch] = useState("");
  const [activeCardKey, setActiveCardKey] = useState<Card["key"]>("amex-platinum");

  // mock saved cards
  const [savedCards, setSavedCards] = useState<string[]>([]);

  // composite-key states so nothing collides across cards
  const [used, setUsed] = useState<ToggleState>({});
  const [dontCare, setDontCare] = useState<ToggleState>({});
  const [remind, setRemind] = useState<ToggleState>({});

  const activeCard = useMemo(
    () => CARDS.find((c) => c.key === activeCardKey) ?? CARDS[0],
    [activeCardKey]
  );

  const filteredCards = useMemo(() => {
    const q = search.trim().toLowerCase();
    const cards = CARDS.slice().sort((a, b) => {
      const ap = pinnedKeys.has(a.key) ? 0 : 1;
      const bp = pinnedKeys.has(b.key) ? 0 : 1;
      if (ap !== bp) return ap - bp;
      return a.name.localeCompare(b.name);
    });
    if (!q) return cards;
    return cards.filter((c) => (c.name + " " + c.issuer).toLowerCase().includes(q));
  }, [search, pinnedKeys]);

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
      const isDontCare = !!dontCare[k];
      const isUsed = !!used[k];
      const a = annualize(c.amount, c.frequency);

      if (!isDontCare) totalAvail += a;
      if (!isDontCare && isUsed) totalRedeemed += a;
    }

    const pct = totalAvail <= 0 ? 0 : Math.min(100, Math.round((totalRedeemed / totalAvail) * 100));
    return { totalAvail, totalRedeemed, pct };
  }, [creditsSorted, activeCard.key, dontCare, used]);

  const expiringSoon = useMemo(() => {
    // v1: remind-only, excludes used/don't care (date math is next step)
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

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-7xl px-5 py-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <div className="text-xl font-semibold">ClawBack</div>
            <div className="text-sm text-white/60">No bank logins. No SSN. Just credits, reminders, and savings.</div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Login (mock)</div>
            <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Founder off</div>
            <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Plan: Free</div>
            <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1">← Back</div>
          </div>
        </div>

        {/* 12-col layout so middle is wider */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* LEFT */}
          <aside className="lg:col-span-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_0_60px_rgba(0,0,0,0.45)]">
              <div className="text-sm font-semibold">Choose your card</div>
              <div className="mt-1 text-xs text-white/60">Browse any card free. “Notify me” saves it to your dashboard.</div>

              <div className="mt-3">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search cards..."
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none placeholder:text-white/30"
                />
              </div>

              <div className="mt-3 max-h-[440px] overflow-auto rounded-xl border border-white/10">
                {filteredCards.map((card) => {
                  const active = card.key === activeCard.key;
                  const pinned = pinnedKeys.has(card.key);
                  return (
                    <button
                      key={card.key}
                      onClick={() => setActiveCardKey(card.key)}
                      className={[
                        "flex w-full items-center gap-3 px-3 py-3 text-left transition",
                        active ? "bg-white/10" : "hover:bg-white/5",
                        pinned ? "border-l-2 border-amber-400/60" : "border-l-2 border-transparent",
                      ].join(" ")}
                      type="button"
                    >
                      <div className="relative h-9 w-9 overflow-hidden rounded-lg border border-white/10 bg-black/30">
                        <Image src={card.logo} alt={card.name} fill className="object-cover" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <div className="truncate text-sm font-semibold">{card.name}</div>
                          {pinned && (
                            <span className="shrink-0 rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[10px] text-amber-200">
                              Top pick
                            </span>
                          )}
                        </div>
                        <div className="truncate text-xs text-white/60">
                          Fee: {formatMoney(card.annualFee)} • Credits: {formatMoney(card.creditsTrackedAnnualized)}
                        </div>
                      </div>

                      <div className="text-[10px] text-white/40">{active ? "Viewing" : ""}</div>
                    </button>
                  );
                })}
              </div>

              <button
                onClick={notifyMeForThisCard}
                className="mt-4 w-full rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-white/90"
                type="button"
              >
                Notify me for this card
              </button>

              <div className="mt-2 text-xs text-white/40">Free: save 1 card • Multi-card is $5 flat</div>
            </div>
          </aside>

          {/* MIDDLE (wider) */}
          <main className="lg:col-span-6 xl:col-span-7">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className={statCardClass("green")}>
                <div className="text-xs text-white/60">Credits Redeemed (Active Card)</div>
                <div className="mt-1 text-2xl font-semibold">{formatMoney(totals.totalRedeemed)}</div>
                <div className="mt-3 h-2 w-full rounded-full bg-black/40">
                  <div className="h-2 rounded-full bg-emerald-400/70" style={{ width: `${totals.pct}%` }} />
                </div>
                <div className="mt-2 text-xs text-white/50">{totals.pct}% used</div>
              </div>

              <div className={statCardClass("gray")}>
                <div className="text-xs text-white/60">Total Credits Available (Active Card)</div>
                <div className="mt-1 text-2xl font-semibold">{formatMoney(totals.totalAvail)}</div>
                <div className="mt-2 text-xs text-white/50">excludes credits marked “Don’t care”</div>
              </div>

              <div className={statCardClass("red")}>
                <div className="text-xs text-white/60">Annual Fee (Active Card)</div>
                <div className="mt-1 text-2xl font-semibold">{formatMoney(activeCard.annualFee)}</div>
                <div className="mt-2 text-xs text-white/50">next: net value vs fee</div>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_0_60px_rgba(0,0,0,0.45)]">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="relative h-12 w-12 overflow-hidden rounded-xl border border-white/10 bg-black/30">
                    <Image src={activeCard.logo} alt={activeCard.name} fill className="object-cover" />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-lg font-semibold">{activeCard.name}</div>
                    <div className="truncate text-xs text-white/60">
                      Annual fee: {formatMoney(activeCard.annualFee)} • Credits tracked (annualized):{" "}
                      {formatMoney(activeCard.creditsTrackedAnnualized)}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-white/50">
                  Status
                  <br />
                  Preview only
                </div>
              </div>

              <div className="mt-5">
                <div className="text-sm font-semibold">Credits (Active Card)</div>

                <div className="mt-3 space-y-3">
                  {creditsSorted.map((c) => {
                    const key = `${activeCard.key}:${c.id}`;
                    const usedOn = !!used[key];
                    const dontCareOn = !!dontCare[key];
                    const remindOn = !!remind[key];

                    return (
                      <div key={c.id} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                        {/* ALL BUTTONS ON ONE LINE */}
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-white">{c.title}</div>
                            <div className="mt-0.5 truncate text-xs text-white/60">
                              {creditSubtitle(c)}
                              {c.notes ? ` • ${c.notes}` : ""}
                            </div>
                          </div>

                          <div className="flex shrink-0 flex-nowrap items-center gap-2">
                            <button className={pillClass(remindOn ? "on" : "off")} onClick={() => toggleRemind(activeCard.key, c.id)} type="button">
                              Remind
                            </button>
                            <button className={pillClass(dontCareOn ? "warn" : "off")} onClick={() => toggleDontCare(activeCard.key, c.id)} type="button">
                              Don&apos;t care
                            </button>
                            <button className={pillClass(usedOn ? "good" : "off")} onClick={() => toggleUsed(activeCard.key, c.id)} type="button">
                              Mark used
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {creditsSorted.length === 0 && (
                    <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/60">
                      No credits found for this card.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </main>

          {/* RIGHT */}
          <aside className="lg:col-span-3 xl:col-span-2">
            <div className="rounded-2xl border border-amber-400/25 bg-amber-400/10 p-4 shadow-[0_0_60px_rgba(0,0,0,0.45)]">
              <div className="text-sm font-semibold text-amber-100">Points / Cash Back</div>
              <div className="mt-1 text-xs text-amber-100/70">Category multipliers for the active card</div>

              <div className="mt-4 space-y-2">
                {activeCard.multipliers.map((m) => (
                  <div key={m.label} className="flex items-center justify-between rounded-xl border border-amber-200/15 bg-black/20 px-3 py-2">
                    <div className="text-xs text-amber-50/90">{m.label}</div>
                    <div className="text-xs font-semibold text-amber-50">{m.x}x</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_0_60px_rgba(0,0,0,0.45)]">
              <div className="text-sm font-semibold">Expiring soon</div>
              <div className="mt-1 text-xs text-white/60">
                Shows credits marked “Remind” (and not Used / Don’t care). Next step: true date math.
              </div>

              <div className="mt-3 space-y-2">
                {expiringSoon.length === 0 ? (
                  <div className="rounded-xl border border-white/10 bg-black/30 p-3 text-xs text-white/60">
                    No reminders set yet for this card. Toggle “Remind” on any credit.
                  </div>
                ) : (
                  expiringSoon.map((c) => (
                    <div key={c.id} className="rounded-xl border border-white/10 bg-black/30 p-3">
                      <div className="text-xs font-semibold">{c.title}</div>
                      <div className="mt-0.5 text-[11px] text-white/60">{creditSubtitle(c)}</div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_0_60px_rgba(0,0,0,0.45)]">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold">Your Dashboard Cards</div>
                  <div className="mt-1 text-xs text-white/60">
                    Saved cards are what you’ll get reminders for (once Supabase + email/SMS is added).
                  </div>
                </div>
                <div className="rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs text-red-200">
                  {formatMoney(0)}
                </div>
              </div>

              <div className="mt-3 space-y-2">
                {savedCards.length === 0 ? (
                  <div className="rounded-xl border border-white/10 bg-black/30 p-3 text-xs text-white/60">
                    No saved cards yet. Pick a card on the left and click “Notify me for this card”.
                  </div>
                ) : (
                  savedCards.map((k) => {
                    const card = CARDS.find((c) => c.key === k);
                    if (!card) return null;
                    return (
                      <div key={k} className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 p-3">
                        <div className="relative h-8 w-8 overflow-hidden rounded-lg border border-white/10 bg-black/30">
                          <Image src={card.logo} alt={card.name} fill className="object-cover" />
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-xs font-semibold">{card.name}</div>
                          <div className="truncate text-[11px] text-white/60">Fee: {formatMoney(card.annualFee)}</div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="mt-3 text-[11px] text-white/40">
                Next: Supabase login + persistence, then reminder scheduling (email + SMS).
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
