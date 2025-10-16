import { StyleSheet } from "react-native";

export const webStyles = StyleSheet.create({
  // 웹 전용 스타일을 여기에 추가하세요.
  feeInfoContainer: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  feeInfoText: { // Base style for feeInfo text
    fontSize: 12,
    fontWeight: 'bold',
  },
  feeInfoPaidBackground: {
    backgroundColor: '#F8D7DA',
  },
  feeInfoPaidText: {
    color: '#DC3545',
  },
  feeInfoFreeBackground: {
    backgroundColor: '#D4EDDA',
  },
  feeInfoFreeText: {
    color: '#28A745',
  },
  feeInfoMixedBackground: {
    backgroundColor: '#CCE5FF',
  },
  feeInfoMixedText: {
    color: '#007BFF',
  },
  feeInfoDefaultBackground: {
    backgroundColor: '#E2E6EA',
  },
  feeInfoDefaultText: {
    color: '#6C757D',
  },
});
