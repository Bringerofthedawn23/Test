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
