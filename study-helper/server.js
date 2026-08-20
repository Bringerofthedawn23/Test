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

import "dotenv/config"; // loads your secret API key from the .env file
import express from "express";
import Anthropic from "@anthropic-ai/sdk";

const app = express();

// Allow the page to send us a photo (photos are large, so raise the limit).
app.use(express.json({ limit: "15mb" }));

// Serve the web page (everything inside the "public" folder).
app.use(express.static("public"));

// Create the Claude client. It automatically reads ANTHROPIC_API_KEY from .env
const anthropic = new Anthropic();

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
const SYSTEM_PROMPT = `You are a friendly tutor for students from 1st grade to
the last year of high school. A student sends a photo or types a homework
question (any subject).

Keep answers SIMPLE and SHORT:
- Use very easy, everyday words. Explain like the student is a beginner.
- Give only the key steps (aim for 3 to 5 short steps). Skip extra detail.
- One short sentence per step. No long paragraphs. No hard vocabulary.
- Number the steps.
- End with one line: "Answer: ..." showing the final answer.

If the photo is blurry or you can't read it, say so briefly and ask for a
clearer photo. Never invent a problem that isn't there.`;

// This is the endpoint the web page calls when the user uploads a photo.
app.post("/api/solve", async (req, res) => {
  try {
    const { imageBase64, mediaType, questionText } = req.body;

    const hasImage = Boolean(imageBase64);
    const hasText = Boolean(questionText && questionText.trim());

    if (!hasImage && !hasText) {
      return res
        .status(400)
        .json({ error: "Please upload a photo or type a question first." });
    }

    // Credit protection: block the request if a limit is hit.
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
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content }],
    });

    // Pull the plain text out of Claude's reply.
    const answer = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n");

    recordUse(ip); // count this question toward the limits
    res.json({ answer });
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
