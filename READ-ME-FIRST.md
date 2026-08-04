# Frontend Change Request 01 — installation

Four edited files + two small manual additions. Place the files at these exact paths
(overwrite the existing ones):

- apps/web/app/signup/page.tsx          (name fields at signup)
- apps/web/components/SiteHeader.tsx     (account menu shows name, not phone)
- apps/web/app/listing/[id]/page.tsx     (Telegram contact button)
- apps/mobile/app/signup.tsx             (name fields on mobile)

Then two quick manual edits (instructions in the .md files here):
1. i18n-additions.md  — add 6 keys to en.json and am.json
2. css-addition.md    — add one small style block to globals.css

No backend changes. No npm install needed. Restart dev servers to pick up changes.
