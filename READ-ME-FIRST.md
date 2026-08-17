# CR07 — Password Auth Migration (Frontend)

Auth changed from phone+OTP to PASSWORD-BASED. This bundle covers the foundation,
signup, login, and password recovery. Place these files at the exact paths shown.

## Files to drop in (overwrite existing)

    packages/api-client/src/auth.ts          ← all new auth methods
    packages/types/src/index.ts              ← CurrentUser gains new fields
    packages/i18n/src/en.json                ← new auth strings
    packages/i18n/src/am.json                ← new auth strings (Amharic)
    apps/web/app/signup/page.tsx             ← signup + login (password)
    apps/web/app/forgot-password/page.tsx    ← NEW screen (reset password)
    apps/mobile/app/signup.tsx               ← signup + login (password)
    apps/mobile/app/forgot-password.tsx      ← NEW screen (reset password)

## One manual CSS step

Open `apps/web/app/globals.css` and paste in the contents of `css-additions.css`
(from this bundle) — three small classes for the password hint, the "forgot
password?" link, and the "we sent a code" note.

## After installing

- No new libraries. Run `npm install` from the repo root only if the build asks.
- Restart both dev servers.

## What works now

- SIGNUP: first/last name + phone + password + OPTIONAL email + role → a code is
  sent (by email if you gave one, else SMS) → enter code → logged in.
- LOGIN: phone OR email + password → straight in (no code).
- FORGOT PASSWORD: enter phone/email → code → new password → log in.

## Still to come (later stages — NOT in this bundle)

- The "verify your phone before posting" gate for email-first / Google users
  (backend `needsPhone`). Until that's added, an email-first user could reach the
  Post screen without a phone; the backend will reject the post, so it's safe,
  just not yet a friendly prompt. This is the next stage.
- Profile screen wiring for change-password / change-email / change-phone.

## Dev reminder

The verification code is printed to the BACKEND CONSOLE in dev (no real SMS/email
provider yet). Watch that terminal to get the code.
