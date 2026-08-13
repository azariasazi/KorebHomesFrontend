import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ImageBackground,
  Image,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import Svg, { Polygon, Path, Circle } from 'react-native-svg';
import MapView, { Marker, Callout, PROVIDER_DEFAULT } from 'react-native-maps';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, radius, spacing } from '@koreb/design-tokens';
import { t } from '@koreb/i18n';
import { useKoreb, useMe, useListingsSearch, useFavoriteIds, useToggleFavorite } from '@koreb/hooks';
import {
  formatPrice,
  isSoldOrRented,
  listingThumb,
  listingTitle,
  listingTypeLabel,
  locationLabel,
  metaChips,
  soldRentedLabel,
} from '@koreb/utils';
import type { Listing, ListingType, PropertyType, SortOption } from '@koreb/types';

type PropertyChip = PropertyType | 'ALL';

export default function HomeFeedScreen() {
  const { lang, toggleLang, apiBaseUrl } = useKoreb();
  const { data: me } = useMe();

  // Filters returned from the Search Filters modal arrive as route params.
  const incoming = useLocalSearchParams<{
    propertyType?: string;
    listingType?: string;
    minPrice?: string;
    maxPrice?: string;
    minBedrooms?: string;
    subCity?: string;
    keyword?: string;
    sort?: string;
    applied?: string;
  }>();

  const [listingType, setListingType] = useState<ListingType | undefined>('RENT');
  const [propertyType, setPropertyType] = useState<PropertyChip>('ALL');
  const [keyword, setKeyword] = useState('');
  const [keywordDraft, setKeywordDraft] = useState('');
  const [minPrice, setMinPrice] = useState<number | undefined>();
  const [maxPrice, setMaxPrice] = useState<number | undefined>();
  const [minBedrooms, setMinBedrooms] = useState<number | undefined>();
  const [subCity, setSubCity] = useState<string | undefined>();
  const [sort, setSort] = useState<SortOption>('newest');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  // When the filter modal applies, it navigates back to /home with params +
  // a changing `applied` stamp. Read them into state once per application.
  useEffect(() => {
    if (!incoming.applied) return;
    setPropertyType((incoming.propertyType as PropertyChip) || 'ALL');
    setListingType((incoming.listingType as ListingType) || undefined);
    setMinPrice(incoming.minPrice ? Number(incoming.minPrice) : undefined);
    setMaxPrice(incoming.maxPrice ? Number(incoming.maxPrice) : undefined);
    setMinBedrooms(incoming.minBedrooms ? Number(incoming.minBedrooms) : undefined);
    setSubCity(incoming.subCity || undefined);
    setKeyword(incoming.keyword || '');
    setKeywordDraft(incoming.keyword || '');
    setSort((incoming.sort as SortOption) || 'newest');
  }, [incoming.applied]);

  const params = useMemo(
    () => ({
      listingType,
      propertyType: propertyType === 'ALL' ? undefined : propertyType,
      keyword: keyword || undefined,
      minPrice,
      maxPrice,
      minBedrooms,
      subCity,
      sort,
    }),
    [listingType, propertyType, keyword, minPrice, maxPrice, minBedrooms, subCity, sort]
  );

  const activeFilterCount =
    (propertyType !== 'ALL' ? 1 : 0) +
    (minPrice ? 1 : 0) +
    (maxPrice ? 1 : 0) +
    (minBedrooms ? 1 : 0) +
    (subCity ? 1 : 0) +
    (keyword ? 1 : 0);

  function openFilters() {
    router.push({
      pathname: '/search-filters',
      params: {
        propertyType: propertyType === 'ALL' ? '' : propertyType,
        listingType: listingType ?? '',
        minPrice: minPrice != null ? String(minPrice) : '',
        maxPrice: maxPrice != null ? String(maxPrice) : '',
        minBedrooms: minBedrooms != null ? String(minBedrooms) : '',
        subCity: subCity ?? '',
        keyword,
        sort,
      },
    });
  }

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useListingsSearch(params);

  const { ids: favoriteIds } = useFavoriteIds();
  const toggleFavorite = useToggleFavorite();

  const listings: Listing[] = data?.pages.flatMap((p) => p.items) ?? [];

  const chips: { value: PropertyChip | 'RENT' | 'SALE'; label: string; kind: 'type' | 'prop' }[] = [
    { value: 'RENT', label: t(lang, 'common.forRent'), kind: 'type' },
    { value: 'SALE', label: t(lang, 'common.forSale'), kind: 'type' },
    { value: 'APARTMENT', label: lang === 'am' ? 'አፓርታማ' : 'Apartment', kind: 'prop' },
    { value: 'HOUSE', label: lang === 'am' ? 'ቤት' : 'House', kind: 'prop' },
    { value: 'LAND', label: lang === 'am' ? 'መሬት' : 'Land', kind: 'prop' },
    { value: 'COMMERCIAL', label: lang === 'am' ? 'የንግድ' : 'Commercial', kind: 'prop' },
  ];

  function isChipActive(c: (typeof chips)[number]) {
    return c.kind === 'type' ? listingType === c.value : propertyType === c.value;
  }

  function onChipPress(c: (typeof chips)[number]) {
    if (c.kind === 'type') {
      setListingType(listingType === c.value ? undefined : (c.value as ListingType));
    } else {
      setPropertyType(propertyType === c.value ? 'ALL' : (c.value as PropertyType));
    }
  }

  function renderCard({ item }: { item: Listing }) {
    const thumb = listingThumb(item, apiBaseUrl);
    const favorited = favoriteIds.has(item.id);

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.9}
        onPress={() => router.push(`/listing/${item.id}`)}
      >
        <ImageBackground
          source={thumb ? { uri: thumb } : undefined}
          style={styles.cardPhoto}
          imageStyle={{ borderTopLeftRadius: 16, borderTopRightRadius: 16 }}
        >
          <View style={styles.tag}>
            <Text style={styles.tagText}>{listingTypeLabel(item, lang)}</Text>
          </View>
          {isSoldOrRented(item) && (
            <View style={styles.soldOverlay}>
              <Text style={styles.soldOverlayText}>{soldRentedLabel(item, lang)}</Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.fav}
            onPress={() =>
              toggleFavorite.mutate({ listingId: item.id, isFavorited: favorited })
            }
          >
            <Svg viewBox="0 0 24 24" width={15} height={15}
              fill={favorited ? colors.cream : 'none'} stroke={colors.cream} strokeWidth={2}>
              <Path d="M12 21s-7-4.5-9.5-9A5.5 5.5 0 0112 5.5 5.5 5.5 0 0121.5 12c-2.5 4.5-9.5 9-9.5 9z" />
            </Svg>
          </TouchableOpacity>
        </ImageBackground>

        <View style={styles.cardInfo}>
          <Text style={styles.price}>{formatPrice(item, lang)}</Text>
          <Text style={styles.cardTitle}>{listingTitle(item, lang)}</Text>
          <View style={styles.locRow}>
            <Svg viewBox="0 0 24 24" width={11} height={11} fill="none" stroke="#8A9093" strokeWidth={2}>
              <Path d="M12 21s7-6.5 7-11a7 7 0 10-14 0c0 4.5 7 11 7 11z" />
              <Circle cx="12" cy="10" r="2.5" />
            </Svg>
            <Text style={styles.locText}>{locationLabel(item)}</Text>
          </View>
          <View style={styles.metaRow}>
            {metaChips(item, lang).map((m) => (
              <Text key={m} style={styles.metaText}>{m}</Text>
            ))}
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      {/* -------- header -------- */}
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <Svg width={22} height={22} viewBox="0 0 40 40">
            <Polygon points="20,3 35,20 20,23 5,20" fill={colors.gold} />
            <Polygon points="20,23 35,20 20,37 5,20" fill={colors.green} />
          </Svg>
          <Text style={styles.brand}>{t(lang, 'common.appName')}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <TouchableOpacity style={styles.langPill} onPress={toggleLang}>
            <Text style={styles.langPillText}>EN / አማ</Text>
          </TouchableOpacity>
          {me ? (
            <TouchableOpacity style={styles.avatarBtn} onPress={() => router.push('/account')}>
              <Text style={styles.avatarBtnText}>
                {(me.name || me.agencyName || '?').trim().charAt(0).toUpperCase()}
              </Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity style={styles.authBtn} onPress={() => router.push('/signup')}>
                <Text style={styles.authBtnText}>{lang === 'am' ? 'ግባ' : 'Log In'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.authBtn, styles.authBtnGold]}
                onPress={() => router.push({ pathname: '/signup', params: { mode: 'signup' } })}
              >
                <Text style={styles.authBtnText}>{lang === 'am' ? 'ተመዝገብ' : 'Sign Up'}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* -------- search -------- */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="#8A9093" strokeWidth={2.2}>
            <Circle cx="11" cy="11" r="7" />
            <Path d="M21 21l-4.3-4.3" />
          </Svg>
          <TextInput
            style={styles.searchInput}
            placeholder={t(lang, 'home.searchPlaceholder')}
            placeholderTextColor="#9AA0A2"
            value={keywordDraft}
            onChangeText={setKeywordDraft}
            returnKeyType="search"
            onSubmitEditing={() => setKeyword(keywordDraft.trim())}
          />
        </View>
        <TouchableOpacity style={styles.filterBtn} onPress={openFilters}>
          <Svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke={colors.cream} strokeWidth={2}>
            <Path d="M4 6h16M7 12h10M10 18h4" />
          </Svg>
          {activeFilterCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* -------- filter chips -------- */}
      <FlatList
        data={chips}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(c) => `${c.kind}-${c.value}`}
        style={styles.chipStrip}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.sm }}
        renderItem={({ item: c }) => (
          <TouchableOpacity
            style={[styles.chip, isChipActive(c) && styles.chipActive]}
            onPress={() => onChipPress(c)}
          >
            <Text style={[styles.chipText, isChipActive(c) && styles.chipTextActive]}>{c.label}</Text>
          </TouchableOpacity>
        )}
      />

      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>{t(lang, 'home.featuredNearYou')}</Text>
        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[styles.viewToggleBtn, viewMode === 'list' && styles.viewToggleBtnActive]}
            onPress={() => setViewMode('list')}
          >
            <Text style={[styles.viewToggleText, viewMode === 'list' && styles.viewToggleTextActive]}>
              {t(lang, 'home.list')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewToggleBtn, viewMode === 'map' && styles.viewToggleBtnActive]}
            onPress={() => setViewMode('map')}
          >
            <Text style={[styles.viewToggleText, viewMode === 'map' && styles.viewToggleTextActive]}>
              {t(lang, 'home.map')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* -------- results -------- */}
      {isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator color={colors.gold} />
        </View>
      ) : isError ? (
        <View style={styles.centerState}>
          <Text style={styles.stateTitle}>
            {lang === 'am' ? 'ማስታወቂያዎችን መጫን አልተቻለም' : "Couldn't load listings"}
          </Text>
          <Text style={styles.stateBody}>
            {error instanceof Error ? error.message : ''}
          </Text>
          <TouchableOpacity style={styles.outlineBtn} onPress={() => refetch()}>
            <Text style={styles.outlineBtnText}>{lang === 'am' ? 'እንደገና ሞክር' : 'Try again'}</Text>
          </TouchableOpacity>
        </View>
      ) : listings.length === 0 ? (
        <View style={styles.centerState}>
          <Text style={styles.stateTitle}>
            {lang === 'am' ? 'ምንም ማስታወቂያ አልተገኘም' : 'No listings found'}
          </Text>
          <Text style={styles.stateBody}>
            {lang === 'am' ? 'ማጣሪያዎችን ያስተካክሉ።' : 'Try adjusting your filters.'}
          </Text>
        </View>
      ) : viewMode === 'map' ? (
        <ListingsMapView listings={listings} lang={lang} apiBaseUrl={apiBaseUrl} />
      ) : (
        <FlatList
          data={listings}
          keyExtractor={(l) => l.id}
          renderItem={renderCard}
          contentContainerStyle={{ paddingBottom: spacing.lg }}
          refreshing={isRefetching}
          onRefresh={() => refetch()}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) fetchNextPage();
          }}
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator color={colors.gold} style={{ marginVertical: spacing.lg }} />
            ) : null
          }
        />
      )}

      {/* -------- floating post button -------- */}
      <TouchableOpacity style={styles.postFab} onPress={() => router.push('/post-listing')}>
        <Svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke={colors.charcoal} strokeWidth={2.4}>
          <Path d="M12 5v14M5 12h14" />
        </Svg>
        <Text style={styles.postFabText}>{lang === 'am' ? 'ለጥፍ' : 'Post'}</Text>
      </TouchableOpacity>

      {/* -------- bottom nav (4 tabs for Phase 1 — chat arrives in Phase 2) -------- */}
      {/* -------- bottom nav -------- */}
      <View style={styles.bottomNav}>
        {[
          { key: 'home', label: lang === 'am' ? 'መነሻ' : 'Home', route: '/home' },
          { key: 'dashboard', label: lang === 'am' ? 'ማስታወቂያዎቼ' : 'My Listings', route: '/dashboard' },
          { key: 'favorites', label: lang === 'am' ? 'የተቀመጡ' : 'Favorites', route: '/favorites' },
          { key: 'account', label: lang === 'am' ? 'መለያ' : 'Account', route: '/account' },
        ].map((tab) => (
          <TouchableOpacity key={tab.key} style={styles.navItem} onPress={() => tab.route !== '/home' && router.push(tab.route)}>
            <Text style={[styles.navText, tab.key === 'home' && styles.navTextActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

/**
 * Mobile map view for the Home Feed. Plots each listing with coordinates as a
 * gold price-pin; tapping opens a callout card that navigates to the detail
 * screen. Listings without coordinates are noted above the map rather than
 * dropped silently.
 */
function ListingsMapView({
  listings,
  lang,
  apiBaseUrl,
}: {
  listings: Listing[];
  lang: 'en' | 'am';
  apiBaseUrl: string;
}) {
  const withCoords = listings.filter((l) => l.latitude != null && l.longitude != null);
  const missing = listings.length - withCoords.length;

  // Center on the first listing that has coordinates, else Addis Ababa.
  const first = withCoords[0];
  const region = {
    latitude: first ? (first.latitude as number) : 9.0108,
    longitude: first ? (first.longitude as number) : 38.7613,
    latitudeDelta: 0.08,
    longitudeDelta: 0.08,
  };

  return (
    <View style={{ flex: 1 }}>
      {missing > 0 && (
        <Text style={styles.mapMissing}>
          {lang === 'am'
            ? `${missing} ማስታወቂያ አካባቢ ስለሌለው አልታየም።`
            : `${missing} listing${missing === 1 ? '' : 's'} not shown — no location set.`}
        </Text>
      )}
      <MapView provider={PROVIDER_DEFAULT} style={styles.mapContainer} initialRegion={region}>
        {withCoords.map((listing) => (
          <Marker
            key={listing.id}
            coordinate={{ latitude: listing.latitude as number, longitude: listing.longitude as number }}
          >
            <View style={styles.pricePin}>
              <Text style={styles.pricePinText}>{formatPrice(listing, lang)}</Text>
            </View>
            <Callout onPress={() => router.push(`/listing/${listing.id}`)}>
              <View style={styles.callout}>
                {listingThumb(listing, apiBaseUrl) ? (
                  <Image source={{ uri: listingThumb(listing, apiBaseUrl) as string }} style={styles.calloutThumb} />
                ) : (
                  <View style={styles.calloutThumb} />
                )}
                <Text style={styles.calloutPrice}>{formatPrice(listing, lang)}</Text>
                <Text style={styles.calloutTitle} numberOfLines={1}>
                  {listingTitle(listing, lang)}
                </Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  brand: { fontSize: 16, fontWeight: '600', color: colors.charcoal },
  langPill: {
    backgroundColor: 'rgba(20,24,26,0.06)', borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.pill, paddingVertical: 5, paddingHorizontal: 10,
  },
  langPillText: { fontSize: 11, fontWeight: '700', color: colors.charcoal },
  authBtn: {
    borderWidth: 1.2, borderColor: colors.charcoal, borderRadius: radius.pill,
    paddingVertical: 7, paddingHorizontal: 13,
  },
  authBtnGold: { backgroundColor: colors.gold, borderColor: colors.gold },
  authBtnText: { fontSize: 11.5, fontWeight: '700', color: colors.charcoal },
  avatarBtn: {
    width: 30, height: 30, borderRadius: 15, backgroundColor: colors.gold,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarBtnText: { fontSize: 13, fontWeight: '700', color: colors.charcoal },

  searchRow: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  searchBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: '#fff', borderWidth: 1.4, borderColor: colors.line,
    borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 13, color: colors.charcoal, padding: 0 },
  filterBtn: {
    width: 42, height: 42, borderRadius: radius.md, backgroundColor: colors.charcoal,
    alignItems: 'center', justifyContent: 'center',
  },
  filterBadge: {
    position: 'absolute', top: -4, right: -4, minWidth: 18, height: 18, borderRadius: 9,
    backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
  },
  filterBadgeText: { fontSize: 10, fontWeight: '800', color: colors.charcoal },

  chipStrip: { flexGrow: 0, marginBottom: spacing.md },
  chip: {
    borderRadius: radius.pill, backgroundColor: '#fff', borderWidth: 1.2,
    borderColor: colors.line, paddingVertical: 7, paddingHorizontal: 13,
  },
  chipActive: { backgroundColor: colors.charcoal, borderColor: colors.charcoal },
  chipText: { fontSize: 12, fontWeight: '600', color: colors.charcoal },
  chipTextActive: { color: colors.cream },

  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.charcoal },
  viewToggle: { flexDirection: 'row', backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line, borderRadius: 999, padding: 2 },
  viewToggleBtn: { paddingVertical: 5, paddingHorizontal: 14, borderRadius: 999 },
  viewToggleBtnActive: { backgroundColor: colors.charcoal },
  viewToggleText: { fontSize: 12, fontWeight: '600', color: colors.charcoal },
  viewToggleTextActive: { color: colors.cream },
  mapContainer: { flex: 1, marginHorizontal: spacing.lg, marginBottom: spacing.lg, borderRadius: 16, overflow: 'hidden' },
  mapMissing: { fontSize: 11.5, color: '#8A9093', paddingHorizontal: spacing.lg, marginBottom: 6 },
  pricePin: { backgroundColor: colors.gold, borderColor: colors.charcoal, borderWidth: 1.5, borderRadius: 999, paddingVertical: 3, paddingHorizontal: 8 },
  pricePinText: { color: colors.charcoal, fontWeight: '700', fontSize: 11 },
  callout: { width: 180 },
  calloutThumb: { width: 176, height: 90, borderRadius: 8, marginBottom: 5, backgroundColor: '#DCD3BC' },
  calloutPrice: { color: colors.goldDark, fontWeight: '700', fontSize: 13 },
  calloutTitle: { color: colors.charcoal, fontSize: 12, marginTop: 2 },

  card: {
    marginHorizontal: spacing.lg, marginBottom: spacing.md, backgroundColor: '#fff',
    borderRadius: radius.xl, borderWidth: 1, borderColor: colors.line, overflow: 'hidden',
  },
  cardPhoto: { height: 150, backgroundColor: '#DCD3BC' },
  tag: {
    position: 'absolute', top: 10, left: 10, backgroundColor: colors.charcoal,
    borderRadius: radius.pill, paddingVertical: 4, paddingHorizontal: 9,
  },
  tagText: { color: colors.cream, fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
  fav: {
    position: 'absolute', top: 10, right: 10, width: 30, height: 30, borderRadius: 15,
    backgroundColor: 'rgba(20,24,26,0.45)', alignItems: 'center', justifyContent: 'center',
  },
  soldOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(20,24,26,0.5)' },
  soldOverlayText: { color: '#F6F3EC', fontWeight: '800', fontSize: 16, letterSpacing: 2 },
  cardInfo: { padding: 14 },
  price: { fontSize: 18, fontWeight: '700', color: colors.goldDark, marginBottom: 4 },
  cardTitle: { fontSize: 13.5, fontWeight: '600', color: colors.charcoal, marginBottom: 3 },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  locText: { fontSize: 11.5, color: '#8A9093' },
  metaRow: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  metaText: { fontSize: 11.5, color: '#5B6265' },

  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  stateTitle: { fontSize: 16, fontWeight: '700', color: colors.charcoal, marginBottom: 6, textAlign: 'center' },
  stateBody: { fontSize: 13, color: '#8A9093', textAlign: 'center', marginBottom: spacing.md },
  outlineBtn: {
    borderWidth: 1.4, borderColor: colors.charcoal, borderRadius: radius.md,
    paddingVertical: 12, paddingHorizontal: 20,
  },
  outlineBtnText: { fontWeight: '700', color: colors.charcoal, fontSize: 13.5 },

  postFab: {
    position: 'absolute', right: 18, bottom: 78, flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.gold, borderRadius: 999, paddingVertical: 12, paddingHorizontal: 18,
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 4,
  },
  postFabText: { color: colors.charcoal, fontWeight: '700', fontSize: 13.5 },
  bottomNav: {
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
    paddingVertical: 14, paddingBottom: 18, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: colors.line,
  },
  navItem: { alignItems: 'center', paddingVertical: 4, paddingHorizontal: 10, minWidth: 64 },
  navText: { fontSize: 13, fontWeight: '600', color: '#6B7275' },
  navTextActive: { color: colors.gold, fontWeight: '700' },
});
