import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  StyleSheet,
  ActivityIndicator,
  Linking,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { useLocalSearchParams, router } from 'expo-router';
import { colors, radius, spacing } from '@koreb/design-tokens';
import { t } from '@koreb/i18n';
import {
  useKoreb,
  useListing,
  useMyListing,
  usePublicUser,
  useFavoriteIds,
  useToggleFavorite,
  useReportListing,
} from '@koreb/hooks';
import {
  formatPrice,
  resolveMediaUrl,
  listingTitle,
  listingTypeLabel,
  locationLabel,
  floorLabel,
  amenityLabel,
  listingDescription,
  contactLinks,
  isSoldOrRented,
  soldRentedLabel,
} from '@koreb/utils';

const { width } = Dimensions.get('window');

export default function ListingDetailScreen() {
  const { id, preview } = useLocalSearchParams<{ id: string; preview?: string }>();
  const { lang, apiBaseUrl } = useKoreb();

  // preview=mine → fetch via the owner endpoint, which returns any status
  // (the public endpoint only returns LIVE listings).
  const isPreview = preview === 'mine';
  const publicQuery = useListing(isPreview ? undefined : id);
  const previewQuery = useMyListing(id, isPreview);
  const { data: listing, isLoading, isError } = isPreview ? previewQuery : publicQuery;
  const { data: ownerCard } = usePublicUser(listing?.owner?.id);
  const { ids: favoriteIds } = useFavoriteIds();
  const toggleFavorite = useToggleFavorite();
  const report = useReportListing();

  const [photoIndex, setPhotoIndex] = useState(0);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('Fake or fraudulent');
  const [reportDetails, setReportDetails] = useState('');

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.gold} />
      </View>
    );
  }

  if (isError || !listing) {
    return (
      <View style={styles.center}>
        <Text style={styles.stateTitle}>{t(lang, 'listingDetail.notFoundTitle')}</Text>
        <Text style={styles.stateBody}>{t(lang, 'listingDetail.notFoundBody')}</Text>
        <TouchableOpacity style={styles.outlineBtn} onPress={() => router.replace('/home')}>
          <Text style={styles.outlineBtnText}>{t(lang, 'listingDetail.backToBrowse')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const photos = [...(listing.photos ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);
  const isFav = favoriteIds.has(listing.id);
  const links = contactLinks(listing.owner.contactPhone ?? ownerCard?.contactPhone);
  const description = listingDescription(listing, lang);
  const fl = floorLabel(listing, lang);
  const listingId = listing.id;

  const facts: { label: string; value: string }[] = [];
  if (listing.bedrooms) facts.push({ label: t(lang, 'listingDetail.bedrooms'), value: String(listing.bedrooms) });
  if (listing.bathrooms) facts.push({ label: t(lang, 'listingDetail.bathrooms'), value: String(listing.bathrooms) });
  if (listing.sizeSqm) facts.push({ label: t(lang, 'listingDetail.size'), value: `${listing.sizeSqm} m²` });
  if (fl) facts.push({ label: t(lang, 'listingDetail.floor'), value: fl });
  if (listing.buildingName) facts.push({ label: t(lang, 'listingDetail.building'), value: listing.buildingName });
  if (listing.furnished != null)
    facts.push({
      label: t(lang, 'listingDetail.furnished'),
      value: listing.furnished ? t(lang, 'listingDetail.yes') : t(lang, 'listingDetail.no'),
    });

  async function submitReport() {
    try {
      await report.mutateAsync({ listingId: listingId, reason: reportReason, details: reportDetails || undefined });
      setReportOpen(false);
      Alert.alert(t(lang, 'listingDetail.reportThanks'));
    } catch {
      Alert.alert(t(lang, 'listingDetail.signInToReport'));
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {/* photo carousel */}
        {photos.length === 0 ? (
          <View style={[styles.photo, styles.photoEmpty]}>
            <Text style={{ color: '#8A9093' }}>{t(lang, 'listingDetail.noPhotos')}</Text>
          </View>
        ) : (
          <View>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) =>
                setPhotoIndex(Math.round(e.nativeEvent.contentOffset.x / width))
              }
            >
              {photos.map((p) => {
                const url = resolveMediaUrl(p.url, apiBaseUrl);
                return (
                  <Image key={p.id} source={url ? { uri: url } : undefined} style={styles.photo} />
                );
              })}
            </ScrollView>
            {photos.length > 1 && (
              <View style={styles.dots}>
                {photos.map((_, i) => (
                  <View key={i} style={[styles.dot, i === photoIndex && styles.dotActive]} />
                ))}
              </View>
            )}
          </View>
        )}

        {/* back button overlay */}
        <TouchableOpacity style={styles.backFab} onPress={() => router.back()}>
          <Svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke={colors.charcoal} strokeWidth={2.4}>
            <Path d="M15 18l-6-6 6-6" />
          </Svg>
        </TouchableOpacity>

        <View style={styles.body}>
          <View style={styles.tagRow}>
            <View style={styles.tag}>
              <Text style={styles.tagText}>{listingTypeLabel(listing, lang)}</Text>
            </View>
            {isSoldOrRented(listing) && (
              <View style={styles.soldPill}>
                <Text style={styles.soldPillText}>{soldRentedLabel(listing, lang)}</Text>
              </View>
            )}
            <Text style={styles.views}>
              {t(lang, 'listingDetail.viewCount', { count: listing.viewCount })}
            </Text>
          </View>

          <Text style={styles.price}>{formatPrice(listing, lang)}</Text>
          <Text style={styles.title}>{listingTitle(listing, lang)}</Text>
          <View style={styles.locRow}>
            <Svg viewBox="0 0 24 24" width={13} height={13} fill="none" stroke="#5B6265" strokeWidth={2}>
              <Path d="M12 21s7-6.5 7-11a7 7 0 10-14 0c0 4.5 7 11 7 11z" />
              <Circle cx="12" cy="10" r="2.5" />
            </Svg>
            <Text style={styles.locText}>
              {[listing.buildingName, locationLabel(listing)].filter(Boolean).join(' · ')}
            </Text>
          </View>

          {/* facts */}
          <Text style={styles.sectionTitle}>{t(lang, 'listingDetail.propertyDetails')}</Text>
          <View style={styles.factGrid}>
            {facts.map((f) => (
              <View key={f.label} style={styles.fact}>
                <Text style={styles.factLbl}>{f.label}</Text>
                <Text style={styles.factVal}>{f.value}</Text>
              </View>
            ))}
          </View>

          {/* amenities */}
          {listing.amenities?.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>{t(lang, 'listingDetail.amenities')}</Text>
              <View style={styles.amenityWrap}>
                {listing.amenities.map((a) => (
                  <View key={a} style={styles.amenity}>
                    <View style={styles.amenityDot} />
                    <Text style={styles.amenityText}>{amenityLabel(a, lang)}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* description */}
          {description ? (
            <>
              <Text style={styles.sectionTitle}>{t(lang, 'listingDetail.description')}</Text>
              <Text style={styles.desc}>{description}</Text>
            </>
          ) : null}

          {/* map */}
          <Text style={styles.sectionTitle}>{t(lang, 'listingDetail.location')}</Text>
          {listing.latitude != null && listing.longitude != null ? (
            <MapView
              provider={PROVIDER_DEFAULT}
              style={styles.map}
              initialRegion={{
                latitude: listing.latitude,
                longitude: listing.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
              scrollEnabled={false}
            >
              <Marker
                coordinate={{ latitude: listing.latitude, longitude: listing.longitude }}
                pinColor={colors.gold}
              />
            </MapView>
          ) : (
            <View style={[styles.map, styles.mapEmpty]}>
              <Text style={{ color: '#8A9093', fontSize: 13 }}>
                {lang === 'am' ? 'አካባቢ አልተሰጠም' : 'Location not provided'}
              </Text>
            </View>
          )}

          {/* owner card */}
          <View style={styles.ownerCard}>
            <View style={styles.ownerRow}>
              <View style={styles.avatar} />
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <Text style={styles.ownerName}>{listing.owner.name}</Text>
                  {ownerCard?.isVerifiedAgent && (
                    <Svg viewBox="0 0 24 24" width={14} height={14} fill={colors.goldDark}>
                      <Path d="M12 2l2.4 2.1 3.1-.4 1 3 2.8 1.5-.8 3.1 1.5 2.8-2.4 2.1.4 3.1-3.1.4-1.5 2.8-2.8-1.5-3.1.4-.4-3.1-2.8-1.5 1.5-2.8-.8-3.1 2.8-1.5 1-3z" />
                    </Svg>
                  )}
                </View>
                {listing.owner.agencyName ? (
                  <Text style={styles.ownerSub}>{listing.owner.agencyName}</Text>
                ) : null}
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.reportLink} onPress={() => setReportOpen(true)}>
            <Text style={styles.reportText}>⚑ {t(lang, 'listingDetail.reportListing')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* sticky bottom contact bar */}
      <View style={styles.contactBar}>
        <TouchableOpacity
          style={styles.favBtn}
          onPress={() => toggleFavorite.mutate({ listingId: listing.id, isFavorited: isFav })}
        >
          <Svg viewBox="0 0 24 24" width={22} height={22}
            fill={isFav ? colors.gold : 'none'} stroke={isFav ? colors.gold : colors.charcoal} strokeWidth={2}>
            <Path d="M12 21s-7-4.5-9.5-9A5.5 5.5 0 0112 5.5 5.5 5.5 0 0121.5 12c-2.5 4.5-9.5 9-9.5 9z" />
          </Svg>
        </TouchableOpacity>

        {links ? (
          <>
            <TouchableOpacity style={styles.callBtn} onPress={() => Linking.openURL(links.call)}>
              <Text style={styles.callBtnText}>{t(lang, 'common.call')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.waBtn} onPress={() => Linking.openURL(links.whatsapp)}>
              <Text style={styles.waBtnText}>{t(lang, 'common.whatsapp')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.tgBtn} onPress={() => Linking.openURL(links.telegram)}>
              <Text style={styles.tgBtnText}>{t(lang, 'common.telegram')}</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.contactUnavail}>
            <Text style={styles.contactUnavailText}>{t(lang, 'listingDetail.contactUnavailable')}</Text>
          </View>
        )}
      </View>

      {/* report sheet */}
      <Modal visible={reportOpen} transparent animationType="slide" onRequestClose={() => setReportOpen(false)}>
        <View style={styles.sheetBackdrop}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{t(lang, 'listingDetail.reportTitle')}</Text>
            {[
              t(lang, 'listingDetail.reportReasonFake'),
              t(lang, 'listingDetail.reportReasonSold'),
              t(lang, 'listingDetail.reportReasonWrong'),
              t(lang, 'listingDetail.reportReasonOffensive'),
              t(lang, 'listingDetail.reportReasonOther'),
            ].map((reason) => (
              <TouchableOpacity key={reason} style={styles.radioRow} onPress={() => setReportReason(reason)}>
                <View style={[styles.radio, reportReason === reason && styles.radioOn]} />
                <Text style={styles.radioText}>{reason}</Text>
              </TouchableOpacity>
            ))}
            <TextInput
              style={styles.reportInput}
              placeholder={t(lang, 'listingDetail.reportDetails')}
              placeholderTextColor="#9AA0A2"
              multiline
              value={reportDetails}
              onChangeText={setReportDetails}
            />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
              <TouchableOpacity style={[styles.outlineBtn, { flex: 1 }]} onPress={() => setReportOpen(false)}>
                <Text style={styles.outlineBtnText}>{t(lang, 'common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.goldBtn, { flex: 1 }]} onPress={submitReport} disabled={report.isPending}>
                <Text style={styles.goldBtnText}>
                  {report.isPending ? t(lang, 'common.loading') : t(lang, 'listingDetail.reportSubmit')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cream, padding: spacing.xl },
  photo: { width, height: 280, backgroundColor: '#DCD3BC' },
  photoEmpty: { alignItems: 'center', justifyContent: 'center' },
  dots: { position: 'absolute', bottom: 12, alignSelf: 'center', flexDirection: 'row', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.5)' },
  dotActive: { backgroundColor: '#fff', width: 18 },
  backFab: {
    position: 'absolute', top: 44, left: 16, width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(246,243,236,0.92)', alignItems: 'center', justifyContent: 'center',
  },
  body: { padding: spacing.lg },
  tagRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  tag: { backgroundColor: colors.charcoal, borderRadius: radius.pill, paddingVertical: 4, paddingHorizontal: 11 },
  tagText: { color: colors.cream, fontSize: 10.5, fontWeight: '700', letterSpacing: 0.3 },
  soldPill: { backgroundColor: 'rgba(20,24,26,0.85)', borderRadius: 999, paddingVertical: 4, paddingHorizontal: 10 },
  soldPillText: { color: '#F6F3EC', fontSize: 10.5, fontWeight: '800', letterSpacing: 1 },
  views: { fontSize: 12, color: '#8A9093' },
  price: { fontSize: 28, fontWeight: '700', color: colors.goldDark, marginBottom: 3 },
  title: { fontSize: 20, fontWeight: '700', color: colors.charcoal, marginBottom: 6 },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 22 },
  locText: { fontSize: 13, color: '#5B6265', flex: 1 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.charcoal, marginBottom: 12, marginTop: 8 },
  factGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  fact: {
    width: (width - spacing.lg * 2 - 10) / 2, backgroundColor: '#fff', borderWidth: 1,
    borderColor: colors.line, borderRadius: 12, padding: 13,
  },
  factLbl: { fontSize: 10.5, fontWeight: '700', color: '#9AA0A2', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 },
  factVal: { fontSize: 14.5, fontWeight: '600', color: colors.charcoal },
  amenityWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 12 },
  amenity: { flexDirection: 'row', alignItems: 'center', gap: 8, width: (width - spacing.lg * 2 - 12) / 2 },
  amenityDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.green },
  amenityText: { fontSize: 13.5, color: '#3A3F41' },
  desc: { fontSize: 14, lineHeight: 23, color: '#3A3F41', marginBottom: 12 },
  map: { height: 200, borderRadius: 14, marginBottom: 20, overflow: 'hidden' },
  mapEmpty: { backgroundColor: '#ECEAE3', alignItems: 'center', justifyContent: 'center' },
  ownerCard: { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line, borderRadius: radius.xl, padding: 16, marginBottom: 14 },
  ownerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.goldTint },
  ownerName: { fontSize: 14.5, fontWeight: '700', color: colors.charcoal },
  ownerSub: { fontSize: 11.5, color: '#8A9093', marginTop: 2 },
  reportLink: { alignItems: 'center', paddingVertical: 10 },
  reportText: { fontSize: 12.5, color: '#8A9093' },

  contactBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center',
    gap: 10, padding: spacing.md, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: colors.line,
  },
  favBtn: {
    width: 48, height: 48, borderRadius: radius.md, borderWidth: 1.4, borderColor: colors.line,
    alignItems: 'center', justifyContent: 'center',
  },
  callBtn: { flex: 1, backgroundColor: colors.gold, borderRadius: radius.md, paddingVertical: 14, alignItems: 'center' },
  callBtnText: { color: colors.charcoal, fontWeight: '700', fontSize: 14 },
  waBtn: { flex: 1, borderWidth: 1.4, borderColor: colors.charcoal, borderRadius: radius.md, paddingVertical: 14, alignItems: 'center' },
  waBtnText: { color: colors.charcoal, fontWeight: '700', fontSize: 14 },
  tgBtn: { flex: 1, borderWidth: 1.4, borderColor: colors.charcoal, borderRadius: radius.md, paddingVertical: 14, alignItems: 'center' },
  tgBtnText: { color: colors.charcoal, fontWeight: '700', fontSize: 14 },
  contactUnavail: { flex: 1, alignItems: 'center', paddingHorizontal: 10 },
  contactUnavailText: { fontSize: 11.5, color: '#8A9093', textAlign: 'center' },

  stateTitle: { fontSize: 17, fontWeight: '700', color: colors.charcoal, marginBottom: 6, textAlign: 'center' },
  stateBody: { fontSize: 13, color: '#8A9093', textAlign: 'center', marginBottom: 18 },
  outlineBtn: { borderWidth: 1.4, borderColor: colors.charcoal, borderRadius: radius.md, paddingVertical: 13, paddingHorizontal: 20, alignItems: 'center' },
  outlineBtnText: { fontWeight: '700', color: colors.charcoal, fontSize: 13.5 },
  goldBtn: { backgroundColor: colors.gold, borderRadius: radius.md, paddingVertical: 13, alignItems: 'center' },
  goldBtnText: { color: colors.charcoal, fontWeight: '700', fontSize: 13.5 },

  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(20,24,26,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.cream, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: spacing.lg, paddingBottom: 34 },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: colors.charcoal, marginBottom: 14 },
  radioRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#9AA0A2' },
  radioOn: { borderColor: colors.gold, backgroundColor: colors.gold },
  radioText: { fontSize: 14, color: colors.charcoal },
  reportInput: {
    borderWidth: 1.4, borderColor: colors.line, borderRadius: 10, padding: 12, marginTop: 10,
    minHeight: 70, textAlignVertical: 'top', fontSize: 13.5, color: colors.charcoal,
  },
});
