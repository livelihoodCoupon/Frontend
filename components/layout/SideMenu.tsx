import React from 'react';
import {
  View,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSharedSearch } from '../../hooks/useSharedSearch';
import SharedSearch from '../search/SharedSearch';
import { SearchResult, SearchOptions } from '../../types/search';
import { PageResponse } from '../../types/api';

interface SideMenuProps {
  isOpen: boolean;
  searchResults: SearchResult[];
  allMarkers: SearchResult[];
  onSelectResult: (item: SearchResult) => void;
  isLoading: boolean;
  errorMsg?: string | null;
  onToggle: () => void;
  style: any;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSearch: () => void;
  searchOptions: SearchOptions;
  setSearchOptions: (options: Partial<SearchOptions>) => void;
  loadingNextPage: boolean;
  loadingAllMarkers: boolean;
  markerCountReachedLimit: boolean;
  onNextPage: () => void;
  pagination: Omit<PageResponse<any>, 'content'> | null;
  onSetRouteLocation?: (type: 'departure' | 'arrival', placeInfo: SearchResult) => void;
  onOpenSidebar?: () => void;
  routeResult?: any;
  isRouteLoading?: boolean;
  routeError?: string | null;
  startRoute?: any;
  clearRoute?: () => void;
}

const SideMenu: React.FC<SideMenuProps> = (props) => {
  const { isOpen, onToggle, style } = props;

  const sharedSearchProps = useSharedSearch(
    props.routeResult,
    props.isRouteLoading,
    props.routeError,
    props.startRoute,
    props.clearRoute,
    props.onOpenSidebar || props.onToggle
  );

  return (
    <Animated.View style={[styles.sideMenuContainer, style]}>
      <TouchableOpacity onPress={onToggle} style={styles.toggleButton}>
        <Ionicons name={isOpen ? "chevron-back" : "chevron-forward"} size={24} color="#495057" />
      </TouchableOpacity>
      <SharedSearch
        isWebView={true}
        {...props}
        {...sharedSearchProps}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  sideMenuContainer: {
    width: 350,
    backgroundColor: '#f8f9fa',
    padding: 16,
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 10,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 5, height: 0 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
      },
      android: {
        elevation: 15,
      },
      web: {
        boxShadow: '5px 0px 6px rgba(0,0,0,0.25)',
      }
    })
  },
  toggleButton: {
    position: 'absolute',
    top: '50%',
    right: -30,
    width: 30,
    height: 60,
    backgroundColor: '#f8f9fa',
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderColor: '#dee2e6',
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 3, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 10,
      },
      web: {
        boxShadow: '3px 2px 4px rgba(0,0,0,0.2)',
      }
    })
  },
});

export default React.memo(SideMenu);
