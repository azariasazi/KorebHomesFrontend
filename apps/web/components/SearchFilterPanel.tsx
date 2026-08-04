'use client';

import { useState } from 'react';
import { useKoreb } from '@koreb/hooks';
import { t } from '@koreb/i18n';
import { ADDIS_SUBCITIES } from '@koreb/utils';
import type { PropertyType, ListingType, SortOption, ListingSearchParams } from '@koreb/types';

export interface FilterValues {
  propertyType?: PropertyType;
  listingType?: ListingType;
  minPrice?: number;
  maxPrice?: number;
  minBedrooms?: number;
  subCity?: string;
  keyword?: string;
  sort: SortOption;
}

/** Count how many filters are active, for the badge on the trigger button. */
export function countActiveFilters(f: FilterValues): number {
  let n = 0;
  if (f.propertyType) n++;
  if (f.listingType) n++;
  if (f.minPrice) n++;
  if (f.maxPrice) n++;
  if (f.minBedrooms) n++;
  if (f.subCity) n++;
  if (f.keyword) n++;
  return n;
}

export function toSearchParams(f: FilterValues): ListingSearchParams {
  return {
    propertyType: f.propertyType,
    listingType: f.listingType,
    minPrice: f.minPrice,
    maxPrice: f.maxPrice,
    minBedrooms: f.minBedrooms,
    subCity: f.subCity,
    keyword: f.keyword || undefined,
    sort: f.sort,
  };
}

const PROPERTY_TYPES: { value: PropertyType; key: string }[] = [
  { value: 'HOUSE', key: 'searchFilters.house' },
  { value: 'APARTMENT', key: 'searchFilters.apartment' },
  { value: 'LAND', key: 'searchFilters.land' },
  { value: 'COMMERCIAL', key: 'searchFilters.commercial' },
];

/**
 * Slide-in filter panel. Holds its own draft copy so changes don't hit the feed
 * until "Show results" is pressed — avoids refetching on every keystroke.
 */
