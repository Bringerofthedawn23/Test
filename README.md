# Currency Converter

A lightweight, dependency-free web app that converts between **160+ world
currencies** using live exchange rates.

## Features

- **All major & minor currencies** — the currency list is driven by the live
  rates feed (~160 currencies), with friendly names and symbols.
- **Live exchange rates** from the free [open.er-api.com](https://open.er-api.com)
  endpoint (no API key required).
- **Offline-friendly** — rates are cached in the browser, and a built-in
  fallback snapshot lets the app keep converting even with no network.
- **Swap, refresh, and formatted output** with locale-aware currency
  formatting.
- **Light & dark themes** with automatic system-preference detection, and
  remembered currency/theme preferences.
- **No build step, no dependencies** — plain HTML, CSS, and JavaScript.

## Usage

Just open `index.html` in a browser. To avoid any local-file quirks, you can
serve the folder instead:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Files

| File            | Purpose                                             |
| --------------- | --------------------------------------------------- |
| `index.html`    | Markup and layout                                   |
| `styles.css`    | Styling, light/dark themes                          |
| `app.js`        | Conversion logic, rate fetching, caching            |
| `currencies.js` | Currency code → name/symbol metadata                |

## How rates work

Rates are fetched once against a USD base and cached for 6 hours. Conversions
between any two currencies are computed as a cross-rate
(`amount × rate_to / rate_from`), so every currency pair is supported. Rates
are indicative and may differ from the rate your bank or provider offers.
