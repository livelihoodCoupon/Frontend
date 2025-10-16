export interface ParkingLot {
  id: number;
  parkingLotName: string;
  roadAddress: string;
  lotAddress: string;
  feeInfo: string;
  lat: number;
  lng: number;
  distance: number;
}

export interface ParkingLotDetail {
  id: number;
  parkingLotName: string;
  roadAddress: string;
  lotAddress: string;
  parkingCapacity: string;
  operDay: string;
  weekOpenTime: string;
  weekCloseTime: string;
  satOpenTime: string;
  satCloseTime: string;
  holidayOpenTime: string;
  holidayCloseTime: string;
  parkingChargeInfo: string;
  paymentMethod: string;
  specialComment: string;
  phoneNumber: string;
  lat: number;
  lng: number;
}

export interface ParkingLotSearchResponse {
  success: boolean;
  data: {
    content: ParkingLot[];
    currentPage: number;
    totalPages: number;
    totalElements: number;
  };
  timestamp: string;
}

export interface ParkingLotDetailResponse {
  success: boolean;
  data: ParkingLotDetail;
  timestamp: string;
}
