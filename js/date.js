/**
 * 날짜 문자열(YYYY-MM-DD)을 'yy/mm/dd' 형식으로 변환합니다.
 * @param {string} dateString - 변환할 날짜 문자열
 * @returns {string} 포맷팅된 날짜 문자열
 */
export const formatDate = (dateString) => {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-');
  const shortYear = year.slice(-2);
  return `${shortYear}/${month}/${day}`;
};