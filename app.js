/* Currency Converter — live rates with graceful offline fallback. */
(function () {
  "use strict";

  // Free, no-key endpoint. Returns USD-based rates for ~160 currencies.
  var RATES_URL = "https://open.er-api.com/v6/latest/USD";
  var CACHE_KEY = "cc_rates_v1";
  var PREFS_KEY = "cc_prefs_v1";
  var CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

  // Minimal offline snapshot so the app still converts if the network is down
  // and nothing is cached. Approximate, USD-based; refreshed on first load.
  var FALLBACK = {
    base: "USD",
    time: null,
    rates: {
      USD: 1, EUR: 0.92, GBP: 0.79, JPY: 149, CNY: 7.24, INR: 83, CAD: 1.36,
      AUD: 1.52, CHF: 0.88, HKD: 7.82, SGD: 1.34, MXN: 17.1, BRL: 4.97,
      ZAR: 18.7, RUB: 92, KRW: 1330, TRY: 32, SEK: 10.5, NOK: 10.7, NZD: 1.64,
      AED: 3.67, SAR: 3.75, PLN: 3.95, THB: 35.5, IDR: 15700, MYR: 4.68,
    },
  };

  var els = {
    amount: document.getElementById("amount"),
    from: document.getElementById("fromCurrency"),
    to: document.getElementById("toCurrency"),
    swap: document.getElementById("swapBtn"),
    resultValue: document.getElementById("resultValue"),
    resultRate: document.getElementById("resultRate"),
    status: document.getElementById("status"),
    refresh: document.getElementById("refreshBtn"),
    theme: document.getElementById("themeToggle"),
    themeIcon: document.querySelector(".theme-toggle__icon"),
  };

  var state = { base: "USD", rates: {}, time: null };

  // ---- Formatting helpers -------------------------------------------------

  function meta(code) {
    return (window.CURRENCIES && window.CURRENCIES[code]) || { name: code, symbol: "" };
  }

  function label(code) {
    var m = meta(code);
    return m.name && m.name !== code ? code + " — " + m.name : code;
  }

  function formatMoney(value, code) {
    if (!isFinite(value)) return "—";
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: code,
        maximumFractionDigits: value !== 0 && Math.abs(value) < 1 ? 6 : 2,
      }).format(value);
    } catch (e) {
      // Unknown/unsupported ISO code for Intl — fall back to symbol + number.
      var m = meta(code);
      return (m.symbol ? m.symbol + " " : "") +
        value.toLocaleString(undefined, { maximumFractionDigits: 4 }) + " " + code;
    }
  }

  function parseAmount(raw) {
    if (raw == null) return NaN;
    var cleaned = String(raw).replace(/[^0-9.,-]/g, "");
    // Treat the last separator as the decimal point; strip the rest.
    var lastDot = cleaned.lastIndexOf(".");
    var lastComma = cleaned.lastIndexOf(",");
    if (lastComma > lastDot) {
      cleaned = cleaned.replace(/\./g, "").replace(",", ".");
    } else {
      cleaned = cleaned.replace(/,/g, "");
    }
    return parseFloat(cleaned);
  }

  // ---- Rendering ----------------------------------------------------------

  function populateSelects() {
    var codes = Object.keys(state.rates).sort(function (a, b) {
      return label(a).localeCompare(label(b));
    });
    [els.from, els.to].forEach(function (sel) {
      sel.innerHTML = "";
      codes.forEach(function (code) {
        var opt = document.createElement("option");
        opt.value = code;
        opt.textContent = label(code);
        sel.appendChild(opt);
      });
    });
  }

  function rateBetween(from, to) {
    var rf = state.rates[from];
    var rt = state.rates[to];
    if (!rf || !rt) return NaN;
    // All rates are quoted against the same base, so cross-rate = rt / rf.
    return rt / rf;
  }

  function convert() {
    var amount = parseAmount(els.amount.value);
    var from = els.from.value;
    var to = els.to.value;
    var rate = rateBetween(from, to);

    if (isNaN(amount)) {
      els.resultValue.textContent = "—";
      els.resultRate.textContent = "Enter an amount";
      return;
    }
    if (isNaN(rate)) {
      els.resultValue.textContent = "—";
      els.resultRate.textContent = "Rate unavailable";
      return;
    }

    els.resultValue.textContent = formatMoney(amount * rate, to);
    els.resultRate.textContent =
      "1 " + from + " = " + rate.toLocaleString(undefined, { maximumFractionDigits: 6 }) +
      " " + to;
    savePrefs();
  }

  function setStatus(text, kind) {
    els.status.textContent = text;
    els.status.className = "status" + (kind ? " status--" + kind : "");
  }

  function stamp(time) {
    if (!time) return "";
    var d = new Date(time);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleString(undefined, {
      year: "numeric", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  }

  // ---- Data loading -------------------------------------------------------

  function applyRates(data, sourceLabel) {
    state.base = data.base || "USD";
    state.rates = data.rates || {};
    state.time = data.time || null;

    var prevFrom = els.from.value;
    var prevTo = els.to.value;
    populateSelects();

    var prefs = loadPrefs();
    els.from.value = prevFrom || prefs.from || "USD";
    els.to.value = prevTo || prefs.to || "EUR";
    if (!els.from.value) els.from.value = "USD";
    if (!els.to.value) els.to.value = state.rates.EUR ? "EUR" : Object.keys(state.rates)[0];

    var when = stamp(state.time);
    setStatus(
      sourceLabel + (when ? " · updated " + when : ""),
      sourceLabel.indexOf("Offline") === 0 ? "warn" : "ok"
    );
    convert();
  }

  function readCache() {
    try {
      var raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      if (!parsed || !parsed.savedAt || !parsed.data) return null;
      return parsed;
    } catch (e) {
      return null;
    }
  }

  function writeCache(data) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ savedAt: Date.now(), data: data }));
    } catch (e) {
      /* storage full or unavailable — non-fatal */
    }
  }

  function fetchRates() {
    setStatus("Fetching live rates…");
    return fetch(RATES_URL, { cache: "no-store" })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(function (json) {
        if (json.result === "error") {
          throw new Error(json["error-type"] || "API error");
        }
        var data = {
          base: json.base_code || "USD",
          rates: json.rates || {},
          time: json.time_last_update_utc || new Date().toISOString(),
        };
        if (!Object.keys(data.rates).length) throw new Error("No rates returned");
        writeCache(data);
        applyRates(data, "Live rates");
        return true;
      });
  }

  function loadInitial() {
    var cache = readCache();
    if (cache) {
      var fresh = Date.now() - cache.savedAt < CACHE_TTL_MS;
      applyRates(cache.data, fresh ? "Cached rates" : "Cached rates (stale)");
      if (fresh) return; // Good enough; skip the network call.
    }
    fetchRates().catch(function (err) {
      if (cache) {
        applyRates(cache.data, "Cached rates (offline)");
      } else {
        applyRates(FALLBACK, "Offline estimates");
      }
      setStatus(els.status.textContent + " · " + err.message, "warn");
    });
  }

  // ---- Preferences & theme ------------------------------------------------

  function loadPrefs() {
    try {
      return JSON.parse(localStorage.getItem(PREFS_KEY)) || {};
    } catch (e) {
      return {};
    }
  }

  function savePrefs() {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify({
        from: els.from.value, to: els.to.value, theme: currentTheme(),
      }));
    } catch (e) { /* ignore */ }
  }

  function currentTheme() {
    return document.documentElement.getAttribute("data-theme") || "light";
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    els.themeIcon.textContent = theme === "dark" ? "☀️" : "🌙";
  }

  function initTheme() {
    var prefs = loadPrefs();
    var theme = prefs.theme ||
      (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark" : "light");
    applyTheme(theme);
  }

  // ---- Events -------------------------------------------------------------

  function bind() {
    els.amount.addEventListener("input", convert);
    els.from.addEventListener("change", convert);
    els.to.addEventListener("change", convert);

    els.swap.addEventListener("click", function () {
      var tmp = els.from.value;
      els.from.value = els.to.value;
      els.to.value = tmp;
      convert();
    });

    els.refresh.addEventListener("click", function () {
      fetchRates().catch(function (err) {
        setStatus("Couldn't refresh: " + err.message, "warn");
      });
    });

    els.theme.addEventListener("click", function () {
      applyTheme(currentTheme() === "dark" ? "light" : "dark");
      savePrefs();
    });
  }

  // ---- Boot ---------------------------------------------------------------

  initTheme();
  bind();
  // Seed with fallback so selects are never empty, then load real data.
  applyRates(FALLBACK, "Offline estimates");
  loadInitial();
})();
