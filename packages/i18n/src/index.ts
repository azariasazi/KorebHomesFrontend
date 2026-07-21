import en from './en.json';
import am from './am.json';

export type Language = 'en' | 'am';

const dictionaries = { en, am } as const;

// Flattens { auth: { welcomeTitle: "..." } } into "auth.welcomeTitle" style keys,
// so both apps can call t('auth.welcomeTitle') the same way.
type Dict = typeof en;

function getNested(obj: unknown, path: string): string | undefined {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj) as string | undefined;
}

/**
 * Look up a translated string by dotted key, e.g. t('am', 'auth.sendCode').
 * Supports {{placeholder}} interpolation: t('en', 'postListing.stepOf', { step: 2, total: 5 }).
 * Falls back to English, then to the raw key, so a missing translation
 * never crashes the app — it just shows something recognizable.
 */
export function t(
  lang: Language,
  key: string,
  vars?: Record<string, string | number>
): string {
  const raw =
    getNested(dictionaries[lang], key) ??
    getNested(dictionaries.en, key) ??
    key;

  if (!vars) return raw;

  return Object.entries(vars).reduce(
    (str, [k, v]) => str.replace(new RegExp(`{{${k}}}`, 'g'), String(v)),
    raw
  );
}

export { en, am };
export type { Dict };
