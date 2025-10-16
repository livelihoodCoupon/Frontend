const debounce = <T extends (...args: any[]) => any>(func: T, delay: number) => {
  let timeout: NodeJS.Timeout;
  return function (this: ThisParameterType<T>, ...args: Parameters<T>) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), delay);
  };
};

import React, { useEffect, useMemo, useRef, useState, useCallback, forwardRef } from "react";
import { View, StyleSheet, Platform, ViewStyle, Text, Modal, TouchableOpacity, Alert } from "react-native";
import { WebView } from "react-native-webview";
import { KAKAO_MAP_JS_KEY } from "@env";
import { kakaoMapWebViewHtml } from './kakaoMapWebViewSource';
// import { useKakaoMapScript } from "../hooks/useKakaoMapScript"; // Not needed for mobile WebView

import { MarkerData, KakaoMapProps } from "../types/kakaoMap";
import { SearchResult } from "../types/search";
import { commonStyles as commonStyles } from "./KakaoMap.common.styles";

const styles = StyleSheet.create({
  ...commonStyles,
  webMapContainer: { // This might be a leftover from web, but keeping for now
    flex: 1,
    width: '100%',
    height: '100%',
  },
  webview: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});
import { MARKER_IMAGES, MARKER_CONFIG, getMarkerConfig, MAP_CONFIG } from "../constants/mapConstants";
// import { MarkerManager } from "../utils/markerUtils"; // Not directly used in this component

