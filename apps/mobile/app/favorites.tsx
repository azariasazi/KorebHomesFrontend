import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ImageBackground,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { router } from 'expo-router';
import { colors, radius, spacing } from '@koreb/design-tokens';
import { t } from '@koreb/i18n';
import { useKoreb, useMe, useFavorites, useFavoriteIds, useToggleFavorite } from '@koreb/hooks';
import {
  formatPrice,
  listingThumb,
  listingTitle,
  listingTypeLabel,
  locationLabel,
  metaChips,
  soldRentedLabel,
  isSoldOrRented,
} from '@koreb/utils';
import type { Listing } from '@koreb/types';

export default function FavoritesScreen() {
  const { lang, apiBaseUrl } = useKoreb();
  const { data: me, isLoading: meLoading } = useMe();
  const signedIn = !!me;

  const { data: favorites, isLoading, refetch, isRefetching } = useFavorites(signedIn);
  const { ids: favoriteIds } = useFavoriteIds(signedIn);
  const toggleFavorite = useToggleFavorite();

  if (!meLoading && !signedIn) {
    return (
      <View style={styles.center}>
        <Text style={styles.stateTitle}>{t(lang, 'favorites.signInTitle')}</Text>
        <Text style={styles.stateBody}>{t(lang, 'favorites.signInBody')}</Text>
        <TouchableOpacity style={styles.goldBtn} onPress={() => router.push('/signup')}>
          <Text style={styles.goldBtnText}>{t(lang, 'favorites.signIn')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const entries = favorites ?? [];

  function renderCard({ item }: { item: { listing: Listing } }) {
    const listing = item.listing;
    const thumb = listingThumb(listing, apiBaseUrl);
    const favorited = favoriteIds.has(listing.id);

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.9}
        onPress={() => router.push(`/listing/${listing.id}`)}
      >
        <ImageBackground
          source={thumb ? { uri: thumb } : undefined}
          style={styles.cardPhoto}
          imageStyle={{ borderTopLeftRadius: 16, borderTopRightRadius: 16 }}
        >
          <View style={styles.tag}>
            <Text style={styles.tagText}>{listingTypeLabel(listing, lang)}</Text>
          </View>
          {isSoldOrRented(listing) && (
            <View style={styles.soldOverlay}>
              <Text style={styles.soldOverlayText}>{soldRentedLabel(listing, lang)}</Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.fav}
            onPress={() => toggleFavorite.mutate({ listingId: listing.id, isFavorited: favorited })}
          >
            <Svg viewBox="0 0 24 24" width={15} height={15} fill={colors.cream} stroke={colors.cream} strokeWidth={2}>
              <Path d="M12 21s-7-4.5-9.5-9A5.5 5.5 0 0112 5.5 5.5 5.5 0 0121.5 12c-2.5 4.5-9.5 9-9.5 9z" />
            </Svg>
          </TouchableOpacity>
        </ImageBackground>

        <View style={styles.cardInfo}>
          <Text style={styles.price}>{formatPrice(listing, lang)}</Text>
          <Text style={styles.cardTitle}>{listingTitle(listing, lang)}</Text>
          <View style={styles.locRow}>
            <Svg viewBox="0 0 24 24" width={11} height={11} fill="none" stroke="#8A9093" strokeWidth={2}>
              <Path d="M12 21s7-6.5 7-11a7 7 0 10-14 0c0 4.5 7 11 7 11z" />
              <Circle cx="12" cy="10" r="2.5" />
            </Svg>
            <Text style={styles.locText}>{locationLabel(listing)}</Text>
          </View>
          <View style={styles.metaRow}>
            {metaChips(listing, lang).map((m) => (
              <Text key={m} style={styles.metaText}>{m}</Text>
            ))}
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.h1}>{t(lang, 'favorites.title')}</Text>
        <Text style={styles.sub}>
          {entries.length > 0
            ? t(lang, 'favorites.count', { count: entries.length })
            : t(lang, 'favorites.subtitle')}
        </Text>
      </View>

      {isLoading || meLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.gold} />
        </View>
      ) : entries.length === 0 ? (
        <View style={styles.center}>
          <Svg viewBox="0 0 24 24" width={40} height={40} fill="none" stroke="#C9C6BE" strokeWidth={1.6} style={{ marginBottom: 14 }}>
            <Path d="M12 21s-7-4.5-9.5-9A5.5 5.5 0 0112 5.5 5.5 5.5 0 0121.5 12c-2.5 4.5-9.5 9-9.5 9z" />
          </Svg>
          <Text style={styles.stateTitle}>{t(lang, 'favorites.emptyTitle')}</Text>
          <Text style={styles.stateBody}>{t(lang, 'favorites.emptyBody')}</Text>
          <TouchableOpacity style={styles.goldBtn} onPress={() => router.push('/home')}>
            <Text style={styles.goldBtnText}>{t(lang, 'favorites.browse')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(e) => e.listing.id}
          renderItem={renderCard}
          contentContainerStyle={{ padding: spacing.lg, paddingTop: 4 }}
          refreshing={isRefetching}
          onRefresh={() => refetch()}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  header: { paddingHorizontal: spacing.lg, paddingTop: 50, paddingBottom: 10 },
  h1: { fontSize: 24, fontWeight: '700', color: colors.charcoal },
  sub: { fontSize: 12.5, color: '#8A9093', marginTop: 2 },

  card: { backgroundColor: '#fff', borderRadius: radius.xl, borderWidth: 1, borderColor: colors.line, overflow: 'hidden', marginBottom: spacing.md },
  cardPhoto: { height: 150, backgroundColor: '#DCD3BC' },
  tag: { position: 'absolute', top: 10, left: 10, backgroundColor: colors.charcoal, borderRadius: radius.pill, paddingVertical: 4, paddingHorizontal: 9 },
  tagText: { color: colors.cream, fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
  soldOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(20,24,26,0.5)' },
  soldOverlayText: { color: '#F6F3EC', fontWeight: '800', fontSize: 16, letterSpacing: 2 },
  fav: { position: 'absolute', top: 10, right: 10, width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(20,24,26,0.45)', alignItems: 'center', justifyContent: 'center' },
  cardInfo: { padding: 14 },
  price: { fontSize: 18, fontWeight: '700', color: colors.goldDark, marginBottom: 4 },
  cardTitle: { fontSize: 13.5, fontWeight: '600', color: colors.charcoal, marginBottom: 3 },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  locText: { fontSize: 11.5, color: '#8A9093' },
  metaRow: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  metaText: { fontSize: 11.5, color: '#5B6265' },

  stateTitle: { fontSize: 18, fontWeight: '700', color: colors.charcoal, marginBottom: 8, textAlign: 'center' },
  stateBody: { fontSize: 13.5, color: '#8A9093', textAlign: 'center', lineHeight: 20, marginBottom: 18, maxWidth: 320 },
  goldBtn: { backgroundColor: colors.gold, borderRadius: radius.md, paddingVertical: 13, paddingHorizontal: 22 },
  goldBtnText: { color: colors.charcoal, fontWeight: '700', fontSize: 14 },
});
