export const spacing = {
  xs: 4,
  sm: 8,
  md: 14,
  lg: 20,
  xl: 32,
  '2xl': 48,
} as const;

export const radius = {
  sm: 9,
  md: 11,
  lg: 14,
  xl: 16,
  pill: 999,
} as const;

export type SpacingToken = keyof typeof spacing;
export type RadiusToken = keyof typeof radius;
