import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { SearchResult } from '../../types/search';
import { Ionicons } from '@expo/vector-icons';
import { commonStyles } from './styles/SearchResultItem.common.styles';
import { webStyles } from './styles/SearchResultItem.web.styles';
import { mobileStyles } from './styles/SearchResultItem.mobile.styles';

interface Props {
  item: SearchResult;
  onPress: (item: SearchResult) => void;
}

// 거리를 km 단위로 변환하고 소수점 한 자리까지 표시하는 함수
const formatDistance = (distance: number) => {
  if (distance < 1000) {
    return `${Math.round(distance)}m`;
  }
  return `${(distance / 1000).toFixed(1)}km`;
};

const SearchResultItem: React.FC<Props> = ({ item, onPress }) => {
  const getFeeInfoStyle = (feeInfo: string) => {
    if (feeInfo.includes('유료')) {
      return { 
        container: webStyles.feeInfoPaidBackground, 
        text: webStyles.feeInfoPaidText 
      };
    }
    if (feeInfo.includes('무료')) {
      return { 
        container: webStyles.feeInfoFreeBackground, 
        text: webStyles.feeInfoFreeText 
      };
    }
    if (feeInfo.includes('혼합')) {
      return { 
        container: webStyles.feeInfoMixedBackground, 
        text: webStyles.feeInfoMixedText 
      };
    }
    return { 
      container: webStyles.feeInfoDefaultBackground, 
      text: webStyles.feeInfoDefaultText 
    };
  };

  const feeStyle = item.feeInfo ? getFeeInfoStyle(item.feeInfo) : null;

  const isParkingLot = !!item.feeInfo;
  const iconName = isParkingLot ? "car-outline" : "location-sharp";
  const iconColor = isParkingLot ? "#9932CC" : "#007bff";

  return (
    <Pressable onPress={() => onPress(item)} style={commonStyles.container}>
      <View style={commonStyles.iconContainer}>
        <Ionicons name={iconName} size={24} color={iconColor} />
      </View>
      <View style={commonStyles.infoContainer}>
        <Text style={commonStyles.placeName}>{item.placeName}</Text>
        <Text style={commonStyles.address}>{item.roadAddress || item.lotAddress}</Text>
        {item.feeInfo && feeStyle && (
          <View style={[webStyles.feeInfoContainer, feeStyle.container]}>
            <Text style={[webStyles.feeInfoText, feeStyle.text]}>{item.feeInfo}</Text>
          </View>
        )}
      </View>
      <View style={commonStyles.distanceContainer}>
        <Text style={commonStyles.distanceText}>{formatDistance(item.distance)}</Text>
      </View>
    </Pressable>
  );
};


export default SearchResultItem;
