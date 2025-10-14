import apiClient from './apiClient';
import axios from 'axios';
import { AutocompleteResponse, SearchResult } from '../types/search';
import { ApiResponse, PageResponse } from '../types/api';
import { ApiError } from '../utils/errors';

/**
 * 백엔드 API를 통해 장소를 검색하는 함수
 * 
 * @param query - 검색 키워드
 * @param lat - 중심 위도
 * @param lng - 중심 경도
 * @param radius - 검색 반경 (미터)
 * @param sort - 정렬 기준
 * @param page - 조회할 페이지 번호
 * @returns 검색 결과 페이징 객체
 */
export const searchPlaces = async (
  query: string,
  lat: number,
  lng: number,
  radius: number,
  sort: string,
  page: number = 1,
  userLat: number, // 사용자 실제 위도
  userLng: number, // 사용자 실제 경도
): Promise<PageResponse<SearchResult>> => {
  try {
    console.log('Searching places with params:', { query, lat, lng, radius, sort, page, userLat, userLng });
    
    // Axios가 자동으로 URL 인코딩을 처리하도록 원본 문자열 전달
    console.log('원본 쿼리:', query);
    
    const response = await apiClient.get<ApiResponse<PageResponse<SearchResult>>>('/api/searches', {
      params: {
        query: query, // Axios가 자동으로 URL 인코딩 처리
        lat,
        lng,
        radius,
        sort,
        page,
        userLat: userLat, // 사용자 위치 기반 거리 계산을 위해 추가
        userLng: userLng,
      },
    });
    
    console.log('API Response:', response.status, response.data);

    const payload = response.data;

    if (!payload || !payload.success) {
      throw new ApiError(payload?.error?.message || 'Failed to search places', response.status, payload?.error);
    }

    if (!payload.data) {
      throw new ApiError('Search results data not found', response.status);
    }
    
    return payload.data;

  } catch (error) {
    console.error('Search API error:', error);
    if (axios.isAxiosError(error)) {
      const statusCode = error.response?.status || 500;
      
      // 네트워크 오류인 경우
      if (error.code === 'NETWORK_ERROR' || error.code === 'ECONNREFUSED') {
        throw new ApiError('서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.', 0);
      }
      
      // API URL이 설정되지 않은 경우
      if (error.message.includes('baseURL') || error.message.includes('API_BASE_URL')) {
        throw new ApiError('API 설정이 올바르지 않습니다. 개발자에게 문의해주세요.', 500);
      }
      
      const errorMessage = error.response?.data?.error?.message || 
        (statusCode === 500 ? '서버에서 검색 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' : '검색 중 오류가 발생했습니다.');
      throw new ApiError(errorMessage, statusCode, error.response?.data?.error);
    }
    throw new ApiError('검색 중 알 수 없는 오류가 발생했습니다.', 500);
  }
};

/**
 * 백엔드 API를 통해 자동완성 제안을 가져오는 함수
 * 
 * @param query - 검색 키워드
 * @returns 자동완성 제안 목록
 */
export const getAutocompleteSuggestions = async (
  query: string,
): Promise<AutocompleteResponse[]> => {
  try {
    console.log('Getting autocomplete suggestions for:', query);
    
    const response = await apiClient.get<ApiResponse<AutocompleteResponse[]>>('/api/suggestions', {
      params: {
        word: query, // Axios가 자동으로 URL 인코딩 처리
      },
    });

    const payload = response.data;

    if (!payload || !payload.success) {
      throw new ApiError(payload?.error?.message || 'Failed to fetch suggestions', response.status, payload?.error);
    }

    if (!payload.data) {
      return [];
    }
    
    return payload.data;

  } catch (error) {
    if (axios.isAxiosError(error)) {
      // 404 에러인 경우 빈 배열 반환 (자동완성 서비스가 없을 때)
      if (error.response?.status === 404) {
        console.warn('Autocomplete API not available (404)');
        return [];
      }
      // 400 에러인 경우도 빈 배열 반환 (자동완성 데이터가 없을 때)
      if (error.response?.status === 400) {
        console.warn('Autocomplete data not available (400)');
        return [];
      }
      throw new ApiError(error.response?.data?.error?.message || 'An unknown error occurred', error.response?.status || 500, error.response?.data?.error);
    }
    throw new ApiError('An unknown error occurred during autocomplete search', 500);
  }
};
