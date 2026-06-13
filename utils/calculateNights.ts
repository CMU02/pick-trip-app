/**
 * 여행 시작일과 종료일 사이의 숙박 일수(박)를 계산한다.
 *
 * @param startDate 여행 시작일
 * @param endDate 여행 종료일
 * @returns 숙박 일수 (당일치기는 0)
 */
export const calculateNights = (startDate: Date, endDate: Date): number => {
  const MILLISECONDS_PER_DAY = 1000 * 60 * 60 * 24;
  const diff = endDate.getTime() - startDate.getTime();

  if (diff < 0) {
    throw new Error('종료일은 시작일보다 빠를 수 없습니다.');
  }

  return Math.floor(diff / MILLISECONDS_PER_DAY);
};
