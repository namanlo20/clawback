// data/cards.ts

export type Credit = {
  id: string;
  name: string;
  frequency: "monthly" | "quarterly" | "semiannual" | "annual" | "one-time";
  amountAnnual: number;

  // NEW: renewal date (simple v1)
  renews?: { month: number; day: number };
};

export type Multiplier = {
  label: string;   // e.g. "Dining"
  rate: string;    // e.g. "4x", "3x", "5% up to $X"
};

export type Card = {
  key: string;
  name: string;
  annualFee: number;
  credits: Credit[];
  welcomeOffer?: {
    amount: number;
    currency: string;
    spend: string;
    sourceLabel: string;
    notes?: string;
  };

  // NEW: points / cashback categories
  multipliers?: Multiplier[];
};
