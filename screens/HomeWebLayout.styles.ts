import { StyleSheet } from "react-native";

// 웹용 스타일 정의
export const webStyles = StyleSheet.create({
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
  recentlyViewedButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: '#3690FF', // Base blue color
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#3690FF', // Match background color
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  recentlyViewedButtonText: {
    fontSize: 14,
    color: '#F8FAFE', // Text on blue color
    fontWeight: '500',
  },
});
