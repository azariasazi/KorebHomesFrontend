import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, radius, spacing } from '@koreb/design-tokens';
import { t } from '@koreb/i18n';
import { useKoreb } from '@koreb/hooks';
import { ADDIS_SUBCITIES } from '@koreb/utils';
import type { PropertyType, ListingType, SortOption } from '@koreb/types';

const PROPERTY_TYPES: { value: PropertyType; key: string }[] = [
  { value: 'HOUSE', key: 'searchFilters.house' },
  { value: 'APARTMENT', key: 'searchFilters.apartment' },
  { value: 'LAND', key: 'searchFilters.land' },
  { value: 'COMMERCIAL', key: 'searchFilters.commercial' },
];

const SORTS: [SortOption, string][] = [
  ['newest', 'searchFilters.sortNewest'],
  ['price_asc', 'searchFilters.sortPriceAsc'],
  ['price_desc', 'searchFilters.sortPriceDesc'],
];

/**
 * Filters are passed in via route params and returned the same way — the home
 * feed reads them back and re-runs its query. Keeping the query itself on the
 * home screen (not here) means this screen is purely a form.
 */
export default function SearchFiltersScreen() {
  const { lang } = useKoreb();
  const p = useLocalSearchParams<{
    propertyType?: string;
    listingType?: string;
    minPrice?: string;
    maxPrice?: string;
    minBedrooms?: string;
    subCity?: string;
    keyword?: string;
    sort?: string;
  }>();

  const [propertyType, setPropertyType] = useState<PropertyType | undefined>(
    (p.propertyType as PropertyType) || undefined
  );
  const [listingType, setListingType] = useState<ListingType | undefined>(
    (p.listingType as ListingType) || undefined
  );
  const [minPrice, setMinPrice] = useState(p.minPrice ?? '');
  const [maxPrice, setMaxPrice] = useState(p.maxPrice ?? '');
  const [minBedrooms, setMinBedrooms] = useState<number | undefined>(
    p.minBedrooms ? Number(p.minBedrooms) : undefined
  );
  const [subCity, setSubCity] = useState<string | undefined>(p.subCity || undefined);
  const [keyword, setKeyword] = useState(p.keyword ?? '');
  const [sort, setSort] = useState<SortOption>((p.sort as SortOption) || 'newest');

  function reset() {
    setPropertyType(undefined);
    setListingType(undefined);
    setMinPrice('');
    setMaxPrice('');
    setMinBedrooms(undefined);
    setSubCity(undefined);
    setKeyword('');
    setSort('newest');
  }

  function apply() {
    // Return the chosen filters to the home feed. Empty values are omitted so
    // the home screen can tell "unset" from "set to blank".
    router.replace({
      pathname: '/home',
      params: {
        propertyType: propertyType ?? '',
        listingType: listingType ?? '',
        minPrice: minPrice || '',
        maxPrice: maxPrice || '',
        minBedrooms: minBedrooms != null ? String(minBedrooms) : '',
        subCity: subCity ?? '',
        keyword: keyword || '',
        sort,
        applied: String(Date.now()), // forces home to re-read even if values match
      },
    });
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10}>
          <Text style={styles.close}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t(lang, 'searchFilters.title')}</Text>
        <TouchableOpacity onPress={reset} hitSlop={10}>
          <Text style={styles.reset}>{t(lang, 'searchFilters.reset')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 30 }}>
        {/* keyword */}
        <Text style={styles.label}>{t(lang, 'searchFilters.keyword')}</Text>
        <TextInput
          style={styles.field}
          placeholder={t(lang, 'searchFilters.keywordPlaceholder')}
          placeholderTextColor="#9AA0A2"
          value={keyword}
          onChangeText={setKeyword}
        />

        {/* listing type */}
        <Text style={styles.label}>{t(lang, 'searchFilters.listingType')}</Text>
        <View style={styles.pillRow}>
          <Pill label={t(lang, 'searchFilters.any')} selected={!listingType} onPress={() => setListingType(undefined)} />
          <Pill label={t(lang, 'searchFilters.forSale')} selected={listingType === 'SALE'} onPress={() => setListingType('SALE')} />
          <Pill label={t(lang, 'searchFilters.forRent')} selected={listingType === 'RENT'} onPress={() => setListingType('RENT')} />
        </View>

        {/* property type */}
        <Text style={styles.label}>{t(lang, 'searchFilters.propertyType')}</Text>
        <View style={styles.pillRow}>
          <Pill label={t(lang, 'searchFilters.any')} selected={!propertyType} onPress={() => setPropertyType(undefined)} />
          {PROPERTY_TYPES.map((pt) => (
            <Pill
              key={pt.value}
              label={t(lang, pt.key)}
              selected={propertyType === pt.value}
              onPress={() => setPropertyType(pt.value)}
            />
          ))}
        </View>

        {/* price */}
        <Text style={styles.label}>{t(lang, 'searchFilters.priceRange')}</Text>
        <View style={styles.priceRow}>
          <TextInput
            style={[styles.field, { flex: 1 }]}
            placeholder={t(lang, 'searchFilters.noMin')}
            placeholderTextColor="#9AA0A2"
            keyboardType="numeric"
            value={minPrice}
            onChangeText={setMinPrice}
          />
          <Text style={styles.dash}>—</Text>
          <TextInput
            style={[styles.field, { flex: 1 }]}
            placeholder={t(lang, 'searchFilters.noMax')}
            placeholderTextColor="#9AA0A2"
            keyboardType="numeric"
            value={maxPrice}
            onChangeText={setMaxPrice}
          />
        </View>

        {/* bedrooms */}
        <Text style={styles.label}>{t(lang, 'searchFilters.bedrooms')}</Text>
        <View style={styles.pillRow}>
          <Pill label={t(lang, 'searchFilters.any')} selected={!minBedrooms} onPress={() => setMinBedrooms(undefined)} />
          {[1, 2, 3, 4].map((n) => (
            <Pill key={n} label={`${n}+`} selected={minBedrooms === n} onPress={() => setMinBedrooms(n)} />
          ))}
        </View>

        {/* sub-city */}
        <Text style={styles.label}>{t(lang, 'searchFilters.subCity')}</Text>
        <View style={styles.pillRow}>
          <Pill label={t(lang, 'searchFilters.anyArea')} selected={!subCity} onPress={() => setSubCity(undefined)} />
          {ADDIS_SUBCITIES.map((s) => (
            <Pill key={s} label={s} selected={subCity === s} onPress={() => setSubCity(s)} />
          ))}
        </View>

        {/* sort */}
        <Text style={styles.label}>{t(lang, 'searchFilters.sortBy')}</Text>
        <View style={styles.pillRow}>
          {SORTS.map(([value, key]) => (
            <Pill key={value} label={t(lang, key)} selected={sort === value} onPress={() => setSort(value)} />
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.applyBtn} onPress={apply}>
          <Text style={styles.applyText}>{t(lang, 'searchFilters.applyGeneric')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function Pill({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.pill, selected && styles.pillSel]} onPress={onPress}>
      <Text style={[styles.pillText, selected && styles.pillTextSel]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingTop: 50, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: colors.line,
  },
  close: { fontSize: 20, color: colors.charcoal, fontWeight: '600' },
  title: { fontSize: 18, fontWeight: '700', color: colors.charcoal },
  reset: { fontSize: 13, fontWeight: '600', color: colors.goldDark },

  label: { fontSize: 12.5, fontWeight: '700', color: colors.charcoal, marginTop: 22, marginBottom: 10 },
  field: {
    borderWidth: 1.4, borderColor: colors.line, borderRadius: 11, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: colors.charcoal, backgroundColor: '#fff',
  },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dash: { color: '#9AA0A2', fontSize: 16 },

  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { paddingVertical: 9, paddingHorizontal: 15, borderRadius: 999, borderWidth: 1.2, borderColor: colors.line, backgroundColor: '#fff' },
  pillSel: { backgroundColor: colors.charcoal, borderColor: colors.charcoal },
  pillText: { fontSize: 12.5, fontWeight: '600', color: colors.charcoal },
  pillTextSel: { color: colors.cream },

  footer: { padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: '#fff' },
  applyBtn: { backgroundColor: colors.gold, borderRadius: radius.md, paddingVertical: 15, alignItems: 'center' },
  applyText: { color: colors.charcoal, fontWeight: '700', fontSize: 15 },
});
