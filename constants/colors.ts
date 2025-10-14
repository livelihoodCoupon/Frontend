/**
 * 피그마 디자인 기반 색상 팔레트
 * Base Color: 블루 계열
 * Sub Color: 그레이 계열
 */

export const COLORS = {
  // Base Colors (블루 계열)
  primary: '#3690FF',      // 메인 블루
  primaryLight: '#F8FAFE', // 연한 블루
  
  // Sub Colors (그레이 계열)
  white: '#FFF',
  gray50: '#F9F9F9',
  gray100: '#F0F0F0',
  gray400: '#B9B9B9',
  
  // 추가 색상
  black: '#000000',
  textPrimary: '#333333',
  textSecondary: '#666666',
  textLight: '#999999',
  
  // 상태 색상
  success: '#28a745',
  warning: '#ffc107',
  error: '#dc3545',
  info: '#17a2b8',
  
  // 배경 색상
  background: '#FFFFFF',
  backgroundLight: '#F8F9FA',
  
  // 테두리 색상
  border: '#E9ECEF',
  borderLight: '#F1F3F4',
  
  // 그림자 색상
  shadow: 'rgba(0, 0, 0, 0.1)',
  shadowLight: 'rgba(0, 0, 0, 0.05)',
} as const;

export type ColorKey = keyof typeof COLORS;
