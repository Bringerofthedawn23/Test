# 🌍 Putting Study Helper online (free)

This guide puts your app on the internet with a public link, using **Render**
(free plan). No computer needs to stay on. Takes about 10 minutes.

> **Free plan note:** the app "sleeps" after ~15 minutes of no use. The next
> visit takes ~30–60 seconds to wake up, then it's fast again. Normal for free.

---

## Before you start
- Your code is already on GitHub (branch `claude/bold-cerf-nswtru`). Good.
- Have your Claude API key ready (the `sk-ant-...` one).

---

## Step 1 — Make a Render account
1. Go to <https://render.com>
2. Click **Get Started** → sign up with your **GitHub** account (easiest).
3. Allow Render to access your GitHub repositories when it asks.

## Step 2 — Create the web service
1. In Render, click **New +** (top right) → **Web Service**.
2. Find and select your repository **`Test`**.
3. Fill in these fields exactly:

   | Field | What to enter |
   |---|---|
   | **Name** | `study-helper` (or anything) |
   | **Branch** | `claude/bold-cerf-nswtru` |
   | **Root Directory** | `study-helper`  ← important! |
   | **Runtime** | `Node` |
   | **Build Command** | `npm install` |
   | **Start Command** | `npm start` |
   | **Instance Type** | **Free** |

## Step 3 — Add your secret key
Still on that page, scroll to **Environment Variables** → **Add Environment Variable**:

- **Key:** `ANTHROPIC_API_KEY`
- **Value:** your real `sk-ant-...` key

(This keeps the key safe on the server — it is never in your public code.)

## Step 4 — Deploy
1. Click **Create Web Service**.
2. Wait a few minutes while it builds. When you see **"Live"** (green), it's ready.
3. Your public link appears at the top, like:
   `https://study-helper-xxxx.onrender.com`

Open that link on any phone or computer — your app is online! 🎉

---

## Keeping your credits safe
The app now has a built-in limit (see `server.js`):
- **100 questions per day total**
- **15 questions per hour per visitor**

So even if your link gets shared around, your bill can't run away. You can
change those numbers in `server.js` any time (then push the change; Render
re-deploys automatically).

---

## Updating the app later
Whenever we change the code and push to GitHub, Render **automatically
re-deploys** the new version within a couple of minutes. Nothing for you to do.

---

## Next: money (step 3)
Turning on "free trial then pay" needs two of your own accounts:
- **Supabase** (free) — stores users and how many free questions they've used.
- **Stripe** (free to start) — takes the actual card payments.

We'll set those up together next. See the checklist your assistant will give you.
