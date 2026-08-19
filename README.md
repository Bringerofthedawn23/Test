# Currency Converter (Android)

A native Android app that converts between **160+ world currencies** using live
exchange rates, with offline caching and a built-in fallback so it keeps working
without a connection.

Built with Kotlin, Material 3, and View Binding — no third-party networking or
DI libraries, just the Android SDK.

## Features

- **All major & minor currencies** — the list is driven by the live rates feed
  (~160 currencies), each shown with a friendly name (e.g. `USD — United States
  Dollar`) and searchable in the dropdowns.
- **Live exchange rates** from the free [open.er-api.com](https://open.er-api.com)
  endpoint — no API key required.
- **Offline-friendly** — rates are cached for 6 hours in `SharedPreferences`,
  and a built-in fallback snapshot lets the app convert even on first launch
  with no network.
- **Quick-convert chips** — a row of common currencies (USD, EUR, GBP, JPY, …)
  that set the target currency in one tap.
- **30-day trend sparkline** — a small chart of the recent daily rate for the
  selected pair (via the Frankfurter/ECB time-series API); shown for supported
  pairs and quietly hidden otherwise.
- **Swap**, **Refresh**, and locale-aware currency formatting.
- Remembers your last **from/to** selection.
- **Light & dark** via Material 3 `DayNight`.

## Requirements

- Android Studio (Ladybug/2024.2 or newer recommended)
- Android SDK **Platform 35** and build-tools
- JDK 17
- Runs on Android 8.0 (API 26) and above

## Build & run

Open the project in Android Studio and press **Run**, or from the command line:

```bash
# Point Gradle at your Android SDK (or set ANDROID_HOME / sdk.dir).
echo "sdk.dir=$HOME/Android/Sdk" > local.properties

# Debug APK -> app/build/outputs/apk/debug/app-debug.apk
./gradlew assembleDebug

# Install on a connected device/emulator
./gradlew installDebug
```

> Note: the first build downloads the Android Gradle Plugin and AndroidX
> dependencies from Google's Maven repository, so an internet connection is
> needed the first time.

## Signed release builds

Release signing is read from a git-ignored `keystore.properties` at the project
root. Without it, `assembleRelease` still builds — just unsigned.

```bash
# 1. Generate a keystore (once)
keytool -genkeypair -v -keystore release.keystore \
  -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000

# 2. Configure signing
cp keystore.properties.example keystore.properties
#    then edit keystore.properties with your passwords/alias

# 3. Build the signed release APK
./gradlew assembleRelease
# -> app/build/outputs/apk/release/app-release.apk
```

`keystore.properties`, `*.keystore`, and `*.jks` are git-ignored — never commit
your keystore or its passwords.

## Continuous integration

`.github/workflows/android.yml` builds the app on every push and pull request:

- Builds the **debug APK** and uploads it as the `app-debug` build artifact.
- If the signing secrets below are set on the repository, it also builds and
  uploads a **signed release APK** (`app-release`).

Download the APK from the workflow run's **Artifacts** section. To enable signed
release builds in CI, add these repository secrets (Settings → Secrets and
variables → Actions):

| Secret | Value |
| --- | --- |
| `KEYSTORE_BASE64` | `base64 -w0 release.keystore` |
| `KEYSTORE_STORE_PASSWORD` | keystore password |
| `KEYSTORE_KEY_ALIAS` | key alias |
| `KEYSTORE_KEY_PASSWORD` | key password |

## Tagged releases

Pushing a version tag builds a signed release APK and publishes it as a GitHub
Release (`.github/workflows/release.yml`):

```bash
git tag v1.0
git push origin v1.0
```

The APK is attached to the release as `currency-converter-v1.0.apk`, with
auto-generated release notes. Signing uses the same secrets as CI; without them
the attached APK is unsigned.

## Project layout

```
app/
  src/main/
    AndroidManifest.xml
    java/com/example/currencyconverter/
      MainActivity.kt          UI wiring and conversion
      CurrencyRepository.kt    rate fetching, caching, offline fallback
      Currencies.kt            currency code -> name/symbol metadata
    res/
      layout/activity_main.xml
      values/                  strings, colors, theme
      drawable/                icons + result background
      mipmap-anydpi-v26/       adaptive launcher icon
build.gradle.kts               plugin versions
app/build.gradle.kts           module config & dependencies
```

## How rates work

Rates are fetched once against a USD base and cached. A conversion between any
two currencies is computed as a cross-rate: `amount × rateTo / rateFrom`, so
every currency pair is supported. Rates are indicative and may differ from the
rate your bank or provider offers.
