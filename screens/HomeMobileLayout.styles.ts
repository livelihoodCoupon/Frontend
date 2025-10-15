import { StyleSheet } from "react-native";

export const mobileStyles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
    backgroundColor: "white",
  },
  loadingIndicator: {
    marginVertical: 10,
  },
  errorText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
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
  mapFullScreen: {
    flex: 1,
    width: "100%",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f0f0", // Add a background color for visibility
  },
  currentLocationButton: {
    position: 'absolute',
    bottom: 80, // 기본값, 동적으로 조정됨
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  searchInAreaButton: {
    position: 'absolute',
    bottom: 120, // 기본값, 동적으로 조정됨
    alignSelf: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    zIndex: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 3,
  },
  searchInAreaButtonText: {
    color: '#007bff',
    fontWeight: 'bold',
  },
  routeResultContainer: {
    position: 'absolute',
    bottom: 120,
    left: 80,
    right: 80,
    zIndex: 1000,
  },
  routeSummaryCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  routeSummaryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeSummaryStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  routeSummaryStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  routeSummaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  routeSummaryLabel: {
    fontSize: 12,
    color: '#666',
  },
});
