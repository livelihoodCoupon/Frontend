import { useState, useCallback } from 'react';
import { parkingApi, ParkingLotSearchParams } from '../services/parkingApi';
import { ParkingLot, ParkingLotDetail } from '../types/parking';

export const useParking = (onSearchComplete?: (parkingLots: ParkingLot[]) => void) => {
  const [parkingLots, setParkingLots] = useState<ParkingLot[]>([]);
  const [selectedParkingLot, setSelectedParkingLot] = useState<ParkingLotDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalElements: 0,
  });

  // 주변 주차장 검색
  const searchNearbyParkingLots = useCallback(async (params: ParkingLotSearchParams) => {
    try {
      console.log('🔍 useParking: 주차장 검색 시작', params);
      setIsLoading(true);
      setError(null);
      
      const response = await parkingApi.searchNearbyParkingLots(params);
      console.log('🔍 useParking: API 응답', response);
      
      if (response.success) {
        const newParkingLots = response.data.content;
        console.log('🔍 useParking: 주차장 결과', newParkingLots.length, '개');
        setParkingLots(newParkingLots);
        setPagination({
          currentPage: response.data.currentPage,
          totalPages: response.data.totalPages,
          totalElements: response.data.totalElements,
        });
        
        // 검색 완료 후 콜백 실행
        if (onSearchComplete) {
          console.log('🔍 useParking: 콜백 실행');
          onSearchComplete(newParkingLots);
        }
      } else {
        console.log('❌ useParking: API 응답 실패');
        setError('주차장 검색에 실패했습니다.');
        // 에러 시에도 빈 배열로 콜백 실행
        if (onSearchComplete) {
          onSearchComplete([]);
        }
      }
    } catch (err) {
      console.error('🚨 useParking: 주차장 검색 오류:', err);
      setError('주차장 검색 중 오류가 발생했습니다.');
      // 에러 시에도 빈 배열로 콜백 실행
      if (onSearchComplete) {
        onSearchComplete([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [onSearchComplete]);

  // 주차장 상세 정보 조회
  const getParkingLotDetail = useCallback(async (id: number) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await parkingApi.getParkingLotDetail(id);
      
      if (response.success) {
        setSelectedParkingLot(response.data);
      } else {
        setError('주차장 상세 정보 조회에 실패했습니다.');
      }
    } catch (err) {
      console.error('주차장 상세 정보 조회 오류:', err);
      setError('주차장 상세 정보 조회 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 주차장 목록 초기화
  const clearParkingLots = useCallback(() => {
    setParkingLots([]);
    setSelectedParkingLot(null);
    setError(null);
    setPagination({
      currentPage: 1,
      totalPages: 1,
      totalElements: 0,
    });
  }, []);

  return {
    parkingLots,
    selectedParkingLot,
    isLoading,
    error,
    pagination,
    searchNearbyParkingLots,
    getParkingLotDetail,
    clearParkingLots,
    setParkingLots, // 외부에서 주차장 데이터를 설정할 수 있는 함수 추가
  };
};
