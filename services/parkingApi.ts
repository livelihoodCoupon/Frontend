// services/parkingApi.ts
import apiClient from './apiClient';
import { PageResponse } from '../types/api';

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


export interface SearchParkingLotsParams {
  lat: number;
  lng: number;
  query?: string;
  radius?: number;
  page?: number;
  size?: number;
  sort?: 'distance' | 'accuracy';
}

export const searchParkingLots = async (
  params: SearchParkingLotsParams,
): Promise<PageResponse<ParkingLot>> => {
  const response = await apiClient.get<ApiResponse<PageResponse<ParkingLot>>>('/api/searches/parkinglots-es', {
    params,
  });
  return response.data.data;
};
