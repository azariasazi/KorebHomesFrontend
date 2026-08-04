'use client';

import { useEffect } from 'react';
import { KorebProvider, useLang } from '@koreb/hooks';
import { api, API_BASE_URL } from '../lib/api';

/**
 * Keeps <body data-lang="am"> in sync with the chosen language, which is what
 * switches the page over to Noto Sans Ethiopic (see globals.css). Doing it
 * here means no individual component has to remember to set a font.
 */
function LangSideEffect() {
  const { lang } = useLang();
  useEffect(() => {
    document.body.setAttribute('data-lang', lang);
  }, [lang]);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <KorebProvider api={api} apiBaseUrl={API_BASE_URL}>
      <LangSideEffect />
      {children}
    </KorebProvider>
  );
}
