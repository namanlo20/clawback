// data/cards.ts
// Pure static data only (client-safe). No fs/xlsx/server imports.

export type CreditFrequency =
  | "monthly"
  | "quarterly"
  | "semiannual"
  | "annual"
  | "one-time"
  | "every_4_years"
  | "every_5_years";

export type Credit = {
  id: string;
  name: string;
  frequency: CreditFrequency;

  // Amount per period (what the user should see first)
  // e.g. quarterly credit = 75
  amount: number;

  // Annualized (used for totals/progress math)
  amountAnnual: number;

  // Renewal date (simple v1). Month 1-12, day 1-31.
  renews?: { month: number; day: number };
};

export type Multiplier = {
  label: string; // e.g. "Dining"
  rate: string;  // e.g. "4x", "3x", "5% up to $X"
};

export type WelcomeOffer = {
  amount: number;
  currency: string;
  spend: string;
  sourceLabel: string;
  notes?: string;
};

export type Card = {
  key: string;
  name: string;
  annualFee: number;
  credits: Credit[];

  multipliers?: Multiplier[];
  welcomeOffer?: WelcomeOffer;

  // Put images in /public/logos and reference like "/logos/amex.png"
  logo?: string;
};

export const DEFAULT_POINT_VALUES_USD: Record<string, number> = {
  MR: 0.015,
  UR: 0.015,
  C1: 0.012,
  HILTON: 0.005,
  MARRIOTT: 0.007,
  SKY: 0.012,
  CITI: 0.013,
  AA: 0.013,
  CASH: 1.0,
};

// Helper for quick per-period math (keeps file readable)
function perPeriodAmount(frequency: CreditFrequency, annualized: number) {
  if (frequency === "monthly") return Math.round(annualized / 12);
  if (frequency === "quarterly") return Math.round(annualized / 4);
  if (frequency === "semiannual") return Math.round(annualized / 2);
  return annualized;
}

