import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import {
  Animated,
  Keyboard,
  Platform,
} from "react-native";
import { usePlaceStore } from "../store/placeStore";
import { useCurrentLocation } from "../hooks/useCurrentLocation";
import { useSearch } from "../hooks/useSearch";
import { useRoute } from "../hooks/useRoute";
import { useSharedSearch } from "../hooks/useSharedSearch"; // Import useSharedSearch
import HomeWebLayout from "./HomeWebLayout";
import HomeMobileLayout from "./HomeMobileLayout";
import { SearchResult } from "../types/search";
import { MarkerData } from "../types/kakaoMap";
import { MapHandles } from "../components/KakaoMap";

// Helper hook to get the previous value of a prop or state
const usePrevious = <T>(value: T): T | undefined => {
  const ref = useRef<T>();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
};

/**
 * Home 컴포넌트
 * 앱의 메인 화면으로, 지도와 검색 기능을 제공합니다.
 * 웹과 모바일 플랫폼에 따라 다른 레이아웃을 렌더링합니다.
 */
export default function Home() {
  const mapRef = useRef<MapHandles>(null);
  // 전역 상태 관리
  const selectedPlaceId = usePlaceStore((s) => s.selectedPlaceId);
  const setSelectedPlaceId = usePlaceStore((s) => s.setSelectedPlaceId);
  const showInfoWindow = usePlaceStore((s) => s.showInfoWindow);
  const setShowInfoWindow = usePlaceStore((s) => s.setShowInfoWindow);
  const selectedMarkerPosition = usePlaceStore((s) => s.selectedMarkerPosition);
  const setSelectedMarkerPosition = usePlaceStore((s) => s.setSelectedMarkerPosition);
  const setMapCenterToStore = usePlaceStore((s) => s.setMapCenter);
  
  // 현재 위치 및 검색 관련 훅
  const USE_HARDCODED_LOCATION = process.env.EXPO_PUBLIC_USE_HARDCODED_LOCATION === 'true';

  const {
    location: actualLocation,
    error: actualLocationError,
    loading: actualLocationLoading,
  } = useCurrentLocation();

  const location = useMemo(() => (
    USE_HARDCODED_LOCATION
      ? {
          latitude: parseFloat(process.env.EXPO_PUBLIC_HARDCODED_LATITUDE || '0'),
          longitude: parseFloat(process.env.EXPO_PUBLIC_HARDCODED_LONGITUDE || '0'),
        }
      : actualLocation
  ), [USE_HARDCODED_LOCATION, actualLocation]);
  const locationError = USE_HARDCODED_LOCATION ? null : actualLocationError;
  const locationLoading = USE_HARDCODED_LOCATION ? false : actualLocationLoading;

  const {
    searchQuery,
    setSearchQuery,
    searchResults,
    loading: searchLoading,
    error: searchError,
    performSearch,
    clearSearchResults: clearSearchResultsFromHook,
    searchOptions,
    setSearchOptions,
    allMarkers,
    loadingNextPage,
    loadingAllMarkers,
    markerCountReachedLimit,
    fetchNextPage,
    searchCenter,
    pagination,
    fetchAllMarkers,
  } = useSearch();

  // 길찾기 관련 훅
  const {
    routeResult,
    isLoading: isRouteLoading,
    error: routeError,
    startRoute,
    clearRoute,
  } = useRoute();

  // UI 상태 관리
  const [isMenuOpen, setIsMenuOpen] = useState(true);
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false);
  const sideMenuAnimation = useRef(new Animated.Value(0)).current;

  const prevIsMenuOpen = usePrevious(isMenuOpen);



  const onToggleSidebarCallback = useCallback(() => setIsMenuOpen(true), [setIsMenuOpen]);

  const {
    activeTab,
    setActiveTab,
    startLocation,
    setStartLocation,
    endLocation,
    setEndLocation,
    startLocationResults,
    endLocationResults,
    isSearchingStart,
    isSearchingEnd,
    showStartResults,
    setShowStartResults,
    showEndResults,
    setShowEndResults,
    selectedTransportMode,
    setSelectedTransportMode,
    autocompleteSuggestions,
    showAutocomplete,
    setShowAutocomplete,
    debouncedAutocomplete,
    debouncedSearchStartLocation,
    debouncedSearchEndLocation,
    handleTextEdit,
    searchLocation: sharedSearchLocation,
    location: sharedSearchLocationFromHook,
    startLocationObject,
    setStartLocationObject,
    endLocationObject,
    setEndLocationObject,
  } = useSharedSearch(
    routeResult,
    isRouteLoading,
    routeError,
    startRoute,
    clearRoute,
    onToggleSidebarCallback
  );

  const [showSearchInAreaButton, setShowSearchInAreaButton] = useState(false);
  const [temporarySelectedMarker, setTemporarySelectedMarker] = useState<MarkerData | null>(null);

  const [mapCenter, setMapCenterState] = useState<{ latitude: number; longitude: number } | null>(null);

  const setMapCenter = useCallback((center: { latitude: number; longitude: number }) => {
    setMapCenterState(center);
    setMapCenterToStore(center);
  }, [setMapCenterToStore]);

  const clearSearchResults = useCallback(() => {
    setSearchQuery("");
    clearSearchResultsFromHook();
    setShowAutocomplete(false);
  }, [clearSearchResultsFromHook, setSearchQuery, setShowAutocomplete]);

  useEffect(() => {
    if (searchCenter) {
      setMapCenter({ latitude: searchCenter.lat, longitude: searchCenter.lng });
    }
  }, [searchCenter, setMapCenter]);

  useEffect(() => {
    if (location && !mapCenter) {
      setMapCenter({ latitude: location.latitude, longitude: location.longitude });
    }
  }, [location, mapCenter, setMapCenter]);

  useEffect(() => {
    if (pagination && pagination.currentPage === 1 && !pagination.isLast && !loadingAllMarkers) {
      if (mapCenter && location) {
        fetchAllMarkers(mapCenter.latitude, mapCenter.longitude, location.latitude, location.longitude);
      }
    }
  }, [pagination?.currentPage]);

  useEffect(() => {
    const SIDEMENU_WIDTH = 330;
    Animated.timing(sideMenuAnimation, {
      toValue: isMenuOpen ? 0 : -SIDEMENU_WIDTH,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isMenuOpen]);

  // Effect to PAN LEFT when the side menu is opened
  useEffect(() => {
    const focusPointExists = location || selectedPlaceId || routeResult;
    // Only pan when the menu is *opened* (was closed, now open)
    if (isMenuOpen && !prevIsMenuOpen && focusPointExists && Platform.OS === 'web') {
        const SIDE_MENU_WIDTH = 330;
        setTimeout(() => {
            mapRef.current?.panBy(-SIDE_MENU_WIDTH / 2, 0);
        }, 100); // Delay to ensure map has centered
    }
  }, [isMenuOpen, prevIsMenuOpen, location, selectedPlaceId, routeResult]);





  // Effect to PAN RIGHT when focus is lost or menu closes
  const wasPanned = usePrevious(isMenuOpen && (showInfoWindow || !!routeResult || !!location));
  useEffect(() => {
      const isPanned = isMenuOpen && (showInfoWindow || !!routeResult || !!location) && Platform.OS === 'web';
      if (wasPanned && !isPanned) {
          const SIDE_MENU_WIDTH = 330;
          setTimeout(() => {
              mapRef.current?.panBy(SIDE_MENU_WIDTH / 2, 0);
          }, 50);
      }
  }, [isMenuOpen, showInfoWindow, routeResult, location]);


  const handleSearch = useCallback(async () => {
    Keyboard.dismiss();
    setShowSearchInAreaButton(false);
    if (!mapCenter) {
      alert("지도 중심 정보를 가져오는 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }
    if (!location) {
      alert("현재 위치 정보를 가져오는 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }
    await performSearch(mapCenter.latitude, mapCenter.longitude, location.latitude, location.longitude);

    setBottomSheetOpen(true);
  }, [mapCenter, location, performSearch]);

  const handleSearchInArea = useCallback(async () => {
    if (!mapCenter || !location) return;
    setShowSearchInAreaButton(false);
    await performSearch(mapCenter.latitude, mapCenter.longitude, location.latitude, location.longitude, true);
  }, [mapCenter, location, performSearch]);

  const handleMapIdle = useCallback((lat: number, lng: number) => {
    setMapCenter({ latitude: lat, longitude: lng });
    if (searchResults.length > 0) {
      setShowSearchInAreaButton(true);
    }
  }, [searchResults.length, setMapCenter]);

  const handleNextPage = useCallback(async () => {
    if (!mapCenter || !location) return;
    await fetchNextPage(mapCenter.latitude, mapCenter.longitude, location.latitude, location.longitude);
  }, [mapCenter, location, fetchNextPage]);

  const handleSelectResult = useCallback((item: SearchResult) => {
    const SIDE_MENU_WIDTH = 330;
    if (isMenuOpen && Platform.OS === 'web') {
      mapRef.current?.panTo(item.lat, item.lng, SIDE_MENU_WIDTH / 2, 0);
    } else {
      setMapCenter({ latitude: item.lat, longitude: item.lng });
    }

    if (item.placeId) {
      setSelectedPlaceId(item.placeId);
      setSelectedMarkerPosition({ lat: item.lat, lng: item.lng });
      setShowInfoWindow(true);
    }
    setBottomSheetOpen(false);
  }, [isMenuOpen, setMapCenter, setSelectedPlaceId, setSelectedMarkerPosition, setShowInfoWindow]);

  const handleMarkerPress = useCallback((placeId: string, lat?: number, lng?: number) => {
    setSelectedPlaceId(placeId);
    if (lat !== undefined && lng !== undefined) {
      setSelectedMarkerPosition({ lat, lng });
    }
    setShowInfoWindow(true);
  }, [setSelectedPlaceId, setSelectedMarkerPosition, setShowInfoWindow]);

  const handleRecentlyViewedPlaceClick = useCallback((place: MarkerData) => {
    const SIDE_MENU_WIDTH = 330;
    if (isMenuOpen && Platform.OS === 'web') {
      mapRef.current?.panTo(place.lat, place.lng, SIDE_MENU_WIDTH / 2, 0);
    } else {
      setMapCenter({ latitude: place.lat, longitude: place.lng });
    }
    setSelectedPlaceId(place.placeId);
    setSelectedMarkerPosition({ lat: place.lat, lng: place.lng });
    setTemporarySelectedMarker(place);
    setShowInfoWindow(true);
  }, [isMenuOpen, setMapCenter, setSelectedPlaceId, setSelectedMarkerPosition, setTemporarySelectedMarker, setShowInfoWindow]);

  const handleSetRouteLocation = useCallback((type: 'departure' | 'arrival', placeInfo: SearchResult) => {
    if (window && (window as any).setRouteLocationFromInfoWindow) {
      (window as any).setRouteLocationFromInfoWindow(type, placeInfo);
    }
  }, []);

  const isLoading = locationLoading || searchLoading;
  const errorMsg = (locationError || searchError) ? String(locationError || searchError) : null;

  const mapMarkers = useMemo(() => {
    const baseMarkers = activeTab === 'search' ? [
      ...(location ? [{
        placeId: "user-location",
        placeName: "내 위치",
        lat: location.latitude,
        lng: location.longitude,
        markerType: "userLocation",
      }] : []),
      ...allMarkers.map(marker => ({
        placeId: marker.placeId,
        placeName: marker.placeName,
        lat: marker.lat,
        lng: marker.lng,
        categoryGroupName: marker.categoryGroupName,
        roadAddress: marker.roadAddress,
        roadAddressDong: marker.roadAddressDong,
        lotAddress: marker.lotAddress,
        phone: marker.phone,
        placeUrl: marker.placeUrl,
        markerType: marker.placeId === selectedPlaceId ? 'selected' : 'default'
      }))
    ] : [];

    if (temporarySelectedMarker && !baseMarkers.some(m => m.placeId === temporarySelectedMarker.placeId)) {
      return [...baseMarkers, { ...temporarySelectedMarker, markerType: 'selected' }];
    }
    return baseMarkers;
  }, [activeTab, location, allMarkers, selectedPlaceId, temporarySelectedMarker]);

  const mapRouteResult = useMemo(() => {
    return activeTab === 'route' ? routeResult : null;
  }, [activeTab, routeResult]);

  if (Platform.OS === 'web') {
    return (
      <HomeWebLayout
        mapRef={mapRef}
        selectedPlaceId={selectedPlaceId}
        setSelectedPlaceId={setSelectedPlaceId}
        showInfoWindow={showInfoWindow}
        setShowInfoWindow={setShowInfoWindow}
        selectedMarkerPosition={selectedMarkerPosition}
        location={location}
        mapCenter={mapCenter}
        setMapCenter={setMapCenter}
        onMapIdle={handleMapIdle}
        markers={mapMarkers}
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
        sideMenuAnimation={sideMenuAnimation}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchResults={searchResults}
        allMarkers={allMarkers}
        isLoading={isLoading}
        errorMsg={errorMsg}
        onSearch={handleSearch}
        onClearSearch={clearSearchResults}
        onSelectResult={handleSelectResult}
        onMarkerPress={handleMarkerPress}
        searchOptions={searchOptions}
        setSearchOptions={setSearchOptions}
        loadingNextPage={loadingNextPage}
        loadingAllMarkers={loadingAllMarkers}
        markerCountReachedLimit={markerCountReachedLimit}
        onNextPage={handleNextPage}
        pagination={pagination}
        onSetRouteLocation={handleSetRouteLocation}
        onOpenSidebar={() => setIsMenuOpen(true)}
        routeResult={mapRouteResult}
        isRouteLoading={isRouteLoading}
        routeError={routeError}
        startRoute={startRoute}
        clearRoute={clearRoute}
        showSearchInAreaButton={showSearchInAreaButton}
        handleSearchInArea={handleSearchInArea}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        startLocation={startLocation}
        setStartLocation={setStartLocation}
        endLocation={endLocation}
        setEndLocation={setEndLocation}
        startLocationResults={startLocationResults}
        endLocationResults={endLocationResults}
        isSearchingStart={isSearchingStart}
        isSearchingEnd={isSearchingEnd}
        showStartResults={showStartResults}
        setShowStartResults={setShowStartResults}
        showEndResults={showEndResults}
        setShowEndResults={setShowEndResults}
        selectedTransportMode={selectedTransportMode}
        setSelectedTransportMode={setSelectedTransportMode}
        autocompleteSuggestions={autocompleteSuggestions}
        showAutocomplete={showAutocomplete}
        setShowAutocomplete={setShowAutocomplete}
        debouncedAutocomplete={debouncedAutocomplete}
        debouncedSearchStartLocation={debouncedSearchStartLocation}
        debouncedSearchEndLocation={debouncedSearchEndLocation}
        handleTextEdit={handleTextEdit}
        searchLocation={sharedSearchLocation}
        sharedSearchLocationFromHook={sharedSearchLocationFromHook}
        startLocationObject={startLocationObject}
        setStartLocationObject={setStartLocationObject}
        endLocationObject={endLocationObject}
        setEndLocationObject={setEndLocationObject}
        onRecentlyViewedPlaceClick={handleRecentlyViewedPlaceClick}
        setTemporarySelectedMarker={setTemporarySelectedMarker}
      />
    );
  } else {
    return (
      <HomeMobileLayout
        selectedPlaceId={selectedPlaceId}
        setSelectedPlaceId={setSelectedPlaceId}
        showInfoWindow={showInfoWindow}
        setShowInfoWindow={setShowInfoWindow}
        selectedMarkerPosition={selectedMarkerPosition}
        location={location}
        mapCenter={mapCenter}
        setMapCenter={setMapCenter}
        onMapIdle={handleMapIdle}
        markers={mapMarkers}
        bottomSheetOpen={bottomSheetOpen}
        setBottomSheetOpen={setBottomSheetOpen}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchResults={searchResults}
        allMarkers={allMarkers}
        isLoading={isLoading}
        errorMsg={errorMsg}
        onSearch={handleSearch}
        onClearSearch={clearSearchResults}
        onSelectResult={handleSelectResult}
        onMarkerPress={handleMarkerPress}
        searchOptions={searchOptions}
        setSearchOptions={setSearchOptions}
        loadingNextPage={loadingNextPage}
        loadingAllMarkers={loadingAllMarkers}
        markerCountReachedLimit={markerCountReachedLimit}
        onNextPage={handleNextPage}
        pagination={pagination}
        onSetRouteLocation={handleSetRouteLocation}
        onOpenSidebar={() => setIsMenuOpen(true)}
        routeResult={mapRouteResult}
        isRouteLoading={isRouteLoading}
        routeError={routeError}
        startRoute={startRoute}
        clearRoute={clearRoute}
        showSearchInAreaButton={showSearchInAreaButton}
        handleSearchInArea={handleSearchInArea}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        startLocation={startLocation}
        setStartLocation={setStartLocation}
        endLocation={endLocation}
        setEndLocation={setEndLocation}
        startLocationResults={startLocationResults}
        endLocationResults={endLocationResults}
        isSearchingStart={isSearchingStart}
        isSearchingEnd={isSearchingEnd}
        showStartResults={showStartResults}
        setShowStartResults={setShowStartResults}
        showEndResults={showEndResults}
        setShowEndResults={setShowEndResults}
        selectedTransportMode={selectedTransportMode}
        setSelectedTransportMode={setSelectedTransportMode}
        autocompleteSuggestions={autocompleteSuggestions}
        showAutocomplete={showAutocomplete}
        setShowAutocomplete={setShowAutocomplete}
        debouncedAutocomplete={debouncedAutocomplete}
        debouncedSearchStartLocation={debouncedSearchStartLocation}
        debouncedSearchEndLocation={debouncedSearchEndLocation}
        handleTextEdit={handleTextEdit}
        searchLocation={sharedSearchLocation}
        sharedSearchLocationFromHook={sharedSearchLocationFromHook}
        startLocationObject={startLocationObject}
        setStartLocationObject={setStartLocationObject}
        endLocationObject={endLocationObject}
        setEndLocationObject={setEndLocationObject}
      />
    );
  }
}
