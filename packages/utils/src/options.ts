/**
 * The amenity keys a user can pick when posting. Kept here (not hardcoded in a
 * screen) so web and mobile offer exactly the same set, and so it's one edit to
 * add a new one. Labels come from @koreb/utils `amenityLabel`.
 */
export const AMENITY_OPTIONS = [
  'parking',
  'water_tank',
  'generator',
  'security',
  'elevator',
  'balcony',
  'wifi',
  'ac',
  'hot_water',
  'gym',
  'pool',
  'garden',
  'private_entrance',
] as const;

/** Rough sub-city list for Addis Ababa — the common ones people search by. */
export const ADDIS_SUBCITIES = [
  'Bole',
  'Yeka',
  'Kirkos',
  'Lideta',
  'Arada',
  'Addis Ketema',
  'Gulele',
  'Kolfe Keranio',
  'Nifas Silk-Lafto',
  'Akaky Kaliti',
  'Lemi Kura',
] as const;
