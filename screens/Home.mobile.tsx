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
import HomeMobileLayout from "./HomeMobileLayout";
import { SearchResult } from "../types/search";
import { CATEGORIES } from "../constants/categories";
import { useBottomSheetHeight } from "../utils/bottomSheetUtils";
import { useMarkerManager } from "../utils/markerUtils";

/**
 * Home 컴포넌트
 * 앱의 메인 화면으로, 지도와 검색 기능을 제공합니다.
 * 웹과 모바일 플랫폼에 따라 다른 레이아웃을 렌더링합니다.
 */
export default function HomeMobile() {
    // 전역 상태 관리
    const selectedPlaceId = usePlaceStore((s) => s.selectedPlaceId);
    const setSelectedPlaceId = usePlaceStore((s) => s.setSelectedPlaceId);
    const showInfoWindow = usePlaceStore((s) => s.showInfoWindow);
    const setShowInfoWindow = usePlaceStore((s) => s.setShowInfoWindow);
    const selectedMarkerPosition = usePlaceStore((s) => s.selectedMarkerPosition);
    const setSelectedMarkerPosition = usePlaceStore((s) => s.setSelectedMarkerPosition);
    
    // 탭 상태 관리
    const [activeTab, setActiveTab] = useState<'search' | 'parking'>('search');
    
    // activeTab 변경 감지
    useEffect(() => {
        console.log('🔄 activeTab 변경됨:', activeTab);
    }, [activeTab]);
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
        pagination,
        fetchAllMarkers,
    } = useSearch();

    // 위치 에러 또는 위치 정보가 없을 때 검색 옵션을 정확순으로 변경
    useEffect(() => {
        const hasLocationError = locationError !== null;
        const hasNoLocation = !location;
        const isDistanceSort = searchOptions.sort === 'distance';

        if ((hasLocationError || hasNoLocation) && isDistanceSort) {
            setSearchOptions({ sort: 'accuracy' });
        }
    }, [locationError, location, searchOptions.sort, setSearchOptions]);

    // 위치 정보가 정상적으로 가져와질 때 거리순으로 변경
    useEffect(() => {
        const hasLocation = location && !locationError;
        const isAccuracySort = searchOptions.sort === 'accuracy';

        if (hasLocation && isAccuracySort) {
            setSearchOptions({ sort: 'distance' });
        }
    }, [location, locationError, searchOptions.sort, setSearchOptions]);


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

    // 검색 중심 좌표 저장 (검색 시 사용된 중심점)
    const [searchCenter, setSearchCenter] = useState<{
        latitude: number;
        longitude: number;
    } | null>(null);

    // 지도 중심 좌표 상태
    const [mapCenter, setMapCenterState] = useState<{
        latitude: number;
        longitude: number;
    } | null>(null);

    // 지도 중심 설정 함수 (store에도 동기화)
    const setMapCenter = useCallback((center: { latitude: number; longitude: number } | null) => {

        if (center) {
            setMapCenterState(center);
            setMapCenterToStore(center);
        } else {
            setMapCenterState(null);
            setMapCenterToStore(null);
        }
    }, [setMapCenterToStore, mapCenter]);

    const clearSearchResults = useCallback(() => {
        clearSearchResultsFromHook(); // useSearch 훅의 clearSearchResults 호출
    }, [clearSearchResultsFromHook]);

    // 홈화면으로 돌아왔을 때 마커들을 제거 (바텀시트가 완전히 사라졌을 때)
    // 바텀시트 높이로 구분: 0 = 완전히 사라짐, > 0 = 접힘 상태
    useEffect(() => {

        if (!bottomSheetOpen && bottomSheetHeight === 0 && allMarkers.length > 0) {
            clearSearchResults(); // 홈 화면에서 마커 제거
        } else {
        }
    }, [bottomSheetOpen, bottomSheetHeight, allMarkers.length]);

    // 지도 중심과 검색 중심 비교하여 "현재위치에서 검색" 버튼 표시
    useEffect(() => {
        // 상세 정보 모드에서도 버튼이 보이도록 수정
        if (searchCenter && mapCenter && searchResults && searchResults.length > 0 && (bottomSheetOpen || bottomSheetHeight > 0)) {
            const latDiff = Math.abs(mapCenter.latitude - searchCenter.latitude);
            const lngDiff = Math.abs(mapCenter.longitude - searchCenter.longitude);
            const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);

            // 거리가 0.001도 이상 차이나면 버튼 표시 (약 100m)
            const shouldShowButton = distance > 0.001;
            setShowSearchInAreaButton(shouldShowButton);
        } else {
            setShowSearchInAreaButton(false);
        }
    }, [searchCenter, mapCenter, searchResults?.length, bottomSheetOpen, bottomSheetHeight, showPlaceDetail]);

    // 현재 위치가 로드되면 지도 중심을 설정 (초기 로딩 시에만)
    useEffect(() => {
        if (location && !mapCenter) {
            setMapCenter({ latitude: location.latitude, longitude: location.longitude });
        }
    }, [location, mapCenter]);

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

        // 검색 시작 시 이전 선택 상태 초기화
        setSelectedPlaceId(null);
        setShowInfoWindow(false);
        setSelectedMarkerPosition(null);

        if (!mapCenter) {
            alert("지도 중심 정보를 가져오는 중입니다. 잠시 후 다시 시도해주세요.");
            return;
        }
        if (!location) {
            alert("현재 위치 정보를 가져오는 중입니다. 잠시 후 다시 시도해주세요.");
            return;
        }
        await performSearch(mapCenter.latitude, mapCenter.longitude, location.latitude, location.longitude);

        // 검색 중심 좌표 저장
        setSearchCenter({ latitude: mapCenter.latitude, longitude: mapCenter.longitude });

        setBottomSheetOpen(true); // 검색 후 하단 시트 열기
    }, [mapCenter, location, performSearch, setSelectedPlaceId, setShowInfoWindow, setSelectedMarkerPosition]);

    // 검색어를 직접 전달하는 검색 함수 (useSearch 훅 사용)
    const performSearchWithQuery = useCallback(async (query: string, latitude: number, longitude: number, userLatitude: number, userLongitude: number) => {
        // 검색어 설정
        setSearchQuery(query);
        
        // 검색어를 직접 전달하여 검색 실행
        await performSearch(latitude, longitude, userLatitude, userLongitude, query);
    }, [performSearch, setSearchQuery]);

    // 카테고리 검색을 위한 함수
    const handleCategorySearch = useCallback(async (categoryName: string) => {

        Keyboard.dismiss();
        setShowSearchInAreaButton(false);

        // 검색 시작 시 이전 선택 상태 초기화
        setSelectedPlaceId(null);
        setShowInfoWindow(false);
        setSelectedMarkerPosition(null);

        // 지도 중심이 없으면 기본값 사용 (서울시청)
        const searchLatitude = mapCenter?.latitude || 37.5665;
        const searchLongitude = mapCenter?.longitude || 126.9780;

        // 현재 위치가 없으면 지도 중심을 사용 (정확도순 검색)
        const userLatitude = location?.latitude || searchLatitude;
        const userLongitude = location?.longitude || searchLongitude;


        // 직접 검색 실행 (검색어를 직접 전달)
        await performSearchWithQuery(categoryName, searchLatitude, searchLongitude, userLatitude, userLongitude);

        // 검색 중심 좌표 저장
        setSearchCenter({ latitude: searchLatitude, longitude: searchLongitude });

        setBottomSheetOpen(true); // 검색 후 하단 시트 열기
    }, [mapCenter, location, performSearchWithQuery, setSelectedPlaceId, setShowInfoWindow, setSelectedMarkerPosition, setSearchQuery]);

    const handleSearchInArea = useCallback(async (currentMapCenter?: { latitude: number; longitude: number }, selectedCategory?: string) => {
        const actualMapCenter = currentMapCenter || mapCenter;
        if (!actualMapCenter) return;
        if (!location) {
            alert("현재 위치 정보를 가져오는 중입니다. 잠시 후 다시 시도해주세요.");
            return;
        }

        // 현재 지도에서 검색 버튼 클릭

        // 검색 시작 시 이전 선택 상태 초기화
        setSelectedPlaceId(null);
        setShowInfoWindow(false);
        setSelectedMarkerPosition(null);

        // 지도 중심 위치를 기준으로 검색을 수행 (실제 현재 위치가 아닌 지도 중심)
        // 현재 선택된 카테고리가 있으면 해당 카테고리로 검색, 없으면 기본 검색
        // "현재 지도에서 검색"이므로 userLat, userLng에도 현재 지도 중심 좌표를 사용
        if (selectedCategory) {
            const category = CATEGORIES.find(cat => cat.id === selectedCategory);
            if (category) {
                await performSearchWithQuery(category.name, actualMapCenter.latitude, actualMapCenter.longitude, actualMapCenter.latitude, actualMapCenter.longitude);
            }
        } else {
            // 카테고리가 선택되지 않은 경우 기본 검색 (빈 검색어로)
            await performSearchWithQuery('', actualMapCenter.latitude, actualMapCenter.longitude, actualMapCenter.latitude, actualMapCenter.longitude);
        }

        // 검색 중심 좌표 업데이트 (실제 현재 지도 중심으로)
        setSearchCenter({ latitude: actualMapCenter.latitude, longitude: actualMapCenter.longitude });

        // 지도 중심을 실제 현재 지도 중심으로 설정 (검색 결과가 현재 위치에 표시되도록)
        setMapCenter({ latitude: actualMapCenter.latitude, longitude: actualMapCenter.longitude });

        setBottomSheetOpen(true); // 검색 후 하단 시트 열기
    }, [location, performSearchWithQuery, setSelectedPlaceId, setShowInfoWindow, setSelectedMarkerPosition, searchCenter, setSearchCenter, setMapCenter, setBottomSheetOpen]);

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
    const { calculateMapCenterOffset } = useBottomSheetHeight();
    const { convertSearchResultsToMarkers } = useMarkerManager();

    const handleSelectResult = useCallback((item: SearchResult) => {
        // 바텀시트가 열려있을 때 지도 중심 조정
        if (bottomSheetOpen && bottomSheetHeight) {
            const offsetLat = calculateMapCenterOffset(bottomSheetHeight);

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
        // 바텀시트는 유지하고 선택된 결과만 업데이트
    }, [bottomSheetOpen, bottomSheetHeight, setSelectedPlaceId, setShowInfoWindow]);

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
    }, []);

    // 로딩 및 에러 상태 계산 (메모이제이션)
    const isLoading = useMemo(() => locationLoading || searchLoading, [locationLoading, searchLoading]);
    const errorMsg = useMemo(() =>
            (locationError || searchError) ? String(locationError || searchError) : null,
        [locationError, searchError]
    );

    const markers = useMemo(() => {
        return convertSearchResultsToMarkers(allMarkers, selectedPlaceId, location || undefined);
    }, [location, allMarkers, selectedPlaceId]);

    // 플랫폼에 따라 적절한 레이아웃 렌더링
        return (
            <HomeMobileLayout
                selectedPlaceId={selectedPlaceId}
                setSelectedPlaceId={setSelectedPlaceId}
                showInfoWindow={showInfoWindow}
                setShowInfoWindow={setShowInfoWindow}
                selectedMarkerPosition={selectedMarkerPosition}
                setSelectedMarkerPosition={setSelectedMarkerPosition}
                location={location}
                mapCenter={mapCenter}
                setMapCenter={setMapCenter}
                onMapIdle={(latitude: number, longitude: number) => {
                    // 새로운 지도 중심 설정
                    setMapCenter({ latitude, longitude });
                }}
                markers={markers}
                bottomSheetOpen={bottomSheetOpen}
                setBottomSheetOpen={setBottomSheetOpen}
                bottomSheetHeight={bottomSheetHeight}
                setBottomSheetHeight={setBottomSheetHeight}
                showPlaceDetail={showPlaceDetail}
                setShowPlaceDetail={setShowPlaceDetail}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                searchResults={searchResults}
                allMarkers={allMarkers}
                isLoading={isLoading}
                errorMsg={errorMsg}
                onSearch={handleSearch}
                onSelectResult={handleSelectResult}
                onMarkerPress={handleMarkerPress}
                searchOptions={searchOptions}
                setSearchOptions={setSearchOptions}
                locationError={locationError}
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
                handleCategorySearch={handleCategorySearch}
                searchCenter={searchCenter}
                setSearchCenter={setSearchCenter}
                clearSearchResults={clearSearchResults}
            />
        );
    }
