# 📚 Study Helper

Upload a photo of your homework → get a clear, step-by-step explanation.
Works in any web browser (phone or computer). Powered by Claude.

This guide assumes **you have never coded before.** Just follow each step.

---

## What you need first

1. **Node.js** installed on your computer — this runs the app.
   - Download it from <https://nodejs.org> (get the "LTS" version).
   - Install it like any normal program (click Next → Next → Finish).
2. **A Claude API key** — this lets the app talk to the AI.
   - Go to <https://console.anthropic.com>
   - Sign up / log in → add a payment method → **Settings → API Keys → Create Key**
   - Copy the key (it starts with `sk-ant-...`).
   - 💡 Tip: set a **spending limit** (e.g. $5) in the console so you can never
     be charged more than you expect.

---

## Setup (do this once)

1. Open a terminal **inside the `study-helper` folder**.
   - Windows: open the folder, click the address bar, type `cmd`, press Enter.
   - Mac: right-click the folder → "New Terminal at Folder".

2. Install the app's building blocks:
   ```
   npm install
   ```

3. Create your secret key file:
   - Make a copy of the file `.env.example`
   - Rename the copy to exactly `.env`
   - Open `.env` in Notepad and paste your real key after the `=` sign.
   - Save the file.

---

## Run the app

In the same terminal, type:
```
npm start
```

You should see:
```
✅ Study Helper is running!
   Open this in your browser:  http://localhost:3000
```

Open **http://localhost:3000** in your browser. Upload a homework photo,
click **"Explain it to me"**, and you're done! 🎉

To stop the app, click the terminal and press `Ctrl + C`.

---

## Using it on your phone

While the app is running on your computer, phones on the **same Wi-Fi** can use it:

1. Find your computer's local IP address:
   - Windows: run `ipconfig` in the terminal, look for "IPv4 Address"
     (something like `192.168.1.42`).
   - Mac: System Settings → Wi-Fi → Details → look for the IP address.
2. On your phone's browser, go to `http://YOUR-IP:3000`
   (for example `http://192.168.1.42:3000`).

Later, when you want a real Android app and a public website (so anyone can use
it from anywhere), that's the next step — ask and we'll set it up.

---

## Costs

You pay Anthropic only for what you use — roughly **2 cents per homework photo**
with the default model. No monthly fee. Set a spending cap in the console to stay safe.

**Want it cheaper?** Open `server.js`, find this line:
```js
const MODEL = "claude-sonnet-5";
```
and change it to:
```js
const MODEL = "claude-haiku-4-5";
```
Haiku is cheaper and still good — just slightly less sharp on messy handwriting.

---

## Something not working?

- **"API key is missing or wrong"** → check your `.env` file has the real key and
  is named exactly `.env` (not `.env.txt`).
- **Page won't open** → make sure the terminal still shows "Study Helper is running".
- **Nothing happens after upload** → try a clearer, well-lit photo.

Stuck? Copy the error text and ask — we'll fix it together.
