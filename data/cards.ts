// data/cards.ts

export type CreditFrequency =
  | "monthly"
  | "quarterly"
  | "semiannual"
  | "annual"
  | "every4years"
  | "every5years"
  | "onetime";

export type Credit = {
  id: string;
  title: string;
  amount: number; // amount PER period (not annualized)
  frequency: CreditFrequency;
  notes?: string;
};

export type Multiplier = {
  label: string;
  x: number;
};

export type PointsProgram =
  | "cashback"
  | "amex_mr"
  | "chase_ur"
  | "cap1_miles"
  | "citi_typ"
  | "aa_miles"
  | "delta_miles"
  | "marriott_points"
  | "hilton_points"
  | "united_miles"
  | "usbank_points"
  | "boa_points"
  | "luxury_points"
  | "ihg_points"
  | "hyatt_points"
  | "southwest_points"
  | "alaska_miles"
  | "jetblue_points"
  | "wells_fargo_points";

export type SpendCategory =
  | "dining"
  | "travel"
  | "groceries"
  | "gas"
  | "online"
  | "other";

export type EarnRates = Partial<Record<SpendCategory, number>>;

export type Card = {
  key: string;
  name: string;
  issuer: string;
  annualFee: number;
  creditsTrackedAnnualized: number;
  logo: string; // "/logos/xxx.png"

  pointsProgram: PointsProgram;

  // Deterministic quiz engine input (v1: broad categories)
  earnRates: EarnRates;

  // Optional: premium feel + badges
  signupBonusEstUsd?: number;

  welcomeBonus?: {
    headline: string;
    details?: string;
    valueEstimateUsd?: number;
    note?: string;
  };

  multipliers: Multiplier[];
  credits: Credit[];
  
  // Pros and cons for card details
  pros?: string[];
  cons?: string[];
  perks?: string[];
};

export const DEFAULT_POINT_VALUES_USD: Record<
  Exclude<PointsProgram, "cashback">,
  number
> = {
  amex_mr: 0.015,
  chase_ur: 0.015,
  cap1_miles: 0.01,
  citi_typ: 0.012,
  aa_miles: 0.013,
  delta_miles: 0.012,
  marriott_points: 0.008,
  hilton_points: 0.006,
  united_miles: 0.012,
  usbank_points: 0.015,
  boa_points: 0.01,
  luxury_points: 0.02,
  ihg_points: 0.005,
  hyatt_points: 0.017,
  southwest_points: 0.014,
  alaska_miles: 0.015,
  jetblue_points: 0.013,
  wells_fargo_points: 0.01,
};

export function pointValueUsd(program: PointsProgram): number {
  if (program === "cashback") return 1.0;
  return DEFAULT_POINT_VALUES_USD[program];
}

