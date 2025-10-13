import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  TextInput,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SearchBar from './SearchBar';
import SearchOptionsComponent from './SearchOptionsComponent';
import SearchResultItem from './SearchResultItem';
import RouteResultComponent from '../route/RouteResult';
import { SearchResult, SearchOptions, AutocompleteResponse } from '../../types/search';
import { PageResponse } from '../../types/api';

interface SharedSearchProps {
  isWebView: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSearch: () => void;
  searchResults: SearchResult[];
  allMarkers: SearchResult[];
  isLoading: boolean;
  errorMsg?: string | null;
  onSelectResult: (item: SearchResult) => void;
  searchOptions: SearchOptions;
  setSearchOptions: (options: Partial<SearchOptions>) => void;
  loadingNextPage: boolean;
  loadingAllMarkers: boolean;
  markerCountReachedLimit: boolean;
  onNextPage: () => void;
  pagination: Omit<PageResponse<any>, 'content'> | null;

  // from useSharedSearch hook
  activeTab: 'search' | 'route';
  setActiveTab: (tab: 'search' | 'route') => void;
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
  autocompleteSuggestions: AutocompleteResponse[];
  showAutocomplete: boolean;
  setShowAutocomplete: (show: boolean) => void;
  debouncedAutocomplete: (query: string) => void;
  debouncedSearchStartLocation: (query: string) => void;
  debouncedSearchEndLocation: (query: string) => void;
  handleTextEdit: () => void;
  startRoute: any;
  isRouteLoading: boolean;
  routeResult: any;
  routeError: string | null;
  clearRoute: () => void;
  searchLocation: { lat: number; lng: number };
  location: { latitude: number; longitude: number } | null;
}

