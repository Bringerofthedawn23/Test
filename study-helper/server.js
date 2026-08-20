// Study Helper — backend server
// ------------------------------------------------------------------
// What this file does:
//   1. Serves the web page in the "public" folder.
//   2. Receives a homework photo from that page.
//   3. Sends the photo to Claude and asks for a step-by-step explanation.
//   4. Sends Claude's answer back to the page.
//
// You do NOT need to edit this file to use the app. Just follow README.md.
// ------------------------------------------------------------------

import "dotenv/config"; // loads your secret keys from the .env file
import express from "express";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

const app = express();

// Allow the page to send us a photo (photos are large, so raise the limit).
app.use(express.json({ limit: "15mb" }));

// Serve the web page (everything inside the "public" folder).
app.use(express.static("public"));

// Create the Claude client. It automatically reads ANTHROPIC_API_KEY from .env
const anthropic = new Anthropic();

// ------------------------------------------------------------------
// ACCOUNTS + FREE TRIAL (Supabase)
// ------------------------------------------------------------------
const FREE_QUESTIONS = 5; // free questions each new user gets before paying

// Clean the URL: remove any accidental spaces or trailing slashes, which
// otherwise create broken addresses like ".supabase.co//auth" -> "Invalid path".
const SUPABASE_URL = (process.env.SUPABASE_URL || "").trim().replace(/\/+$/, "");
const SUPABASE_ANON_KEY = (process.env.SUPABASE_ANON_KEY || "").trim();
const SUPABASE_SERVICE_KEY = (process.env.SUPABASE_SERVICE_KEY || "").trim();

// Backend admin client (uses the secret service key — can manage the usage
// table safely). Only created if the keys are present, so the app still runs
// locally without accounts while you set Supabase up.
const supabaseAdmin =
  SUPABASE_URL && SUPABASE_SERVICE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : null;

// The page fetches this to know how to connect to Supabase for login/signup.
// These two values are safe to be public.
app.get("/api/config", (req, res) => {
  res.json({
    supabaseUrl: SUPABASE_URL || "",
    supabaseAnonKey: SUPABASE_ANON_KEY || "",
    accountsEnabled: Boolean(supabaseAdmin),
    freeQuestions: FREE_QUESTIONS,
  });
});

// Given a request, find the logged-in user from their access token.
// Returns the Supabase user object, or null if not logged in / invalid.
async function getUser(req) {
  if (!supabaseAdmin) return null;
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return null;
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error) return null;
  return data.user || null;
}

// Read (or create) a user's usage row.
async function getUsage(userId) {
  const { data } = await supabaseAdmin
    .from("study_usage")
    .select("questions_used, is_subscribed")
    .eq("user_id", userId)
    .maybeSingle();
  if (data) return data;
  // First time we've seen this user — create their row.
  await supabaseAdmin.from("study_usage").insert({ user_id: userId });
  return { questions_used: 0, is_subscribed: false };
}

// Add one to a user's question count.
async function incrementUsage(userId, current) {
  await supabaseAdmin
    .from("study_usage")
    .update({ questions_used: current + 1, updated_at: new Date().toISOString() })
    .eq("user_id", userId);
}

// Which Claude model to use.
//   claude-sonnet-5  -> best balance for math + handwriting (recommended)
//   claude-haiku-4-5 -> cheaper, still good, slightly less sharp on messy handwriting
const MODEL = "claude-sonnet-5";

// ------------------------------------------------------------------
// CREDIT PROTECTION (safety net)
// The app is public once online, so we cap how many questions can be
// answered. This stops a leaked link from draining your Claude balance.
// Change these numbers any time. (This resets whenever the server restarts.)
// ------------------------------------------------------------------
const MAX_QUESTIONS_PER_DAY = 100; // total across everyone
const MAX_QUESTIONS_PER_IP_PER_HOUR = 15; // per single visitor

let dayStamp = new Date().toDateString();
let questionsToday = 0;
const ipHits = new Map(); // ip -> { hour, count }

function checkLimit(ip) {
  // Reset the daily counter when the date changes.
  const today = new Date().toDateString();
  if (today !== dayStamp) {
    dayStamp = today;
    questionsToday = 0;
    ipHits.clear();
  }
  if (questionsToday >= MAX_QUESTIONS_PER_DAY) {
    return "The app has reached its daily question limit. Please try again tomorrow.";
  }

  // Per-visitor hourly limit.
  const hour = new Date().getHours();
  const rec = ipHits.get(ip);
  if (!rec || rec.hour !== hour) {
    ipHits.set(ip, { hour, count: 0 });
  }
  if (ipHits.get(ip).count >= MAX_QUESTIONS_PER_IP_PER_HOUR) {
    return "You've asked a lot of questions this hour. Please take a short break and try again later.";
  }
  return null; // null means "allowed"
}

function recordUse(ip) {
  questionsToday++;
  const rec = ipHits.get(ip);
  if (rec) rec.count++;
}

