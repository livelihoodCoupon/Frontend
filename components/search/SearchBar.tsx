import React from 'react';
import { TextInput, TouchableOpacity, Text, View, Platform } from 'react-native';
import { mobileStyles } from './styles/SearchBar.mobile.styles';
import { webStyles } from './styles/SearchBar.web.styles';
import { Ionicons } from '@expo/vector-icons'; // Import Ionicons

interface SearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSearch: () => void;
  onClearSearch: () => void; // New prop for clearing search
}

const SearchBar: React.FC<SearchBarProps> = ({ searchQuery, setSearchQuery, onSearch, onClearSearch }) => {
  const styles = Platform.OS === 'web' ? webStyles : mobileStyles;

  return (
    <View style={styles.searchContainer}>
      <TextInput
        style={styles.searchInput}
        placeholder="장소를 입력하세요..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        onSubmitEditing={onSearch}
        returnKeyType="search"
      />
      {searchQuery.length > 0 && ( // Conditionally render clear button
        <TouchableOpacity style={styles.clearButton} onPress={onClearSearch}>
          <Ionicons name="close-circle" size={24} color="#B9B9B9" />
        </TouchableOpacity>
      )}
      <TouchableOpacity style={styles.searchButton} onPress={onSearch}>
        <Text style={styles.searchButtonText}>검색</Text>
      </TouchableOpacity>
    </View>
  );
};

export default SearchBar;
