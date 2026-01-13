// data/cards.ts
export type Frequency = "Monthly" | "Quarterly" | "Semi-annually" | "Annually" | "Annual";

export type Credit = {
  id: string;
  name: string;
  amountAnnual: number;     // annualized value (from your spreadsheet)
  frequency: Frequency;
};

export type WelcomeOffer = {
  currency: "MR" | "UR" | "C1" | "Hilton" | "Marriott" | "Delta" | "Miles" | "Points";
  amount: number;          // points/miles
  spend: string;           // "Spend $X in Y months"
  notes?: string;          // optional disclaimers like "offers vary"
  sourceLabel?: string;    // shown in UI, not a link
};

export type Card = {
  key: string;
  name: string;
  annualFee: number;
  credits: Credit[];
  welcomeOffer?: WelcomeOffer;
};

// Default valuations (editable in UI)
// - UR set to 2.0¢ because Chase advertises 125k ≈ $2,500 through Chase Travel for select flights/hotels
// - Marriott 0.7¢ because 100k ≈ $700 in common valuations
export const DEFAULT_POINT_VALUES_USD: Record<string, number> = {
  MR: 0.015,
  UR: 0.02,
  C1: 0.01,
  Hilton: 0.005,
  Marriott: 0.007,
  Delta: 0.012,
  Miles: 0.01,
  Points: 0.01,
};

