# Razorpay Payment Gateway Setup

## 1. Create Razorpay Account

1. Sign up at [Razorpay Dashboard](https://dashboard.razorpay.com/signup)
2. Complete KYC verification (required for live payments)

## 2. Get API Keys

1. Go to [Razorpay API Keys](https://dashboard.razorpay.com/app/keys)
2. Generate **Test** keys for development
3. For production, generate **Live** keys after KYC

## 3. Add to Environment

Add these to your `.env.local`:

```
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
```

- `RAZORPAY_KEY_ID` and `NEXT_PUBLIC_RAZORPAY_KEY_ID` should be the same (your public key)
- `RAZORPAY_KEY_SECRET` is server-only and must never be exposed to the client

## 4. Current Plan

- **India (INR)**: One Week ₹199, One Month ₹299, Credits Pack ₹299
- **Other countries**: Razorpay is India-focused. For USD, users see "Contact us" or you can add Stripe later.

## 5. Flow

1. User clicks "Get Started" or "Buy Credits" on pricing page
2. User must be logged in (redirects to signup if not)
3. Razorpay checkout opens
4. On success, 60 credits are added to user's account
5. User is redirected to dashboard

## 6. Webhook (Optional)

For production, add a webhook at Razorpay Dashboard → Settings → Webhooks to handle payment failures and refunds:

- URL: `https://yourdomain.com/api/payment/webhook`
- Events: `payment.captured`, `payment.failed`
