import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  ActivityIndicator,
  Dimensions,
  Linking,
  Alert,
} from 'react-native';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, router } from 'expo-router';
import { colors, radius, spacing } from '@koreb/design-tokens';
import { t } from '@koreb/i18n';
import { useKoreb, useMe, useMyListing, useCreateListing, useUpdateListing, useInitiatePayment } from '@koreb/hooks';
import { amenityLabel, AMENITY_OPTIONS, ADDIS_SUBCITIES, floorOptions, resolveMediaUrl } from '@koreb/utils';
import type { PropertyType, ListingType, CreateListingInput } from '@koreb/types';

const { width } = Dimensions.get('window');
const TOTAL = 5;

const PROPERTY_TYPES: PropertyType[] = ['HOUSE', 'APARTMENT', 'LAND', 'COMMERCIAL'];

export default function PostListingScreen() {
  const { lang, apiBaseUrl } = useKoreb();
  const { data: me, isLoading: meLoading } = useMe();

  // Edit mode: /post-listing?edit=<id>
  const { edit: editId } = useLocalSearchParams<{ edit?: string }>();
  const isEdit = Boolean(editId);
  const { data: editListing, isLoading: editLoading } = useMyListing(editId, isEdit);

  const [ackVerify, setAckVerify] = useState(false);
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<'review' | null>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  const [propertyType, setPropertyType] = useState<PropertyType>('APARTMENT');
  const [listingType, setListingType] = useState<ListingType>('RENT');
  const [priceEtb, setPriceEtb] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [sizeSqm, setSizeSqm] = useState('');
  const [buildingName, setBuildingName] = useState('');
  const [unitNumber, setUnitNumber] = useState('');
  const [floorNumber, setFloorNumber] = useState('');
  const [furnished, setFurnished] = useState(false);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [city, setCity] = useState('Addis Ababa');
  const [subCity, setSubCity] = useState('Bole');
  const [areaName, setAreaName] = useState('');
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [descriptionEn, setDescriptionEn] = useState('');
  const [descriptionAm, setDescriptionAm] = useState('');
  const [photos, setPhotos] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [existingPhotos, setExistingPhotos] = useState<{ id: string; url: string }[]>([]);
  const [removedPhotoIds, setRemovedPhotoIds] = useState<string[]>([]);
  const [prefilled, setPrefilled] = useState(false);

  const createListing = useCreateListing();
  const updateListing = useUpdateListing();
  const initiatePayment = useInitiatePayment();

  useEffect(() => {
    if (!editListing || prefilled) return;
    setPropertyType(editListing.propertyType);
    setListingType(editListing.listingType);
    setPriceEtb(String(Number(editListing.priceEtb) || ''));
    setBedrooms(editListing.bedrooms != null ? String(editListing.bedrooms) : '');
    setBathrooms(editListing.bathrooms != null ? String(editListing.bathrooms) : '');
    setSizeSqm(editListing.sizeSqm != null ? String(editListing.sizeSqm) : '');
    setBuildingName(editListing.buildingName ?? '');
    setUnitNumber(editListing.unitNumber ?? '');
    setFloorNumber(editListing.floorNumber != null ? String(editListing.floorNumber) : '');
    setFurnished(Boolean(editListing.furnished));
    setAmenities(editListing.amenities ?? []);
    setCity(editListing.city ?? 'Addis Ababa');
    setSubCity(editListing.subCity ?? 'Bole');
    setAreaName(editListing.areaName ?? '');
    if (editListing.latitude != null && editListing.longitude != null) {
      setCoords({ latitude: editListing.latitude, longitude: editListing.longitude });
    }
    setDescriptionEn(editListing.descriptionEn ?? '');
    setDescriptionAm(editListing.descriptionAm ?? '');
    setExistingPhotos(
      [...(editListing.photos ?? [])]
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((p) => ({ id: p.id, url: resolveMediaUrl(p.url, apiBaseUrl) ?? '' }))
    );
    setPrefilled(true);
  }, [editListing, prefilled, apiBaseUrl]);

  const isApartment = propertyType === 'APARTMENT';
  const showRooms = propertyType === 'HOUSE' || propertyType === 'APARTMENT';

  if (meLoading || (isEdit && editLoading && !prefilled)) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.gold} />
      </View>
    );
  }

  if (!me) {
    return (
      <View style={styles.center}>
        <Text style={styles.h3}>{t(lang, 'postListing.signInToPost')}</Text>
        <TouchableOpacity style={styles.goldBtn} onPress={() => router.replace('/signup')}>
          <Text style={styles.goldBtnText}>{lang === 'am' ? 'ግባ' : 'Sign in'}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (me.role === 'BUYER_RENTER') {
    return (
      <View style={styles.center}>
        <Text style={styles.h3}>{t(lang, 'postListing.mustBeOwnerTitle')}</Text>
        <Text style={styles.pBody}>{t(lang, 'postListing.mustBeOwnerBody')}</Text>
      </View>
    );
  }

  const needsVerification = me.verificationStatus !== 'APPROVED';
  if (!isEdit && needsVerification && !ackVerify) {
    return (
      <ScrollView contentContainerStyle={styles.center}>
        <View style={styles.vpIcon}>
          <Svg viewBox="0 0 24 24" width={28} height={28} fill="none" stroke={colors.goldDark} strokeWidth={2}>
            <Path d="M12 2l7 4v6c0 5-3.5 8-7 10-3.5-2-7-5-7-10V6z" />
            <Path d="M9 12l2 2 4-4" />
          </Svg>
        </View>
        <Text style={styles.h3}>{t(lang, 'postListing.verifyRequiredTitle')}</Text>
        <Text style={styles.pBody}>{t(lang, 'postListing.verifyRequiredBody')}</Text>
        <Text style={styles.verifySoon}>{t(lang, 'postListing.verifyComingSoon')}</Text>
        <TouchableOpacity style={styles.goldBtn} onPress={() => setAckVerify(true)}>
          <Text style={styles.goldBtnText}>{t(lang, 'postListing.verifyContinueAnyway')}</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  if (result === 'review') {
    return (
      <View style={styles.center}>
        <View style={styles.okIcon}>
          <Svg viewBox="0 0 24 24" width={30} height={30} fill="none" stroke="#fff" strokeWidth={2.4}>
            <Path d="M5 12l5 5L20 7" />
          </Svg>
        </View>
        <Text style={styles.successTitle}>{t(lang, isEdit ? 'postListing.updatedTitle' : 'postListing.submittedTitle')}</Text>
        <Text style={styles.pBody}>{t(lang, isEdit ? 'postListing.updatedBody' : 'postListing.submittedBody')}</Text>
        <TouchableOpacity style={styles.goldBtn} onPress={() => router.replace('/home')}>
          <Text style={styles.goldBtnText}>{t(lang, 'postListing.goToDashboard')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  async function pickImages() {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: Math.max(1, 10 - photos.length - existingPhotos.length),
      quality: 0.9,
    });
    if (!res.canceled) setPhotos((prev) => [...prev, ...res.assets].slice(0, 10));
  }

  function validateStep(s: number): string | null {
    if (s === 1) {
      if (!priceEtb || Number(priceEtb) <= 0) return t(lang, 'postListing.missingRequired');
      if (isApartment && !unitNumber.trim()) return t(lang, 'postListing.unitRequiredApt');
    }
    if (s === 2 && !city.trim()) return t(lang, 'postListing.missingRequired');
    return null;
  }

  function next() {
    const err = validateStep(step);
    if (err) return setError(err);
    setError(null);
    setStep((s) => Math.min(TOTAL - 1, s + 1));
  }
  function back() {
    setError(null);
    setStep((s) => Math.max(0, s - 1));
  }

  async function submit() {
    setError(null);
    const fields: CreateListingInput = {
      propertyType,
      listingType,
      priceEtb: Number(priceEtb),
      region: 'Addis Ababa',
      city: city.trim(),
      subCity: subCity || undefined,
      areaName: areaName.trim() || undefined,
      latitude: coords?.latitude,
      longitude: coords?.longitude,
      bedrooms: showRooms && bedrooms ? Number(bedrooms) : undefined,
      bathrooms: showRooms && bathrooms ? Number(bathrooms) : undefined,
      sizeSqm: sizeSqm ? Number(sizeSqm) : undefined,
      buildingName: buildingName.trim() || undefined,
      unitNumber: isApartment ? unitNumber.trim() : unitNumber.trim() || undefined,
      floorNumber: floorNumber !== '' ? Number(floorNumber) : undefined,
      furnished: showRooms ? furnished : undefined,
      amenities: amenities.length ? amenities : undefined,
      descriptionEn: descriptionEn.trim() || undefined,
      descriptionAm: descriptionAm.trim() || undefined,
    };

    try {
      const built = photos.map((asset) => {
        const fd = new FormData();
        const name = asset.fileName ?? `photo-${Date.now()}.jpg`;
        // React Native's FormData takes this {uri,name,type} shape for files.
        fd.append('file', {
          uri: asset.uri,
          name,
          type: asset.mimeType ?? 'image/jpeg',
        } as any);
        return { formData: fd };
      });

      if (isEdit && editId) {
        await updateListing.mutateAsync({
          id: editId,
          fields,
          removedPhotoIds,
          newPhotos: built,
          onProgress: (done, total) => setProgress({ done, total }),
        });
        setProgress(null);
        setResult('review');
        return;
      }

      const submitted = await createListing.mutateAsync({
        fields,
        photos: built,
        onProgress: (done, total) => setProgress({ done, total }),
      });
      setProgress(null);

      if (submitted.requiresPayment) {
        const pay = await initiatePayment.mutateAsync(submitted.id);
        Linking.openURL(pay.checkoutUrl);
      } else {
        setResult('review');
      }
    } catch (e) {
      setProgress(null);
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    }
  }

  const stepLabels = [
    t(lang, 'postListing.stepType'),
    t(lang, 'postListing.stepDetails'),
    t(lang, 'postListing.stepLocation'),
    t(lang, 'postListing.stepPhotos'),
    t(lang, 'postListing.stepReview'),
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      {/* stepper */}
      <View style={styles.stepper}>
        {Array.from({ length: TOTAL }).map((_, i) => (
          <View key={i} style={styles.stepUnit}>
            {i > 0 && <View style={[styles.stepLine, i <= step && styles.stepLineDone]} />}
            <View style={[styles.stepDot, i < step && styles.stepDotDone, i === step && styles.stepDotNow]}>
              <Text style={[styles.stepDotText, (i < step || i === step) && { color: i === step ? colors.charcoal : '#fff' }]}>
                {i < step ? '✓' : i + 1}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 40 }}>
        <Text style={styles.plLabel}>
          {t(lang, 'postListing.stepOfLabel', { step: step + 1, total: TOTAL, label: stepLabels[step] })}
        </Text>

        {/* Step 0: Type */}
        {step === 0 && (
          <>
            <Text style={styles.h2}>{t(lang, 'postListing.whatAreYouListing')}</Text>
            <Text style={styles.fieldLabel}>{t(lang, 'postListing.propertyType')}</Text>
            <View style={styles.typeGrid}>
              {PROPERTY_TYPES.map((pt) => (
                <TouchableOpacity
                  key={pt}
                  style={[styles.typeCard, propertyType === pt && styles.typeCardSel]}
                  onPress={() => setPropertyType(pt)}
                >
                  <Text style={styles.typeText}>{t(lang, `postListing.${pt.toLowerCase()}`)}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>{t(lang, 'postListing.listingType')}</Text>
            <View style={styles.seg}>
              <TouchableOpacity style={[styles.segItem, listingType === 'SALE' && styles.segItemSel]} onPress={() => setListingType('SALE')}>
                <Text style={[styles.segText, listingType === 'SALE' && styles.segTextSel]}>{t(lang, 'postListing.forSale')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.segItem, listingType === 'RENT' && styles.segItemSel]} onPress={() => setListingType('RENT')}>
                <Text style={[styles.segText, listingType === 'RENT' && styles.segTextSel]}>{t(lang, 'postListing.forRent')}</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Step 1: Details */}
        {step === 1 && (
          <>
            <Text style={styles.h2}>{t(lang, 'postListing.tellUsAbout')}</Text>

            <Text style={styles.fieldLabel}>
              {listingType === 'RENT' ? t(lang, 'postListing.priceRent') : t(lang, 'postListing.price')} *
            </Text>
            <TextInput style={styles.field} keyboardType="numeric" value={priceEtb} onChangeText={setPriceEtb} placeholder="0" placeholderTextColor="#9AA0A2" />

            {showRooms && (
              <View style={styles.twoCol}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>{t(lang, 'postListing.bedrooms')}</Text>
                  <TextInput style={styles.field} keyboardType="numeric" value={bedrooms} onChangeText={setBedrooms} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>{t(lang, 'postListing.bathrooms')}</Text>
                  <TextInput style={styles.field} keyboardType="numeric" value={bathrooms} onChangeText={setBathrooms} />
                </View>
              </View>
            )}

            <Text style={styles.fieldLabel}>{t(lang, 'postListing.size')}</Text>
            <TextInput style={styles.field} keyboardType="numeric" value={sizeSqm} onChangeText={setSizeSqm} />

            {(isApartment || propertyType === 'COMMERCIAL') && (
              <>
                <Text style={styles.fieldLabel}>{t(lang, 'postListing.buildingName')}</Text>
                <TextInput style={styles.field} value={buildingName} onChangeText={setBuildingName} placeholder="Zefmesh Grand" placeholderTextColor="#9AA0A2" maxLength={120} />
                <Text style={styles.fieldHint}>{t(lang, 'postListing.buildingNameHint')}</Text>

                <View style={styles.twoCol}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>
                      {t(lang, 'postListing.unitNumber')} {isApartment ? '*' : ''}
                    </Text>
                    <TextInput style={styles.field} value={unitNumber} onChangeText={setUnitNumber} placeholder="4B" placeholderTextColor="#9AA0A2" maxLength={20} />
                  </View>
                  <View style={{ flex: 1 }} />
                </View>

                <Text style={styles.fieldLabel}>{t(lang, 'postListing.floorNumber')}</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 8, paddingVertical: 2 }}
                >
                  {floorOptions(lang).map((o) => {
                    const selected = floorNumber === String(o.value);
                    return (
                      <TouchableOpacity
                        key={o.value}
                        style={[styles.floorChip, selected && styles.floorChipSel]}
                        onPress={() => setFloorNumber(selected ? '' : String(o.value))}
                      >
                        <Text style={[styles.floorChipText, selected && styles.floorChipTextSel]}>
                          {o.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                <View style={styles.privateNote}>
                  <Svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke={colors.green} strokeWidth={2}>
                    <Rect x="5" y="11" width="14" height="10" rx="2" />
                    <Path d="M8 11V7a4 4 0 018 0v4" />
                  </Svg>
                  <Text style={styles.privateNoteText}>{t(lang, 'postListing.unitPrivateNote')}</Text>
                </View>
              </>
            )}

            {showRooms && (
              <>
                <Text style={styles.fieldLabel}>{t(lang, 'postListing.furnished')}</Text>
                <View style={styles.seg}>
                  <TouchableOpacity style={[styles.segItem, !furnished && styles.segItemSel]} onPress={() => setFurnished(false)}>
                    <Text style={[styles.segText, !furnished && styles.segTextSel]}>{t(lang, 'listingDetail.no')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.segItem, furnished && styles.segItemSel]} onPress={() => setFurnished(true)}>
                    <Text style={[styles.segText, furnished && styles.segTextSel]}>{t(lang, 'listingDetail.yes')}</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            <Text style={styles.fieldLabel}>{t(lang, 'postListing.amenities')}</Text>
            <View style={styles.amenities}>
              {AMENITY_OPTIONS.map((a) => (
                <TouchableOpacity
                  key={a}
                  style={[styles.amenityChip, amenities.includes(a) && styles.amenityChipSel]}
                  onPress={() =>
                    setAmenities((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]))
                  }
                >
                  <Text style={[styles.amenityText, amenities.includes(a) && styles.amenityTextSel]}>
                    {amenityLabel(a, lang)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>{t(lang, 'postListing.descriptionEnglish')}</Text>
            <TextInput style={[styles.field, styles.textarea]} multiline value={descriptionEn} onChangeText={setDescriptionEn} />
            <Text style={styles.fieldLabel}>{t(lang, 'postListing.descriptionAmharic')}</Text>
            <TextInput style={[styles.field, styles.textarea]} multiline value={descriptionAm} onChangeText={setDescriptionAm} />
          </>
        )}

        {/* Step 2: Location */}
        {step === 2 && (
          <>
            <Text style={styles.h2}>{t(lang, 'postListing.whereIsIt')}</Text>
            <Text style={styles.fieldLabel}>{t(lang, 'postListing.city')} *</Text>
            <TextInput style={styles.field} value={city} onChangeText={setCity} />

            <Text style={styles.fieldLabel}>{t(lang, 'postListing.subCity')}</Text>
            <View style={styles.chipWrap}>
              {ADDIS_SUBCITIES.map((s) => (
                <TouchableOpacity key={s} style={[styles.subChip, subCity === s && styles.subChipSel]} onPress={() => setSubCity(s)}>
                  <Text style={[styles.subChipText, subCity === s && styles.subChipTextSel]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>{t(lang, 'postListing.areaName')}</Text>
            <TextInput style={styles.field} value={areaName} onChangeText={setAreaName} placeholder={t(lang, 'postListing.areaHint')} placeholderTextColor="#9AA0A2" />

            <Text style={styles.fieldLabel}>{t(lang, 'postListing.pinLocation')}</Text>
            <Text style={styles.fieldHint}>{t(lang, 'postListing.pinHint')}</Text>
            <MapView
              provider={PROVIDER_DEFAULT}
              style={styles.map}
              initialRegion={{
                latitude: coords?.latitude ?? 9.0108,
                longitude: coords?.longitude ?? 38.7613,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              }}
              onPress={(e) => setCoords(e.nativeEvent.coordinate)}
            >
              {coords && <Marker coordinate={coords} draggable pinColor={colors.gold} onDragEnd={(e) => setCoords(e.nativeEvent.coordinate)} />}
            </MapView>
            <Text style={styles.fieldHint}>{coords ? `📍 ${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}` : t(lang, 'postListing.tapToSetPin')}</Text>
          </>
        )}

        {/* Step 3: Photos */}
        {step === 3 && (
          <>
            <Text style={styles.h2}>{t(lang, 'postListing.addPhotos')}</Text>
            <Text style={styles.fieldLabel}>{t(lang, 'postListing.photosLabel')}</Text>
            <View style={styles.photoGrid}>
              {existingPhotos.map((p, i) => (
                <View key={p.id} style={styles.photoSlot}>
                  <Image source={{ uri: p.url }} style={styles.photoImg} />
                  <TouchableOpacity
                    style={styles.photoRm}
                    onPress={() => {
                      setRemovedPhotoIds((prev) => [...prev, p.id]);
                      setExistingPhotos((prev) => prev.filter((x) => x.id !== p.id));
                    }}
                  >
                    <Text style={{ color: '#fff', fontSize: 14 }}>×</Text>
                  </TouchableOpacity>
                  {i === 0 && photos.length === 0 && (
                    <View style={styles.coverBadge}>
                      <Text style={styles.coverBadgeText}>{t(lang, 'postListing.coverPhoto')}</Text>
                    </View>
                  )}
                </View>
              ))}
              {photos.map((p, i) => (
                <View key={i} style={styles.photoSlot}>
                  <Image source={{ uri: p.uri }} style={styles.photoImg} />
                  <TouchableOpacity style={styles.photoRm} onPress={() => setPhotos((prev) => prev.filter((_, idx) => idx !== i))}>
                    <Text style={{ color: '#fff', fontSize: 14 }}>×</Text>
                  </TouchableOpacity>
                  {existingPhotos.length === 0 && i === 0 && (
                    <View style={styles.coverBadge}>
                      <Text style={styles.coverBadgeText}>{t(lang, 'postListing.coverPhoto')}</Text>
                    </View>
                  )}
                </View>
              ))}
              {existingPhotos.length + photos.length < 10 && (
                <TouchableOpacity style={styles.photoAdd} onPress={pickImages}>
                  <Svg viewBox="0 0 24 24" width={24} height={24} fill="none" stroke={colors.charcoal} strokeWidth={2}>
                    <Path d="M12 5v14M5 12h14" />
                  </Svg>
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.fieldHint}>{t(lang, 'postListing.photoHint')}</Text>
          </>
        )}

        {/* Step 4: Review */}
        {step === 4 && (
          <>
            <Text style={styles.h2}>{t(lang, 'postListing.reviewAndSubmit')}</Text>
            <View style={styles.reviewCard}>
              <ReviewRow k={t(lang, 'postListing.propertyType')} v={t(lang, `postListing.${propertyType.toLowerCase()}`)} />
              <ReviewRow k={t(lang, 'postListing.listingType')} v={listingType === 'RENT' ? t(lang, 'postListing.forRent') : t(lang, 'postListing.forSale')} />
              <ReviewRow k={t(lang, 'postListing.price')} v={`${Number(priceEtb || 0).toLocaleString()} ETB`} />
              {buildingName ? <ReviewRow k={t(lang, 'postListing.buildingName')} v={buildingName} /> : null}
              {isApartment && unitNumber ? <ReviewRow k={t(lang, 'postListing.unitNumber')} v={`${unitNumber} 🔒`} /> : null}
              <ReviewRow k={t(lang, 'postListing.city')} v={[subCity, city].filter(Boolean).join(', ')} />
              <ReviewRow k={t(lang, 'postListing.stepPhotos')} v={String(photos.length)} last />
            </View>

            <View style={styles.freeCard}>
              <Text style={styles.freeTitle}>{t(lang, 'postListing.feeFreeTitle')}</Text>
              <Text style={styles.freeBody}>{t(lang, 'postListing.feeFreeBody')}</Text>
            </View>

            <Text style={[styles.fieldHint, { marginTop: 14 }]}>{t(lang, 'postListing.reviewNote')}</Text>
            {progress && (
              <Text style={styles.fieldHint}>
                {t(lang, 'postListing.uploadingPhotos', { done: progress.done, total: progress.total })}
              </Text>
            )}
          </>
        )}

        {error && <Text style={styles.error}>{error}</Text>}
      </ScrollView>

      {/* nav */}
      <View style={styles.navBar}>
        {step > 0 && (
          <TouchableOpacity style={[styles.outlineBtn, { flex: 1 }]} onPress={back} disabled={createListing.isPending}>
            <Text style={styles.outlineBtnText}>{t(lang, 'postListing.back')}</Text>
          </TouchableOpacity>
        )}
        {step < TOTAL - 1 ? (
          <TouchableOpacity style={[styles.goldBtn, { flex: 2 }]} onPress={next}>
            <Text style={styles.goldBtnText}>{t(lang, 'postListing.continue')}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.goldBtn, { flex: 2 }]} onPress={submit} disabled={createListing.isPending || updateListing.isPending || initiatePayment.isPending}>
            {createListing.isPending || updateListing.isPending ? (
              <ActivityIndicator color={colors.charcoal} />
            ) : (
              <Text style={styles.goldBtnText}>{t(lang, isEdit ? 'postListing.saveChanges' : 'postListing.submitListing')}</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function ReviewRow({ k, v, last }: { k: string; v: string; last?: boolean }) {
  return (
    <View style={[styles.reviewRow, last && { borderBottomWidth: 0 }]}>
      <Text style={styles.reviewK}>{k}</Text>
      <Text style={styles.reviewV}>{v}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, backgroundColor: colors.cream },
  h2: { fontSize: 23, fontWeight: '700', color: colors.charcoal, marginBottom: 18 },
  h3: { fontSize: 19, fontWeight: '700', color: colors.charcoal, marginBottom: 10, textAlign: 'center' },
  pBody: { fontSize: 13.5, color: '#5B6265', textAlign: 'center', lineHeight: 21, marginBottom: 18, maxWidth: 400 },

  stepper: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingTop: 50, paddingBottom: 10 },
  stepUnit: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  stepLine: { flex: 1, height: 2, backgroundColor: colors.line },
  stepLineDone: { backgroundColor: colors.green },
  stepDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#fff', borderWidth: 1.4, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  stepDotDone: { backgroundColor: colors.green, borderColor: colors.green },
  stepDotNow: { backgroundColor: colors.gold, borderColor: colors.gold },
  stepDotText: { fontSize: 11.5, fontWeight: '700', color: '#9AA0A2' },

  plLabel: { fontSize: 11.5, fontWeight: '700', color: colors.goldDark, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  fieldLabel: { fontSize: 12.5, fontWeight: '700', color: colors.charcoal, marginTop: 16, marginBottom: 7 },
  fieldHint: { fontSize: 11.5, color: '#8A9093', marginTop: 4, lineHeight: 17 },
  field: {
    borderWidth: 1.4, borderColor: colors.line, borderRadius: 11, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: colors.charcoal, backgroundColor: '#fff',
  },
  textarea: { minHeight: 84, textAlignVertical: 'top' },
  twoCol: { flexDirection: 'row', gap: 12 },

  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  typeCard: {
    width: (width - spacing.lg * 2 - 10) / 2, paddingVertical: 20, alignItems: 'center',
    borderWidth: 1.4, borderColor: colors.line, borderRadius: 12, backgroundColor: '#fff',
  },
  typeCardSel: { borderColor: colors.gold, backgroundColor: 'rgba(201,162,75,0.08)' },
  typeText: { fontSize: 13, fontWeight: '600', color: colors.charcoal },

  seg: { flexDirection: 'row', borderWidth: 1.4, borderColor: colors.line, borderRadius: 11, overflow: 'hidden' },
  segItem: { flex: 1, paddingVertical: 12, alignItems: 'center', backgroundColor: '#fff' },
  segItemSel: { backgroundColor: colors.charcoal },
  segText: { fontSize: 13.5, fontWeight: '600', color: '#5B6265' },
  segTextSel: { color: colors.cream },

  amenities: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  amenityChip: { paddingVertical: 8, paddingHorizontal: 13, borderRadius: 999, borderWidth: 1.2, borderColor: colors.line, backgroundColor: '#fff' },
  amenityChipSel: { backgroundColor: colors.green, borderColor: colors.green },
  amenityText: { fontSize: 12.5, fontWeight: '600', color: colors.charcoal },
  amenityTextSel: { color: '#fff' },

  floorChip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1.2, borderColor: colors.line, backgroundColor: '#fff' },
  floorChipSel: { backgroundColor: colors.charcoal, borderColor: colors.charcoal },
  floorChipText: { fontSize: 12.5, fontWeight: '600', color: colors.charcoal },
  floorChipTextSel: { color: colors.cream },
  privateNote: {
    flexDirection: 'row', gap: 9, alignItems: 'flex-start', backgroundColor: 'rgba(59,109,48,0.07)',
    borderWidth: 1, borderColor: 'rgba(59,109,48,0.2)', borderRadius: 10, padding: 11, marginTop: 10,
  },
  privateNoteText: { flex: 1, fontSize: 11.5, color: colors.green, lineHeight: 17 },

  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  subChip: { paddingVertical: 8, paddingHorizontal: 13, borderRadius: 999, borderWidth: 1.2, borderColor: colors.line, backgroundColor: '#fff' },
  subChipSel: { backgroundColor: colors.charcoal, borderColor: colors.charcoal },
  subChipText: { fontSize: 12.5, fontWeight: '600', color: colors.charcoal },
  subChipTextSel: { color: colors.cream },

  map: { height: 240, borderRadius: 14, overflow: 'hidden', marginTop: 4 },

  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  photoSlot: { width: (width - spacing.lg * 2 - 20) / 3, aspectRatio: 1, borderRadius: 12, overflow: 'hidden', position: 'relative' },
  photoImg: { width: '100%', height: '100%' },
  photoRm: { position: 'absolute', top: 6, right: 6, width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(20,24,26,0.6)', alignItems: 'center', justifyContent: 'center' },
  coverBadge: { position: 'absolute', bottom: 6, left: 6, backgroundColor: colors.gold, borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2 },
  coverBadgeText: { fontSize: 9, fontWeight: '700', color: colors.charcoal },
  photoAdd: {
    width: (width - spacing.lg * 2 - 20) / 3, aspectRatio: 1, borderRadius: 12, borderWidth: 1.6,
    borderColor: colors.line, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff',
  },

  reviewCard: { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line, borderRadius: 14, paddingHorizontal: 16 },
  reviewRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: colors.line },
  reviewK: { fontSize: 13.5, color: '#8A9093' },
  reviewV: { fontSize: 13.5, fontWeight: '600', color: colors.charcoal, maxWidth: '60%', textAlign: 'right' },
  freeCard: { backgroundColor: 'rgba(59,109,48,0.07)', borderWidth: 1, borderColor: 'rgba(59,109,48,0.22)', borderRadius: 14, padding: 16, marginTop: 14 },
  freeTitle: { fontSize: 14.5, fontWeight: '700', color: colors.green, marginBottom: 5 },
  freeBody: { fontSize: 12.5, color: colors.green, lineHeight: 19 },

  vpIcon: { width: 62, height: 62, borderRadius: 31, backgroundColor: colors.goldTint, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  verifySoon: { fontSize: 12, color: colors.goldDark, fontWeight: '600', marginBottom: 22, textAlign: 'center' },
  okIcon: { width: 66, height: 66, borderRadius: 33, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  successTitle: { fontSize: 24, fontWeight: '700', color: colors.charcoal, marginBottom: 12, textAlign: 'center' },

  navBar: { flexDirection: 'row', gap: 10, padding: spacing.md, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: colors.line },
  goldBtn: { backgroundColor: colors.gold, borderRadius: radius.md, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  goldBtnText: { color: colors.charcoal, fontWeight: '700', fontSize: 14 },
  outlineBtn: { borderWidth: 1.4, borderColor: colors.charcoal, borderRadius: radius.md, paddingVertical: 14, alignItems: 'center' },
  outlineBtnText: { color: colors.charcoal, fontWeight: '700', fontSize: 14 },
  error: { color: '#8A3A3A', fontSize: 13, marginTop: 14 },
});
