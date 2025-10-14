import { StyleSheet } from 'react-native';

export const webStyles = StyleSheet.create({
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginRight: 8,
    backgroundColor: '#fff',
    color: '#B9B9B9',
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: '#F8FAFE',
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonText: {
    color: '#3690FF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  clearButton: {
    position: 'absolute',
    right: 70,
    top: 2,
    padding: 5,
  },
});
