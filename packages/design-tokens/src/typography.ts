/**
 * Font families:
 *  - heading  → Playfair Display (serif) — screen titles, prices, section headers
 *  - body     → Inter (sans) — everything else in English
 *  - amharic  → Noto Sans Ethiopic — used whenever rendering Amharic script,
 *               paired to match Inter's weight system so EN/AM feel consistent
 *               side by side.
 */
export const fontFamily = {
  heading: 'Playfair Display',
  body: 'Inter',
  amharic: 'Noto Sans Ethiopic',
} as const;

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

// A shared type scale so headings/body text are visually consistent
// between the web and mobile apps even though they render at different sizes.
export const fontSize = {
  xs: 11,
  sm: 12.5,
  base: 14.5,
  md: 16,
  lg: 19,
  xl: 22,
  '2xl': 26,
  '3xl': 30,
} as const;

export type FontSizeToken = keyof typeof fontSize;