export function SearchFilterPanel({
  initial,
  resultCount,
  onApply,
  onClose,
}: {
  initial: FilterValues;
  resultCount?: number;
  onApply: (f: FilterValues) => void;
  onClose: () => void;
}) {
  const { lang } = useKoreb();
  const [draft, setDraft] = useState<FilterValues>(initial);

  function set<K extends keyof FilterValues>(key: K, value: FilterValues[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function reset() {
    setDraft({ sort: 'newest' });
  }

  return (
    <>
      <div className="filter-backdrop" onClick={onClose} />
      <div className="filter-panel">
        <div className="filter-panel-head">
          <h3>{t(lang, 'searchFilters.title')}</h3>
          <button className="filter-reset" onClick={reset}>
            {t(lang, 'searchFilters.reset')}
          </button>
        </div>

        <div className="filter-panel-body">
          {/* keyword */}
          <div className="filter-group">
            <label>{t(lang, 'searchFilters.keyword')}</label>
            <div className="price-inputs">
              <input
                placeholder={t(lang, 'searchFilters.keywordPlaceholder')}
                value={draft.keyword ?? ''}
                onChange={(e) => set('keyword', e.target.value)}
              />
            </div>
          </div>

          {/* listing type */}
          <div className="filter-group">
            <label>{t(lang, 'searchFilters.listingType')}</label>
            <div className="pill-row">
              <button
                className={`pill${!draft.listingType ? ' sel' : ''}`}
                onClick={() => set('listingType', undefined)}
              >
                {t(lang, 'searchFilters.any')}
              </button>
              <button
                className={`pill${draft.listingType === 'SALE' ? ' sel' : ''}`}
                onClick={() => set('listingType', 'SALE')}
              >
                {t(lang, 'searchFilters.forSale')}
              </button>
              <button
                className={`pill${draft.listingType === 'RENT' ? ' sel' : ''}`}
                onClick={() => set('listingType', 'RENT')}
              >
                {t(lang, 'searchFilters.forRent')}
              </button>
            </div>
          </div>

          {/* property type */}
          <div className="filter-group">
            <label>{t(lang, 'searchFilters.propertyType')}</label>
            <div className="pill-row">
              <button
                className={`pill${!draft.propertyType ? ' sel' : ''}`}
                onClick={() => set('propertyType', undefined)}
              >
                {t(lang, 'searchFilters.any')}
              </button>
              {PROPERTY_TYPES.map((pt) => (
                <button
                  key={pt.value}
                  className={`pill${draft.propertyType === pt.value ? ' sel' : ''}`}
                  onClick={() => set('propertyType', pt.value)}
                >
                  {t(lang, pt.key)}
                </button>
              ))}
            </div>
          </div>

          {/* price range */}
          <div className="filter-group">
            <label>{t(lang, 'searchFilters.priceRange')}</label>
            <div className="price-inputs">
              <input
                type="number"
                placeholder={t(lang, 'searchFilters.noMin')}
                value={draft.minPrice ?? ''}
                onChange={(e) => set('minPrice', e.target.value ? Number(e.target.value) : undefined)}
              />
              <span className="dash">—</span>
              <input
                type="number"
                placeholder={t(lang, 'searchFilters.noMax')}
                value={draft.maxPrice ?? ''}
                onChange={(e) => set('maxPrice', e.target.value ? Number(e.target.value) : undefined)}
              />
            </div>
          </div>

          {/* bedrooms */}
          <div className="filter-group">
            <label>{t(lang, 'searchFilters.bedrooms')}</label>
            <div className="pill-row">
              <button
                className={`pill${!draft.minBedrooms ? ' sel' : ''}`}
                onClick={() => set('minBedrooms', undefined)}
              >
                {t(lang, 'searchFilters.any')}
              </button>
              {[1, 2, 3, 4].map((n) => (
                <button
                  key={n}
                  className={`pill${draft.minBedrooms === n ? ' sel' : ''}`}
                  onClick={() => set('minBedrooms', n)}
                >
                  {n}+
                </button>
              ))}
            </div>
          </div>

          {/* sub-city */}
          <div className="filter-group">
            <label>{t(lang, 'searchFilters.subCity')}</label>
            <div className="pill-row">
              <button
                className={`pill${!draft.subCity ? ' sel' : ''}`}
                onClick={() => set('subCity', undefined)}
              >
                {t(lang, 'searchFilters.anyArea')}
              </button>
              {ADDIS_SUBCITIES.map((s) => (
                <button
                  key={s}
                  className={`pill${draft.subCity === s ? ' sel' : ''}`}
                  onClick={() => set('subCity', s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* sort */}
          <div className="filter-group">
            <label>{t(lang, 'searchFilters.sortBy')}</label>
            <div className="pill-row">
              {(
                [
                  ['newest', 'searchFilters.sortNewest'],
                  ['price_asc', 'searchFilters.sortPriceAsc'],
                  ['price_desc', 'searchFilters.sortPriceDesc'],
                ] as [SortOption, string][]
              ).map(([value, key]) => (
                <button
                  key={value}
                  className={`pill${draft.sort === value ? ' sel' : ''}`}
                  onClick={() => set('sort', value)}
                >
                  {t(lang, key)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="filter-panel-foot">
          <button className="btn btn-outline-dark" style={{ flex: 1 }} onClick={onClose}>
            {t(lang, 'common.cancel')}
          </button>
          <button
            className="btn btn-gold"
            style={{ flex: 2 }}
            onClick={() => {
              onApply(draft);
              onClose();
            }}
          >
            {resultCount != null
              ? t(lang, 'searchFilters.apply', { count: resultCount })
              : t(lang, 'searchFilters.applyGeneric')}
          </button>
        </div>
      </div>
    </>
  );
}
