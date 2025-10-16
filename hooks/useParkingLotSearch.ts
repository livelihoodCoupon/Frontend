import { useReducer, useCallback } from 'react';
import { searchParkingLots, ParkingLot, ParkingLotsResponse } from '../services/parkingApi';

// 1. 상태(State) 정의
interface ParkingLotState {
  parkingLots: ParkingLot[];
  loading: boolean;
  error: string | null;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalElements: number;
    isLast: boolean;
  } | null;
}

// 2. 액션(Action) 정의
type ParkingLotAction =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: ParkingLotsResponse }
  | { type: 'FETCH_FAILURE'; payload: string };

// 3. 리듀서(Reducer) 정의
const initialState: ParkingLotState = {
  parkingLots: [],
  loading: false,
  error: null,
  pagination: null,
};

const parkingLotReducer = (state: ParkingLotState, action: ParkingLotAction): ParkingLotState => {
  switch (action.type) {
    case 'FETCH_START':
      return {
        ...state,
        loading: true,
        error: null,
        parkingLots: [],
        pagination: null,
      };
    case 'FETCH_SUCCESS':
      const { content, ...pageInfo } = action.payload;
      return {
        ...state,
        loading: false,
        parkingLots: content,
        pagination: {
          ...pageInfo,
          isLast: pageInfo.currentPage >= pageInfo.totalPages,
        },
      };
    case 'FETCH_FAILURE':
      return {
        ...state,
        loading: false,
        error: action.payload,
      };
    default:
      return state;
  }
};

// 4. 커스텀 훅(Custom Hook) 정의
export const useParkingLotSearch = () => {
  const [state, dispatch] = useReducer(parkingLotReducer, initialState);

  const fetchParkingLots = useCallback(async (lat: number, lng: number, userLat?: number, userLng?: number) => {
    dispatch({ type: 'FETCH_START' });
    try {
      const response = await searchParkingLots({
        lat,
        lng,
        userLat,
        userLng,
        page: 1,
      });
      dispatch({ type: 'FETCH_SUCCESS', payload: response.data });
    } catch (err: any) {
      dispatch({ type: 'FETCH_FAILURE', payload: err.message || '주변 주차장 검색 중 오류가 발생했습니다.' });
    }
  }, []);

  return {
    ...state,
    fetchParkingLots,
  };
};