export const CARDS: Card[] = [
  {
    key: "amex-platinum",
    name: "Platinum Card",
    issuer: "American Express",
    annualFee: 895,
    creditsTrackedAnnualized: 3074,
    logo: "/logos/amex-platinum.png",
    pointsProgram: "amex_mr",
    earnRates: { travel: 5, other: 1 },
    signupBonusEstUsd: 2625,
    welcomeBonus: {
      headline: "175,000 MR",
      details: "Spend $8,000 in 6 months",
      valueEstimateUsd: 2625,
      note: "Offers vary by applicant/time.",
    },
    multipliers: [
      { label: "Flights booked direct / Amex Travel", x: 5 },
      { label: "Prepaid hotels on AmexTravel", x: 5 },
      { label: "Everything else", x: 1 },
    ],
    credits: [
      { id: "plat-airline-incidental", title: "Airline Incidental Fees", amount: 200, frequency: "annual" },
      { id: "plat-clear", title: "Clear Plus", amount: 209, frequency: "annual" },
      { id: "plat-digital-entertainment", title: "Digital Entertainment", amount: 25, frequency: "monthly" },
      { id: "plat-fhr-hotel-collection", title: "Fine Hotels + Resorts / Hotel Collection", amount: 300, frequency: "semiannual" },
      { id: "plat-lululemon", title: "Lululemon", amount: 75, frequency: "quarterly" },
      { id: "plat-oura", title: "Oura Ring", amount: 200, frequency: "annual" },
      { id: "plat-resy", title: "Resy Restaurants", amount: 100, frequency: "quarterly" },
      { id: "plat-saks", title: "Saks", amount: 50, frequency: "semiannual" },
      { id: "plat-uber-one", title: "Uber One Subscription", amount: 120, frequency: "annual" },
      { id: "plat-uber-cash-jan-nov", title: "Uber Cash (Jan–Nov)", amount: 15, frequency: "monthly" },
      { id: "plat-uber-cash-dec", title: "Uber Cash (Dec)", amount: 35, frequency: "monthly", notes: "December only" },
      { id: "plat-equinox", title: "Equinox", amount: 300, frequency: "annual" },
      { id: "plat-walmartplus", title: "Walmart+ Subscription", amount: 12.95, frequency: "monthly" },
    ],
  },

  {
    key: "chase-sapphire-reserve",
    name: "Chase Sapphire Reserve",
    issuer: "Chase",
    annualFee: 795,
    creditsTrackedAnnualized: 2817,
    logo: "/logos/chase-sapphire-reserve.png",
    pointsProgram: "chase_ur",
    earnRates: { travel: 4, dining: 3, other: 1 },
    signupBonusEstUsd: 900,
    multipliers: [
      { label: "Chase travel", x: 8 },
      { label: "Flights booked direct", x: 4 },
      { label: "Hotels booked direct", x: 4 },
      { label: "Dining", x: 3 },
      { label: "Everything else", x: 1 },
    ],
    credits: [
      { id: "csr-apple-tv", title: "Apple TV+", amount: 288, frequency: "annual", notes: "Value in sheet" },
      { id: "csr-dining-credit", title: "Dining Credit", amount: 150, frequency: "semiannual" },
      { id: "csr-doordash-dashpass", title: "DoorDash DashPass Subscription", amount: 120, frequency: "annual" },
      { id: "csr-doordash-restaurants", title: "DoorDash Restaurant", amount: 5, frequency: "monthly" },
      { id: "csr-doordash-retail-10a", title: "DoorDash Retail", amount: 10, frequency: "monthly" },
      { id: "csr-doordash-retail-10b", title: "DoorDash Retail (second line)", amount: 10, frequency: "monthly" },
      { id: "csr-hotel-the-edit", title: "Hotel (The Edit)", amount: 250, frequency: "semiannual" },
      { id: "csr-lyft", title: "Lyft", amount: 10, frequency: "monthly" },
      { id: "csr-stubhub", title: "StubHub", amount: 150, frequency: "semiannual" },
      { id: "csr-travel", title: "Travel", amount: 300, frequency: "annual" },
      { id: "csr-peloton", title: "Peloton", amount: 10, frequency: "monthly" },
      { id: "csr-global-entry", title: "Global Entry / TSA PreCheck / NEXUS fee", amount: 120, frequency: "every4years" },
      { id: "csr-priority-pass", title: "Priority Pass", amount: 469, frequency: "annual", notes: "Value in sheet" },
    ],
  },

  {
    key: "capitalone-venture-x",
    name: "Venture X",
    issuer: "Capital One",
    annualFee: 395,
    creditsTrackedAnnualized: 400,
    logo: "/logos/capitalone-venture-x.png",
    pointsProgram: "cap1_miles",
    earnRates: { travel: 5, other: 2 },
    signupBonusEstUsd: 750,
    multipliers: [
      { label: "Hotels & rental cars via Capital One Travel", x: 10 },
      { label: "Flights & vacation rentals via Capital One Travel", x: 5 },
      { label: "Everything else", x: 2 },
    ],
    credits: [
      { id: "vx-travel", title: "Travel", amount: 300, frequency: "annual" },
      { id: "vx-global-entry", title: "Global Entry / TSA PreCheck / NEXUS fee", amount: 120, frequency: "every4years" },
      { id: "vx-anniversary-bonus", title: "Anniversary Bonus Miles", amount: 100, frequency: "annual" },
    ],
  },

  {
    key: "chase-sapphire-preferred",
    name: "Chase Sapphire Preferred",
    issuer: "Chase",
    annualFee: 95,
    creditsTrackedAnnualized: 170,
    logo: "/logos/chase-sapphire-preferred.png",
    pointsProgram: "chase_ur",
    earnRates: { travel: 5, dining: 3, groceries: 3, online: 3, other: 1 },
    multipliers: [
      { label: "Chase Travel", x: 5 },
      { label: "Other travel", x: 2 },
      { label: "Dining", x: 3 },
      { label: "Online groceries", x: 3 },
      { label: "Select streaming", x: 3 },
      { label: "Everything else", x: 1 },
    ],
    credits: [
      { id: "csp-dashpass", title: "DoorDash DashPass Subscription", amount: 120, frequency: "annual" },
      { id: "csp-hotel-credit", title: "Hotels booked via Chase Travel portal", amount: 50, frequency: "annual" },
    ],
  },

  {
    key: "amex-green",
    name: "American Express Green",
    issuer: "American Express",
    annualFee: 150,
    creditsTrackedAnnualized: 209,
    logo: "/logos/amex-green.png",
    pointsProgram: "amex_mr",
    earnRates: { travel: 3, dining: 3, other: 1 },
    multipliers: [
      { label: "Travel", x: 3 },
      { label: "Transit", x: 3 },
      { label: "Dining", x: 3 },
      { label: "Everything else", x: 1 },
    ],
    credits: [{ id: "green-clear", title: "Clear Plus", amount: 209, frequency: "annual" }],
  },

  {
    key: "hilton-surpass",
    name: "Hilton Honors Surpass",
    issuer: "American Express",
    annualFee: 150,
    creditsTrackedAnnualized: 200,
    logo: "/logos/hilton-honors-surpass.png",
    pointsProgram: "hilton_points",
    earnRates: { travel: 12, dining: 6, groceries: 6, gas: 6, online: 4, other: 3 },
    multipliers: [
      { label: "Purchases at Hilton", x: 12 },
      { label: "Dining", x: 6 },
      { label: "US Supermarkets", x: 6 },
      { label: "Gas", x: 6 },
      { label: "US Online Retail", x: 4 },
      { label: "Everything else", x: 3 },
    ],
    credits: [{ id: "surpass-hilton-credit", title: "Hilton credit", amount: 50, frequency: "quarterly" }],
  },

  {
    key: "amex-gold",
    name: "American Express Gold",
    issuer: "American Express",
    annualFee: 325,
    creditsTrackedAnnualized: 424,
    logo: "/logos/amex-gold.png",
    pointsProgram: "amex_mr",
    earnRates: { dining: 4, groceries: 4, travel: 3, other: 1 },
    signupBonusEstUsd: 900,
    multipliers: [
      { label: "Restaurant", x: 4 },
      { label: "Groceries", x: 4 },
      { label: "Flights (direct/Amex Travel)", x: 3 },
      { label: "Prepaid hotels", x: 2 },
      { label: "Everything else", x: 1 },
    ],
    credits: [
      { id: "gold-uber-cash", title: "Uber Cash", amount: 10, frequency: "monthly" },
      { id: "gold-dunkin", title: "Dunkin", amount: 7, frequency: "monthly" },
      { id: "gold-resy", title: "Resy Restaurants", amount: 50, frequency: "semiannual" },
      { id: "gold-dining", title: "Dining", amount: 10, frequency: "monthly" },
    ],
  },

  {
    key: "hilton-honors-aspire",
    name: "Hilton Honors Aspire",
    issuer: "American Express",
    annualFee: 550,
    creditsTrackedAnnualized: 909,
    logo: "/logos/hilton-honors.png",
    pointsProgram: "hilton_points",
    earnRates: { travel: 7, dining: 7, other: 3 },
    signupBonusEstUsd: 700,
    multipliers: [
      { label: "Hilton hotels & resorts", x: 14 },
      { label: "Flights/AmexTravel/Car rentals", x: 7 },
      { label: "Dining", x: 7 },
      { label: "Everything else", x: 3 },
    ],
    credits: [
      { id: "aspire-flights", title: "Flights", amount: 50, frequency: "quarterly" },
      { id: "aspire-clear", title: "Clear Plus", amount: 209, frequency: "annual" },
      { id: "aspire-conrad-waldorf-2night", title: "Conrad/Waldorf Astoria (2 Night)", amount: 100, frequency: "annual" },
      { id: "aspire-hilton-resort", title: "Hilton Resort", amount: 200, frequency: "semiannual" },
    ],
  },

  {
    key: "delta-reserve",
    name: "Delta SkyMiles Reserve (Amex)",
    issuer: "American Express",
    annualFee: 650,
    creditsTrackedAnnualized: 560,
    logo: "/logos/delta-reserve.png",
    pointsProgram: "delta_miles",
    earnRates: { travel: 3, other: 1 },
    signupBonusEstUsd: 600,
    multipliers: [
      { label: "Delta purchases directly", x: 3 },
      { label: "Everything else", x: 1 },
    ],
    credits: [
      { id: "delta-resy", title: "Resy Restaurants", amount: 20, frequency: "monthly" },
      { id: "delta-rideshare", title: "Rideshare", amount: 10, frequency: "monthly" },
      { id: "delta-delta-stays", title: "Delta Stays", amount: 200, frequency: "annual" },
    ],
  },

  {
    key: "marriott-brilliant",
    name: "Marriott Bonvoy Brilliant (Amex)",
    issuer: "American Express",
    annualFee: 650,
    creditsTrackedAnnualized: 995,
    logo: "/logos/marriott-brilliant.png",
    pointsProgram: "marriott_points",
    earnRates: { travel: 6, dining: 3, other: 2 },
    signupBonusEstUsd: 650,
    multipliers: [
      { label: "Marriott hotels & resorts", x: 6 },
      { label: "Restaurant", x: 3 },
      { label: "Flights", x: 3 },
      { label: "Everything else", x: 2 },
    ],
    credits: [
      { id: "brilliant-dining", title: "Dining", amount: 25, frequency: "monthly" },
      { id: "brilliant-ritz-stregis", title: "Ritz-Carlton / St. Regis", amount: 100, frequency: "annual" },
      { id: "brilliant-free-night", title: "Free Night Award (up to 85,000 points)", amount: 595, frequency: "annual", notes: "Value varies by redemption" },
      { id: "brilliant-global-entry", title: "Global Entry", amount: 120, frequency: "every4years" },
      { id: "brilliant-tsa-precheck", title: "TSA PreCheck / NEXUS fee", amount: 85, frequency: "every5years" },
    ],
  },

  {
    key: "citi-strata-elite",
    name: "Citi Strata Elite",
    issuer: "Citi",
    annualFee: 595,
    creditsTrackedAnnualized: 1169,
    logo: "/logos/citi-strata-elite.png",
    pointsProgram: "citi_typ",
    earnRates: { travel: 6, dining: 3, other: 1.5 },
    signupBonusEstUsd: 750,
    multipliers: [
      { label: "Hotels/Car Rentals/Attractions on Citi travel", x: 12 },
      { label: "Air Travel on Citi travel", x: 6 },
      { label: "Restaurants on Citi Nights (Fri/Sat 6pm–6am ET)", x: 6 },
      { label: "Restaurants other times", x: 3 },
      { label: "Everything else", x: 1.5 },
    ],
    credits: [
      { id: "strata-hotel", title: "Hotel (2+ nights via Citi Travel)", amount: 300, frequency: "annual" },
      { id: "strata-splurge", title: "Splurge (1stDibs / AA / Best Buy / Future / Live Nation)", amount: 200, frequency: "annual" },
      { id: "strata-blacklane", title: "Annual Blacklane", amount: 200, frequency: "annual" },
      { id: "strata-priority-pass", title: "Priority Pass", amount: 469, frequency: "annual", notes: "Value in sheet" },
      { id: "strata-global-entry", title: "Global Entry", amount: 120, frequency: "every4years" },
      { id: "strata-tsa-precheck", title: "TSA PreCheck / NEXUS fee", amount: 85, frequency: "every5years" },
    ],
  },

  {
    key: "citi-aa-executive",
    name: "Citi / AAdvantage Executive",
    issuer: "Citi",
    annualFee: 595,
    creditsTrackedAnnualized: 440,
    logo: "/logos/citi-aa-executive.png",
    pointsProgram: "aa_miles",
    earnRates: { travel: 4, other: 1 },
    signupBonusEstUsd: 650,
    multipliers: [
      { label: "American Airlines purchases", x: 4 },
      { label: "Hotels & car rentals via AA portal", x: 10 },
      { label: "Everything else", x: 1 },
    ],
    credits: [
      { id: "aaexec-lyft", title: "Lyft", amount: 10, frequency: "monthly", notes: "After 3 rides" },
      { id: "aaexec-grubhub", title: "Grubhub", amount: 10, frequency: "monthly" },
      { id: "aaexec-car-rentals", title: "Car rentals", amount: 120, frequency: "annual" },
      { id: "aaexec-global-entry", title: "Global Entry", amount: 120, frequency: "every4years" },
      { id: "aaexec-tsa-precheck", title: "TSA PreCheck / NEXUS fee", amount: 85, frequency: "every5years" },
    ],
  },

  // ===========================================
  // NEW CARDS (5 additions)
  // ===========================================

  {
    key: "united-club-infinite",
    name: "United Club Infinite Card",
    issuer: "Chase",
    annualFee: 695,
    creditsTrackedAnnualized: 920,
    logo: "/logos/united-club-infinite.png",
    pointsProgram: "united_miles",
    earnRates: { travel: 5, dining: 2, other: 1 },
    multipliers: [
      { label: "United flights (4x card + base)", x: 9 },
      { label: "Prepaid hotels via Renowned Hotels", x: 5 },
      { label: "Other United purchases", x: 4 },
      { label: "Dining & eligible delivery", x: 2 },
      { label: "Other travel (hotels, car rentals, rideshare)", x: 2 },
      { label: "Everything else", x: 1 },
    ],
    credits: [
      { id: "uci-renowned-hotels", title: "Renowned Hotels Credit", amount: 200, frequency: "annual", notes: "Prepaid hotels via Renowned Hotels and Resorts" },
      { id: "uci-rideshare", title: "Rideshare Credit", amount: 12.50, frequency: "monthly", notes: "$12–$18/month for rideshare" },
      { id: "uci-car-rental", title: "Avis/Budget Credit", amount: 100, frequency: "annual", notes: "Via United portal" },
      { id: "uci-jsx", title: "JSX Flight Credit", amount: 200, frequency: "annual", notes: "For JSX flights" },
      { id: "uci-instacart", title: "Instacart Credit", amount: 20, frequency: "monthly", notes: "$10/month × 2 credits" },
      { id: "uci-global-entry", title: "Global Entry / TSA PreCheck / NEXUS", amount: 120, frequency: "every4years" },
    ],
    perks: [
      "Full United Club lounge membership (cardholder + 1 guest at 45+ lounges)",
      "Free first checked bag for cardholder + up to 8 companions",
      "Premier Access priority services (check-in, security, boarding, baggage)",
      "No foreign transaction fees",
      "Travel protections (trip delay, cancellation, lost luggage)",
      "25% back on United inflight purchases",
      "1,500 bonus PQP annually",
    ],
    pros: [
      "Complimentary United Club lounge access (valued at $650+) and Premier Access perks make airport travel smoother for frequent United flyers",
      "Strong PQP earning and award flight discounts help fast-track elite status, potentially saving hundreds on upgrades and fees",
    ],
    cons: [
      "Saver Award availability is often capacity-controlled and hard to find, leading to frustration when redeeming miles",
      "The spending threshold for welcome bonuses is too high for many, and the card loses value quickly for non-frequent United flyers",
    ],
  },

  {
    key: "ritz-carlton",
    name: "Ritz-Carlton Credit Card",
    issuer: "Chase",
    annualFee: 450,
    creditsTrackedAnnualized: 425,
    logo: "/logos/ritz-carlton.png",
    pointsProgram: "marriott_points",
    earnRates: { travel: 6, dining: 3, other: 2 },
    multipliers: [
      { label: "Marriott Bonvoy hotels", x: 6 },
      { label: "Restaurants", x: 3 },
      { label: "Airline purchases booked directly", x: 3 },
      { label: "Car rentals", x: 3 },
      { label: "Everything else", x: 2 },
    ],
    credits: [
      { id: "ritz-airline", title: "Airline Incidental Credit", amount: 300, frequency: "annual", notes: "Baggage, seat upgrades, inflight, lounge passes" },
      { id: "ritz-hotel", title: "Ritz-Carlton / St. Regis Credit", amount: 100, frequency: "annual", notes: "2+ night stay booked directly" },
      { id: "ritz-global-entry", title: "Global Entry / TSA PreCheck", amount: 100, frequency: "every4years" },
    ],
    perks: [
      "Marriott Bonvoy Gold Elite status (room upgrades, late checkout, 25% bonus points)",
      "Annual free night award (up to 85,000 points)",
      "Priority Pass Select (cardholder + 2 guests, effective Jan 2026)",
      "No foreign transaction fees",
      "Trip cancellation/interruption up to $10,000",
    ],
    pros: [
      "Gold Elite status and annual free night (often worth $300–$500+) provide strong value for Marriott/Ritz stays, easily offsetting the fee",
      "Solid airline incidental credit and Priority Pass add flexible travel perks without a higher fee",
    ],
    cons: [
      "Priority Pass guest access changes (now limited to 2 guests starting 2026) make it less family-friendly",
      "The card is no longer open to new applicants, requiring a product change from another Chase card",
    ],
  },

  {
    key: "us-bank-altitude-reserve",
    name: "U.S. Bank Altitude Reserve",
    issuer: "U.S. Bank",
    annualFee: 400,
    creditsTrackedAnnualized: 355,
    logo: "/logos/us-bank-altitude-reserve.png",
    pointsProgram: "usbank_points",
    earnRates: { travel: 5, dining: 3, other: 1 },
    multipliers: [
      { label: "Prepaid hotels/car rentals via Travel Center", x: 10 },
      { label: "Prepaid flights via Travel Center", x: 5 },
      { label: "Travel purchases (outside portal)", x: 3 },
      { label: "Mobile wallet spending (Apple Pay, Google Pay)", x: 3 },
      { label: "Everything else", x: 1 },
    ],
    credits: [
      { id: "usar-travel", title: "Travel Center Credit", amount: 325, frequency: "annual", notes: "Flights, hotels, car rentals via US Bank portal" },
      { id: "usar-global-entry", title: "Global Entry / TSA PreCheck / NEXUS", amount: 120, frequency: "every4years" },
    ],
    perks: [
      "Priority Pass Select (cardholder + 2 guests at 1,300+ locations)",
      "3x on mobile wallet purchases (Apple Pay, Google Pay)",
      "Concierge service",
      "No foreign transaction fees",
      "Cell phone protection up to $800/claim",
      "GigSky global mobile data credits",
    ],
    pros: [
      "The $325 travel credit (easy via portal) and $120 TSA/Global often fully offset the fee for moderate travelers",
      "Unlimited Priority Pass lounge access and high earning on mobile wallets (Apple Pay, Google Pay) boost convenience",
    ],
    cons: [
      "Recent nerfs (reduced cashback equivalents in 2026) have made it less competitive with devalued rewards",
      "No transferable points to partners means redemptions are stuck at 1.5 cents/point max",
    ],
  },

  {
    key: "boa-premium-rewards-elite",
    name: "Bank of America Premium Rewards Elite",
    issuer: "Bank of America",
    annualFee: 550,
    creditsTrackedAnnualized: 480,
    logo: "/logos/boa-premium-rewards-elite.png",
    pointsProgram: "boa_points",
    earnRates: { travel: 2, dining: 2, other: 1.5 },
    multipliers: [
      { label: "Travel", x: 2 },
      { label: "Dining", x: 2 },
      { label: "Everything else", x: 1.5 },
      { label: "With Preferred Rewards: Travel/Dining", x: 3.5 },
      { label: "With Preferred Rewards: Everything else", x: 2.625 },
    ],
    credits: [
      { id: "boa-airline", title: "Airline Incidental Credit", amount: 300, frequency: "annual", notes: "Seat upgrades, baggage, inflight, lounge fees" },
      { id: "boa-lifestyle", title: "Lifestyle Credit", amount: 150, frequency: "annual", notes: "Streaming, food delivery, fitness, rideshare" },
      { id: "boa-global-entry", title: "Global Entry / TSA PreCheck / NEXUS", amount: 120, frequency: "every4years" },
    ],
    perks: [
      "Priority Pass Select (cardholder + 4 authorized users)",
      "20% savings on airfare when paying with points",
      "24/7 full-service concierge",
      "No foreign transaction fees",
      "Trip cancellation up to $5,000",
    ],
    pros: [
      "Airline incidental and lifestyle credits ($450 total) plus 20% airfare savings easily offset the fee for everyday travelers",
      "Boosted earning (up to 3.5x/2.625x with Preferred Rewards) and unlimited Priority Pass make it rewarding for BoA clients",
    ],
    cons: [
      "Poor customer service with long hold times and unresolved issues reported by many cardholders",
      "Requires significant assets ($20k+) for Preferred Rewards boosts; without it, base earning feels underwhelming",
    ],
  },

  {
    key: "mastercard-black",
    name: "Mastercard Black Card",
    issuer: "Luxury Card",
    annualFee: 495,
    creditsTrackedAnnualized: 330,
    logo: "/logos/mastercard-black.png",
    pointsProgram: "luxury_points",
    earnRates: { travel: 2, dining: 1, other: 1 },
    multipliers: [
      { label: "Airfare", x: 2 },
      { label: "Hotels", x: 2 },
      { label: "Everything else (redeems at 2% for airfare)", x: 1 },
    ],
    credits: [
      { id: "mcb-dining", title: "Dining Credit", amount: 100, frequency: "annual", notes: "At qualifying restaurants" },
      { id: "mcb-airline", title: "Airline Travel Credit", amount: 200, frequency: "annual", notes: "Tickets, baggage, upgrades" },
      { id: "mcb-global-entry", title: "Global Entry / TSA PreCheck", amount: 120, frequency: "every4years" },
    ],
    perks: [
      "VIP Priority Pass Select (cardholder + 2 guests)",
      "24/7 concierge service",
      "No foreign transaction fees",
      "Trip cancellation up to $5,000",
      "Points redeem at 2% for airfare, 1.5% cash back",
    ],
    pros: [
      "Airline and dining credits plus high redemption values (2% for airfare) provide solid returns for travel-focused spending",
      "VIP concierge and Priority Pass offer luxury access and convenience for high-end users",
    ],
    cons: [
      "Poor earning rates (only 1x on most spend) make it hard to accumulate points quickly",
      "Overpriced with limited rewards value—better alternatives exist for similar perks at lower cost",
    ],
  },

  // ===========================================
  // MORE NEW CARDS (8 additions)
  // ===========================================

  {
    key: "luxury-card-gold",
    name: "Luxury Card Mastercard Gold",
    issuer: "Luxury Card",
    annualFee: 995,
    creditsTrackedAnnualized: 300,
    logo: "/logos/luxury-card-gold.png",
    pointsProgram: "luxury_points",
    earnRates: { travel: 2, dining: 1, other: 1 },
    multipliers: [
      { label: "Airfare", x: 2 },
      { label: "Hotels", x: 2 },
      { label: "Everything else (redeems at 2% for airfare)", x: 1 },
    ],
    credits: [
      { id: "lcg-airline", title: "Airline Travel Credit", amount: 200, frequency: "annual", notes: "Tickets, baggage, upgrades" },
      { id: "lcg-dining", title: "Dining Credit", amount: 100, frequency: "annual", notes: "At qualifying restaurants" },
    ],
    perks: [
      "24k gold-plated metal card",
      "24/7 elite concierge for exclusive experiences",
      "VIP Priority Pass Select (unlimited visits + guests)",
      "Luxury hotel upgrades at select properties",
      "No foreign transaction fees",
    ],
    pros: [
      "24k gold-plated metal card and concierge deliver ultra-luxury status and experiences",
      "High redemption values for airfare make points efficient for premium travel",
    ],
    cons: [
      "Extremely limited credits fail to offset the high fee for most users",
      "Low earning rates across categories make point accumulation slow and unrewarding",
    ],
  },

  {
    key: "ihg-premier",
    name: "IHG One Rewards Premier",
    issuer: "Chase",
    annualFee: 99,
    creditsTrackedAnnualized: 230,
    logo: "/logos/ihg-premier.png",
    pointsProgram: "ihg_points",
    earnRates: { travel: 5, dining: 5, gas: 5, other: 3 },
    multipliers: [
      { label: "IHG hotels (10x card + base/status)", x: 26 },
      { label: "Travel, gas, dining", x: 5 },
      { label: "Everything else", x: 3 },
    ],
    credits: [
      { id: "ihg-free-night", title: "Annual Free Night Award", amount: 200, frequency: "annual", notes: "Up to 40,000 points value" },
      { id: "ihg-global-entry", title: "Global Entry / TSA PreCheck", amount: 100, frequency: "every4years" },
    ],
    perks: [
      "IHG Platinum Elite status (upgrades, bonus points, late checkout)",
      "4th reward night free on stays of 3+ nights",
      "No foreign transaction fees",
      "Trip cancellation & baggage delay protection",
    ],
    pros: [
      "Free night and Platinum status easily offset the low fee for IHG stays",
      "High earning at IHG accelerates free nights and upgrades",
    ],
    cons: [
      "Free night cap at 40k points excludes many luxury properties",
      "Rewards tied to IHG limit flexibility outside the chain",
    ],
  },

  {
    key: "world-of-hyatt",
    name: "World of Hyatt Credit Card",
    issuer: "Chase",
    annualFee: 95,
    creditsTrackedAnnualized: 400,
    logo: "/logos/world-of-hyatt.png",
    pointsProgram: "hyatt_points",
    earnRates: { travel: 2, dining: 2, other: 1 },
    multipliers: [
      { label: "Hyatt hotels", x: 9 },
      { label: "Dining", x: 2 },
      { label: "Transit & fitness", x: 2 },
      { label: "Everything else", x: 1 },
    ],
    credits: [
      { id: "hyatt-free-night", title: "Annual Free Night Award", amount: 200, frequency: "annual", notes: "Category 1–4 property" },
      { id: "hyatt-free-night-2", title: "Second Free Night", amount: 200, frequency: "annual", notes: "After $15,000 annual spend" },
    ],
    perks: [
      "Discoverist status (upgrades, bonus points, late checkout)",
      "5 qualifying night credits toward status",
      "No foreign transaction fees",
      "Trip cancellation & baggage delay protection",
    ],
    pros: [
      "Free night awards provide high value (often $200+) for minimal fee",
      "Status and earning help build toward higher Hyatt tiers",
    ],
    cons: [
      "Limited partners reduce point flexibility",
      "Everyday earning is modest outside Hyatt",
    ],
  },

  {
    key: "southwest-priority",
    name: "Southwest Rapid Rewards Priority",
    issuer: "Chase",
    annualFee: 149,
    creditsTrackedAnnualized: 280,
    logo: "/logos/southwest-priority.png",
    pointsProgram: "southwest_points",
    earnRates: { travel: 3, dining: 2, other: 1 },
    multipliers: [
      { label: "Southwest purchases", x: 3 },
      { label: "Rapid Rewards hotel/car partners", x: 2 },
      { label: "Transit, internet, cable, streaming", x: 2 },
      { label: "Everything else", x: 1 },
    ],
    credits: [
      { id: "sw-travel", title: "Southwest Travel Credit", amount: 75, frequency: "annual" },
      { id: "sw-anniversary", title: "Anniversary Points", amount: 105, frequency: "annual", notes: "7,500 points worth ~$105" },
      { id: "sw-upgraded-boarding", title: "Upgraded Boardings", amount: 100, frequency: "annual", notes: "Up to 4 annually reimbursed" },
    ],
    perks: [
      "25% back on inflight purchases",
      "Path to Companion Pass (counts toward qualifying points)",
      "No foreign transaction fees",
      "Trip cancellation & baggage delay protection",
    ],
    pros: [
      "Travel credit and anniversary points offset the fee for Southwest flyers",
      "Upgraded boardings and inflight savings enhance flying experience",
    ],
    cons: [
      "Rewards limited to Southwest, with no international partners",
      "No lounge access or automatic elite status",
    ],
  },

  {
    key: "alaska-visa-signature",
    name: "Alaska Airlines Visa Signature",
    issuer: "Bank of America",
    annualFee: 95,
    creditsTrackedAnnualized: 175,
    logo: "/logos/alaska-visa-signature.png",
    pointsProgram: "alaska_miles",
    earnRates: { travel: 3, gas: 2, other: 1 },
    multipliers: [
      { label: "Alaska purchases", x: 3 },
      { label: "Gas, transit, shipping", x: 2 },
      { label: "Everything else", x: 1 },
    ],
    credits: [
      { id: "alaska-companion", title: "Companion Fare", amount: 99, frequency: "annual", notes: "After $6,000 spend (plus taxes from $23)" },
      { id: "alaska-bags", title: "Free Checked Bags", amount: 75, frequency: "annual", notes: "Cardholder + up to 6 companions" },
    ],
    perks: [
      "Free first checked bag for cardholder + 6 companions",
      "Path to elite status (status points on spend)",
      "No foreign transaction fees",
      "Trip cancellation & baggage delay protection",
    ],
    pros: [
      "Companion Fare saves significantly on flights for pairs",
      "Free checked bags add value for group travel",
    ],
    cons: [
      "Limited earning categories outside Alaska",
      "Fewer partners than major airlines",
    ],
  },

  {
    key: "citi-premier",
    name: "Citi Premier Card",
    issuer: "Citi",
    annualFee: 95,
    creditsTrackedAnnualized: 100,
    logo: "/logos/citi-premier.png",
    pointsProgram: "citi_typ",
    earnRates: { travel: 3, dining: 3, groceries: 3, gas: 3, other: 1 },
    multipliers: [
      { label: "Hotels/car rentals/attractions on cititravel.com", x: 10 },
      { label: "Air travel & other hotels", x: 3 },
      { label: "Restaurants", x: 3 },
      { label: "Supermarkets", x: 3 },
      { label: "Gas & EV charging", x: 3 },
      { label: "Everything else", x: 1 },
    ],
    credits: [
      { id: "citi-hotel", title: "Annual Hotel Savings", amount: 100, frequency: "annual", notes: "$100 off $500+ hotel stays via Citi Travel" },
    ],
    perks: [
      "ThankYou points transferable to airline/hotel partners",
      "No foreign transaction fees",
      "Trip cancellation & baggage delay protection",
    ],
    pros: [
      "Broad 3x categories for everyday spend, with flexible transfers",
      "Hotel benefit offsets fee for one qualifying stay",
    ],
    cons: [
      "No lounge access or elite status",
      "Limited credits compared to premium cards",
    ],
  },

  {
    key: "wells-fargo-autograph-journey",
    name: "Wells Fargo Autograph Journey",
    issuer: "Wells Fargo",
    annualFee: 95,
    creditsTrackedAnnualized: 50,
    logo: "/logos/wells-fargo-autograph-journey.png",
    pointsProgram: "wells_fargo_points",
    earnRates: { travel: 5, dining: 3, other: 1 },
    multipliers: [
      { label: "Hotels", x: 5 },
      { label: "Airlines", x: 4 },
      { label: "Other travel & dining", x: 3 },
      { label: "Everything else", x: 1 },
    ],
    credits: [
      { id: "wf-airline", title: "Annual Airline Credit", amount: 50, frequency: "annual" },
    ],
    perks: [
      "Unlimited Priority Pass lounge visits (after enrollment)",
      "Points transferable to partners",
      "No foreign transaction fees",
      "Trip cancellation & baggage delay protection",
    ],
    pros: [
      "High earning on travel and Priority Pass access for modest fee",
      "Flexible redemptions enhance value",
    ],
    cons: [
      "Airline credit is low; requires maximization for offset",
      "Fewer partners than competitors",
    ],
  },

  {
    key: "jetblue-plus",
    name: "JetBlue Plus Card",
    issuer: "Barclays",
    annualFee: 99,
    creditsTrackedAnnualized: 150,
    logo: "/logos/jetblue-plus.png",
    pointsProgram: "jetblue_points",
    earnRates: { travel: 6, dining: 2, groceries: 2, other: 1 },
    multipliers: [
      { label: "JetBlue purchases", x: 6 },
      { label: "Restaurants", x: 2 },
      { label: "Grocery stores", x: 2 },
      { label: "Everything else", x: 1 },
    ],
    credits: [
      { id: "jb-bags", title: "Free Checked Bags", amount: 100, frequency: "annual", notes: "Cardholder + 3 companions" },
      { id: "jb-inflight", title: "Inflight Savings", amount: 50, frequency: "annual", notes: "50% savings on inflight purchases" },
    ],
    perks: [
      "Free first checked bag for cardholder + 3 companions",
      "50% savings on inflight purchases",
      "Path to Mosaic elite status after $50,000 spend",
      "No foreign transaction fees",
    ],
    pros: [
      "Checked bag and inflight perks save on JetBlue flights",
      "High earning on JetBlue accelerates free flights",
    ],
    cons: [
      "Rewards limited to JetBlue ecosystem",
      "No lounge access or broad credits",
    ],
  },
];
