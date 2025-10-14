import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SearchResult } from '../../types/search';
import { COLORS } from '../../constants/colors';

// 거리 포맷팅 함수
const formatDistance = (distance: number) => {
  if (distance < 1000) {
    return `${Math.round(distance)}m`;
  }
  return `${(distance / 1000).toFixed(1)}km`;
};

interface RouteSearchPanelProps {
  isVisible: boolean;
  onClose: () => void;
  onTransportModeChange: (mode: string) => void;
  selectedTransportMode: string;
  startLocation: string;
  setStartLocation: (location: string) => void;
  endLocation: string;
  setEndLocation: (location: string) => void;
  startLocationResults: SearchResult[];
  endLocationResults: SearchResult[];
  onStartLocationSelect: (result: SearchResult) => void;
  onEndLocationSelect: (result: SearchResult) => void;
  setStartLocationResults: (results: SearchResult[]) => void;
  setEndLocationResults: (results: SearchResult[]) => void;
  onStartRoute: () => void;
  isRouteLoading: boolean;
  startLocationSearching?: boolean;
  endLocationSearching?: boolean;
  onStartLocationSearch?: () => void;
  onEndLocationSearch?: () => void;
}

const RouteSearchPanel: React.FC<RouteSearchPanelProps> = ({
  isVisible,
  onClose,
  onTransportModeChange,
  selectedTransportMode,
  startLocation,
  setStartLocation,
  endLocation,
  setEndLocation,
  startLocationResults,
  endLocationResults,
  onStartLocationSelect,
  onEndLocationSelect,
  setStartLocationResults,
  setEndLocationResults,
  onStartRoute,
  isRouteLoading,
  startLocationSearching = false,
  endLocationSearching = false,
  onStartLocationSearch,
  onEndLocationSearch,
}) => {
  if (!isVisible) return null;

  const transportModes = [
    { id: 'driving', icon: 'car-outline', label: '자동차' },
    { id: 'transit', icon: 'bus-outline', label: '대중교통' },
    { id: 'walking', icon: 'walk-outline', label: '도보' },
    { id: 'cycling', icon: 'bicycle-outline', label: '자전거' },
  ];

  // 유효한 경로인지 확인하는 함수
  const isValidRoute = () => {
    // 출발지가 "내 위치"이거나 검색 결과에 있는 경우
    const isValidStart = startLocation === '내 위치' || 
      startLocationResults.some(result => result.placeName === startLocation);
    
    // 목적지가 검색 결과에 있는 경우
    const isValidEnd = endLocationResults.some(result => result.placeName === endLocation);
    
    return isValidStart && isValidEnd && startLocation && endLocation;
  };

  return (
    <View style={styles.container}>

      {/* 교통수단 선택 */}
      <View style={styles.transportContainer}>
        <View style={styles.transportButtons}>
          {transportModes.map((mode) => (
            <TouchableOpacity
              key={mode.id}
              style={[
                styles.transportButton,
                selectedTransportMode === mode.id && styles.transportButtonSelected
              ]}
              onPress={() => onTransportModeChange(mode.id)}
            >
              <Ionicons 
                name={mode.icon as any} 
                size={20} 
                color={selectedTransportMode === mode.id ? '#fff' : '#666'} 
              />
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={20} color="#666" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 출발지/목적지 입력 */}
      <View style={styles.inputContainer}>
        <View style={styles.locationInput}>
          <TextInput
            style={styles.input}
            value={startLocation}
            onChangeText={setStartLocation}
            placeholder="출발지"
            placeholderTextColor="#999"
            onSubmitEditing={onStartLocationSearch}
            returnKeyType="search"
          />
          <TouchableOpacity 
            style={styles.inputButton}
            onPress={() => {
              setStartLocation('내 위치');
              setStartLocationResults([]);
            }}
          >
            <Ionicons name="locate" size={16} color="#007bff" />
          </TouchableOpacity>
        </View>

        <View style={styles.locationInput}>
          <TextInput
            style={styles.input}
            value={endLocation}
            onChangeText={setEndLocation}
            placeholder="목적지"
            placeholderTextColor="#999"
            onSubmitEditing={onEndLocationSearch}
            returnKeyType="search"
          />
          <TouchableOpacity 
            style={styles.inputButton}
            onPress={() => {
              const temp = startLocation;
              setStartLocation(endLocation);
              setEndLocation(temp);
              // 검색 결과도 교체
              const tempResults = startLocationResults;
              setStartLocationResults(endLocationResults);
              setEndLocationResults(tempResults);
            }}
          >
            <Ionicons name="swap-vertical" size={16} color="#666" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 검색 결과 */}
      <ScrollView style={styles.resultsContainer} showsVerticalScrollIndicator={false}>
        {startLocationSearching && startLocationResults.length > 0 && (
          <View style={styles.resultsSection}>
            {startLocationResults.map((result, index) => (
              <TouchableOpacity
                key={index}
                style={styles.resultItem}
                onPress={() => onStartLocationSelect(result)}
              >
                <Ionicons name="location" size={16} color="#007bff" />
                <View style={styles.resultContent}>
                  <Text style={styles.resultName}>{result.placeName}</Text>
                  <Text style={styles.resultAddress}>{result.roadAddress}</Text>
                </View>
                <Text style={styles.resultDistance}>{formatDistance(result.distance)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {endLocationSearching && endLocationResults.length > 0 && (
          <View style={styles.resultsSection}>
            {endLocationResults.map((result, index) => (
              <TouchableOpacity
                key={index}
                style={styles.resultItem}
                onPress={() => onEndLocationSelect(result)}
              >
                <Ionicons name="location" size={16} color="#dc3545" />
                <View style={styles.resultContent}>
                  <Text style={styles.resultName}>{result.placeName}</Text>
                  <Text style={styles.resultAddress}>{result.roadAddress}</Text>
                </View>
                <Text style={styles.resultDistance}>{formatDistance(result.distance)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* 길찾기 시작 버튼 */}
        {isValidRoute() && (
          <TouchableOpacity
            style={[styles.routeButton, isRouteLoading && styles.routeButtonDisabled]}
            onPress={onStartRoute}
            disabled={isRouteLoading}
          >
            <Ionicons name="navigate" size={20} color="white" />
            <Text style={styles.routeButtonText}>
              {isRouteLoading ? '길찾기 중...' : '길찾기 시작'}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    zIndex: 1000,
    marginBottom: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  transportContainer: {
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingHorizontal: 24,
    paddingBottom: 12,
  },
  transportButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  transportButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  transportButtonSelected: {
    backgroundColor: '#007bff',
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
  },
  inputContainer: {
    paddingHorizontal: 24,
    paddingBottom: 2,
  },
  locationInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 4,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  inputButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultsContainer: {
    maxHeight: 250,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 16,
  },
  resultsSection: {
    marginBottom: 8,
  },
  resultsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 10,
    marginBottom: 6,
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  resultContent: {
    flex: 1,
  },
  resultName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  resultAddress: {
    fontSize: 12,
    color: '#666',
  },
  resultDistance: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  routeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007bff',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 16,
    gap: 8,
  },
  routeButtonDisabled: {
    backgroundColor: '#ccc',
  },
  routeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  noResultsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 8,
  },
  noResultsText: {
    fontSize: 14,
    color: '#999',
  },
});

export default RouteSearchPanel;
