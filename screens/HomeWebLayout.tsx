import React from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from "react-native";
import KakaoMap from "../components/KakaoMap";
import SideMenu from "../components/layout/SideMenu";
import { SearchResult, SearchOptions } from "../types/search";
import { PageResponse } from "../types/api";
import { RouteResult } from "../types/route";
import { useState } from "react";
import { webStyles } from "./HomeWebLayout.styles";
import RecentlyViewedPlaces from "../components/RecentlyViewedPlaces";

interface HomeWebLayoutProps {
  // Props for HomeWebLayout
  selectedPlaceId: string | null;
  setSelectedPlaceId: (id: string | null) => void;
  showInfoWindow: boolean;
  setShowInfoWindow: (show: boolean) => void;
  selectedMarkerPosition: { lat: number; lng: number } | null;
  location: { latitude: number; longitude: number } | null;
  mapCenter: { latitude: number; longitude: number } | null;
  setMapCenter: (center: { latitude: number; longitude: number }) => void;
  onMapIdle: (lat: number, lng: number) => void;
  markers: any[]; // Adjust type as needed
  isMenuOpen: boolean;
  setIsMenuOpen: (isOpen: boolean) => void;
  sideMenuAnimation: Animated.Value;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: SearchResult[];
  allMarkers: SearchResult[];
  isLoading: boolean;
  errorMsg: string | null;
  onSearch: () => Promise<void>;
  onClearSearch: () => void; // New prop
  onSelectResult: (item: SearchResult) => void;
  onMarkerPress: (placeId: string, lat?: number, lng?: number) => void;
  searchOptions: SearchOptions;
  setSearchOptions: (options: Partial<SearchOptions>) => void;
  loadingNextPage: boolean;
  loadingAllMarkers: boolean;
  markerCountReachedLimit: boolean;
  onNextPage: () => Promise<void>;
  pagination: Omit<PageResponse<any>, 'content'> | null;
  onSetRouteLocation?: (type: 'departure' | 'arrival', placeInfo: SearchResult) => void;
  onOpenSidebar?: () => void;
  routeResult: RouteResult | null;
  isRouteLoading: boolean;
  routeError: string | null;
  startRoute: any;
  clearRoute: () => void;
  showSearchInAreaButton: boolean;
  handleSearchInArea: () => void;
  activeTab: 'search' | 'route';
  setActiveTab: (tab: 'search' | 'route') => void;
  // New props from useSharedSearch
  startLocation: string;
  setStartLocation: (location: string) => void;
  endLocation: string;
  setEndLocation: (location: string) => void;
  startLocationResults: SearchResult[];
  endLocationResults: SearchResult[];
  isSearchingStart: boolean;
  isSearchingEnd: boolean;
  showStartResults: boolean;
  setShowStartResults: (show: boolean) => void;
  showEndResults: boolean;
  setShowEndResults: (show: boolean) => void;
  selectedTransportMode: 'driving' | 'transit' | 'walking' | 'cycling';
  setSelectedTransportMode: (mode: 'driving' | 'transit' | 'walking' | 'cycling') => void;
  autocompleteSuggestions: any[];
  showAutocomplete: boolean;
  setShowAutocomplete: (show: boolean) => void;
  debouncedAutocomplete: (query: string) => void;
  debouncedSearchStartLocation: (query: string) => void;
  debouncedSearchEndLocation: (query: string) => void;
  handleTextEdit: () => void;
  searchLocation: { lat: number; lng: number };
  sharedSearchLocationFromHook: { latitude: number; longitude: number } | null;
  startLocationObject: SearchResult | null;
  setStartLocationObject: (loc: SearchResult | null) => void;
  endLocationObject: SearchResult | null;
  setEndLocationObject: (loc: SearchResult | null) => void;
  setTemporarySelectedMarker: (marker: MarkerData | null) => void;
  onRecentlyViewedPlaceClick: (place: MarkerData) => void; // Add this prop
}