// 모바일 전용 카카오 맵 렌더링 로직 (WebView 사용)
const MobileKakaoMap = React.memo(forwardRef<any, KakaoMapProps>(({
  latitude,
  longitude,
  markers,
  routeResult,
  onMapIdle,
  onMarkerPress,
  style,
  resetMapLevel,
  onResetMapLevelComplete,
  onGetCurrentMapCenter,
}, ref) => {
  const webViewRef = useRef<WebView>(null);
  
  // ref를 webViewRef에 연결하고 onGetCurrentMapCenter 콜백도 노출
  React.useImperativeHandle(ref, () => ({
    ...webViewRef.current,
    getCurrentMapCenter: onGetCurrentMapCenter
  }));
  const updateTimeout = useRef<NodeJS.Timeout | null>(null);
  const [isMapApiReady, setIsMapApiReady] = useState(false);
  const [isMapInitialized, setIsMapInitialized] = useState(false);
  const [showRouteMenu, setShowRouteMenu] = useState(false);
  const [selectedPlaceInfo, setSelectedPlaceInfo] = useState<SearchResult | null>(null);

  const htmlContent = useMemo(() => {
    let content = kakaoMapWebViewHtml.replace(
      "KAKAO_MAP_JS_KEY_PLACEHOLDER",
      KAKAO_MAP_JS_KEY
    );
    content = content.replace("MARKER_IMAGE_USER_LOCATION_PLACEHOLDER", MARKER_IMAGES.USER_LOCATION);
    return content;
  }, [KAKAO_MAP_JS_KEY]);

  // Effect to update map center when latitude/longitude props change after initialization
  useEffect(() => {
    if (
      webViewRef.current &&
      htmlContent &&
      isMapInitialized &&
      latitude !== undefined &&
      longitude !== undefined &&
      !isNaN(latitude) &&
      !isNaN(longitude)
    ) {
      const script = `
        updateMapCenter(${latitude}, ${longitude});
        true;
      `;
      
      (webViewRef.current as any).latitude = latitude;
      (webViewRef.current as any).longitude = longitude;
      
      webViewRef.current.injectJavaScript(script);
    }
  }, [isMapInitialized, latitude, longitude]);

  // Effect for updating markers when markers prop changes (Debounced)
  useEffect(() => {
    if (updateTimeout.current) {
      clearTimeout(updateTimeout.current);
    }

    updateTimeout.current = setTimeout(() => {
      if (webViewRef.current && htmlContent && isMapInitialized) {
        const script = `updateMarkers(${JSON.stringify(markers || [])}); true;`;
        webViewRef.current.injectJavaScript(script);
      }
    }, 200); // 200ms debounce

    return () => {
      if (updateTimeout.current) {
        clearTimeout(updateTimeout.current);
      }
    };
  }, [markers, isMapInitialized]);

  // 경로 표시 Effect (모바일 WebView)
  useEffect(() => {
    console.log('🔍 KakaoMap.mobile.tsx 경로 표시 useEffect 실행');
    console.log('  - routeResult:', !!routeResult);
    console.log('  - isMapInitialized:', isMapInitialized);
    console.log('  - webViewRef.current:', !!webViewRef.current);
    
    if (webViewRef.current && isMapInitialized) {
      if (routeResult && routeResult.coordinates && routeResult.coordinates.length > 0) {
        console.log('🚗 모바일 경로 표시 시작:', routeResult);
        
        // 경로 표시 스크립트
        const script = `
          if (typeof drawRoute === 'function') {
            drawRoute(${JSON.stringify(routeResult)});
          } else {
            console.log('drawRoute 함수가 없습니다');
          }
          true;
        `;
        webViewRef.current.injectJavaScript(script);
      } else {
        console.log('🚫 경로 제거');
        // 경로 제거 스크립트
        const script = `
          if (typeof clearRoute === 'function') {
            clearRoute();
          }
          true;
        `;
        webViewRef.current.injectJavaScript(script);
      }
    }
  }, [routeResult, isMapInitialized]);

  // resetMapLevel prop 처리 (모바일 WebView)
  useEffect(() => {
    if (resetMapLevel && webViewRef.current && isMapInitialized) {
      const script = `
        if (typeof map !== 'undefined' && map) {
          map.setLevel(${MAP_CONFIG.CURRENT_LOCATION_LEVEL});
          
          // 지도 레벨 초기화 후 마커 다시 렌더링
          setTimeout(() => {
            if (typeof updateMarkers === 'function') {
              updateMarkers(${JSON.stringify(markers || [])});
            }
          }, 100);
        }
        true;
      `;
      
      webViewRef.current.injectJavaScript(script);
      
      if (onResetMapLevelComplete) {
        onResetMapLevelComplete();
      }
    }
  }, [resetMapLevel, isMapInitialized, onResetMapLevelComplete, markers]);

  if (!htmlContent) {
    return (
      <View style={styles.webview}>
        <Text>Loading map content...</Text>
      </View>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <WebView
        ref={webViewRef} // WebView에 ref 할당
        originWhitelist={["*"]}
        source={{ html: htmlContent }}
        style={[styles.webview, style]}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        onLoadEnd={() => {
          if (webViewRef.current && latitude !== undefined && longitude !== undefined) {
            // 카카오 맵 SDK 로드 및 지도 초기화 스크립트 주입
            const script = `
              if (typeof kakao !== 'undefined' && kakao.maps) {
                kakao.maps.load(function() {
                  initMap(${latitude}, ${longitude});
                  window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'map_api_ready' }));
                }, function(err) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', message: 'Kakao Maps SDK load failed: ' + err.message }));
                });
              } else {
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', message: 'Kakao Maps SDK not available' }));
              }
            `;
            webViewRef.current.injectJavaScript(script);
          }
        }}
        onError={(e) => console.error("WebView error: ", e.nativeEvent)} // WebView 오류 처리
        onMessage={(event) => { // WebView 메시지 처리
          try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === "map_idle") {
              if (onMapIdle) {
                onMapIdle(data.latitude, data.longitude);
              }
            }
            if (data.type === "marker_press" && onMarkerPress) {
              onMarkerPress(data.id);
            }
            if (data.type === 'map_api_ready') {
              setIsMapApiReady(true);
              setIsMapInitialized(true); // initMap 성공 후 초기화 완료로 설정
            }
            if (data.type === 'get_current_map_center_for_search') {
              console.log('=== WebView에서 메시지 수신 ===');
              console.log('받은 지도 중심:', data.latitude, data.longitude);
              // 현재 지도 중심을 가져와서 검색 함수에 전달
              if ((global as any).handleSearchInAreaWithCurrentCenter) {
                console.log('전역 함수 호출 시도');
                (global as any).handleSearchInAreaWithCurrentCenter({
                  latitude: data.latitude,
                  longitude: data.longitude
                });
              } else {
                console.log('전역 함수가 존재하지 않음');
              }
            }
            if (data.type === 'route_selected') {
              // 길찾기 버튼 클릭 시 처리
              
              // 전역 함수가 등록되어 있으면 호출
              if ((global as any).setRouteLocationFromInfoWindow) {
                const placeInfo: SearchResult = {
                  placeId: data.placeId,
                  placeName: data.placeName,
                  roadAddress: data.roadAddress || '',
                  lotAddress: data.lotAddress || '',
                  lat: data.latitude || 0,
                  lng: data.longitude || 0,
                  phone: data.phone || '',
                  categoryGroupName: data.category || '',
                  placeUrl: data.placeUrl || '',
                  distance: data.distance || 0,
                  roadAddressDong: ""
                };
                
                // 출발/도착 드롭다운 메뉴 표시
                setSelectedPlaceInfo(placeInfo);
                setShowRouteMenu(true);
              } else {
                console.warn('setRouteLocationFromInfoWindow 함수가 등록되지 않았습니다.');
              }
            }
            if (data.type === 'error') { // WebView 내부에서 발생한 에러 처리
              console.error('WebView internal error:', data.message);
            }
          } catch (e) {
            console.error("Failed to parse WebView message:", e);
          }
        }}
      />
      {/* 출발/도착 드롭다운 메뉴 */}
      <Modal
        visible={showRouteMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowRouteMenu(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.routeMenuContainer}>
            <Text style={styles.routeMenuTitle}>
              {selectedPlaceInfo?.placeName}
            </Text>
            <Text style={styles.routeMenuSubtitle}>
              길찾기 옵션을 선택하세요
            </Text>
            
            <TouchableOpacity
              style={styles.routeMenuButton}
              onPress={() => {
                if (selectedPlaceInfo && (global as any).setRouteLocationFromInfoWindow) {
                  (global as any).setRouteLocationFromInfoWindow('departure', selectedPlaceInfo);
                  setShowRouteMenu(false);
                }
              }}
            >
              <Text style={styles.routeMenuButtonText}>출발지로 설정</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.routeMenuButton}
              onPress={() => {
                if (selectedPlaceInfo && (global as any).setRouteLocationFromInfoWindow) {
                  (global as any).setRouteLocationFromInfoWindow('arrival', selectedPlaceInfo);
                  setShowRouteMenu(false);
                }
              }}
            >
              <Text style={styles.routeMenuButtonText}>도착지로 설정</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.routeMenuCancelButton}
              onPress={() => setShowRouteMenu(false)}
            >
              <Text style={styles.routeMenuCancelButtonText}>취소</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}));

export default MobileKakaoMap;
