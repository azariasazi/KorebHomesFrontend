'use client';

import { useKoreb } from '@koreb/hooks';
import { t } from '@koreb/i18n';
import { ADDIS_SUBCITIES } from '@koreb/utils';
import type { PropertyType, ListingType } from '@koreb/types';
import type { FilterValues } from './SearchFilterPanel';

const PROPERTY_TYPES: { value: PropertyType; key: string }[] = [
  { value: 'APARTMENT', key: 'searchFilters.apartment' },
  { value: 'HOUSE', key: 'searchFilters.house' },
  { value: 'LAND', key: 'searchFilters.land' },
  { value: 'COMMERCIAL', key: 'searchFilters.commercial' },
];

/**
 * Persistent left-sidebar filters for the Home Feed on desktop. Unlike the
 * slide-in panel (still used on mobile), this holds no draft — every change
 * updates the parent's filter state immediately, so the results grid on the
 * right refreshes live. Reset clears everything; Apply is a no-op affordance
 * that matches the mockup (changes already applied) but also closes nothing.
 */
export function FilterSidebar({
  values,
  onChange,
  onReset,
}: {
  values: FilterValues;
  onChange: (patch: Partial<FilterValues>) => void;
  onReset: () => void;
}) {
  const { lang } = useKoreb();

  return (
    <div className="filter-sidebar">
      <h3>{t(lang, 'searchFilters.title')}</h3>

      {/* Listing type */}
      <div className="filter-sec">
        <div className="filter-sec-label">{t(lang, 'searchFilters.listingType')}</div>
        <div className="seg">
          <div
            className={values.listingType === 'RENT' ? 'sel' : ''}
            onClick={() => onChange({ listingType: 'RENT' })}
          >
            {t(lang, 'searchFilters.forRent')}
          </div>
          <div
            className={values.listingType === 'SALE' ? 'sel' : ''}
            onClick={() => onChange({ listingType: 'SALE' })}
          >
            {t(lang, 'searchFilters.forSale')}
          </div>
        </div>
      </div>

      {/* Property type */}
      <div className="filter-sec">
        <div className="filter-sec-label">{t(lang, 'searchFilters.propertyType')}</div>
        <div className="chip-row">
          {PROPERTY_TYPES.map((pt) => (
            <div
              key={pt.value}
              className={`chip-opt${values.propertyType === pt.value ? ' sel' : ''}`}
              onClick={() =>
                onChange({ propertyType: values.propertyType === pt.value ? undefined : pt.value })
              }
            >
              {t(lang, pt.key)}
            </div>
          ))}
        </div>
      </div>

      {/* Price range */}
      <div className="filter-sec">
        <div className="filter-sec-label">{t(lang, 'searchFilters.priceRange')}</div>
        <div className="price-inputs">
          <input
            className="field"
            type="number"
            placeholder={t(lang, 'searchFilters.noMin')}
            value={values.minPrice ?? ''}
            onChange={(e) => onChange({ minPrice: e.target.value ? Number(e.target.value) : undefined })}
          />
          <span style={{ color: '#9AA0A2' }}>—</span>
          <input
            className="field"
            type="number"
            placeholder={t(lang, 'searchFilters.noMax')}
            value={values.maxPrice ?? ''}
            onChange={(e) => onChange({ maxPrice: e.target.value ? Number(e.target.value) : undefined })}
          />
        </div>
      </div>

      {/* Bedrooms */}
      <div className="filter-sec">
        <div className="filter-sec-label">{t(lang, 'searchFilters.bedrooms')}</div>
        <div className="chip-row">
          <div
            className={`chip-opt${!values.minBedrooms ? ' sel' : ''}`}
            onClick={() => onChange({ minBedrooms: undefined })}
          >
            {t(lang, 'searchFilters.any')}
          </div>
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className={`chip-opt${values.minBedrooms === n ? ' sel' : ''}`}
              onClick={() => onChange({ minBedrooms: n })}
            >
              {n}+
            </div>
          ))}
        </div>
      </div>

      {/* City / Area */}
      <div className="filter-sec">
        <div className="filter-sec-label">{t(lang, 'searchFilters.subCity')}</div>
        <select
          className="field"
          value={values.subCity ?? ''}
          onChange={(e) => onChange({ subCity: e.target.value || undefined })}
        >
          <option value="">{t(lang, 'searchFilters.anyArea')}</option>
          {ADDIS_SUBCITIES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Keyword — matches description / area / city on the backend */}
      <div className="filter-sec">
        <div className="filter-sec-label">{t(lang, 'searchFilters.keyword')}</div>
        <input
          className="field"
          placeholder={t(lang, 'searchFilters.keywordPlaceholder')}
          value={values.keyword ?? ''}
          onChange={(e) => onChange({ keyword: e.target.value || undefined })}
        />
      </div>

      <div className="filter-apply">
        <button className="btn btn-outline-dark" style={{ flex: 1 }} onClick={onReset}>
          {t(lang, 'searchFilters.reset')}
        </button>
      </div>
    </div>
  );
}
