import { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Linking,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { colors, radius, spacing } from '@koreb/design-tokens';
import { t } from '@koreb/i18n';
import { useKoreb, useMe, useMyListings, useManageMyListing, useInitiatePayment } from '@koreb/hooks';
import {
  formatPrice,
  listingTitle,
  listingThumb,
  locationLabel,
  statusColor,
  rejectionLabel,
} from '@koreb/utils';
import type { Listing, ListingStatus } from '@koreb/types';

type StatusFilter = 'ALL' | ListingStatus;

export default function DashboardScreen() {
  const { lang, apiBaseUrl } = useKoreb();
  const { data: me, isLoading: meLoading } = useMe();
  const { data: listings, isLoading, refetch, isRefetching } = useMyListings(!!me && me.role !== 'BUYER_RENTER');
  const { remove, renew, resubmit, markSoldRented, markAvailable } = useManageMyListing();
  const initiatePayment = useInitiatePayment();

  const [filter, setFilter] = useState<StatusFilter>('ALL');
  const [deleting, setDeleting] = useState<Listing | null>(null);

  const filters: { value: StatusFilter; labelKey: string }[] = [
    { value: 'ALL', labelKey: 'dashboard.all' },
    { value: 'LIVE', labelKey: 'dashboard.live' },
    { value: 'AWAITING_REVIEW', labelKey: 'dashboard.underReview' },
    { value: 'REJECTED', labelKey: 'dashboard.rejected' },
    { value: 'UNPUBLISHED', labelKey: 'dashboard.unpublished' },
    { value: 'SOLD', labelKey: 'dashboard.soldRented' },
  ];

  const filtered = useMemo(() => {
    const all = listings ?? [];
    if (filter === 'ALL') return all;
    if (filter === 'SOLD') return all.filter((l) => l.status === 'SOLD' || l.status === 'RENTED');
    return all.filter((l) => l.status === filter);
  }, [listings, filter]);

  if (meLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.gold} />
      </View>
    );
  }

  if (!me || me.role === 'BUYER_RENTER') {
    return (
      <View style={styles.center}>
        <Text style={styles.stateTitle}>{t(lang, 'dashboard.notOwnerTitle')}</Text>
        <Text style={styles.stateBody}>{t(lang, 'dashboard.notOwnerBody')}</Text>
      </View>
    );
  }

  async function completePayment(id: string) {
    try {
      const pay = await initiatePayment.mutateAsync(id);
      Linking.openURL(pay.checkoutUrl);
    } catch {
      /* fee disabled → 400; nothing to do here */
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <View>
          <Text style={styles.h1}>{t(lang, 'dashboard.title')}</Text>
          <Text style={styles.sub}>{t(lang, 'dashboard.subtitle')}</Text>
        </View>
        <TouchableOpacity style={styles.newBtn} onPress={() => router.push('/post-listing')}>
          <Text style={styles.newBtnText}>+ {t(lang, 'dashboard.newListing')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterStrip}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: 8 }}
      >
        {filters.map((f) => (
          <TouchableOpacity
            key={f.value}
            style={[styles.chip, filter === f.value && styles.chipActive]}
            onPress={() => setFilter(f.value)}
          >
            <Text style={[styles.chipText, filter === f.value && styles.chipTextActive]}>
              {t(lang, f.labelKey)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.gold} />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.stateTitle}>
            {t(lang, listings && listings.length > 0 ? 'dashboard.emptyFilterTitle' : 'dashboard.emptyTitle')}
          </Text>
          <Text style={styles.stateBody}>
            {t(lang, listings && listings.length > 0 ? 'dashboard.emptyFilterBody' : 'dashboard.emptyBody')}
          </Text>
          {(!listings || listings.length === 0) && (
            <TouchableOpacity style={styles.goldBtn} onPress={() => router.push('/post-listing')}>
              <Text style={styles.goldBtnText}>{t(lang, 'dashboard.newListing')}</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: spacing.lg, paddingTop: 4, gap: 14 }}
          refreshing={isRefetching}
          onRefresh={() => refetch()}
        >
          {filtered.map((listing) => {
            const thumb = listingThumb(listing, apiBaseUrl);
            const sc = statusColor(listing.status);
            return (
              <View key={listing.id} style={styles.card}>
                <View style={styles.cardMain}>
                  <ImageBackground
                    source={thumb ? { uri: thumb } : undefined}
                    style={styles.thumb}
                    imageStyle={{ borderRadius: 10 }}
                  />
                  <View style={{ flex: 1 }}>
                    <View style={styles.cardTop}>
                      <Text style={styles.price}>{formatPrice(listing, lang)}</Text>
                      <View style={[styles.badge, { backgroundColor: sc.bg }]}>
                        <Text style={[styles.badgeText, { color: sc.fg }]}>
                          {t(lang, `dashboard.status${listing.status}`)}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {listingTitle(listing, lang)} — {locationLabel(listing)}
                    </Text>
                    <Text style={styles.cardMeta}>
                      {t(lang, 'dashboard.views', { count: listing.viewCount })}
                    </Text>
                  </View>
                </View>

                {listing.status === 'REJECTED' && (
                  <View style={[styles.note, { backgroundColor: 'rgba(138,58,58,0.05)' }]}>
                    <Text style={[styles.noteTitle, { color: '#8A3A3A' }]}>
                      {t(lang, 'dashboard.rejectedReasonTitle')}
                    </Text>
                    <Text style={[styles.noteBody, { color: '#8A3A3A' }]}>
                      {listing.rejectionCode ? rejectionLabel(listing.rejectionCode, lang) : ''}
                      {listing.rejectionReason ? ` — ${listing.rejectionReason}` : ''}
                    </Text>
                  </View>
                )}
                {listing.status === 'AWAITING_REVIEW' && (
                  <View style={[styles.note, { backgroundColor: 'rgba(168,130,58,0.06)' }]}>
                    <Text style={[styles.noteBody, { color: '#A8823A' }]}>{t(lang, 'dashboard.reviewNote')}</Text>
                  </View>
                )}
                {listing.status === 'UNPUBLISHED' && (
                  <View style={[styles.note, { backgroundColor: 'rgba(20,24,26,0.03)' }]}>
                    <Text style={[styles.noteBody, { color: '#5B6265' }]}>{t(lang, 'dashboard.unpublishedNote')}</Text>
                  </View>
                )}
                {(listing.status === 'SOLD' || listing.status === 'RENTED') && (
                  <View style={[styles.note, { backgroundColor: 'rgba(20,24,26,0.03)' }]}>
                    <Text style={[styles.noteBody, { color: '#5B6265' }]}>
                      {t(lang, listing.status === 'SOLD' ? 'dashboard.soldNote' : 'dashboard.rentedNote')}
                    </Text>
                  </View>
                )}

                <View style={styles.actions}>
                  {(listing.status === 'LIVE' ||
                    listing.status === 'AWAITING_REVIEW' ||
                    listing.status === 'REJECTED') && (
                    <TouchableOpacity
                      style={styles.outlineSm}
                      onPress={() => router.push(`/listing/${listing.id}?preview=mine`)}
                    >
                      <Text style={styles.outlineSmText}>{t(lang, 'dashboard.viewLive')}</Text>
                    </TouchableOpacity>
                  )}
                  {listing.status === 'REJECTED' && (
                    <TouchableOpacity style={styles.goldSm} onPress={() => resubmit.mutate(listing.id)} disabled={resubmit.isPending}>
                      <Text style={styles.goldSmText}>{t(lang, 'dashboard.resubmit')}</Text>
                    </TouchableOpacity>
                  )}
                  {listing.status === 'UNPUBLISHED' && (
                    <TouchableOpacity style={styles.goldSm} onPress={() => renew.mutate(listing.id)} disabled={renew.isPending}>
                      <Text style={styles.goldSmText}>{t(lang, 'dashboard.renew')}</Text>
                    </TouchableOpacity>
                  )}
                  {listing.status === 'AWAITING_PAYMENT' && (
                    <TouchableOpacity style={styles.goldSm} onPress={() => completePayment(listing.id)} disabled={initiatePayment.isPending}>
                      <Text style={styles.goldSmText}>{t(lang, 'dashboard.completePayment')}</Text>
                    </TouchableOpacity>
                  )}
                  {listing.status === 'LIVE' && (
                    <TouchableOpacity style={styles.outlineSm} onPress={() => markSoldRented.mutate(listing.id)} disabled={markSoldRented.isPending}>
                      <Text style={styles.outlineSmText}>
                        {listing.listingType === 'RENT' ? t(lang, 'dashboard.markRented') : t(lang, 'dashboard.markSold')}
                      </Text>
                    </TouchableOpacity>
                  )}
                  {(listing.status === 'SOLD' || listing.status === 'RENTED') && (
                    <TouchableOpacity style={styles.goldSm} onPress={() => markAvailable.mutate(listing.id)} disabled={markAvailable.isPending}>
                      <Text style={styles.goldSmText}>{t(lang, 'dashboard.markAvailable')}</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={styles.outlineSm} onPress={() => router.push(`/post-listing?edit=${listing.id}`)}>
                    <Text style={styles.outlineSmText}>{t(lang, 'dashboard.edit')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.rejectSm} onPress={() => setDeleting(listing)}>
                    <Text style={styles.rejectSmText}>{t(lang, 'dashboard.delete')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      <Modal visible={!!deleting} transparent animationType="fade" onRequestClose={() => setDeleting(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t(lang, 'dashboard.deleteConfirmTitle')}</Text>
            <Text style={styles.modalBody}>{t(lang, 'dashboard.deleteConfirmBody')}</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              <TouchableOpacity style={[styles.outlineSm, { flex: 1 }]} onPress={() => setDeleting(null)}>
                <Text style={styles.outlineSmText}>{t(lang, 'dashboard.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.rejectSm, { flex: 1 }]}
                onPress={async () => {
                  if (deleting) await remove.mutateAsync(deleting.id);
                  setDeleting(null);
                }}
                disabled={remove.isPending}
              >
                <Text style={styles.rejectSmText}>{t(lang, 'dashboard.confirmDelete')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  center: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', padding: spacing.lg, paddingTop: 50, gap: 12 },
  h1: { fontSize: 24, fontWeight: '700', color: colors.charcoal },
  sub: { fontSize: 12.5, color: '#8A9093', marginTop: 2 },
  newBtn: { backgroundColor: colors.gold, borderRadius: radius.md, paddingVertical: 10, paddingHorizontal: 14 },
  newBtnText: { color: colors.charcoal, fontWeight: '700', fontSize: 12.5 },

  filterStrip: { flexGrow: 0, marginBottom: spacing.sm },
  chip: { borderRadius: 999, backgroundColor: '#fff', borderWidth: 1.2, borderColor: colors.line, paddingVertical: 7, paddingHorizontal: 13 },
  chipActive: { backgroundColor: colors.charcoal, borderColor: colors.charcoal },
  chipText: { fontSize: 12, fontWeight: '600', color: colors.charcoal },
  chipTextActive: { color: colors.cream },

  card: { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line, borderRadius: 14, overflow: 'hidden' },
  cardMain: { flexDirection: 'row', gap: 14, padding: 14 },
  thumb: { width: 100, height: 78, borderRadius: 10, backgroundColor: '#DCD3BC' },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' },
  price: { fontSize: 16, fontWeight: '700', color: colors.goldDark },
  badge: { borderRadius: 999, paddingVertical: 3, paddingHorizontal: 9 },
  badgeText: { fontSize: 10, fontWeight: '700' },
  cardTitle: { fontSize: 13, fontWeight: '600', color: colors.charcoal, marginBottom: 3 },
  cardMeta: { fontSize: 11.5, color: '#8A9093' },

  note: { paddingVertical: 10, paddingHorizontal: 14, borderTopWidth: 1, borderTopColor: colors.line },
  noteTitle: { fontSize: 11.5, fontWeight: '700', marginBottom: 2 },
  noteBody: { fontSize: 12, lineHeight: 17 },

  actions: { flexDirection: 'row', gap: 8, padding: 14, paddingTop: 0, flexWrap: 'wrap' },
  goldSm: { backgroundColor: colors.gold, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 13 },
  goldSmText: { color: colors.charcoal, fontWeight: '700', fontSize: 12 },
  outlineSm: { borderWidth: 1.4, borderColor: colors.charcoal, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 13, alignItems: 'center' },
  outlineSmText: { color: colors.charcoal, fontWeight: '700', fontSize: 12 },
  rejectSm: { backgroundColor: colors.danger, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 13, alignItems: 'center' },
  rejectSmText: { color: '#fff', fontWeight: '700', fontSize: 12 },

  stateTitle: { fontSize: 18, fontWeight: '700', color: colors.charcoal, marginBottom: 8, textAlign: 'center' },
  stateBody: { fontSize: 13.5, color: '#8A9093', textAlign: 'center', lineHeight: 20, marginBottom: 18, maxWidth: 340 },
  goldBtn: { backgroundColor: colors.gold, borderRadius: radius.md, paddingVertical: 13, paddingHorizontal: 22 },
  goldBtnText: { color: colors.charcoal, fontWeight: '700', fontSize: 14 },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(20,24,26,0.5)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modalCard: { backgroundColor: colors.cream, borderRadius: 16, padding: 22, width: '100%', maxWidth: 400 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.charcoal, marginBottom: 10 },
  modalBody: { fontSize: 13.5, color: '#5B6265', lineHeight: 20 },
});
