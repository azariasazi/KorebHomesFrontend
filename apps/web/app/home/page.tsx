'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { SiteHeader } from '../../components/SiteHeader';
import { ListingCard, ListingCardSkeleton } from '../../components/ListingCard';
import { SearchFilterPanel, countActiveFilters, type FilterValues } from '../../components/SearchFilterPanel';
import { ListingsMap } from '../../components/ListingsMap';
import { FilterSidebar } from '../../components/FilterSidebar';
import { useKoreb, useListingsSearch, useFavoriteIds, useToggleFavorite } from '@koreb/hooks';
import { t } from '@koreb/i18n';
import type { Listing, ListingType, PropertyType, SortOption } from '@koreb/types';

type PropertyChip = PropertyType | 'ALL';

export default function HomeFeedPage() {
  const { lang } = useKoreb();
  const searchParams = useSearchParams();

  // Buy/Rent nav links land here as ?type=SALE / ?type=RENT. Read that once to
  // seed the initial filter, so those links actually switch the feed. Anything
  // else (or no param) defaults to rentals, the most common browse.
  const typeParam = searchParams.get('type');
  const initialType: ListingType =
    typeParam === 'SALE' ? 'SALE' : typeParam === 'RENT' ? 'RENT' : 'RENT';

  // --- filter state (drives the API query below) ---
  const [listingType, setListingType] = useState<ListingType | undefined>(initialType);
  const [propertyType, setPropertyType] = useState<PropertyChip>('ALL');

  // When the Buy/Rent nav link changes the ?type= param (a client-side nav that
  // doesn't remount this page), switch the feed to match. Depends only on the
  // param, so a user's in-page toggle isn't overridden.
  useEffect(() => {
    if (typeParam === 'SALE') setListingType('SALE');
    else if (typeParam === 'RENT') setListingType('RENT');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeParam]);
  const [keyword, setKeyword] = useState('');
  const [keywordDraft, setKeywordDraft] = useState('');
  const [maxPrice, setMaxPrice] = useState<number | undefined>();
  const [minPrice, setMinPrice] = useState<number | undefined>();
  const [minBedrooms, setMinBedrooms] = useState<number | undefined>();
  const [subCity, setSubCity] = useState<string | undefined>();
  const [sort, setSort] = useState<SortOption>('newest');
  const [view, setView] = useState<'list' | 'map'>('list');
  const [filtersOpen, setFiltersOpen] = useState(false);

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

  // The panel's view of current filters, and how many are active (for the badge).
  const filterValues: FilterValues = {
    propertyType: propertyType === 'ALL' ? undefined : propertyType,
    listingType,
    minPrice,
    maxPrice,
    minBedrooms,
    subCity,
    keyword: keyword || undefined,
    sort,
  };
  const activeFilterCount = countActiveFilters(filterValues);

  function applyFilters(f: FilterValues) {
    setPropertyType(f.propertyType ?? 'ALL');
    setListingType(f.listingType);
    setMinPrice(f.minPrice);
    setMaxPrice(f.maxPrice);
    setMinBedrooms(f.minBedrooms);
    setSubCity(f.subCity);
    setKeyword(f.keyword ?? '');
    setKeywordDraft(f.keyword ?? '');
    setSort(f.sort);
  }

  // Sidebar edits arrive as small patches; merge onto current values and apply
  // live, so the results grid on the right updates as filters change.
  function patchFilters(patch: Partial<FilterValues>) {
    applyFilters({ ...filterValues, ...patch });
  }

  function resetFilters() {
    applyFilters({ sort: 'newest' });
  }

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useListingsSearch(params);

  // Favorites only exist for signed-in users; a 401 here is expected and
  // simply means no hearts are filled in.
  const { ids: favoriteIds } = useFavoriteIds();
  const toggleFavorite = useToggleFavorite();

  const listings: Listing[] = data?.pages.flatMap((p) => p.items) ?? [];
  const total = data?.pages[0]?.total ?? 0;

  const propertyChips: { value: PropertyChip; label: string }[] = [
    { value: 'ALL', label: lang === 'am' ? 'ሁሉም' : 'All' },
    { value: 'APARTMENT', label: lang === 'am' ? 'አፓርታማ' : 'Apartment' },
    { value: 'HOUSE', label: lang === 'am' ? 'ቤት' : 'House' },
    { value: 'LAND', label: lang === 'am' ? 'መሬት' : 'Land' },
    { value: 'COMMERCIAL', label: lang === 'am' ? 'የንግድ' : 'Commercial' },
  ];

  function applySearch() {
    setKeyword(keywordDraft.trim());
  }

  return (
    <>
      <SiteHeader active={listingType === 'SALE' ? 'buy' : 'rent'} />

      {/* ---------------- Hero search ---------------- */}
      <section className="hero-search">
        <h2>{lang === 'am' ? 'በኢትዮጵያ ቀጣዩን ቤትዎን ያግኙ' : 'Find your next home in Ethiopia'}</h2>
        <p>
          {lang === 'am'
            ? 'በአዲስ አበባ እና ከዚያ ባሻገር የተረጋገጡ ማስታወቂያዎችን ይፈልጉ'
            : 'Search verified listings across Addis Ababa and beyond'}
        </p>

        <div className="search-panel">
          <div className="sp-field">
            <div className="sp-lbl">{lang === 'am' ? 'አካባቢ' : 'Location'}</div>
            <input
              className="sp-input"
              placeholder={t(lang, 'home.searchPlaceholder')}
              value={keywordDraft}
              onChange={(e) => setKeywordDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applySearch()}
            />
          </div>

          <div className="sp-field">
            <div className="sp-lbl">{t(lang, 'postListing.listingType')}</div>
            <select
              className="sp-select"
              value={listingType ?? 'ANY'}
              onChange={(e) =>
                setListingType(
                  e.target.value === 'ANY' ? undefined : (e.target.value as ListingType)
                )
              }
            >
              <option value="RENT">{t(lang, 'common.forRent')}</option>
              <option value="SALE">{t(lang, 'common.forSale')}</option>
              <option value="ANY">{lang === 'am' ? 'ሁሉም' : 'Any'}</option>
            </select>
          </div>

          <div className="sp-field">
            <div className="sp-lbl">{lang === 'am' ? 'ከፍተኛ ዋጋ' : 'Max Price'}</div>
            <input
              className="sp-input"
              type="number"
              placeholder={lang === 'am' ? 'ማንኛውም' : 'Any'}
              value={maxPrice ?? ''}
              onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : undefined)}
            />
          </div>

          <div className="sp-field">
            <div className="sp-lbl">{t(lang, 'listingDetail.bedrooms')}</div>
            <select
              className="sp-select"
              value={minBedrooms ?? ''}
              onChange={(e) => setMinBedrooms(e.target.value ? Number(e.target.value) : undefined)}
            >
              <option value="">{lang === 'am' ? 'ማንኛውም' : 'Any'}</option>
              <option value="1">1+</option>
              <option value="2">2+</option>
              <option value="3">3+</option>
              <option value="4">4+</option>
            </select>
          </div>

          <button className="btn btn-gold" onClick={applySearch} aria-label="Search">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#14181A"
              strokeWidth="2.4"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" />
            </svg>
          </button>
        </div>
      </section>

      {/* ---------------- Toolbar ---------------- */}
      <div className="feed-toolbar">
        <div className="chips">
          {propertyChips.map((chip) => (
            <button
              key={chip.value}
              className={`chip${propertyType === chip.value ? ' active' : ''}`}
              onClick={() => setPropertyType(chip.value)}
            >
              {chip.label}
            </button>
          ))}
        </div>

        <div className="toolbar-right">
          <button className="filter-trigger mobile-filter-trigger" onClick={() => setFiltersOpen(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
              <path d="M4 6h16M7 12h10M10 18h4" />
            </svg>
            {t(lang, 'searchFilters.openFilters')}
            {activeFilterCount > 0 && <span className="count-dot">{activeFilterCount}</span>}
          </button>

          <select
            className="sort-select"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
          >
            <option value="newest">{t(lang, 'home.sortNewest')}</option>
            <option value="price_asc">{t(lang, 'home.sortPriceAsc')}</option>
            <option value="price_desc">{t(lang, 'home.sortPriceDesc')}</option>
          </select>

          <div className="view-toggle">
            <button className={view === 'list' ? 'active' : ''} onClick={() => setView('list')}>
              {t(lang, 'home.list')}
            </button>
            <button className={view === 'map' ? 'active' : ''} onClick={() => setView('map')}>
              {t(lang, 'home.map')}
            </button>
          </div>
        </div>
      </div>

      {filtersOpen && (
        <SearchFilterPanel
          initial={filterValues}
          resultCount={total}
          onApply={applyFilters}
          onClose={() => setFiltersOpen(false)}
        />
      )}

      {/* ---------------- Results (persistent sidebar + results on desktop) ---------------- */}
      <div className="filters-columns">
        {view === 'list' && (
          <FilterSidebar values={filterValues} onChange={patchFilters} onReset={resetFilters} />
        )}
        <div className="filter-results">
          <div className="feed-body">
        {view === 'map' ? (
          isLoading ? (
            <div className="skeleton-block" style={{ height: 560, borderRadius: 16 }} />
          ) : isError ? (
            <div className="state-panel">
              <h3>{lang === 'am' ? 'ማስታወቂያዎችን መጫን አልተቻለም' : "Couldn't load listings"}</h3>
              <button className="btn btn-outline-dark" onClick={() => refetch()}>
                {lang === 'am' ? 'እንደገና ሞክር' : 'Try again'}
              </button>
            </div>
          ) : listings.length === 0 ? (
            <div className="state-panel">
              <h3>{lang === 'am' ? 'ምንም ማስታወቂያ አልተገኘም' : 'No listings match your search'}</h3>
              <p>
                {lang === 'am'
                  ? 'ማጣሪያዎችን ያስተካክሉ ወይም ሌላ አካባቢ ይሞክሩ።'
                  : 'Try adjusting your filters, or search a different area.'}
              </p>
            </div>
          ) : (
            <>
              <div className="result-count">
                {total} {lang === 'am' ? 'ማስታወቂያዎች' : total === 1 ? 'listing' : 'listings'}
              </div>
              <ListingsMap listings={listings} />
            </>
          )
        ) : isLoading ? (
          <div className="listing-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <ListingCardSkeleton key={i} />
            ))}
          </div>
        ) : isError ? (
          <div className="state-panel">
            <h3>{lang === 'am' ? 'ማስታወቂያዎችን መጫን አልተቻለም' : "Couldn't load listings"}</h3>
            <p>
              {error instanceof Error ? error.message : 'Something went wrong.'}
              <br />
              {lang === 'am'
                ? 'የኋላ አገልጋዩ እየሰራ መሆኑን ያረጋግጡ።'
                : 'Check that the backend is running on port 3000.'}
            </p>
            <button className="btn btn-outline-dark" onClick={() => refetch()}>
              {lang === 'am' ? 'እንደገና ሞክር' : 'Try again'}
            </button>
          </div>
        ) : listings.length === 0 ? (
          <div className="state-panel">
            <h3>{lang === 'am' ? 'ምንም ማስታወቂያ አልተገኘም' : 'No listings match your search'}</h3>
            <p>
              {lang === 'am'
                ? 'ማጣሪያዎችን ያስተካክሉ ወይም ሌላ አካባቢ ይሞክሩ።'
                : 'Try adjusting your filters, or search a different area.'}
            </p>
            <button
              className="btn btn-outline-dark"
              onClick={() => {
                setPropertyType('ALL');
                setKeyword('');
                setKeywordDraft('');
                setMaxPrice(undefined);
                setMinBedrooms(undefined);
              }}
            >
              {lang === 'am' ? 'ማጣሪያዎችን አጽዳ' : 'Clear filters'}
            </button>
          </div>
        ) : (
          <>
            <div className="result-count">
              {total} {lang === 'am' ? 'ማስታወቂያዎች' : total === 1 ? 'listing' : 'listings'}
            </div>
            <div className="listing-grid">
              {listings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  isFavorited={favoriteIds.has(listing.id)}
                  onToggleFavorite={(l) =>
                    toggleFavorite.mutate({
                      listingId: l.id,
                      isFavorited: favoriteIds.has(l.id),
                    })
                  }
                />
              ))}
            </div>

            {hasNextPage && (
              <div className="load-more-row">
                <button
                  className="btn btn-outline-dark"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                >
                  {isFetchingNextPage
                    ? t(lang, 'common.loading')
                    : lang === 'am'
                      ? 'ተጨማሪ አሳይ'
                      : 'Load more'}
                </button>
              </div>
            )}
          </>
        )}
          </div>
        </div>
      </div>
    </>
  );
}
