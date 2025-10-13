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
import Header from "../components/layout/Header";
import SideMenu from "../components/layout/SideMenu";
import { SearchResult, SearchOptions } from "../types/search";
import { PageResponse } from "../types/api";
import { RouteResult } from "../types/route";

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
  routeResult?: RouteResult | null;
  isRouteLoading?: boolean;
  routeError?: string | null;
  startRoute?: any;
  clearRoute?: () => void;
  showSearchInAreaButton: boolean;
  handleSearchInArea: () => void;
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
}) => {
  return (
    <View style={webStyles.container}>
      <Header />
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
                onCloseInfoWindow={() => setShowInfoWindow(false)}
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

// 웹용 스타일 정의 (Home.tsx에서 가져옴)
const webStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  mainContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  mapContainer: {
    flex: 1,
    height: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    backgroundColor: '#ff385c',
    paddingVertical: 10,
    paddingHorizontal: 15,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  errorText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
  },
  currentLocationButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
    boxShadow: '0px 2px 3.84px rgba(0, 0, 0, 0.25)',
    zIndex: 999,
  },
  currentLocationButtonIcon: {
    fontSize: 24,
  },
  searchInAreaButton: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    backgroundColor: '#007bff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    zIndex: 999,
  },
  searchInAreaButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default HomeWebLayout;
