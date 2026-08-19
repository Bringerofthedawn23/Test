package com.example.currencyconverter

import android.content.Context
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.net.URLEncoder
import java.time.LocalDate
import java.util.concurrent.Executors

/**
 * Loads USD-based exchange rates, caches them, and provides an offline
 * fallback. All rates are quoted against a single base (USD), so a conversion
 * between any two currencies is the cross-rate `rateTo / rateFrom`.
 */
class CurrencyRepository(context: Context) {

    /** Immutable snapshot of a set of rates. */
    data class Rates(
        val base: String,
        val rates: Map<String, Double>,
        val updated: String?,
        val source: Source,
    )

    enum class Source { LIVE, CACHE, CACHE_STALE, FALLBACK }

    private val prefs = context.applicationContext
        .getSharedPreferences("cc_store", Context.MODE_PRIVATE)
    private val io = Executors.newSingleThreadExecutor()
    private val historyCache = HashMap<String, List<Double>>()

    // ---- Public API ---------------------------------------------------------

    /** Best data available right now, without touching the network. */
    fun loadCachedOrFallback(): Rates {
        readCache()?.let { (rates, savedAt) ->
            val fresh = System.currentTimeMillis() - savedAt < CACHE_TTL_MS
            return rates.copy(source = if (fresh) Source.CACHE else Source.CACHE_STALE)
        }
        return FALLBACK
    }

    /** True when the cached rates are fresh enough to skip a network fetch. */
    fun hasFreshCache(): Boolean {
        val savedAt = prefs.getLong(KEY_SAVED_AT, 0L)
        return savedAt > 0L && System.currentTimeMillis() - savedAt < CACHE_TTL_MS
    }

    /**
     * Fetch live rates off the main thread. Exactly one of [onSuccess] or
     * [onError] is delivered via [post] (typically the activity's main handler).
     */
    fun fetchLive(
        post: (Runnable) -> Unit,
        onSuccess: (Rates) -> Unit,
        onError: (String) -> Unit,
    ) {
        io.execute {
            try {
                val json = httpGetJson(RATES_URL)
                if (json.optString("result") == "error") {
                    throw RuntimeException(json.optString("error-type", "API error"))
                }
                val ratesJson = json.getJSONObject("rates")
                val map = HashMap<String, Double>(ratesJson.length())
                val keys = ratesJson.keys()
                while (keys.hasNext()) {
                    val k = keys.next()
                    map[k] = ratesJson.getDouble(k)
                }
                if (map.isEmpty()) throw RuntimeException("No rates returned")

                val rates = Rates(
                    base = json.optString("base_code", "USD"),
                    rates = map,
                    updated = if (json.has("time_last_update_utc"))
                        json.getString("time_last_update_utc") else null,
                    source = Source.LIVE,
                )
                writeCache(rates)
                post(Runnable { onSuccess(rates) })
            } catch (e: Exception) {
                post(Runnable { onError(e.message ?: "Network error") })
            }
        }
    }

    /**
     * Fetch a ~30-day daily history of the FROM→TO rate for a simple trend
     * sparkline, using the Frankfurter time-series API (ECB data). Only its
     * ~30 supported currencies return data; anything else (or no network)
     * yields an empty list, and the caller simply hides the chart. Results are
     * cached in-memory for the session, keyed by the pair.
     */
    fun fetchHistory(
        from: String,
        to: String,
        post: (Runnable) -> Unit,
        onResult: (List<Double>) -> Unit,
    ) {
        if (from == to) {
            post(Runnable { onResult(emptyList()) })
            return
        }
        historyCache["${from}_$to"]?.let {
            post(Runnable { onResult(it) })
            return
        }
        io.execute {
            try {
                val end = LocalDate.now()
                val start = end.minusDays(30)
                val url = "https://api.frankfurter.app/$start..$end" +
                    "?from=${URLEncoder.encode(from, "UTF-8")}" +
                    "&to=${URLEncoder.encode(to, "UTF-8")}"
                val json = httpGetJson(url)
                val ratesObj = json.getJSONObject("rates")
                val series = ratesObj.keys().asSequence().sorted().mapNotNull { date ->
                    val v = ratesObj.getJSONObject(date).optDouble(to, Double.NaN)
                    if (v.isNaN()) null else v
                }.toList()
                historyCache["${from}_$to"] = series
                post(Runnable { onResult(series) })
            } catch (e: Exception) {
                post(Runnable { onResult(emptyList()) })
            }
        }
    }

