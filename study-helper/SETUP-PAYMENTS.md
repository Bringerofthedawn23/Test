# 💳 Turning on payments (Part 3b — Stripe)

This makes the "Subscribe" button charge €4.99/month and unlock unlimited
questions. Start in **TEST MODE** (fake money) — flip to live later.

## Step 1 — Create a Stripe account
- Go to https://dashboard.stripe.com → sign up.
- Top-right, make sure the **"Test mode"** toggle is **ON** while we build.

## Step 2 — Create the subscription product
1. Left menu → **Product catalog** → **Add product**
2. Name: `Study Helper subscription`
3. Price: **4.99 EUR**, **Recurring**, **Monthly** → Save
4. Click the product → find the **Price** → copy its **API ID**
   (looks like `price_1AbC…`). This is your `STRIPE_PRICE_ID`.

## Step 3 — Get your secret key
- Left menu → **Developers** → **API keys**
- Copy the **Secret key** (starts with `sk_test_...`). This is `STRIPE_SECRET_KEY`.

## Step 4 — Add a webhook (so we know when someone pays)
1. **Developers** → **Webhooks** → **Add endpoint**
2. Endpoint URL:  `https://test-iyyw.onrender.com/api/stripe-webhook`
   (use YOUR real site address + `/api/stripe-webhook`)
3. Under "Select events", add these two:
   - `checkout.session.completed`
   - `customer.subscription.deleted`
4. Save. Then click the new endpoint → **Signing secret** → **Reveal** →
   copy it (starts with `whsec_...`). This is `STRIPE_WEBHOOK_SECRET`.

## Step 5 — Add 3 variables to Render
Render → your service → **Environment** → add:

| Key | Value |
|---|---|
| `STRIPE_SECRET_KEY` | your `sk_test_...` key |
| `STRIPE_PRICE_ID` | your `price_...` id |
| `STRIPE_WEBHOOK_SECRET` | your `whsec_...` secret |

Save → wait for redeploy (**Live**).

## Step 6 — Test it (with a fake card)
1. On your site, use up your 5 free questions → the Subscribe wall appears.
2. Click **Subscribe** → you go to Stripe's checkout page.
3. Pay with Stripe's **test card**:
   - Card number: `4242 4242 4242 4242`
   - Expiry: any future date (e.g. 12/34) · CVC: any 3 digits · ZIP: any
4. After paying you return to the app and see **"Subscribed ✓"** with
   unlimited questions. 🎉

## Going live (later)
When you're ready for real money:
- Complete Stripe's account activation (business + bank details).
- Switch Stripe to **Live mode**, redo Steps 2–4 to get **live** keys
  (`sk_live_...`, a live `price_...`, a live `whsec_...`), and update the
  three Render variables. That's it.
