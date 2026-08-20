# 🔐 Turning on accounts + free trial (Part 3a)

Do these steps once. About 10 minutes.

## Step 1 — Create the usage table
1. Go to supabase.com → your project → **SQL Editor** → **New query**
2. Open the file `supabase-usage-setup.sql` (in this folder), copy all of it,
   paste it in, and click **Run**. You should see "Success".

## Step 2 — Get your 3 Supabase keys
In Supabase → **Project Settings** (gear icon) → **API**. Copy these:

| You need | Where it is | Secret? |
|---|---|---|
| **Project URL** | "Project URL" | No |
| **anon public** key | "Project API keys" → `anon` `public` | No |
| **service_role** key | "Project API keys" → `service_role` (click reveal) | **YES — keep secret** |

## Step 3 — Add them to Render
Render → your service → **Environment** → add three variables:

| Key | Value |
|---|---|
| `SUPABASE_URL` | your Project URL |
| `SUPABASE_ANON_KEY` | the anon public key |
| `SUPABASE_SERVICE_KEY` | the service_role key |

Click **Save** → Render redeploys automatically (~1–2 min).

## Step 4 — (Recommended) Smooth signups
By default Supabase makes new users confirm their email before they can log in.
For an easy start you can turn that off:

- Supabase → **Authentication** → **Sign In / Providers** → **Email** →
  turn **"Confirm email"** OFF → Save.

(You can turn it back on later once email is set up properly.)

## Step 5 — Test it
Open your site. You should now see a **Create account** screen.
1. Sign up with an email + password.
2. Ask 5 questions — watch the "free left" counter go down.
3. On the 6th, the **Subscribe** wall appears. 🎉

That's Part 3a done. Payments (Part 3b, Stripe) come next.