export const CARDS: Card[] = [
  {
    key: "chase_sapphire_reserve",
    name: "Chase Sapphire Reserve",
    annualFee: 795,
    welcomeOffer: {
      currency: "UR",
      amount: 125000,
      spend: "Spend $6,000 in 3 months",
      sourceLabel: "Chase public offer",
      notes: "Chase advertises ~$2,500 value via Chase Travel for select flights/hotels.",
    },
    credits: [
      { id: "csr_apple_tv", name: "Apple TV+", amountAnnual: 250, frequency: "Annually" },
      { id: "csr_dining", name: "Dining Credit", amountAnnual: 300, frequency: "Semi-annually" },
      { id: "csr_dashpass", name: "DoorDash Dashpass", amountAnnual: 120, frequency: "Annually" },
      { id: "csr_doordash_restaurant", name: "DoorDash Restaurant", amountAnnual: 60, frequency: "Monthly" },
      { id: "csr_doordash_retail_1", name: "DoorDash Retail", amountAnnual: 120, frequency: "Monthly" },
      { id: "csr_doordash_retail_2", name: "DoorDash Retail (extra)", amountAnnual: 120, frequency: "Monthly" },
      { id: "csr_the_edit_hotels", name: "Hotel (The Edit)", amountAnnual: 500, frequency: "Semi-annually" },
      { id: "csr_lyft", name: "Lyft", amountAnnual: 120, frequency: "Monthly" },
      { id: "csr_stubhub", name: "Stubhub", amountAnnual: 300, frequency: "Semi-annually" },
      { id: "csr_travel", name: "Travel", amountAnnual: 300, frequency: "Annually" },
    ],
  },
  {
    key: "capital_one_venture_x",
    name: "Capital One Venture X",
    annualFee: 395,
    welcomeOffer: {
      currency: "C1",
      amount: 75000,
      spend: "Spend $4,000 in 3 months",
      sourceLabel: "Capital One overview",
    },
    credits: [
      { id: "vx_travel_credit", name: "Travel Credit (Portal)", amountAnnual: 300, frequency: "Annually" },
      { id: "vx_anniversary_miles", name: "Anniversary Miles (10,000)", amountAnnual: 100, frequency: "Annually" },
      { id: "vx_global_entry", name: "Global Entry / TSA PreCheck", amountAnnual: 120, frequency: "Annually" },
    ],
  },
  {
    key: "platinum_card",
    name: "Platinum Card",
    annualFee: 895,
    welcomeOffer: {
      currency: "MR",
      amount: 175000,
      spend: "Spend $8,000 in 6 months",
      sourceLabel: "Amex page (offers vary)",
      notes: "Welcome offer can vary by applicant.",
    },
    credits: [
      { id: "plat_airline", name: "Airline Incidental Fees", amountAnnual: 200, frequency: "Annual" },
      { id: "plat_hotel_fhr", name: "Fine Hotels + Resorts / Hotel Collection", amountAnnual: 600, frequency: "Semi-annually" },
      { id: "plat_digital_entertainment", name: "Digital Entertainment", amountAnnual: 300, frequency: "Monthly" },
      { id: "plat_uber", name: "Uber Cash", amountAnnual: 200, frequency: "Monthly" },
      { id: "plat_saks", name: "Saks", amountAnnual: 100, frequency: "Semi-annually" },
      { id: "plat_walmart_plus", name: "Walmart+ (est.)", amountAnnual: 155, frequency: "Monthly" },
    ],
  },
  {
    key: "hilton_honors_card",
    name: "Hilton Honors Card",
    annualFee: 550,
    welcomeOffer: {
      currency: "Hilton",
      amount: 175000,
      spend: "Spend $6,000 in 6 months",
      sourceLabel: "Amex Hilton Aspire page",
    },
    credits: [
      { id: "hilton_airline", name: "Airline", amountAnnual: 200, frequency: "Quarterly" },
      { id: "hilton_resort", name: "Hilton Resort", amountAnnual: 400, frequency: "Semi-annually" },
      { id: "hilton_free_night", name: "Free Night Reward (est.)", amountAnnual: 500, frequency: "Annually" },
      { id: "hilton_clear", name: "CLEAR (est.)", amountAnnual: 189, frequency: "Annually" },
    ],
  },
  {
    key: "delta_skymiles_reserve_american_express_card",
    name: "Delta SkyMiles® Reserve American Express Card",
    annualFee: 650,
    welcomeOffer: {
      currency: "Delta",
      amount: 70000,
      spend: "Spend $5,000 in 6 months",
      sourceLabel: "Amex Delta Reserve page",
    },
    credits: [
      { id: "delta_companion", name: "Companion Certificate (est.)", amountAnnual: 400, frequency: "Annually" },
      { id: "delta_resy", name: "Resy Credit (est.)", amountAnnual: 240, frequency: "Monthly" },
      { id: "delta_ride", name: "Rideshare Credit (est.)", amountAnnual: 120, frequency: "Monthly" },
      { id: "delta_global_entry", name: "Global Entry / TSA PreCheck (est.)", amountAnnual: 120, frequency: "Annually" },
    ],
  },
  {
    key: "marriott_bonvoy_brilliant_american_express",
    name: "Marriott Bonvoy Brilliant® American Express® Card",
    annualFee: 650,
    welcomeOffer: {
      currency: "Marriott",
      amount: 100000,
      spend: "Spend $6,000 in 6 months",
      sourceLabel: "TPG current offer summary",
    },
    credits: [
      { id: "mbb_dining", name: "Dining credit (up to $25/mo)", amountAnnual: 300, frequency: "Monthly" },
      { id: "mbb_free_night", name: "Free Night Award (est.)", amountAnnual: 350, frequency: "Annually" },
    ],
  },

  // These are in your spreadsheet but you didn’t send links yet
  // (still useful: credits show correctly)
  {
    key: "citi_strata_elite",
    name: "Citi Strata Elite℠ Card",
    annualFee: 595,
    credits: [
      { id: "citi_hotel", name: "Hotel Credit", amountAnnual: 250, frequency: "Annually" },
      { id: "citi_global_entry", name: "Global Entry / TSA PreCheck", amountAnnual: 120, frequency: "Annually" },
    ],
  },
  {
    key: "united_clubsm_card",
    name: "United ClubSM Card",
    annualFee: 695,
    credits: [
      { id: "united_club_membership", name: "United Club Membership (est.)", amountAnnual: 650, frequency: "Annually" },
    ],
  },
];
