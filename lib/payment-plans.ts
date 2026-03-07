export type PlanId = "one_week" | "one_month" | "credits_pack"

export interface PlanConfig {
  id: PlanId
  name: string
  credits: number
  /** Amount in smallest unit: paise for INR, cents for USD */
  amountINR: number
  amountUSD: number
}

export const PLANS: Record<PlanId, PlanConfig> = {
  one_week: {
    id: "one_week",
    name: "One Week",
    credits: 60,
    amountINR: 19900, // ₹199 in paise
    amountUSD: 700,   // $7 in cents
  },
  one_month: {
    id: "one_month",
    name: "One Month",
    credits: 60,
    amountINR: 29900, // ₹299 in paise
    amountUSD: 1300,  // $13 in cents
  },
  credits_pack: {
    id: "credits_pack",
    name: "Credits Pack",
    credits: 60,
    amountINR: 29900, // ₹299 in paise
    amountUSD: 1300,  // $13 in cents
  },
}