// The instructions that turn Claude into a patient tutor.
// Build the tutor instructions based on the student's chosen grade level and
// how much detail they want. This is what makes the "grade level" and
// "simple / more detail" controls on the page actually change the answer.
function buildSystemPrompt(gradeLevel, detail) {
  // How to speak for each grade group.
  const gradeGuides = {
    primary:
      "The student is in PRIMARY school (about ages 6-11). Use very simple words a young child understands. Keep it gentle and encouraging.",
    middle:
      "The student is in MIDDLE school (about ages 12-14). Use clear, everyday words. A little more vocabulary is fine.",
    high:
      "The student is in HIGH school (about ages 15-18). You may use normal subject terms, but still explain them clearly.",
  };
  const gradeGuide = gradeGuides[gradeLevel] || gradeGuides.middle;

  // How much detail to give.
  const detailGuide =
    detail === "detailed"
      ? `Give a FULL explanation. Follow this exact order:
1. First, write out the problem in plain typed text, exactly as someone would
   type it on a keyboard (for example: "2x + 5 = 13" or "H2O + CO2 -> ?").
2. Then break the problem into its parts and explain what each part means in
   simple words (what is being asked, what each number/symbol/term is).
3. Then solve it step by step. Number the steps and briefly explain WHY each
   step works, so the student really understands. Use as many steps as needed.`
      : "Keep it SIMPLE and SHORT. Only the key steps (aim for 3 to 5). One short sentence per step. No long paragraphs.";

  return `You are a friendly tutor. A student sends a photo or types a homework
question (any subject).

${gradeGuide}

${detailGuide}

Always:
- Number the steps.
- End with one line: "Answer: ..." showing the final answer.
- If a photo is blurry or unreadable, say so briefly and ask for a clearer one.
- Never invent a problem that isn't there.

FORMATTING (very important — the app shows plain text, not typeset math):
- Do NOT use LaTeX or dollar signs. Never write $ or $$ around math.
- Do NOT use Markdown headings (#) or ** for bold.
- Write ALL math in plain text, exactly as you'd type it on a keyboard:
  * powers: x^2  (not superscripts)
  * multiply: *   divide: /   square root: sqrt(...)
  * fractions: (a + b) / c
  * plus-or-minus: +/-
- Keep everything readable as plain text on its own line.`;
}

// This is the endpoint the web page calls when the user uploads a photo.
app.post("/api/solve", async (req, res) => {
  try {
    const { imageBase64, mediaType, questionText, gradeLevel, detail } = req.body;

    const hasImage = Boolean(imageBase64);
    const hasText = Boolean(questionText && questionText.trim());

    if (!hasImage && !hasText) {
      return res
        .status(400)
        .json({ error: "Please upload a photo or type a question first." });
    }

    // --- Account + free-trial check (only if accounts are turned on) ---
    let user = null;
    let usage = null;
    if (supabaseAdmin) {
      user = await getUser(req);
      if (!user) {
        return res
          .status(401)
          .json({ error: "Please sign in or create a free account to continue." });
      }
      usage = await getUsage(user.id);
      if (!usage.is_subscribed && usage.questions_used >= FREE_QUESTIONS) {
        return res.status(402).json({
          error: `You've used all ${FREE_QUESTIONS} free questions. Subscribe to keep going.`,
          limitReached: true,
        });
      }
    }

    // Credit protection: block the request if a global safety limit is hit.
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";
    const limitMessage = checkLimit(ip);
    if (limitMessage) {
      return res.status(429).json({ error: limitMessage });
    }

    // Build the message content. Include the image only if one was sent.
    const content = [];
    if (hasImage) {
      content.push({
        type: "image",
        source: {
          type: "base64",
          media_type: mediaType || "image/jpeg",
          data: imageBase64,
        },
      });
    }
    content.push({
      type: "text",
      text: hasText
        ? `Here is my homework question:\n\n${questionText.trim()}\n\nPlease explain how to solve it step by step.`
        : "Here is my homework. Please explain how to solve it step by step.",
    });

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 2000, // keeps answers focused and costs low
      system: buildSystemPrompt(gradeLevel, detail),
      messages: [{ role: "user", content }],
    });

    // Pull the plain text out of Claude's reply.
    const answer = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n");

    recordUse(ip); // count this question toward the global safety limit

    // Count this question toward the user's free trial, and tell the page how
    // many free questions they have left.
    let questionsUsed = null;
    let subscribed = false;
    if (supabaseAdmin && user && usage) {
      await incrementUsage(user.id, usage.questions_used);
      questionsUsed = usage.questions_used + 1;
      subscribed = usage.is_subscribed;
    }

    res.json({
      answer,
      questionsUsed,
      freeLimit: FREE_QUESTIONS,
      subscribed,
    });
  } catch (err) {
    console.error("Error talking to Claude:", err);

    // Give the user a friendly message depending on what went wrong.
    if (err instanceof Anthropic.AuthenticationError) {
      return res.status(500).json({
        error:
          "Your API key is missing or wrong. Check the .env file (see README).",
      });
    }
    if (err instanceof Anthropic.RateLimitError) {
      return res
        .status(500)
        .json({ error: "Too many requests right now. Please wait a moment and try again." });
    }
    res.status(500).json({
      error: "Something went wrong. Please try again.",
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n✅ Study Helper is running!`);
  console.log(`   Open this in your browser:  http://localhost:${PORT}\n`);
});
