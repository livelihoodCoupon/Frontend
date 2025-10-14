import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity, // Add this import
  Dimensions,
  Platform,
  BackHandler,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context'; // Change this import
import { Ionicons } from '@expo/vector-icons'; // Add this import
import KakaoMap from "../components/KakaoMap";
import RouteBottomSheet from "../components/search/RouteBottomSheet";
import RouteSearchPanel from "../components/search/RouteSearchPanel";
import FloatingSearchBar from "../components/search/FloatingSearchBar";
// CurrentLocationButton import 제거
import RouteResultComponent from "../components/route/RouteResult";
import { SearchResult, SearchOptions } from "../types/search";
import { PageResponse } from "../types/api";
import { RouteResult } from "../types/route";
import { mobileStyles } from "./HomeMobileLayout.styles";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CATEGORIES } from "../constants/categories";

interface HomeMobileLayoutProps {
  // Props for HomeMobileLayout
  selectedPlaceId: string | null;
  setSelectedPlaceId: (id: string | null) => void;
  showInfoWindow: boolean;
  setShowInfoWindow: (show: boolean) => void;
  selectedMarkerPosition: { lat: number; lng: number } | null;
  location: { latitude: number; longitude: number } | null;
  mapCenter: { latitude: number; longitude: number } | null;
  setMapCenter: (center: { latitude: number; longitude: number } | null) => void;
  onMapIdle: (lat: number, lng: number) => void;
  markers: any[]; // Adjust type as needed
  bottomSheetOpen: boolean;
  setBottomSheetOpen: (isOpen: boolean) => void;
  bottomSheetHeight: number;
  setBottomSheetHeight: (height: number) => void;
  showPlaceDetail: boolean;
  setShowPlaceDetail: (show: boolean) => void;
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

const HomeMobileLayout: React.FC<HomeMobileLayoutProps> = ({
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
  bottomSheetOpen,
  setBottomSheetOpen,
  bottomSheetHeight,
  setBottomSheetHeight,
  showPlaceDetail,
  setShowPlaceDetail,
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
  const insets = useSafeAreaInsets();
  const { height: SCREEN_HEIGHT } = Dimensions.get('window');
  
  // 바텀시트 높이 계산
  const USABLE_SCREEN_HEIGHT = SCREEN_HEIGHT - insets.bottom;
  const BOTTOM_SHEET_HEIGHT = USABLE_SCREEN_HEIGHT * 0.6; // 50%에서 60%로 증가
  
  // 길찾기 모드 상태
  const [isRouteMode, setIsRouteMode] = useState(false);
  const [selectedTransportMode, setSelectedTransportMode] = useState('driving');
  const [showRouteDetail, setShowRouteDetail] = useState(false);
  const [startLocation, setStartLocation] = useState('내 위치');
  const [endLocation, setEndLocation] = useState('');
  const [startLocationResults, setStartLocationResults] = useState<SearchResult[]>([]);
  const [endLocationResults, setEndLocationResults] = useState<SearchResult[]>([]);
  const [startLocationSearching, setStartLocationSearching] = useState(false);
  const [endLocationSearching, setEndLocationSearching] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<string[]>([]);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [selectedSearchResult, setSelectedSearchResult] = useState<SearchResult | null>(null);

  // 디바운싱을 위한 타이머 ref들
  const startLocationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const endLocationTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (startLocationTimerRef.current) {
        clearTimeout(startLocationTimerRef.current);
      }
      if (endLocationTimerRef.current) {
        clearTimeout(endLocationTimerRef.current);
      }
    };
  }, []);

  // 검색 포커스 핸들러
  const handleSearchFocus = () => {
    setIsSearchFocused(true);
  };

  // 검색 블러 핸들러
  const handleSearchBlur = () => {
    setIsSearchFocused(false);
    setShowAutocomplete(false);
  };

  // 자동완성 제안 가져오기
  const fetchAutocompleteSuggestions = async (query: string) => {
    if (query.length < 2) {
      setAutocompleteSuggestions([]);
      setShowAutocomplete(false);
      return;
    }

    try {
      const { getAutocompleteSuggestions } = await import('../services/searchApi');
      const suggestions = await getAutocompleteSuggestions(query);
      const suggestionTexts = suggestions.map(s => s.word);
      setAutocompleteSuggestions(suggestionTexts);
      setShowAutocomplete(true);
    } catch (error) {
      setAutocompleteSuggestions([]);
      setShowAutocomplete(false);
    }
  };

  // 자동완성 제안 선택 핸들러
  const handleSuggestionSelect = (suggestion: string) => {
    setSearchQuery(suggestion);
    setShowAutocomplete(false);
    setHasSearched(true);
    setIsSearchFocused(false);
    onSearch();
  };

  // 검색어 변경 시 자동완성 제안 가져오기
  useEffect(() => {
    if (searchQuery && isSearchFocused && !hasSearched) {
      const timeoutId = setTimeout(() => {
        fetchAutocompleteSuggestions(searchQuery);
      }, 300); // 300ms 디바운스

      return () => clearTimeout(timeoutId);
    } else {
      setShowAutocomplete(false);
    }
  }, [searchQuery, isSearchFocused, hasSearched]);


  // 자동 축소 기능 제거 - 현재 위치가 지도 중심이 되도록 유지
  
  // 바텀시트 높이 설정
  useEffect(() => {
    if (bottomSheetOpen) {
      setBottomSheetHeight(BOTTOM_SHEET_HEIGHT);
    } else {
      setBottomSheetHeight(0);
    }
  }, [bottomSheetOpen, BOTTOM_SHEET_HEIGHT, setBottomSheetHeight]);

  // 바텀시트 상태 로그
  useEffect(() => {
  }, [bottomSheetOpen, BOTTOM_SHEET_HEIGHT, SCREEN_HEIGHT, USABLE_SCREEN_HEIGHT, insets.bottom]);
  

  // 뒤로가기 버튼 처리
  useEffect(() => {
    const backAction = () => {
      if (showPlaceDetail) {
        setShowPlaceDetail(false);
        return true; // 이벤트 소비
      }
      if (isRouteMode) {
        handleCloseRouteMode();
        return true; // 이벤트 소비
      }
      return false; // 기본 동작 허용
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => backHandler.remove();
  }, [isRouteMode, showPlaceDetail]);

  

  // 지도 레벨 초기화 상태
  const [resetMapLevel, setResetMapLevel] = useState(false);

  // 길찾기 모드 관련 함수들
  const handleRoutePress = () => {
    // 바텀시트 닫기
    setBottomSheetOpen(false);
    setShowPlaceDetail(false);
    setIsRouteMode(true);
  };

  const handleCloseRouteMode = () => {
    setIsRouteMode(false);
    setStartLocation(''); // 출발지를 비워둠
    setEndLocation('');
    setStartLocationResults([]);
    setEndLocationResults([]);
  };

  const handleTransportModeChange = (mode: string) => {
    setSelectedTransportMode(mode);
  };

  const handleStartLocationChange = (text: string) => {
    setStartLocation(text);
    
    // 기존 타이머 클리어
    if (startLocationTimerRef.current) {
      clearTimeout(startLocationTimerRef.current);
    }
    
    // 2글자 이상이고 "내 위치"가 아닌 경우 디바운싱 적용
    if (text.length >= 2 && text.trim() !== '내 위치') {
      startLocationTimerRef.current = setTimeout(async () => {
        try {
          // 실제 검색 API 호출
          const { searchPlaces } = await import('../services/searchApi');
          if (location) {
            const searchResults = await searchPlaces(
              text,
              location.latitude,
              location.longitude,
              3000, // radius
              'distance', // sort
              1, // page
              location.latitude, // userLat
              location.longitude // userLng
            );
            setStartLocationResults(searchResults.content);
            setStartLocationSearching(true);
          }
        } catch (error) {
          console.error('출발지 자동검색 오류:', error);
          setStartLocationResults([]);
          setStartLocationSearching(false);
        }
      }, 500); // 500ms 디바운싱
    } else {
      setStartLocationResults([]);
      setStartLocationSearching(false);
    }
  };

  // 검색 쿼리 변경 시 카테고리 선택 초기화 및 자동 검색
  useEffect(() => {
    if (searchQuery && !selectedCategory) {
      // 검색 쿼리가 변경되고 카테고리가 선택되지 않은 경우
      // (사용자가 직접 검색한 경우)
      setSelectedCategory('');
    }
    
    // 카테고리 선택 시 자동 검색 실행
    if (searchQuery && selectedCategory && hasSearched) {
      onSearch();
    }
  }, [searchQuery, selectedCategory, hasSearched]);

  // Android 뒤로가기 버튼 처리
  useEffect(() => {
    const backAction = () => {
      if (isSearchFocused) {
        // 검색 포커스가 있으면 포커스 해제하고 검색어도 지움
        setIsSearchFocused(false);
        setShowAutocomplete(false);
        setSearchQuery(''); // 검색어 지우기
        return true; // 이벤트 처리됨
      }
      if (hasSearched) {
        handleCloseSearch();
        return true; // 이벤트 처리됨
      }
      if (isRouteMode) {
        handleCloseRouteMode();
        return true; // 이벤트 처리됨
      }
      return false; // 기본 뒤로가기 동작
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [isSearchFocused, hasSearched, isRouteMode]);

  // 검색 실행 함수 (UI 상태만 관리)
  const handleSearch = async () => {
    setHasSearched(true);
    
    // 길찾기 모드가 아닐 때만 바텀시트 열기
    if (!isRouteMode) {
      setBottomSheetOpen(true); // 검색 시 바텀시트 열기
    } else {
    }
    
    await onSearch();
    // 자동 축소 기능 제거 - 현재 위치 중심 유지
  };

  // 자동 축소 기능 제거됨

  // 검색 결과 닫기 함수
  const handleCloseSearch = () => {
    setHasSearched(false);
    setSearchQuery('');
    setSelectedCategory('');
    setShowAutocomplete(false);
    setSelectedSearchResult(null); // 선택된 결과 초기화
    setBottomSheetOpen(false); // 검색 닫을 때 바텀시트도 닫기
  };

  const handleStartLocationSearch = async () => {
    if (startLocation.length >= 2) {
      try {
        // 실제 검색 API 호출
        const { searchPlaces } = await import('../services/searchApi');
        if (location) {
          const searchResults = await searchPlaces(
            startLocation,
            location.latitude,
            location.longitude,
            3000, // radius
            'distance', // sort
            1, // page
            location.latitude, // userLat
            location.longitude // userLng
          );
          setStartLocationResults(searchResults.content);
          setStartLocationSearching(true);
        }
      } catch (error) {
        console.error('출발지 검색 오류:', error);
        setStartLocationResults([]);
        setStartLocationSearching(false);
      }
    }
  };

  const handleEndLocationChange = (text: string) => {
    setEndLocation(text);
    
    // 기존 타이머 클리어
    if (endLocationTimerRef.current) {
      clearTimeout(endLocationTimerRef.current);
    }
    
    // 2글자 이상인 경우 디바운싱 적용
    if (text.length >= 2) {
      endLocationTimerRef.current = setTimeout(async () => {
        try {
          // 실제 검색 API 호출
          const { searchPlaces } = await import('../services/searchApi');
          if (location) {
            const searchResults = await searchPlaces(
              text,
              location.latitude,
              location.longitude,
              3000, // radius
              'distance', // sort
              1, // page
              location.latitude, // userLat
              location.longitude // userLng
            );
            setEndLocationResults(searchResults.content);
            setEndLocationSearching(true);
          }
        } catch (error) {
          console.error('목적지 자동검색 오류:', error);
          setEndLocationResults([]);
          setEndLocationSearching(false);
        }
      }, 500); // 500ms 디바운싱
    } else {
      setEndLocationResults([]);
      setEndLocationSearching(false);
    }
  };

  const handleEndLocationSearch = async () => {
    if (endLocation.length >= 2) {
      try {
        // 실제 검색 API 호출
        const { searchPlaces } = await import('../services/searchApi');
        if (location) {
          const searchResults = await searchPlaces(
            endLocation,
            location.latitude,
            location.longitude,
            3000, // radius
            'distance', // sort
            1, // page
            location.latitude, // userLat
            location.longitude // userLng
          );
          setEndLocationResults(searchResults.content);
          setEndLocationSearching(true);
        }
      } catch (error) {
        console.error('목적지 검색 오류:', error);
        setEndLocationResults([]);
        setEndLocationSearching(false);
      }
    }
  };

  const handleStartLocationSelect = (result: SearchResult) => {
    setStartLocation(result.placeName);
    setStartLocationResults([]);
    
    // 출발지 선택 시 목적지가 이미 설정되어 있으면 바로 길찾기 실행
    if (endLocation && endLocation !== '내 위치') {
      // 목적지 데이터 찾기
      const endLocationData = endLocationResults.find(r => r.placeName === endLocation);
      if (endLocationData && startRoute) {
        startRoute({
          startLocation: result,
          endLocation: endLocationData,
          transportMode: selectedTransportMode as any,
          userLocation: location
        });
      }
    }
  };

  const handleEndLocationSelect = (result: SearchResult) => {
    setEndLocation(result.placeName);
    setEndLocationResults([]);
    
    // 목적지 선택 시 출발지가 이미 설정되어 있으면 바로 길찾기 실행
    if (startLocation && startLocation !== '내 위치') {
      // 출발지 데이터 찾기
      const startLocationData = startLocationResults.find(r => r.placeName === startLocation);
      if (startLocationData && startRoute) {
        startRoute(startLocationData, result);
      }
    } else if (startLocation === '내 위치') {
      if (startRoute) {
        startRoute({
          startLocation: '내 위치',
          endLocation: result,
          transportMode: selectedTransportMode as any,
          userLocation: location
        });
      }
    }
  };

  // 출발지와 목적지가 모두 설정되면 자동으로 길찾기 실행
  useEffect(() => {
    
    if (startLocation && endLocation && endLocation !== '내 위치') {
      // 출발지와 목적지가 모두 설정된 경우 자동 실행
      const startLocationData = startLocationResults.find(r => r.placeName === startLocation);
      const endLocationData = endLocationResults.find(r => r.placeName === endLocation);
      
      
      // 출발지가 "내 위치"이거나 검색 결과에서 찾은 경우, 목적지가 검색 결과에서 찾거나 텍스트로 입력된 경우
      if ((startLocation === '내 위치' || startLocationData) && (endLocationData || endLocation.trim())) {
        handleStartRoute();
      } else {
      }
    }
  }, [startLocation, endLocation, startLocationResults, endLocationResults, startLocationSearching, endLocationSearching]);

  const handleStartRoute = () => {
    if (!endLocation) return;
    
    
    // 출발지가 비어있으면 "내 위치"로 처리
    const startLocationData = (!startLocation || startLocation === '내 위치') ? {
      placeId: 'current_location',
      placeName: '내 위치',
      lat: location?.latitude || 0,
      lng: location?.longitude || 0,
      roadAddress: '현재 위치',
      lotAddress: '',
      phone: '',
      categoryGroupName: '내 위치',
      placeUrl: '',
      distance: 0,
      roadAddressDong: ''
    } : startLocationResults.find(r => r.placeName === startLocation);

    const endLocationData = endLocationResults.find(r => r.placeName === endLocation);
    

    if (startLocationData && endLocationData && startRoute) {
      startRoute({
        startLocation: startLocationData,
        endLocation: endLocationData,
        transportMode: selectedTransportMode as any,
        userLocation: location
      });
    } else {
    }
  };

  // 하드웨어 뒤로가기 버튼 처리
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (showRouteDetail) {
        setShowRouteDetail(false);
        setIsRouteMode(true); // 길찾기 모드로 돌아가기
        return true;
      }
      if (showPlaceDetail) {
        setShowPlaceDetail(false);
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, [showRouteDetail, showPlaceDetail, setShowPlaceDetail]);

  return (
    <SafeAreaView style={mobileStyles.safeAreaContainer}>
      {/* 플로팅 검색 바 - 상세 경로 안내 모드일 때는 숨김 */}
      {!showRouteDetail && (
        <FloatingSearchBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSearch={handleSearch}
        onRoutePress={handleRoutePress}
        selectedCategory={selectedCategory}
        onCategorySelect={(categoryId) => {
          // 카테고리 선택 처리
          const category = CATEGORIES.find(cat => cat.id === categoryId);
          if (category) {
            setSearchQuery(category.name);
            setSelectedCategory(categoryId);
            setHasSearched(true);
          }
        }}
        isLoading={isLoading}
        isSearchFocused={isSearchFocused}
        onSearchFocus={handleSearchFocus}
        onSearchBlur={handleSearchBlur}
        autocompleteSuggestions={autocompleteSuggestions}
        onSuggestionSelect={handleSuggestionSelect}
        showAutocomplete={showAutocomplete}
      />
      )}

      {/* 길찾기 패널 - 상세 경로 안내 모드일 때는 숨김 */}
      {!showRouteDetail && (
        <RouteSearchPanel
        isVisible={isRouteMode}
        onClose={handleCloseRouteMode}
        onTransportModeChange={handleTransportModeChange}
        selectedTransportMode={selectedTransportMode}
        startLocation={startLocation}
        setStartLocation={handleStartLocationChange}
        endLocation={endLocation}
        setEndLocation={handleEndLocationChange}
        startLocationResults={startLocationResults}
        endLocationResults={endLocationResults}
        onStartLocationSelect={handleStartLocationSelect}
        onEndLocationSelect={handleEndLocationSelect}
        setStartLocationResults={setStartLocationResults}
        setEndLocationResults={setEndLocationResults}
        onStartRoute={handleStartRoute}
        isRouteLoading={isRouteLoading || false}
        startLocationSearching={startLocationSearching}
        endLocationSearching={endLocationSearching}
        onStartLocationSearch={handleStartLocationSearch}
        onEndLocationSearch={handleEndLocationSearch}
      />
      )}

      {/* 길찾기 결과 요약 카드 */}
      {isRouteMode && routeResult && !showRouteDetail && (
        <View style={[mobileStyles.routeResultContainer, { zIndex: 1002 }]}>
          <TouchableOpacity 
            style={[mobileStyles.routeSummaryCard, mobileStyles.routeSummaryContent]}
            onPress={() => {
              setShowRouteDetail(true);
              setIsRouteMode(false); // 길찾기 모드창 닫기
            }}
          >
            <View style={mobileStyles.routeSummaryStats}>
              <View style={mobileStyles.routeSummaryStat}>
                <Ionicons name="walk-outline" size={20} color="#28a745" />
                <Text style={mobileStyles.routeSummaryValue}>
                  {routeResult.totalDistance >= 1000 
                    ? `${(routeResult.totalDistance / 1000).toFixed(1)}km` 
                    : `${Math.round(routeResult.totalDistance)}m`}
                </Text>
                <Text style={mobileStyles.routeSummaryLabel}>거리</Text>
              </View>
              
              <View style={mobileStyles.routeSummaryStat}>
                <Ionicons name="time-outline" size={20} color="#ffc107" />
                <Text style={mobileStyles.routeSummaryValue}>
                  {Math.round(routeResult.totalDuration / 60)}분
                </Text>
                <Text style={mobileStyles.routeSummaryLabel}>소요시간</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      )}

      {errorMsg && (
        <View style={mobileStyles.errorContainer}>
          <Text style={mobileStyles.errorText}>{errorMsg}</Text>
          <TouchableOpacity 
            style={{ padding: 5 }}
            onPress={() => {
              // 오류 메시지 닫기 (임시 해결책)
            }}
          >
            <Ionicons name="close" size={20} color="white" />
          </TouchableOpacity>
        </View>
      )}

      {/* 길찾기 상세 안내 바텀시트 */}
      {showRouteDetail && routeResult && (
        <RouteBottomSheet
          isOpen={true}
          isRouteDetailMode={true}
          onToggle={() => {
            setShowRouteDetail(false);
            setIsRouteMode(true); // 길찾기 모드로 돌아가기
          }}
          allMarkers={allMarkers}
          onSelectResult={(result) => {
            setSelectedSearchResult(result);
            onSelectResult(result);
          }}
          onSetRouteLocation={onSetRouteLocation}
          routeResult={routeResult}
          isRouteLoading={isRouteLoading}
          routeError={routeError}
          startRoute={startRoute}
          clearRoute={clearRoute}
          hasSearched={hasSearched}
          searchResults={searchResults}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          onSearch={handleSearch}
          isLoading={isLoading}
          selectedPlaceId={selectedPlaceId}
          showPlaceDetail={false}
          setShowPlaceDetail={() => {}}
          onRoutePress={handleRoutePress}
          onSetStartLocation={(location) => {
            setStartLocation(location);
            setShowRouteDetail(false);
            setIsRouteMode(true);
          }}
          onSetEndLocation={(location) => {
            setEndLocation(location);
            setShowRouteDetail(false);
            setIsRouteMode(true);
          }}
        />
      )}

      {/* 길찾기 모드가 아닐 때만 바텀시트 표시 */}
      {!isRouteMode && !showRouteDetail && (
        <RouteBottomSheet
          isOpen={bottomSheetOpen}
          onToggle={() => {
            setBottomSheetOpen(!bottomSheetOpen);
          }}
        allMarkers={allMarkers}
        onSelectResult={(result) => {
          setSelectedSearchResult(result);
          onSelectResult(result);
        }}
        onSetRouteLocation={onSetRouteLocation}
        routeResult={routeResult}
        isRouteLoading={isRouteLoading}
        routeError={routeError}
        startRoute={startRoute}
        clearRoute={clearRoute}
        // 검색 관련 props 추가
        hasSearched={hasSearched}
        searchResults={searchResults}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        onSearch={handleSearch}
        isLoading={isLoading}
        onCloseSearch={handleCloseSearch}
        selectedSearchResult={selectedSearchResult}
        bottomSheetHeight={bottomSheetHeight}
        showPlaceDetail={showPlaceDetail}
        setShowPlaceDetail={setShowPlaceDetail}
        selectedPlaceId={selectedPlaceId}
        onRoutePress={handleRoutePress}
        onSetStartLocation={setStartLocation}
        onSetEndLocation={setEndLocation}
      />
      )}

      {/* 좌측하단 현재 위치 버튼 제거 */}

      {bottomSheetOpen && (
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: insets.bottom, backgroundColor: 'white', zIndex: 9 }} />
      )}

      <KakaoMap
        latitude={mapCenter?.latitude ?? 37.5665}
        longitude={mapCenter?.longitude ?? 126.9780}
            style={[mobileStyles.mapFullScreen, { zIndex: 1001 }] as any}
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
            resetMapLevel={resetMapLevel}
            onResetMapLevelComplete={() => setResetMapLevel(false)}
            onGetCurrentMapCenter={() => {
              console.log('🔥 KakaoMap에서 현재 지도 중심 가져오기 요청됨');
              
              // WebView에서 현재 지도 중심 가져오기
              const script = `
                console.log('🔥 WebView에서 현재 지도 중심 가져오기 시작');
                const center = map.getCenter();
                console.log('🔥 WebView 현재 지도 중심:', center.getLat(), center.getLng());
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'get_current_map_center',
                  latitude: center.getLat(),
                  longitude: center.getLng()
                }));
                console.log('🔥 WebView 메시지 전송 완료');
                true;
              `;
              
              // WebView 스크립트 주입 (실제 구현 필요)
              console.log('🔥 WebView 스크립트 주입 준비:', script);
            }}
          />
      {showSearchInAreaButton && (
        <TouchableOpacity
          style={mobileStyles.searchInAreaButton}
          onPress={handleSearchInArea}
        >
          <Text style={mobileStyles.searchInAreaButtonText}>현재 지도에서 검색</Text>
        </TouchableOpacity>
      )}
      {location && (
            <TouchableOpacity 
              style={mobileStyles.currentLocationButton}
              onPress={() => {
                if (location && mapCenter) {
                  const latDiff = mapCenter.latitude - location.latitude;
                  const lngDiff = mapCenter.longitude - location.longitude;
                  const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111000;
                  
                  if (distance > 100) {
                    setMapCenter(location);
                  } else {
                    setResetMapLevel(true);
                  }
                } else {
                  setMapCenter(location);
                }
              }}
              onLongPress={() => {
                if (location) {
                  setMapCenter(location);
                  setResetMapLevel(true);
                }
              }}>
              <Ionicons name="locate" size={20} color="#3690FF" />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

export default HomeMobileLayout;