const HomeWebLayout: React.FC<HomeWebLayoutProps> = ({
  selectedPlaceId,
  setSelectedPlaceId,
  showInfoWindow,
  setShowInfoWindow,
  selectedMarkerPosition,
  location,
  mapCenter,
  setMapCenter,
  onMapIdle,
  markers,
  isMenuOpen,
  setIsMenuOpen,
  sideMenuAnimation,
  searchQuery,
  setSearchQuery,
  searchResults,
  allMarkers,
  isLoading,
  errorMsg,
  onSearch,
  onClearSearch,
  onSelectResult,
  onMarkerPress,
  searchOptions,
  setSearchOptions,
  loadingNextPage,
  loadingAllMarkers,
  markerCountReachedLimit,
  onNextPage,
  pagination,
  onSetRouteLocation,
  onOpenSidebar,
  routeResult,
  isRouteLoading,
  routeError,
  startRoute,
  clearRoute,
  showSearchInAreaButton,
  handleSearchInArea,
  activeTab,
  setActiveTab,
  // New props from useSharedSearch
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
  searchLocation,
  sharedSearchLocationFromHook,
  startLocationObject,
  setStartLocationObject,
  endLocationObject,
  setEndLocationObject,
  setTemporarySelectedMarker,
  onRecentlyViewedPlaceClick,
}) => {
  const [showRecentlyViewed, setShowRecentlyViewed] = useState(false);
  return (
    <View style={webStyles.container}>
      {errorMsg && (
        <View style={webStyles.errorContainer}>
          <Text style={webStyles.errorText}>{errorMsg}</Text>
        </View>
      )}
      <View style={webStyles.mainContainer}>
        <SideMenu
          isOpen={isMenuOpen}
          searchResults={searchResults}
          allMarkers={allMarkers}
          onSelectResult={onSelectResult}
          isLoading={isLoading}
          errorMsg={errorMsg}
          onToggle={() => setIsMenuOpen(!isMenuOpen)}
          style={{ transform: [{ translateX: sideMenuAnimation }] }}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onSearch={onSearch}
          onClearSearch={onClearSearch}
          searchOptions={searchOptions}
          setSearchOptions={setSearchOptions}
          loadingNextPage={loadingNextPage}
          loadingAllMarkers={loadingAllMarkers}
          markerCountReachedLimit={markerCountReachedLimit}
          onNextPage={onNextPage}
          pagination={pagination}
          onSetRouteLocation={onSetRouteLocation}
          onOpenSidebar={onOpenSidebar}
          routeResult={routeResult}
          isRouteLoading={isRouteLoading}
          routeError={routeError}
          startRoute={startRoute}
          clearRoute={clearRoute}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          // New props from useSharedSearch
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
          searchLocation={searchLocation}
          location={sharedSearchLocationFromHook}
          startLocationObject={startLocationObject}
          setStartLocationObject={setStartLocationObject}
          endLocationObject={endLocationObject}
          setEndLocationObject={setEndLocationObject}
        />
        <View style={webStyles.mapContainer}>
          {mapCenter ? (
            <>
              <KakaoMap
                latitude={mapCenter.latitude}
                longitude={mapCenter.longitude}
                markers={markers}
                routeResult={routeResult}
                onMapIdle={onMapIdle}
                onMarkerPress={(id, lat, lng) => id && onMarkerPress(id, lat, lng)}
                showInfoWindow={showInfoWindow}
                selectedPlaceId={selectedPlaceId || undefined}
                selectedMarkerLat={selectedMarkerPosition?.lat}
                selectedMarkerLng={selectedMarkerPosition?.lng}
                onCloseInfoWindow={() => {
                  setShowInfoWindow(false);
                  setTemporarySelectedMarker(null);
                }}
                onSetRouteLocation={onSetRouteLocation}
              />
              {showSearchInAreaButton && (
                <TouchableOpacity
                  style={webStyles.searchInAreaButton}
                  onPress={handleSearchInArea}
                >
                  <Text style={webStyles.searchInAreaButtonText}>현재 지도에서 검색</Text>
                </TouchableOpacity>
              )}
              {/* Recently Viewed Places Button */}
              <TouchableOpacity
                style={webStyles.recentlyViewedButton}
                onPress={() => setShowRecentlyViewed(!showRecentlyViewed)}
              >
                <Text style={webStyles.recentlyViewedButtonText}>최근 본 장소</Text>
              </TouchableOpacity>
              {/* Recently Viewed Places Component */}
              {showRecentlyViewed && (
                <RecentlyViewedPlaces onPlaceClick={onRecentlyViewedPlaceClick} />
              )}
            </>
          ) : (
            <View style={webStyles.loadingContainer}>
              <ActivityIndicator size="large" color="#0000ff" />
              <Text>지도를 불러오는 중입니다...</Text>
            </View>
          )}
          {location && (
            <TouchableOpacity 
              style={webStyles.currentLocationButton}
              onPress={() => setMapCenter({ latitude: location.latitude, longitude: location.longitude })}>
              <Text style={webStyles.currentLocationButtonIcon}>📍</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

export default HomeWebLayout;
