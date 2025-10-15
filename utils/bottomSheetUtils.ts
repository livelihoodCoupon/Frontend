import { Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { UI_CONSTANTS } from '../constants/uiConstants';

/**
 * 바텀시트 높이 계산 유틸리티
 */
export class BottomSheetHeightCalculator {
  private static screenHeight = Dimensions.get('window').height;
  private static insets = { bottom: 0 };

  /**
   * 화면 정보 업데이트 (컴포넌트에서 호출)
   */
  static updateScreenInfo(insets: { bottom: number }) {
    this.insets = insets;
    this.screenHeight = Dimensions.get('window').height;
  }

  /**
   * 사용 가능한 화면 높이 계산
   */
  static getUsableScreenHeight(): number {
    return this.screenHeight - this.insets.bottom;
  }

  /**
   * 바텀시트 타입별 높이 계산
   */
  static calculateHeight(
    type: 'closed' | 'normal' | 'placeDetail' | 'routeDetail',
    isOpen: boolean = true
  ): number {
    const usableHeight = this.getUsableScreenHeight();
    
    if (!isOpen || type === 'closed') {
      return UI_CONSTANTS.bottomSheet.closedHeight;
    }

    switch (type) {
      case 'placeDetail':
        return usableHeight * UI_CONSTANTS.screenRatio.placeDetail;
      case 'routeDetail':
        return usableHeight * UI_CONSTANTS.screenRatio.routeDetail;
      case 'normal':
      default:
        return usableHeight * UI_CONSTANTS.screenRatio.bottomSheet;
    }
  }

  /**
   * 바텀시트 높이에 따른 위치 계산 (버튼 위치 등)
   */
  static calculateButtonPosition(
    bottomSheetHeight: number,
    basePosition: number = 100,
    type: 'normal' | 'placeDetail' | 'routeDetail' = 'normal'
  ): number {
    let heightMultiplier = 0.85;
    
    switch (type) {
      case 'placeDetail':
        heightMultiplier = 0.6;
        break;
      case 'routeDetail':
        heightMultiplier = 0.8;
        break;
    }
    
    return basePosition + bottomSheetHeight * heightMultiplier;
  }

  /**
   * 지도 중심 조정을 위한 오프셋 계산
   */
  static calculateMapCenterOffset(
    bottomSheetHeight: number,
    screenHeight: number = this.screenHeight
  ): number {
    const heightRatio = bottomSheetHeight / screenHeight;
    const baseOffset = -0.002;
    const zoomFactor = Math.max(0.5, Math.min(2.0, heightRatio * 3));
    const zoomLevelOffset = heightRatio > 0.5 ? 0.002 : 0;
    
    return baseOffset * zoomFactor + zoomLevelOffset;
  }
}

/**
 * 바텀시트 높이 계산 훅
 */
export const useBottomSheetHeight = () => {
  const insets = useSafeAreaInsets();
  
  // 화면 정보 업데이트
  BottomSheetHeightCalculator.updateScreenInfo(insets);
  
  return {
    calculateHeight: BottomSheetHeightCalculator.calculateHeight.bind(BottomSheetHeightCalculator),
    calculateButtonPosition: BottomSheetHeightCalculator.calculateButtonPosition.bind(BottomSheetHeightCalculator),
    calculateMapCenterOffset: BottomSheetHeightCalculator.calculateMapCenterOffset.bind(BottomSheetHeightCalculator),
  };
};
