/**
 * Koreb Homes locked palette.
 *
 * USAGE RULES (per brand guidelines — enforce these in every screen):
 *  - `gold`   → reserved STRICTLY for prices and primary call-to-action buttons.
 *               Never use it for decoration, backgrounds, or secondary buttons.
 *  - `green`  → small accent details ONLY (e.g. a "verified/done" dot or the
 *               completed step in a progress bar). Never a large fill or a
 *               primary button. The one documented exception is WhatsApp's
 *               own green glyph, which is a recognizable system mark, not a
 *               brand color choice.
 *  - `charcoal` → primary dark surface (headers, sign-up background, admin sidebar).
 *  - `cream`  → primary light surface / page background.
 */
export const colors = {
  charcoal: '#14181A',
  charcoalSoft: '#22282B',
  gold: '#C9A24B',
  goldDark: '#A8823A',
  goldTint: '#F1E6CC',
  green: '#3B6D30',
  cream: '#F6F3EC',
  line: 'rgba(20,24,26,0.10)',

  // Functional (not brand-restricted) colors used for system states.
  textMuted: '#8A9093',
  textBody: '#3A3F41',
  danger: '#8A3A3A',
  dangerTint: '#E3C6C6',
  success: '#3B6D30',
  white: '#FFFFFF',
} as const;

export type ColorToken = keyof typeof colors;
