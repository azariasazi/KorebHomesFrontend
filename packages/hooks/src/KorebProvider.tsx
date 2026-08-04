import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { KorebApi } from '@koreb/api-client';
import type { Language } from '@koreb/types';

interface KorebContextValue {
  api: KorebApi;
  /** Needed to turn the backend's relative photo paths into loadable URLs. */
  apiBaseUrl: string;
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
}

const KorebContext = createContext<KorebContextValue | null>(null);

export interface KorebProviderProps {
  api: KorebApi;
  apiBaseUrl: string;
  children: ReactNode;
  /** Optional starting language — pass the user's saved choice if you have one. */
  initialLang?: Language;
  /** Optional: share one QueryClient if the app already made one. */
  queryClient?: QueryClient;
}

/**
 * Wraps the whole app once, at the root. Gives every screen:
 *   - the API client (so screens never build their own)
 *   - React Query caching (so revisiting a screen doesn't refetch needlessly)
 *   - the current language + a toggle
 *
 * Language currently resets when the app restarts. Persisting it (localStorage
 * on web, SecureStore/AsyncStorage on mobile) is a small follow-up — the
 * requirements ask for the choice to be remembered between visits.
 */
export function KorebProvider({
  api,
  apiBaseUrl,
  children,
  initialLang = 'en',
  queryClient,
}: KorebProviderProps) {
  const [lang, setLang] = useState<Language>(initialLang);

  const client = useMemo(
    () =>
      queryClient ??
      new QueryClient({
        defaultOptions: {
          queries: {
            // Ethiopian mobile data is often slow/metered, so we lean on the
            // cache: results stay "fresh" for a minute and survive tab focus
            // changes rather than refetching on every glance.
            staleTime: 60_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
    [queryClient]
  );

  const value = useMemo<KorebContextValue>(
    () => ({
      api,
      apiBaseUrl,
      lang,
      setLang,
      toggleLang: () => setLang((l) => (l === 'en' ? 'am' : 'en')),
    }),
    [api, apiBaseUrl, lang]
  );

  return (
    <QueryClientProvider client={client}>
      <KorebContext.Provider value={value}>{children}</KorebContext.Provider>
    </QueryClientProvider>
  );
}

export function useKoreb(): KorebContextValue {
  const ctx = useContext(KorebContext);
  if (!ctx) {
    throw new Error('useKoreb must be used inside <KorebProvider>. Check the app root.');
  }
  return ctx;
}

/** Convenience: `const { lang, t } = useLang()` for screens that only need text. */
export function useLang() {
  const { lang, setLang, toggleLang } = useKoreb();
  return { lang, setLang, toggleLang };
}
