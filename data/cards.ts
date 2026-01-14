// data/cards.ts
// Pure static data only (client-safe). No fs/xlsx imports.

// -------------------- Types --------------------
export type Credit = {
  id: string;
  name: string;
  frequency: "monthly" | "quarterly" | "semiannual" | "annual" | "one-time" | "every_4_years" | "every_5_years";
  amountAnnual: number;

  // Renewal date (simple v1). Month 1-12, day 1-31.
  // For monthly credits, set day=1 and month can be 1 (we’ll compute “next month” in UI later if needed).
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
};

// -------------------- Point Valuations (used only for welcome bonus estimate) --------------------
export const DEFAULT_POINT_VALUES_USD: Record<string, number> = {
  MR: 0.015,       // Amex Membership Rewards (placeholder)
  UR: 0.015,       // Chase Ultimate Rewards (placeholder)
  C1: 0.012,       // Capital One Miles (placeholder)
  HILTON: 0.005,   // Hilton (placeholder)
  MARRIOTT: 0.007, // Marriott (placeholder)
  SKY: 0.012,      // Delta SkyMiles (placeholder)
  CITI: 0.013,     // Citi points (placeholder)
  AA: 0.013,       // American miles (placeholder)
  CASH: 1.0,
};

// -------------------- Cards --------------------
// ✅ TOP 3 (PINNED / HIGHLIGHT THESE IN UI)
// 1) Platinum Card
// 2) Chase Sapphire Reserve
// 3) Venture X
export const CARDS: Card[] = [
  // =========================
  // TOP 3
  // =========================

  // 1) Platinum Card — annual cost $895
  // Credits + values per your sheet. :contentReference[oaicite:3]{index=3}
  {
    key: "amex_platinum",
    name: "Platinum Card",
    annualFee: 895,
    credits: [
      { id: "plat_airline_incidental", name: "Airline Incidental Fees", frequency: "annual", amountAnnual: 200, renews: { month: 1, day: 1 } },
      { id: "plat_clear_plus", name: "Clear Plus", frequency: "annual", amountAnnual: 209, renews: { month: 1, day: 1 } },
      { id: "plat_digital_entertainment", name: "Digital Entertainment", frequency: "monthly", amountAnnual: 300, renews: { month: 1, day: 1 } },
      { id: "plat_fhr_hotel_collection", name: "Fine Hotels + Resorts / The Hotel Collection", frequency: "semiannual", amountAnnual: 600, renews: { month: 1, day: 1 } },
      { id: "plat_lululemon", name: "Lululemon", frequency: "quarterly", amountAnnual: 300, renews: { month: 1, day: 1 } },
      { id: "plat_oura", name: "Oura Ring", frequency: "annual", amountAnnual: 200, renews: { month: 1, day: 1 } },
      { id: "plat_resy", name: "Resy Restaurants", frequency: "quarterly", amountAnnual: 400, renews: { month: 1, day: 1 } },
      { id: "plat_saks", name: "Saks", frequency: "semiannual", amountAnnual: 100, renews: { month: 1, day: 1 } },
      { id: "plat_uber_one", name: "Uber One Subscription", frequency: "annual", amountAnnual: 120, renews: { month: 1, day: 1 } },
      { id: "plat_uber_cash_jan_nov", name: "Uber Cash (Jan–Nov)", frequency: "monthly", amountAnnual: 165, renews: { month: 1, day: 1 } },
      { id: "plat_uber_cash_dec", name: "Uber Cash (Dec)", frequency: "monthly", amountAnnual: 25, renews: { month: 12, day: 1 } },
      { id: "plat_equinox", name: "Equinox", frequency: "annual", amountAnnual: 300, renews: { month: 1, day: 1 } },
      { id: "plat_walmart_plus", name: "Walmart+ Subscription", frequency: "monthly", amountAnnual: 155, renews: { month: 1, day: 1 } },
    ],
    multipliers: [
      { label: "Flights booked direct / Amex Travel", rate: "5x" },
      { label: "Prepaid hotels on AmexTravel", rate: "5x" },
      { label: "Everything else", rate: "1x" },
    ],
  },

  // 2) Chase Sapphire Reserve — annual cost $795 (per your sheet) :contentReference[oaicite:4]{index=4}
  {
    key: "chase_sapphire_reserve",
    name: "Chase Sapphire Reserve",
    annualFee: 795,
    credits: [
      { id: "csr_apple_tv", name: "Apple TV+", frequency: "annual", amountAnnual: 288, renews: { month: 1, day: 1 } },
      { id: "csr_dining_credit", name: "Dining Credit", frequency: "semiannual", amountAnnual: 300, renews: { month: 1, day: 1 } },
      { id: "csr_dashpass", name: "DoorDash DashPass Subscription", frequency: "annual", amountAnnual: 120, renews: { month: 1, day: 1 } },
      { id: "csr_dd_restaurant", name: "DoorDash Restaurant", frequency: "monthly", amountAnnual: 60, renews: { month: 1, day: 1 } },
      { id: "csr_dd_retail_3x", name: "DoorDash Retail ($10/mo) — 3x bucket", frequency: "monthly", amountAnnual: 120, renews: { month: 1, day: 1 } },
      { id: "csr_dd_retail_1x", name: "DoorDash Retail ($10/mo) — 1x bucket", frequency: "monthly", amountAnnual: 120, renews: { month: 1, day: 1 } },
      { id: "csr_hotel_edit", name: "Hotel (The Edit)", frequency: "semiannual", amountAnnual: 500, renews: { month: 1, day: 1 } },
      { id: "csr_lyft", name: "Lyft", frequency: "monthly", amountAnnual: 120, renews: { month: 1, day: 1 } },
      { id: "csr_stubhub", name: "Stubhub", frequency: "semiannual", amountAnnual: 300, renews: { month: 1, day: 1 } },
      { id: "csr_travel_credit", name: "Travel Credit", frequency: "annual", amountAnnual: 300, renews: { month: 1, day: 1 } },
      { id: "csr_peloton", name: "Peloton", frequency: "monthly", amountAnnual: 120, renews: { month: 1, day: 1 } },
      { id: "csr_global_entry", name: "Global Entry / TSA PreCheck / NEXUS", frequency: "every_4_years", amountAnnual: 120, renews: { month: 1, day: 1 } },
      { id: "csr_priority_pass", name: "Priority Pass (value)", frequency: "annual", amountAnnual: 469, renews: { month: 1, day: 1 } },
    ],
    multipliers: [
      { label: "Chase Travel", rate: "8x" },
      { label: "Flights booked direct", rate: "4x" },
      { label: "Hotels booked direct", rate: "4x" },
      { label: "Dining", rate: "3x" },
      { label: "Everything else", rate: "1x" },
    ],
  },

  // 3) Venture X — annual cost $395 :contentReference[oaicite:5]{index=5}
  {
    key: "capitalone_venturex",
    name: "Venture X",
    annualFee: 395,
    credits: [
      { id: "vx_travel_credit", name: "Travel Credit", frequency: "annual", amountAnnual: 300, renews: { month: 1, day: 1 } },
      { id: "vx_global_entry", name: "Global Entry / TSA PreCheck / NEXUS", frequency: "every_4_years", amountAnnual: 120, renews: { month: 1, day: 1 } },
      { id: "vx_anniversary_bonus", name: "Anniversary Bonus Miles", frequency: "annual", amountAnnual: 100, renews: { month: 1, day: 1 } },
    ],
    multipliers: [
      { label: "Hotels & rental cars (Capital One Travel)", rate: "10x" },
      { label: "Flights & vacation rentals (Capital One Travel)", rate: "5x" },
      { label: "Everything else", rate: "2x" },
    ],
  },

  // =========================
  // OTHER 6 (from your sheet)
  // =========================

  // Hilton Honors Card — annual cost $550 :contentReference[oaicite:6]{index=6}
  {
    key: "hilton_honors_card",
    name: "Hilton Honors Card",
    annualFee: 550,
    credits: [
      { id: "hilton_flights", name: "Flights ($50 quarterly)", frequency: "quarterly", amountAnnual: 200, renews: { month: 1, day: 1 } },
      { id: "hilton_clear_plus", name: "Clear Plus", frequency: "annual", amountAnnual: 209, renews: { month: 1, day: 1 } },
      { id: "hilton_conrad_wa_2night", name: "Conrad/Waldorf Astoria 2 Night", frequency: "annual", amountAnnual: 100, renews: { month: 1, day: 1 } },
      { id: "hilton_resort", name: "Hilton Resort ($200 semi-annually)", frequency: "semiannual", amountAnnual: 400, renews: { month: 1, day: 1 } },
    ],
    multipliers: [
      { label: "Hilton purchases", rate: "14x" },
      { label: "Flights / AmexTravel / car rentals", rate: "7x" },
      { label: "Dining", rate: "7x" },
      { label: "Everything else", rate: "3x" },
    ],
  },

  // Amex Gold — annual cost $325 :contentReference[oaicite:7]{index=7}
  {
    key: "amex_gold",
    name: "Amex Gold",
    annualFee: 325,
    credits: [
      { id: "gold_uber_cash", name: "Uber Cash", frequency: "monthly", amountAnnual: 120, renews: { month: 1, day: 1 } },
      { id: "gold_dunkin", name: "Dunkin", frequency: "monthly", amountAnnual: 84, renews: { month: 1, day: 1 } },
      { id: "gold_resy", name: "Resy Restaurants ($50 semi-annually)", frequency: "semiannual", amountAnnual: 100, renews: { month: 1, day: 1 } },
      { id: "gold_dining_credit", name: "Dining Credit", frequency: "monthly", amountAnnual: 120, renews: { month: 1, day: 1 } },
    ],
    multipliers: [
      { label: "Restaurants", rate: "4x" },
      { label: "Groceries", rate: "4x" },
      { label: "Flights (direct / AmexTravel)", rate: "3x" },
      { label: "Prepaid hotels", rate: "2x" },
      { label: "Everything else", rate: "1x" },
    ],
  },

  // Delta SkyMiles Reserve Amex — annual cost $650 :contentReference[oaicite:8]{index=8}
  {
    key: "delta_skymiles_reserve_amex",
    name: "Delta SkyMiles Reserve (Amex)",
    annualFee: 650,
    credits: [
      { id: "delta_resy", name: "Resy Restaurants", frequency: "monthly", amountAnnual: 240, renews: { month: 1, day: 1 } },
      { id: "delta_rideshare", name: "Rideshare", frequency: "monthly", amountAnnual: 120, renews: { month: 1, day: 1 } },
      { id: "delta_stays", name: "Delta Stays", frequency: "annual", amountAnnual: 200, renews: { month: 1, day: 1 } },
    ],
    multipliers: [
      { label: "Delta purchases directly", rate: "3x" },
      { label: "Everything else", rate: "1x" },
    ],
  },

  // Marriott Bonvoy Brilliant Amex — annual cost $650 :contentReference[oaicite:9]{index=9}
  {
    key: "marriott_bonvoy_brilliant_amex",
    name: "Marriott Bonvoy Brilliant (Amex)",
    annualFee: 650,
    credits: [
      { id: "mbb_dining", name: "Dining ($25 monthly)", frequency: "monthly", amountAnnual: 300, renews: { month: 1, day: 1 } },
      { id: "mbb_ritz_stregis", name: "The Ritz-Carlton / St. Regis", frequency: "annual", amountAnnual: 100, renews: { month: 1, day: 1 } },
      { id: "mbb_global_entry", name: "Global Entry", frequency: "every_4_years", amountAnnual: 120, renews: { month: 1, day: 1 } },
      { id: "mbb_tsa_precheck", name: "TSA PreCheck / NEXUS", frequency: "every_5_years", amountAnnual: 85, renews: { month: 1, day: 1 } },
    ],
    multipliers: [
      { label: "Marriott purchases", rate: "6x" },
      { label: "Restaurants", rate: "3x" },
      { label: "Flights", rate: "3x" },
      { label: "Everything else", rate: "2x" },
    ],
  },

  // Citi Strata Elite — annual cost $595 :contentReference[oaicite:10]{index=10}
  {
    key: "citi_strata_elite",
    name: "Citi Strata Elite",
    annualFee: 595,
    credits: [
      { id: "cse_hotel", name: "Hotel", frequency: "annual", amountAnnual: 300, renews: { month: 1, day: 1 } },
      { id: "cse_splurge", name: "Splurge (1stDibs/AA/BestBuy/Future/LiveNation)", frequency: "annual", amountAnnual: 200, renews: { month: 1, day: 1 } },
      { id: "cse_blacklane", name: "Annual Blacklane", frequency: "annual", amountAnnual: 200, renews: { month: 1, day: 1 } },
      { id: "cse_priority_pass", name: "Priority Pass (value)", frequency: "annual", amountAnnual: 469, renews: { month: 1, day: 1 } },
    ],
    multipliers: [
      { label: "Hotels/Car rentals/Attractions (Citi travel)", rate: "12x" },
      { label: "Air travel (Citi travel)", rate: "6x" },
      { label: "Citi Nights (Fri/Sat 6pm–6am ET)", rate: "6x (restaurants)" },
      { label: "Restaurants (any other time)", rate: "3x" },
      { label: "Everything else", rate: "1.5x" },
    ],
  },

  // Citi / AAdvantage Executive World Elite — annual cost $595 :contentReference[oaicite:11]{index=11}
  {
    key: "citi_aadvantage_executive",
    name: "Citi / AAdvantage Executive World Elite",
    annualFee: 595,
    credits: [
      { id: "aa_lyft", name: "Lyft (after 3 rides exception)", frequency: "monthly", amountAnnual: 120, renews: { month: 1, day: 1 } },
      { id: "aa_grubhub", name: "Grubhub", frequency: "monthly", amountAnnual: 120, renews: { month: 1, day: 1 } },
      { id: "aa_car_rentals", name: "Car rentals", frequency: "annual", amountAnnual: 200, renews: { month: 1, day: 1 } },
    ],
    multipliers: [
      { label: "American Airlines purchases", rate: "4x" },
      { label: "Hotels & car rentals (AA portal)", rate: "10x" },
      { label: "Everything else", rate: "1x" },
    ],
  },
];