// ✅ Top 3 keys (match the UI pinning)
export const CARDS: Card[] = [
  // =========================
  // TOP 3
  // =========================

  {
    key: "amex_platinum",
    name: "Platinum Card",
    annualFee: 895,
    logo: "/logos/amex.png",
    credits: [
      { id: "plat_airline_incidental", name: "Airline Incidental Fees", frequency: "annual", amountAnnual: 200, amount: perPeriodAmount("annual", 200), renews: { month: 1, day: 1 } },
      { id: "plat_clear_plus", name: "Clear Plus", frequency: "annual", amountAnnual: 209, amount: perPeriodAmount("annual", 209), renews: { month: 1, day: 1 } },
      { id: "plat_digital_entertainment", name: "Digital Entertainment", frequency: "monthly", amountAnnual: 300, amount: 25, renews: { month: 1, day: 1 } }, // $25/mo
      { id: "plat_fhr_hotel_collection", name: "Fine Hotels + Resorts / The Hotel Collection", frequency: "semiannual", amountAnnual: 600, amount: 300, renews: { month: 1, day: 1 } }, // $300 twice/year
      { id: "plat_lululemon", name: "Lululemon", frequency: "quarterly", amountAnnual: 300, amount: 75, renews: { month: 1, day: 1 } }, // ✅ per your note: $75 quarterly
      { id: "plat_oura", name: "Oura Ring", frequency: "annual", amountAnnual: 200, amount: 200, renews: { month: 1, day: 1 } },
      { id: "plat_resy", name: "Resy Restaurants", frequency: "quarterly", amountAnnual: 400, amount: 100, renews: { month: 1, day: 1 } },
      { id: "plat_saks", name: "Saks", frequency: "semiannual", amountAnnual: 100, amount: 50, renews: { month: 1, day: 1 } },
      { id: "plat_uber_one", name: "Uber One Subscription", frequency: "annual", amountAnnual: 120, amount: 120, renews: { month: 1, day: 1 } },

      // Uber Cash: keep split so your totals match your sheet
      { id: "plat_uber_cash_jan_nov", name: "Uber Cash (Jan–Nov)", frequency: "monthly", amountAnnual: 165, amount: 15, renews: { month: 1, day: 1 } }, // $15/mo for 11 months
      { id: "plat_uber_cash_dec", name: "Uber Cash (Dec)", frequency: "monthly", amountAnnual: 25, amount: 25, renews: { month: 12, day: 1 } }, // $25 in Dec

      { id: "plat_equinox", name: "Equinox", frequency: "annual", amountAnnual: 300, amount: 300, renews: { month: 1, day: 1 } },
      { id: "plat_walmart_plus", name: "Walmart+ Subscription", frequency: "monthly", amountAnnual: 155, amount: 13, renews: { month: 1, day: 1 } }, // ~$13/mo (approx)
    ],
    multipliers: [
      { label: "Flights booked direct / Amex Travel", rate: "5x" },
      { label: "Prepaid hotels on AmexTravel", rate: "5x" },
      { label: "Everything else", rate: "1x" },
    ],
  },

  {
    key: "chase_sapphire_reserve",
    name: "Chase Sapphire Reserve",
    annualFee: 795,
    logo: "/logos/chase.png",
    credits: [
      { id: "csr_travel_credit", name: "Travel Credit", frequency: "annual", amountAnnual: 300, amount: 300, renews: { month: 1, day: 1 } },

      { id: "csr_dd_restaurant", name: "DoorDash Restaurant", frequency: "monthly", amountAnnual: 60, amount: 5, renews: { month: 1, day: 1 } },
      { id: "csr_dd_retail_3x", name: "DoorDash Retail ($10/mo) — 3x bucket", frequency: "monthly", amountAnnual: 120, amount: 10, renews: { month: 1, day: 1 } },
      { id: "csr_dd_retail_1x", name: "DoorDash Retail ($10/mo) — 1x bucket", frequency: "monthly", amountAnnual: 120, amount: 10, renews: { month: 1, day: 1 } },

      { id: "csr_lyft", name: "Lyft", frequency: "monthly", amountAnnual: 120, amount: 10, renews: { month: 1, day: 1 } },
      { id: "csr_peloton", name: "Peloton", frequency: "monthly", amountAnnual: 120, amount: 10, renews: { month: 1, day: 1 } },

      { id: "csr_dining_credit", name: "Dining Credit", frequency: "semiannual", amountAnnual: 300, amount: 150, renews: { month: 1, day: 1 } },
      { id: "csr_stubhub", name: "Stubhub", frequency: "semiannual", amountAnnual: 300, amount: 150, renews: { month: 1, day: 1 } },
      { id: "csr_hotel_edit", name: "Hotel (The Edit)", frequency: "semiannual", amountAnnual: 500, amount: 250, renews: { month: 1, day: 1 } },

      { id: "csr_dashpass", name: "DoorDash DashPass Subscription", frequency: "annual", amountAnnual: 120, amount: 120, renews: { month: 1, day: 1 } },
      { id: "csr_apple_tv", name: "Apple TV+", frequency: "annual", amountAnnual: 288, amount: 288, renews: { month: 1, day: 1 } },
      { id: "csr_priority_pass", name: "Priority Pass (value)", frequency: "annual", amountAnnual: 469, amount: 469, renews: { month: 1, day: 1 } },

      { id: "csr_global_entry", name: "Global Entry / TSA PreCheck / NEXUS", frequency: "every_4_years", amountAnnual: 120, amount: 120, renews: { month: 1, day: 1 } },
    ],
    multipliers: [
      { label: "Chase Travel", rate: "8x" },
      { label: "Flights booked direct", rate: "4x" },
      { label: "Hotels booked direct", rate: "4x" },
      { label: "Dining", rate: "3x" },
      { label: "Everything else", rate: "1x" },
    ],
  },

  {
    key: "capitalone_venturex",
    name: "Venture X",
    annualFee: 395,
    logo: "/logos/capitalone.png",
    credits: [
      { id: "vx_travel_credit", name: "Travel Credit", frequency: "annual", amountAnnual: 300, amount: 300, renews: { month: 1, day: 1 } },
      { id: "vx_anniversary_bonus", name: "Anniversary Bonus Miles (value)", frequency: "annual", amountAnnual: 100, amount: 100, renews: { month: 1, day: 1 } },
      { id: "vx_global_entry", name: "Global Entry / TSA PreCheck / NEXUS", frequency: "every_4_years", amountAnnual: 120, amount: 120, renews: { month: 1, day: 1 } },
    ],
    multipliers: [
      { label: "Hotels & rental cars (Capital One Travel)", rate: "10x" },
      { label: "Flights & vacation rentals (Capital One Travel)", rate: "5x" },
      { label: "Everything else", rate: "2x" },
    ],
  },

  // =========================
  // Other 6 (your current set)
  // =========================

  {
    key: "hilton_honors_card",
    name: "Hilton Honors Card",
    annualFee: 550,
    logo: "/logos/hilton.png",
    credits: [
      { id: "hilton_flights", name: "Flights", frequency: "quarterly", amountAnnual: 200, amount: 50, renews: { month: 1, day: 1 } },
      { id: "hilton_clear_plus", name: "Clear Plus", frequency: "annual", amountAnnual: 209, amount: 209, renews: { month: 1, day: 1 } },
      { id: "hilton_conrad_wa_2night", name: "Conrad/Waldorf Astoria 2 Night (value)", frequency: "annual", amountAnnual: 100, amount: 100, renews: { month: 1, day: 1 } },
      { id: "hilton_resort", name: "Hilton Resort", frequency: "semiannual", amountAnnual: 400, amount: 200, renews: { month: 1, day: 1 } },
    ],
    multipliers: [
      { label: "Hilton purchases", rate: "14x" },
      { label: "Flights / AmexTravel / car rentals", rate: "7x" },
      { label: "Dining", rate: "7x" },
      { label: "Everything else", rate: "3x" },
    ],
  },

  {
    key: "amex_gold",
    name: "Amex Gold",
    annualFee: 325,
    logo: "/logos/amex.png",
    credits: [
      { id: "gold_uber_cash", name: "Uber Cash", frequency: "monthly", amountAnnual: 120, amount: 10, renews: { month: 1, day: 1 } },
      { id: "gold_dunkin", name: "Dunkin", frequency: "monthly", amountAnnual: 84, amount: 7, renews: { month: 1, day: 1 } },
      { id: "gold_dining_credit", name: "Dining Credit", frequency: "monthly", amountAnnual: 120, amount: 10, renews: { month: 1, day: 1 } },
      { id: "gold_resy", name: "Resy Restaurants", frequency: "semiannual", amountAnnual: 100, amount: 50, renews: { month: 1, day: 1 } },
    ],
    multipliers: [
      { label: "Restaurants", rate: "4x" },
      { label: "Groceries", rate: "4x" },
      { label: "Flights (direct / AmexTravel)", rate: "3x" },
      { label: "Everything else", rate: "1x" },
    ],
  },

  {
    key: "delta_skymiles_reserve_amex",
    name: "Delta SkyMiles Reserve (Amex)",
    annualFee: 650,
    logo: "/logos/delta.png",
    credits: [
      { id: "delta_resy", name: "Resy Restaurants", frequency: "monthly", amountAnnual: 240, amount: 20, renews: { month: 1, day: 1 } },
      { id: "delta_rideshare", name: "Rideshare", frequency: "monthly", amountAnnual: 120, amount: 10, renews: { month: 1, day: 1 } },
      { id: "delta_stays", name: "Delta Stays", frequency: "annual", amountAnnual: 200, amount: 200, renews: { month: 1, day: 1 } },
    ],
    multipliers: [
      { label: "Delta purchases directly", rate: "3x" },
      { label: "Everything else", rate: "1x" },
    ],
  },

  {
    key: "marriott_bonvoy_brilliant_amex",
    name: "Marriott Bonvoy Brilliant (Amex)",
    annualFee: 650,
    logo: "/logos/marriott.png",
    credits: [
      { id: "mbb_dining", name: "Dining", frequency: "monthly", amountAnnual: 300, amount: 25, renews: { month: 1, day: 1 } },
      { id: "mbb_ritz_stregis", name: "The Ritz-Carlton / St. Regis (value)", frequency: "annual", amountAnnual: 100, amount: 100, renews: { month: 1, day: 1 } },
      { id: "mbb_global_entry", name: "Global Entry", frequency: "every_4_years", amountAnnual: 120, amount: 120, renews: { month: 1, day: 1 } },
      { id: "mbb_tsa_precheck", name: "TSA PreCheck / NEXUS", frequency: "every_5_years", amountAnnual: 85, amount: 85, renews: { month: 1, day: 1 } },
    ],
    multipliers: [
      { label: "Marriott purchases", rate: "6x" },
      { label: "Restaurants", rate: "3x" },
      { label: "Flights", rate: "3x" },
      { label: "Everything else", rate: "2x" },
    ],
  },

  {
    key: "citi_strata_elite",
    name: "Citi Strata Elite",
    annualFee: 595,
    logo: "/logos/citi.png",
    credits: [
      { id: "cse_hotel", name: "Hotel", frequency: "annual", amountAnnual: 300, amount: 300, renews: { month: 1, day: 1 } },
      { id: "cse_splurge", name: "Splurge", frequency: "annual", amountAnnual: 200, amount: 200, renews: { month: 1, day: 1 } },
      { id: "cse_blacklane", name: "Annual Blacklane", frequency: "annual", amountAnnual: 200, amount: 200, renews: { month: 1, day: 1 } },
      { id: "cse_priority_pass", name: "Priority Pass (value)", frequency: "annual", amountAnnual: 469, amount: 469, renews: { month: 1, day: 1 } },
    ],
    multipliers: [
      { label: "Hotels/Car rentals/Attractions (Citi travel)", rate: "12x" },
      { label: "Air travel (Citi travel)", rate: "6x" },
      { label: "Citi Nights dining (window)", rate: "6x" },
      { label: "Restaurants (other times)", rate: "3x" },
      { label: "Everything else", rate: "1.5x" },
    ],
  },

  {
    key: "citi_aadvantage_executive",
    name: "Citi / AAdvantage Executive World Elite",
    annualFee: 595,
    logo: "/logos/aa.png",
    credits: [
      { id: "aa_lyft", name: "Lyft", frequency: "monthly", amountAnnual: 120, amount: 10, renews: { month: 1, day: 1 } },
      { id: "aa_grubhub", name: "Grubhub", frequency: "monthly", amountAnnual: 120, amount: 10, renews: { month: 1, day: 1 } },
      { id: "aa_car_rentals", name: "Car rentals", frequency: "annual", amountAnnual: 200, amount: 200, renews: { month: 1, day: 1 } },
    ],
    multipliers: [
      { label: "American Airlines purchases", rate: "4x" },
      { label: "Hotels & car rentals (AA portal)", rate: "10x" },
      { label: "Everything else", rate: "1x" },
    ],
  },
];
