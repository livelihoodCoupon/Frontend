import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import {
  Animated,
  Keyboard,
  Platform,
  Dimensions,
} from "react-native";
import { usePlaceStore } from "../store/placeStore";
import { useCurrentLocation } from "../hooks/useCurrentLocation";
import { useSearch } from "../hooks/useSearch";
import { useRoute } from "../hooks/useRoute";
import HomeWebLayout from "./HomeWebLayout";
import HomeMobileLayout from "./HomeMobileLayout";
import { SearchResult } from "../types/search";

/**
 * Home 컴포넌트
 * 앱의 메인 화면으로, 지도와 검색 기능을 제공합니다.
 * 웹과 모바일 플랫폼에 따라 다른 레이아웃을 렌더링합니다.
 */
export default function Home() {
  // 전역 상태 관리
  const selectedPlaceId = usePlaceStore((s) => s.selectedPlaceId);
  const setSelectedPlaceId = usePlaceStore((s) => s.setSelectedPlaceId);
  const showInfoWindow = usePlaceStore((s) => s.showInfoWindow);
  const setShowInfoWindow = usePlaceStore((s) => s.setShowInfoWindow);
  const selectedMarkerPosition = usePlaceStore((s) => s.selectedMarkerPosition);
  const setSelectedMarkerPosition = usePlaceStore((s) => s.setSelectedMarkerPosition);
  const setMapCenterToStore = usePlaceStore((s) => s.setMapCenter);
  
  // 현재 위치 및 검색 관련 훅
  // 에뮬레이터 테스트를 위해 하드코딩된 위치 사용 여부를 설정합니다.
  // 실제 배포 시에는 반드시 false로 설정해야 합니다.
  const USE_HARDCODED_LOCATION = process.env.EXPO_PUBLIC_USE_HARDCODED_LOCATION === 'true'; // .env 파일에서 설정

  const {
    location: actualLocation,
    error: actualLocationError,
    loading: actualLocationLoading,
  } = useCurrentLocation();

  const location = USE_HARDCODED_LOCATION
    ? {
        latitude: parseFloat(process.env.EXPO_PUBLIC_HARDCODED_LATITUDE || '0'),
        longitude: parseFloat(process.env.EXPO_PUBLIC_HARDCODED_LONGITUDE || '0'),
      }
    : actualLocation;
  const locationError = USE_HARDCODED_LOCATION
    ? null
    : actualLocationError;
  const locationLoading = USE_HARDCODED_LOCATION
    ? false
    : actualLocationLoading;
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
  const [isMenuOpen, setIsMenuOpen] = useState(true); // 사이드메뉴 열림/닫힘 상태
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false); // 모바일 하단 시트 상태
  const [bottomSheetHeight, setBottomSheetHeight] = useState(0); // 바텀시트 높이
  const [showPlaceDetail, setShowPlaceDetail] = useState(false); // 상세정보 표시 상태
  const sideMenuAnimation = useRef(new Animated.Value(0)).current; // 사이드메뉴 애니메이션

  // UI 상태 관리
  const [showSearchInAreaButton, setShowSearchInAreaButton] = useState(false);

  // 지도 중심 좌표 상태
  const [mapCenter, setMapCenterState] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  // 지도 중심 설정 함수 (store에도 동기화)
  const setMapCenter = useCallback((center: { latitude: number; longitude: number }) => {
    setMapCenterState(center);
    setMapCenterToStore(center); // store에도 저장
  }, [setMapCenterToStore]);

  const clearSearchResults = useCallback(() => {
    clearSearchResultsFromHook(); // useSearch 훅의 clearSearchResults 호출
  }, [clearSearchResultsFromHook]);

  // 검색 결과에 따라 지도 중심을 업데이트
  useEffect(() => {
    if (searchCenter) {
      setMapCenter({ latitude: searchCenter.lat, longitude: searchCenter.lng });
    }
  }, [searchCenter, setMapCenter]);

  // 현재 위치가 로드되면 지도 중심을 설정 (초기 로딩 시에만)
  useEffect(() => {
    if (location && !mapCenter) {
      setMapCenter({ latitude: location.latitude, longitude: location.longitude });
    }
  }, [location, mapCenter, setMapCenter]);

  // 최초 검색 성공 후, 모든 마커를 가져오는 로직 (한 번만 실행)
  useEffect(() => {
    if (pagination && pagination.currentPage === 1 && !pagination.isLast && !loadingAllMarkers) {
      if (mapCenter && location) {
        fetchAllMarkers(mapCenter.latitude, mapCenter.longitude, location.latitude, location.longitude);
      }
    }
  }, [pagination?.currentPage]); // pagination 전체가 아닌 currentPage만 의존성으로 설정

  // 사이드메뉴 애니메이션 처리
  useEffect(() => {
    const SIDEMENU_WIDTH = 350; // 사이드메뉴 너비 상수
    Animated.timing(sideMenuAnimation, {
      toValue: isMenuOpen ? 0 : -SIDEMENU_WIDTH,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isMenuOpen]);

  /**
   * 검색 실행 핸들러
   * 키보드를 닫고 현재 지도 중심 좌표를 기준으로 검색을 수행합니다.
   */
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
    setBottomSheetOpen(true); // 검색 후 하단 시트 열기
  }, [mapCenter, location, performSearch]);

  const handleSearchInArea = useCallback(async () => {
    if (!mapCenter) return;
    if (!location) {
      alert("현재 위치 정보를 가져오는 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }
<<<<<<< HEAD
    // 현재 위치를 기준으로 검색을 수행
    await performSearch(location.latitude, location.longitude, location.latitude, location.longitude);
    
    // 바텀시트가 열려있을 때 지도 중심 조정
    if (bottomSheetOpen && bottomSheetHeight) {
      const { height: SCREEN_HEIGHT } = Dimensions.get('window');
      const heightRatio = bottomSheetHeight / SCREEN_HEIGHT;
      // 지도 줌 레벨을 고려한 동적 오프셋 (줌 레벨이 높을수록 작은 오프셋)
      const baseOffset = -0.003; // 기본 오프셋
      const zoomFactor = Math.max(0.5, Math.min(2.0, heightRatio * 3)); // 줌 레벨 대응 계수
      const offsetLat = baseOffset * zoomFactor;
      
      setMapCenter({ 
        latitude: location.latitude + offsetLat, 
        longitude: location.longitude 
      });
    } else {
      setMapCenter({ latitude: location.latitude, longitude: location.longitude });
    }
    
    setBottomSheetOpen(true); // 검색 후 하단 시트 열기
  }, [location, performSearch, bottomSheetOpen, bottomSheetHeight]);
=======
    setShowSearchInAreaButton(false);
    await performSearch(mapCenter.latitude, mapCenter.longitude, location.latitude, location.longitude, true);
  }, [mapCenter, location, performSearch]);

  const handleMapIdle = useCallback((lat: number, lng: number) => {
    setMapCenter({ latitude: lat, longitude: lng });
    if (searchResults.length > 0) {
      setShowSearchInAreaButton(true);
    }
  }, [searchResults.length, setMapCenter, setShowSearchInAreaButton]);
