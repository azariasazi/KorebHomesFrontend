# Koreb Homes — Frontend Monorepo

Bilingual (English/Amharic) real estate platform for Ethiopia. This repo holds
the **website** (Next.js) and the **Android/iOS app** (React Native via Expo),
both built on the same shared code so they never drift out of sync with each
other or with the backend contract.

## What's in here

```
apps/
  web/      → the public website + web-based Admin Panel (Next.js)
  mobile/   → the Android/iOS app, one codebase (Expo)
packages/
  api-client/     → typed wrapper around every backend endpoint (auth, listings, photos, favorites, payments, admin)
  types/          → shared TypeScript types matching the backend's exact API-REFERENCE.md shapes
  design-tokens/  → the locked palette (charcoal/gold/green/cream) and fonts (Playfair Display, Inter, Noto Sans Ethiopic)
  i18n/           → English + Amharic strings, shared by both apps
```

If you only remember one rule: **shared logic goes in `packages/`, screen-specific
code goes in `apps/`.** That's what keeps web and mobile from silently diverging.

## Prerequisites

- Node.js 20+
- The backend running locally (see `KorebHomesBackend` repo) — the frontend
  expects it at `http://localhost:3000/api/v1` by default.

## First-time setup

```bash
npm install
```

This installs dependencies for every app and package at once (that's what the
"workspaces" in the root `package.json` do).

## Running the website

```bash
cp apps/web/.env.example apps/web/.env.local
npm run dev:web
```

Visit `http://localhost:3001` (or whatever port it prints). You'll land on the
Sign Up screen.

## Running the mobile app

```bash
npm run dev:mobile
```

This starts the Expo dev server and prints a QR code — scan it with the
**Expo Go** app on your phone (free, on the App Store / Play Store) to see the
app live on your own device without needing a full Xcode/Android Studio setup.

> **Before this will look right:** the mobile app expects five font files in
> `apps/mobile/assets/fonts/` — see `PLACE_FONT_FILES_HERE.txt` in that folder
> for exactly which ones and where to get them (all free on Google Fonts). The
> app icon and splash screen are currently solid placeholder colors — swap in
> the real Koreb Homes logo files from the brand guidelines when ready.

## Testing OTP login locally

The backend doesn't have a real SMS provider wired up yet — per
`API-REFERENCE.md`, the verification code is printed to the backend's own
terminal window. Watch that terminal after tapping "Send Verification Code" to
get the code to type in.

## Where things stand

- ✅ Sign Up screen — built on both web and mobile, wired to the real
  `/auth/otp/request` and `/auth/otp/verify` endpoints
- ⏳ Home Feed, Listing Detail, Post a Listing, Admin Panel, Owner Dashboard,
  Search Filters, Favorites, Agent Dashboard — next, screen by screen

## A note on the Fayda (national ID) step

The backend doesn't have Fayda verification wired up yet. The Post a Listing
flow is being designed with a placeholder "Verify your identity to publish"
step so we're not blocked now and don't have to retrofit the flow later —
see the `postListing.verificationRequiredTitle` / `verificationRequiredBody`
strings in `packages/i18n/src/en.json`.
