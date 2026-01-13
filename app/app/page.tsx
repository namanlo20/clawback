"use client";

import { useMemo, useState } from "react";

type CardKey = "amex_platinum" | "csr" | "hilton_aspire";

type Credit = {
  id: string;
  name: string;
  amount: number;
  frequency: "Monthly" | "Quarterly" | "Semi-Annual" | "Annual";
  nextExpiryLabel: string;
};

type Card = {
  key: CardKey;
  name: string;
  annualFee: number;
  credits: Credit[];
};

const CATALOG: Card[] = [
  {
    key: "amex_platinum",
    name: "Amex Platinum",
    annualFee: 895,
    credits: [
      { id: "plat_uber", name: "Uber Cash", amount: 200, frequency: "Monthly", nextExpiryLabel: "Jan 31" },
      { id: "plat_ent", name: "Entertainment", amount: 300, frequency: "Monthly", nextExpiryLabel: "Jan 31" },
      { id: "plat_saks", name: "Saks", amount: 100, frequency: "Semi-Annual", nextExpiryLabel: "Jun 30" },
      { id: "plat_airline", name: "Airline Incidental Fees", amount: 200, frequency: "Annual", nextExpiryLabel: "Dec 31" },
    ],
  },
  {
    key: "csr",
    name: "Chase Sapphire Reserve",
    annualFee: 795,
    credits: [
      { id: "csr_travel", name: "Travel Credit", amount: 300, frequency: "Annual", nextExpiryLabel: "Renewal" },
      { id: "csr_dining", name: "Dining Credit", amount: 300, frequency: "Semi-Annual", nextExpiryLabel: "Jun 30" },
      { id: "csr_stubhub", name: "StubHub Credit", amount: 300, frequency: "Semi-Annual", nextExpiryLabel: "Jun 30" },
    ],
  },
  {
    key: "hilton_aspire",
    name: "Hilton Aspire",
    annualFee: 550,
    credits: [
      { id: "hilton_resort", name: "Hilton Resort Credit", amount: 400, frequency: "Semi-Annual", nextExpiryLabel: "Jun 30" },
      { id: "hilton_air", name: "Airline Credit", amount: 200, frequency: "Quarterly", nextExpiryLabel: "Mar 31" },
    ],
  },
];

export default function AppDashboard() {
  const [selectedCards, setSelectedCards] = useState<CardKey[]>(["amex_platinum", "csr"]);
  const [used, setUsed] = useState<Record<string, boolean>>({ csr_dining: true });

  const selectedCatalog = useMemo(() => {
    return CATALOG.filter((c) => selectedCards.includes(c.key));
  }, [selectedCards]);

  const totals = useMemo(() => {
    const allCredits = selectedCatalog.flatMap((c) => c.credits);
    const totalPossible = allCredits.reduce((sum, x) => sum + x.amount, 0);
    const totalUsed = allCredits.reduce((sum, x) => sum + (used[x.id] ? x.amount : 0), 0);
    return { totalPossible, totalUsed };
  }, [selectedCatalog, used]);

  function toggleCard(key: CardKey) {
    setSelectedCards((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }

  function toggleUsed(creditId: string) {
    setUsed((prev) => ({ ...prev, [creditId]: !prev[creditId] }));
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-semibold tracking-tight">ClawBack</div>
            <div className="text-sm text-white/60">
              Track credits. Mark used. Never waste money again.
            </div>
          </div>

          <a
            href="/"
            className="rounded-xl border border-white/20 px-4 py-2 text-sm hover:bg-white/10"
          >
            ← Back
          </a>
        </div>

        {/* top stats */}
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-white/15 bg-white/5 p-5">
            <div className="text-xs text-white/60">Credits Redeemed</div>
            <div className="mt-1 text-2xl font-semibold">${totals.totalUsed.toLocaleString()}</div>
          </div>
          <div className="rounded-3xl border border-white/15 bg-white/5 p-5">
            <div className="text-xs text-white/60">Total Credits Available</div>
            <div className="mt-1 text-2xl font-semibold">${totals.totalPossible.toLocaleString()}</div>
          </div>
          <div className="rounded-3xl border border-white/15 bg-white/5 p-5">
            <div className="text-xs text-white/60">Your “Win Rate”</div>
            <div className="mt-1 text-2xl font-semibold">
              {totals.totalPossible === 0 ? "—" : Math.round((totals.totalUsed / totals.totalPossible) * 100) + "%"}
            </div>
          </div>
        </div>

        {/* card picker */}
        <div className="mt-8 rounded-3xl border border-white/15 bg-white/5 p-6">
          <div className="text-sm font-medium text-white/80">Your Cards</div>
          <div className="mt-4 flex flex-wrap gap-3">
            {CATALOG.map((c) => {
              const active = selectedCards.includes(c.key);
              return (
                <button
                  key={c.key}
                  onClick={() => toggleCard(c.key)}
                  className={[
                    "rounded-2xl px-4 py-2 text-sm transition",
                    active
                      ? "bg-white text-black"
                      : "border border-white/20 text-white hover:bg-white/10",
                  ].join(" ")}
                >
                  {c.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* credits tables */}
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {selectedCatalog.map((card) => {
            const cardTotal = card.credits.reduce((sum, x) => sum + x.amount, 0);
            const cardUsed = card.credits.reduce((sum, x) => sum + (used[x.id] ? x.amount : 0), 0);
            const pct = cardTotal === 0 ? 0 : Math.round((cardUsed / cardTotal) * 100);

            return (
              <div
                key={card.key}
                className="rounded-3xl border border-white/15 bg-gradient-to-b from-white/10 to-white/5 p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-lg font-semibold">{card.name}</div>
                    <div className="text-xs text-white/60">
                      Annual fee: ${card.annualFee} • Credits tracked: ${cardTotal}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs text-white/60">Redeemed</div>
                    <div className="text-lg font-semibold">
                      ${cardUsed} / ${cardTotal}
                    </div>
                  </div>
                </div>

                {/* progress */}
                <div className="mt-4">
                  <div className="h-2 w-full rounded-full bg-white/10">
                    <div
                      className="h-2 rounded-full bg-emerald-400"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="mt-1 text-xs text-white/60">{pct}% used</div>
                </div>

                <div className="mt-5 space-y-3">
                  {card.credits.map((credit) => {
                    const checked = !!used[credit.id];
                    return (
                      <button
                        key={credit.id}
                        onClick={() => toggleUsed(credit.id)}
                        className={[
                          "w-full rounded-2xl border px-4 py-3 text-left transition",
                          checked
                            ? "border-emerald-400/30 bg-emerald-400/10"
                            : "border-white/10 bg-black/30 hover:bg-white/5",
                        ].join(" ")}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm">{credit.name}</div>
                            <div className="text-xs text-white/60">
                              {credit.frequency} • Expires: {credit.nextExpiryLabel}
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="text-sm font-semibold">${credit.amount}</div>
                            <div className="text-xs">
                              {checked ? "Used ✅" : "Not used"}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-10 text-xs text-white/50">
          Next upgrades: reminders (email + SMS), phone verification, and AI card recommendations.
        </div>
      </div>
    </main>
  );
}