>>>>>>> upstream/main

  const handleNextPage = useCallback(async () => {
    if (!mapCenter) return;
    if (!location) {
      alert("현재 위치 정보를 가져오는 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }
    await fetchNextPage(mapCenter.latitude, mapCenter.longitude, location.latitude, location.longitude);
  }, [mapCenter, location, fetchNextPage]);

  /**
   * 검색 결과 선택 핸들러
   * 선택된 장소로 지도를 이동하고 마커만 표시합니다. (InfoWindow는 표시하지 않음)
   * 바텀시트가 열려있을 때는 지도 중심을 위로 조정하여 마커가 보이도록 합니다.
   */
  const handleSelectResult = useCallback((item: SearchResult) => {
    // 바텀시트가 열려있을 때 지도 중심 조정
    if (bottomSheetOpen && bottomSheetHeight) {
      // 바텀시트 높이를 위도로 변환 (적절한 비율 사용)
      // 화면 높이 대비 바텀시트 높이 비율을 계산하여 위도 오프셋 적용
      const { height: SCREEN_HEIGHT } = Dimensions.get('window');
      const heightRatio = bottomSheetHeight / SCREEN_HEIGHT;
      // 지도 줌 레벨을 고려한 동적 오프셋 (줌 레벨이 높을수록 작은 오프셋)
      const baseOffset = -0.002; // 기본 오프셋 (장소 선택용)
      const zoomFactor = Math.max(0.5, Math.min(2.0, heightRatio * 3)); // 줌 레벨 대응 계수
      const offsetLat = baseOffset * zoomFactor;
      
      setMapCenter({ 
        latitude: item.lat + offsetLat, 
        longitude: item.lng 
      });
    } else {
      // 바텀시트가 닫혀있으면 원래 위치
      setMapCenter({ latitude: item.lat, longitude: item.lng });
    }
    
    if (item.placeId) {
      // 마커만 선택된 상태로 표시하고, InfoWindow는 표시하지 않음
      setSelectedPlaceId(item.placeId);
      setShowInfoWindow(false);
    }
<<<<<<< HEAD
    // 바텀시트는 유지하고 선택된 결과만 업데이트
  }, [bottomSheetOpen, bottomSheetHeight, setSelectedPlaceId, setShowInfoWindow]);
=======
    setBottomSheetOpen(false); // 결과 선택 후 하단 시트 닫기
  }, [setSelectedPlaceId, setShowInfoWindow, setMapCenter]);
