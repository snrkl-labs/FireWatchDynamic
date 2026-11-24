# Changelog

Fork of FireWatch Dynamic 1.1.10 (satvikmaurya). Fork versions are `1.1.10-snrkl-vX.YY.ZZ`: upstream version plus fork suffix.
Baseline: satvikmaurya's commit `238343c` (FireWatch Dynamic 1.1.10), the parent of the first BigFireWatch Dynamic commit.

## Unreleased
- Appstore screenshots in `store/` (Pebble Time 2, one per type style).

## 1.1.10-snrkl-v0.05.00 — 2026-11-24
- **Tower light blinks blue while charging:** 1 s on, 1 s off. The extra redraws only happen on the charger. With "Light shows battery" off the light stays solid red, as before.
- **Renamed BigFireWatch Dynamic** (was FireWatch snrkl): the name on the watch, in the Core app, on the settings page and in the appstore. Same UUID, so it replaces the installed face and keeps its settings.
- **Developer shown as snrkl-labs** (package.json `author`), in the Core app and the appstore, instead of upstream's "FirstPebble". Upstream is credited in the README and listing.

## 1.1.10-snrkl-v0.04.00 — 2026-11-24
Settings are back, as a page bundled inside the watchface (no Clay, no web hosting): type style and the new tower indicators. Includes everything in v0.03.00, which was never released as a final.
- **Type style** setting: Classic (upstream's fonts), Digital, Digital Large (default), Rounded Large, Rounded. Larger time and date, centred in the same boxes.
- **Tower smoke** shows while the phone is connected by Bluetooth. Setting "Smoke shows Bluetooth" (on by default); off, the smoke is always shown.
- **Tower light** shows battery: blue while charging, green at or above the low level, red below. Settings "Light shows battery" (on by default; off, the light is always red) and "Low battery level" (10–90%, default 40%).
- Scenes re-exported without the smoke and light, which are now separate overlays.
- Settings are stored on the phone and the watch, and the phone re-sends them when the face starts (e.g. after a reinstall).

## 1.1.10-snrkl-v0.03.00 — 2026-11-21
New night and day art by snrkl-labs, the first of the redrawn scene set. Includes everything in v0.02.00, which was never released as a final.
- Six new night scenes and six new day scenes (clear, partly, cloud, rain, storm, snow), Bayer-dithered to the Pebble 64-colour palette.
- Dawn now has its own scene for every condition (clear, partly, cloud, rain, storm, snow), all new art. Before, dawn reused its clear scene for partly cloudy and cloudy, and the dusk snow scene.
- Dusk now has its own scene for every condition too, all new art. Before, it shared dawn's clear and rain scenes. With this, all 24 scenes (4 times of day × 6 conditions) are snrkl-labs art.
- New night partly scene: partly cloudy at night no longer shows the clear scene.
- Night storm now uses its own art instead of the rain scene. The built-in weather has no storm condition, so storm scenes are still never selected.
- Day partly is now 200 px wide (upstream's was 201).
- Resource pack 45 KB → 150 KB, pbw 74 KB → 181 KB: dithered scenes compress less than the original flat fills, and there are seven more scenes.

## 1.1.10-snrkl-v0.02.00 — 2026-11-15
Phase 1: settings and weather come from the Pebble app instead of the face's own settings page. No art or layout changes.
- Weather from the Pebble app's built-in weather (your first weather location, provider chosen in the Pebble app). Removes upstream's four weather providers, both API keys and the custom location setting.
- °C/°F follows the Pebble app's units preference; 12/24h follows the watch's own time format.
- Removed the Clay settings page and `@rebble/clay`; the face no longer has a settings page. pbw 739 KB → 74 KB.
- Permissions: Location only (Internet and its five domains removed).
- Weather conditions map: heavy rain → rain scene, rain and snow → snow scene, unknown → keeps the last scene. The day-storm scene is no longer reachable (no thunder condition in the built-in weather).
- °C display now rounds instead of truncating.

## 1.1.10-snrkl-v0.01.00 — 2026-11-15
Phase 0: upstream 1.1.10 built on SDK 4.44 with the minimum changes. No feature or art changes; Clay settings unchanged.
- New UUID `c43624ab-91bb-46ec-a627-1f8e1db8bf6f`, so it installs alongside the store original.
- Shown on the watch as "FireWatch snrkl".
- Declares `usesPermissions` (manifest v2): Location, and Internet for the Open-Meteo, Open-Meteo geocoding, OpenWeatherMap, WeatherAPI.com and Weather.gov domains.
- package.json `version` is `0.01.00`: pebble-tool rejects `1.1.10-snrkl-v0.01.00` (max three numeric fields).
- Debug-only scene forcing for design renders (compiled out of release builds).
