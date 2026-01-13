"use client";

import { useMemo, useState } from "react";
import { CARDS, DEFAULT_POINT_VALUES_USD, type Card } from "../../data/cards";

function money(n: number) {
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function sumCredits(card: Card) {
  return card.credits.reduce((s, c) => s + (c.amountAnnual || 0), 0);
}

export default function DashboardPage() {
  const [selectedKeys, setSelectedKeys] = useState<string[]>([
    "platinum_card",
    "chase_sapphire_reserve",
  ]);

  // used state is per-credit toggle for now (annualized)
  const [used, setUsed] = useState<Record<string, boolean>>({
    csr_dining: true, // example seed
  });

  const [hiddenCredit, setHiddenCredit] = useState<Record<string, boolean>>({});

  const [pointValue, setPointValue] = useState<Record<string, number>>(
    DEFAULT_POINT_VALUES_USD
  );

  const selectedCards = useMemo(
    () => CARDS.filter((c) => selectedKeys.includes(c.key)),
    [selectedKeys]
  );

  const totals = useMemo(() => {
    const allCredits = selectedCards.flatMap((c) =>
      c.credits.filter((cr) => !hiddenCredit[cr.id])
    );
    const totalPossible = allCredits.reduce((s, x) => s + x.amountAnnual, 0);
    const totalUsed = allCredits.reduce(
      (s, x) => s + (used[x.id] ? x.amountAnnual : 0),
      0
    );
    return { totalPossible, totalUsed };
  }, [selectedCards, used, hiddenCredit]);

  function toggleSelected(cardKey: string) {
    setSelectedKeys((prev) =>
      prev.includes(cardKey) ? prev.filter((k) => k !== cardKey) : [...prev, cardKey]
    );
  }

  function toggleUsed(creditId: string) {
    setUsed((prev) => ({ ...prev, [creditId]: !prev[creditId] }));
  }

  function toggleHidden(creditId: string) {
    setHiddenCredit((prev) => ({ ...prev, [creditId]: !prev[creditId] }));
  }

  function bonusValueUSD(card: Card) {
    if (!card.welcomeOffer) return 0;
    const v = pointValue[card.welcomeOffer.currency] ?? 0.01;
    return card.welcomeOffer.amount * v;
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-7xl px-6 py-10">
        {/* header */}
        <div className="flex items-center justify-between gap-6">
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

        {/* trackers */}
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-5">
            <div className="text-xs text-white/70">Credits Redeemed</div>
            <div className="mt-1 text-2xl font-semibold">
              ${money(totals.totalUsed)}
            </div>
            <div className="mt-2 h-2 w-full rounded-full bg-white/10">
              <div
                className="h-2 rounded-full bg-emerald-400"
                style={{
                  width:
                    totals.totalPossible === 0
                      ? "0%"
                      : `${Math.round((totals.totalUsed / totals.totalPossible) * 100)}%`,
                }}
              />
            </div>
            <div className="mt-1 text-xs text-white/60">
              {totals.totalPossible === 0
                ? "—"
                : `${Math.round((totals.totalUsed / totals.totalPossible) * 100)}% used`}
            </div>
          </div>

          <div className="rounded-3xl border border-white/15 bg-white/5 p-5">
            <div className="text-xs text-white/60">Total Credits Available</div>
            <div className="mt-1 text-2xl font-semibold">
              ${money(totals.totalPossible)}
            </div>
            <div className="mt-1 text-xs text-white/50">
              (based on selected cards + credits tracked)
            </div>
          </div>

          <div className="rounded-3xl border border-red-400/20 bg-red-400/10 p-5">
            <div className="text-xs text-white/70">Annual Fees (Selected Cards)</div>
            <div className="mt-1 text-2xl font-semibold">
              $
              {money(
                selectedCards.reduce((s, c) => s + (c.annualFee || 0), 0)
              )}
            </div>
            <div className="mt-1 text-xs text-white/60">
              Later: pro-rate fees + show net value per month.
            </div>
          </div>
        </div>

        {/* Card picker */}
        <div className="mt-8 rounded-3xl border border-white/15 bg-white/5 p-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-sm font-medium text-white/80">Your Cards</div>
              <div className="text-xs text-white/50">
                Select which cards show up on your dashboard.
              </div>
            </div>

            <a
              href="/recommend"
              className="inline-flex w-fit items-center justify-center rounded-xl border border-white/20 px-4 py-2 text-sm hover:bg-white/10"
            >
              🤖 AI Recommendation (next)
            </a>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {CARDS.map((c) => {
              const active = selectedKeys.includes(c.key);
              const creditsTotal = sumCredits(c);
              const bonusUSD = bonusValueUSD(c);
              const firstYearNet = creditsTotal + bonusUSD - (c.annualFee || 0);

              return (
                <button
                  key={c.key}
                  onClick={() => toggleSelected(c.key)}
                  className={[
                    "rounded-3xl border p-5 text-left transition",
                    active
                      ? "border-white/30 bg-white/10"
                      : "border-white/10 bg-black/20 hover:bg-white/5",
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-lg font-semibold">{c.name}</div>
                      <div className="mt-1 text-xs text-white/60">
                        Annual fee: ${money(c.annualFee || 0)} • Credits tracked: $
                        {money(creditsTotal)}
                      </div>

                      {c.welcomeOffer && (
                        <div className="mt-2 text-xs text-white/70">
                          <span className="font-medium">Welcome bonus:</span>{" "}
                          {money(c.welcomeOffer.amount)} {c.welcomeOffer.currency} •{" "}
                          {c.welcomeOffer.spend}
                          <span className="text-white/50">
                            {" "}
                            • Est. ${money(bonusUSD)}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="text-right">
                      <div className="text-xs text-white/60">
                        First-year net (est.)
                      </div>
                      <div className="text-lg font-semibold">
                        {firstYearNet >= 0 ? "+" : "−"}$
                        {money(Math.abs(firstYearNet))}
                      </div>
                      <div className="text-[11px] text-white/45">
                        credits + bonus − fee
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 text-xs text-white/50">
                    {active ? "✅ On dashboard" : "Click to add to dashboard"}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Valuations */}
        <div className="mt-8 rounded-3xl border border-white/15 bg-white/5 p-6">
          <div className="text-sm font-medium text-white/80">
            Point value assumptions
          </div>
          <div className="mt-1 text-xs text-white/50">
            Editable. Used only for bonus $ estimates.
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(pointValue).map(([k, v]) => (
              <label
                key={k}
                className="rounded-2xl border border-white/10 bg-black/20 p-4"
              >
                <div className="text-xs text-white/60">{k} value (USD per point)</div>
                <input
                  value={String(v)}
                  onChange={(e) =>
                    setPointValue((prev) => ({
                      ...prev,
                      [k]: Math.max(0, Number(e.target.value || 0)),
                    }))
                  }
                  className="mt-2 w-full rounded-xl border border-white/15 bg-black px-3 py-2 text-sm outline-none"
                  inputMode="decimal"
                />
              </label>
            ))}
          </div>
        </div>

        {/* Card dashboards */}
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {selectedCards.map((card) => {
            const cardCredits = card.credits.filter((cr) => !hiddenCredit[cr.id]);
            const cardTotal = cardCredits.reduce((s, x) => s + x.amountAnnual, 0);
            const cardUsed = cardCredits.reduce(
              (s, x) => s + (used[x.id] ? x.amountAnnual : 0),
              0
            );
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
                      Annual fee: ${money(card.annualFee || 0)} • Credits tracked: $
                      {money(cardTotal)}
                    </div>

                    {card.welcomeOffer && (
                      <div className="mt-2 text-xs text-white/70">
                        <span className="font-medium">Welcome bonus:</span>{" "}
                        {money(card.welcomeOffer.amount)} {card.welcomeOffer.currency} •{" "}
                        {card.welcomeOffer.spend}
                        <span className="text-white/50">
                          {" "}
                          • Est. ${money(bonusValueUSD(card))}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="text-right">
                    <div className="text-xs text-white/60">Redeemed</div>
                    <div className="text-lg font-semibold">
                      ${money(cardUsed)} / ${money(cardTotal)}
                    </div>
                  </div>
                </div>

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
                    const isHidden = !!hiddenCredit[credit.id];
                    const checked = !!used[credit.id];

                    return (
                      <div
                        key={credit.id}
                        className={[
                          "w-full rounded-2xl border px-4 py-3 transition",
                          checked
                            ? "border-emerald-400/30 bg-emerald-400/10"
                            : "border-white/10 bg-black/30",
                          isHidden ? "opacity-50" : "",
                        ].join(" ")}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <button
                            onClick={() => toggleUsed(credit.id)}
                            className="flex-1 text-left"
                            disabled={isHidden}
                            title={isHidden ? "Unhide this credit to track it" : "Toggle used"}
                          >
                            <div className="text-sm">{credit.name}</div>
                            <div className="text-xs text-white/60">
                              {credit.frequency} • Annual value: $
                              {money(credit.amountAnnual)}
                            </div>
                            <div className="mt-1 text-xs">
                              {isHidden ? "Hidden" : checked ? "Used ✅" : "Not used"}
                            </div>
                          </button>

                          <button
                            onClick={() => toggleHidden(credit.id)}
                            className="rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-xs hover:bg-white/10"
                          >
                            {isHidden ? "Unhide" : "Hide"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-10 text-xs text-white/50">
          Next upgrades: per-month/quarter tracking + reminders (email/SMS) + AI quiz recommendations.
        </div>
      </div>
    </main>
  );
}
