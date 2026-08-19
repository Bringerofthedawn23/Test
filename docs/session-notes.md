# Session notes — Currency Converter Android app

Saved handoff so this work can be resumed later. Branch:
**`claude/currency-converter-app-w8vgfl`** (standalone; no PR — the repo's default
branch is an unrelated website that was intentionally left untouched).

## What was requested

1. "Build me an app that is an all-currency money converter."
2. Then: make it **an Android application** (not a website).
3. Then: **all of** — favorites row, signed release config, CI to auto-build the APK.
4. Then: **both of** — a tagged-release workflow, and an in-app rate-history sparkline.

## What was built

A dependency-light **native Android (Kotlin)** app converting between **160+
currencies**.

- **Live rates** from `open.er-api.com` (free, no key), USD-based; conversions use
  a cross-rate `amount × rateTo / rateFrom` so every pair works.
- **Offline-friendly**: 6-hour `SharedPreferences` cache + built-in fallback snapshot.
- **Searchable currency pickers**, **swap**, **refresh**, locale-aware formatting,
  remembered from/to selection, Material 3 light/dark, adaptive launcher icon.
- **Quick-pick chips** (USD, EUR, GBP, JPY, CNY, INR, CAD, AUD, CHF) set the target in one tap.
- **30-day trend sparkline** (custom `SparklineView`) using the Frankfurter/ECB
  time-series API; shown for supported pairs, hidden otherwise; race-guarded and
  cached per pair for the session.

Tech: Kotlin, Material 3, View Binding, `HttpURLConnection` + `org.json` (no
third-party networking/DI). `minSdk 26`, `compileSdk/targetSdk 35`, JDK 17.
Versions: **AGP 8.7.3 · Gradle 8.14.3 · Kotlin 2.0.21**.

## Key decisions

- **Web → Android pivot.** Initial version was a web app (HTML/CSS/JS). User asked
  for a native Android app instead, so the web prototype was removed and replaced.
- **Standalone, no PR.** Default branch `claude/claude-md-docs-323ulf` is an
  unrelated website with no shared git history; user chose to keep the app on its
  own branch rather than PR into or replace the site.
- Sandbox can't compile (no Android SDK; Google Maven blocked), so correctness was
  verified via **GitHub Actions CI** instead.

## Project layout

```
app/src/main/java/com/example/currencyconverter/
  MainActivity.kt        UI wiring, conversion, quick-picks, sparkline updates
  CurrencyRepository.kt  live rates, caching, offline fallback, history fetch
  Currencies.kt          160+ currency code -> name/symbol metadata
  SparklineView.kt       custom trend chart view
app/src/main/res/         layout, values (strings/colors/themes), drawables, mipmap icon
build.gradle.kts · app/build.gradle.kts · settings.gradle.kts · gradlew(+wrapper)
keystore.properties.example
.github/workflows/android.yml    CI: build debug APK on push/PR (+ signed release if secrets)
.github/workflows/release.yml    Tag v* -> signed APK attached to a GitHub Release
README.md
```

## CI status

Green on the latest commit. History: run #1 failed on one Kotlin bug (the UYU
symbol `"$U"` parsed as a string template — fixed by escaping to `"\$U"`); runs #2
and #3 passed. Debug APK is uploaded as the `app-debug` artifact on every push.

## Build & release

```bash
# Debug APK locally (needs Android SDK)
echo "sdk.dir=$HOME/Android/Sdk" > local.properties
./gradlew assembleDebug        # -> app/build/outputs/apk/debug/app-debug.apk

# Or download from GitHub: Actions tab -> latest green run -> Artifacts -> app-debug

# Signed release: create keystore.properties from the .example, then
./gradlew assembleRelease

# Tagged GitHub Release with attached APK
git tag v1.0 && git push origin v1.0
```

CI signing secrets (repo Settings → Secrets → Actions): `KEYSTORE_BASE64`
(`base64 -w0 release.keystore`), `KEYSTORE_STORE_PASSWORD`, `KEYSTORE_KEY_ALIAS`,
`KEYSTORE_KEY_PASSWORD`.

## Commit history on the branch

- `Add all-currency converter web app` (web prototype — later replaced)
- `Convert to native Android currency converter app`
- `Add quick-pick chips, release signing, and CI build`
- `Fix Kotlin compile error: escape $ in UYU currency symbol`
- `Add tagged-release workflow and 30-day trend sparkline`

## Suggested next steps (not yet done)

- Cut the first `v1.0` tag to produce a real GitHub Release.
- Unit tests for the cross-rate/conversion logic to guard against regressions in CI.
- Optional: persist locally-observed rate samples so a trend exists even for pairs
  the Frankfurter/ECB feed doesn't cover.
