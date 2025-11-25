document.addEventListener('DOMContentLoaded', () => {
  // 날짜를 표시할 모든 .date 요소를 선택합니다.
  const dateElements = document.querySelectorAll('.date');

  function updateClock() {
    const now = new Date();

    const year = now.getFullYear();
    // getMonth()는 0부터 시작하므로 1을 더해줍니다.
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][now.getDay()];
    
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    const ampm = hours >= 12 ? '오후' : '오전';
    hours = hours % 12;
    hours = hours ? hours : 12; // 0시는 12시로 표시
    hours = String(hours).padStart(2, '0');

    // 'YYYY년 MM월 DD일&nbsp;&nbsp;HH:MM:SS' 형식으로 문자열을 만듭니다.
    const dateTimeString = `${year}년 ${month}월 ${day}일 (${dayOfWeek})<br>${ampm} ${hours}:${minutes}:${seconds}`;
    
    // 모든 .date 요소의 내용을 업데이트합니다.
    dateElements.forEach(el => {
      el.innerHTML = dateTimeString;
    });
  }

  // 1초마다 updateClock 함수를 실행하여 시간을 실시간으로 업데이트합니다.
  setInterval(updateClock, 1000);
  // 페이지 로드 시 즉시 시간을 표시하기 위해 한 번 호출합니다.
  updateClock();
});
