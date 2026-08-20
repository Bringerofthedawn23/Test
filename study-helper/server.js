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

// The instructions that turn Claude into a patient tutor.
const SYSTEM_PROMPT = `You are a friendly, patient study tutor for students from
1st grade through the last year of high school. A student will send you a photo
of their homework (any common subject: math, physics, chemistry, biology,
history, geography, language, etc.).

Your job:
1. Read the problem in the photo carefully.
2. Explain how to solve it STEP BY STEP, in plain simple English.
3. Number each step. Keep each step short and clear.
4. Show the reasoning, not just the final answer, so the student actually learns.
5. End with the final answer clearly labeled.

If the photo is blurry or you cannot read part of it, say exactly what you can't
read and ask the student to retake the photo. Never make up a problem that isn't
there. Adapt your wording to the apparent grade level of the work.`;

// This is the endpoint the web page calls when the user uploads a photo.
app.post("/api/solve", async (req, res) => {
  try {
    const { imageBase64, mediaType } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: "No image was received." });
    }

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 2000, // keeps answers focused and costs low
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType || "image/jpeg",
                data: imageBase64,
              },
            },
            {
              type: "text",
              text: "Here is my homework. Please explain how to solve it step by step.",
            },
          ],
        },
      ],
    });

    // Pull the plain text out of Claude's reply.
    const answer = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n");

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
