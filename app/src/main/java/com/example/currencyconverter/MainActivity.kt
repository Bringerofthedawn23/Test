package com.example.currencyconverter

import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import android.widget.ArrayAdapter
import androidx.appcompat.app.AppCompatActivity
import com.example.currencyconverter.databinding.ActivityMainBinding
import com.google.android.material.chip.Chip
import java.text.NumberFormat
import java.text.SimpleDateFormat
import java.util.Currency
import java.util.Date
import java.util.Locale

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private lateinit var repo: CurrencyRepository

    private var rates: CurrencyRepository.Rates = CurrencyRepository.FALLBACK
    private var codes: List<String> = emptyList()
    private val labelToCode = HashMap<String, String>()

    private var fromCode: String = "USD"
    private var toCode: String = "EUR"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        repo = CurrencyRepository(this)

        restorePreferences()
        setupInputs()
        setupQuickPicks()

        // Show something immediately, then refresh from the network.
        applyRates(repo.loadCachedOrFallback())
        if (!repo.hasFreshCache()) refresh()
    }

    /** A row of chips that quickly set the target ("To") currency. */
    private fun setupQuickPicks() {
        binding.quickPickGroup.removeAllViews()
        for (code in COMMON_CURRENCIES) {
            val chip = layoutInflater.inflate(
                R.layout.item_quick_chip, binding.quickPickGroup, false
            ) as Chip
            chip.text = code
            chip.setOnClickListener {
                toCode = code
                binding.toDropdown.setText(Currencies.label(toCode), false)
                convert()
                savePreferences()
            }
            binding.quickPickGroup.addView(chip)
        }
    }

    // ---- UI wiring ----------------------------------------------------------

    private fun setupInputs() {
        binding.amountInput.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, a: Int, b: Int, c: Int) {}
            override fun onTextChanged(s: CharSequence?, a: Int, b: Int, c: Int) {}
            override fun afterTextChanged(s: Editable?) = convert()
        })

        binding.fromDropdown.setOnItemClickListener { _, _, _, _ ->
            labelToCode[binding.fromDropdown.text.toString()]?.let { fromCode = it }
            convert()
            savePreferences()
        }
        binding.toDropdown.setOnItemClickListener { _, _, _, _ ->
            labelToCode[binding.toDropdown.text.toString()]?.let { toCode = it }
            convert()
            savePreferences()
        }

        // If the user typed something that isn't a valid currency, snap back.
        binding.fromDropdown.setOnFocusChangeListener { _, hasFocus ->
            if (!hasFocus) binding.fromDropdown.setText(Currencies.label(fromCode), false)
        }
        binding.toDropdown.setOnFocusChangeListener { _, hasFocus ->
            if (!hasFocus) binding.toDropdown.setText(Currencies.label(toCode), false)
        }

        binding.swapButton.setOnClickListener {
            val tmp = fromCode
            fromCode = toCode
            toCode = tmp
            binding.fromDropdown.setText(Currencies.label(fromCode), false)
            binding.toDropdown.setText(Currencies.label(toCode), false)
            convert()
            savePreferences()
        }

        binding.refreshButton.setOnClickListener { refresh() }
    }

    private fun applyRates(newRates: CurrencyRepository.Rates) {
        rates = newRates
        codes = newRates.rates.keys.sortedBy { Currencies.label(it) }

        labelToCode.clear()
        val labels = codes.map { code ->
            val label = Currencies.label(code)
            labelToCode[label] = code
            label
        }

        val adapter = ArrayAdapter(this, android.R.layout.simple_list_item_1, labels)
        binding.fromDropdown.setAdapter(adapter)
        binding.toDropdown.setAdapter(adapter)

        // Keep current selections valid against the new rate set.
        if (!newRates.rates.containsKey(fromCode)) fromCode = if (newRates.rates.containsKey("USD")) "USD" else codes.firstOrNull() ?: "USD"
        if (!newRates.rates.containsKey(toCode)) toCode = if (newRates.rates.containsKey("EUR")) "EUR" else codes.getOrNull(1) ?: "USD"

        binding.fromDropdown.setText(Currencies.label(fromCode), false)
        binding.toDropdown.setText(Currencies.label(toCode), false)

        showStatus(newRates)
        convert()
    }

    // ---- Conversion ---------------------------------------------------------

    private fun convert() {
        val amount = binding.amountInput.text?.toString()?.trim()?.toDoubleOrNull()
        val rateFrom = rates.rates[fromCode]
        val rateTo = rates.rates[toCode]

        if (amount == null) {
            binding.resultValue.text = getString(R.string.dash)
            binding.resultRate.text = getString(R.string.enter_amount)
            return
        }
        if (rateFrom == null || rateTo == null || rateFrom == 0.0) {
            binding.resultValue.text = getString(R.string.dash)
            binding.resultRate.text = getString(R.string.rate_unavailable)
            return
        }

        val rate = rateTo / rateFrom
        binding.resultValue.text = formatMoney(amount * rate, toCode)
        binding.resultRate.text = getString(
            R.string.rate_line, fromCode, trimNumber(rate), toCode
        )
    }

    private fun formatMoney(value: Double, code: String): String {
        return try {
            NumberFormat.getCurrencyInstance().apply {
                currency = Currency.getInstance(code)
                maximumFractionDigits = if (value != 0.0 && kotlin.math.abs(value) < 1) 6 else 2
            }.format(value)
        } catch (e: Exception) {
            // Non-ISO or unsupported code: fall back to symbol + plain number.
            val sym = Currencies.symbol(code)
            val prefix = if (sym.isNotEmpty()) "$sym " else ""
            "$prefix${trimNumber(value)} $code"
        }
    }

    private fun trimNumber(value: Double): String {
        val nf = NumberFormat.getNumberInstance(Locale.getDefault())
        nf.maximumFractionDigits = 6
        return nf.format(value)
    }

    // ---- Network refresh ----------------------------------------------------

    private fun refresh() {
        binding.statusText.text = getString(R.string.fetching)
        repo.fetchLive(
            post = { runnable -> runOnUiThread(runnable) },
            onSuccess = { applyRates(it) },
            onError = { message ->
                // Keep showing whatever we already have; note the failure.
                showStatus(rates)
                binding.statusText.text = getString(R.string.status_offline, message)
            },
        )
    }

    private fun showStatus(r: CurrencyRepository.Rates) {
        val when_ = formatStamp(r.updated)
        binding.statusText.text = when (r.source) {
            CurrencyRepository.Source.LIVE ->
                getString(R.string.status_live, when_)
            CurrencyRepository.Source.CACHE ->
                getString(R.string.status_cached, when_)
            CurrencyRepository.Source.CACHE_STALE ->
                getString(R.string.status_cached_stale, when_)
            CurrencyRepository.Source.FALLBACK ->
                getString(R.string.status_estimates)
        }
    }

    private fun formatStamp(raw: String?): String {
        if (raw.isNullOrEmpty()) return ""
        return try {
            // Endpoint returns RFC-1123 style, e.g. "Tue, 19 Aug 2026 00:02:31 +0000".
            val parser = SimpleDateFormat("EEE, dd MMM yyyy HH:mm:ss Z", Locale.US)
            val date: Date = parser.parse(raw) ?: return ""
            SimpleDateFormat("d MMM yyyy, HH:mm", Locale.getDefault()).format(date)
        } catch (e: Exception) {
            raw
        }
    }

    // ---- Preferences --------------------------------------------------------

    private fun restorePreferences() {
        val p = getSharedPreferences("cc_prefs", MODE_PRIVATE)
        fromCode = p.getString("from", "USD") ?: "USD"
        toCode = p.getString("to", "EUR") ?: "EUR"
    }

    private fun savePreferences() {
        getSharedPreferences("cc_prefs", MODE_PRIVATE).edit()
            .putString("from", fromCode)
            .putString("to", toCode)
            .apply()
    }

    companion object {
        private val COMMON_CURRENCIES = listOf(
            "USD", "EUR", "GBP", "JPY", "CNY", "INR", "CAD", "AUD", "CHF"
        )
    }
}
