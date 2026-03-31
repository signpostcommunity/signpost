# Stripe Production Activation Checklist

## Prerequisites
- [ ] Bank account connected in Stripe dashboard
- [ ] Business info completed in Stripe dashboard
- [ ] Identity verification complete
- [ ] Test mode E2E verified (create booking, charge $15, webhook fires)

## Key Swap Steps
1. In Stripe Dashboard > Developers > API Keys, switch to Live mode
2. Copy `sk_live_...` (Secret key)
3. Copy `pk_live_...` (Publishable key)
4. Create new LIVE webhook endpoint:
   - URL: `https://signpost.community/api/webhooks/stripe`
   - Events: payment_intent.succeeded, payment_intent.payment_failed, customer.subscription.deleted, charge.dispute.created
5. Copy new webhook signing secret `whsec_...`
6. In Vercel > signpost-pdir > Settings > Environment Variables:
   - Update `STRIPE_SECRET_KEY` = `sk_live_...`
   - Update `STRIPE_PUBLISHABLE_KEY` = `pk_live_...`
   - Update `STRIPE_WEBHOOK_SECRET` = `whsec_...`
7. Redeploy in Vercel
8. Test: create a real booking, confirm $15 charge appears in Stripe live dashboard
9. Verify webhook: check Stripe > Developers > Webhooks > endpoint shows successful delivery

## Safety Net
The app logs a warning if test keys are detected in production (`lib/stripe.ts`).
Check Vercel logs after deploy to confirm no `[stripe] WARNING: Using test keys` messages.

## Rollback
If anything goes wrong, swap back to test keys in Vercel env vars and redeploy.
