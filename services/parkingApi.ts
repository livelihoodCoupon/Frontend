// services/parkingApi.ts
import apiClient from './apiClient';

// API 응답 예시를 기반으로 타입 정의
export interface ParkingLot {
  id: number;
  parkingLotNm: string;
  roadAddress: string;
  lotAddress: string;
  parkingChargeInfo: string;
  lat: number;
  lng: number;
  distance: number;
}

export interface ParkingLotsResponse {
  content: ParkingLot[];
  currentPage: number;
  totalPages: number;
  totalElements: number;
}

export interface SearchParkingLotsParams {
  query?: string;
  lat?: number;
  lng?: number;
  page?: number;
  userLat?: number;
  userLng?: number;
}

export const searchParkingLots = async (
  params: SearchParkingLotsParams,
): Promise<ParkingLotsResponse> => {
  const response = await apiClient.get<ParkingLotsResponse>('/api/searches/parkinglots', {
    params,
  });
  return response.data;
};
