import { StyleSheet } from "react-native";

export const webStyles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    paddingTop: 0,
    paddingHorizontal: 0, // Keep padding 0 for web
  },
  suggestionsContainer: {
    top: 65, // Adjusted from 60
    left: 16,
    right: 16,
  },
  transportModeButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 4,
    backgroundColor: 'rgba(248, 250, 254, 0.2)', // 반투명 배경
    borderWidth: 1,
    borderColor: '#F8FAFE',
    minWidth: 45,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transportModeButtonSelected: {
    backgroundColor: '#F8FAFE',
    borderColor: '#F8FAFE',
    borderWidth: 2,
  },
});