    // ---- Networking ---------------------------------------------------------

    private fun httpGetJson(urlStr: String): JSONObject {
        val conn = (URL(urlStr).openConnection() as HttpURLConnection).apply {
            requestMethod = "GET"
            connectTimeout = 15_000
            readTimeout = 15_000
            setRequestProperty("Accept", "application/json")
        }
        try {
            val code = conn.responseCode
            if (code != HttpURLConnection.HTTP_OK) {
                throw RuntimeException("HTTP $code")
            }
            val body = conn.inputStream.bufferedReader().use { it.readText() }
            return JSONObject(body)
        } finally {
            conn.disconnect()
        }
    }

    // ---- Cache --------------------------------------------------------------

    private fun writeCache(rates: Rates) {
        val obj = JSONObject()
        obj.put("base", rates.base)
        obj.put("updated", rates.updated ?: JSONObject.NULL)
        obj.put("rates", JSONObject(rates.rates as Map<*, *>))
        prefs.edit()
            .putString(KEY_RATES, obj.toString())
            .putLong(KEY_SAVED_AT, System.currentTimeMillis())
            .apply()
    }

    private fun readCache(): Pair<Rates, Long>? {
        val raw = prefs.getString(KEY_RATES, null) ?: return null
        val savedAt = prefs.getLong(KEY_SAVED_AT, 0L)
        return try {
            val obj = JSONObject(raw)
            val ratesJson = obj.getJSONObject("rates")
            val map = HashMap<String, Double>(ratesJson.length())
            val keys = ratesJson.keys()
            while (keys.hasNext()) {
                val k = keys.next()
                map[k] = ratesJson.getDouble(k)
            }
            val rates = Rates(
                base = obj.optString("base", "USD"),
                rates = map,
                updated = if (obj.isNull("updated")) null else obj.optString("updated"),
                source = Source.CACHE,
            )
            rates to savedAt
        } catch (e: Exception) {
            null
        }
    }

    companion object {
        // Free, no-key endpoint returning USD-based rates for ~160 currencies.
        private const val RATES_URL = "https://open.er-api.com/v6/latest/USD"
        private const val KEY_RATES = "rates_json"
        private const val KEY_SAVED_AT = "rates_saved_at"
        private const val CACHE_TTL_MS = 6L * 60 * 60 * 1000 // 6 hours

        /** Approximate USD-based snapshot so the app works with no network. */
        val FALLBACK = Rates(
            base = "USD",
            updated = null,
            source = Source.FALLBACK,
            rates = mapOf(
                "USD" to 1.0, "EUR" to 0.92, "GBP" to 0.79, "JPY" to 149.0,
                "CNY" to 7.24, "INR" to 83.0, "CAD" to 1.36, "AUD" to 1.52,
                "CHF" to 0.88, "HKD" to 7.82, "SGD" to 1.34, "MXN" to 17.1,
                "BRL" to 4.97, "ZAR" to 18.7, "RUB" to 92.0, "KRW" to 1330.0,
                "TRY" to 32.0, "SEK" to 10.5, "NOK" to 10.7, "NZD" to 1.64,
                "AED" to 3.67, "SAR" to 3.75, "PLN" to 3.95, "THB" to 35.5,
                "IDR" to 15700.0, "MYR" to 4.68,
            ),
        )
    }
}