const SharedSearch: React.FC<SharedSearchProps> = ({
  isWebView,
  searchQuery,
  setSearchQuery,
  onSearch,
  searchResults,
  allMarkers,
  isLoading,
  errorMsg,
  onSelectResult,
  searchOptions,
  setSearchOptions,
  loadingNextPage,
  loadingAllMarkers,
  markerCountReachedLimit,
  onNextPage,
  pagination,
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
  startRoute,
  isRouteLoading,
  routeResult,
  routeError,
  clearRoute,
  searchLocation,
  location
}) => {
  const routeScrollViewRef = useRef<ScrollView>(null);

  const handleLocalSearch = () => {
    onSearch();
    setShowAutocomplete(false);
  };

  const renderFooter = () => {
    if (!loadingNextPage || !pagination || pagination.isLast || pagination.currentPage >= pagination.totalPages) {
      return null;
    }
    return <ActivityIndicator style={{ paddingVertical: 20 }} size="large" color="#007bff" />;
  };

  const renderContent = () => {
    if (isLoading) {
      return <ActivityIndicator size="large" color="#007bff" style={{ marginTop: 20 }} />;
    }
    if (errorMsg) {
      return <Text style={styles.errorText}>{String(errorMsg)}</Text>;
    }
    if (searchResults.length > 0) {
      return (
        <FlatList
          data={searchResults}
          keyExtractor={(item) => item.placeId}
          renderItem={({ item }) => <SearchResultItem item={item} onPress={onSelectResult} />}
          onEndReached={onNextPage}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
        />
      );
    }
    return <Text style={styles.noResultText}>검색 결과가 없거나, 검색을 시작하세요.</Text>;
  };

  return (
    <View style={[styles.contentContainer, isWebView && styles.contentContainerWeb]}>
      <View style={styles.tabHeader}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'search' && styles.activeTabButton]}
          onPress={() => setActiveTab('search')}
        >
          <Ionicons name="search-outline" size={20} color={activeTab === 'search' ? '#007bff' : '#6c757d'} />
          <Text style={[styles.tabButtonText, activeTab === 'search' && styles.activeTabButtonText]}>검색</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'route' && styles.activeTabButton]}
          onPress={() => setActiveTab('route')}
        >
          <Ionicons name="navigate-outline" size={20} color={activeTab === 'route' ? '#007bff' : '#6c757d'} />
          <Text style={[styles.tabButtonText, activeTab === 'route' && styles.activeTabButtonText]}>길찾기</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'search' ? (
        <View style={styles.searchTabContent}>
          <SearchBar
            searchQuery={searchQuery}
            setSearchQuery={(text) => {
              setSearchQuery(text);
              debouncedAutocomplete(text);
            }}
            onSearch={handleLocalSearch}
          />
          {showAutocomplete && autocompleteSuggestions.length > 0 && (
            <View style={styles.suggestionsContainer}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowAutocomplete(false)}
              >
                <Ionicons name="close" size={24} color="black" />
              </TouchableOpacity>
              <FlatList
                data={autocompleteSuggestions}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.suggestionItem}
                    onPress={() => {
                      setSearchQuery(item.word);
                      setShowAutocomplete(false);
                    }}
                  >
                    <Text>{item.word}</Text>
                  </TouchableOpacity>
                )}
                style={styles.suggestionsList}
              />
            </View>
          )}
          <SearchOptionsComponent searchOptions={searchOptions} setSearchOptions={setSearchOptions} />
          {pagination && searchResults.length > 0 && (
            <View style={styles.resultCountContainer}>
              <Text style={styles.resultCountText}>총 {pagination.totalElements}개 결과</Text>
              {loadingAllMarkers && (
                <Text style={styles.markerStatusText}>
                  (전체 마커 로딩중...)
                </Text>
              )}
              {markerCountReachedLimit && (
                <Text style={styles.markerStatusText}>
                  (지도에 {allMarkers.length}개만 표시)
                </Text>
              )}
            </View>
          )}
          {renderContent()}
        </View>
      ) : (
        <ScrollView
          ref={routeScrollViewRef}
          style={styles.routeTabContent}
          contentContainerStyle={styles.routeTabScrollContent}
          showsVerticalScrollIndicator={true}
          nestedScrollEnabled={true}
        >
          <View style={styles.transportModeWrapper}>
            <View style={styles.transportModeContainer}>
              <TouchableOpacity
                style={[
                  styles.transportModeButton,
                  selectedTransportMode === 'driving' && styles.transportModeButtonSelected
                ]}
                onPress={() => {
                  handleTextEdit();
                  setSelectedTransportMode('driving');
                }}
              >
                <Ionicons
                  name="car-outline"
                  size={20}
                  color={selectedTransportMode === 'driving' ? '#007bff' : '#666'}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.transportModeButton,
                  styles.transportModeButtonDisabled, // 대중교통 미구현
                  selectedTransportMode === 'transit' && styles.transportModeButtonSelected
                ]}
                onPress={() => {
                  console.log('대중교통 모드는 아직 구현되지 않았습니다.');
                }}
                disabled={true}
              >
                <Ionicons
                  name="bus-outline"
                  size={20}
                  color="#ccc"
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.transportModeButton,
                  selectedTransportMode === 'walking' && styles.transportModeButtonSelected
                ]}
                onPress={() => {
                  handleTextEdit();
                  setSelectedTransportMode('walking');
                }}
              >
                <Ionicons
                  name="walk-outline"
                  size={20}
                  color={selectedTransportMode === 'walking' ? '#007bff' : '#666'}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.transportModeButton,
                  selectedTransportMode === 'cycling' && styles.transportModeButtonSelected
                ]}
                onPress={() => {
                  handleTextEdit();
                  setSelectedTransportMode('cycling');
                }}
              >
                <Ionicons
                  name="bicycle-outline"
                  size={20}
                  color={selectedTransportMode === 'cycling' ? '#007bff' : '#666'}
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.routeInputsContainer}>
            <View style={styles.routeInputContainer}>
              <View style={styles.routeInputWrapper}>
                <TextInput
                  style={styles.routeTextInput}
                  placeholder="출발지를 입력하세요"
                  value={startLocation}
                  onChangeText={(text) => {
                    handleTextEdit();
                    setStartLocation(text);
                    debouncedSearchStartLocation(text);
                  }}
                  onFocus={handleTextEdit}
                  selectionColor="transparent"
                  underlineColorAndroid="transparent"
                />
                {isSearchingStart && (
                  <ActivityIndicator size="small" color="#007bff" style={styles.searchIndicator} />
                )}
              </View>

              <TouchableOpacity
                style={[
                  styles.currentLocationButton,
                  !location && styles.currentLocationButtonDisabled
                ]}
                onPress={() => {
                  if (location) {
                    handleTextEdit();
                    setStartLocation('내 위치');
                    setShowStartResults(false);
                  }
                }}
                disabled={!location}
              >
                <Ionicons
                  name="compass-outline"
                  size={16}
                  color={location ? "#007bff" : "#ccc"}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.routeInputContainer}>
              <View style={styles.routeInputWrapper}>
                <TextInput
                  style={styles.routeTextInput}
                  placeholder="도착지를 입력하세요"
                  value={endLocation}
                  onChangeText={(text) => {
                    handleTextEdit();
                    setEndLocation(text);
                    debouncedSearchEndLocation(text);
                  }}
                  onFocus={handleTextEdit}
                  selectionColor="transparent"
                  underlineColorAndroid="transparent"
                />
                {isSearchingEnd && (
                  <ActivityIndicator size="small" color="#007bff" style={styles.searchIndicator} />
                )}
              </View>

              <TouchableOpacity
                style={styles.swapButton}
                onPress={() => {
                  const tempStart = startLocation;
                  const tempEnd = endLocation;
                  if (tempStart === '내 위치') {
                    setStartLocation(tempEnd);
                    setEndLocation('내 위치');
                  } else {
                    setStartLocation(tempEnd);
                    setEndLocation(tempStart);
                  }
                  handleTextEdit();
                }}
              >
                <Ionicons name="swap-vertical-outline" size={16} color="#666" />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.routeButton,
              (!endLocation.trim() || isRouteLoading || !!routeResult) && styles.routeButtonDisabled
            ]}
            disabled={!endLocation.trim() || isRouteLoading || !!routeResult}
            onPress={async () => {
              try {
                if (!endLocation.trim()) {
                  alert('도착지를 입력해주세요.');
                  return;
                }

                let startLocationData: SearchResult | string;
                if (typeof startLocation === 'string' && startLocation.trim() === '내 위치') {
                  startLocationData = '내 위치';
                } else if (typeof startLocation === 'string') {
                  let foundStartLocation = startLocationResults.find(item =>
                    item.placeName === startLocation ||
                    item.placeName.includes(startLocation) ||
                    startLocation.includes(item.placeName)
                  );
                  if (!foundStartLocation) {
                    foundStartLocation = endLocationResults.find(item =>
                      item.placeName === startLocation ||
                      item.placeName.includes(startLocation) ||
                      startLocation.includes(item.placeName)
                    );
                  }
                  if (!foundStartLocation) {
                    alert('출발지 정보를 찾을 수 없습니다. 다시 검색해주세요.');
                    return;
                  }
                  startLocationData = foundStartLocation;
                } else {
                  startLocationData = startLocation;
                }

                let endLocationData: SearchResult | null = null;
                if (endLocation.trim() === '내 위치') {
                  if (!location) {
                    alert('현재 위치 정보를 가져올 수 없습니다.');
                    return;
                  }
                  endLocationData = {
                    placeId: 'current-location',
                    placeName: '내 위치',
                    lat: location.latitude,
                    lng: location.longitude,
                    roadAddress: '내 위치',
                    lotAddress: '',
                    phone: '',
                    categoryGroupName: '',
                    placeUrl: '',
                    distance: 0
                  };
                } else {
                  endLocationData = endLocationResults.find(item => item.placeName === endLocation) || null;
                  if (!endLocationData) {
                    endLocationData = endLocationResults.find(item => item.placeName.includes(endLocation) || endLocation.includes(item.placeName)) || null;
                  }
                  if (!endLocationData) {
                    endLocationData = startLocationResults.find(item => item.placeName === endLocation) || null;
                  }
                  if (!endLocationData) {
                    endLocationData = startLocationResults.find(item => item.placeName.includes(endLocation) || endLocation.includes(item.placeName)) || null;
                  }
                  if (!endLocationData) {
                    alert('도착지 정보를 찾을 수 없습니다. 다시 검색해주세요.');
                    return;
                  }
                }

                await startRoute({
                  startLocation: startLocationData,
                  endLocation: endLocationData!,
                  transportMode: selectedTransportMode,
                  userLocation: searchLocation || undefined,
                });

              } catch (error: any) {
                alert(error.message || '길찾기 중 오류가 발생했습니다.');
              }
            }}
          >
            <Ionicons name="navigate-outline" size={20} color="#fff" />
            <Text style={styles.routeButtonText}>
              {isRouteLoading ? '길찾기 중...' : routeResult ? '길찾기 완료' : '길찾기 시작'}
            </Text>
          </TouchableOpacity>

          {showStartResults && (
            <View style={styles.searchResultsList}>
              <Text style={styles.searchResultsTitle}>출발지 검색 결과</Text>
              {startLocationResults.length > 0 ? (
                <ScrollView
                  style={styles.searchResultsScrollContainer}
                  showsVerticalScrollIndicator={false}
                >
                  {startLocationResults.map((item) => (
                    <TouchableOpacity
                      key={item.placeId}
                      style={styles.searchResultItem}
                      onPress={() => {
                        handleTextEdit();
                        setStartLocation(item.placeName);
                        setShowStartResults(false);
                      }}
                    >
                      <View style={styles.searchResultContent}>
                        <Text style={styles.searchResultTitle}>{item.placeName}</Text>
                        <Text style={styles.searchResultAddress}>{item.roadAddress}</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.departButton}
                        onPress={() => {
                          handleTextEdit();
                          setStartLocation(item.placeName);
                          setShowStartResults(false);
                        }}
                      >
                        <Text style={styles.departButtonText}>출발</Text>
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              ) : (
                <View style={styles.noResultsContainer}>
                  <Text style={styles.noResultsText}>검색 결과가 없습니다</Text>
                </View>
              )}
            </View>
          )}

          {showEndResults && (
            <View style={styles.searchResultsList}>
              <Text style={styles.searchResultsTitle}>목적지 검색 결과</Text>
              {endLocationResults.length > 0 ? (
                <ScrollView
                  style={styles.searchResultsScrollContainer}
                  showsVerticalScrollIndicator={false}
                >
                  {endLocationResults.map((item) => (
                    <TouchableOpacity
                      key={item.placeId}
                      style={styles.searchResultItem}
                      onPress={() => {
                        handleTextEdit();
                        setEndLocation(item.placeName);
                        setShowEndResults(false);
                      }}
                    >
                      <View style={styles.searchResultContent}>
                        <Text style={styles.searchResultTitle}>{item.placeName}</Text>
                        <Text style={styles.searchResultAddress}>{item.roadAddress}</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.departButton}
                        onPress={() => {
                          handleTextEdit();
                          setEndLocation(item.placeName);
                          setShowEndResults(false);
                        }}
                      >
                        <Text style={styles.departButtonText}>도착</Text>
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              ) : (
                <View style={styles.noResultsContainer}>
                  <Text style={styles.noResultsText}>검색 결과가 없습니다</Text>
                </View>
              )}
            </View>
          )}

          {routeError && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{routeError}</Text>
              <TouchableOpacity onPress={clearRoute} style={styles.errorCloseButton}>
                <Ionicons name="close-outline" size={16} color="#666" />
              </TouchableOpacity>
            </View>
          )}

          {routeResult && (
            <RouteResultComponent
              routeResult={routeResult}
              onClose={clearRoute}
            />
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    paddingTop: 40,
    paddingHorizontal: 16, // Restore padding for mobile
  },
  contentContainerWeb: {
    paddingTop: 0,
    paddingHorizontal: 0, // Keep padding 0 for web
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 14,
    flex: 1,
  },
  noResultText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#6c757d',
  },
  resultCountContainer: {
    alignItems: 'flex-end',
    marginBottom: 10,
    marginRight: 5,
  },
  resultCountText: {
    fontSize: 14,
    color: '#6c757d',
  },
  markerStatusText: {
    fontSize: 12,
    color: '#868e96',
    marginTop: 2,
  },
  tabHeader: {
    flexDirection: 'row',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#dee2e6',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabButton: {
    borderBottomColor: '#007bff',
  },
  tabButtonText: {
    marginLeft: 6,
    fontSize: 16,
    color: '#6c757d',
    fontWeight: '500',
  },
  activeTabButtonText: {
    color: '#007bff',
    fontWeight: '600',
  },
  searchTabContent: {
    flex: 1,
    paddingVertical: 20,
  },
  routeTabContent: {
    flex: 1,
  },
  routeTabScrollContent: {
    paddingVertical: 20,
    paddingBottom: 30,
    flexGrow: 1,
  },
  transportModeWrapper: {
    alignItems: 'center',
    marginBottom: 8,
  },
  transportModeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: -10,
    paddingHorizontal: 16,
    width: '100%',
  },
  transportModeButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 4,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
    minWidth: 45,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transportModeButtonSelected: {
    backgroundColor: '#e3f2fd',
    borderColor: '#007bff',
    borderWidth: 2,
  },
  transportModeButtonDisabled: {
    backgroundColor: '#f5f5f5',
    borderColor: '#e0e0e0',
    opacity: 0.6,
  },
  routeInputsContainer: {
    marginBottom: 16,
  },
  routeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  routeInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeTextInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 6,
    minHeight: 6,
  },
  searchIndicator: {
    position: 'absolute',
    right: 8,
    top: 8,
  },
  currentLocationButton: {
    padding: 4,
    marginLeft: 8,
  },
  currentLocationButtonDisabled: {
    opacity: 0.6,
  },
  swapButton: {
    padding: 4,
    marginLeft: 8,
  },
  routeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007bff',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 0,
    marginBottom: 16,
  },
  routeButtonDisabled: {
    backgroundColor: '#6c757d',
    opacity: 0.6,
  },
  routeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  searchResultsList: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    marginBottom: 12,
    marginTop: 8,
    paddingVertical: 8,
    maxHeight: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchResultsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  searchResultsScrollContainer: {
    maxHeight: 160,
  },
  noResultsContainer: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    margin: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderStyle: 'dashed',
  },
  noResultsText: {
    fontSize: 14,
    color: '#6c757d',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
    backgroundColor: '#fff',
  },
  searchResultContent: {
    flex: 1,
  },
  searchResultTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  searchResultAddress: {
    fontSize: 12,
    color: '#666',
  },
  departButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    marginLeft: 8,
    minWidth: 50,
    alignItems: 'center',
  },
  departButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  errorContainer: {
    backgroundColor: '#f8d7da',
    borderColor: '#f5c6cb',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorCloseButton: {
    padding: 4,
    marginLeft: 8,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 65,
    left: 0,
    right: 0,
    zIndex: 9999,
    backgroundColor: 'white',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  suggestionsContainerWeb: {
    top: 65, // Adjusted from 60
    left: 16,
    right: 16,
  },
  suggestionsList: {
    maxHeight: 200,
  },
  suggestionItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  closeButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    zIndex: 1,
  },
});

export default SharedSearch;