>>>>>>> upstream/main

  /**
   * 마커 클릭 핸들러
   * 마커를 클릭했을 때 상세정보 바텀시트를 표시합니다.
   */
  const handleMarkerPress = useCallback((placeId: string, lat?: number, lng?: number) => {
    // 선택된 장소 정보 찾기
    const selectedPlace = allMarkers.find(marker => marker.placeId === placeId);
    if (selectedPlace) {
      // infowindow 닫기
      setShowInfoWindow(false);
      
      // 상세정보 바텀시트 열기
      setSelectedPlaceId(placeId);
      setShowPlaceDetail(true);
      setBottomSheetOpen(true);
      
      // 지도 중심 이동 (바텀시트가 열려있을 때는 위로 조정)
      if (bottomSheetOpen && bottomSheetHeight) {
        const { height: SCREEN_HEIGHT } = Dimensions.get('window');
        const heightRatio = bottomSheetHeight / SCREEN_HEIGHT;
        const baseOffset = -0.002;
        const zoomFactor = Math.max(0.5, Math.min(2.0, heightRatio * 3));
        const offsetLat = baseOffset * zoomFactor;
        
        setMapCenter({ 
          latitude: selectedPlace.lat + offsetLat, 
          longitude: selectedPlace.lng 
        });
      } else {
        setMapCenter({ latitude: selectedPlace.lat, longitude: selectedPlace.lng });
      }
    }
  }, [allMarkers, setSelectedPlaceId, setShowPlaceDetail, setBottomSheetOpen, bottomSheetOpen, bottomSheetHeight, setMapCenter, setShowInfoWindow]);

  // 길찾기 연동 함수
  const handleSetRouteLocation = useCallback((type: 'departure' | 'arrival', placeInfo: SearchResult) => {
    // InfoWindow에서 선택된 장소 정보를 길찾기 탭으로 전달
    // 이 함수는 KakaoMap에서 호출될 예정
    console.log('Route location set:', type, placeInfo);
  }, []);

  // 로딩 및 에러 상태 계산
  const isLoading = locationLoading || searchLoading;
  const errorMsg = (locationError || searchError) ? String(locationError || searchError) : null;

  const markers = useMemo(() => {
    // 사용자 위치 마커는 항상 표시 (location이 있을 때)
    const userLocationMarker = location ? [{
      placeId: "user-location",
      placeName: "내 위치",
      lat: location.latitude,
      lng: location.longitude,
      markerType: "userLocation",
    }] : [];
    
    console.log('마커 생성:', {
      hasLocation: !!location,
      location: location,
      userLocationMarker: userLocationMarker,
      allMarkersCount: allMarkers.length,
      totalMarkers: userLocationMarker.length + allMarkers.length
    });
    
    return [
      ...userLocationMarker,
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
    ];
  }, [location, allMarkers, selectedPlaceId]);

  // 플랫폼에 따라 적절한 레이아웃 렌더링
  if (Platform.OS === 'web') {
    return (
      <HomeWebLayout
        selectedPlaceId={selectedPlaceId}
        setSelectedPlaceId={setSelectedPlaceId}
        showInfoWindow={showInfoWindow}
        setShowInfoWindow={setShowInfoWindow}
        selectedMarkerPosition={selectedMarkerPosition}
        location={location}
        mapCenter={mapCenter}
        setMapCenter={setMapCenter}
        onMapIdle={handleMapIdle}
        markers={markers}
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
        routeResult={routeResult}
        isRouteLoading={isRouteLoading}
        routeError={routeError}
        startRoute={startRoute}
        clearRoute={clearRoute}
        showSearchInAreaButton={showSearchInAreaButton}
        handleSearchInArea={handleSearchInArea}
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
        markers={markers}
        bottomSheetOpen={bottomSheetOpen}
        setBottomSheetOpen={setBottomSheetOpen}
        bottomSheetHeight={bottomSheetHeight}
        setBottomSheetHeight={setBottomSheetHeight}
        showPlaceDetail={showPlaceDetail}
        setShowPlaceDetail={setShowPlaceDetail}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchResults={searchResults}
        allMarkers={allMarkers}
        isLoading={isLoading}
        errorMsg={errorMsg}
        onSearch={handleSearch}
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
        routeResult={routeResult}
        isRouteLoading={isRouteLoading}
        routeError={routeError}
        startRoute={startRoute}
        clearRoute={clearRoute}
        showSearchInAreaButton={showSearchInAreaButton}
        handleSearchInArea={handleSearchInArea}
      />
    );
  }
}